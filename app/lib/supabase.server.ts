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
