import { Form, useActionData, useLoaderData, useNavigation } from "react-router";
import { redirect } from "react-router";
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

  const dob = (form.get("dob") as string) || null;
  if (dob) {
    const minDate = new Date();
    minDate.setFullYear(minDate.getFullYear() - 18);
    if (new Date(dob) > minDate) return { error: "You must be 18 or older." };
  }
  const countryCode = (form.get("country_code") as string) || "+61";
  const mobileRaw = (form.get("mobile_number") as string)?.trim().replace(/\s/g, "") || null;
  const mobile = mobileRaw ? `${countryCode}${mobileRaw.replace(/^0/, "")}` : null;

  const updates = {
    first_name: (form.get("first_name") as string)?.trim() || null,
    last_name: (form.get("last_name") as string)?.trim() || null,
    dob,
    mobile,
    instagram: (form.get("instagram") as string)?.trim().replace(/^@/, "") || null,
    tiktok: (form.get("tiktok") as string)?.trim().replace(/^@/, "") || null,
    twitter: (form.get("twitter") as string)?.trim().replace(/^@/, "") || null,
    facebook: (form.get("facebook") as string)?.trim() || null,
  };

  const { error } = await supabase.from("user_profiles").update(updates).eq("id", user.id);
  if (error?.code === "23505") return { error: "That mobile number is already in use." };
  if (error) return { error: "Something went wrong. Please try again." };

  // Check if now profile_complete (award points if first time)
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
    return { success: true, bonus: true };
  }

  return { success: true, bonus: false };
}

export default function Profile() {
  const { email, profile } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const submitting = navigation.state === "submitting";

  return (
    <>
      <Nav />
      <div className="wrap">
        <div className="sec-hd">
          <p className="eyebrow">👤 Your account</p>
          <h1 className="sec-h">Profile</h1>
          <p className="sec-p">Your referral link: <strong>luckee.com.au/r/{profile.username}</strong></p>
        </div>

        <div className="profile-grid">
          <div className="profile-card">
            <div className="profile-email-row">
              <span className="profile-avatar">{profile.first_name?.[0] ?? email[0].toUpperCase()}</span>
              <div>
                <p className="profile-uname">@{profile.username}</p>
                <p className="profile-email">{email}</p>
              </div>
              <div className="pts-badge">{profile.total_points ?? 0} pts</div>
            </div>
          </div>

          <Form method="post" className="wf profile-form">
            <h3>Personal details</h3>
            {actionData?.success && (
              <div className="success-msg">
                ✅ Profile saved!{actionData.bonus ? " +100 pts for completing your profile 🎉" : ""}
              </div>
            )}
            {actionData?.error && <div className="wf-error">{actionData.error}</div>}

            <div className="fr">
              <div className="fg"><label className="fl">First name</label>
                <input className="fi" type="text" name="first_name" defaultValue={profile.first_name ?? ""} placeholder="Jane" /></div>
              <div className="fg"><label className="fl">Last name</label>
                <input className="fi" type="text" name="last_name" defaultValue={profile.last_name ?? ""} placeholder="Doe" /></div>
            </div>
            <p className="field-hint">Use your legal name — must match ID for reward redemptions.</p>
            <div className="fr">
              <div className="fg"><label className="fl">Date of birth</label>
                <input className="fi" type="date" name="dob" defaultValue={profile.dob ?? ""} max={(() => { const d = new Date(); d.setFullYear(d.getFullYear() - 18); return d.toISOString().slice(0, 10); })()} /></div>
              <div className="fg"><label className="fl">Mobile</label>
                {(() => {
                  const codes = ["+852", "+65", "+64", "+44", "+1", "+61"];
                  const stored = profile.mobile ?? "";
                  const code = codes.find(c => stored.startsWith(c)) ?? "+61";
                  const num = stored.startsWith(code) ? stored.slice(code.length) : stored;
                  return (
                    <div className="phone-wrap">
                      <select className="fi phone-code" name="country_code" defaultValue={code}>
                        <option value="+61">AU +61</option>
                        <option value="+1">US +1</option>
                        <option value="+44">UK +44</option>
                        <option value="+64">NZ +64</option>
                        <option value="+65">SG +65</option>
                        <option value="+852">HK +852</option>
                      </select>
                      <input className="fi phone-num" type="tel" name="mobile_number" defaultValue={num} placeholder="412 345 678" />
                    </div>
                  );
                })()}
              </div>
            </div>

            <h3 style={{ marginTop: 24 }}>Social handles</h3>
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
              {submitting ? "Saving…" : "Save changes"}
            </button>
          </Form>
        </div>
      </div>
      <Footer />
    </>
  );
}
