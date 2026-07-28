import { Form, useActionData, useLoaderData, useNavigation } from "react-router";
import { redirect } from "react-router";
import { useState } from "react";
import type { MetaFunction, ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { Nav } from "~/components/Nav";
import { Footer } from "~/components/Footer";
import { requireAuth } from "~/lib/auth.server";
import { getSupabase } from "~/lib/supabase.server";

export const meta: MetaFunction = () => [
  { title: "Your profile — Luckee" },
  { name: "robots", content: "noindex" },
];

export async function loader({ request, context }: LoaderFunctionArgs) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const env = (context as any)?.cloudflare?.env as Env;
  const user = await requireAuth(request, env);
  if (user.email === "luckee.app@gmail.com") return redirect("/admin");
  const supabase = getSupabase(env);
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  if (!profile) return redirect("/profile/setup");
  return { email: user.email!, profile };
}

export async function action({ request, context }: ActionFunctionArgs) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const env = (context as any)?.cloudflare?.env as Env;
  const user = await requireAuth(request, env);
  const supabase = getSupabase(env);
  const form = await request.formData();
  const tab = (form.get("tab") as string) ?? "profile";

  if (tab === "socials") {
    const updates = {
      instagram: (form.get("instagram") as string)?.trim().replace(/^@/, "") || null,
      tiktok: (form.get("tiktok") as string)?.trim().replace(/^@/, "") || null,
      twitter: (form.get("twitter") as string)?.trim().replace(/^@/, "") || null,
      facebook: (form.get("facebook") as string)?.trim() || null,
    };
    const { error } = await supabase.from("user_profiles").update(updates).eq("id", user.id);
    if (error) return { error: "Something went wrong. Please try again.", tab };
    return { success: true, bonus: false, tab };
  }

  // tab === "profile"
  const dob = (form.get("dob") as string) || null;
  if (dob) {
    const minDate = new Date();
    minDate.setFullYear(minDate.getFullYear() - 18);
    if (new Date(dob) > minDate) return { error: "You must be 18 or older.", tab };
  }
  const countryCode = (form.get("country_code") as string) || "+61";
  const mobileRaw = (form.get("mobile_number") as string)?.trim().replace(/\s/g, "") || null;
  const mobile = mobileRaw ? `${countryCode}${mobileRaw.replace(/^0/, "")}` : null;

  const updates = {
    first_name: (form.get("first_name") as string)?.trim() || null,
    last_name: (form.get("last_name") as string)?.trim() || null,
    dob,
    mobile,
  };

  const { error } = await supabase.from("user_profiles").update(updates).eq("id", user.id);
  if (error?.code === "23505") return { error: "That mobile number is already in use.", tab };
  if (error) return { error: "Something went wrong. Please try again.", tab };

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("profile_complete, first_name, last_name, mobile, dob, total_points")
    .eq("id", user.id)
    .single();
  const allFilled = profile?.first_name && profile?.last_name && profile?.mobile && profile?.dob;
  if (allFilled && !profile?.profile_complete) {
    await supabase.from("user_profiles").update({ profile_complete: true }).eq("id", user.id);
    await supabase.from("points_ledger").insert({
      user_id: user.id, action: "profile_complete", points: 100, description: "Completed your profile",
    });
    await supabase.from("user_profiles")
      .update({ total_points: (profile.total_points ?? 0) + 100, monthly_entries: Math.floor(((profile.total_points ?? 0) + 100) / 100) })
      .eq("id", user.id);
    return { success: true, bonus: true, tab };
  }

  return { success: true, bonus: false, tab };
}

