import { useLoaderData, useActionData, Form, useNavigation, Link } from "react-router";
import { redirect } from "react-router";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { requireAdmin } from "~/lib/auth.server";
import { getSupabase } from "~/lib/supabase.server";

export async function loader({ request, context, params }: LoaderFunctionArgs) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const env = (context as any)?.cloudflare?.env as Env;
  await requireAdmin(request, env);
  const supabase = getSupabase(env);
  const { id } = params;

  const [profileRes, ledgerRes, proofRes, authRes] = await Promise.all([
    supabase.from("user_profiles").select("*").eq("id", id).single(),
    supabase.from("points_ledger").select("*").eq("user_id", id).order("created_at", { ascending: false }).limit(50),
    supabase.from("proof_submissions").select("*").eq("user_id", id).order("created_at", { ascending: false }),
    supabase.auth.admin.getUserById(id!),
  ]);

  if (!profileRes.data) throw new Response("User not found", { status: 404 });

  return {
    profile: profileRes.data,
    email: authRes.data.user?.email ?? "—",
    ledger: ledgerRes.data ?? [],
    proof: proofRes.data ?? [],
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

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("total_points")
    .eq("id", id)
    .single();
  const currentPts = profile?.total_points ?? 0;
  const newPts = currentPts + pts;

  await Promise.all([
    supabase.from("points_ledger").insert({
      user_id: id, action: "admin_bonus", points: pts,
      description: reason, awarded_by: "admin",
    }),
    supabase.from("user_profiles").update({
      total_points: newPts, monthly_entries: Math.floor(newPts / 100),
    }).eq("id", id),
  ]);

  return redirect(`/admin/users/${id}`);
}

export default function AdminUserDetail() {
  const { profile, email, ledger, proof } = useLoaderData<typeof loader>();
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
    </div>
  );
}
