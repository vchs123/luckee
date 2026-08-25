import { redirect } from "react-router";
import type { User } from "@supabase/supabase-js";
import { getSupabase, getSupabaseAnon } from "~/lib/supabase.server";

// Custom storage adapter that persists PKCE code verifier across stateless Worker requests via a cookie.
export class CookieStorage {
  private data: Map<string, string>;
  constructor(initial: Record<string, string> = {}) {
    this.data = new Map(Object.entries(initial));
  }
  getItem(key: string): string | null { return this.data.get(key) ?? null; }
  setItem(key: string, value: string): void { this.data.set(key, value); }
  removeItem(key: string): void { this.data.delete(key); }
  serialize(): string { return btoa(JSON.stringify(Object.fromEntries(this.data))); }
  static from(cookie: string | null): CookieStorage {
    if (!cookie) return new CookieStorage();
    try { return new CookieStorage(JSON.parse(atob(cookie))); } catch { return new CookieStorage(); }
  }
}

export function getCookie(request: Request, name: string): string | null {
  const header = request.headers.get("Cookie");
  if (!header) return null;
  const match = header.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

const AT = "luckee_at";
const RT = "luckee_rt";

/**
 * The `__Host-` prefix makes the browser enforce Secure + Path=/ + no Domain, so
 * a sibling subdomain can't plant a session cookie on us. It *requires* Secure,
 * which local dev over http can't set — there we fall back to the bare name.
 */
function authCookieName(base: string, secure: boolean): string {
  return secure ? `__Host-${base}` : base;
}

function isSecureRequest(request: Request): boolean {
  return new URL(request.url).protocol === "https:";
}

/** Prefer the prefixed cookie, falling back to the pre-rename name so sessions
 *  issued before this change keep working until they next refresh. */
export function getAuthCookie(request: Request, base: string): string | null {
  return getCookie(request, `__Host-${base}`) ?? getCookie(request, base);
}

export function authCookies(
  accessToken: string,
  refreshToken: string,
  expiresIn: number,
  request: Request,
): string[] {
  const isSecure = isSecureRequest(request);
  const secure = isSecure ? "; Secure" : "";
  return [
    `${authCookieName(AT, isSecure)}=${encodeURIComponent(accessToken)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${expiresIn}${secure}`,
    `${authCookieName(RT, isSecure)}=${encodeURIComponent(refreshToken)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 24 * 3600}${secure}`,
  ];
}

/** Clears both the prefixed and legacy names — a stale bare cookie left behind
 *  would otherwise keep resurrecting the session via the fallback read above. */
export function clearAuthCookies(): string[] {
  return [AT, RT].flatMap((base) => [
    `${base}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`,
    `__Host-${base}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Secure`,
  ]);
}

export async function verifyUser(request: Request, env: Env): Promise<User | null> {
  const token = getAuthCookie(request, AT);
  if (!token) return null;
  try {
    const supabase = getSupabase(env);
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return null;
    return user;
  } catch {
    return null;
  }
}

export async function refreshAndGetUser(
  request: Request,
  env: Env,
): Promise<{ user: User; cookies: string[] } | null> {
  const rt = getAuthCookie(request, RT);
  if (!rt) return null;
  try {
    const supabase = getSupabaseAnon(env);
    const { data: { session }, error } = await supabase.auth.refreshSession({ refresh_token: rt });
    if (error || !session) return null;
    return {
      user: session.user,
      cookies: authCookies(session.access_token, session.refresh_token!, session.expires_in ?? 3600, request),
    };
  } catch {
    return null;
  }
}

export async function requireAuth(request: Request, env: Env): Promise<User> {
  const user = await verifyUser(request, env);
  if (user) return user;
  const refreshed = await refreshAndGetUser(request, env);
  if (refreshed) return refreshed.user;
  throw redirect("/login");
}

export async function requireAdmin(request: Request, env: Env): Promise<User> {
  const user = await requireAuth(request, env);
  if (user.email !== "luckee.app@gmail.com") {
    throw new Response("Forbidden", { status: 403 });
  }
  return user;
}
