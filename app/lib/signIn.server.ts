import { redirect } from "react-router";
import type { Session } from "@supabase/supabase-js";
import { getSupabase } from "~/lib/supabase.server";
import { authCookies, getCookie } from "~/lib/auth.server";
import { isAdminEmail } from "~/lib/admin.server";

/** How long an invite is remembered: on the device (luckee_ref) and between sign-in and profile setup (luckee_ref_pending). */
export const REF_MAX_AGE = 30 * 24 * 3600;

function secureFlag(request: Request) {
  return new URL(request.url).protocol === "https:" ? "; Secure" : "";
}

/**
 * Set the session cookies, carry a pending referral into profile setup, and send
 * the user on. Shared by every way of signing in: the emailed code (login.tsx),
 * Google, and the older emailed links (auth.callback.tsx).
 */
export async function finishSignIn(request: Request, env: Env, session: Session, extraCookies: string[] = []) {
  const { data: profile } = await getSupabase(env)
    .from("user_profiles")
    .select("id")
    .eq("id", session.user.id)
    .maybeSingle();

  const headers = new Headers();
  authCookies(session.access_token, session.refresh_token!, session.expires_in ?? 3600, request)
    .forEach((c) => headers.append("Set-Cookie", c));
  extraCookies.forEach((c) => headers.append("Set-Cookie", c));

  // Clear the PKCE cookie — it's single-use
  headers.append("Set-Cookie", "luckee_pkce=; Path=/auth/callback; HttpOnly; SameSite=Lax; Max-Age=0");

  // New account arriving through an invite: hand the referrer to profile setup.
  // This used to last an hour, so anyone who left setup and came back later
  // silently lost their referrer. It now lasts as long as the invite itself;
  // profile setup clears it once the profile exists.
  if (!profile) {
    const refUserId = getCookie(request, "luckee_ref");
    if (refUserId && refUserId !== session.user.id) {
      headers.append(
        "Set-Cookie",
        `luckee_ref_pending=${refUserId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${REF_MAX_AGE}${secureFlag(request)}`,
      );
      headers.append("Set-Cookie", "luckee_ref=; Path=/; SameSite=Lax; Max-Age=0");
    }
  }

  if (isAdminEmail(session.user.email)) return redirect("/admin", { headers });
  return redirect(profile ? "/rewards" : "/profile/setup", { headers });
}
