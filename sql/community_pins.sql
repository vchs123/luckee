-- ─────────────────────────────────────────────────────────────────────────────
-- Community pins: members' deal finds for the home page corkboard.
-- Run once in the Supabase SQL editor. Safe to re-run.
--
-- A signed-in member submits a pin (pending). The admin approves it (it
-- appears on the corkboard and the member gets points) or rejects it. Approved
-- pins can later be removed when the deal ends.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists community_pins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  spot text not null,              -- venue or suburb
  savings text,                    -- e.g. "Half price", "$5 off"
  notes text,                      -- how to get it: days, times, what to show
  emoji text not null default '📌',
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'removed')),
  admin_note text,                 -- admin's private reason on rejection
  points_awarded integer,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint community_pins_title_len check (char_length(title) between 3 and 80),
  constraint community_pins_spot_len check (char_length(spot) between 2 and 60),
  constraint community_pins_savings_len check (savings is null or char_length(savings) <= 30),
  constraint community_pins_notes_len check (notes is null or char_length(notes) <= 400)
);

create index if not exists community_pins_status_idx on community_pins (status, created_at desc);
create index if not exists community_pins_user_idx on community_pins (user_id, created_at desc);

-- Server only: row-level security with no policies means the public anon key
-- can neither read nor write; the server uses the service-role key.
alter table community_pins enable row level security;
