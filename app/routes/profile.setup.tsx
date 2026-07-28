import { Form, useActionData, useNavigation, useSearchParams } from "react-router";
import { redirect } from "react-router";
import type { MetaFunction, ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { Nav } from "~/components/Nav";
import { requireAuth, getCookie } from "~/lib/auth.server";
import { getSupabase } from "~/lib/supabase.server";

export const meta: MetaFunction = () => [
  { title: "Set up your profile — Luckee" },
  { name: "robots", content: "noindex" },
];

export async function loader({ request, context }: LoaderFunctionArgs) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const env = (context as any)?.cloudflare?.env as Env;
  const user = await requireAuth(request, env);
  // If profile already exists, skip setup
  const supabase = getSupabase(env);
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();
  if (profile) return redirect("/rewards");
  return { userId: user.id };
}

export async function action({ request, context }: ActionFunctionArgs) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const env = (context as any)?.cloudflare?.env as Env;
  const user = await requireAuth(request, env);
  const supabase = getSupabase(env);
  const form = await request.formData();
  const step = form.get("step") as string;

  if (step === "1") {
    const username = (form.get("username") as string)?.trim().toLowerCase();
    if (!username || !/^[a-z0-9_]{3,30}$/.test(username)) {
      return { error: "Username must be 3–30 characters: letters, numbers, underscores only.", step: "1" };
    }
    // Check uniqueness
    const { data: existing } = await supabase
      .from("user_profiles")
      .select("id")
      .eq("username", username)
      .maybeSingle();
    if (existing) return { error: "That username is taken. Try another.", step: "1" };
    // Wire referral: cookie takes priority, then manual code field
    let refUserId: string | null = getCookie(request, "luckee_ref_pending");
    if (!refUserId) {
      const referralCode = (form.get("referral_code") as string)?.trim().toLowerCase();
      if (referralCode) {
        const { data: refProfile } = await supabase
          .from("user_profiles").select("id").eq("username", referralCode).maybeSingle();
        if (refProfile && refProfile.id !== user.id) refUserId = refProfile.id;
      }
    }
    const insertData: Record<string, unknown> = { id: user.id, username };
    if (refUserId && refUserId !== user.id) insertData.referred_by = refUserId;

    // Create the profile row
    const { error } = await supabase.from("user_profiles").insert(insertData);
    if (error) return { error: "Something went wrong. Please try again.", step: "1" };

    // Award referrer 100pts if applicable
    if (refUserId && refUserId !== user.id) {
      const { data: refProfile } = await supabase
        .from("user_profiles").select("total_points").eq("id", refUserId).single();
      const refPts = (refProfile?.total_points ?? 0) + 100;
      await Promise.all([
        supabase.from("points_ledger").insert({
          user_id: refUserId, action: "referral_account",
          points: 100, description: "Your referral created a Luckee account",
        }),
        supabase.from("user_profiles").update({
          total_points: refPts, monthly_entries: Math.floor(refPts / 100),
        }).eq("id", refUserId),
      ]);
    }

    return redirect("/profile/setup?step=2");
  }

  if (step === "2") {
    const firstName = (form.get("first_name") as string)?.trim() || null;
    const lastName = (form.get("last_name") as string)?.trim() || null;
    const dob = (form.get("dob") as string) || null;
    if (dob) {
      const minDate = new Date();
      minDate.setFullYear(minDate.getFullYear() - 18);
      if (new Date(dob) > minDate) {
        return { error: "You must be 18 or older to join Luckee.", step: "2" };
      }
    }
    const countryCode = (form.get("country_code") as string) || "+61";
    const mobileRaw = (form.get("mobile_number") as string)?.trim().replace(/\s/g, "") || null;
    const mobile = mobileRaw ? `${countryCode}${mobileRaw.replace(/^0/, "")}` : null;
    const { error } = await supabase
      .from("user_profiles")
      .update({ first_name: firstName, last_name: lastName, dob, mobile })
      .eq("id", user.id);
    if (error?.code === "23505") return { error: "That mobile number is already in use.", step: "2" };
    if (error) return { error: "Something went wrong. Please try again.", step: "2" };
    return redirect("/profile/setup?step=3");
  }

  if (step === "3") {
    const instagram = (form.get("instagram") as string)?.trim().replace(/^@/, "") || null;
    const tiktok = (form.get("tiktok") as string)?.trim().replace(/^@/, "") || null;
    const twitter = (form.get("twitter") as string)?.trim().replace(/^@/, "") || null;
    const facebook = (form.get("facebook") as string)?.trim() || null;

    // Mark profile complete + award 100pts if all personal fields filled
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("first_name, last_name, mobile, dob")
      .eq("id", user.id)
      .single();

    const allFilled = profile?.first_name && profile?.last_name && profile?.mobile && profile?.dob;

    await supabase
      .from("user_profiles")
      .update({ instagram, tiktok, twitter, facebook, profile_complete: !!allFilled })
      .eq("id", user.id);

    if (allFilled) {
      await supabase.from("points_ledger").insert({
        user_id: user.id,
        action: "profile_complete",
        points: 100,
        description: "Completed your profile",
      });
      await supabase
        .from("user_profiles")
        .update({ total_points: 100, monthly_entries: 1 })
        .eq("id", user.id);
    }

    return redirect("/rewards");
  }

  return redirect("/rewards");
}

const STEPS = ["Username", "Personal details", "Socials"];

