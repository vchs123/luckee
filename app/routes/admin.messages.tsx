import { useLoaderData, Link, Form, useNavigation } from "react-router";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { requireAdmin } from "~/lib/auth.server";
import { getSupabase } from "~/lib/supabase.server";

const TOPIC_LABEL: Record<string, string> = {
  general: "General question",
  partnership: "Partnership",
  privacy: "Privacy",
  copyright: "Copyright",
  other: "Other",
};

const VIEWS = [
  { id: "waiting", label: "Waiting" },
  { id: "handled", label: "Handled" },
] as const;

export async function loader({ request, context }: LoaderFunctionArgs) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const env = (context as any)?.cloudflare?.env as Env;
  requireAdmin(context);

  const view = new URL(request.url).searchParams.get("view") === "handled" ? "handled" : "waiting";
  const query = getSupabase(env)
    .from("contact_messages")
    .select("id, name, email, topic, message, created_at, handled_at")
    .order("created_at", { ascending: view === "waiting" }) // oldest first while waiting
    .limit(100);
  const { data, error } = await (view === "handled" ? query.not("handled_at", "is", null) : query.is("handled_at", null));

  // Most likely cause: sql/contact_messages.sql hasn't been run yet.
  return { messages: data ?? [], view, setupNeeded: Boolean(error) };
}

export async function action({ request, context }: ActionFunctionArgs) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const env = (context as any)?.cloudflare?.env as Env;
  requireAdmin(context);

  const form = await request.formData();
  const id = String(form.get("id") ?? "");
  const handled = form.get("handled") === "1";
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;

  await getSupabase(env)
    .from("contact_messages")
    .update({ handled_at: handled ? new Date().toISOString() : null })
    .eq("id", id);
  return null;
}

export default function AdminMessages() {
  const { messages, view, setupNeeded } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const submitting = navigation.state === "submitting";

  return (
    <div className="admin-content">
      <h1 className="admin-h">Messages</h1>

      <div className="admin-tabs">
        {VIEWS.map((v) => (
          <Link key={v.id} to={`/admin/messages?view=${v.id}`} className={`admin-tab${view === v.id ? " on" : ""}`}>
            {v.label}
          </Link>
        ))}
      </div>

      {setupNeeded ? (
        <p className="admin-empty">
          Couldn't load messages. If this is new, run <code>sql/contact_messages.sql</code> in the Supabase SQL editor.
        </p>
      ) : messages.length === 0 ? (
        <p className="admin-empty">{view === "waiting" ? "No messages waiting for a reply." : "No handled messages yet."}</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {messages.map((m) => (
            <div key={m.id as string} className="admin-card">
              <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                <div>
                  <p style={{ fontWeight: 800, fontSize: 16, color: "var(--t1)" }}>
                    {m.name as string}{" "}
                    <span style={{ color: "var(--t3)", fontWeight: 600 }}>· {TOPIC_LABEL[m.topic as string] ?? (m.topic as string)}</span>
                  </p>
                  <p className="admin-muted" style={{ marginTop: 4 }}>
                    <a href={`mailto:${m.email as string}?subject=${encodeURIComponent("Re: your message to Luckee")}`} style={{ color: "var(--pink)", fontWeight: 700 }}>
                      {m.email as string}
                    </a>
                    {" · "}
                    {new Date(m.created_at as string).toLocaleString("en-AU", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" })}
                  </p>
                </div>
                <Form method="post">
                  <input type="hidden" name="id" value={m.id as string} />
                  <input type="hidden" name="handled" value={m.handled_at ? "0" : "1"} />
                  <button className={m.handled_at ? "btn-ghost" : "btn-pink"} type="submit" disabled={submitting} style={{ fontSize: 13, padding: "8px 16px" }}>
                    {m.handled_at ? "Move back to waiting" : "Mark handled"}
                  </button>
                </Form>
              </div>
              {/* Rendered as text, so whatever a visitor typed can't become markup. */}
              <p style={{ fontSize: 14, marginTop: 12, whiteSpace: "pre-wrap", color: "var(--t1)" }}>{m.message as string}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
