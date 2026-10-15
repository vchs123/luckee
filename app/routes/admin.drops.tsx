import { Form, Link, redirect, useActionData, useLoaderData, useNavigation, useSearchParams } from "react-router";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { requireAdmin } from "~/lib/auth.server";
import { getSupabase } from "~/lib/supabase.server";
import { DROP_BUCKET } from "~/lib/drops.server";
import { categoryOf, dropState, endedVisibleUntil } from "~/lib/drops";
import { melbNow } from "~/lib/melbDate";

/* Admin list of deal drops: write, edit, hide or delete them. */

export async function loader({ context }: LoaderFunctionArgs) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const env = (context as any)?.cloudflare?.env as Env;
  requireAdmin(context);
  const supabase = getSupabase(env);
  const { data, error } = await supabase
    .from("deal_drops")
    .select("*")
    .order("published_at", { ascending: false })
    .limit(200);
  if (error) return { setupNeeded: true as const, drops: [] };

  const ids = (data ?? []).map((d) => d.id as string);
  const { data: likes } = ids.length
    ? await supabase.from("deal_drop_likes").select("drop_id").in("drop_id", ids)
    : { data: [] };
  const nowMelb = melbNow();
  const counts = new Map<string, number>();
  (likes ?? []).forEach((l) => counts.set(l.drop_id as string, (counts.get(l.drop_id as string) ?? 0) + 1));

  return {
    setupNeeded: false as const,
    drops: (data ?? []).map((d) => ({
      id: d.id as string,
      slug: d.slug as string,
      title: d.title as string,
      place: (d.place as string | null) ?? null,
      saving: (d.saving as string | null) ?? null,
      emoji: d.emoji as string,
      published: d.published as boolean,
      publishedAt: d.published_at as string,
      endsOn: (d.ends_on as string | null) ?? null,
      category: categoryOf((d.category as string | undefined) ?? "free").label,
      state: dropState(
        {
          startsOn: (d.starts_on as string | null) ?? null,
          endsOn: (d.ends_on as string | null) ?? null,
          allDay: d.all_day !== false,
          startTime: typeof d.start_time === "string" ? d.start_time.slice(0, 5) : null,
          endTime: typeof d.end_time === "string" ? d.end_time.slice(0, 5) : null,
        },
        nowMelb,
      ),
      visibleUntil: endedVisibleUntil({ startsOn: (d.starts_on as string | null) ?? null, endsOn: (d.ends_on as string | null) ?? null }),
      hasPhoto: !!d.image_path,
      likes: counts.get(d.id as string) ?? 0,
    })),
  };
}

export async function action({ request, context }: ActionFunctionArgs) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const env = (context as any)?.cloudflare?.env as Env;
  requireAdmin(context);
  const supabase = getSupabase(env);
  const form = await request.formData();
  const id = String(form.get("id") ?? "");
  const intent = form.get("intent");

  if (intent === "toggle") {
    const { error } = await supabase.from("deal_drops").update({ published: form.get("published") === "true" }).eq("id", id);
    if (error) return { error: error.message };
    return redirect("/admin/drops");
  }

  if (intent === "delete") {
    const { data: drop } = await supabase.from("deal_drops").select("image_path").eq("id", id).maybeSingle();
    const { error } = await supabase.from("deal_drops").delete().eq("id", id);
    if (error) return { error: error.message };
    if (drop?.image_path) await supabase.storage.from(DROP_BUCKET).remove([drop.image_path as string]);
    return redirect("/admin/drops?deleted=1");
  }

  return { error: "Unknown action." };
}

const fmtDay = (ymd: string) =>
  new Date(`${ymd}T00:00:00Z`).toLocaleDateString("en-AU", { day: "numeric", month: "short", timeZone: "UTC" });

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric", timeZone: "Australia/Melbourne" });

