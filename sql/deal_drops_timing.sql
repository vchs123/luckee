-- ─────────────────────────────────────────────────────────────────────────────
-- Deal drops, part 2: when it's on, and what kind of deal it is.
-- Run once in the Supabase SQL editor, after deal_drops.sql. Safe to re-run.
--
--   starts_on / ends_on      first and last day (either can be empty)
--   all_day                  true = no times; false = start_time and end_time
--   category                 free | min_spend | bogo | discount
-- ─────────────────────────────────────────────────────────────────────────────

alter table deal_drops add column if not exists starts_on date;
alter table deal_drops add column if not exists all_day boolean not null default true;
alter table deal_drops add column if not exists start_time time;
alter table deal_drops add column if not exists end_time time;
alter table deal_drops add column if not exists category text not null default 'free';

alter table deal_drops drop constraint if exists deal_drops_category_check;
alter table deal_drops
  add constraint deal_drops_category_check check (category in ('free', 'min_spend', 'bogo', 'discount'));

-- Times only make sense when it isn't all day, and a range can't run backwards.
alter table deal_drops drop constraint if exists deal_drops_times_check;
alter table deal_drops
  add constraint deal_drops_times_check check (all_day or start_time is not null);
alter table deal_drops drop constraint if exists deal_drops_dates_check;
alter table deal_drops
  add constraint deal_drops_dates_check check (starts_on is null or ends_on is null or starts_on <= ends_on);

create index if not exists deal_drops_category_idx on deal_drops (category, published_at desc);
