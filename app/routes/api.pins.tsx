import type { ActionFunctionArgs } from "react-router";
import { requireAuth } from "~/lib/auth.server";
import { getSupabase } from "~/lib/supabase.server";
import { isAdminEmail } from "~/lib/admin.server";
import { PIN_EMOJIS, PIN_LIMITS, PIN_MAX_PENDING, PIN_MAX_PER_DAY } from "~/lib/pins";

/**
 * Submit a community pin. It's stored as pending and only appears on the
 * corkboard once the admin approves it (admin.pins.tsx), which is also when
 * points are paid, so submitting itself earns nothing.
 */
export async function action({ request, context }: ActionFunctionArgs) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const env = (context as any)?.cloudflare?.env as Env;
  const user = requireAuth(context);
  if (isAdminEmail(user.email)) return Response.json({ ok: false, error: "Pin from a member account." }, { status: 403 });

  const form = await request.formData();
  const clean = (name: string) => ((form.get(name) as string | null) ?? "").replace(/\s+/g, " ").trim();
  const title = clean("title");
  const spot = clean("spot");
  const savings = clean("savings") || null;
  const notes = ((form.get("notes") as string | null) ?? "").trim() || null;
  const emoji = PIN_EMOJIS.find((e) => e === form.get("emoji")) ?? PIN_EMOJIS[0];

  if (title.length < 3 || title.length > PIN_LIMITS.title) {
    return Response.json({ ok: false, error: `Give the deal a title (3–${PIN_LIMITS.title} characters).` }, { status: 400 });
  }
  if (spot.length < 2 || spot.length > PIN_LIMITS.spot) {
    return Response.json({ ok: false, error: "Say where it is: a venue or suburb." }, { status: 400 });
  }
  if (savings && savings.length > PIN_LIMITS.savings) {
    return Response.json({ ok: false, error: `Keep the saving short (up to ${PIN_LIMITS.savings} characters).` }, { status: 400 });
  }
  if (notes && notes.length > PIN_LIMITS.notes) {
    return Response.json({ ok: false, error: `Notes can be up to ${PIN_LIMITS.notes} characters.` }, { status: 400 });
  }

  const supabase = getSupabase(env);
  const dayAgo = new Date(Date.now() - 86400000).toISOString();
  const [pendingRes, recentRes] = await Promise.all([
    supabase.from("community_pins").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "pending"),
    supabase.from("community_pins").select("id", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", dayAgo),
  ]);
  if (pendingRes.error) {
    return Response.json({ ok: false, error: "Pinning isn't open yet. Please try again later." }, { status: 503 });
  }
  if ((pendingRes.count ?? 0) >= PIN_MAX_PENDING) {
    return Response.json(
      { ok: false, error: `You have ${PIN_MAX_PENDING} pins waiting for review. Pin more once they're checked.` },
      { status: 429 },
    );
  }
  if ((recentRes.count ?? 0) >= PIN_MAX_PER_DAY) {
    return Response.json({ ok: false, error: "That's plenty of pins for today. Thanks! Try again tomorrow." }, { status: 429 });
  }

  const { error } = await supabase.from("community_pins").insert({ user_id: user.id, title, spot, savings, notes, emoji });
  if (error) return Response.json({ ok: false, error: "Couldn't save your pin. Please try again." }, { status: 500 });
  return Response.json({ ok: true });
}

export async function loader() {
  return new Response("Method not allowed", { status: 405 });
}
