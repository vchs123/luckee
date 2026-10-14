import { useState, type ReactNode } from "react";
import { Form, Link, redirect, useActionData, useLoaderData, useNavigation, useSearchParams } from "react-router";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { requireAdmin } from "~/lib/auth.server";
import { getSupabase } from "~/lib/supabase.server";
import { deleteAccount } from "~/lib/deleteAccount.server";
import { isAdminEmail } from "~/lib/admin.server";

/*
 * The inactivity policy: members unseen for 6 months get a "come back" email
 * from the admin's Gmail; anyone who still hasn't returned 14 days later can be
 * deleted from here. Coming back at any point clears the reminder (root.tsx).
 *
 * Emails are sent by hand because the server has no way to send mail of its
 * own: Supabase's SMTP only sends its sign-in emails.
 */

const INACTIVE_DAYS = 182; // ~6 months
const GRACE_DAYS = 14;
const DAY = 86400000;

type Member = {
  id: string;
  username: string;
  firstName: string | null;
  email: string | null;
  points: number;
  lastSeen: string | null;
  remindedAt: string | null;
};

export async function loader({ context }: LoaderFunctionArgs) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const env = (context as any)?.cloudflare?.env as Env;
  requireAdmin(context);
  const supabase = getSupabase(env);

  const cutoff = new Date(Date.now() - INACTIVE_DAYS * DAY).toISOString();
  const { data, error } = await supabase
    .from("user_profiles")
    .select("id, username, first_name, total_points, last_seen_at, inactivity_reminded_at")
    .lt("last_seen_at", cutoff)
    .order("last_seen_at", { ascending: true })
    .limit(500);

  if (error) return { setupNeeded: true as const, members: [] as Member[] };

  const members: Member[] = await Promise.all(
    (data ?? []).map(async (p) => {
      const { data: auth } = await supabase.auth.admin.getUserById(p.id as string);
      return {
        id: p.id as string,
        username: p.username as string,
        firstName: (p.first_name as string | null) ?? null,
        email: auth.user?.email ?? null,
        points: (p.total_points as number | null) ?? 0,
        lastSeen: (p.last_seen_at as string | null) ?? null,
        remindedAt: (p.inactivity_reminded_at as string | null) ?? null,
      };
    }),
  );

  return { setupNeeded: false as const, members: members.filter((m) => !isAdminEmail(m.email)) };
}

export async function action({ request, context }: ActionFunctionArgs) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const env = (context as any)?.cloudflare?.env as Env;
  requireAdmin(context);
  const supabase = getSupabase(env);
  const form = await request.formData();
  const intent = form.get("intent");

  if (intent === "remind") {
    const ids = form.getAll("id").map(String).filter(Boolean);
    if (ids.length === 0) return { error: "Nobody to mark." };
    // Only those not already reminded, so a double click doesn't restart anyone's 14 days.
    const { error } = await supabase
      .from("user_profiles")
      .update({ inactivity_reminded_at: new Date().toISOString() })
      .in("id", ids)
      .is("inactivity_reminded_at", null);
    if (error) return { error: `Couldn't mark them as reminded: ${error.message}` };
    return redirect("/admin/inactive");
  }

  if (intent === "delete") {
    const id = String(form.get("id") ?? "");
    // Re-check on the server that the grace period is really over.
    const { data: p } = await supabase
      .from("user_profiles")
      .select("last_seen_at, inactivity_reminded_at")
      .eq("id", id)
      .maybeSingle();
    const reminded = p?.inactivity_reminded_at ? Date.parse(p.inactivity_reminded_at as string) : NaN;
    const seen = p?.last_seen_at ? Date.parse(p.last_seen_at as string) : 0;
    if (!p || Number.isNaN(reminded) || Date.now() - reminded < GRACE_DAYS * DAY || seen > reminded) {
      return { error: "This member isn't due for deletion (not reminded 14 days ago, or they've been back)." };
    }
    const { data: auth } = await supabase.auth.admin.getUserById(id);
    if (isAdminEmail(auth.user?.email)) return { error: "The admin account can't be deleted." };
    const result = await deleteAccount(supabase, id, auth.user?.email);
    if (!result.ok) return { error: `Deletion stopped: ${result.error}` };
    return redirect("/admin/inactive?deleted=1");
  }

  return { error: "Unknown action." };
}

const fmtDate = (iso: string | number) =>
  new Date(iso).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric", timeZone: "Australia/Melbourne" });

function reminderText(deleteOn: string) {
  return {
    subject: `Your Luckee account will be deleted on ${deleteOn}`,
    body: `Hi there,

We haven't seen you on Luckee for over 6 months. To keep your information safe, we delete accounts that haven't been used in that time.

Want to keep your account and your points? Just sign in at luckee-app.pages.dev before ${deleteOn}. Signing in once is all it takes.

Happy to let it go? You don't need to do anything. On ${deleteOn} we'll delete your account and everything linked to it.

Thanks for being part of Luckee!
Luckee, Melbourne

P.S. Found this in Spam? Please mark it "Not spam" so our emails reach you.`,
  };
}

