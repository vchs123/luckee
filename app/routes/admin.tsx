import { useLoaderData, Link } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { requireAdmin } from "~/lib/auth.server";
import { getSupabase } from "~/lib/supabase.server";

export async function loader({ request, context }: LoaderFunctionArgs) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const env = (context as any)?.cloudflare?.env as Env;
  await requireAdmin(request, env);
  const supabase = getSupabase(env);

  const [usersRes, proofRes, questionsRes] = await Promise.all([
    supabase.from("user_profiles").select("id, total_points, created_at"),
    supabase.from("proof_submissions").select("id, status"),
    supabase.from("trivia_questions").select("id, active"),
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
  };
}

export default function AdminOverview() {
  const { totalUsers, totalPoints, pendingProof, activeQuestions, totalQuestions } = useLoaderData<typeof loader>();
  return (
    <div className="admin-content">
      <h1 className="admin-h">Overview</h1>
      <div className="admin-stats">
        <div className="admin-stat"><span className="admin-stat-n">{totalUsers}</span><span className="admin-stat-l">Users</span></div>
        <div className="admin-stat"><span className="admin-stat-n">{totalPoints.toLocaleString()}</span><span className="admin-stat-l">Total pts issued</span></div>
        <div className="admin-stat"><span className="admin-stat-n">{pendingProof}</span><span className="admin-stat-l">Pending proof</span></div>
        <div className="admin-stat"><span className="admin-stat-n">{activeQuestions}/{totalQuestions}</span><span className="admin-stat-l">Active questions</span></div>
      </div>
      <div className="admin-quick">
        <Link to="/admin/proof" className="admin-quick-link">Review pending proof ({pendingProof}) →</Link>
        <Link to="/admin/users" className="admin-quick-link">View all users →</Link>
        <Link to="/admin/trivia/new" className="admin-quick-link">Add trivia question →</Link>
      </div>
    </div>
  );
}
