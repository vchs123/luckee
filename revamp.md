# Luckee v2 design revamp

**Created:** 2026-09-26 15:36 AEST
**Last updated:** 2026-10-12
**Status:** Phase 1 (home) shipped in `55507d6`. Phase 2 (freebies) shipped in `6109019`. Phase 3 (deals) shipped in `6d68ccc`. Phase 4 (Luckboard) shipped in `00e3b7f`. Phase 5 (Rewards + gachapon) shipped in `d3e2ad3`. Phase 6 (shell + referral page) shipped.
**Scope:** customer-facing pages only — the admin dashboard is not touched

---

## Context

`v2 design/` is a client-only Vite SPA exported from Google AI Studio. It has a much stronger visual design than the live site (mascot, tactile cards, sound, richer sections) but no server at all: every piece of state is `localStorage`, offers come from static files, and there is no auth, referral, or persistence. The live app (`app/`, React Router 7 SSR on Cloudflare Workers + Supabase) has all the functionality and weaker visuals.

The goal is to move the v2 *design* onto the live app, keeping the live app's loaders, actions, auth and database as the source of truth. We are not adding auth to v2; v2 is a skin, and the skin comes to us.

Two discoveries make this far cheaper than a normal port:

- **Tailwind 4 is already installed and active** in the live app — `@tailwindcss/vite` in `vite.config.ts` and `@import "tailwindcss" source(".")` at `app/app.css:1`. No setup needed; v2 markup pastes in and works.
- **v2 was built from the live app's own data and tokens.** `v2 design/src/data/luckeeData.ts` holds the same records as `app/data/*.ts` with identical terse field names (`e, n, pg, r, m, t, c, ns, cat, verified, link`), and `v2 design/src/index.css` declares the same CSS custom properties with the same values (`--pink: #e91e8c`, `--t1: #1e0a2e`, `--mx: 1080px`, …).

So this is a restyle of existing components against existing data — not a rebuild.

## Decisions

- **Freebies IA:** keep all five `/freebies/*` routes. v2's tab bar becomes `<Link>`s, not `useState`, so switching feels instant but every category keeps its own URL, H1 and sitemap entry. Filters stay *within* a page. (Phase 2 — recorded so it doesn't get collapsed.)
- **Corkboard:** design only. Render approved posts from a static seed; the submit form is visible but disabled/"coming soon". No table, no submission flow, no admin approval queue yet.
- **Styling:** build on the Tailwind that is already there; `app.css` gets retired gradually, later.
- **Sequencing:** page by page, home first.
- **Admin is untouched.** No file under `app/routes/admin*` changes in any phase.
- **Hero copy stays as it is now** — "Irresistible deals, freebies and mystery prizes", no subtitle (changed in `3827d65`/`302af22`). We take v2's hero *layout*, not its "Thrift Melbourne like a local legend" copy.
- **One currency.** v2 has a `tokens` number in `localStorage` starting at 3. The live app has points plus gachapon pulls. Ported UI reads `profile.totalPoints` from the root loader via `useAuth`; we do not introduce a second currency.

---

## Phase 1 — home page ✅ shipped in `55507d6`

### Step 0 — shared foundation

- [x] Add `lucide-react` (13 icons used across home: `ArrowRight, Bookmark, Coins, Compass, Gift, Heart, MapPin, Search, Sparkles, Tag, Volume2, VolumeX, X`). Defer `canvas-confetti` — only `GachaponMachine.tsx` needs it, which is a later phase.
- [x] Add the extra font families v2 uses to `app/root.tsx` `links()` (Fraunces + Nunito already load). Check which `.font-*` classes the ported components actually reference before adding `Fredoka`, `Space Mono`, `Patrick Hand`, `Syne`.
- [x] Copy *only the additions* from `v2 design/src/index.css` into `app/app.css` — the `.font-*` helpers and keyframes. **Do not** copy its `:root` token block (identical to ours) or its `.btn-pink`/button rules (we already define those; duplicates would fight our versions).
- [x] **Motion normalisation (mandatory).** `app/root.tsx` wraps the app in `<LazyMotion features={domMax} strict>`; under `strict`, rendering a full `motion.*` component throws. Every ported component must import `{ m }` (and `AnimatePresence`) from `framer-motion` and use `m.div`, not `motion.div` from `motion/react`. 8 files this phase, ~22 eventually.
- [x] Copy `v2 design/src/utils/soundEffects.ts` → `app/lib/soundEffects.ts` (already SSR-safe: guards `typeof window === 'undefined'`, lazily creates `AudioContext`), then reconcile with the existing `app/lib/sound.ts` so there is one module, not two.
- [x] ~~Copy `v2 design/public/luckee-mascot.svg` → `public/`~~ — not needed: `LuckeeMascot` draws the cat as inline SVG, and the file is referenced nowhere, so it was removed again rather than left as a dead asset.
- [x] Copy shared presentational components into `app/components/`, applying the motion fix: `mascot/LuckeeMascot.tsx`, `mascot/LuckeeMascotToken.tsx`, `common/SvgIcons.tsx`, `common/LuckeeStamp.tsx`.

