import { useState } from "react";
import { data, redirect, Form, useActionData, useLoaderData, useNavigation, useSearchParams } from "react-router";
import type { MetaFunction, ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { Nav } from "~/components/Nav";
import { TurnstileWidget, turnstileHint, type TurnstileStatus } from "~/components/TurnstileWidget";
import { Footer } from "~/components/Footer";
import { getSupabaseAnonWithStorage } from "~/lib/supabase.server";
import { CookieStorage } from "~/lib/auth.server";
import { finishSignIn } from "~/lib/signIn.server";

export const meta: MetaFunction = () => [
  { title: "Sign in — Luckee" },
  { name: "robots", content: "noindex" },
];

/** Short-lived cookie carrying the PKCE code verifier to /auth/callback. */
function pkceCookie(storage: CookieStorage, request: Request): string {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `luckee_pkce=${storage.serialize()}; Path=/auth/callback; HttpOnly; SameSite=Lax; Max-Age=600${secure}`;
}

/**
 * The Turnstile sitekey is public. When it's unset the widget doesn't render and
 * sign-in works exactly as before, so this can ship ahead of switching on
 * Supabase's captcha check.
 */
export async function loader({ context }: LoaderFunctionArgs) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const env = (context as any)?.cloudflare?.env as Env;
  return { turnstileSiteKey: env.TURNSTILE_SITE_KEY || "" };
}

export async function action({ request, context }: ActionFunctionArgs) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const env = (context as any)?.cloudflare?.env as Env;
  const form = await request.formData();
  const origin = new URL(request.url).origin;

  if (form.get("intent") === "google") {
    try {
      const storage = new CookieStorage();
      // PKCE, so Google comes back with ?code= rather than a URL fragment the
      // server can't read. signInWithOAuth only redirects in a browser; here it
      // hands back the URL to redirect to.
      const supabase = getSupabaseAnonWithStorage(env, storage, { flowType: "pkce" });
      const { data: oauth, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${origin}/auth/callback` },
      });
      if (error || !oauth?.url) return { error: "Couldn't reach Google. Please try again." };
      const headers = new Headers();
      headers.append("Set-Cookie", pkceCookie(storage, request));
      return redirect(oauth.url, { headers });
    } catch {
      return { error: "Service unavailable. Please try again." };
    }
  }

  const email = (form.get("email") as string)?.trim().toLowerCase();

  // Step two: the code from the email. Typed into this tab, so the session and
  // any invite cookie stay in the browser the person started in. (Emailed links
  // often open in a different browser, e.g. the Gmail app's own, which can't see
  // that cookie, so the inviter wasn't credited.)
  if (form.get("intent") === "verify") {
    const token = ((form.get("code") as string) ?? "").replace(/\D/g, "");
    if (!email || !/^\d{6,8}$/.test(token)) {
      return { success: true as const, email, codeError: "Enter the code from the email." };
    }
    try {
      const supabase = getSupabaseAnonWithStorage(env, new CookieStorage());
      const { data: verified, error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
      if (error || !verified.session) {
        return {
          success: true as const,
          email,
          codeError: "That code didn't work. Check it, or it may have expired — send a new one below.",
        };
      }
      return await finishSignIn(request, env, verified.session);
    } catch {
      return { success: true as const, email, codeError: "Service unavailable. Please try again." };
    }
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Please enter a valid email address." };
  }

  // Supabase verifies this against the Turnstile secret set in its dashboard,
  // so the check guards Supabase's own endpoint, not just this form. Tokens are
  // single-use: verifying it here as well would spend it before Supabase could.
  const captchaToken = (form.get("cf-turnstile-response") as string) || undefined;

  try {
    const storage = new CookieStorage();
    const supabase = getSupabaseAnonWithStorage(env, storage);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${origin}/auth/callback`, captchaToken },
    });
    if (error) {
      if (/captcha/i.test(error.message)) {
        return { error: "We couldn't confirm you're human. Please wait for the check to finish and try again." };
      }
      return { error: error.message };
    }
    const headers = new Headers();
    headers.append("Set-Cookie", pkceCookie(storage, request));
    return data({ success: true as const, email, codeError: null as string | null }, { headers });
  } catch {
    return { error: "Service unavailable. Please try again." };
  }
}

/** Google's "G" mark, inlined — the artifact CSP blocks remote images. */
function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#4285F4" d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z" />
      <path fill="#34A853" d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z" />
      <path fill="#FBBC05" d="M11.69 28.18C11.25 26.86 11 25.45 11 24s.25-2.86.69-4.18v-5.7H4.34C2.85 17.09 2 20.45 2 24s.85 6.91 2.34 9.88l7.35-5.7z" />
      <path fill="#EA4335" d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z" />
    </svg>
  );
}

