import type { ActionFunctionArgs } from "react-router";
import { requireAuth } from "~/lib/auth.server";
import { getSupabase } from "~/lib/supabase.server";
import { awardPoints } from "~/lib/points.server";
import { melbToday } from "~/lib/melbDate";
import { DEALS } from "~/data/deals";

/*
 * The one points award a browser may ask for: clicking through to a deal.
 *
 * This endpoint used to accept any of four actions (including 100- and
 * 150-point referral awards), any `userId`, and any description, with no limit
 * on repeats, so a signed-in user could award themselves or anyone else
 * unlimited points, which buy gachapon pulls for real prizes. Referral awards
 * are made on the server where the referral actually happens
 * (profile.setup.tsx, admin.proof.$id.tsx); nothing in the browser called them.
 */
const DEAL_CLICK_POINTS = 10;

export async function action({ request, context }: ActionFunctionArgs) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const env = (context as any)?.cloudflare?.env as Env;
  const user = requireAuth(context);
  const supabase = getSupabase(env);

  let body: { action?: unknown; deal?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ ok: false, error: "Invalid body" }, { status: 400 });
  }
  if (body.action !== "deal_click") {
    return Response.json({ ok: false, error: "Unknown action" }, { status: 400 });
  }
  const deal = DEALS.find((d) => d.cls === body.deal);
  if (!deal) {
    return Response.json({ ok: false, error: "Unknown deal" }, { status: 400 });
  }

  // Once per deal per Melbourne day. Built on the server so the request can't
  // choose what the ledger says.
  const description = `Clicked ${deal.n} deal`;
  const today = melbToday();
  const { data: recent } = await supabase
    .from("points_ledger")
    .select("created_at")
    .eq("user_id", user.id)
    .eq("action", "deal_click")
    .eq("description", description)
    .gte("created_at", new Date(Date.now() - 48 * 3600e3).toISOString());
  const alreadyToday = (recent ?? []).some(
    (r) => new Date(r.created_at as string).toLocaleDateString("en-CA", { timeZone: "Australia/Melbourne" }) === today,
  );
  if (alreadyToday) return Response.json({ ok: true, pts: 0 });

  await awardPoints(supabase, user.id, "deal_click", DEAL_CLICK_POINTS, description);
  return Response.json({ ok: true, pts: DEAL_CLICK_POINTS });
}

export async function loader() {
  return new Response("Method not allowed", { status: 405 });
}
