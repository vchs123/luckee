-- ─────────────────────────────────────────────────────────────────────────────
-- Gachapon lucky-draw system
-- Run this in the Supabase SQL editor.
-- ─────────────────────────────────────────────────────────────────────────────

-- Every capsule a user opens.
create table if not exists gachapon_pulls (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  prize_type text not null,   -- food | drink | points | double_points | bonus_ticket | better_luck | grand
  points_won int,             -- only set when prize_type = 'points'
  created_at timestamptz default now()
);
create index if not exists gachapon_pulls_user_idx on gachapon_pulls (user_id);

-- Physical redemption requests (5 of a kind, or 1 grand prize).
create table if not exists gachapon_redemptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  prize_type text not null,   -- food | drink | grand
  units int not null,         -- 5 for food/drink, 1 for grand
  status text not null default 'requested',  -- requested | arranged | collected | cancelled
  dietary_requirements text,
  notes text,                 -- user's preferred times / extra context
  arranged_for text,          -- organiser-set date/time
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists gachapon_redemptions_user_idx on gachapon_redemptions (user_id);
create index if not exists gachapon_redemptions_status_idx on gachapon_redemptions (status);

-- Booster / currency fields on the profile.
alter table user_profiles add column if not exists free_pulls int default 0;
alter table user_profiles add column if not exists double_points_until timestamptz;
