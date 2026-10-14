-- ─────────────────────────────────────────────────────────────────────────────
-- Community pins, part 2: likes, and pins that outlive their author.
-- Run once in the Supabase SQL editor, after community_pins.sql. Safe to re-run.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. When a member deletes their account, their approved pins stay on the
--    board without their name: the author link is cleared instead of the pin
--    being deleted with them.
alter table community_pins alter column user_id drop not null;
alter table community_pins drop constraint if exists community_pins_user_id_fkey;
alter table community_pins
  add constraint community_pins_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete set null;

-- 2. Likes: one per member per pin. They go with the pin, and with the member
--    who gave them.
create table if not exists community_pin_likes (
  pin_id uuid not null references community_pins(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (pin_id, user_id)
);
create index if not exists community_pin_likes_user_idx on community_pin_likes (user_id);

-- Server only, like the pins themselves.
alter table community_pin_likes enable row level security;