/** Why /auth/callback sent someone back here. It used to set ?error= with nothing reading it. */
const CALLBACK_ERRORS: Record<string, string> = {
  auth_failed: "That sign-in didn't work — it may have expired or already been used. Ask for a new code below.",
  link_expired: "That sign-in link has expired. Ask for a new code below.",
  missing_code: "That sign-in link was incomplete. Ask for a new code below.",
};

export default function Login() {
  const { turnstileSiteKey } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const submitting = navigation.state === "submitting";
  const [check, setCheck] = useState<TurnstileStatus>("loading");
  // Without a sitekey there's no check to wait for.
  const blocked = Boolean(turnstileSiteKey) && check !== "ready";
  const hint = turnstileSiteKey ? turnstileHint(check) : null;
  const [searchParams] = useSearchParams();
  const callbackError = CALLBACK_ERRORS[searchParams.get("error") ?? ""];

  return (
    <>
      <Nav />
      <div className="wrap">
        <div className="auth-wrap">
          <div className="auth-card">
            <div className="auth-logo">🍀</div>
            <h1 className="auth-h">Sign in or create your account</h1>
            <p className="auth-sub">No password to remember. Continue with Google, or we'll email you a 6-digit code.</p>

            {actionData && "success" in actionData ? (
              <div className="auth-sent">
                <div className="auth-sent-ico">📬</div>
                <h2>Check your inbox</h2>
                <p>We sent a sign-in code to <strong>{actionData.email}</strong>. It expires in 10 minutes.</p>
                <Form method="post" className="auth-form" style={{ marginTop: 16 }}>
                  <input type="hidden" name="intent" value="verify" />
                  <input type="hidden" name="email" value={actionData.email} />
                  {actionData.codeError && <div className="wf-error">{actionData.codeError}</div>}
                  <label className="fl" htmlFor="login-code">Your code</label>
                  <input
                    id="login-code"
                    className="fi auth-code"
                    type="text"
                    name="code"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[0-9 ]{6,9}"
                    maxLength={9}
                    placeholder="123456"
                    required
                    autoFocus
                  />
                  <button className="btn-pink auth-btn" type="submit" disabled={submitting}>
                    {submitting ? "Checking…" : "Sign in →"}
                  </button>
                </Form>
                <p className="auth-sent-note">Can't find it? Check your spam folder, and if it's there, mark it "Not spam" so the next one arrives safely.</p>
                <Form method="post" style={{ marginTop: 12 }}>
                  <input type="hidden" name="email" value={actionData.email} />
                  {turnstileSiteKey && (
                    <TurnstileWidget siteKey={turnstileSiteKey} action="login" resetKey={actionData} onStatus={setCheck} />
                  )}
                  {hint && <p className="auth-terms" style={{ marginTop: 0 }}>{hint}</p>}
                  <button
                    type="submit"
                    disabled={submitting || blocked}
                    style={{ background: "none", border: "none", color: "var(--purple)", fontSize: 14, fontWeight: 600, cursor: "pointer", textDecoration: "underline", padding: 0 }}
                  >
                    {submitting ? "Sending…" : "Send a new code"}
                  </button>
                </Form>
              </div>
            ) : (
              <>
                {actionData && "error" in actionData ? (
                  <div className="wf-error">{actionData.error}</div>
                ) : (
                  callbackError && <div className="wf-error">{callbackError}</div>
                )}
                <Form method="post">
                  <button className="auth-google" type="submit" name="intent" value="google" disabled={submitting}>
                    <GoogleMark />
                    Continue with Google
                  </button>
                </Form>
                <div className="auth-or"><span>or</span></div>
                <Form method="post" className="auth-form">
                <div className="fg">
                  <label className="fl">Email address</label>
                  <input
                    className="fi"
                    type="email"
                    name="email"
                    placeholder="you@example.com"
                    required
                    autoFocus
                    autoComplete="email"
                  />
                </div>
                {turnstileSiteKey && (
                  <TurnstileWidget siteKey={turnstileSiteKey} action="login" resetKey={actionData} onStatus={setCheck} />
                )}
                {hint && <p className="auth-terms" style={{ marginTop: 0 }}>{hint}</p>}
                <button className="btn-pink auth-btn" type="submit" disabled={submitting || blocked}>
                  {submitting ? "Sending…" : "Email me a code →"}
                </button>
                </Form>
              </>
            )}

            <p className="auth-terms">
              By signing in you agree to earn and redeem points only for genuine activity.
              Points have no cash value.
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
