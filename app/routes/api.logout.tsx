import { redirect } from "react-router";
import type { ActionFunctionArgs } from "react-router";
import { clearAuthCookies, getCookie } from "~/lib/auth.server";
import { getSupabaseAnon } from "~/lib/supabase.server";

export async function action({ request, context }: ActionFunctionArgs) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const env = (context as any)?.cloudflare?.env as Env;

  try {
    const at = getCookie(request, "luckee_at");
    if (at) {
      const supabase = getSupabaseAnon(env);
      await supabase.auth.signOut();
    }
  } catch { /* non-fatal */ }

  const headers = new Headers();
  clearAuthCookies().forEach((c) => headers.append("Set-Cookie", c));
  return redirect("/", { headers });
}

export async function loader() {
  return redirect("/");
}
