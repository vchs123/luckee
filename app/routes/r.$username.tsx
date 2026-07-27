import { redirect } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { getSupabase } from "~/lib/supabase.server";

export async function loader({ request, context, params }: LoaderFunctionArgs) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const env = (context as any)?.cloudflare?.env as Env;
  const { username } = params;

  if (username) {
    try {
      const supabase = getSupabase(env);
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("id")
        .eq("username", username.toLowerCase())
        .maybeSingle();

      if (profile) {
        const isSecure = new URL(request.url).protocol === "https:";
        const secure = isSecure ? "; Secure" : "";
        const headers = new Headers();
        headers.append(
          "Set-Cookie",
          `luckee_ref=${profile.id}; Path=/; SameSite=Lax; Max-Age=${30 * 24 * 3600}${secure}`,
        );
        headers.append("Location", "/login");
        return new Response(null, { status: 302, headers });
      }
    } catch { /* fall through */ }
  }

  return redirect("/login");
}

export default function ReferralLanding() {
  return null;
}
