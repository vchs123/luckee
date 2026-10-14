-- ─────────────────────────────────────────────────────────────────────────────
-- Account lifecycle: last-seen tracking for the inactivity policy.
-- Run once in the Supabase SQL editor. Safe to re-run.
--
--   last_seen_at            the last day the member used the site while signed
--                           in (the root loader bumps it at most once a day)
--   inactivity_reminded_at  when the admin sent the "come back" reminder;
--                           cleared automatically when they return
--
-- The admin "Inactive" page lists members unseen for 6 months, records the
-- reminder, and offers deletion 14 days later if they still haven't returned.
-- ─────────────────────────────────────────────────────────────────────────────

alter table user_profiles add column if not exists last_seen_at timestamptz;
alter table user_profiles add column if not exists inactivity_reminded_at timestamptz;

-- Backfill from what we already know: the latest daily check-in, the last
-- sign-in Supabase recorded, or failing both, when the profile was created.
update user_profiles p
set last_seen_at = greatest(
  (select max(l.login_date)::timestamptz from daily_logins l where l.user_id = p.id),
  (select u.last_sign_in_at from auth.users u where u.id = p.id),
  p.created_at
)
where p.last_seen_at is null;

create index if not exists user_profiles_last_seen_idx on user_profiles (last_seen_at);
