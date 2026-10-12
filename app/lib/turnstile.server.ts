/**
 * Server-side Turnstile check, for forms Luckee handles itself. (Email sign-in
 * is different: Supabase verifies that token, so the login action passes it on
 * instead of calling this — a token can only be redeemed once.)
 *
 * The check is only enforced once the widget is configured: with no
 * TURNSTILE_SITE_KEY the widget isn't rendered, so there is no token to demand.
 * Once it is configured, this fails closed — a missing secret, a network error
 * or any mismatch rejects the request.
 */
export async function verifyTurnstile(
  env: Env,
  request: Request,
  token: FormDataEntryValue | null,
  expectedAction: string,
): Promise<boolean> {
  if (!env.TURNSTILE_SITE_KEY) return true;

  if (!env.TURNSTILE_SECRET) {
    console.error("[turnstile] TURNSTILE_SITE_KEY is set but TURNSTILE_SECRET is not; rejecting");
    return false;
  }
  if (typeof token !== "string" || token.length === 0 || token.length > 2048) return false;

  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      signal: AbortSignal.timeout(10_000),
      body: new URLSearchParams({
        secret: env.TURNSTILE_SECRET,
        response: token,
        remoteip: request.headers.get("CF-Connecting-IP") ?? "",
      }),
    });
    if (!res.ok) return false;
    const result = (await res.json()) as { success?: boolean; action?: string; hostname?: string };
    // The hostname must be the one this request arrived on, so a token minted on
    // another site using our sitekey can't be replayed here. It follows each
    // deployment automatically: localhost in dev, the preview or production
    // pages.dev host in Cloudflare.
    return (
      result.success === true &&
      result.action === expectedAction &&
      result.hostname === new URL(request.url).hostname
    );
  } catch {
    return false;
  }
}
