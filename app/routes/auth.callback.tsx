import { redirect } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { getSupabaseAnon, getSupabase } from "~/lib/supabase.server";
import { authCookies, getCookie } from "~/lib/auth.server";

export async function loader({ request, context }: LoaderFunctionArgs) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const env = (context as any)?.cloudflare?.env as Env;
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  if (!code) return redirect("/login?error=missing_code");

  try {
    const supabase = getSupabaseAnon(env);
    const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error || !session) return redirect("/login?error=auth_failed");

    const adminSupabase = getSupabase(env);
    const { data: profile } = await adminSupabase
      .from("user_profiles")
      .select("id")
      .eq("id", session.user.id)
      .maybeSingle();

    const headers = new Headers();
    authCookies(session.access_token, session.refresh_token!, session.expires_in ?? 3600, request)
      .forEach((c) => headers.append("Set-Cookie", c));

    // Wire referral: if ref cookie present and this is a new user, store referred_by
    if (!profile) {
      const refUserId = getCookie(request, "luckee_ref");
      if (refUserId && refUserId !== session.user.id) {
        // Will be applied in profile setup when the profile row is created
        // Store temporarily in cookie so profile.setup.tsx can read it
        const isSecure = new URL(request.url).protocol === "https:";
        const secure = isSecure ? "; Secure" : "";
        headers.append("Set-Cookie", `luckee_ref_pending=${refUserId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=3600${secure}`);
        // Clear the public ref cookie
        headers.append("Set-Cookie", "luckee_ref=; Path=/; SameSite=Lax; Max-Age=0");
      }
    }

    return redirect(profile ? "/rewards" : "/profile/setup", { headers });
  } catch {
    return redirect("/login?error=auth_failed");
  }
}

export default function AuthCallback() {
  return (
    <div className="wrap" style={{ paddingTop: 80, textAlign: "center" }}>
      <p style={{ color: "var(--t2)" }}>Signing you in…</p>
    </div>
  );
}
