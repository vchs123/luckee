import { useLoaderData, useActionData, Form, useNavigation, Link } from "react-router";
import { redirect } from "react-router";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { requireAdmin } from "~/lib/auth.server";
import { getSupabase } from "~/lib/supabase.server";
import { awardPoints } from "~/lib/points.server";

export async function loader({ request, context, params }: LoaderFunctionArgs) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const env = (context as any)?.cloudflare?.env as Env;
  await requireAdmin(request, env);
  const supabase = getSupabase(env);
  const { id } = params;

  const [profileRes, ledgerRes, proofRes, authRes, loginsRes, lbRes, referredsRes] = await Promise.all([
    supabase.from("user_profiles").select("*").eq("id", id).single(),
    supabase.from("points_ledger").select("*").eq("user_id", id).order("created_at", { ascending: false }).limit(100),
    supabase.from("proof_submissions").select("*").eq("user_id", id).order("created_at", { ascending: false }),
    supabase.auth.admin.getUserById(id!),
    supabase.from("daily_logins").select("login_date").eq("user_id", id).order("login_date", { ascending: false }).limit(60),
    supabase.from("luckboard").select("item_type, item_slug, status, updated_at").eq("user_id", id).order("updated_at", { ascending: false }),
    supabase.from("user_profiles").select("id, username, first_name, created_at").eq("referred_by", id).order("created_at", { ascending: false }),
  ]);

  if (!profileRes.data) throw new Response("User not found", { status: 404 });

  // Who referred this user
  let referredByProfile: { username: string; firstName: string | null; email: string } | null = null;
  if (profileRes.data.referred_by) {
    const { data: rbp } = await supabase.from("user_profiles").select("username, first_name").eq("id", profileRes.data.referred_by).single();
    const rbAuth = await supabase.auth.admin.getUserById(profileRes.data.referred_by);
    if (rbp) referredByProfile = { username: rbp.username, firstName: rbp.first_name, email: rbAuth.data.user?.email ?? "—" };
  }

  // Emails for referred users + whether they completed a deal
  const referreds = await Promise.all(
    (referredsRes.data ?? []).map(async (r) => {
      const rbAuth = await supabase.auth.admin.getUserById(r.id as string);
      const { data: proof } = await supabase.from("proof_submissions").select("id").eq("user_id", r.id).eq("action", "referral_signup").eq("status", "approved").maybeSingle();
      return { id: r.id as string, username: r.username as string, firstName: r.first_name as string | null, joinedAt: r.created_at as string, email: rbAuth.data.user?.email ?? "—", completedDeal: !!proof };
    })
  );

  // Streak
  const loginDates = (loginsRes.data ?? []).map(l => l.login_date as string);
  let streak = loginDates.length > 0 ? 1 : 0;
  for (let i = 0; i < loginDates.length - 1; i++) {
    const diff = (new Date(loginDates[i]).getTime() - new Date(loginDates[i + 1]).getTime()) / 86400000;
    if (diff === 1) streak++; else break;
  }

  return {
    profile: profileRes.data,
    email: authRes.data.user?.email ?? "—",
    ledger: ledgerRes.data ?? [],
    proof: proofRes.data ?? [],
    logins: loginDates,
    streak,
    luckboard: lbRes.data ?? [],
    referredByProfile,
    referreds,
  };
}

export async function action({ request, context, params }: ActionFunctionArgs) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const env = (context as any)?.cloudflare?.env as Env;
  await requireAdmin(request, env);
  const supabase = getSupabase(env);
  const { id } = params;
  const form = await request.formData();
  const pts = parseInt(form.get("pts") as string);
  const reason = (form.get("reason") as string)?.trim();

  if (!pts || pts < 1 || pts > 10000 || !reason) {
    return { error: "Points must be 1–10000 and reason is required." };
  }

  // Single source of truth for balance updates (admin bonus isn't doubled).
  await awardPoints(supabase, id!, "admin_bonus", pts, reason, { doubleEligible: false, awardedBy: "admin" });

  return redirect(`/admin/users/${id}`);
}

