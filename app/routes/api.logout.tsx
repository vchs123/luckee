import { redirect } from "react-router";
import type { ActionFunctionArgs } from "react-router";
import { clearAuthCookies, getAuthCookie } from "~/lib/auth.server";
import { getSupabaseAnon } from "~/lib/supabase.server";

export async function action({ request, context }: ActionFunctionArgs) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const env = (context as any)?.cloudflare?.env as Env;

  // Revoke the refresh token on Supabase's side too, not just drop our cookies —
  // otherwise a copied refresh token keeps working for its full lifetime. The
  // client needs the session loaded first: signOut() on a client without one is
  // a no-op, which is what this used to do. setSession refreshes first if the
  // access token has expired. Scope "local" ends this session only, leaving the
  // user signed in on their other devices.
  try {
    const access_token = getAuthCookie(request, "luckee_at");
    const refresh_token = getAuthCookie(request, "luckee_rt");
    if (access_token && refresh_token) {
      const supabase = getSupabaseAnon(env);
      const { error } = await supabase.auth.setSession({ access_token, refresh_token });
      if (!error) await supabase.auth.signOut({ scope: "local" });
    }
  } catch { /* non-fatal: the cookies below are cleared regardless */ }

  const headers = new Headers();
  clearAuthCookies().forEach((c) => headers.append("Set-Cookie", c));
  return redirect("/", { headers });
}

export async function loader() {
  return redirect("/");
}
