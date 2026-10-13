-- ─────────────────────────────────────────────────────────────────────────────
-- Atomic points: gachapon pulls and point awards
-- Run this in the Supabase SQL editor. Safe to run more than once.
--
-- Every change to a balance used to read total_points, add or subtract in the
-- app, and write the whole number back. Two requests at once could both read
-- the same balance:
--   * two gachapon pulls could pass one balance check (one pull for free);
--   * two awards could land and one would be lost;
--   * an award racing a pull could write back the pre-pull balance and undo
--     the 150-point charge.
--
-- These two functions do the read, the check and the write as one step under a
-- row lock on the user's profile, so concurrent requests for the same user
-- queue up instead of overwriting each other.
--
-- They take a user id as a parameter, so they must never be callable from the
-- browser: execute is revoked from the public roles and granted only to the
-- service role the server uses.
--
-- The app falls back to its previous behaviour until this has been run, so
-- deploying and running this can happen in either order.
-- ─────────────────────────────────────────────────────────────────────────────

-- Add points to a user's balance, applying an active double-points booster
-- when the award is eligible. Returns the new balance.
create or replace function public.award_points(
  p_user uuid,
  p_action text,
  p_points integer,
  p_description text,
  p_double_eligible boolean default true,
  p_awarded_by text default null
) returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_until   timestamptz;
  v_awarded integer := p_points;
  v_desc    text := p_description;
  v_total   integer;
begin
  select double_points_until into v_until
    from user_profiles where id = p_user
    for update;
  if not found then
    raise exception 'award_points: no profile for user %', p_user;
  end if;

  if p_double_eligible and v_until is not null and v_until > now() then
    v_awarded := p_points * 2;
    v_desc := p_description || ' (2× booster)';
  end if;

  update user_profiles
     set total_points    = coalesce(total_points, 0) + v_awarded,
         monthly_entries = floor((coalesce(total_points, 0) + v_awarded) / 100.0)
   where id = p_user
  returning total_points into v_total;

  insert into points_ledger (user_id, action, points, description, awarded_by)
  values (p_user, p_action, v_awarded, v_desc, p_awarded_by);

  return v_total;
end
$$;

-- One gachapon pull. The prize is rolled by the app (so the odds stay in one
-- place, lib/gachapon.ts) and passed in; this function enforces the daily
-- limit, charges a free pull or the points cost, applies the prize and records
-- the pull, all under one lock.
--
-- p_points          points to award if the prize is 'points'
-- p_fallback_points points to award if a double-points prize is downgraded
--                   because a booster is already running
create or replace function public.gachapon_pull(
  p_user uuid,
  p_cost integer,
  p_daily_limit integer,
  p_prize text,
  p_points integer,
  p_fallback_points integer
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile     record;
  v_pulls_today integer;
  v_paid        text;
  v_prize       text := p_prize;
  v_won         integer := null;
  v_balance     integer;
begin
  select total_points, free_pulls, double_points_until into v_profile
    from user_profiles where id = p_user
    for update;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'no_profile');
  end if;

  -- Counted after taking the lock, so a pull that just committed is included.
  select count(*) into v_pulls_today
    from gachapon_pulls
   where user_id = p_user
     and (created_at at time zone 'Australia/Melbourne')::date
       = (now() at time zone 'Australia/Melbourne')::date;
  if v_pulls_today >= p_daily_limit then
    return jsonb_build_object('ok', false, 'error', 'limit', 'limit', p_daily_limit);
  end if;

  -- Pay: a free pull first, otherwise points.
  if coalesce(v_profile.free_pulls, 0) > 0 then
    update user_profiles set free_pulls = free_pulls - 1 where id = p_user;
    v_paid := 'free';
  elsif coalesce(v_profile.total_points, 0) >= p_cost then
    update user_profiles
       set total_points    = total_points - p_cost,
           monthly_entries = floor((total_points - p_cost) / 100.0)
     where id = p_user;
    insert into points_ledger (user_id, action, points, description)
    values (p_user, 'gachapon_pull', -p_cost, 'Gachapon pull');
    v_paid := 'points';
  else
    return jsonb_build_object(
      'ok', false, 'error', 'insufficient',
      'balance', coalesce(v_profile.total_points, 0), 'cost', p_cost
    );
  end if;

  -- One double-points booster at a time: if one is already running, the win
  -- becomes a bonus-points prize instead.
  if v_prize = 'double_points'
     and v_profile.double_points_until is not null
     and v_profile.double_points_until > now() then
    v_prize := 'points';
    v_won := p_fallback_points;
  elsif v_prize = 'points' then
    v_won := p_points;
  end if;

  if v_prize = 'points' then
    -- Gachapon winnings are never doubled by the booster.
    update user_profiles
       set total_points    = total_points + v_won,
           monthly_entries = floor((total_points + v_won) / 100.0)
     where id = p_user;
    insert into points_ledger (user_id, action, points, description)
    values (p_user, 'gachapon_points', v_won, 'Gachapon — won ' || v_won || ' pts');
  elsif v_prize = 'double_points' then
    update user_profiles set double_points_until = now() + interval '24 hours' where id = p_user;
  elsif v_prize = 'bonus_ticket' then
    update user_profiles set free_pulls = coalesce(free_pulls, 0) + 1 where id = p_user;
  end if;

  insert into gachapon_pulls (user_id, prize_type, points_won)
  values (p_user, v_prize, v_won);

  select total_points into v_balance from user_profiles where id = p_user;

  return jsonb_build_object(
    'ok', true, 'prize', v_prize, 'points_won', v_won,
    'paid', v_paid, 'balance', coalesce(v_balance, 0)
  );
end
$$;

-- Server only. The functions take a user id, so a browser holding the public
-- anon key must not be able to call them for someone else.
revoke all on function public.award_points(uuid, text, integer, text, boolean, text) from public, anon, authenticated;
revoke all on function public.gachapon_pull(uuid, integer, integer, text, integer, integer) from public, anon, authenticated;
grant execute on function public.award_points(uuid, text, integer, text, boolean, text) to service_role;
grant execute on function public.gachapon_pull(uuid, integer, integer, text, integer, integer) to service_role;
