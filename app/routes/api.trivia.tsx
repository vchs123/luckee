import type { ActionFunctionArgs } from "react-router";
import { requireAuth } from "~/lib/auth.server";
import { getSupabase } from "~/lib/supabase.server";

export async function action({ request, context }: ActionFunctionArgs) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const env = (context as any)?.cloudflare?.env as Env;
  const user = await requireAuth(request, env);
  const supabase = getSupabase(env);
  const today = new Date().toISOString().slice(0, 10);

  let score: number;
  let pts: number;
  try {
    const body = await request.json() as { score: string; pts: string };
    score = parseInt(body.score);
    pts = parseInt(body.pts);
    if (isNaN(score) || isNaN(pts)) throw new Error();
  } catch {
    const form = await request.formData().catch(() => null);
    score = parseInt((form?.get("score") as string) ?? "0");
    pts = parseInt((form?.get("pts") as string) ?? "0");
  }

  // Check if already done today
  const { data: existing } = await supabase
    .from("daily_trivia_attempts")
    .select("id")
    .eq("user_id", user.id)
    .eq("trivia_date", today)
    .maybeSingle();
  if (existing) return Response.json({ ok: true, pts: 0 });

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("total_points")
    .eq("id", user.id)
    .single();
  const currentPts = profile?.total_points ?? 0;

  await supabase.from("daily_trivia_attempts").insert({
    user_id: user.id, trivia_date: today, score, completed: true,
  });

  if (pts > 0) {
    const newPts = currentPts + pts;
    await Promise.all([
      supabase.from("points_ledger").insert({
        user_id: user.id, action: "trivia",
        points: pts, description: `Trivia — ${score}/5 correct`,
      }),
      supabase.from("user_profiles").update({
        total_points: newPts, monthly_entries: Math.floor(newPts / 100),
      }).eq("id", user.id),
    ]);
  }
  return Response.json({ ok: true, pts });
}

export async function loader() {
  return new Response("Method not allowed", { status: 405 });
}
