import type { SupabaseClient } from "@supabase/supabase-js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Supabase = SupabaseClient<any, any, any>;

/**
 * True when an RPC failed because the database function doesn't exist yet —
 * i.e. sql/atomic_points.sql hasn't been run. Only then is it safe to fall
 * back: for any other error the call may have gone through, and retrying the
 * old way could award or charge twice.
 */
export function isMissingFunction(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  return error.code === "PGRST202" || error.code === "42883" || /could not find the function/i.test(error.message ?? "");
}

/**
 * Award points to a user, respecting an active "double points" booster.
 * Returns the resulting total balance.
 *
 * Runs as one atomic database step (award_points in sql/atomic_points.sql), so
 * awards landing at the same time can't overwrite each other, and an award
 * can't undo a gachapon charge.
 *
 * `monthly_entries` is kept up to date for back-compat but is no longer surfaced
 * in the UI (the gachapon replaced the monthly draw).
 *
 * Pass `doubleEligible: false` to opt a specific award out of the multiplier
 * (e.g. points won from a gachapon capsule, which shouldn't be doubled).
 */
export async function awardPoints(
  supabase: Supabase,
  userId: string,
  action: string,
  points: number,
  description: string,
  opts: { doubleEligible?: boolean; awardedBy?: string } = {},
): Promise<number> {
  const { doubleEligible = true, awardedBy } = opts;

  const { data, error } = await supabase.rpc("award_points", {
    p_user: userId,
    p_action: action,
    p_points: points,
    p_description: description,
    p_double_eligible: doubleEligible,
    p_awarded_by: awardedBy ?? null,
  });
  if (!error) return data as number;

  if (isMissingFunction(error)) return legacyAwardPoints(supabase, userId, action, points, description, opts);

  // The award may or may not have been applied; don't risk applying it twice.
  console.error(`[points] award_points failed for ${action}:`, error.message);
  const { data: profile } = await supabase.from("user_profiles").select("total_points").eq("id", userId).single();
  return (profile?.total_points as number | undefined) ?? 0;
}

/**
 * The previous read-then-write award, used only until sql/atomic_points.sql has
 * been run. Not safe against concurrent requests.
 */
async function legacyAwardPoints(
  supabase: Supabase,
  userId: string,
  action: string,
  points: number,
  description: string,
  opts: { doubleEligible?: boolean; awardedBy?: string },
): Promise<number> {
  const { doubleEligible = true, awardedBy } = opts;

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("total_points, double_points_until")
    .eq("id", userId)
    .single();

  let awarded = points;
  let desc = description;
  if (doubleEligible && profile?.double_points_until) {
    if (new Date(profile.double_points_until as string).getTime() > Date.now()) {
      awarded = points * 2;
      desc = `${description} (2× booster)`;
    }
  }

  const newTotal = (profile?.total_points ?? 0) + awarded;

  await Promise.all([
    supabase.from("points_ledger").insert({
      user_id: userId,
      action,
      points: awarded,
      description: desc,
      ...(awardedBy ? { awarded_by: awardedBy } : {}),
    }),
    supabase.from("user_profiles").update({
      total_points: newTotal,
      monthly_entries: Math.floor(newTotal / 100),
    }).eq("id", userId),
  ]);

  return newTotal;
}
