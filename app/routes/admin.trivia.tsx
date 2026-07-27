import { useLoaderData, Form, Link } from "react-router";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { requireAdmin } from "~/lib/auth.server";
import { getSupabase } from "~/lib/supabase.server";

export async function loader({ request, context }: LoaderFunctionArgs) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const env = (context as any)?.cloudflare?.env as Env;
  await requireAdmin(request, env);
  const supabase = getSupabase(env);
  const { data: questions } = await supabase
    .from("trivia_questions")
    .select("*")
    .order("created_at", { ascending: false });
  return { questions: questions ?? [] };
}

export async function action({ request, context }: ActionFunctionArgs) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const env = (context as any)?.cloudflare?.env as Env;
  await requireAdmin(request, env);
  const supabase = getSupabase(env);
  const form = await request.formData();
  const intent = form.get("intent") as string;
  const id = form.get("id") as string;

  if (intent === "toggle") {
    const { data: q } = await supabase.from("trivia_questions").select("active").eq("id", id).single();
    await supabase.from("trivia_questions").update({ active: !q?.active }).eq("id", id);
  } else if (intent === "delete") {
    await supabase.from("trivia_questions").delete().eq("id", id);
  }

  return null;
}

export default function AdminTrivia() {
  const { questions } = useLoaderData<typeof loader>();
  const active = questions.filter((q) => q.active);
  const draft = questions.filter((q) => !q.active);

  return (
    <div className="admin-content">
      <div className="admin-header-row">
        <h1 className="admin-h">Trivia questions</h1>
        <Link to="/admin/trivia/new" className="btn-pink" style={{ fontSize: 13, padding: "8px 16px" }}>+ New question</Link>
      </div>

      <p className="admin-muted">{active.length} active · {draft.length} draft · Users see 5 per day (seeded by date)</p>

      {[{ label: "Active", items: active }, { label: "Draft", items: draft }].map(({ label, items }) => (
        items.length > 0 && (
          <div key={label} style={{ marginTop: 24 }}>
            <h3 className="admin-section-h">{label} ({items.length})</h3>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead><tr><th>Question</th><th>Category</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {items.map((q) => (
                    <tr key={q.id}>
                      <td style={{ maxWidth: 360 }}>{q.question}</td>
                      <td className="admin-muted">{q.category}</td>
                      <td><span className={`proof-badge ${q.active ? "approved" : "pending"}`}>{q.active ? "Active" : "Draft"}</span></td>
                      <td>
                        <div style={{ display: "flex", gap: 8 }}>
                          <Form method="post" style={{ display: "inline" }}>
                            <input type="hidden" name="intent" value="toggle" />
                            <input type="hidden" name="id" value={q.id} />
                            <button type="submit" className="admin-link">{q.active ? "Deactivate" : "Activate"}</button>
                          </Form>
                          <Link to={`/admin/trivia/${q.id}`} className="admin-link">Edit</Link>
                          <Form method="post" style={{ display: "inline" }} onSubmit={(e) => !confirm("Delete this question?") && e.preventDefault()}>
                            <input type="hidden" name="intent" value="delete" />
                            <input type="hidden" name="id" value={q.id} />
                            <button type="submit" className="admin-link" style={{ color: "#dc2626" }}>Delete</button>
                          </Form>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ))}

      {questions.length === 0 && <p className="admin-empty">No questions yet. <Link to="/admin/trivia/new" className="admin-link">Add one →</Link></p>}
    </div>
  );
}