### Step 1 — home page (`app/routes/_index.tsx`)

Keep the existing `meta` export, the `/search?q=` submit behaviour, `Particles`, and the scroll-reveal setup (`app/lib/scrollReveal.ts`, `reducedMotion.ts`, `motion.ts`). Replace section bodies in v2's order (see `v2 design/src/App.tsx` lines ~195-265):

- [x] **1. Hero** — port `Hero.tsx`: split card + mascot stage + 4 quick-action cards, replacing the current `.hero` block. Cards become `<Link>`s, not `<button>`s. Keep our current headline and the six `.hcat` destinations.
- [x] **2. Referral/affiliate deals** — port `OrigamiCoupons.tsx` in place of `DealExplosion`. Read `app/data/deals.ts` (`Deal`), not `ORIGAMI_COUPONS`. Bookmark → `POST /api/luckboard`; signed out → link to `/login`.
- [x] **3. Top picks** — port `TopPicksFreebies.tsx` over "Today's best freebies". v2 hardcodes its brand list inline; rewire to the existing `TOP_PICKS` from `BDAY_FOOD` / `BDAY_BEAUTY`.
- [x] **4. Free Melbourne** — port `FreeMelbourneSection.tsx`, rewired to `MELB_TRANSPORT` / `MELB_CULTURE` (`MELB_SAMPLE`).
- [x] **5. Dinners** — port `DinnersSection.tsx` over the `.tsr` teaser. `/dinners` stays the real waitlist; the section links there. Do not duplicate the waitlist form inline.
- [x] **6. Rewards banner** — port `RewardsBannerSection.tsx` over the `.ecs` earn cards. CTAs to `/login` and `/rewards`; show real `totalPoints` when signed in.
- [x] **7. Corkboard (new, design only)** — port `CorkboardCommunity.tsx`. Seed `COMMUNITY_POSTS` into `app/data/community-posts.ts`; form disabled; drop the `onEarnToken` token-granting path.

Leave `Nav`, `BottomNav` and `Footer` alone this phase. v2's `Header` adds a points pill, vault button and sound toggle, and its `BottomNav` differs — later phase. v2's header has no nav menu, which matches the menu removal already shipped.

### Notes from the build

- **Cascade bug found and fixed.** `a { color: inherit }` sat *unlayered* in `app.css`, and unlayered CSS beats everything in a `@layer`, so it silently defeated every Tailwind text-colour utility on a link (the external-link icon on the deal cards rendered black-on-black). The element defaults now live in `@layer base`. This would have broken every link colour across the whole port.
- **Deal-click tracking de-duplicated.** `DealCard`, `DealRow` and `DealTile` each carried their own copy of the gtag + `/api/track-click` + `/api/award-points` calls; they now share `app/lib/dealClick.ts`, which the new card uses too.
- **Corkboard content rewritten.** v2's seed posts were fabricated community activity — invented people, vote counts and "8 mins ago" timestamps. Publishing those as real would be misleading, so `app/data/community-posts.ts` holds clearly-labelled *example* pins with no author names, counts or timestamps, and the page says pinning opens later.
- **Sound stayed opt-in.** v2 played audio by default; the merged `app/lib/sound.ts` keeps the existing `luckee_sound` preference, so the site is silent until someone turns it on.
- **Free Melbourne keeps `ExperienceCard`** (and its Luckboard save toggle) inside the new section chrome; those cards get restyled with the freebies pages in Phase 2 so home and category pages stay consistent.

### Verification

