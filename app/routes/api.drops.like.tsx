import type { ActionFunctionArgs } from "react-router";
import { getSupabase } from "~/lib/supabase.server";
import { userContext } from "~/lib/auth.context";
import { likerKey, VISITOR_COOKIE } from "~/lib/drops.server";

/**
 * Like or unlike a deal drop. Open to everyone: members are counted once per
 * account, other visitors once per browser via a random id in a cookie (set
 * here on their first like). That can be repeated from a private window, but
 * likes earn nothing, so the worst case is a fuzzier count.
 */
export async function action({ request, context }: ActionFunctionArgs) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const env = (context as any)?.cloudflare?.env as Env;
  const user = context.get(userContext);
  const form = await request.formData();
  const dropId = String(form.get("dropId") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(dropId)) return Response.json({ ok: false }, { status: 400 });

  const headers = new Headers();
  let liker = likerKey(request, user);
  if (!liker) {
    const vid = crypto.randomUUID();
    const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
    headers.append("Set-Cookie", `${VISITOR_COOKIE}=${vid}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${365 * 24 * 3600}${secure}`);
    liker = `v:${vid}`;
  }

  const supabase = getSupabase(env);
  const { data: drop } = await supabase.from("deal_drops").select("id").eq("id", dropId).eq("published", true).maybeSingle();
  if (!drop) return Response.json({ ok: false }, { status: 404, headers });

  const { data: existing } = await supabase
    .from("deal_drop_likes")
    .select("drop_id")
    .eq("drop_id", dropId)
    .eq("liker", liker)
    .maybeSingle();

  const { error } = existing
    ? await supabase.from("deal_drop_likes").delete().eq("drop_id", dropId).eq("liker", liker)
    : await supabase.from("deal_drop_likes").insert({ drop_id: dropId, liker, user_id: user?.id ?? null });
  // 23505: the same like landed twice at once; it's liked either way.
  if (error && error.code !== "23505") return Response.json({ ok: false }, { status: 500, headers });

  const { count } = await supabase
    .from("deal_drop_likes")
    .select("drop_id", { count: "exact", head: true })
    .eq("drop_id", dropId);
  return Response.json({ ok: true, liked: !existing, count: count ?? 0 }, { headers });
}

export async function loader() {
  return new Response("Method not allowed", { status: 405 });
}
