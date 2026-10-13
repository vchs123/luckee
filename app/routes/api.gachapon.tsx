import type { ActionFunctionArgs } from "react-router";
import { requireAuth } from "~/lib/auth.server";
import { getSupabase } from "~/lib/supabase.server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { awardPoints, isMissingFunction } from "~/lib/points.server";
import { melbToday } from "~/lib/melbDate";
import { PULL_COST, PRIZE_WEIGHTS, type PrizeType } from "~/lib/gachapon";

const DAILY_PULL_LIMIT = 8;

function rollPrize(): PrizeType {
  const rand = Math.random() * 100;
  let cumulative = 0;
  for (const p of PRIZE_WEIGHTS) {
    cumulative += p.weight;
    if (rand < cumulative) return p.type;
  }
  return PRIZE_WEIGHTS[0].type;
}

// Points prize: 5–300, weighted toward the lower end (nice surprise, rarely huge).
function rollPointsPrize(): number {
  const r = Math.random();
  const raw = 5 + Math.pow(r, 2.2) * 295; // bias low
  return Math.round(raw / 5) * 5; // round to nearest 5
}

type PullResult =
  | { ok: true; prize: PrizeType; points_won: number | null; paid: "free" | "points"; balance: number }
  | { ok: false; error: "limit" | "insufficient" | "no_profile"; balance?: number; cost?: number };

export async function action({ context }: ActionFunctionArgs) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const env = (context as any)?.cloudflare?.env as Env;
  const user = requireAuth(context);
  const supabase = getSupabase(env);

  // The odds live here (PRIZE_WEIGHTS); everything that touches the balance —
  // daily limit, charge, prize effects — happens in one locked database step,
  // so two pulls at once can't both pass a single balance check.
  const { data, error } = await supabase.rpc("gachapon_pull", {
    p_user: user.id,
    p_cost: PULL_COST,
    p_daily_limit: DAILY_PULL_LIMIT,
    p_prize: rollPrize(),
    p_points: rollPointsPrize(),
    p_fallback_points: rollPointsPrize(),
  });

  if (error) {
    if (isMissingFunction(error)) return legacyPull(supabase, user.id);
    console.error("[gachapon] pull failed:", error.message);
    return Response.json({ ok: false, error: "The machine jammed. Please try again." }, { status: 500 });
  }

  const r = data as PullResult;
  if (!r.ok) {
    if (r.error === "limit") {
      return Response.json(
        { ok: false, error: `You've used all ${DAILY_PULL_LIMIT} pulls for today. Come back tomorrow!`, limitReached: true },
        { status: 429 },
      );
    }
    if (r.error === "insufficient") {
      return Response.json(
        { ok: false, error: `You need ${(r.cost ?? PULL_COST) - (r.balance ?? 0)} more points to pull.` },
        { status: 400 },
      );
    }
    return Response.json({ ok: false, error: "We couldn't find your profile." }, { status: 400 });
  }

  return Response.json({ ok: true, prize: r.prize, pointsWon: r.points_won, balance: r.balance });
}

/**
 * The previous pull, used only until sql/atomic_points.sql has been run.
 * Reads the balance and writes it back in separate steps, so it is not safe
 * against two pulls at once.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function legacyPull(supabase: SupabaseClient<any, any, any>, userId: string): Promise<Response> {
  // Daily cap — count today's pulls in Melbourne time (DST-safe).
  const today = melbToday();
  const { data: recentPulls } = await supabase
    .from("gachapon_pulls")
    .select("created_at")
    .eq("user_id", userId)
    .gte("created_at", new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString());
  const pullsToday = (recentPulls ?? []).filter(
    (p) => new Date(p.created_at as string).toLocaleDateString("en-CA", { timeZone: "Australia/Melbourne" }) === today,
  ).length;
  if (pullsToday >= DAILY_PULL_LIMIT) {
    return Response.json(
      { ok: false, error: `You've used all ${DAILY_PULL_LIMIT} pulls for today. Come back tomorrow!`, limitReached: true },
      { status: 429 },
    );
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("total_points, free_pulls, double_points_until")
    .eq("id", userId)
    .single();

  const balance = profile?.total_points ?? 0;
  const freePulls = profile?.free_pulls ?? 0;
  const usingFreePull = freePulls > 0;

  if (!usingFreePull && balance < PULL_COST) {
    return Response.json(
      { ok: false, error: `You need ${PULL_COST - balance} more points to pull.` },
      { status: 400 },
    );
  }

  // Charge the pull.
  let workingBalance = balance;
  if (usingFreePull) {
    await supabase.from("user_profiles").update({ free_pulls: freePulls - 1 }).eq("id", userId);
  } else {
    workingBalance = balance - PULL_COST;
    await Promise.all([
      supabase.from("user_profiles").update({
        total_points: workingBalance,
        monthly_entries: Math.floor(workingBalance / 100),
      }).eq("id", userId),
      supabase.from("points_ledger").insert({
        user_id: userId, action: "gachapon_pull",
        points: -PULL_COST, description: "Gachapon pull",
      }),
    ]);
  }

  // Roll the prize.
  let prize = rollPrize();
  let pointsWon: number | null = null;

  // Only one double-points booster at a time (also caps it to ~once/day since it
  // lasts 24h). If one is already active, downgrade the win to a bonus-points prize.
  const boosterActive = profile?.double_points_until
    && new Date(profile.double_points_until as string).getTime() > Date.now();
  if (prize === "double_points" && boosterActive) {
    prize = "points";
  }

  if (prize === "points") {
    pointsWon = rollPointsPrize();
    // Raw award — gachapon winnings are not doubled by the booster.
    workingBalance = await awardPoints(
      supabase, userId, "gachapon_points", pointsWon,
      `Gachapon — won ${pointsWon} pts`, { doubleEligible: false },
    );
  } else if (prize === "double_points") {
    const until = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    await supabase.from("user_profiles").update({ double_points_until: until }).eq("id", userId);
  } else if (prize === "bonus_ticket") {
    const current = usingFreePull ? freePulls - 1 : freePulls;
    await supabase.from("user_profiles").update({ free_pulls: current + 1 }).eq("id", userId);
  }

  await supabase.from("gachapon_pulls").insert({
    user_id: userId,
    prize_type: prize,
    points_won: pointsWon,
  });

  return Response.json({ ok: true, prize, pointsWon, balance: workingBalance });
}

export async function loader() {
  return new Response("Method not allowed", { status: 405 });
}
