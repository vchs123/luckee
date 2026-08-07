import type { ActionFunctionArgs } from "react-router";
import { requireAuth } from "~/lib/auth.server";
import { getSupabase } from "~/lib/supabase.server";
import { awardPoints } from "~/lib/points.server";

const ALLOWED_ACTIONS = ["dinner_waitlist", "referral_account", "referral_deal", "deal_click"] as const;
const POINTS_MAP: Record<string, number> = {
  dinner_waitlist: 10,
  referral_account: 100,
  referral_deal: 150,
  deal_click: 10,
};

export async function action({ request, context }: ActionFunctionArgs) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const env = (context as any)?.cloudflare?.env as Env;
  const user = await requireAuth(request, env);
  const supabase = getSupabase(env);

  let actionName: string;
  let description: string | undefined;
  let targetUserId: string | undefined;
  try {
    const body = await request.json() as { action: string; description?: string; userId?: string };
    actionName = body.action;
    description = body.description;
    targetUserId = body.userId;
  } catch {
    return Response.json({ ok: false, error: "Invalid body" }, { status: 400 });
  }

  if (!ALLOWED_ACTIONS.includes(actionName as typeof ALLOWED_ACTIONS[number])) {
    return Response.json({ ok: false, error: "Unknown action" }, { status: 400 });
  }

  const pts = POINTS_MAP[actionName];
  const recipientId = targetUserId ?? user.id;

  // Routes through awardPoints so an active double-points booster is applied.
  await awardPoints(supabase, recipientId, actionName, pts, description ?? actionName);

  return Response.json({ ok: true, pts });
}

export async function loader() {
  return new Response("Method not allowed", { status: 405 });
}
