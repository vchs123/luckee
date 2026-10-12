-- ─────────────────────────────────────────────────────────────────────────────
-- Re-key deals saved to the Luckboard under the wrong slug
-- Run this in the Supabase SQL editor. Safe to run more than once.
--
-- The Luckboard page finds a deal by its code (bls, krs, …). From the Phase 1
-- home page redesign until the shared ReferralDealCard, the home page saved
-- deals under a name slug instead (blossom, kris, …), so those saves never
-- appeared on the Luckboard page. This moves them onto the code.
--
-- Where someone saved the same deal both ways, the more recently updated row
-- is kept, since that's the status they chose last.
-- ─────────────────────────────────────────────────────────────────────────────

begin;

create temporary table deal_slug_map (old_slug text primary key, new_slug text not null) on commit drop;
insert into deal_slug_map (old_slug, new_slug) values
  ('claude-pro', 'cld'),
  ('blossom',    'bls'),
  ('kris',       'krs'),
  ('revolut',    'rvl'),
  ('macadam',    'mac'),
  ('eatclub',    'eat');

-- Saved both ways, and the name-keyed row is newer: drop the code-keyed one
-- (the update below then moves the newer row onto the code).
delete from luckboard as code_row
using luckboard as name_row, deal_slug_map as m
where name_row.item_type = 'deal' and code_row.item_type = 'deal'
  and name_row.user_id = code_row.user_id
  and name_row.item_slug = m.old_slug and code_row.item_slug = m.new_slug
  and name_row.updated_at > code_row.updated_at;

-- Saved both ways otherwise: the code-keyed row stays, drop the name-keyed one.
delete from luckboard as name_row
using luckboard as code_row, deal_slug_map as m
where name_row.item_type = 'deal' and code_row.item_type = 'deal'
  and name_row.user_id = code_row.user_id
  and name_row.item_slug = m.old_slug and code_row.item_slug = m.new_slug;

-- Move everything left onto the code.
update luckboard as l
set item_slug = m.new_slug
from deal_slug_map as m
where l.item_type = 'deal' and l.item_slug = m.old_slug;

commit;

-- Check: should return no rows. Anything listed is a deal slug the site
-- doesn't recognise.
select item_slug, count(*)
from luckboard
where item_type = 'deal' and item_slug not in ('cld', 'bls', 'krs', 'rvl', 'mac', 'eat')
group by item_slug;
