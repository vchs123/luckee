import { Form, useActionData, useNavigation, Link } from "react-router";
import { redirect } from "react-router";
import type { MetaFunction, ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { requireAdmin } from "~/lib/auth.server";
import { getSupabase } from "~/lib/supabase.server";

export const meta: MetaFunction = () => [{ title: "New trivia question — Luckee Admin" }];

export async function loader({ request, context }: LoaderFunctionArgs) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const env = (context as any)?.cloudflare?.env as Env;
  await requireAdmin(request, env);
  return null;
}

export async function action({ request, context }: ActionFunctionArgs) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const env = (context as any)?.cloudflare?.env as Env;
  await requireAdmin(request, env);
  const supabase = getSupabase(env);
  const form = await request.formData();

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

  if (!question || options.some((o) => !o) || isNaN(correctIndex) || correctIndex < 0 || correctIndex > 3) {
    return { error: "All fields required. Correct answer must be A–D." };
  }

  const { error } = await supabase.from("trivia_questions").insert({
    question, options, correct_index: correctIndex, category, active,
  });
  if (error) return { error: "Failed to save. Try again." };

  return redirect("/admin/trivia");
}

export default function AdminTriviaNew() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const submitting = navigation.state === "submitting";

  return (
    <div className="admin-content" style={{ maxWidth: 640 }}>
      <Link to="/admin/trivia" className="admin-back">← Trivia</Link>
      <h1 className="admin-h">New question</h1>

      <Form method="post" className="wf">
        {actionData?.error && <div className="wf-error">{actionData.error}</div>}
        <div className="fg">
          <label className="fl">Question</label>
          <textarea className="fi" name="question" rows={3} placeholder="What is the RBA's target inflation band?" required />
        </div>
        {["A", "B", "C", "D"].map((letter, i) => (
          <div className="fg" key={i}>
            <label className="fl">Option {letter}</label>
            <input className="fi" type="text" name={`opt${i}`} placeholder={`Option ${letter}`} required />
          </div>
        ))}
        <div className="fg">
          <label className="fl">Correct answer</label>
          <select className="fs" name="correct_index" required>
            <option value="">Select…</option>
            {["A", "B", "C", "D"].map((l, i) => <option key={i} value={i}>Option {l}</option>)}
          </select>
        </div>
        <div className="fg">
          <label className="fl">Category</label>
          <input className="fi" type="text" name="category" placeholder="e.g. Finance, Travel, General" defaultValue="general" />
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16 }}>
          <label style={{ display: "flex", gap: 8, alignItems: "center", cursor: "pointer" }}>
            <input type="checkbox" name="active" value="true" /> Publish immediately
          </label>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button className="btn-pink" type="submit" disabled={submitting}>{submitting ? "Saving…" : "Save question"}</button>
          <Link to="/admin/trivia" style={{ padding: "10px 0", color: "var(--t2)", fontSize: 14 }}>Cancel</Link>
        </div>
      </Form>
    </div>
  );
}
