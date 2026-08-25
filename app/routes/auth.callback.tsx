import { redirect } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { getSupabaseAnonWithStorage, getSupabase } from "~/lib/supabase.server";
import { authCookies, getCookie, CookieStorage } from "~/lib/auth.server";
import { isAdminEmail } from "~/lib/admin";

export async function loader({ request, context }: LoaderFunctionArgs) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const env = (context as any)?.cloudflare?.env as Env;
  const url = new URL(request.url);
  const token_hash = url.searchParams.get("token_hash");
  const type = (url.searchParams.get("type") ?? "email") as "email" | "magiclink";
  const code = url.searchParams.get("code");

  if (!token_hash && !code) return redirect("/login?error=missing_code");

  try {
    // Restore the PKCE code verifier from cookie so exchangeCodeForSession works in stateless Workers
    const storage = CookieStorage.from(getCookie(request, "luckee_pkce"));

    let session = null;
    if (token_hash) {
      // Magic links stay on the default (implicit) flow: they carry a token_hash
      // and must work when opened in a different browser from the one that
      // requested them, which a PKCE verifier cookie would prevent.
      const supabase = getSupabaseAnonWithStorage(env, storage);
      const { data, error } = await supabase.auth.verifyOtp({ token_hash, type });
      if (error || !data.session) return redirect("/login?error=auth_failed");
      session = data.session;
    } else {
      // OAuth comes back with ?code=. Declaring pkce here makes a missing verifier
      // throw immediately rather than posting an empty one to Supabase.
      const supabase = getSupabaseAnonWithStorage(env, storage, { flowType: "pkce" });
      const { data, error } = await supabase.auth.exchangeCodeForSession(code!);
      if (error || !data.session) return redirect("/login?error=auth_failed");
      session = data.session;
    }

    const adminSupabase = getSupabase(env);
    const { data: profile } = await adminSupabase
      .from("user_profiles")
      .select("id")
      .eq("id", session.user.id)
      .maybeSingle();

    const headers = new Headers();
    authCookies(session.access_token, session.refresh_token!, session.expires_in ?? 3600, request)
      .forEach((c) => headers.append("Set-Cookie", c));

    // Clear the PKCE cookie — it's single-use
    headers.append("Set-Cookie", "luckee_pkce=; Path=/auth/callback; HttpOnly; SameSite=Lax; Max-Age=0");

    // Wire referral: if ref cookie present and this is a new user, store referred_by
    if (!profile) {
      const refUserId = getCookie(request, "luckee_ref");
      if (refUserId && refUserId !== session.user.id) {
        const isSecure = new URL(request.url).protocol === "https:";
        const secure = isSecure ? "; Secure" : "";
        headers.append("Set-Cookie", `luckee_ref_pending=${refUserId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=3600${secure}`);
        headers.append("Set-Cookie", "luckee_ref=; Path=/; SameSite=Lax; Max-Age=0");
      }
    }

    if (isAdminEmail(session.user.email)) return redirect("/admin", { headers });
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
