import { Form, useActionData, useNavigation } from "react-router";
import type { MetaFunction, ActionFunctionArgs } from "react-router";
import { Nav } from "~/components/Nav";
import { Footer } from "~/components/Footer";

export const meta: MetaFunction = () => [
  { title: "Community Dinners — Language-Matched Dining in Melbourne | Luckee" },
  { name: "description", content: "Language-matched community dinners with 2–6 people in Melbourne. Starting with Teochew dinners. Non-profit — you pay exactly what the venue charges." },
  { property: "og:title", content: "Community Dinners Melbourne | Luckee" },
  { tagName: "link", rel: "canonical", href: "https://luckee-app.pages.dev/dinners" },
];

export async function action({ request, context }: ActionFunctionArgs) {
  const { getSupabase } = await import("~/lib/supabase.server");
  const { getResend } = await import("~/lib/resend.server");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const env = (context as any)?.cloudflare?.env as Env;

  const form = await request.formData();
  const firstName = form.get("first_name") as string;
  const lastName = form.get("last_name") as string;
  const email = form.get("email") as string;
  const suburb = form.get("suburb") as string;
  const dinnerLanguage = form.get("dinner_language") as string;
  const dietary = (form.get("dietary") as string) || null;

  if (!firstName || !lastName || !email || !suburb || !dinnerLanguage) {
    return { error: "Please fill in all required fields." };
  }

  let supabase;
  try {
    supabase = getSupabase(env);
  } catch {
    return { error: "Service temporarily unavailable. Please try again later." };
  }
  const { error: dbError } = await supabase.from("dinner_waitlist").insert({
    first_name: firstName,
    last_name: lastName,
    email,
    suburb,
    dinner_language: dinnerLanguage,
    dietary,
  });

  if (dbError?.code === "23505") {
    return { error: "This email is already on the waitlist." };
  }
  if (dbError) {
    console.error("Supabase insert error:", dbError);
    return { error: "Something went wrong. Please try again." };
  }

  try {
    const resend = getResend(env);
    await resend.emails.send({
      from: "Vanessa at Luckee <hello@luckee.com.au>",
      to: email,
      subject: "You're on the Luckee dinner waitlist ✓",
      html: waitlistEmailHtml(firstName, dinnerLanguage),
    });
  } catch (e) {
    console.error("Resend error (non-fatal):", e);
  }

  return { success: true };
}

