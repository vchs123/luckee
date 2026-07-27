import {
  data,
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import type { Route } from "./+types/root";
import { useVersionCheck } from "~/hooks/useVersionCheck";
import { verifyUser, refreshAndGetUser } from "~/lib/auth.server";
import { getSupabase } from "~/lib/supabase.server";
import "./app.css";

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,700;1,9..144,500;1,9..144,700&family=Nunito:wght@400;500;600;700;800&display=swap",
  },
];

export async function loader({ request, context }: LoaderFunctionArgs) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const env = (context as any)?.cloudflare?.env as Env;

  let user = await verifyUser(request, env);
  let extraCookies: string[] | null = null;

  if (!user) {
    const refreshed = await refreshAndGetUser(request, env);
    if (refreshed) {
      user = refreshed.user;
      extraCookies = refreshed.cookies;
    }
  }

  let profile: { username: string; totalPoints: number } | null = null;
  if (user) {
    try {
      const supabase = getSupabase(env);
      const { data: p } = await supabase
        .from("user_profiles")
        .select("username, total_points")
        .eq("id", user.id)
        .single();
      if (p) profile = { username: p.username, totalPoints: p.total_points };
    } catch { /* non-fatal */ }
  }

  const payload = {
    user: user ? { id: user.id, email: user.email! } : null,
    profile,
  };

  if (extraCookies) {
    const headers = new Headers();
    extraCookies.forEach((c) => headers.append("Set-Cookie", c));
    return data(payload, { headers });
  }

  return payload;
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
  return (
    <>
      {updateAvailable && (
        <div className="version-banner">
          Luckee has been updated —{" "}
          <button onClick={() => window.location.reload()}>refresh to see the latest</button>
        </div>
      )}
      <Outlet />
    </>
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
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

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
