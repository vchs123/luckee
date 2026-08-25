export const ADMIN_EMAIL = "luckee.app@gmail.com";

export function isAdminEmail(email: string | null | undefined): boolean {
  return email === ADMIN_EMAIL;
}

/**
 * Paths the admin may still reach while signed in. Everything else redirects to
 * /admin, so the admin account only ever sees the dashboard.
 *
 * Sign-out and the auth callback have to stay reachable or the admin would be
 * locked in with no way back to the public site.
 */
export function isAdminAllowedPath(pathname: string): boolean {
  // Single-fetch requests arrive as "/admin/users.data"; match on the route.
  const path = pathname.replace(/\.data$/, "");
  return (
    path === "/admin" ||
    path.startsWith("/admin/") ||
    path === "/api/logout" ||
    path.startsWith("/auth/")
  );
}
