import type { ActionFunctionArgs } from "react-router";
import { requireAuth } from "~/lib/auth.server";
import { getSupabase } from "~/lib/supabase.server";

/**
 * Like or unlike a corkboard pin. Members only, one like each, so a count
 * can't be pumped from private windows. Approved pins only, and not your own.
 * Likes earn nobody points.
 */
export async function action({ request, context }: ActionFunctionArgs) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const env = (context as any)?.cloudflare?.env as Env;
  const user = requireAuth(context);
  const form = await request.formData();
  const pinId = String(form.get("pinId") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(pinId)) return Response.json({ ok: false, error: "Unknown pin" }, { status: 400 });

  const supabase = getSupabase(env);
  const { data: pin } = await supabase.from("community_pins").select("user_id, status").eq("id", pinId).maybeSingle();
  if (!pin || pin.status !== "approved") return Response.json({ ok: false, error: "Unknown pin" }, { status: 404 });
  if (pin.user_id === user.id) return Response.json({ ok: false, error: "You can't like your own pin" }, { status: 400 });

  const { data: existing } = await supabase
    .from("community_pin_likes")
    .select("pin_id")
    .eq("pin_id", pinId)
    .eq("user_id", user.id)
    .maybeSingle();

  // A like inserted twice at once hits the primary key; either way it's liked.
  const { error } = existing
    ? await supabase.from("community_pin_likes").delete().eq("pin_id", pinId).eq("user_id", user.id)
    : await supabase.from("community_pin_likes").insert({ pin_id: pinId, user_id: user.id });
  if (error && error.code !== "23505") {
    return Response.json({ ok: false, error: "Couldn't save that. Please try again." }, { status: 500 });
  }

  const { count } = await supabase
    .from("community_pin_likes")
    .select("pin_id", { count: "exact", head: true })
    .eq("pin_id", pinId);
  return Response.json({ ok: true, liked: !existing, count: count ?? 0 });
}

export async function loader() {
  return new Response("Method not allowed", { status: 405 });
}
