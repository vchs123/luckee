import { redirect, Form, useNavigation } from "react-router";
import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "react-router";
import { Nav } from "~/components/Nav";
import { Footer } from "~/components/Footer";
import { getSupabaseAnonWithStorage } from "~/lib/supabase.server";
import { getCookie, CookieStorage } from "~/lib/auth.server";
import { finishSignIn } from "~/lib/signIn.server";

export const meta: MetaFunction = () => [
  { title: "Finish signing in — Luckee" },
  { name: "robots", content: "noindex" },
];

/*
 * Email links are confirmed with a click, not on open.
 *
 * Mail security scanners open every link in a message as it arrives. When this
 * route signed people in on GET, a scanner opening the link used up the
 * one-time token before the person could — and the scanner saw a token-bearing
 * sign-in URL on a free *.pages.dev host, which is exactly what credential
 * phishing looks like, so the links were being reported as phishing.
 *
 * Now the GET only parks the token in a short-lived cookie and redirects to the
 * bare /auth/callback, so the token is out of the address bar before any page
 * (and the analytics tag on it) loads. Signing in happens on the POST from the
 * "Continue" button, which scanners don't press.
 */

const OTP_COOKIE = "luckee_otp";
const OTP_TYPES = ["email", "magiclink"] as const;
type OtpType = (typeof OTP_TYPES)[number];

function parseType(value: string | null): OtpType | null {
  return OTP_TYPES.find((t) => t === value) ?? null;
}

/**
 * Path=/auth, not /auth/callback. The Continue button is a React Router form,
 * which posts to /auth/callback.data — and a cookie scoped to /auth/callback
 * isn't sent there (the next character after the path must be "/"), so every
 * confirm click reported the link as expired.
 */
function otpCookie(value: string, maxAge: number, request: Request): string {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `${OTP_COOKIE}=${value}; Path=/auth; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

/** On the redirect that still carries the token, so it can't leak via Referer. */
function noReferrer(): Headers {
  return new Headers({ "Referrer-Policy": "no-referrer" });
}

export async function loader({ request, context }: LoaderFunctionArgs) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const env = (context as any)?.cloudflare?.env as Env;
  const url = new URL(request.url);
  const token_hash = url.searchParams.get("token_hash");
  const code = url.searchParams.get("code");

  // Email link: park the token and bounce to the clean URL. Nothing is verified here.
  if (token_hash) {
    const type = parseType(url.searchParams.get("type") ?? "email");
    if (!type) return redirect("/login?error=auth_failed");
    const headers = noReferrer();
    // Matches the 10-minute expiry the login page promises.
    headers.append("Set-Cookie", otpCookie(encodeURIComponent(`${type}:${token_hash}`), 600, request));
    return redirect("/auth/callback", { headers });
  }

  // OAuth return (?code=) is still exchanged on GET. That URL comes from Google
  // redirecting a browser that started the flow — it never sits in an inbox for
  // a scanner to open — and it's bound to this browser's PKCE verifier cookie.
  if (code) {
    try {
      const storage = CookieStorage.from(getCookie(request, "luckee_pkce"));
      // Declaring pkce makes a missing verifier throw immediately rather than
      // posting an empty one to Supabase.
      const supabase = getSupabaseAnonWithStorage(env, storage, { flowType: "pkce" });
      const { data: exchanged, error } = await supabase.auth.exchangeCodeForSession(code);
      if (error || !exchanged.session) return redirect("/login?error=auth_failed");
      return await finishSignIn(request, env, exchanged.session);
    } catch {
      return redirect("/login?error=auth_failed");
    }
  }

  // The clean URL: show the confirm button if a token is waiting, otherwise the
  // link has expired (or this page was opened directly).
  if (!getCookie(request, OTP_COOKIE)) return redirect("/login?error=link_expired");
  return null;
}

export async function action({ request, context }: ActionFunctionArgs) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const env = (context as any)?.cloudflare?.env as Env;
  const clear = otpCookie("", 0, request);
  const parked = getCookie(request, OTP_COOKIE);
  if (!parked) return redirect("/login?error=link_expired");

  const sep = parked.indexOf(":");
  const type = parseType(parked.slice(0, sep));
  const token_hash = parked.slice(sep + 1);
  if (sep < 0 || !type || !token_hash) {
    return redirect("/login?error=auth_failed", { headers: { "Set-Cookie": clear } });
  }

  try {
    // Magic links stay on the default (implicit) flow: they carry a token_hash
    // and must work when opened in a different browser from the one that
    // requested them, which a PKCE verifier cookie would prevent.
    const storage = CookieStorage.from(getCookie(request, "luckee_pkce"));
    const supabase = getSupabaseAnonWithStorage(env, storage);
    const { data: verified, error } = await supabase.auth.verifyOtp({ token_hash, type });
    if (error || !verified.session) {
      return redirect("/login?error=auth_failed", { headers: { "Set-Cookie": clear } });
    }
    return await finishSignIn(request, env, verified.session, [clear]);
  } catch {
    return redirect("/login?error=auth_failed", { headers: { "Set-Cookie": clear } });
  }
}

export default function AuthCallback() {
  const navigation = useNavigation();
  const submitting = navigation.state === "submitting";

  return (
    <>
      <Nav />
      <div className="wrap">
        <div className="auth-wrap">
          <div className="auth-card">
            <div className="auth-logo">🍀</div>
            <h1 className="auth-h">One more tap</h1>
            <p className="auth-sub">Confirm it's you to finish signing in to Luckee.</p>
            <Form method="post">
              <button className="btn-pink auth-btn" type="submit" disabled={submitting}>
                {submitting ? "Signing you in…" : "Continue to Luckee →"}
              </button>
            </Form>
            <p className="auth-terms">
              This extra step stops email security scanners from using your one-time link before you
              do.
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