- [x] `npm run typecheck` clean.
- [ ] `npm run dev`, load `/`: no console errors and no hydration mismatch warnings.
- [x] View source on `/` — section content present in the served HTML, confirming SSR (a regression here means a browser-only call slipped into render).
- [ ] Signed out: hero, all seven sections, CTAs point to `/login`, bookmark prompts sign-in. Signed in: real points render; bookmarking a deal persists — row lands in `luckboard` and survives a reload.
- [x] Search from the hero still reaches `/search?q=…`.
- [ ] ~400px wide: no horizontal scroll; check the 2×2 quick-action grid and bottom-nav clearance (`body` has `padding-bottom: calc(64px + env(safe-area-inset-bottom))`).
- [ ] OS "reduce motion" on: animations settle without motion, nothing disappears.
- [x] Click through `/freebies/*`, `/deals`, `/dinners`, `/rewards`, `/luckboard`, `/profile` — unchanged and unbroken.
- [x] `git status` shows nothing under `app/routes/admin*`.

---

## Phase 2 — the five freebies pages ✅ shipped in `6109019`

`/freebies/birthday-freebies` carries the highest sitemap priority on the site (1.0), so this is the surface that matters most after the home page.

The port is cheap for the same reason Phase 1 was: v2's `AllFreebiesPage` renders **our exact class names** (`fc`, `fc-stripe`, `fc-b`, `fc-top`, `fc-rw`, `fc-rl`, `fc-rv`, `fc-dt`, `bn bn-ok`, `fc-cta`, and `xc-*`). It is our card with three additions — brand SVGs instead of emoji, lucide icons on the detail rows, and the paper-lift shadow. Mostly three card components and a shared tab bar, not a page rewrite.

Two pre-existing problems get fixed on the way through:

- **Filter pills never update the URL.** `freebies.birthday-freebies.tsx` seeds `filter` from `?filter=` and re-syncs on change, but `FilterBar`'s `onChange` only calls `setFilter`. So `?filter=food` works as an entry link (the hub tiles and the new hero cards both use it), yet filtering in the UI leaves the URL untouched — the view can't be shared, and it isn't server-rendered. The verified-only toggle has the same problem and is duplicated verbatim in two routes.
- **`.fc-ft` is declared twice** in `app.css` (~line 230 and again ~968), the second silently winning.

### Decisions

- **Five tabs, one per page.** Food & Drink and Beauty point at `/freebies/birthday-freebies` with a filter; Sign-up, Free Melbourne and Events point at their own routes. Tabs are `<Link>`s — instant client navigation, every category keeps its URL, H1 and sitemap entry.
- **Save control:** `LuckboardToggle` (want / done / not for me) stays for signed-in users; signed-out users get a bookmark linking to `/login`, as on the home page deal cards.
- **Scope:** all five pages together — they share a layout, a card and a tab bar.
- **Admin untouched.**

### Step 1 — shared chrome in the layout

- [x] **`app/components/FreebiesTabs.tsx`** (new): the five tabs as v2's pill row (`AllFreebiesPage.tsx` ~117-139) — active `bg-[var(--pink)] text-white`, inactive white with `border-[#ec489922]`, horizontally scrollable on phones. Active state from `useLocation().pathname` + `useSearchParams().get("filter")` so Food and Beauty light up correctly on the shared route. Label counts come from the data files' `.length`, not hardcoded (the hub's `HUBS` array hardcodes "21 offers · 9 verified" and will drift).
- [x] **`app/components/Breadcrumb.tsx`** (new): replaces the inline `<p>Freebies → …</p>` copied into all four leaf routes.
- [x] Render both from `app/routes/freebies-layout.tsx`, which is currently just `<Nav /><Outlet /><Footer />`.

### Step 2 — filters become URL state

- [x] `?filter=food | beauty | nospend` (absent = all) — keep the existing param name and values; the hub tiles and hero cards already link to them.
- [x] `?verified=1` replaces the duplicated `verifiedOnly` state in `freebies.birthday-freebies.tsx` and `freebies.sign-up-freebies.tsx`.
- [x] `?q=` for v2's in-page brand search (new; filters the current page's list only, not the site-wide `/search`).
- [x] Restyle `FilterBar.tsx` — keep its `framer-motion` `layoutId="filter-pill-bg"` sliding pill, and fold the verified toggle into the same control strip, as v2 does.
- [x] **SEO:** each route keeps a canonical pointing at its clean path, so `?filter=beauty` stays shareable but consolidates to the base page. Add the missing canonical to `freebies._index.tsx` — the only one of the five without one.

### Step 3 — the three cards

