import type { ActionFunctionArgs } from "react-router";
import { requireAuth } from "~/lib/auth.server";
import { getSupabase } from "~/lib/supabase.server";
import { melbToday } from "~/lib/melbDate";

const SEGMENTS = [
  { pts: 10,  pct: 35 },
  { pts: 15,  pct: 25 },
  { pts: 20,  pct: 15 },
  { pts: 25,  pct: 10 },
  { pts: 50,  pct: 8  },
  { pts: 100, pct: 4  },
  { pts: 200, pct: 2  },
  { pts: 500, pct: 1  },
];

function weightedRandom(): { pts: number; segIndex: number } {
  const rand = Math.random() * 100;
  let cumulative = 0;
  for (let i = 0; i < SEGMENTS.length; i++) {
    cumulative += SEGMENTS[i].pct;
    if (rand < cumulative) return { pts: SEGMENTS[i].pts, segIndex: i };
  }
  return { pts: SEGMENTS[0].pts, segIndex: 0 };
}

export async function action({ request, context }: ActionFunctionArgs) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const env = (context as any)?.cloudflare?.env as Env;
  const user = await requireAuth(request, env);
  const supabase = getSupabase(env);
  const today = melbToday();

  // Check if already spun today
  const { data: existing } = await supabase
    .from("daily_spins")
    .select("points_won")
    .eq("user_id", user.id)
    .eq("spin_date", today)
    .maybeSingle();

  if (existing) {
    return Response.json({ pts: existing.points_won, segIndex: SEGMENTS.findIndex((s) => s.pts === existing.points_won) ?? 0, alreadySpun: true });
  }

  const { pts, segIndex } = weightedRandom();

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("total_points, monthly_entries")
    .eq("id", user.id)
    .single();

  const currentPts = profile?.total_points ?? 0;
  const newPts = currentPts + pts;

  await Promise.all([
    supabase.from("daily_spins").insert({ user_id: user.id, spin_date: today, points_won: pts }),
    supabase.from("points_ledger").insert({
      user_id: user.id,
      action: "daily_spin",
      points: pts,
      description: `Daily spin — won ${pts} pts`,
    }),
    supabase.from("user_profiles").update({
      total_points: newPts,
      monthly_entries: Math.floor(newPts / 100),
    }).eq("id", user.id),
  ]);

  return Response.json({ pts, segIndex });
}

export async function loader() {
  return new Response("Method not allowed", { status: 405 });
}