export default function AdminDrops() {
  const { setupNeeded, drops } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const busy = useNavigation().state !== "idle";
  const [params] = useSearchParams();

  return (
    <div className="admin-content">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <h1 className="admin-h">Deal drops <span className="admin-count">{drops.length}</span></h1>
        {!setupNeeded && (
          <Link to="/admin/drops/new" className="btn-pink" style={{ fontSize: 13, padding: "9px 18px" }}>
            + New drop
          </Link>
        )}
      </div>
      <p className="admin-muted" style={{ maxWidth: 680 }}>
        Short posts about free deals and discounts, shown at <a href="/drops" target="_blank" rel="noreferrer">/drops</a> and the
        latest three on the home page. Anyone can like and share them. Once a drop's last day passes it moves to the
        Ended section for 60 days, then it's archived: off the public site but kept here. Hide takes one down any time.
      </p>
      {params.has("saved") && <p className="admin-flash">Saved and live.</p>}
      {params.has("deleted") && <p className="admin-flash">Deleted.</p>}
      {actionData?.error && <div className="wf-error" style={{ margin: "12px 0" }}>{actionData.error}</div>}

      {setupNeeded ? (
        <div className="admin-card" style={{ marginTop: 16 }}>
          <h3>One-time setup</h3>
          <p className="admin-muted">
            Run <code>sql/deal_drops.sql</code> in the Supabase SQL editor. It creates the posts and likes tables and the
            photo bucket.
          </p>
        </div>
      ) : drops.length === 0 ? (
        <p className="admin-empty">No drops yet. Write the first one!</p>
      ) : (
        <div className="admin-table-wrap" style={{ marginTop: 16 }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Drop</th>
                <th>Posted</th>
                <th>Likes</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {drops.map((d) => (
                <tr key={d.id}>
                  <td>
                    <span style={{ marginRight: 6 }}>{d.emoji}</span>
                    <Link to={`/admin/drops/${d.id}`}><strong>{d.title}</strong></Link>
                    <div className="admin-muted" style={{ fontSize: 12 }}>
                      {[d.category, d.place, d.saving, d.endsOn && `ends ${d.endsOn}`, d.hasPhoto && "📷"].filter(Boolean).join(" · ")}
                    </div>
                  </td>
                  <td className="admin-muted">{fmt(d.publishedAt)}</td>
                  <td>{d.likes}</td>
                  <td>
                    {!d.published ? (
                      <span className="admin-muted">Hidden</span>
                    ) : d.state === "archived" ? (
                      <span className="admin-muted" title="Ended over 60 days ago: off the public site">Archived</span>
                    ) : d.state === "ended" ? (
                      <a href={`/drops/${d.slug}`} target="_blank" rel="noreferrer" title="In the Ended section">
                        Ended, shown until {fmtDay(d.visibleUntil!)} ↗
                      </a>
                    ) : (
                      <a href={`/drops/${d.slug}`} target="_blank" rel="noreferrer">{d.state === "upcoming" ? "Upcoming" : "Live"} ↗</a>
                    )}
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <Link to={`/admin/drops/${d.id}`} className="btn-ghost" style={{ fontSize: 12, padding: "5px 12px" }}>
                        Edit
                      </Link>
                      <Form method="post">
                        <input type="hidden" name="id" value={d.id} />
                        <input type="hidden" name="published" value={String(!d.published)} />
                        <button className="btn-ghost" name="intent" value="toggle" disabled={busy} style={{ fontSize: 12, padding: "5px 12px" }}>
                          {d.published ? "Hide" : "Show"}
                        </button>
                      </Form>
                      <Form
                        method="post"
                        onSubmit={(e) => {
                          if (!window.confirm(`Delete "${d.title}" and its likes? This can't be undone.`)) e.preventDefault();
                        }}
                      >
                        <input type="hidden" name="id" value={d.id} />
                        <button className="admin-danger-btn" name="intent" value="delete" disabled={busy} style={{ fontSize: 12, padding: "5px 12px" }}>
                          Delete
                        </button>
                      </Form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
