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

export function authCookies(
  accessToken: string,
  refreshToken: string,
  expiresIn: number,
  request: Request,
): string[] {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return [
    `luckee_at=${encodeURIComponent(accessToken)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${expiresIn}${secure}`,
    `luckee_rt=${encodeURIComponent(refreshToken)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 24 * 3600}${secure}`,
  ];
}

export function clearAuthCookies(): string[] {
  return [
    "luckee_at=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0",
    "luckee_rt=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0",
  ];
}

export async function verifyUser(request: Request, env: Env): Promise<User | null> {
  const token = getCookie(request, "luckee_at");
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
  const rt = getCookie(request, "luckee_rt");
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
