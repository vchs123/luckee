import { createClient } from "@supabase/supabase-js";

export function getSupabase(env: Env) {
  const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = env;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY");
  }
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false },
  });
}

export function getSupabaseAnon(env: Env) {
  const { SUPABASE_URL, SUPABASE_ANON_KEY } = env;
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_ANON_KEY");
  }
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
  });
}

/**
 * `flowType` defaults to "implicit", which returns tokens in the URL *fragment* —
 * unreadable by a server loader. OAuth therefore needs "pkce" so the provider
 * comes back with a `?code=` the callback can exchange.
 *
 * Magic links deliberately stay on the default. PKCE would tie the sign-in to
 * the browser holding the verifier cookie, breaking the very common case of
 * requesting a link on a laptop and opening it on a phone.
 */
export function getSupabaseAnonWithStorage(
  env: Env,
  storage: object,
  opts: { flowType?: "implicit" | "pkce" } = {},
) {
  const { SUPABASE_URL, SUPABASE_ANON_KEY } = env;
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_ANON_KEY");
  }
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      // persistSession MUST be true or GoTrueClient silently discards the storage
      // adapter above and substitutes an in-memory one (see its constructor), so
      // the PKCE code verifier would never reach the cookie. autoRefreshToken is
      // off because these clients are per-request and must not start timers.
      persistSession: true,
      autoRefreshToken: false,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      storage: storage as any,
      ...(opts.flowType ? { flowType: opts.flowType } : {}),
    },
  });
}
