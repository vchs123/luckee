import { useState } from "react";
import { Form, Link, useActionData, useLoaderData, useNavigation, useSearchParams } from "react-router";
import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "react-router";
import { Nav } from "~/components/Nav";
import { Footer } from "~/components/Footer";
import { TurnstileWidget, turnstileHint, type TurnstileStatus } from "~/components/TurnstileWidget";
import { useAuth } from "~/hooks/useAuth";
import { userContext } from "~/lib/auth.context";
import { getSupabase } from "~/lib/supabase.server";
import { verifyTurnstile } from "~/lib/turnstile.server";

export const meta: MetaFunction = () => [
  { title: "Contact | Luckee" },
  { name: "description", content: "Get in touch with Luckee — questions, partnerships, privacy or copyright requests." },
  { tagName: "link", rel: "canonical", href: "https://luckee-app.pages.dev/contact" },
];

const TOPICS = [
  { id: "general", label: "General question" },
  { id: "partnership", label: "Partnership or advertising" },
  { id: "privacy", label: "Privacy or my data" },
  { id: "copyright", label: "Copyright request" },
  { id: "other", label: "Something else" },
] as const;
type Topic = (typeof TOPICS)[number]["id"];

function isTopic(value: unknown): value is Topic {
  return TOPICS.some((t) => t.id === value);
}

export async function loader({ context }: LoaderFunctionArgs) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const env = (context as any)?.cloudflare?.env as Env;
  return { turnstileSiteKey: env.TURNSTILE_SITE_KEY || "" };
}

export async function action({ request, context }: ActionFunctionArgs) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const env = (context as any)?.cloudflare?.env as Env;
  const form = await request.formData();

  // Honeypot: a field people never see. Anything that fills it in is a bot, and
  // it gets the same "sent" screen as a person, so it learns nothing.
  if (String(form.get("website") ?? "").trim()) return { success: true as const };

  const name = String(form.get("name") ?? "").trim();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const topic = form.get("topic");
  const message = String(form.get("message") ?? "").trim();

  if (!name || name.length > 100) return { error: "Please tell us your name (up to 100 characters)." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return { error: "Please enter a valid email address so we can reply." };
  }
  if (!isTopic(topic)) return { error: "Please choose what your message is about." };
  if (!message) return { error: "Please write a message." };
  if (message.length > 5000) return { error: "Please keep your message under 5,000 characters." };

  if (!(await verifyTurnstile(env, request, form.get("cf-turnstile-response"), "contact"))) {
    return { error: "We couldn't confirm you're human. Please wait for the check to finish and try again." };
  }

  // Service role: the table has row-level security with no public policies.
  const user = context.get(userContext);
  const { error } = await getSupabase(env).from("contact_messages").insert({
    name,
    email,
    topic,
    message,
    user_id: user?.id ?? null,
  });
  if (error) {
    console.error("[contact] insert failed:", error.message);
    return { error: "Sorry — your message didn't send. Please try again in a minute." };
  }

  return { success: true as const, email };
}

export default function Contact() {
  const { turnstileSiteKey } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const submitting = navigation.state === "submitting";
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const requested = searchParams.get("topic");
  const initialTopic: Topic = isTopic(requested) ? requested : "general";

  const [check, setCheck] = useState<TurnstileStatus>("loading");
  const blocked = Boolean(turnstileSiteKey) && check !== "ready";
  const hint = turnstileSiteKey ? turnstileHint(check) : null;

  return (
    <>
      <Nav />
      <div className="wrap">
        <div className="sec-hd">
          <p className="eyebrow">💌 Contact</p>
          <h1 className="sec-h">Get in touch</h1>
          <p className="sec-p">
            Questions, partnership ideas, privacy or copyright requests — send a message and we'll
            reply by email.
          </p>
        </div>

        <div className="mx-auto mb-16 mt-6 max-w-xl rounded-3xl border border-[#ec489933] bg-white p-6 shadow-sm sm:p-8">
          {actionData && "success" in actionData ? (
            <div className="py-6 text-center">
              <div aria-hidden className="mb-2 text-4xl">📬</div>
              <h2 className="font-fraunces mb-2 text-2xl font-bold italic text-[var(--t1)]">Message sent</h2>
              <p className="text-sm text-[var(--t2)]">
                Thanks for getting in touch.
                {"email" in actionData && actionData.email ? (
                  <> We'll reply to <strong>{actionData.email}</strong>.</>
                ) : null}
              </p>
              <Link to="/" className="btn-pink mt-6 inline-flex">
                Back to Luckee <span className="arrow">→</span>
              </Link>
            </div>
          ) : (
            <Form method="post" className="auth-form">
              {actionData && "error" in actionData && <div className="wf-error">{actionData.error}</div>}

              <div className="fg">
                <label className="fl" htmlFor="contact-name">Your name</label>
                <input id="contact-name" className="fi" name="name" required maxLength={100} autoComplete="name" />
              </div>

              <div className="fg">
                <label className="fl" htmlFor="contact-email">Email to reply to</label>
                <input
                  id="contact-email"
                  className="fi"
                  type="email"
                  name="email"
                  required
                  maxLength={254}
                  autoComplete="email"
                  defaultValue={user?.email ?? ""}
                />
              </div>

              <div className="fg">
                <label className="fl" htmlFor="contact-topic">What's it about?</label>
                <select id="contact-topic" className="fs" name="topic" defaultValue={initialTopic}>
                  {TOPICS.map((t) => (
                    <option key={t.id} value={t.id}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div className="fg">
                <label className="fl" htmlFor="contact-message">Message</label>
                <textarea id="contact-message" className="fi" name="message" required maxLength={5000} rows={6} />
              </div>

              {/* Honeypot: hidden from people and screen readers, tempting to bots. */}
              <div aria-hidden="true" style={{ position: "absolute", left: "-10000px", width: 1, height: 1, overflow: "hidden" }}>
                <label htmlFor="contact-website">Website</label>
                <input id="contact-website" type="text" name="website" tabIndex={-1} autoComplete="off" />
              </div>

              {turnstileSiteKey && (
                <TurnstileWidget siteKey={turnstileSiteKey} action="contact" resetKey={actionData} onStatus={setCheck} />
              )}
              {hint && <p className="auth-terms" style={{ marginTop: 0 }}>{hint}</p>}

              <button className="btn-pink auth-btn" type="submit" disabled={submitting || blocked}>
                {submitting ? "Sending…" : "Send message →"}
              </button>
            </Form>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
