import { Form, useLoaderData, useActionData, useNavigation, Link } from "react-router";
import { redirect } from "react-router";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { requireAdmin } from "~/lib/auth.server";
import { getSupabase } from "~/lib/supabase.server";

export async function loader({ request, context, params }: LoaderFunctionArgs) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const env = (context as any)?.cloudflare?.env as Env;
  await requireAdmin(request, env);
  const supabase = getSupabase(env);
  const { data: q } = await supabase.from("trivia_questions").select("*").eq("id", params.id).single();
  if (!q) throw new Response("Not found", { status: 404 });
  return { q };
}

export async function action({ request, context, params }: ActionFunctionArgs) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const env = (context as any)?.cloudflare?.env as Env;
  await requireAdmin(request, env);
  const supabase = getSupabase(env);
  const form = await request.formData();
  const intent = form.get("intent") as string;

  if (intent === "delete") {
    await supabase.from("trivia_questions").delete().eq("id", params.id);
    return redirect("/admin/trivia");
  }

  const question = (form.get("question") as string)?.trim();
  const options = [
    (form.get("opt0") as string)?.trim(),
    (form.get("opt1") as string)?.trim(),
    (form.get("opt2") as string)?.trim(),
    (form.get("opt3") as string)?.trim(),
  ];
  const correctIndex = parseInt(form.get("correct_index") as string);
  const category = (form.get("category") as string)?.trim() || "general";
  const active = form.get("active") === "true";

  if (!question || options.some((o) => !o) || isNaN(correctIndex)) {
    return { error: "All fields required." };
  }

  const { error } = await supabase.from("trivia_questions")
    .update({ question, options, correct_index: correctIndex, category, active })
    .eq("id", params.id);
  if (error) return { error: "Failed to save." };

  return redirect("/admin/trivia");
}

export default function AdminTriviaEdit() {
  const { q } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const submitting = navigation.state === "submitting";
  const options = q.options as string[];

  return (
    <div className="admin-content" style={{ maxWidth: 640 }}>
      <Link to="/admin/trivia" className="admin-back">← Trivia</Link>
      <h1 className="admin-h">Edit question</h1>

      <Form method="post" className="wf">
        <input type="hidden" name="intent" value="edit" />
        {actionData?.error && <div className="wf-error">{actionData.error}</div>}
        <div className="fg">
          <label className="fl">Question</label>
          <textarea className="fi" name="question" rows={3} defaultValue={q.question} required />
        </div>
        {["A", "B", "C", "D"].map((letter, i) => (
          <div className="fg" key={i}>
            <label className="fl">Option {letter}</label>
            <input className="fi" type="text" name={`opt${i}`} defaultValue={options[i] ?? ""} required />
          </div>
        ))}
        <div className="fg">
          <label className="fl">Correct answer</label>
          <select className="fs" name="correct_index" defaultValue={q.correct_index} required>
            {["A", "B", "C", "D"].map((l, i) => <option key={i} value={i}>Option {l}</option>)}
          </select>
        </div>
        <div className="fg">
          <label className="fl">Category</label>
          <input className="fi" type="text" name="category" defaultValue={q.category ?? "general"} />
        </div>
        <label style={{ display: "flex", gap: 8, alignItems: "center", cursor: "pointer", marginBottom: 20 }}>
          <input type="checkbox" name="active" value="true" defaultChecked={q.active} /> Active (visible to users)
        </label>
        <div style={{ display: "flex", gap: 12 }}>
          <button className="btn-pink" type="submit" disabled={submitting}>{submitting ? "Saving…" : "Save changes"}</button>
          <Link to="/admin/trivia" style={{ padding: "10px 0", color: "var(--t2)", fontSize: 14 }}>Cancel</Link>
        </div>
      </Form>

      <Form method="post" style={{ marginTop: 32 }} onSubmit={(e) => !confirm("Delete this question?") && e.preventDefault()}>
        <input type="hidden" name="intent" value="delete" />
        <button type="submit" style={{ color: "#dc2626", fontSize: 13, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
          Delete this question
        </button>
      </Form>
    </div>
  );
}
