-- ─────────────────────────────────────────────────────────────────────────────
-- One spin and one trivia attempt per user per day, enforced by the database
-- Run this in the Supabase SQL editor. Safe to run more than once.
--
-- /api/spin and /api/trivia check "already done today?" and then record the
-- attempt. Two requests at the same moment could both pass the check and both
-- be paid. The endpoints now pay only when recording the attempt succeeds;
-- these unique indexes are what make the second insert fail.
--
-- Any duplicate rows that already exist (someone who got in twice before this)
-- would stop the index being created, so the later duplicates are removed
-- first. These rows only mark "attempted today"; removing a duplicate doesn't
-- change anyone's points.
-- ─────────────────────────────────────────────────────────────────────────────

delete from daily_spins a
using daily_spins b
where a.user_id = b.user_id and a.spin_date = b.spin_date and a.ctid > b.ctid;

delete from daily_trivia_attempts a
using daily_trivia_attempts b
where a.user_id = b.user_id and a.trivia_date = b.trivia_date and a.ctid > b.ctid;

create unique index if not exists daily_spins_one_per_day
  on daily_spins (user_id, spin_date);

create unique index if not exists daily_trivia_attempts_one_per_day
  on daily_trivia_attempts (user_id, trivia_date);
