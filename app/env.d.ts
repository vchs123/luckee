// Bindings that aren't declared in wrangler.jsonc, so `wrangler types` can't see
// them. They're set as Pages environment variables (and in .dev.vars locally).
// Merges with the generated `Env` in worker-configuration.d.ts.
interface Env {
  /** Public Turnstile sitekey. Unset means no widget is rendered anywhere. */
  TURNSTILE_SITE_KEY?: string;
  /**
   * Turnstile secret, for forms the app verifies itself (the contact form).
   * Set as a Pages *secret*, never in code. Email sign-in doesn't use it — that
   * token is verified by Supabase against the copy in its dashboard.
   */
  TURNSTILE_SECRET?: string;
}
