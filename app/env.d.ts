// Bindings that aren't declared in wrangler.jsonc, so `wrangler types` can't see
// them. They're set as Pages environment variables (and in .dev.vars locally).
// Merges with the generated `Env` in worker-configuration.d.ts.
interface Env {
  /** Public Turnstile sitekey. Unset means the login page renders no widget. */
  TURNSTILE_SITE_KEY?: string;
}