- [x] **`FreebieCard.tsx`** — `renderBrandOrEmojiSvg(f.e, 24)` in place of the emoji (already in `SvgIcons.tsx` from Phase 1, with the emoji fallback), lucide `Smartphone` / `Calendar` / `Check` / `AlertTriangle` on the `m` / `t` / `c` rows, `shadow-paper-lift hover:shadow-paper-hover` (already in `app.css`). Keep `.fc-bday-cd` and the `daysUntilBirthday` prop. Keep `LuckboardToggle` in `.fc-ft`; add the signed-out `/login` bookmark beside it.
- [x] **`ExperienceCard.tsx`** — same icon and shadow treatment; also render `x.t`, which is typed but currently dropped, as v2 does.
- [x] **`EventCard.tsx`** — no v2 equivalent; matching icon and shadow treatment so the three cards read as one set. No Luckboard integration this phase.

### Step 4 — the five routes

- [x] `freebies._index.tsx` — hub tiles keep their layout; counts read from data; canonical added.
- [x] `freebies.birthday-freebies.tsx` — drop the inline breadcrumb and the per-route toggle markup; keep the `meta`, H1 and the `daysUntilBirthday` loader untouched.
- [x] `freebies.sign-up-freebies.tsx` — same, with its verified toggle now shared.
- [x] `freebies.free-melbourne.tsx` — keeps the list/map toggle and the lazily loaded Leaflet map; restyle those buttons to match the tabs.
- [x] `freebies.events-calendar.tsx` — breadcrumb and cards only.

**Note on the shadow.** v2's `shadow-paper-lift` carries a hard black offset (`4px 4px 0 0 #000`). That reads as a deliberate cut-paper edge on the corkboard's bordered post-its, but on these soft white cards over a pink gradient it looked like a rendering fault. The cards use a `.card-lift` class instead: the same lift, no black. It sits after `.fc:hover` in the stylesheet, so it also supersedes the old 4px-plus-scale hover with a calmer 2px lift.

**Note on `.fc-cta`.** Adding the external-link icon made the button wrap onto two lines — it was a plain block with padding. It is now `inline-flex` with `white-space: nowrap`.

### Cleanup

- [x] Collapse the duplicate `.fc-ft` in `app.css` — the two declarations turned out to be *additive*, not conflicting: the second only added `gap: 10px` and never redeclared `justify-content`, the padding or the border. Merged into one rule rather than deleting either, which would have changed the card footer layout.
- [x] Leave `.lb-toggle*` / `.lb-popover*` alone — `LuckboardToggle` is reused by `/luckboard` and admin.
- [x] Removed `.vtog*` (5 lines) — the verified-only toggle it styled is gone from both routes and nothing else referenced it. `.hcat`, `.xc-tag.blue`, `.ssh.evnt`, `.ssh.sgn`, `.fc.melb`, `.fc.evnt` left alone for now.

### Phase 2 verification

- [x] `npx tsc -b` clean.
- [ ] `npm run dev`; all five pages 200, no console errors, no hydration warnings.
- [ ] **URL round-trip:** click Food & Drink → URL becomes `?filter=food`; reload → same view, server-rendered; paste the URL into a fresh tab → same view; back/forward steps through filter states. Same for `?verified=1` and `?q=`.
- [x] **View source** on `/freebies/birthday-freebies?filter=beauty` — only beauty offers in the served HTML, proving the filter is SSR-visible rather than applied after hydration.
- [x] Canonical is the clean path on both filtered and unfiltered views; `/freebies` now has one.
- [x] Tabs: every page reachable from every page, correct tab active on each — including Food vs Beauty on the shared route.
- [ ] Signed out: bookmark links to `/login`. Signed in: the four-state toggle still writes to `luckboard` and survives a reload.
- [ ] Free Melbourne: list/map toggle works, Leaflet still loads client-side only.
- [ ] ~400px wide: tab row scrolls horizontally, no page-level horizontal scroll. (Headless Chrome floors at ~500px on macOS — check a real phone.)
- [x] `git status` shows nothing under `app/routes/admin*`.

## Phase 3 — the Deals page ✅ shipped in `6d68ccc`

`/deals` is now the most visibly mismatched page: the home page's referral cards already wear the v2 design, and `/deals` still renders the old `DealRow`.

v2's deals page (`SecretCouponsPage`) is built for dozens of coupons — search, a category dropdown, a Normal/List toggle and pagination at five per page. There are **six** deals, so that machinery would make the page worse (pagination alone would split six deals over two pages). Taken: the header banner with the Luckee stamp spotlight, and the card. Left for when there are ~15+ deals: search, categories, list view, pagination.

v2's card (`CleanReferralCard`) is the same design already ported for the home page in Phase 1, so this phase **extracts that card into one shared component** instead of building a third deal card.

