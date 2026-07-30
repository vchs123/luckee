import { useLoaderData, Link } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { requireAdmin } from "~/lib/auth.server";
import { getSupabase } from "~/lib/supabase.server";

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

export async function loader({ request, context }: LoaderFunctionArgs) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const env = (context as any)?.cloudflare?.env as Env;
  await requireAdmin(request, env);
  const supabase = getSupabase(env);
  const today = todayDate();

  const [usersRes, proofRes, questionsRes, topActiveRes, topInactiveRes, activeTodayRes] = await Promise.all([
    supabase.from("user_profiles").select("id, total_points"),
    supabase.from("proof_submissions").select("id, status"),
    supabase.from("trivia_questions").select("id, active"),
    supabase.from("user_profiles").select("id, username, total_points, created_at").order("total_points", { ascending: false }).limit(5),
    supabase.from("user_profiles").select("id, username, total_points, created_at").order("total_points", { ascending: true }).limit(5),
    supabase.from("daily_logins").select("user_id", { count: "exact", head: true }).eq("login_date", today),
  ]);

  const users = usersRes.data ?? [];
  const proof = proofRes.data ?? [];
  const questions = questionsRes.data ?? [];

  return {
    totalUsers: users.length,
    totalPoints: users.reduce((s, u) => s + (u.total_points ?? 0), 0),
    pendingProof: proof.filter((p) => p.status === "pending").length,
    activeQuestions: questions.filter((q) => q.active).length,
    totalQuestions: questions.length,
    topActive: topActiveRes.data ?? [],
    topInactive: topInactiveRes.data ?? [],
    activeToday: activeTodayRes.count ?? 0,
  };
}

function UserMiniTable({ users, title }: { users: { id: string; username: string; total_points: number | null; created_at: string }[]; title: string }) {
  return (
    <div className="admin-card">
      <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: "var(--t1)" }}>{title}</h3>
      <table className="admin-table" style={{ marginTop: 0 }}>
        <thead>
          <tr>
            <th>User</th>
            <th>Points</th>
            <th>Joined</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td><span className="admin-uname">@{u.username}</span></td>
              <td>{(u.total_points ?? 0).toLocaleString()}</td>
              <td className="admin-muted">{new Date(u.created_at).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "2-digit" })}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AdminOverview() {
  const { totalUsers, totalPoints, pendingProof, activeQuestions, totalQuestions, topActive, topInactive, activeToday } = useLoaderData<typeof loader>();
  return (
    <div className="admin-content">
      <h1 className="admin-h">Overview</h1>
      <div className="admin-stats">
        <div className="admin-stat"><span className="admin-stat-n">{totalUsers}</span><span className="admin-stat-l">Users</span></div>
        <div className="admin-stat"><span className="admin-stat-n">{totalPoints.toLocaleString()}</span><span className="admin-stat-l">Total pts issued</span></div>
        <div className="admin-stat"><span className="admin-stat-n">{pendingProof}</span><span className="admin-stat-l">Pending proof</span></div>
        <div className="admin-stat"><span className="admin-stat-n">{activeQuestions}/{totalQuestions}</span><span className="admin-stat-l">Active questions</span></div>
        <div className="admin-stat"><span className="admin-stat-n">{activeToday}</span><span className="admin-stat-l">Active today</span></div>
      </div>
      <div className="admin-quick">
        <Link to="/admin/proof" className="admin-quick-link">Review pending proof ({pendingProof}) →</Link>
        <Link to="/admin/users" className="admin-quick-link">View all users →</Link>
        <Link to="/admin/trivia/new" className="admin-quick-link">Add trivia question →</Link>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginTop: 24 }}>
        <UserMiniTable users={topActive} title="Top 5 most active" />
        <UserMiniTable users={topInactive} title="Top 5 least active" />
      </div>
    </div>
  );
}
