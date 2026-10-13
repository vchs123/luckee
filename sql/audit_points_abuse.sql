-- ─────────────────────────────────────────────────────────────────────────────
-- Read-only: did anyone award themselves points through the old endpoints?
-- Run in the Supabase SQL editor. This changes nothing.
--
-- Until the fix, /api/award-points let a signed-in user award any of four
-- actions, any number of times, to any account, and /api/trivia awarded
-- whatever point amount the request named. Useful tells:
--
--   * trivia: the site's own trivia form could never award points (the server
--     couldn't read its form body, so every attempt recorded 0/5). Any trivia
--     award therefore came from a hand-made request.
--   * dinner_waitlist: nothing on the site ever awarded this.
--   * referral_account / referral_deal: legitimately awarded by the server, at
--     most once per referred user — so look for users with more of these than
--     people they actually referred.
--   * deal_click: was unlimited; now once per deal per day.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Awards that only a hand-made request could have produced.
select user_id, action, count(*) as awards, sum(points) as points, min(created_at) as first, max(created_at) as last
from points_ledger
where action in ('trivia', 'dinner_waitlist')
group by user_id, action
order by points desc;

-- 2. Referral awards versus actual referrals (users who signed up with this
--    user as their referrer).
select l.user_id,
       count(*) filter (where l.action = 'referral_account') as referral_account_awards,
       count(*) filter (where l.action = 'referral_deal')    as referral_deal_awards,
       (select count(*) from user_profiles p where p.referred_by = l.user_id) as people_referred
from points_ledger l
where l.action in ('referral_account', 'referral_deal')
group by l.user_id
order by count(*) desc;

-- 3. Deal-click awards per user per Melbourne day (more than 6 means more
--    clicks than there are deals).
select user_id,
       (created_at at time zone 'Australia/Melbourne')::date as day,
       count(*) as clicks_paid,
       sum(points) as points
from points_ledger
where action = 'deal_click'
group by user_id, day
having count(*) > 6
order by clicks_paid desc;

-- 4. Biggest balances, for context.
select id, username, total_points
from user_profiles
order by total_points desc nulls last
limit 20;
