import { useLoaderData, Link, Form, useSearchParams } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { requireAdmin } from "~/lib/auth.server";
import { getSupabase } from "~/lib/supabase.server";

export async function loader({ request, context }: LoaderFunctionArgs) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const env = (context as any)?.cloudflare?.env as Env;
  await requireAdmin(request, env);
  const supabase = getSupabase(env);

  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim() ?? "";
  const sort = url.searchParams.get("sort") ?? "pts_desc";
  const tab = url.searchParams.get("tab") ?? "all";

  let query = supabase
    .from("user_profiles")
    .select("id, username, first_name, last_name, total_points, monthly_entries, created_at, profile_complete");

  if (q) {
    query = query.or(`username.ilike.%${q}%,first_name.ilike.%${q}%,last_name.ilike.%${q}%`);
  }

  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
  const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString();

  if (tab === "new") query = query.gte("created_at", monthAgo);

  if (sort === "pts_desc") query = query.order("total_points", { ascending: false });
  else if (sort === "pts_asc") query = query.order("total_points", { ascending: true });
  else if (sort === "new") query = query.order("created_at", { ascending: false });

  const { data: users } = await query.limit(100);

  return { users: users ?? [], q, sort, tab };
}

export default function AdminUsers() {
  const { users, q, sort } = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();

  return (
    <div className="admin-content">
      <h1 className="admin-h">Users <span className="admin-count">{users.length}</span></h1>

      <Form method="get" className="admin-search-bar">
        <input className="fi" type="search" name="q" defaultValue={q} placeholder="Search username, name…" style={{ maxWidth: 300 }} />
        <select className="fs" name="sort" defaultValue={sort} style={{ maxWidth: 180 }}>
          <option value="pts_desc">Points ↓</option>
          <option value="pts_asc">Points ↑</option>
          <option value="new">Newest first</option>
        </select>
        <button className="btn-pink" type="submit" style={{ fontSize: 13, padding: "8px 16px" }}>Search</button>
      </Form>

      <div className="admin-tabs">
        {[["all", "All"], ["new", "New (30d)"]].map(([val, label]) => (
          <Link
            key={val}
            to={`/admin/users?${new URLSearchParams({ ...Object.fromEntries(searchParams), tab: val })}`}
            className={`admin-tab${(searchParams.get("tab") ?? "all") === val ? " on" : ""}`}
          >
            {label}
          </Link>
        ))}
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Name</th>
              <th>Points</th>
              <th>Entries</th>
              <th>Joined</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td><span className="admin-uname">@{u.username}</span></td>
                <td>{u.first_name ? `${u.first_name} ${u.last_name ?? ""}`.trim() : <span className="admin-muted">—</span>}</td>
                <td><strong>{u.total_points ?? 0}</strong></td>
                <td>{u.monthly_entries ?? 0}</td>
                <td className="admin-muted">{new Date(u.created_at).toLocaleDateString("en-AU")}</td>
                <td><Link to={`/admin/users/${u.id}`} className="admin-link">View →</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && <p className="admin-empty">No users found.</p>}
      </div>
    </div>
  );
}
