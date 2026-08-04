import { Outlet, Link, useLocation } from "react-router";
import { redirect } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { requireAdmin } from "~/lib/auth.server";

export async function loader({ request, context }: LoaderFunctionArgs) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const env = (context as any)?.cloudflare?.env as Env;
  await requireAdmin(request, env);
  return null;
}

const NAV_LINKS = [
  { to: "/admin", label: "Overview", exact: true },
  { to: "/admin/users", label: "Users" },
  { to: "/admin/proof", label: "Proof queue" },
  { to: "/admin/redemptions", label: "Redemptions" },
  { to: "/admin/trivia", label: "Trivia" },
];

export default function AdminLayout() {
  const { pathname } = useLocation();
  return (
    <div className="admin-shell">
      <aside className="admin-side">
        <Link to="/" className="admin-logo">🍀 Luckee</Link>
        <p className="admin-label">Admin</p>
        <nav className="admin-nav">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={`admin-nl${(l.exact ? pathname === l.to : pathname.startsWith(l.to)) ? " on" : ""}`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <form method="post" action="/api/logout" className="admin-logout-wrap">
          <button type="submit" className="admin-logout">Sign out</button>
        </form>
      </aside>
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}