### Found while planning

- **Luckboard bug from Phase 1.** The Luckboard page finds deals by their code (`slug: d.cls`, e.g. `bls`), and `DealRow` saves them that way, but the home page cards (`ReferralDeals.tsx`) have saved them as `slugify(d.n)` (`blossom`) since `55507d6`. A deal saved from the home page never showed up on the Luckboard page, and didn't show as saved on `/deals`.
- **The home card hides Revolut's instruction.** The bonus requires DMing Luckee on Instagram *before* signing up. That instruction lives in `rl` and at the end of `desc`, and the home card shows neither — the description is clamped to two lines.
- **Dead code.** `DealCard`, `DealTile` and `DealExplosion` have had no users since Phase 1, and `DealRow` won't after this phase. The Blossom tiers and logo map are duplicated across them.
- **Anchors in use.** `search.tsx` links results to `/deals#${d.cls}`, so every card on `/deals` must keep `id={d.cls}`.

### Decisions

- One shared card, `app/components/ReferralDealCard.tsx`, used by both pages: compact on the home page, full on `/deals`.
- Luckboard slug is always `d.cls`, matching the Luckboard page and existing saved data.
- Keep the H1 "Deals I recommend", the `meta` export and the canonical.
- Keep Claude Pro on `/deals` (the home page leaves it out, as before).
- The Blossom regulatory disclaimer ("Target returns are not guaranteed. Not a bank. Read the PDS…") stays on the full card — it is a financial product.

### Step 1 — shared card

- [x] Create `ReferralDealCard` from the home page card: logo tile (one shared `LOGO_MAP`), stamp, name, reward, **the `rl` line on both variants** (fixes the hidden Revolut instruction), referral-code copy button, Luckboard toggle keyed by `d.cls` (signed-out users get the `/login` bookmark), and the outbound link through `trackDealClick`.
- [x] Full variant adds: expandable description ("See more"), Blossom tiers + disclaimer, every tag, the deal's own CTA text, and `id={d.cls}` for the search anchors.
- [x] Signed-in clicks award points through a fetcher and show the "+N pts" toast `DealRow` showed, on both pages.

### Step 2 — pages

- [x] Home: `ReferralDeals.tsx` renders the shared card (compact).
- [x] `/deals`: v2 header banner with the stamp spotlight, then all six deals in a grid of full cards.

### Step 3 — data fix

- [x] `sql/fix_deal_luckboard_slugs.sql`: re-key rows saved under `blossom`, `kris`, `revolut`, `macadam`, `eatclub`, `claude-pro` to their codes. Where a user has both, keep the more recently updated row.

### Cleanup

- [x] Delete `DealCard`, `DealTile`, `DealExplosion`, `DealRow`.
- [x] Delete their CSS (`.dc-*`, `.dl-*`, `.dlx-*`, `.bls-*`, …) — only after checking nothing else references each family.

**Built-in extras.** "See more" only appears when the description is actually cut off (measured after mount and on resize) — a button that expanded nothing looked broken. Cleanup removed 119 dead CSS rules and three unused animations; three rules shared with live selectors (`.btn-pink`, `.fc-cta`) were trimmed, not deleted.

### Phase 3 verification

- [x] `npx tsc -b` clean; `/deals` and `/` render server-side with all cards present.
- [x] Search result links (`/deals#bls` etc.) land on the right card.
- [x] Revolut's Instagram instruction is visible on both pages.
- [x] The Blossom disclaimer is present on `/deals`.
- [x] Signed in: saving a deal from either page shows up on `/luckboard` — confirmed on the live site.
- [x] ~500px wide: cards stack, nothing overflows.
- [x] Nothing under `app/routes/admin*` touched.

---

## Phase 4 — the Luckboard ✅ shipped in `00e3b7f`

v2's equivalent is "My Loot": a list of only what you've saved, with a General tab and a Won tab for gachapon prizes, in v2's bold black-bordered style. The current Luckboard is a tracker over the **whole catalogue** (68 freebies, experiences and deals), mostly "Not explored".

### Decisions

- **Keep the whole catalogue, but open on your list.** Default view is *Want to try*. Chips switch between Want to try · Done · Not for me · Explore all. Someone with nothing saved yet lands on *Explore all* rather than an empty page. The view (`?show=`), tab (`?tab=`) and search (`?q=`) live in the URL, like the freebies filters.
- **Add a Won tab, read-only.** It shows the real gachapon collection (food and drinks out of 10, grand prize out of 1) and the status of any redemptions. Redeeming stays on the Rewards page, linked from the tab, so nothing is built twice.
- **Keep the name "Luckboard".** The URL, the save buttons on every card and the bottom nav all use it.
- Statuses are unchanged: Want to try / Done it / Not for me / Not explored.
- v2's slide-out vault drawer belongs to the shell (header and bottom nav), so it waits for that phase.

