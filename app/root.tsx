import {
  isRouteErrorResponse,
  redirect,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useRevalidator,
  useLocation,
  useOutlet,
} from "react-router";
import { useEffect, useState } from "react";
import { LazyMotion, domMax, MotionConfig, m } from "framer-motion";
import { EASE, DUR } from "~/lib/motion";
import type { LoaderFunctionArgs, MiddlewareFunction } from "react-router";
import type { Route } from "./+types/root";
import { useVersionCheck } from "~/hooks/useVersionCheck";
import { DoublePointsBanner } from "~/components/DoublePointsBanner";
import { BottomNav } from "~/components/BottomNav";
import { verifyUser, refreshAndGetUser } from "~/lib/auth.server";
import { userContext } from "~/lib/auth.context";
import { isAdminEmail, isAdminAllowedPath } from "~/lib/admin";
import { getSupabase } from "~/lib/supabase.server";
import "./app.css";

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,700;1,9..144,500;1,9..144,700&family=Nunito:wght@400;500;600;700;800&family=Patrick+Hand&family=Space+Mono:wght@400;700&display=swap",
  },
];

/**
 * Resolve the session exactly once per request, and persist any rotated cookies
 * onto whatever response comes back.
 *
 * Doing this in middleware rather than in the loader fixes three things:
 *   - leaf loaders no longer each run their own refresh, so a rotated refresh
 *     token is never replayed (Supabase revokes the session family for that);
 *   - the rotated cookies survive a redirect thrown by a child loader, which
 *     used to win the response and discard the root loader's Set-Cookie;
 *   - routes can require auth without knowing how the session was obtained.
 */
export const middleware: MiddlewareFunction<Response>[] = [
  async ({ request, context }, next) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const env = (context as any)?.cloudflare?.env as Env;

    let user = await verifyUser(request, env);
    let rotated: string[] | null = null;

    if (!user) {
      const refreshed = await refreshAndGetUser(request, env);
      if (refreshed) {
        user = refreshed.user;
        rotated = refreshed.cookies;
      }
    }

    context.set(userContext, user);

    // The admin account only ever sees the dashboard. Done here rather than per
    // route so a new public route can't accidentally become admin-visible.
    if (isAdminEmail(user?.email) && !isAdminAllowedPath(new URL(request.url).pathname)) {
      return redirect("/admin");
    }

    const response = await next();
    if (rotated && response instanceof Response) {
      rotated.forEach((c) => response.headers.append("Set-Cookie", c));
    }
    return response;
  },
];

export async function loader({ context }: LoaderFunctionArgs) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const env = (context as any)?.cloudflare?.env as Env;
  const user = context.get(userContext);

  let profile: { username: string; totalPoints: number; doublePointsUntil: string | null } | null = null;
  let luckboard: Record<string, string> = {};
  if (user) {
    try {
      const supabase = getSupabase(env);
      const [profileRes, lbRes] = await Promise.all([
        supabase.from("user_profiles").select("username, total_points, double_points_until").eq("id", user.id).single(),
        supabase.from("luckboard").select("item_type, item_slug, status").eq("user_id", user.id),
      ]);
      if (profileRes.data) profile = { username: profileRes.data.username, totalPoints: profileRes.data.total_points, doublePointsUntil: profileRes.data.double_points_until ?? null };
      if (lbRes.data) lbRes.data.forEach(r => { luckboard[`${r.item_type}:${r.item_slug}`] = r.status as string; });
    } catch { /* non-fatal */ }
  }

  return {
    user: user ? { id: user.id, email: user.email! } : null,
    profile,
    luckboard,
  };
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-2VVPKVENLH" />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','G-2VVPKVENLH');`,
          }}
        />
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  const updateAvailable = useVersionCheck();
  const revalidator = useRevalidator();
  const location = useLocation();
  const outlet = useOutlet();

  // Refresh loader data (points balance, booster, etc.) when the user returns to
  // the tab — so admin-awarded points and other server-side changes show up.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") revalidator.revalidate();
    };
    window.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    return () => {
      window.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, [revalidator]);

  return (
    <LazyMotion features={domMax} strict>
      <MotionConfig reducedMotion="user">
        {updateAvailable && (
          <div className="version-banner">
            Luckee has been updated —{" "}
            <button onClick={() => window.location.reload()}>refresh to see the latest</button>
          </div>
        )}
        <DoublePointsBanner />
        {/* Page transition: fade the incoming route in. Opacity-only (transform-free)
            so the sticky nav isn't broken.

            Deliberately no AnimatePresence/exit animation. Keeping the outgoing route
            mounted to animate it out left it re-rendering after the router had already
            moved on, so its useLoaderData() returned undefined and any route that
            destructures it threw (see dinners.tsx). Unmounting immediately avoids the
            whole class of bug. */}
        <m.div
          key={location.pathname}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: DUR.base, ease: EASE }}
        >
          {outlet}
        </m.div>
        <BottomNav />
      </MotionConfig>
    </LazyMotion>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  }

  // Visitors get the friendly page; append ?debug to any URL to see the real
  // message and stack. Resolved after mount so the server and the first client
  // render agree (DEV is a build-time constant, so it's safe to seed with).
  const [showDetail, setShowDetail] = useState(import.meta.env.DEV);
  useEffect(() => {
    if (new URLSearchParams(window.location.search).has("debug")) setShowDetail(true);
  }, []);

  if (showDetail && !isRouteErrorResponse(error) && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  useEffect(() => {
    if (showDetail) console.error("[Luckee] route error boundary:", error);
  }, [showDetail, error]);

  return (
    <div className="wrap" style={{ paddingTop: 80 }}>
      <h1
        style={{
          fontFamily: "'Fraunces', serif",
          fontStyle: "italic",
          fontSize: 40,
          color: "var(--t1)",
          marginBottom: 12,
        }}
      >
        {message}
      </h1>
      <p style={{ color: "var(--t2)", fontSize: 15 }}>{details}</p>
      {stack && (
        <pre
          style={{
            marginTop: 24,
            padding: 16,
            background: "#f8f7f9",
            borderRadius: 12,
            overflowX: "auto",
            fontSize: 12,
          }}
        >
          <code>{stack}</code>
        </pre>
      )}
    </div>
  );
}
