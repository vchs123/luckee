import type { ActionFunctionArgs } from "react-router";
import { requireAuth } from "~/lib/auth.server";
import { getSupabase } from "~/lib/supabase.server";
import { PRIZES, COLLECTIBLE_TYPES, type PrizeType } from "~/lib/gachapon";

export async function action({ request, context }: ActionFunctionArgs) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const env = (context as any)?.cloudflare?.env as Env;
  const user = await requireAuth(request, env);
  const supabase = getSupabase(env);

  let prizeType: PrizeType;
  let dietary: string;
  let notes: string | null;
  try {
    const body = await request.json() as { prizeType: PrizeType; dietary?: string; notes?: string };
    prizeType = body.prizeType;
    dietary = (body.dietary ?? "").trim();
    notes = (body.notes ?? "").trim() || null;
    if (!COLLECTIBLE_TYPES.includes(prizeType)) throw new Error();
  } catch {
    return Response.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }

  if (!dietary) {
    return Response.json({ ok: false, error: "Please note any dietary requirements (or write 'none')." }, { status: 400 });
  }

  const threshold = PRIZES[prizeType].threshold;

  // How many of this collectible has the user pulled vs already spent on redemptions?
  const [pullsRes, redemptionsRes] = await Promise.all([
    supabase.from("gachapon_pulls").select("id", { count: "exact", head: true })
      .eq("user_id", user.id).eq("prize_type", prizeType),
    supabase.from("gachapon_redemptions").select("units")
      .eq("user_id", user.id).eq("prize_type", prizeType)
      .neq("status", "cancelled"),
  ]);

  const pulled = pullsRes.count ?? 0;
  const spent = (redemptionsRes.data ?? []).reduce((sum, r) => sum + (r.units as number), 0);
  const available = pulled - spent;

  if (available < threshold) {
    return Response.json(
      { ok: false, error: `You need ${threshold} to redeem — you have ${available}.` },
      { status: 400 },
    );
  }

  const { error } = await supabase.from("gachapon_redemptions").insert({
    user_id: user.id,
    prize_type: prizeType,
    units: threshold,
    status: "requested",
    dietary_requirements: dietary,
    notes,
  });

  if (error) return Response.json({ ok: false, error: "Failed to submit redemption." }, { status: 500 });

  return Response.json({ ok: true });
}

export async function loader() {
  return new Response("Method not allowed", { status: 405 });
}