export default function AdminUserDetail() {
  const { profile, email, ledger, proof, logins, streak, luckboard, referredByProfile, referreds } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const submitting = navigation.state === "submitting";

  return (
    <div className="admin-content">
      <Link to="/admin/users" className="admin-back">← Users</Link>
      <h1 className="admin-h">@{profile.username}</h1>
      <p className="admin-muted">{email}</p>

      <div className="admin-user-grid">
        <div className="admin-card">
          <h3>Profile</h3>
          <dl className="admin-dl">
            <dt>Name</dt><dd>{profile.first_name ? `${profile.first_name} ${profile.last_name ?? ""}` : "—"}</dd>
            <dt>Mobile</dt><dd>{profile.mobile ?? "—"}</dd>
            <dt>DOB</dt><dd>{profile.dob ?? "—"}</dd>
            <dt>Total points</dt><dd><strong>{profile.total_points ?? 0}</strong></dd>
            <dt>Draw entries</dt><dd>{profile.monthly_entries ?? 0}</dd>
            <dt>Profile complete</dt><dd>{profile.profile_complete ? "Yes" : "No"}</dd>
            {profile.instagram && <><dt>Instagram</dt><dd>@{profile.instagram}</dd></>}
            {profile.tiktok && <><dt>TikTok</dt><dd>@{profile.tiktok}</dd></>}
          </dl>
        </div>

        <div className="admin-card">
          <h3>Award bonus points</h3>
          {actionData?.error && <div className="wf-error" style={{ marginBottom: 12 }}>{actionData.error}</div>}
          <Form method="post">
            <div className="fg"><label className="fl">Points</label>
              <input className="fi" type="number" name="pts" min={1} max={10000} placeholder="e.g. 50" required /></div>
            <div className="fg"><label className="fl">Reason</label>
              <input className="fi" type="text" name="reason" placeholder="e.g. Won giveaway" required /></div>
            <button className="btn-pink" type="submit" disabled={submitting} style={{ fontSize: 13, padding: "8px 16px" }}>
              {submitting ? "Awarding…" : "Award points"}
            </button>
          </Form>
        </div>
      </div>

      <div className="admin-card" style={{ marginTop: 24 }}>
        <h3>Points ledger</h3>
        <table className="admin-table">
          <thead><tr><th>Action</th><th>Description</th><th>Points</th><th>By</th><th>Date</th></tr></thead>
          <tbody>
            {ledger.map((e) => (
              <tr key={e.id}>
                <td>{e.action}</td>
                <td>{e.description ?? "—"}</td>
                <td><strong>+{e.points}</strong></td>
                <td className="admin-muted">{e.awarded_by ?? "system"}</td>
                <td className="admin-muted">{new Date(e.created_at).toLocaleString("en-AU", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" })}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {ledger.length === 0 && <p className="admin-empty">No points yet.</p>}
      </div>

      {proof.length > 0 && (
        <div className="admin-card" style={{ marginTop: 24 }}>
          <h3>Proof submissions</h3>
          <table className="admin-table">
            <thead><tr><th>Action</th><th>Status</th><th>Files</th><th>Date</th><th></th></tr></thead>
            <tbody>
              {proof.map((p) => (
                <tr key={p.id}>
                  <td>{p.action}</td>
                  <td><span className={`proof-badge ${p.status}`}>{p.status}</span></td>
                  <td>{(p.file_paths as string[])?.length ?? 0} files</td>
                  <td className="admin-muted">{new Date(p.created_at).toLocaleString("en-AU", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" })}</td>
                  <td><Link to={`/admin/proof/${p.id}`} className="admin-link">Review →</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Referral chain */}
      <div className="admin-card" style={{ marginTop: 24 }}>
        <h3>Referral chain</h3>
        <div className="admin-ref-chain">
          <div className="admin-ref-section">
            <h4 className="admin-ref-label">Referred by</h4>
            {referredByProfile ? (
              <div className="admin-ref-user">
                <Link to={`/admin/users/${profile.referred_by}`} className="admin-link">@{referredByProfile.username}</Link>
                <span className="admin-muted"> · {referredByProfile.firstName ?? "—"} · {referredByProfile.email}</span>
              </div>
            ) : (
              <p className="admin-empty" style={{ marginTop: 4 }}>Organic signup (no referrer)</p>
            )}
          </div>
          <div className="admin-ref-section" style={{ marginTop: 16 }}>
            <h4 className="admin-ref-label">People they referred ({referreds.length})</h4>
            {referreds.length === 0 ? (
              <p className="admin-empty" style={{ marginTop: 4 }}>None yet</p>
            ) : (
              <table className="admin-table" style={{ marginTop: 8 }}>
                <thead><tr><th>Username</th><th>Name</th><th>Email</th><th>Joined</th><th>Deal done</th></tr></thead>
                <tbody>
                  {referreds.map(r => (
                    <tr key={r.id}>
                      <td><Link to={`/admin/users/${r.id}`} className="admin-link">@{r.username}</Link></td>
                      <td>{r.firstName ?? "—"}</td>
                      <td className="admin-muted">{r.email}</td>
                      <td className="admin-muted">{new Date(r.joinedAt).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}</td>
                      <td>{r.completedDeal ? <span className="ref-done">✓ Done</span> : <span className="ref-pending">Pending</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Luckboard */}
      <div className="admin-card" style={{ marginTop: 24 }}>
        <h3>Luckboard ({luckboard.length} items)</h3>
        {luckboard.length === 0 ? (
          <p className="admin-empty">Nothing tracked yet.</p>
        ) : (
          <table className="admin-table">
            <thead><tr><th>Type</th><th>Item</th><th>Status</th><th>Last updated</th></tr></thead>
            <tbody>
              {luckboard.map((lb, i) => (
                <tr key={i}>
                  <td className="admin-muted">{lb.item_type}</td>
                  <td>{lb.item_slug}</td>
                  <td><span className={`lb-admin-badge lb-admin-${lb.status}`}>{lb.status}</span></td>
                  <td className="admin-muted">{new Date(lb.updated_at).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Login streak */}
      <div className="admin-card" style={{ marginTop: 24 }}>
        <h3>Login history</h3>
        <p className="admin-streak">Current streak: <strong>{streak} {streak === 1 ? "day" : "days"} 🔥</strong> · {logins.length} logins on record</p>
        {logins.length > 0 && (
          <div className="admin-login-grid">
            {logins.slice(0, 30).map(d => (
              <span key={d} className="admin-login-dot" title={d}>{new Date(d).getDate()}/{new Date(d).getMonth() + 1}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