export default function ProfileSetup() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const [searchParams] = useSearchParams();
  const submitting = navigation.state === "submitting";
  const step = parseInt(searchParams.get("step") ?? "1");

  return (
    <>
      <Nav />
      <div className="wrap">
        <div className="auth-wrap">
          <div className="auth-card setup-card">
            <div className="setup-steps">
              {STEPS.map((label, i) => (
                <div key={label} className={`setup-step${i + 1 === step ? " active" : i + 1 < step ? " done" : ""}`}>
                  <div className="setup-step-dot">{i + 1 < step ? "✓" : i + 1}</div>
                  <span>{label}</span>
                </div>
              ))}
            </div>
            <div className="setup-bar">
              <div className="setup-bar-fill" style={{ width: `${((step - 1) / 3) * 100}%` }} />
            </div>

            {step === 1 && (
              <>
                <h2 className="setup-h">Choose your username</h2>
                <p className="setup-sub">This appears on your referral link: luckee.com.au/r/<strong>username</strong></p>
                <Form method="post" className="auth-form">
                  <input type="hidden" name="step" value="1" />
                  {actionData?.error && <div className="wf-error">{actionData.error}</div>}
                  <div className="fg">
                    <label className="fl">Username</label>
                    <input className="fi" type="text" name="username" placeholder="e.g. vanessa_luckee"
                      pattern="[a-z0-9_]{3,30}" minLength={3} maxLength={30} required autoFocus
                      style={{ textTransform: "lowercase" }} />
                    <p style={{ fontSize: 12, color: "var(--t3)", marginTop: 4 }}>3–30 characters · letters, numbers, underscores</p>
                  </div>
                  <div className="fg">
                    <label className="fl">Referral code <span style={{ color: "var(--t3)", fontWeight: 400 }}>(optional)</span></label>
                    <input className="fi" type="text" name="referral_code" placeholder="Friend's username" style={{ textTransform: "lowercase" }} />
                  </div>
                  <button className="btn-pink auth-btn" type="submit" disabled={submitting}>
                    {submitting ? "Checking…" : "Continue →"}
                  </button>
                </Form>
              </>
            )}

            {step === 2 && (
              <>
                <h2 className="setup-h">Personal details</h2>
                <p className="setup-sub">Used for birthday rewards and dinner matching. All optional.</p>
                <Form method="post" className="auth-form">
                  <input type="hidden" name="step" value="2" />
                  {actionData?.error && <div className="wf-error">{actionData.error}</div>}
                  <div className="fr">
                    <div className="fg"><label className="fl">First name</label><input className="fi" type="text" name="first_name" placeholder="Jane" /></div>
                    <div className="fg"><label className="fl">Last name</label><input className="fi" type="text" name="last_name" placeholder="Doe" /></div>
                  </div>
                  <p className="field-hint">Use your legal name — must match ID for reward redemptions.</p>
                  <div className="fr">
                    <div className="fg">
                      <label className="fl">Date of birth</label>
                      <input className="fi" type="date" name="dob" max={(() => { const d = new Date(); d.setFullYear(d.getFullYear() - 18); return d.toISOString().slice(0, 10); })()} />
                    </div>
                    <div className="fg">
                      <label className="fl">Mobile</label>
                      <div className="phone-wrap">
                        <select className="fi phone-code" name="country_code" defaultValue="+61">
                          <option value="+61">AU +61</option>
                          <option value="+1">US +1</option>
                          <option value="+44">UK +44</option>
                          <option value="+64">NZ +64</option>
                          <option value="+65">SG +65</option>
                          <option value="+852">HK +852</option>
                        </select>
                        <input className="fi phone-num" type="tel" name="mobile_number" placeholder="412 345 678" />
                      </div>
                    </div>
                  </div>
                  <button className="btn-pink auth-btn" type="submit" disabled={submitting}>
                    {submitting ? "Saving…" : "Continue →"}
                  </button>
                  <a href="/profile/setup?step=3" className="setup-skip">Skip for now</a>
                </Form>
              </>
            )}

            {step === 3 && (
              <>
                <h2 className="setup-h">Connect your socials</h2>
                <p className="setup-sub">Optional. Helps with the community and deal verification.</p>
                <Form method="post" className="auth-form">
                  <input type="hidden" name="step" value="3" />
                  {actionData?.error && <div className="wf-error">{actionData.error}</div>}
                  {[
                    { name: "instagram", label: "Instagram", placeholder: "@handle", icon: "📸" },
                    { name: "tiktok", label: "TikTok", placeholder: "@handle", icon: "🎵" },
                    { name: "twitter", label: "X / Twitter", placeholder: "@handle", icon: "🐦" },
                    { name: "facebook", label: "Facebook", placeholder: "Profile URL or name", icon: "👤" },
                  ].map(({ name, label, placeholder, icon }) => (
                    <div key={name} className="social-row">
                      <span className="social-ico">{icon}</span>
                      <div className="fg" style={{ flex: 1, marginBottom: 0 }}>
                        <label className="fl">{label}</label>
                        <input className="fi" type="text" name={name} placeholder={placeholder} />
                      </div>
                    </div>
                  ))}
                  <button className="btn-pink auth-btn" type="submit" disabled={submitting}>
                    {submitting ? "Finishing…" : "Finish setup →"}
                  </button>
                  <Form method="post">
                    <input type="hidden" name="step" value="3" />
                    <button type="submit" className="setup-skip">Skip socials</button>
                  </Form>
                </Form>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