### Found while planning

- **Saves could be lost.** Every card on the current page shares one `useFetcher`, and a new submission on a fetcher cancels the one still in flight. Tapping two cards quickly could drop the first save while the screen showed it saved. Each card will use `LuckboardToggle`, which has its own fetcher.
- **The collection formula lived inline in the Rewards loader.** It becomes one shared function in `app/lib/gachapon.ts`, used by both pages.

### Step 1 — data

- [x] `computeCollection(pulls, redemptions)` in `app/lib/gachapon.ts`; Rewards uses it instead of its inline copy.
- [x] Luckboard loader: saved statuses plus gachapon pulls and redemptions; resolves the default view on the server.

### Step 2 — page

- [x] v2 layout: header, Saved / Won tabs with counts, status chips with counts, search.
- [x] Saved cards in v2's style: type badge, status badge, name and detail, a link to the item (the freebie's page, `/deals#code`, or Free Melbourne), and `LuckboardToggle` for the status.
- [x] Won tab: collection progress for food, drinks and the grand prize, a "ready to redeem" state, redemption statuses, and a link to Rewards.
- [x] Empty states for each view, each pointing somewhere useful.

### Cleanup

- [x] Remove the old page's CSS (`.lb-stats`, `.lb-filters`, `.lb-grid`, `.lb-card`, …). **Keep** `.lb-toggle*`, `.lb-popover*` and the `.lb-want/.lb-done/.lb-skip/.lb-unexplored` state classes: `LuckboardToggle` still uses them.

**How it was checked.** The page needs a signed-in account, so it was rendered through a temporary dev-only copy with sample data (since deleted; `routes.ts` matches the committed file). That confirmed the default view, the fallback to *Explore all*, every `?show=` / `?q=` view, the Won-tab arithmetic (14 food pulled − 10 spent on an arranged redemption = 4 of 10), and the 500px layout. The CSS cleanup kept three class families that are built dynamically and so look unused to a text search: `.lb-pop-opt`, the `.lb-want/.lb-done/.lb-skip` states, and `.lb-admin-*` on the admin user page.

### Phase 4 verification

- [x] `npx tsc -b` clean; signed-out visitors are redirected to login.
- [x] Default view: *Want to try* when it has items, *Explore all* when it doesn't.
- [x] `?show=`, `?tab=` and `?q=` render on the server and survive a reload.
- [x] Rewards still shows the same collection numbers after the refactor.
- [ ] Signed in: changing a status updates the list; two quick taps both stick (browser check — needs you).
- [x] ~500px wide: nothing overflows.

---

## Phase 5 — Rewards and the gachapon

The page the home page headline promises ("mystery prizes"), and the most server-coupled. v2's Rewards page has three tabs — **Earn** (daily check-in grid, trivia, receipt upload, quests), **Play** (the animated gachapon machine), **Activity** (points history). The live page has the same three areas, plus a real daily spin wheel v2 doesn't have.

Every live feature carries over: daily spin, timed trivia, receipt uploads with milestone bonuses, login streak, gachapon with collection and redemption, activity and proof history.

### Decisions

- **Multi-pull ships, as real pulls in a row.** Turning the crank stays the main way to play. "Pull ×N" runs that many real server pulls one after another, each charged and rolled by the server, then reveals them together. Capped at what the player can afford and their remaining daily pulls (8 a day); stops at the first error.
- **The pull feed shows the player's own recent pulls.** v2's "Recent pulls" feed is invented people winning invented prizes "Just now" — the same fabricated social proof as the corkboard seed, so it doesn't ship.
- **Prizes are the real prize types** (free food, free drink, bonus points, double-points day, free pull, better luck, grand prize). v2's prizes are specific vouchers with codes that don't exist.
- **v2's "quests" become the real ways to earn**, each linking to where you do it. v2's quests aren't backed by anything.
- **v2's check-in grid shows the real login streak.**
- **Fix the double-spend now** (see below).

### Found while planning: points can be double-spent or lost

