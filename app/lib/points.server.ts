import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Award points to a user, respecting an active "double points" booster.
 *
 * Inserts a points_ledger row and updates user_profiles.total_points. If the
 * user has a live `double_points_until` window, the awarded amount is doubled
 * (and the description is annotated). Returns the resulting total balance.
 *
 * `monthly_entries` is kept up to date for back-compat but is no longer surfaced
 * in the UI (the gachapon replaced the monthly draw).
 *
 * Pass `doubleEligible: false` to opt a specific award out of the multiplier
 * (e.g. points won from a gachapon capsule, which shouldn't be doubled).
 */
export async function awardPoints(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any, any>,
  userId: string,
  action: string,
  points: number,
  description: string,
  opts: { doubleEligible?: boolean; awardedBy?: string } = {},
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