export default function Profile() {
  const { email, profile } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const submitting = navigation.state === "submitting";
  const [tab, setTab] = useState<"profile" | "referral" | "socials">("profile");
  const [copied, setCopied] = useState(false);

  const codes = ["+852", "+65", "+64", "+44", "+1", "+61"];
  const stored = profile.mobile ?? "";
  const mCode = codes.find(c => stored.startsWith(c)) ?? "+61";
  const mNum = stored.startsWith(mCode) ? stored.slice(mCode.length) : stored;

  const referralUrl = `luckee.com.au/r/${profile.username}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(`https://${referralUrl}`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <>
      <Nav />
      <div className="wrap">
        <div className="sec-hd">
          <p className="eyebrow">👤 Your account</p>
          <h1 className="sec-h">Profile</h1>
        </div>

        <div className="profile-grid">
          <div className="profile-card">
            <div className="profile-email-row" style={{ marginBottom: 20, paddingBottom: 20, borderBottom: "1px solid var(--cb)" }}>
              <span className="profile-avatar">{profile.first_name?.[0] ?? email[0].toUpperCase()}</span>
              <div>
                <p className="profile-uname">@{profile.username}</p>
                <p className="profile-email">{email}</p>
              </div>
            </div>
            <div className="profile-tabs">
              <button className={`profile-tab${tab === "profile" ? " active" : ""}`} onClick={() => setTab("profile")}>Profile</button>
              <button className={`profile-tab${tab === "referral" ? " active" : ""}`} onClick={() => setTab("referral")}>Referral</button>
              <button className={`profile-tab${tab === "socials" ? " active" : ""}`} onClick={() => setTab("socials")}>Socials</button>
            </div>

            {tab === "profile" && (
              <Form method="post">
                <input type="hidden" name="tab" value="profile" />
                {actionData && "success" in actionData && actionData.tab === "profile" && (
                  <div className="success-msg">
                    ✅ Saved!{actionData.bonus ? " +100 pts for completing your profile 🎉" : ""}
                  </div>
                )}
                {actionData && "error" in actionData && actionData.tab === "profile" && (
                  <div className="wf-error">{actionData.error}</div>
                )}
                <div className="fr">
                  <div className="fg">
                    <label className="fl">First name {profile.first_name ? <span className="field-locked">Locked</span> : null}</label>
                    {profile.first_name ? (
                      <><div className="fi fi-locked">{profile.first_name}</div><input type="hidden" name="first_name" value={profile.first_name} /></>
                    ) : (
                      <input className="fi" type="text" name="first_name" defaultValue="" placeholder="Jane" />
                    )}
                  </div>
                  <div className="fg">
                    <label className="fl">Last name {profile.last_name ? <span className="field-locked">Locked</span> : null}</label>
                    {profile.last_name ? (
                      <><div className="fi fi-locked">{profile.last_name}</div><input type="hidden" name="last_name" value={profile.last_name} /></>
                    ) : (
                      <input className="fi" type="text" name="last_name" defaultValue="" placeholder="Doe" />
                    )}
                  </div>
                </div>
                <p className="field-hint">Use your legal name — must match ID for reward redemptions.</p>
                <div className="fr">
                  <div className="fg">
                    <label className="fl">Date of birth {profile.dob ? <span className="field-locked">Locked</span> : null}</label>
                    {profile.dob ? (
                      <><div className="fi fi-locked">{new Date(profile.dob + "T00:00:00").toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" })}</div><input type="hidden" name="dob" value={profile.dob} /></>
                    ) : (
                      <input className="fi" type="date" name="dob" defaultValue="" max={(() => { const d = new Date(); d.setFullYear(d.getFullYear() - 18); return d.toISOString().slice(0, 10); })()} />
                    )}
                  </div>
                  <div className="fg">
                    <label className="fl">Mobile {profile.mobile ? <span className="field-locked">Locked</span> : null}</label>
                    {profile.mobile ? (
                      <><div className="fi fi-locked">{mCode} {mNum}</div><input type="hidden" name="country_code" value={mCode} /><input type="hidden" name="mobile_number" value={mNum} /></>
                    ) : (
                      <div className="phone-wrap">
                        <select className="fi phone-code" name="country_code" defaultValue="+61">
                          <option value="+61">AU +61</option>
                          <option value="+1">US +1</option>
                          <option value="+44">UK +44</option>
                          <option value="+64">NZ +64</option>
                          <option value="+65">SG +65</option>
                          <option value="+852">HK +852</option>
                        </select>
                        <input className="fi phone-num" type="tel" name="mobile_number" defaultValue="" placeholder="412 345 678" />
                      </div>
                    )}
                  </div>
                </div>
                <button className="wf-btn" type="submit" disabled={submitting} style={{ marginTop: 24 }}>
                  {submitting ? "Saving…" : "Save changes"}
                </button>
              </Form>
            )}

            {tab === "referral" && (
              <div className="referral-box">
                <p className="fl" style={{ marginBottom: 8 }}>Your referral link</p>
                <p className="referral-link">{referralUrl}</p>
                <p className="field-hint" style={{ marginTop: 6 }}>Share this link — you earn 100 pts when someone signs up, and 150 pts when they complete a deal.</p>
                <button className="btn-pink referral-copy" onClick={handleCopy}>
                  {copied ? "✓ Copied!" : "Copy link"}
                </button>
              </div>
            )}

            {tab === "socials" && (
              <Form method="post">
                <input type="hidden" name="tab" value="socials" />
                {actionData && "success" in actionData && actionData.tab === "socials" && (
                  <div className="success-msg">✅ Socials saved!</div>
                )}
                {actionData && "error" in actionData && actionData.tab === "socials" && (
                  <div className="wf-error">{actionData.error}</div>
                )}
                {[
                  { name: "instagram", label: "Instagram", icon: "📸", val: profile.instagram },
                  { name: "tiktok", label: "TikTok", icon: "🎵", val: profile.tiktok },
                  { name: "twitter", label: "X / Twitter", icon: "🐦", val: profile.twitter },
                  { name: "facebook", label: "Facebook", icon: "👤", val: profile.facebook },
                ].map(({ name, label, icon, val }) => (
                  <div key={name} className="social-row">
                    <span className="social-ico">{icon}</span>
                    <div className="fg" style={{ flex: 1, marginBottom: 0 }}>
                      <label className="fl">{label}</label>
                      <input className="fi" type="text" name={name} defaultValue={val ?? ""} placeholder="@handle" />
                    </div>
                    {val && <span className="social-tick">✓</span>}
                  </div>
                ))}
                <button className="wf-btn" type="submit" disabled={submitting} style={{ marginTop: 24 }}>
                  {submitting ? "Saving…" : "Save socials"}
                </button>
              </Form>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
