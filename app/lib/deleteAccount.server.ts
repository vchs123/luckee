import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Permanently delete a member: their uploaded proof photos, every row that
 * belongs to them, their profile, and finally their login. Used by the
 * self-serve "Delete my account" on /profile and by the admin.
 *
 * Rows are deleted table by table rather than trusting foreign-key cascades,
 * since most tables were created in the dashboard and their ON DELETE rules
 * aren't recorded in this repo. The login is removed last and only if
 * everything before it succeeded, so a failure can be retried rather than
 * leaving data behind for an account that no longer exists.
 *
 * Members they referred keep their accounts; only the link back is cleared.
 * Their corkboard pins stay up for others to use, with the author removed.
 * Contact-form messages are kept (they're correspondence, and may be the
 * deletion request itself) but unlinked from the account.
 */
const OWNED_TABLES = [
  "proof_submissions", // before points_ledger: it can point at ledger rows
  "community_pin_likes",
  "deal_drop_likes", // likes given while signed in; anonymous ones carry no account
  "luckboard",
  "daily_logins",
  "daily_spins",
  "daily_trivia_attempts",
  "gachapon_pulls",
  "gachapon_redemptions",
  "points_ledger",
] as const;

const PROOF_BUCKET = "proof-submissions";

/** PostgREST's "no such table" (schema cache) and Postgres's undefined_table. */
const MISSING_TABLE = ["PGRST205", "42P01"];

export async function deleteAccount(
  supabase: SupabaseClient,
  userId: string,
  email: string | null | undefined,
): Promise<{ ok: true } | { ok: false; error: string }> {
  // 1. Uploaded photos live under <userId>/ in the proof bucket.
  for (;;) {
    const { data: files, error } = await supabase.storage.from(PROOF_BUCKET).list(userId, { limit: 100 });
    if (error) return { ok: false, error: `Couldn't list uploaded photos: ${error.message}` };
    if (!files || files.length === 0) break;
    const { error: rmError } = await supabase.storage
      .from(PROOF_BUCKET)
      .remove(files.map((f) => `${userId}/${f.name}`));
    if (rmError) return { ok: false, error: `Couldn't remove uploaded photos: ${rmError.message}` };
    if (files.length < 100) break;
  }

  // 2. Rows they own.
  for (const table of OWNED_TABLES) {
    const { error } = await supabase.from(table).delete().eq("user_id", userId);
    // A table whose SQL hasn't been run yet holds nothing to delete.
    if (error && !MISSING_TABLE.includes(error.code)) {
      return { ok: false, error: `Couldn't clear ${table}: ${error.message}` };
    }
  }

  // 3. The dinner waitlist is keyed by email address, not account. Matched
  // case-insensitively (it stores what was typed), with ilike's wildcards escaped.
  if (email) {
    const pattern = email.replace(/[\\%_]/g, (c) => `\\${c}`);
    const { error } = await supabase.from("dinner_waitlist").delete().ilike("email", pattern);
    if (error) return { ok: false, error: `Couldn't clear dinner_waitlist: ${error.message}` };
  }

  // 4. Links from other records.
  const unlink = [
    supabase.from("user_profiles").update({ referred_by: null }).eq("referred_by", userId),
    supabase.from("contact_messages").update({ user_id: null }).eq("user_id", userId),
  ];
  for (const res of await Promise.all(unlink)) {
    if (res.error) return { ok: false, error: `Couldn't unlink records: ${res.error.message}` };
  }

  // Corkboard pins stay, without their author. Before sql/community_pin_likes.sql
  // the column can't be empty (23502), so they're deleted instead, as before.
  const pins = await supabase.from("community_pins").update({ user_id: null }).eq("user_id", userId);
  if (pins.error?.code === "23502") {
    const del = await supabase.from("community_pins").delete().eq("user_id", userId);
    if (del.error) return { ok: false, error: `Couldn't clear community_pins: ${del.error.message}` };
  } else if (pins.error && !MISSING_TABLE.includes(pins.error.code)) {
    return { ok: false, error: `Couldn't unlink pins: ${pins.error.message}` };
  }

  // 5. The profile, then the login.
  const { error: profileError } = await supabase.from("user_profiles").delete().eq("id", userId);
  if (profileError) return { ok: false, error: `Couldn't delete the profile: ${profileError.message}` };

  const { error: authError } = await supabase.auth.admin.deleteUser(userId);
  if (authError) return { ok: false, error: `Couldn't delete the login: ${authError.message}` };

  return { ok: true };
}