`/api/gachapon` reads the balance, then writes back balance − 150 as a separate step, so two pulls fired at once can both pass one balance check. `awardPoints` — which every award on the site goes through — has the same read-then-write shape, so two awards landing together can lose one. The two interact: an award running alongside a pull can write back a stale balance and undo the 150-point charge. Fixing only the pull wouldn't hold.

Fix: two Postgres functions, each changing the balance in a single atomic step under a row lock — `gachapon_pull` (daily limit, free pull or points charge, prize effects, pull row) and `award_points` (the double-points booster logic, ledger row, balance). Both callable only by the server's service-role key. The prize is still rolled in TypeScript (`PRIZE_WEIGHTS`) and passed in, so odds don't change.

If the SQL hasn't been run yet, the code falls back to today's behaviour, so the deploy and the SQL can happen in either order.

### Step 1 — atomic points (server)

- [x] `sql/atomic_points.sql`: `gachapon_pull` and `award_points`, service-role only.
- [x] Tested in an in-memory Postgres (PGlite): charge, free pull, insufficient points, daily limit, each prize effect, booster downgrade, award doubling, ledger rows.
- [x] `/api/gachapon` and `awardPoints` call them, falling back to the current code if the functions don't exist yet.

**Also routed through the atomic award:** three hand-rolled awards in the profile pages — the profile-completion bonus, the referrer's +100, and a setup bonus that *set* the balance to 100 (wiping anything earned before setup) instead of adding 100. None used the booster, so they pass `doubleEligible: false` and amounts are unchanged. The fallback triggers only on PostgREST's "function not found" (`PGRST202`, confirmed against the live project); any other error is logged without retrying, so nothing is charged or awarded twice.

### Step 2 — Play tab

- [x] Port v2's machine (`GachaponMachine`, `CuteCapsule`): interactive crank, "Pull ×N", capsule drop, open and reveal, confetti and sounds (respecting reduced motion and the sound opt-in).
- [x] Every pull comes from `/api/gachapon`; the reveal shows the real prize type.
- [x] Your recent pulls, from the server.
- [x] Collection and redemption (the existing redeem form) restyled.

**Also fixed in Step 2:**
- **Copy said 5, the server needs 10.** The Rewards page told players to collect 5 food or drink capsules; `PRIZES` (and `/api/redeem`) require 10. All gachapon copy now reads the thresholds from `PRIZES`.
- v2's "JACKPOT $500" badge became "Grand prize · 1% a pull" (the real weight); its "Claim +1 token" button became a link to the Earn tab; its "100% free & verified / self-funded or sponsored" claim was dropped.
- The crank, token, coin slot and chute are real buttons with labels (they were clickable `div`s); the reveal is a dialog that closes with Escape.
- `Rewards()` called its `useState` hooks after an early return; they now run first. The page's meta description still advertised the retired monthly draw.

Checked through a temporary dev-only page with sample data (deleted; `routes.ts` matches the committed file): available pulls (1 free + 4 from 640 pts, capped by 6 left today = 5), the odds badge, thresholds from data, no invented names or dollar claims, desktop and 500px layouts. The pull flow itself makes real, charged requests, so it needs a signed-in browser check.

### Step 3 — Earn tab

