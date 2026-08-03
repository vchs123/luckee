import { Form, useLoaderData, useActionData, useNavigation, Link } from "react-router";
import { redirect } from "react-router";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { requireAdmin } from "~/lib/auth.server";
import { getSupabase } from "~/lib/supabase.server";

const PROOF_TO_DEAL_SLUG: Record<string, string> = {
  revolut_signup: "rvl",
};

export async function loader({ request, context, params }: LoaderFunctionArgs) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const env = (context as any)?.cloudflare?.env as Env;
  await requireAdmin(request, env);
  const supabase = getSupabase(env);

  const { data: submission } = await supabase
    .from("proof_submissions")
    .select("*")
    .eq("id", params.id)
    .single();
  if (!submission) throw new Response("Not found", { status: 404 });

  const { data: userProfile } = await supabase
    .from("user_profiles")
    .select("username, first_name, last_name, total_points, referred_by")
    .eq("id", submission.user_id)
    .single();

  // Get signed download URLs for each file
  const filePaths = (submission.file_paths as string[]) ?? [];
  const signedUrls = await Promise.all(
    filePaths.map(async (path) => {
      const { data } = await supabase.storage
        .from("proof-submissions")
        .createSignedUrl(path, 3600);
      return data?.signedUrl ?? null;
    }),
  );

  return { submission, userProfile, signedUrls };
}

export async function action({ request, context, params }: ActionFunctionArgs) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const env = (context as any)?.cloudflare?.env as Env;
  await requireAdmin(request, env);
  const supabase = getSupabase(env);
  const form = await request.formData();
  const intent = form.get("intent") as string;
  const adminNote = (form.get("admin_note") as string)?.trim() || null;

  if (intent === "reject") {
    await supabase.from("proof_submissions").update({
      status: "rejected",
      admin_note: adminNote,
      reviewed_at: new Date().toISOString(),
      reviewed_by: "admin",
    }).eq("id", params.id);
    return redirect("/admin/proof");
  }

  if (intent === "approve") {
    const pts = parseInt(form.get("pts") as string);
    if (!pts || pts < 1) return { error: "Enter points to award (min 1)." };

    // Load submission to get user_id and action
    const { data: sub } = await supabase
      .from("proof_submissions")
      .select("user_id, action")
      .eq("id", params.id)
      .single();
    if (!sub) return { error: "Submission not found." };

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("total_points, referred_by")
      .eq("id", sub.user_id)
      .single();
    const currentPts = profile?.total_points ?? 0;
    const newPts = currentPts + pts;

    await Promise.all([
      supabase.from("proof_submissions").update({
        status: "approved",
        points_awarded: pts,
        admin_note: adminNote,
        reviewed_at: new Date().toISOString(),
        reviewed_by: "admin",
      }).eq("id", params.id),
      supabase.from("points_ledger").insert({
        user_id: sub.user_id, action: "proof_approved",
        points: pts, description: `Proof approved: ${sub.action}`, awarded_by: "admin",
      }),
      supabase.from("user_profiles").update({
        total_points: newPts, monthly_entries: Math.floor(newPts / 100),
      }).eq("id", sub.user_id),
    ]);

    // Auto-mark luckboard done if this proof corresponds to a deal
    const dealSlug = PROOF_TO_DEAL_SLUG[sub.action];
    if (dealSlug) {
      await supabase.from("luckboard").upsert(
        { user_id: sub.user_id, item_type: "deal", item_slug: dealSlug, status: "done", updated_at: new Date().toISOString() },
        { onConflict: "user_id,item_type,item_slug" },
      );
    }

    // If referral deal signup, award 150pts to referrer
    if (sub.action === "referral_signup" && profile?.referred_by) {
      const { data: refProfile } = await supabase
        .from("user_profiles").select("total_points").eq("id", profile.referred_by).single();
      const refPts = (refProfile?.total_points ?? 0) + 150;
      await Promise.all([
        supabase.from("points_ledger").insert({
          user_id: profile.referred_by, action: "referral_deal",
          points: 150, description: "Your referral completed a deal signup", awarded_by: "system",
        }),
        supabase.from("user_profiles").update({
          total_points: refPts, monthly_entries: Math.floor(refPts / 100),
        }).eq("id", profile.referred_by),
      ]);
    }

    return redirect("/admin/proof");
  }

  return null;
}

export default function AdminProofReview() {
  const { submission: s, userProfile: profile, signedUrls } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const submitting = navigation.state === "submitting";

  return (
    <div className="admin-content" style={{ maxWidth: 700 }}>
      <Link to="/admin/proof" className="admin-back">← Proof queue</Link>
      <h1 className="admin-h">Review submission</h1>

      <div className="admin-card">
        <dl className="admin-dl">
          <dt>User</dt><dd>@{profile?.username ?? "—"}{profile?.first_name ? ` (${profile.first_name})` : ""}</dd>
          <dt>Action</dt><dd>{s.action}</dd>
          {s.ledger_entry_id && <><dt>Activity ref</dt><dd className="ledger-ref">#{(s.ledger_entry_id as string).slice(0, 8).toUpperCase()}</dd></>}
          <dt>Status</dt><dd><span className={`proof-badge ${s.status}`}>{s.status}</span></dd>
          {s.description && <><dt>Note</dt><dd>{s.description}</dd></>}
          <dt>Submitted</dt><dd>{new Date(s.created_at).toLocaleString("en-AU", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" })}</dd>
        </dl>
      </div>

      {signedUrls.length > 0 && (
        <div className="admin-card" style={{ marginTop: 16 }}>
          <h3>Screenshots ({signedUrls.length})</h3>
          <div className="proof-img-grid">
            {signedUrls.map((url, i) =>
              url ? (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                  <img src={url} alt={`Screenshot ${i + 1}`} className="proof-img" />
                </a>
              ) : null,
            )}
          </div>
        </div>
      )}

      {s.status === "pending" && (
        <div className="admin-card" style={{ marginTop: 16 }}>
          <h3>Decision</h3>
          {actionData?.error && <div className="wf-error" style={{ marginBottom: 12 }}>{actionData.error}</div>}

          <div className="fg">
            <label className="fl">Admin note <span style={{ color: "var(--t3)", fontWeight: 400 }}>(optional)</span></label>
            <input className="fi" type="text" name="admin_note" form="approve-form" placeholder="Visible to user on rejection" />
          </div>

          <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
            <Form method="post" id="approve-form">
              <input type="hidden" name="intent" value="approve" />
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input className="fi" type="number" name="pts" min={1} max={500} placeholder="pts" style={{ width: 80 }} required />
                <button className="btn-pink" type="submit" disabled={submitting} style={{ fontSize: 13, padding: "8px 16px" }}>
                  ✓ Approve
                </button>
              </div>
            </Form>

            <Form method="post">
              <input type="hidden" name="intent" value="reject" />
              <button type="submit" disabled={submitting} style={{ padding: "8px 16px", fontSize: 13, background: "#fee2e2", color: "#dc2626", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700 }}>
                ✕ Reject
              </button>
            </Form>
          </div>
        </div>
      )}

      {s.status !== "pending" && (
        <div className="admin-card" style={{ marginTop: 16 }}>
          <p><strong>Reviewed:</strong> {s.reviewed_at ? new Date(s.reviewed_at).toLocaleString("en-AU", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }) : "—"}</p>
          {s.points_awarded && <p><strong>Points awarded:</strong> {s.points_awarded}</p>}
          {s.admin_note && <p><strong>Note:</strong> {s.admin_note}</p>}
        </div>
      )}
    </div>
  );
}
