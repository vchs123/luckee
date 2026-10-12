-- ─────────────────────────────────────────────────────────────────────────────
-- Turn on row-level security for every table the app uses
-- Run this in the Supabase SQL editor.
--
-- With RLS off, Supabase's public API lets anyone holding the project's anon
-- key read and write every row: other users' names, mobiles and birthdays, the
-- points ledger, prize redemptions. The anon key is meant to be public, so it
-- isn't a lock on its own.
--
-- RLS on with *no* policies means the anon key can't read or write these
-- tables at all. That doesn't affect the app: every table query in the code
-- goes through the service-role key (getSupabase in app/lib/supabase.server.ts),
-- which bypasses RLS, and the anon key is only used for sign-in calls. The seed
-- script uses the service-role key too.
--
-- Safe to run more than once.
-- ─────────────────────────────────────────────────────────────────────────────

alter table if exists user_profiles         enable row level security;
alter table if exists proof_submissions     enable row level security;
alter table if exists trivia_questions      enable row level security;
alter table if exists points_ledger         enable row level security;
alter table if exists luckboard             enable row level security;
alter table if exists gachapon_redemptions  enable row level security;
alter table if exists gachapon_pulls        enable row level security;
alter table if exists daily_logins          enable row level security;
alter table if exists posts                 enable row level security;
alter table if exists daily_trivia_attempts enable row level security;
alter table if exists daily_spins           enable row level security;
alter table if exists dinner_waitlist       enable row level security;
alter table if exists contact_messages      enable row level security;

-- Check: this should return no rows. Anything listed still has RLS off — for
-- example a table created outside this app, worth looking at individually.
select tablename
from pg_tables
where schemaname = 'public' and not rowsecurity
order by tablename;