function waitlistEmailHtml(firstName: string, language: string) {
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
      <h1 style="font-size: 24px; color: #1e0a2e; margin-bottom: 12px;">You're on the list, ${firstName}! ✓</h1>
      <p style="color: #6b4d82; line-height: 1.7;">Thanks for signing up for a <strong>${language}</strong> dinner. I'll be in touch when a table opens up for your language group.</p>
      <p style="color: #6b4d82; line-height: 1.7;">In the meantime, check out the <a href="https://luckee-app.pages.dev/freebies/birthday-freebies" style="color: #e91e8c;">birthday freebies guide</a> — free food is always a good start.</p>
      <p style="color: #a08bb8; font-size: 13px; margin-top: 32px;">— Vanessa · <a href="https://luckee-app.pages.dev" style="color: #e91e8c;">luckee.com.au</a></p>
    </div>
  `;
}

export default function Dinners() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const submitting = navigation.state === "submitting";

  return (
    <>
      <Nav />
      <div className="wrap">
        <div className="sec-hd">
          <p className="eyebrow">🍜 Community dining</p>
          <h1 className="sec-h">Community Dinners</h1>
          <p className="sec-p wide">Language-matched shared dinners with 2–6 people you haven't met yet. Starting with Teochew community dinners in Melbourne, once a month. Non-profit — you pay exactly what the venue charges, nothing more.</p>
        </div>

        <div className="dsteps">
          <div className="ds"><div className="ds-n">1</div><h4>Build your profile</h4><p>Tell me your preferred dinner language, dietary needs, interests and suburb. Takes two minutes.</p></div>
          <div className="ds"><div className="ds-n">2</div><h4>Get matched</h4><p>I review all profiles and form compatible tables by hand. Language is the hard filter — everything else is a preference.</p></div>
          <div className="ds"><div className="ds-n">3</div><h4>Show up and eat</h4><p>You receive a PayID payment request for your exact share of the venue cost. Pay, confirm, and arrive. I'll be there too.</p></div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, alignItems: "start" }}>
          <div>
            <h3 style={{ fontFamily: "'Fraunces', serif", fontStyle: "italic", fontSize: 20, fontWeight: 700, color: "var(--t1)", marginBottom: 16 }}>Join the waitlist</h3>
            <div className="wf">
              <h3>Register your interest</h3>
              <p className="wf-sub">Once you're matched, I'll reach out by email with date, venue and payment details. No commitment until you confirm.</p>

              {actionData?.success ? (
                <div className="success-msg">✅ You're on the list! I'll be in touch when a table opens up for your language group.</div>
              ) : (
                <Form method="post">
                  {actionData?.error && (
                    <div className="wf-error">{actionData.error}</div>
                  )}
                  <div className="fr">
                    <div className="fg"><label className="fl">First name</label><input className="fi" type="text" name="first_name" placeholder="Your first name" required /></div>
                    <div className="fg"><label className="fl">Last name</label><input className="fi" type="text" name="last_name" placeholder="Your last name" required /></div>
                  </div>
                  <div className="fr">
                    <div className="fg"><label className="fl">Email</label><input className="fi" type="email" name="email" placeholder="you@example.com" required /></div>
                    <div className="fg"><label className="fl">Melbourne suburb</label><input className="fi" type="text" name="suburb" placeholder="e.g. Fitzroy, Docklands" required /></div>
                  </div>
                  <div className="fr" style={{ marginBottom: 0 }}>
                    <div className="fg">
                      <label className="fl">Preferred dinner language</label>
                      <select className="fs" name="dinner_language" required>
                        <option value="">Select a language</option>
                        <option>Teochew (潮州話)</option>
                        <option>Cantonese (廣東話)</option>
                        <option>Mandarin (普通話)</option>
                        <option>Bahasa Melayu</option>
                        <option>English (open table)</option>
                        <option>Other (please specify)</option>
                      </select>
                    </div>
                    <div className="fg">
                      <label className="fl">Dietary needs</label>
                      <select className="fs" name="dietary">
                        <option value="">None / happy with anything</option>
                        <option>Vegetarian</option>
                        <option>Vegan</option>
                        <option>Halal</option>
                        <option>No pork</option>
                        <option>No shellfish</option>
                        <option>Gluten-free</option>
                      </select>
                    </div>
                  </div>
                  <p className="wf-note">Payment (exact venue cost per head, no markup) is via PayID once you're matched and confirm. Cancellation: 48+ hrs = full refund, 24–48 hrs = 50%, &lt;24 hrs = no refund.</p>
                  <button className="wf-btn" type="submit" disabled={submitting}>
                    {submitting ? "Joining…" : "Join the waitlist →"}
                  </button>
                </Form>
              )}
            </div>
          </div>

          <div>
            <h3 style={{ fontFamily: "'Fraunces', serif", fontStyle: "italic", fontSize: 20, fontWeight: 700, color: "var(--t1)", marginBottom: 16 }}>How it works</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div className="xc"><div className="xc-ico">🌏</div><div><p className="xc-title">Language is the hard filter</p><p className="xc-desc">Dinners are matched by preferred dinner language first — no exceptions. Dietary requirements are a close second.</p></div></div>
              <div className="xc"><div className="xc-ico">👥</div><div><p className="xc-title">2 to 6 people per table</p><p className="xc-desc">Small enough to be genuinely social. I attend every dinner as part of the group — within the 6-person maximum.</p></div></div>
              <div className="xc"><div className="xc-ico">💰</div><div><p className="xc-title">Truly non-profit</p><p className="xc-desc">You pay the venue's per-head price. I collect via PayID and pay the venue in full. I don't take a coordination fee.</p></div></div>
              <div className="xc"><div className="xc-ico">📅</div><div><p className="xc-title">Once a month, for now</p><p className="xc-desc">Starting with Teochew community dinners. More language groups added as the waitlist grows.</p></div></div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
