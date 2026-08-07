import type { ActionFunctionArgs } from "react-router";
import { requireAuth } from "~/lib/auth.server";
import { getSupabase } from "~/lib/supabase.server";
import { awardPoints } from "~/lib/points.server";
import { PULL_COST, PRIZE_WEIGHTS, type PrizeType } from "~/lib/gachapon";

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

export async function action({ request, context }: ActionFunctionArgs) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const env = (context as any)?.cloudflare?.env as Env;
  const user = await requireAuth(request, env);
  const supabase = getSupabase(env);

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("total_points, free_pulls, double_points_until")
    .eq("id", user.id)
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
    await supabase.from("user_profiles").update({ free_pulls: freePulls - 1 }).eq("id", user.id);
  } else {
    workingBalance = balance - PULL_COST;
    await Promise.all([
      supabase.from("user_profiles").update({
        total_points: workingBalance,
        monthly_entries: Math.floor(workingBalance / 100),
      }).eq("id", user.id),
      supabase.from("points_ledger").insert({
        user_id: user.id, action: "gachapon_pull",
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
      supabase, user.id, "gachapon_points", pointsWon,
      `Gachapon — won ${pointsWon} pts`, { doubleEligible: false },
    );
  } else if (prize === "double_points") {
    const until = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    await supabase.from("user_profiles").update({ double_points_until: until }).eq("id", user.id);
  } else if (prize === "bonus_ticket") {
    const current = usingFreePull ? freePulls - 1 : freePulls;
    await supabase.from("user_profiles").update({ free_pulls: current + 1 }).eq("id", user.id);
  }

  await supabase.from("gachapon_pulls").insert({
    user_id: user.id,
    prize_type: prize,
    points_won: pointsWon,
  });

  return Response.json({ ok: true, prize, pointsWon, balance: workingBalance });
}

export async function loader() {
  return new Response("Method not allowed", { status: 405 });
}
