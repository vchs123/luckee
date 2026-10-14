import { Form, Link, useLoaderData, useNavigation, redirect, useActionData } from "react-router";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { requireAdmin } from "~/lib/auth.server";
import { getSupabase } from "~/lib/supabase.server";
import { awardPoints } from "~/lib/points.server";
import { PIN_POINTS } from "~/lib/pins";

/*
 * Review queue for community pins (the home page corkboard). Approving puts a
 * pin on the board and pays the member; rejecting keeps it off with an
 * optional note; removing takes an approved pin down when the deal ends.
 */

const STATUSES = ["pending", "approved", "rejected", "removed"] as const;
type Status = (typeof STATUSES)[number];

export async function loader({ request, context }: LoaderFunctionArgs) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const env = (context as any)?.cloudflare?.env as Env;
  requireAdmin(context);
  const supabase = getSupabase(env);
  const raw = new URL(request.url).searchParams.get("status");
  const status: Status = STATUSES.find((s) => s === raw) ?? "pending";

  const { data, error } = await supabase
    .from("community_pins")
    .select("*")
    .eq("status", status)
    .order("created_at", { ascending: status === "pending" })
    .limit(100);
  if (error) return { setupNeeded: true as const, status, pins: [] };

  const rows = data ?? [];
  const ids = [...new Set(rows.map((r) => r.user_id as string | null).filter((id): id is string => !!id))];
  const { data: profiles } = ids.length
    ? await supabase.from("user_profiles").select("id, username").in("id", ids)
    : { data: [] };
  const names = new Map((profiles ?? []).map((p) => [p.id as string, p.username as string]));

  return {
    setupNeeded: false as const,
    status,
    pins: rows.map((r) => ({
      id: r.id as string,
      userId: (r.user_id as string | null) ?? null,
      username: names.get(r.user_id as string) ?? null,
      title: r.title as string,
      spot: r.spot as string,
      savings: (r.savings as string | null) ?? null,
      notes: (r.notes as string | null) ?? null,
      emoji: r.emoji as string,
      adminNote: (r.admin_note as string | null) ?? null,
      createdAt: r.created_at as string,
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
  const back = `/admin/pins?status=${form.get("from") ?? "pending"}`;
  const now = new Date().toISOString();

  if (intent === "approve") {
    // Only a pending pin can be approved, so a double click can't pay twice.
    const { data: updated, error } = await supabase
      .from("community_pins")
      .update({ status: "approved", reviewed_at: now, points_awarded: PIN_POINTS, admin_note: null })
      .eq("id", id)
      .eq("status", "pending")
      .select("user_id, title")
      .maybeSingle();
    if (error) return { error: `Couldn't approve: ${error.message}` };
    if (updated) {
      await awardPoints(supabase, updated.user_id as string, "community_pin", PIN_POINTS, `Pin approved: ${updated.title}`, {
        doubleEligible: false,
        awardedBy: "admin",
      });
    }
    return redirect(back);
  }

  if (intent === "reject") {
    const note = ((form.get("note") as string) ?? "").trim().slice(0, 300) || null;
    const { error } = await supabase
      .from("community_pins")
      .update({ status: "rejected", reviewed_at: now, admin_note: note })
      .eq("id", id)
      .eq("status", "pending");
    if (error) return { error: `Couldn't reject: ${error.message}` };
    return redirect(back);
  }

  if (intent === "remove") {
    const { error } = await supabase
      .from("community_pins")
      .update({ status: "removed", reviewed_at: now })
      .eq("id", id)
      .eq("status", "approved");
    if (error) return { error: `Couldn't remove: ${error.message}` };
    return redirect(back);
  }

  return { error: "Unknown action." };
}

const fmt = (iso: string) =>
  new Date(iso).toLocaleString("en-AU", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Australia/Melbourne" });

export default function AdminPins() {
  const { setupNeeded, status, pins } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const busy = useNavigation().state !== "idle";

  return (
    <div className="admin-content">
      <h1 className="admin-h">Community pins</h1>
      <p className="admin-muted" style={{ maxWidth: 680 }}>
        Members' deal finds for the home page corkboard. Approving puts a pin on the board (the 8 newest show) and pays
        the member {PIN_POINTS} pts. Remove approved pins once the deal has ended.
      </p>

      <div className="admin-tabs">
        {STATUSES.map((s) => (
          <Link key={s} to={`/admin/pins?status=${s}`} className={`admin-tab${status === s ? " on" : ""}`}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </Link>
        ))}
      </div>

      {actionData?.error && <div className="wf-error" style={{ margin: "12px 0" }}>{actionData.error}</div>}

      {setupNeeded ? (
        <div className="admin-card" style={{ marginTop: 16 }}>
          <h3>One-time setup</h3>
          <p className="admin-muted">
            Run <code>sql/community_pins.sql</code> in the Supabase SQL editor to create the pins table.
          </p>
        </div>
      ) : pins.length === 0 ? (
        <p className="admin-empty">No {status} pins.</p>
      ) : (
        <div className="admin-pins">
          {pins.map((p) => (
            <div key={p.id} className="admin-card admin-pin">
              <div className="admin-pin-head">
                <span className="admin-pin-emoji">{p.emoji}</span>
                <div style={{ minWidth: 0 }}>
                  <p className="admin-pin-title">{p.title}</p>
                  <p className="admin-muted">
                    {p.spot}
                    {p.savings && <> · <strong>{p.savings}</strong></>} · by{" "}
                    {p.userId ? <Link to={`/admin/users/${p.userId}`}>@{p.username ?? "unknown"}</Link> : "a deleted account"} ·{" "}
                    {fmt(p.createdAt)}
                  </p>
                </div>
              </div>
              {p.notes && <p className="admin-pin-notes">{p.notes}</p>}
              {p.adminNote && <p className="admin-muted">Note: {p.adminNote}</p>}

              {status === "pending" && (
                <div className="admin-pin-actions">
                  <Form method="post">
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="from" value={status} />
                    <button className="btn-pink" name="intent" value="approve" disabled={busy} style={{ fontSize: 13, padding: "8px 16px" }}>
                      Approve (+{PIN_POINTS} pts)
                    </button>
                  </Form>
                  <Form method="post" className="admin-pin-reject">
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="from" value={status} />
                    <input className="fi" name="note" placeholder="Reason (optional, private)" maxLength={300} />
                    <button className="btn-ghost" name="intent" value="reject" disabled={busy}>
                      Reject
                    </button>
                  </Form>
                </div>
              )}
              {status === "approved" && (
                <Form method="post" className="admin-pin-actions">
                  <input type="hidden" name="id" value={p.id} />
                  <input type="hidden" name="from" value={status} />
                  <button className="btn-ghost" name="intent" value="remove" disabled={busy}>
                    Take down (deal ended)
                  </button>
                </Form>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
