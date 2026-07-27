import { useLoaderData, Link } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { requireAdmin } from "~/lib/auth.server";
import { getSupabase } from "~/lib/supabase.server";

export async function loader({ request, context }: LoaderFunctionArgs) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const env = (context as any)?.cloudflare?.env as Env;
  await requireAdmin(request, env);
  const supabase = getSupabase(env);

  const url = new URL(request.url);
  const status = url.searchParams.get("status") ?? "pending";

  const { data: submissions } = await supabase
    .from("proof_submissions")
    .select("*, user_profiles(username, first_name, last_name)")
    .eq("status", status)
    .order("created_at", { ascending: true })
    .limit(50);

  return { submissions: submissions ?? [], status };
}

const ACTION_LABELS: Record<string, string> = {
  revolut_signup: "Revolut signup",
  dinner_attended: "Dinner attended",
  referral_signup: "Referred friend (deal)",
  other: "Other",
};

export default function AdminProof() {
  const { submissions, status } = useLoaderData<typeof loader>();

  return (
    <div className="admin-content">
      <h1 className="admin-h">Proof queue</h1>

      <div className="admin-tabs">
        {["pending", "approved", "rejected"].map((s) => (
          <Link
            key={s}
            to={`/admin/proof?status=${s}`}
            className={`admin-tab${status === s ? " on" : ""}`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </Link>
        ))}
      </div>

      {submissions.length === 0 ? (
        <p className="admin-empty">No {status} submissions.</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Action</th>
                <th>Files</th>
                <th>Submitted</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((s) => {
                const profile = (s as Record<string, unknown>).user_profiles as { username: string; first_name?: string; last_name?: string } | null;
                return (
                  <tr key={s.id}>
                    <td>
                      <span className="admin-uname">@{profile?.username ?? "—"}</span>
                      {profile?.first_name && (
                        <p className="admin-muted" style={{ fontSize: 12, marginTop: 2 }}>
                          {profile.first_name} {profile.last_name ?? ""}
                        </p>
                      )}
                    </td>
                    <td>{ACTION_LABELS[s.action] ?? s.action}</td>
                    <td>{(s.file_paths as string[])?.length ?? 0} files</td>
                    <td className="admin-muted">{new Date(s.created_at).toLocaleDateString("en-AU")}</td>
                    <td><Link to={`/admin/proof/${s.id}`} className="admin-link">Review →</Link></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
