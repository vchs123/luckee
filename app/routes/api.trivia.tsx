import type { ActionFunctionArgs } from "react-router";
import { requireAuth } from "~/lib/auth.server";
import { getSupabase } from "~/lib/supabase.server";
import { awardPoints } from "~/lib/points.server";
import { melbToday } from "~/lib/melbDate";

/** Points for a day's trivia, by correct answers out of 5. Decided here, never by the browser. */
const POINTS_FOR_SCORE: Record<number, number> = { 3: 5, 4: 10, 5: 25 };

export async function action({ request, context }: ActionFunctionArgs) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const env = (context as any)?.cloudflare?.env as Env;
  const user = requireAuth(context);
  const supabase = getSupabase(env);
  // Melbourne day, matching the Rewards page. (This used the UTC date, so the
  // "day" rolled over mid-morning in Melbourne and allowed a second attempt.)
  const today = melbToday();

  // Read the body once, then parse it as JSON or form data. Calling json() first
  // and formData() on failure doesn't work: json() has already consumed the
  // body, so the form fallback always came back empty and every attempt was
  // recorded as 0/5 with no points.
  const body = await request.text();
  let raw: unknown;
  try {
    raw = (JSON.parse(body) as { score?: unknown }).score;
  } catch {
    raw = new URLSearchParams(body).get("score");
  }
  // Only the score is read from the request, clamped to 0–5. The points used to
  // come from the request too, so one call could award any amount.
  const parsed = Math.trunc(Number(raw));
  const score = Number.isFinite(parsed) ? Math.min(5, Math.max(0, parsed)) : 0;
  const pts = POINTS_FOR_SCORE[score] ?? 0;

  // Record the attempt first and award only if that insert succeeded, so two
  // requests at once can't both be paid. The one-per-day guarantee comes from
  // the unique index in sql/daily_unique.sql; the lookup is a fast path.
  const { data: existing } = await supabase
    .from("daily_trivia_attempts")
    .select("id")
    .eq("user_id", user.id)
    .eq("trivia_date", today)
    .maybeSingle();
  if (existing) return Response.json({ ok: true, pts: 0, alreadyDone: true });

  const { error } = await supabase.from("daily_trivia_attempts").insert({
    user_id: user.id, trivia_date: today, score, completed: true,
  });
  if (error) return Response.json({ ok: true, pts: 0, alreadyDone: true });

  if (pts > 0) {
    await awardPoints(supabase, user.id, "trivia", pts, `Trivia — ${score}/5 correct`);
  }
  return Response.json({ ok: true, pts });
}

export async function loader() {
  return new Response("Method not allowed", { status: 405 });
}
