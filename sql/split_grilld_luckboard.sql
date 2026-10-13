-- ─────────────────────────────────────────────────────────────────────────────
-- Give Grill'd's sign-up bonus its own Luckboard status
-- Run this in the Supabase SQL editor. Safe to run more than once.
--
-- Grill'd's birthday freebie and its sign-up bonus both saved under the key
-- `grill-d`, so marking one marked both. The sign-up bonus now saves as
-- `grill-d-signup`. An existing `grill-d` save could have come from either
-- card and there's no way to tell which, so its status is copied to the
-- sign-up offer as well: nothing anyone saw disappears, and they can unmark
-- whichever they didn't mean.
-- ─────────────────────────────────────────────────────────────────────────────

insert into luckboard (user_id, item_type, item_slug, status, updated_at)
select user_id, item_type, 'grill-d-signup', status, updated_at
from luckboard
where item_type = 'freebie' and item_slug = 'grill-d'
on conflict (user_id, item_type, item_slug) do nothing;

-- Check: how many saves now exist for each Grill'd offer.
select item_slug, count(*)
from luckboard
where item_type = 'freebie' and item_slug in ('grill-d', 'grill-d-signup')
group by item_slug;
