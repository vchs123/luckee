# Luckee v2 design revamp

**Created:** 2026-09-26 15:36 AEST
**Last updated:** 2026-09-26 16:20 AEST
**Status:** Step 0 and Step 1 complete and verified in the dev server; awaiting your visual review
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

## Todo

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

## Guardrails

- Every ported component must survive server render: no `localStorage`, `window` or `document` access at module scope or during render. v2's components are clean here — only `App.tsx`, which we are not porting, reads `localStorage` in `useState` initialisers.
- No `localStorage` as a source of truth. Saves, points and prizes go through the existing endpoints: `/api/luckboard`, `/api/award-points`, `/api/spin`, `/api/trivia`, `/api/gachapon`, `/api/redeem`, `/api/proof`.
- Business logic stays server-side. v2's client-side prize selection (`Math.random()` over `GACHAPON_PRIZES`) is never ported; `app/lib/gachapon.ts` and `/api/gachapon` remain authoritative.
- Keep each route's `meta` export and existing headings.

## Later phases (not in scope now)

Freebies (5 routes, tabs as links) → deals → luckboard/vault → rewards + gachapon last, as it is the most server-coupled. Then the shell (Header/BottomNav/Footer). Separately: the corkboard backend — `community_posts` with `pending/approved/rejected`, a submit action, and an approval queue modelled on the existing `admin.proof` flow.
