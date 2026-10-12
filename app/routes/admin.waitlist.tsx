import { useLoaderData, Link, Form } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { requireAdmin } from "~/lib/auth.server";
import { getSupabase } from "~/lib/supabase.server";

type Signup = {
  first_name: string;
  last_name: string;
  email: string;
  suburb: string;
  dinner_language: string;
  dietary: string | null;
  age_group: string | null;
  gender: string | null;
  created_at?: string;
};

const COLUMNS: { key: keyof Signup; label: string }[] = [
  { key: "created_at", label: "Signed up" },
  { key: "first_name", label: "First name" },
  { key: "last_name", label: "Last name" },
  { key: "email", label: "Email" },
  { key: "dinner_language", label: "Language" },
  { key: "suburb", label: "Suburb" },
  { key: "dietary", label: "Dietary" },
  { key: "age_group", label: "Age group" },
  { key: "gender", label: "Gender" },
];

/**
 * One CSV cell. Quoted and escaped, and with spreadsheet formulas defused:
 * signups are typed by the public, and a name like `=HYPERLINK(...)` would
 * otherwise run as a formula when the export is opened in Excel or Sheets.
 */
function csvCell(value: unknown): string {
  let s = value == null ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

export async function loader({ request, context }: LoaderFunctionArgs) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const env = (context as any)?.cloudflare?.env as Env;
  requireAdmin(context);

  const url = new URL(request.url);
  const language = url.searchParams.get("language") ?? "";
  const suburb = url.searchParams.get("suburb") ?? "";

  const { data, error } = await getSupabase(env).from("dinner_waitlist").select("*").limit(5000);
  const all = ((data ?? []) as Signup[]).sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));

  const rows = all.filter(
    (r) => (!language || r.dinner_language === language) && (!suburb || r.suburb === suburb),
  );

  if (url.searchParams.get("format") === "csv") {
    const lines = [
      COLUMNS.map((c) => csvCell(c.label)).join(","),
      ...rows.map((r) => COLUMNS.map((c) => csvCell(r[c.key])).join(",")),
    ];
    const stamp = new Date().toISOString().slice(0, 10);
    return new Response(lines.join("\r\n"), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="dinner-waitlist-${stamp}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  }

  const distinct = (key: "dinner_language" | "suburb") =>
    [...new Set(all.map((r) => r[key]).filter(Boolean))].sort();

  return {
    rows,
    total: all.length,
    language,
    suburb,
    languages: distinct("dinner_language"),
    suburbs: distinct("suburb"),
    loadFailed: Boolean(error),
  };
}

export default function AdminWaitlist() {
  const { rows, total, language, suburb, languages, suburbs, loadFailed } = useLoaderData<typeof loader>();
  const filtered = Boolean(language || suburb);
  const csvHref = `/admin/waitlist?${new URLSearchParams({
    ...(language && { language }),
    ...(suburb && { suburb }),
    format: "csv",
  })}`;

  return (
    <div className="admin-content">
      <h1 className="admin-h">Dinner waitlist</h1>
      <p className="admin-muted" style={{ marginBottom: 16 }}>
        {filtered ? `${rows.length} of ${total} signups` : `${total} signups`}
      </p>

      <Form method="get" style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 20 }}>
        <select className="fs" name="language" defaultValue={language} style={{ width: 200 }}>
          <option value="">All languages</option>
          {languages.map((l) => <option key={l} value={l}>{l}</option>)}
        </select>
        <select className="fs" name="suburb" defaultValue={suburb} style={{ width: 200 }}>
          <option value="">All suburbs</option>
          {suburbs.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <button className="btn-pink" type="submit" style={{ fontSize: 13, padding: "8px 16px" }}>Filter</button>
        {filtered && <Link to="/admin/waitlist" className="admin-muted" style={{ textDecoration: "underline" }}>Clear</Link>}
        {/* reloadDocument: a file download, not a client-side navigation. */}
        <Link to={csvHref} reloadDocument className="btn-ghost" style={{ fontSize: 13, padding: "8px 16px", marginLeft: "auto" }}>
          Download CSV
        </Link>
      </Form>

      {loadFailed ? (
        <p className="admin-empty">Couldn't load the waitlist from Supabase.</p>
      ) : rows.length === 0 ? (
        <p className="admin-empty">{filtered ? "No signups match those filters." : "No signups yet."}</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="admin-table" style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {COLUMNS.map((c) => (
                  <th key={c.key} style={{ textAlign: "left", padding: "8px 10px", borderBottom: "1px solid var(--cb)", whiteSpace: "nowrap" }}>{c.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={`${r.email}-${i}`}>
                  {COLUMNS.map((c) => (
                    <td key={c.key} style={{ padding: "8px 10px", borderBottom: "1px solid var(--cb)", whiteSpace: c.key === "dietary" ? "normal" : "nowrap" }}>
                      {c.key === "created_at" && r.created_at
                        ? new Date(r.created_at).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })
                        : c.key === "email"
                          ? <a href={`mailto:${r.email}`} style={{ color: "var(--pink)", fontWeight: 700 }}>{r.email}</a>
                          : (r[c.key] ?? "—")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
