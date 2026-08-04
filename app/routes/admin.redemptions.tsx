import { useLoaderData, Link, Form, useNavigation } from "react-router";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { requireAdmin } from "~/lib/auth.server";
import { getSupabase } from "~/lib/supabase.server";
import { PRIZES, type PrizeType } from "~/lib/gachapon";

export async function loader({ request, context }: LoaderFunctionArgs) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const env = (context as any)?.cloudflare?.env as Env;
  await requireAdmin(request, env);
  const supabase = getSupabase(env);

  const url = new URL(request.url);
  const status = url.searchParams.get("status") ?? "requested";

  const { data: redemptions } = await supabase
    .from("gachapon_redemptions")
    .select("*")
    .eq("status", status)
    .order("created_at", { ascending: true })
    .limit(100);

  const rows = redemptions ?? [];
  const userIds = [...new Set(rows.map((r) => r.user_id as string))];
  const { data: profiles } = userIds.length > 0
    ? await supabase.from("user_profiles").select("id, username, first_name, last_name, mobile").in("id", userIds)
    : { data: [] };
  const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]));

  return { redemptions: rows.map((r) => ({ ...r, profile: profileMap[r.user_id as string] ?? null })), status };
}

export async function action({ request, context }: ActionFunctionArgs) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const env = (context as any)?.cloudflare?.env as Env;
  await requireAdmin(request, env);
  const supabase = getSupabase(env);

  const form = await request.formData();
  const id = form.get("id") as string;
  const status = form.get("status") as string;
  const arrangedFor = (form.get("arranged_for") as string)?.trim() || null;

  await supabase.from("gachapon_redemptions").update({
    status,
    arranged_for: arrangedFor,
    updated_at: new Date().toISOString(),
  }).eq("id", id);

  return null;
}

const STATUSES = ["requested", "arranged", "collected", "cancelled"];

export default function AdminRedemptions() {
  const { redemptions, status } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const submitting = navigation.state === "submitting";

  return (
    <div className="admin-content">
      <h1 className="admin-h">Gachapon redemptions</h1>

      <div className="admin-tabs">
        {STATUSES.map((s) => (
          <Link key={s} to={`/admin/redemptions?status=${s}`} className={`admin-tab${status === s ? " on" : ""}`}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </Link>
        ))}
      </div>

      {redemptions.length === 0 ? (
        <p className="admin-empty">No {status} redemptions.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {redemptions.map((r) => {
            const profile = r.profile as { username: string; first_name?: string; last_name?: string; mobile?: string } | null;
            const prize = PRIZES[r.prize_type as PrizeType];
            return (
              <div key={r.id} className="admin-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
                  <div>
                    <p style={{ fontWeight: 800, fontSize: 16, color: "var(--t1)" }}>{prize?.icon} {prize?.label} <span style={{ color: "var(--t3)", fontWeight: 600 }}>×{r.units as number}</span></p>
                    <p className="admin-muted" style={{ marginTop: 4 }}>
                      @{profile?.username ?? "—"}{profile?.first_name ? ` · ${profile.first_name} ${profile.last_name ?? ""}` : ""}{profile?.mobile ? ` · ${profile.mobile}` : ""}
                    </p>
                    <p style={{ fontSize: 13, marginTop: 8 }}><strong>Dietary:</strong> {(r.dietary_requirements as string) || "—"}</p>
                    {r.notes && <p style={{ fontSize: 13, marginTop: 4 }}><strong>Notes:</strong> {r.notes as string}</p>}
                    <p className="admin-muted" style={{ fontSize: 12, marginTop: 6 }}>Requested {new Date(r.created_at as string).toLocaleString("en-AU", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" })}</p>
                  </div>
                </div>

                <Form method="post" style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 14, flexWrap: "wrap" }}>
                  <input type="hidden" name="id" value={r.id as string} />
                  <input
                    className="fi" type="text" name="arranged_for"
                    defaultValue={(r.arranged_for as string) ?? ""}
                    placeholder="Pickup date & time (e.g. Sat 9 Aug, 2pm)"
                    style={{ flex: "1 1 240px", minWidth: 200 }}
                  />
                  <select className="fs" name="status" defaultValue={r.status as string} style={{ width: 150 }}>
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <button className="btn-pink" type="submit" disabled={submitting} style={{ fontSize: 13, padding: "8px 16px" }}>Save</button>
                </Form>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
