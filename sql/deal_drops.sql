-- ─────────────────────────────────────────────────────────────────────────────
-- Deal drops: short posts about free deals and discounts, written by the admin
-- (Admin → Deal drops), shown at /drops and on the home page. Anyone can like
-- and share them.
-- Run once in the Supabase SQL editor. Safe to re-run.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists deal_drops (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  place text,                     -- venue and/or suburb
  saving text,                    -- e.g. "Free", "Half price"
  body text,                      -- how to get it
  emoji text not null default '🎁',
  image_path text,                -- object in the public deal-drops bucket
  source_url text,                -- where it was found, e.g. an Instagram post
  ends_on date,                   -- last day of the deal, if known
  published boolean not null default true,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint deal_drops_slug_format check (slug ~ '^[a-z0-9-]{3,80}$'),
  constraint deal_drops_title_len check (char_length(title) between 3 and 90),
  constraint deal_drops_place_len check (place is null or char_length(place) <= 60),
  constraint deal_drops_saving_len check (saving is null or char_length(saving) <= 30),
  constraint deal_drops_body_len check (body is null or char_length(body) <= 1500),
  constraint deal_drops_source_url check (source_url is null or (source_url ~ '^https://' and char_length(source_url) <= 500))
);
create index if not exists deal_drops_feed_idx on deal_drops (published, published_at desc);

-- One like per person per drop. Signed-in members are keyed by account
-- ("u:<id>"); everyone else by a random id in a cookie on their browser
-- ("v:<id>"). user_id is set for members, so their likes go with their account.
create table if not exists deal_drop_likes (
  drop_id uuid not null references deal_drops(id) on delete cascade,
  liker text not null check (liker ~ '^[uv]:[0-9a-f-]{36}$'),
  user_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (drop_id, liker)
);
create index if not exists deal_drop_likes_user_idx on deal_drop_likes (user_id);

-- Server only: row-level security with no policies.
alter table deal_drops enable row level security;
alter table deal_drop_likes enable row level security;

-- Photos: a public bucket (images are shown on the site and in link previews).
-- Uploads go through the server with the service-role key; 5 MB, images only.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('deal-drops', 'deal-drops', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = true,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