- [x] Daily spin, trivia, receipt upload and the streak (as v2's check-in grid), restyled, same endpoints. Components in `app/components/rewards/` (`EarnCard`, `CheckInGrid`, `SpinCard`, `TriviaCard`, `ReceiptCard`), in the Play tab's black-border style.
- [x] "Ways to earn" in place of v2's quests: each real way to earn, with a done mark (spin/trivia today, profile, waitlist, birthday this year) or a link to where you do it; "Invite a friend" copies the real `/r/<username>` link.
- [x] Birthday banner on the Earn tab when the loader has just paid the birthday bonus.

**Also fixed in Step 3:**
- **Trivia never counted the last answer.** The answer timeout ran a callback holding the answers from before the last click, so a perfect 5/5 was scored and paid as 4/5 (10 pts, not 25). Answers are now read through a ref.
- **Receipts were paid per upload, not per receipt.** Up to 6 images went in as one submission, which the admin approves for 5 pts once, while the copy said "5 pts per receipt". The card now takes one receipt at a time (up to 3 photos for a long one).
- Failed photo uploads (non-2xx from storage) are now reported instead of submitting a record with missing files.
- v2's merchant/amount fields, its instant "verified" scan and its trivia practice replay weren't carried over (nothing reads them; points land only after review; the questions ship with their answers).

### Step 4 — Activity tab

- [x] v2's points history over the real `points_ledger` (`ActivityLedger`): balance and earned/spent totals for the current view, activity/period filters covering every ledger action, search by reference or description, copyable `#REF` codes, Melbourne-time dates. Says when only the latest 100 entries are shown.
- [x] Proof submissions restyled (`ProofCard`), same upload flow, with status chips and admin notes.

### Phase 5 verification

- [x] `npx tsc -b` clean; build passes.
- [x] SQL functions pass their PGlite tests (28/28). PGlite is single-connection, so concurrency itself rests on Postgres's `FOR UPDATE` row lock rather than a race test.
- [ ] Every Rewards feature still works signed in: spin, trivia, receipt upload, pull, multi-pull, redeem (browser check — needs you, after the SQL is run).
- [ ] Reduced motion: the machine still works without the animation.
- [x] ~500px wide: nothing overflows (Play tab in Step 2; Earn and Activity checked through a temporary preview page with sample data, since deleted).

---

## Guardrails

- Every ported component must survive server render: no `localStorage`, `window` or `document` access at module scope or during render. v2's components are clean here — only `App.tsx`, which we are not porting, reads `localStorage` in `useState` initialisers.
- No `localStorage` as a source of truth. Saves, points and prizes go through the existing endpoints: `/api/luckboard`, `/api/award-points`, `/api/spin`, `/api/trivia`, `/api/gachapon`, `/api/redeem`, `/api/proof`.
- Business logic stays server-side. v2's client-side prize selection (`Math.random()` over `GACHAPON_PRIZES`) is never ported; `app/lib/gachapon.ts` and `/api/gachapon` remain authoritative.
- Keep each route's `meta` export and existing headings.

## Phase 6 — the shell, and the referral landing page

### Decisions

- **Bottom nav keeps its liquid animation** (the bubble that melts between tabs) and takes v2's look: lucide icons, the mascot as the centre Rewards tab with your points on it.
- **Tabs are v2's:** Home, Freebies, Rewards (centre), Deals, Luckboard. Dinners leaves the bar; it's reached from the home page and footer.
- **No vault drawer.** v2's "loot vault" is a drawer of saved and won items, which is what the Luckboard page already is (Saved/Won tabs). With Luckboard now a bottom tab, a drawer would be a second copy of it.
- **Ticker carries no deal claims.** v2's strip named specific offers ("Nando's $15 · Krispy Kreme 4-Pack…"); ours says what Luckee is, so it can't go stale.

### Header, bottom nav, footer

- [x] Header (`Nav.tsx`): dark strip that scrolls away, mascot logo, sound toggle (the same opt-in switch as the profile page; hidden under 640px for space), search drawer submitting to `/search` with popular searches that all return results, points pill → Rewards, account menu (admin keeps its single dashboard link), Sign in otherwise. Menu and drawer close on Escape and on navigation.
- [x] Bottom nav: new tabs and icons, points chip on the Rewards mascot, liquid animation unchanged.
- [x] Footer: v2's dark footer with every real page (adds Luckboard; About/Contact/Partner grouped under "Luckee").

### Referral landing page (`/r/:username`)

Invite links used to set the referral cookie and bounce straight to `/login`, so a friend saw a bare sign-in form with no idea what Luckee was or who sent them.

- [x] The link now lands on a page: an "admit one" ticket from @username, what's inside (freebie count from the data, daily points, gachapon with thresholds from `PRIZES`, Luckboard), three real verified birthday freebies, how joining works, and a "Join free with @username's invite" button to `/login`.
- [x] Same cookie as before, so `auth.callback` still credits the referrer. Set only for signed-out visitors with a valid invite.
- [x] Other states: your own link (shows what friends see, with a copy button), already signed in (nothing to claim, link to Rewards), unknown username (still invites you to join, no cookie).
- [x] Only the username is shown (it's already in the link). `noindex`, with an og:title of "@username invited you to Luckee" for chat previews.
- [x] Honest about the reward: says joining thanks the referrer with 100 pts; doesn't invent a bonus for the friend.

### Phase 6 verification

- [x] `npx tsc -b` clean.
- [x] Screenshots at 1280px and 500px: header, ticker, bottom nav on `/freebies`, footer on `/about`, the invite and not-found states of `/r/:username` (invite state via a temporary dev-only hook, removed).
- [ ] Signed-in check: points pill, account menu, sign out, Rewards chip; open your own `/r/<username>` link.

## Later phases (not in scope now)

The corkboard backend — `community_posts` with `pending/approved/rejected`, a submit action, and an approval queue modelled on the existing `admin.proof` flow.