export default function AdminInactive() {
  const { setupNeeded, members } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const busy = navigation.state !== "idle";
  const now = Date.now();

  const toRemind = members.filter((m) => !m.remindedAt);
  const waiting = members.filter((m) => m.remindedAt && now - Date.parse(m.remindedAt) < GRACE_DAYS * DAY);
  const due = members.filter((m) => m.remindedAt && now - Date.parse(m.remindedAt) >= GRACE_DAYS * DAY);
  const deleteOn = fmtDate(now + GRACE_DAYS * DAY);
  const { subject, body } = reminderText(deleteOn);
  const [searchParams] = useSearchParams();
  const deleted = searchParams.has("deleted");

  return (
    <div className="admin-content">
      <h1 className="admin-h">Inactive members <span className="admin-count">{members.length}</span></h1>
      <p className="admin-muted" style={{ maxWidth: 680 }}>
        Members who haven't used Luckee for 6 months. Send them the reminder from your Gmail and mark them as reminded;
        anyone who still hasn't come back {GRACE_DAYS} days later can be deleted. Signing back in clears them from this
        page automatically.
      </p>
      {deleted && <p className="admin-flash">Account deleted.</p>}
      {actionData?.error && <div className="wf-error" style={{ margin: "12px 0" }}>{actionData.error}</div>}

      {setupNeeded ? (
        <div className="admin-card" style={{ marginTop: 20 }}>
          <h3>One-time setup</h3>
          <p className="admin-muted">
            Run <code>sql/account_lifecycle.sql</code> in the Supabase SQL editor. It adds last-seen tracking and fills
            it in from members' existing check-ins and sign-ins.
          </p>
        </div>
      ) : (
        <>
          <section className="admin-card" style={{ marginTop: 20 }}>
            <h3>1. Send a reminder ({toRemind.length})</h3>
            {toRemind.length === 0 ? (
              <p className="admin-empty">Nobody new to remind.</p>
            ) : (
              <>
                <MemberTable members={toRemind} />
                <p className="admin-muted" style={{ marginTop: 16 }}>
                  In Gmail, put the addresses in <strong>Bcc</strong> (so members can't see each other's), paste the
                  subject and message, and send. Then mark them as reminded; deletion opens on <strong>{deleteOn}</strong>.
                </p>
                <div className="admin-inactive-copy">
                  <CopyBlock label="Bcc addresses" text={toRemind.map((m) => m.email).filter(Boolean).join(", ")} />
                  <CopyBlock label="Subject" text={subject} />
                  <CopyBlock label="Message" text={body} multiline />
                </div>
                <Form method="post" style={{ marginTop: 14 }}>
                  <input type="hidden" name="intent" value="remind" />
                  {toRemind.map((m) => (
                    <input key={m.id} type="hidden" name="id" value={m.id} />
                  ))}
                  <button className="btn-pink" type="submit" disabled={busy} style={{ fontSize: 13, padding: "9px 18px" }}>
                    I've sent it: mark {toRemind.length} as reminded
                  </button>
                </Form>
              </>
            )}
          </section>

          <section className="admin-card" style={{ marginTop: 20 }}>
            <h3>2. Reminded, waiting ({waiting.length})</h3>
            {waiting.length === 0 ? (
              <p className="admin-empty">Nobody in their two weeks.</p>
            ) : (
              <MemberTable
                members={waiting}
                extra={(m) => <>Can delete from {fmtDate(Date.parse(m.remindedAt!) + GRACE_DAYS * DAY)}</>}
              />
            )}
          </section>

          <section className="admin-card admin-danger" style={{ marginTop: 20 }}>
            <h3>3. Due for deletion ({due.length})</h3>
            {due.length === 0 ? (
              <p className="admin-empty">Nobody is due.</p>
            ) : (
              <MemberTable
                members={due}
                extra={(m) => (
                  <Form
                    method="post"
                    onSubmit={(e) => {
                      if (!window.confirm(`Permanently delete @${m.username} and all their data?`)) e.preventDefault();
                    }}
                  >
                    <input type="hidden" name="intent" value="delete" />
                    <input type="hidden" name="id" value={m.id} />
                    <button type="submit" className="admin-danger-btn" disabled={busy}>Delete</button>
                  </Form>
                )}
              />
            )}
          </section>
        </>
      )}
    </div>
  );
}

function MemberTable({ members, extra }: { members: Member[]; extra?: (m: Member) => ReactNode }) {
  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Member</th>
            <th>Email</th>
            <th>Points</th>
            <th>Last seen</th>
            {extra && <th />}
          </tr>
        </thead>
        <tbody>
          {members.map((m) => (
            <tr key={m.id}>
              <td>
                <Link to={`/admin/users/${m.id}`}>@{m.username}</Link>
                {m.firstName && <span className="admin-muted"> · {m.firstName}</span>}
              </td>
              <td className="admin-muted">{m.email ?? "—"}</td>
              <td>{m.points.toLocaleString("en-AU")}</td>
              <td className="admin-muted">{m.lastSeen ? fmtDate(m.lastSeen) : "—"}</td>
              {extra && <td>{extra(m)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CopyBlock({ label, text, multiline }: { label: string; text: string; multiline?: boolean }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="admin-copy">
      <div className="admin-copy-head">
        <span>{label}</span>
        <button
          type="button"
          onClick={() =>
            navigator.clipboard
              .writeText(text)
              .then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              })
              .catch(() => {})
          }
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      {multiline ? <pre>{text}</pre> : <p>{text}</p>}
    </div>
  );
}
