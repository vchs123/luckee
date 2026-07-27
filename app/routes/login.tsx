import { Form, useActionData, useNavigation } from "react-router";
import type { MetaFunction, ActionFunctionArgs } from "react-router";
import { Nav } from "~/components/Nav";
import { Footer } from "~/components/Footer";
import { getSupabaseAnon } from "~/lib/supabase.server";

export const meta: MetaFunction = () => [
  { title: "Sign in — Luckee" },
  { name: "robots", content: "noindex" },
];

export async function action({ request, context }: ActionFunctionArgs) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const env = (context as any)?.cloudflare?.env as Env;
  const form = await request.formData();
  const email = (form.get("email") as string)?.trim().toLowerCase();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Please enter a valid email address." };
  }

  try {
    const supabase = getSupabaseAnon(env);
    const origin = new URL(request.url).origin;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${origin}/auth/callback` },
    });
    if (error) return { error: error.message };
    return { success: true, email };
  } catch {
    return { error: "Service unavailable. Please try again." };
  }
}

export default function Login() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const submitting = navigation.state === "submitting";

  return (
    <>
      <Nav />
      <div className="wrap">
        <div className="auth-wrap">
          <div className="auth-card">
            <div className="auth-logo">🍀</div>
            <h1 className="auth-h">Sign in to Luckee</h1>
            <p className="auth-sub">Enter your email and we'll send you a magic link — no password needed.</p>

            {actionData?.success ? (
              <div className="auth-sent">
                <div className="auth-sent-ico">📬</div>
                <h2>Check your inbox</h2>
                <p>We sent a sign-in link to <strong>{actionData.email}</strong>. It expires in 10 minutes.</p>
                <p className="auth-sent-note">Can't find it? Check your spam folder.</p>
              </div>
            ) : (
              <Form method="post" className="auth-form">
                {actionData?.error && (
                  <div className="wf-error">{actionData.error}</div>
                )}
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
                <button className="btn-pink auth-btn" type="submit" disabled={submitting}>
                  {submitting ? "Sending…" : "Send magic link →"}
                </button>
              </Form>
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
