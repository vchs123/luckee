# Luckee — Product Requirements Document
**Version:** 1.1 (based on luckee-site.html)
**Owner:** Vanessa Chua (Head of IT, Siddeley Group) trading as Luckee
**Last updated:** July 2026
**Status:** HTML prototype complete · Remix build pending

---

## 1. Overview

Luckee is a Melbourne-based community platform combining four interconnected products under one brand:

| Product | Description | Revenue stream |
|---|---|---|
| **Freebies** | Birthday perks, loyalty sign-ups, free Melbourne experiences, events calendar | Display advertising (Ezoic/AdSense — once traffic qualifies) |
| **Deals** | Curated affiliate and referral cards | Commission per successful conversion |
| **Dinners** | Language-matched community dining | Non-profit / cost-neutral |
| **Rewards** | Points ledger, spin wheel, daily trivia, monthly lucky draw | Sponsorship fees |

### Brand
- **Name:** Luckee
- **Legal entity:** Vanessa Chua trading as Luckee (sole trader ABN)
- **Domain to register:** luckee.com.au via Cloudflare Registrar
- **Tagline:** "Melbourne's best freebies, deals and community dinners. Updated regularly. Verified by a local."
- **Primary language:** English at launch. Mandarin Chinese (Simplified) in a later phase.
- **Design language:** Fraunces (display, italic) + Nunito (body); pink-to-lavender-to-sky gradient; white cards; category-colour accent system

---

## 2. Goals

### Launch goals
1. Publish a complete, SEO-ready freebies guide for Melbourne (birthday freebies as anchor content)
2. Drive affiliate conversions for 4 initial deals (Claude Pro, Blossom, Kris+, Macadam)
3. Collect dinner waitlist registrations for the first Teochew table
4. Establish Luckee as the authoritative source for Melbourne freebies on Google

### 90-day goals
- 1,000+ organic monthly sessions via "birthday freebies Melbourne" and related queries
- 50+ dinner waitlist registrations
- First Teochew dinner held
- At least 2 affiliate commissions earned

### Success metrics
- Organic search traffic (primary)
- Birthday freebies page time-on-page
- Dinner waitlist form completion rate
- Deal card click-through rate
- Waitlist-to-dinner conversion rate

---

## 3. Users

### Primary persona — The Melbourne Freebie Hunter
- Melbourne local, any age
- Actively looks for ways to save money
- Knows about birthday freebies in general but relies on scattered sources (Reddit, Facebook groups, outdated blogs)
- Arrives via Google ("birthday freebies Melbourne", "free things to do in Melbourne")
- Doesn't need to be Chinese-speaking — Luckee serves the full Melbourne audience

### Secondary persona — The Chinese-Speaking Melburnian
- Teochew, Cantonese, or Mandarin speaker based in Melbourne
- Wants to meet people who speak their language in a relaxed social setting
- Under-served by generic "social dinners" apps that don't consider language
- Arrives via V's personal Instagram or community word-of-mouth

### Tertiary persona — The Deal Collector
- Interested in referral bonuses, savings apps, and rewards programs
- Arrives via search ("Blossom app review", "Kris+ referral code") or social
- Likely also interested in the lucky draw

---

## 4. Information Architecture

The site is a single-page application (SPA) with 10 pages accessed via hash routing.

```
Luckee
│
├── Home (#home)
│   ├── Hero: headline + search bar + 6 category chips
│   ├── Today's top picks (3 freebie cards)
│   ├── Free in Melbourne right now (4 experience cards)
│   ├── Deals I genuinely use (4 deal cards)
│   ├── Dinner teaser (CTA to Dinners page)
│   └── Earn & win teaser (3 earn-method cards)
│
├── Freebies (#freebies)
│   └── Hub page with 5 category cards
│
├── Birthday Freebies (#birthday)
│   ├── Filter bar: All | Food & Drink | Beauty & Retail | No min spend
│   ├── Pro tip box
│   ├── Food & Drink cards (9 brands)
│   ├── Beauty & Retail cards (6 brands)
│   └── Programs-change caveat box
│
├── Sign-up Freebies (#signup)
│   └── Cards for 5 one-time welcome bonuses
│
├── Free Melbourne (#melbourne)
│   ├── Half-price PT tip box
│   ├── Getting Around (3 cards)
│   ├── Culture & Arts (6 cards)
│   ├── Classes & Workshops (5 cards)
│   └── Markets & Outdoors (5 cards)
│
├── Events Calendar (#events)
│   └── 10 recurring annual free events
│
├── Deals (#deals)
│   └── 4 affiliate referral cards
│
├── Dinners (#dinners)
│   ├── 3-step how-it-works
│   ├── Waitlist form (6 fields)
│   └── How-it-works detail cards (4)
│
├── Rewards (#rewards)
│   ├── Points earning table
│   ├── Lucky draw explainer
│   └── 3 upcoming feature cards
│
└── About (#about)
    ├── Why I built this
    ├── 3 value prop cards
    └── Legal links (Privacy, T&Cs, Copyright, Partner With Us)
```

### Navigation
- **Sticky nav:** Logo · Freebies ▾ (dropdown) · Deals · Dinners · Rewards · About · Sign in · Join free
- **Freebies dropdown:** Birthday Freebies · Sign-up Freebies · Free Melbourne · Events Calendar
- **Mobile:** hamburger menu with all links expanded inline
- **Active state:** nav item highlighted when on that page; Freebies item highlights for all Freebies sub-pages
- **Footer:** 3-column link grid (Freebies / Platform / Legal) + legal line + affiliate disclosure

---

## 5. Page Specifications

### 5.1 Home

**Hero**
- Badge: "✦ Melbourne's freebie hub"
- H1: "Score Melbourne's best *freebies* every day" (pink accent on "freebies")
- Subhead: "Birthday perks, loyalty sign-ups, free galleries and community dinners — curated for Melbourne locals."
- Search bar: routes to Birthday Freebies section and applies filter based on match
- Category chips (6): Birthday → #birthday | Experiences → #melbourne | Beauty → #birthday (beauty filter) | Food → #birthday (food filter) | Events → #events | Sign-up bonuses → #signup

**Today's top picks**
- H2: "Today's best freebies"
- 3 cards (hardcoded selection): Nando's $15 voucher · Krispy Kreme 4-pack · Mecca Birthday Edit
- Cards use the standard Freebie Card component (see §8)

**Free in Melbourne right now**
- H2: "Free in Melbourne right now"
- 4 experience cards (hardcoded): Free Tram Zone · NGV International · State Library · ACMI
- CTA: "Explore all free experiences →" → #melbourne

**Deals I genuinely use**
- H2: "Deals I genuinely use"
- 4 deal cards: Claude Pro · Blossom · Kris+ · Macadam
- CTA: "See all deals →" → #deals

**Dinner teaser**
- Teaser card: "Next Teochew table — Melbourne"
- CTA: "Join the waitlist →" → #dinners

**Earn & win**
- H2: "Earn points, win prizes"
- 3 cards: Earn points (up to 200 pts per action) · Spin to win (coming with launch) · Monthly draw (sponsored prizes)
- CTA: "How Rewards work →" → #rewards

---

### 5.2 Freebies Hub

Hub page with 5 category cards:

| Card | Emoji | Name | Count |
|---|---|---|---|
| food | 🍔 | Birthday Food & Drink | 9 verified offers |
| bty | 💄 | Birthday Beauty & Retail | 6 verified offers |
| sgn | 🎁 | Sign-up Freebies | One-time bonuses |
| melb | 🌿 | Free Melbourne | 20+ ongoing perks |
| evnt | 🎉 | Events Calendar | Annual free events |

Cards for food and bty include a pre-set filter: food → `setFilter('food')`, bty → `setFilter('beauty')`.

---

### 5.3 Birthday Freebies

**Filter bar** (4 states): All (15+) · 🍔 Food & Drink · 💄 Beauty & Retail · ✓ No min spend only

When "No min spend only" is active: shows only items where `ns: true`. All other filters show full respective lists.

**Pro tip box** (blue): "Sign up 3–4 weeks before your birthday. Most programs email your voucher on the 1st of your birthday month. Programs marked Min spend require a purchase to unlock the freebie."

**Food & Drink brands (9):**

| Brand | Program | Reward | Min spend | Method | Timing | Condition |
|---|---|---|---|---|---|---|
| Nando's | PERi-Perks | $15 birthday voucher | No | App | 1st of birthday month | Verified email + 1 transaction in 6 months |
| Krispy Kreme | Inner Circle | Free 4-pack Original Glazed (or $15 online dozen) | No | Newsletter code | ~15 days before birthday, valid 30 days | Show code + photo ID in-store |
| Mad Mex | Mad Members | Free burrito or naked burrito | No | App | Birthday | App-only |
| Boost Juice | Vibe Club | Free smoothie or juice | No | App / Vibe card | A few days either side of birthday | Scan in-store |
| McDonald's | MyMacca's | Free cheeseburger, small fries or sundae | No | App | Birthday | Choose one item |
| Hungry Jack's | App rewards | Free Whopper | No | App | Birthday | App-only |
| Starbucks | Starbucks Rewards | Birthday reward drink (any size) | No | App | Birthday | Registered member required |
| Cold Rock | Rockstar Rewards | Free ice cream with a mix-in | No | App | Birthday | — |
| Grill'd | Relish | Free Famous Snack Chips every day for 31 days of birthday month | **Yes** | App | Daily during birthday month | Requires burger, salad or Super Slider purchase |

**Beauty & Retail brands (6):**

| Brand | Program | Reward | Min spend | Method | Timing | Condition |
|---|---|---|---|---|---|---|
| Mecca | Beauty Loop | Birthday Edit gift product (choice from selection) | No | App / in-store | During birthday month | Physical product from Oct 2025, not a gift card |
| Sephora | Beauty Pass (White) | Birthday gift + double points | No | In-store | During birthday month | Free White tier |
| Priceline | Sister Club | $5 voucher + bonus points | No | App | Birthday month (valid 28 days) | Free membership |
| Country Road | Rewards | 15% off first full-priced online order | No | Email on sign-up | On sign-up | Full-priced items only |
| The Body Shop | Love Your Body Club | $10 birthday reward | **Yes** | In-store or online | Birthday month | 1 purchase in prior 12 months required |
| Myer | Myer One | $10 (Member) · $15 (Silver) · $20 (Gold) · $30 (Platinum) | **Yes** | App | Birthday month | ≥1 month membership + ≥$30 annual spend |

**Caveat box** (amber): Notes on 2025–26 program changes (David Jones removed $10 voucher Sept 2025; Mecca switched to product gifts Oct 2025; Myer One overhauled).

---

### 5.4 Sign-up Freebies

5 one-time welcome bonuses (no birthday required):

| Brand | Program | Reward | Method | Condition |
|---|---|---|---|---|
| Guzman y Gomez | GOMEX Rewards | Free burrito on sign-up (~$11) | App | New users only · AU only (the $20 birthday voucher is Singapore market) |
| The Pass | Australian Venue Co | $10 food & drink credit on app download | App | Valid at 200+ pubs/bars nationwide |
| Ferguson Plarre | Bakehouses Loyalty | Free hot drink on sign-up | Loyalty card | Melbourne institution · 6th coffee free · $5 coupon at 5,000 pts |
| Grill'd | Relish | Free chips (2nd visit) · Free drink (5th) · Free burger (8th) | App / Relish card | Ongoing milestones |
| Kathmandu | Out There Rewards | $20 welcome voucher after first purchase | Email | Birthday vouchers ($10–$50 by tier). Formerly Summit Club |

---

### 5.5 Free Melbourne

**Banner tip:** Half-price PT state-wide 1 June 2026–1 January 2027. Daily cap $11.40 → $5.70. Under-18s free; seniors/carers/DSP free on weekends.

**Getting around (3 items):**
- Free Tram Zone — always free, no myki needed, includes City Circle
- Half-price public transport — until 1 Jan 2027
- Free travel for under-18s & seniors — ongoing

**Culture & arts (6 items):**
- NGV International & Ian Potter Centre — permanent collection always free
- ACMI — Story of the Moving Image always free
- State Library Victoria — free entry, fast WiFi, Dome tours
- Shrine of Remembrance — free, including balcony views
- Australian Music Vault — free at Arts Centre Melbourne
- City Gallery at Melbourne Town Hall — free rotating exhibitions

**Classes & workshops (5 items):**
- City of Melbourne Free Fitness in the Park — monthly, all fitness levels
- lululemon community classes — yoga, run club, pilates, boxing (seasonal)
- Bunnings DIY workshops — adult Make & Take + kids DIY (weekends)
- Today at Apple — photography, coding, music (Chadstone + others, daily)
- State Library walking tours — Dome to Catacombs, most days (book online)

**Markets & outdoors (5 items):**
- Royal Botanic Gardens — always free, 36 hectares
- Hosier Lane & street art laneways — self-guided, always free
- Queen Victoria Market — free to wander, Night Markets free entry
- VicFreeWiFi — 500+ hotspots, 1GB/device/day, no login
- Melbourne Greeter Service — free volunteer-led orientation walks

---

### 5.6 Events Calendar

10 recurring annual free events:

| Month | Event | Free? |
|---|---|---|
| March (long weekend) | Moomba Festival | ✓ |
| February | St Kilda Festival | ✓ |
| February | Lunar New Year (Chinatown & NGV) | ✓ |
| July–August | Melbourne International Film Festival (free outdoor screenings) | Check |
| August (approx) | White Night | ✓ |
| Year-round | QVM Night Markets (Summer + Winter) | ✓ |
| April 25 | ANZAC Day Dawn Service | ✓ |
| September–October | AFL Grand Final (Fed Square big screen) | ✓ |
| December–January | Sidney Myer Music Bowl — MSO Carols & Concerts | ✓ |
| Various (Greek Easter) | Antipodes Festival | ✓ |

---

### 5.7 Deals

4 affiliate referral cards. All have `target="_blank" rel="noopener"`. Referral codes displayed in monospace code boxes where applicable.

**Claude Pro (Anthropic)**
- Colour: violet (#7c3aed)
- Reward: 7-day free trial
- Description: "The AI I use every day for work, writing, research and building Luckee. Claude Pro gives access to the most capable models with more usage than the free tier."
- Tags: 🌍 Global · 💻 Web & mobile · 🧠 AI
- CTA: "Start 7-day free trial →"
- Link: https://claude.ai

**Blossom** *(pending update — 3-tier featured card)*
- Colour: emerald (#059669)
- Three products to display:
  - **Blossom Save** — 5.95% p.a. target · from $50 · fast withdrawals · daily compounding
  - **Blossom Plus** — 6.50% p.a. target · from $5,000 · quarterly access · daily earnings
  - **Blossom Grow** — 7.00% p.a. target · from $5,000 · 12-month term · annual compounding
- Sign-up bonus: $10 cash on first $50 deposit (Blossom Save)
- Headline: "Reach your savings goals faster than with a bank"
- Disclaimer: "Target returns are not guaranteed. Not a bank. Read the PDS before investing."
- Tags: 🇦🇺 Australia only · 📱 iOS & Android · 💰 Finance

**Kris+** *(updated — categories corrected)*
- Colour: orange (#ea580c)
- Reward: 500 KrisPay miles on first $5 spend
- Referral code: C506127
- Description: "Earn KrisPay miles on everyday spending across five categories: dining, retail, activities, services and wellness. 100+ partners."
- Tags: 🍽️ Dining · 🛍️ Retail · 🏃 Activities · 💆 Wellness
- CTA: "Join Kris+ →"

**Macadam** *(updated — walking app, not road trip)*
- Colour: sky (#0891b2)
- Reward: 1,000 coins on sign-up
- Referral code: RE65K8
- Description: "A walking rewards app. Earn coins for every step and redeem via PayPal, Visa gift cards or Amazon vouchers."
- Tags: 🇦🇺 Australia · 🚶 Walking app · 💳 PayPal · Visa · Amazon
- CTA: "Join Macadam →"

---

### 5.8 Dinners

**Three-step explainer:**
1. Build your profile — preferred dinner language, dietary needs, interests, suburb. 2 minutes.
2. Get matched — V reviews all profiles and forms compatible tables by hand. Language is the hard filter.
3. Show up and eat — PayID payment request for exact venue cost share. V is present at every dinner.

**Waitlist form (6 fields):**

| Field | Type | Required | Options |
|---|---|---|---|
| First name | text | Yes | — |
| Last name | text | Yes | — |
| Email | email | Yes | — |
| Melbourne suburb | text | Yes | placeholder: "e.g. Fitzroy, Docklands" |
| Preferred dinner language | select | Yes | Teochew (潮州話) · Cantonese (廣東話) · Mandarin (普通話) · Bahasa Melayu · English (open table) · Other |
| Dietary needs | select | No | None / Vegetarian / Vegan / Halal / No pork / No shellfish / Gluten-free |

**Form behaviour:** On submit → hide form, show success message: "✅ You're on the list! I'll be in touch when a table opens up for your language group."

**Payment note displayed on form:** "Payment (exact venue cost per head, no markup) is via PayID once you're matched and confirm. Cancellation: 48+ hrs = full refund, 24–48 hrs = 50%, <24 hrs = no refund."

**How-it-works detail cards (4):**
- 🌏 Language is the hard filter — matched by preferred dinner language first, no exceptions
- 👥 2 to 6 people per table — V attends every dinner within the 6-person max
- 💰 Truly non-profit — guests pay venue price; V collects via PayID and pays venue in full
- 📅 Once a month, for now — starting with Teochew; more language groups added as waitlist grows

---

### 5.9 Rewards

**Points earning table:**

| Action | Points |
|---|---|
| Complete your profile | 100 |
| Click an affiliate deal link | 10 |
| Self-report a successful deal sign-up | 50 |
| Daily login | 5 |
| Win daily trivia (5 correct) | 25 |
| Attend a community dinner | 150 |
| Refer a friend (who creates an account) | 200 |
| Daily spin (free, once per day) | 10–500 |

**Monthly lucky draw:** 100 points = 1 entry. Random draw at month end. Winner announced via email and social. Prizes AUD $30–$150 from sponsors or affiliate commissions.

**Three upcoming features (all marked "Launching with site"):**
- ⭐ Points ledger — running log of every point, action and date
- 🎡 Spin wheel — 1 free spin daily; extra spins for completed deal sign-ups
- 🧠 Daily trivia — 5 questions themed around money, travel and the Deals products

---

### 5.10 About

- **Story card:** Why V built this — Melbourne freebies are scattered across Reddit, outdated blogs and loyalty apps. Luckee is a single place to find what's free, discover deals worth signing up for, and meet people over a shared meal.
- **Value prop 1:** 📍 Based in Melbourne — all freebies focused on Melbourne, national deals flagged separately
- **Value prop 2:** 🌏 Built for Melbourne's Chinese-speaking community — starting with Teochew and Mandarin speakers; language support expanding
- **Value prop 3:** 🔗 Transparent about affiliate links — Deals earn commission; Freebies content is editorially independent
- **Legal links:** Privacy Policy · Terms & Conditions · Copyright Policy · Partner With Us

---

## 6. Data Models

All content is currently defined as JavaScript arrays in `luckee-site.html`. These will migrate to Supabase tables in the Remix build.

### 6.1 Freebie (BDAY_FOOD, BDAY_BEAUTY, SIGNUP_FREEBIES)

```javascript
{
  e: string,         // emoji
  n: string,         // brand name
  pg: string,        // loyalty program name
  r: string,         // reward description (what you get)
  m: string,         // how to claim (method)
  t: string,         // timing
  c: string | null,  // condition / catch (displayed in amber if present)
  ns: boolean,       // true = no minimum spend
  link: string,      // URL to loyalty program sign-up page
  cat: string        // 'food' | 'bty' | 'sgn' (sign-up)
}
```

### 6.2 Free Melbourne Experience (MELB_*)

```javascript
{
  e: string,         // emoji
  cat: string,       // subsection category label
  n: string,         // experience name
  d: string,         // description
  t: string,         // availability timing
  col: string        // 'melb' (teal) | 'amber' (limited-time)
}
```

### 6.3 Event (EVENTS)

```javascript
{
  month: string,     // calendar period
  n: string,         // event name
  d: string,         // description
  f: boolean         // true = free entry confirmed
}
```

### 6.4 Deal (DEALS)

```javascript
{
  cls: string,       // CSS class: 'cld' | 'bls' | 'krs' | 'mac'
  e: string,         // emoji
  n: string,         // product name
  sub: string,       // company / category subtitle
  reward: string,    // reward description
  rl: string,        // reward label (e.g. "Referral bonus", "Try Claude Pro")
  desc: string,      // longer description
  code: string|null, // referral code (if applicable)
  tags: string[],    // array of tag labels
  cta: string,       // CTA button text
  link: string       // destination URL
}
```

### 6.5 Waitlist submission (future Supabase table: dinner_waitlist)

```
first_name      text
last_name       text
email           text (unique)
suburb          text
dinner_language text
dietary         text | null
created_at      timestamp
status          enum: 'waiting' | 'matched' | 'confirmed' | 'cancelled'
```

---

## 7. UI Component Library

### Freebie Card (`.fc`)
Used across: Home top picks, Birthday Freebies, Sign-up Freebies.

Structure (top → bottom):
1. Coloured stripe (4px) — category colour
2. Emoji + category label + brand name + program name + spend badge (green/amber)
3. "What you get" reward box (category-tinted background)
4. Details: claim method (📱) · timing (📅) · condition if present (⚠ amber)
5. Footer: verified date (left) + CTA button (right, category colour)

Category → colour mapping:
- `food` → orange `#f97316`
- `bty` → purple `#a855f7`
- `melb` → teal `#0d9488`
- `evnt` → blue `#3b82f6`
- `sgn` → green `#16a34a`

### Experience Card (`.xc`)
Used across: Home (Free Melbourne), Free Melbourne page, Dinners how-it-works.

Structure: Emoji (left) + category label + title + description + availability tag (green or amber).

### Event Card (`.evc`)
Used: Events Calendar.

Structure: Month pill (blue) + event title + description + free/check-pricing tag.

### Deal Card (`.dc`)
Used: Home deals, Deals page.

Structure: Coloured stripe + emoji + name + subtitle + reward box (product-tinted) + description + optional referral code box + tags + full-width CTA button.

Colour mapping:
- `cld` → violet `#7c3aed`
- `bls` → emerald `#059669`
- `krs` → orange `#ea580c`
- `mac` → sky `#0891b2`

### Hub Card (`.hc`)
Used: Freebies hub page.

Structure: Emoji + name + count. Hover: coloured border. Navigates to sub-page with optional filter pre-applied.

### Teaser Card (`.tsr`)
Used: Home dinner teaser.

Structure: Headline + description (left) + CTA button (right). On mobile: stacks vertically.

### Earn Card (`.ec`)
Used: Home earn section.

Structure: Large emoji + heading + description + points badge.

### Tip Box (`.tip`)
Used: Birthday Freebies (2 instances), Free Melbourne, Rewards.

Blue background with 1.5px blue border. Left icon + inline text.

### Filter Bar (`.fb-wrap`)
Used: Birthday Freebies.

Row of pill buttons. Active state: pink fill, white text. Inactive: white fill, grey border.

---

## 8. Interactions & Logic

### Routing
- Hash-based SPA. All sections are `<div class="pg">` elements; only one has `.active` at a time.
- `go(id)` function: removes `.active` from all pages, adds it to target, calls `window.scrollTo(0,0)`, updates nav active state, pushes to `history`.
- `popstate` event handles browser back/forward.
- On page load: reads `location.hash`, navigates to that page if valid, otherwise stays on Home.

### Birthday Freebies Filter
`setFilter(type)`:
- If birthday page is not active yet: stores in `pendingFilter`, applies after navigation.
- Updates `.fb` button active states.
- Filters `BDAY_FOOD` and `BDAY_BEAUTY` arrays and re-renders grids.
- `nospend` filter: shows only items with `ns: true` from both arrays.
- Shows/hides section headers alongside grids.

### Live Search
`liveSearch(q)` (hero search bar):
- Fires on `oninput` after 2+ characters.
- Searches `n` (brand name), `r` (reward), `pg` (program) across `BDAY_FOOD`, `BDAY_BEAUTY`, `SIGNUP_FREEBIES`.
- Navigates to `#birthday` and applies food or beauty filter based on which array the first match belongs to.
- Does not yet search deals or events.

### Category Chips (Home hero)
- Birthday → `go('birthday')`
- Experiences → `go('melbourne')`
- Beauty → `go('birthday')` + `setFilter('beauty')`
- Food → `go('birthday')` + `setFilter('food')`
- Events → `go('events')`
- Sign-up bonuses → `go('signup')`

### Waitlist Form
- Standard HTML5 validation (required fields).
- On submit: `e.preventDefault()` → hides form element → shows success message div.
- No actual backend submission yet (placeholder; will POST to Supabase or Resend webhook in Remix build).

### Mobile Menu
`toggleMobile()`: toggles `display: block/none` on `#mob-nav`.
Menu contains all nav links. Links call `go(id)` and then `toggleMobile()` to close.

### Nav Active State
`go(id)` applies `.on` class to nav buttons via `id === 'nl-'+id` match.
Special case: any of `['freebies','birthday','signup','melbourne','events']` activates `nl-freebies`.

---

## 9. Design System

### Colour tokens
```css
--pink: #e91e8c          /* brand accent, CTA buttons */
--pl:   #ffe4f2          /* pink light background */
--pm:   rgba(233,30,140,.1) /* pink mid, nav hover */
--t1:   #1e0a2e          /* primary text */
--t2:   #6b4d82          /* secondary text */
--t3:   #a08bb8          /* tertiary / muted */

/* Category colours */
--food: #f97316   --fb: #fff7ed
--bty:  #a855f7   --bb: #faf5ff
--melb: #0d9488   --mb: #f0fdfa
--evnt: #3b82f6   --eb: #eff6ff
--sgn:  #16a34a   --sb: #f0fdf4

/* Deal brand colours */
--cld: #7c3aed   --bls: #059669
--krs: #ea580c   --mac: #0891b2
```

### Typography
- Display: Fraunces, italic, weight 700, sizes clamp(38px,6.5vw,68px) hero → clamp(26px,4.5vw,44px) section
- Body: Nunito, weight 400–800
- Scale: hero 68px · section-h 44px · card-brand 14.5px · body 15px · meta 11–12px

### Layout
- Max width: 1080px
- Grids: g2 (2-col), g3 (3-col), g4 (4-col), ga (auto-fill minmax 270px)
- Responsive breakpoints: 860px (→ 2-col), 640px (→ 1-col, hide nav links, show hamburger)

### Background
- Fixed gradient: `linear-gradient(160deg, #fff0f8 0%, #fdf4ff 48%, #f0f4ff 100%)`
- Dot grid overlay: `radial-gradient(circle, rgba(233,30,140,.06) 1.2px, transparent 1.2px)` at 28px × 28px

### Cards
- Background: white
- Border: `1px solid rgba(236,72,153,.12)`
- Box shadow: `0 2px 20px rgba(220,50,140,.08), 0 1px 4px rgba(220,50,140,.04)`
- Hover shadow: `0 8px 36px rgba(220,50,140,.15), 0 2px 8px rgba(220,50,140,.09)`
- Border radius: 20px (cards), 12px (inner components), 100px (pills/buttons)

---

## 10. Tech Stack

### Current (HTML prototype)
Single-file HTML/CSS/JS. No build system, no framework, no database.
All data defined as JS constants. Routing is hash-based with vanilla JS.

### Target (Remix / Cloudflare build)

| Layer | Technology | Notes |
|---|---|---|
| Framework | Remix | First-class Cloudflare adapter; SSR for SEO; better than Next.js on edge |
| Hosting | Cloudflare Pages | Auto-deploy from GitHub; global CDN |
| Serverless functions | Cloudflare Workers | API routes, matching logic, point validation |
| Scheduled jobs | Cloudflare Cron Triggers | Monthly draw trigger; daily freebies reset |
| Session / cache | Cloudflare KV | Fast edge key-value store |
| File storage | Cloudflare R2 | S3-compatible; zero egress fees |
| Analytics | Cloudflare Web Analytics | Free; privacy-first |
| Domain + SSL | Cloudflare Registrar | At-cost pricing; luckee.com.au |
| Database | Supabase (PostgreSQL) | Relational; row-level security; Realtime |
| Authentication | Supabase Auth | Email OTP + passkeys (Face ID / fingerprint via WebAuthn) — phone/SMS OTP out of scope v1 |
| Realtime | Supabase Realtime | Live leaderboard; match notifications |
| Email | Resend | 3,000 free/month; best Remix integration |
| Payments | PayID (now) → Stripe (later) | Stripe wired from day one; activated at scale |
| Search | Supabase full-text | Upgrade to Algolia at scale |

### Key feature → tech mappings
- Biometric login: Supabase Auth passkeys (WebAuthn) — device handles biometrics, no biometric data stored on server
- Dinner matching: Supabase DB + Remix admin route (manual to start, algorithm in Phase 2)
- Waitlist form submission: Remix action → Supabase insert → Resend confirmation email
- Points ledger: Supabase append-only transactions table
- Spin wheel: Remix frontend + Cloudflare Worker (server-side validation to prevent cheating)
- Monthly draw: Cloudflare Cron Trigger → Worker → Supabase random selection
- Live leaderboard: Supabase Realtime subscription

---

## 11. Revenue Model

### Affiliate / referral deals
Commission per conversion via referral links embedded in Deal cards.

| Deal | Reward model |
|---|---|
| Claude Pro | Overage credit when referee converts to paid |
| Blossom | Commission per funded account |
| Kris+ | Per-referral credit (code: C506127) |
| Macadam | Per-referral credit (code: RE65K8) |

### Display advertising
Not at launch. Applied for once freebies content reaches qualifying traffic volume.
- Target entry: Ezoic (flexible traffic requirement)
- Later: Mediavine (50,000 sessions/month minimum)
- Rule: ads never on the Deals page (conversion conflict)

### Dinners — non-profit, cost-neutral
Guests pay the venue's exact per-head price via PayID. No margin retained. Structured as community cost-sharing. All dinner income = dinner expenditure. Clean bookkeeping required to demonstrate cost-neutrality.

### Sponsored content / partner deals

| Partnership type | Revenue model |
|---|---|
| Sponsored freebies listing | AUD $50/post · $150/week · $400/month |
| Lucky draw prize sponsorship | AUD $50–$200/month based on prize value |
| Game / gamification sponsorship | AUD $150–$500/month based on active user count |
| Affiliate / deals | CPA per conversion (min AUD $10) or hybrid flat fee + CPA |

---

## 12. Legal & Compliance

### Business entity
Vanessa Chua trading as Luckee (existing sole trader ABN). ABN not displayed on public consumer pages — appears in legal document footer, invoices, and business registrations.

### Required registrations
- ASIC business name: "Luckee" (linked to existing ABN, ~AUD $44/year)
- Domain: luckee.com.au via Cloudflare Registrar

### Legal documents (drafted, placeholders pending)
All four documents need `[Brand Name]`, `[domain]`, `[ABN]`, `[Date]` filled before launch:
- Privacy Policy — Privacy Act 1988 / Australian Privacy Principles compliant
- Terms & Conditions — covers accounts, freebies/deals (affiliate disclosure), dinner service (non-profit, dietary liability, cancellation), rewards/points
- Copyright Policy — IP ownership, UGC licence, DMCA-style reporting
- Partnership page — six partnership types and revenue models

**Have an Australian lawyer review T&Cs and Privacy Policy before launch**, especially dinner service liability and trade promotion permit requirements.

### Affiliate disclosure
Displayed sitewide on a sticky banner: "🔗 Some links on this site are affiliate links — I earn a small commission if you sign up, at no cost to you. All recommendations are genuine."

Footer also carries: "Some links are affiliate referral links. Luckee earns a commission if you sign up — at no extra cost to you. All freebie listings are editorially independent."

### Trade promotion permits
Lucky draw may require permits in QLD, SA, and ACT depending on prize value. Verify before launch.

### Sensitive data in Dinners form
Language preference is a sensitive attribute under Australian privacy law. The Privacy Policy must specifically cover collection and use of this data. Dietary requirements may also infer religious or health information.

---

## 13. Content Rules

### Freebie listings
- Every listing must include: what you get, how to claim, timing, any minimum spend condition.
- Conditions that require a purchase are always labelled "Min spend" in amber.
- A "Verified [Month Year]" date is shown on every card.
- Re-verify all listings at least twice per year (January and July).
- Do not publish offers until personally confirmed via official brand website or app.

### Known caveats to maintain
- GYG $20 birthday voucher is Singapore market only — AU program gives sign-up burrito
- Chatime birthday drink is not confirmed for Australia
- David Jones: $10 welcome voucher removed Sept 2025
- Mecca: switched from gift card to physical product gift Oct 2025
- Myer One: overhauled in 2025 with new tier structure
- Krispy Kreme: requires photo ID in-store

### Deals page
- Blossom financial products must carry: "Target returns are not guaranteed. Not a bank. Read the PDS before investing."
- No deal should imply guaranteed returns or financial advice.

---

## 14. Launch Checklist

### Must-do before going live
- [ ] Register "Luckee" as ASIC business name
- [ ] Register luckee.com.au via Cloudflare Registrar
- [ ] Fill legal document placeholders (brand, domain, ABN, date)
- [ ] Have Australian lawyer review T&Cs and Privacy Policy
- [ ] Accountant sign-off on dinner cost-neutrality bookkeeping
- [ ] Replace all `href="#"` placeholder links with real referral URLs
- [ ] Add GA4 snippet (awaiting Measurement ID)
- [ ] Set up Google Search Console for luckee.com.au
- [ ] Add Blossom three-tier featured card (Save/Plus/Grow with rates 5.95/6.50/7.00%)
- [ ] Update Macadam card to reflect walking app (PayPal/Visa/Amazon redemption)
- [ ] Update Kris+ card categories (dining, retail, activities, services, wellness)
- [ ] Verify all freebie links resolve to correct loyalty program pages

### Should-do before first dinner
- [ ] Decide and wire up waitlist form backend (Supabase or Formspree)
- [ ] Set up Resend confirmation email for waitlist submissions
- [ ] Source and confirm Teochew-friendly venue
- [ ] Test PayID collection flow manually

### Phase 2 (Remix build)
- [ ] GitHub repo setup
- [ ] Remix project with Cloudflare Pages adapter
- [ ] Supabase: schema, RLS, Auth (email OTP + passkeys)
- [ ] Blog engine for daily freebies and birthday guide (Supabase + Remix admin)
- [ ] Sitemap.xml, OG tags, canonical URLs
- [ ] Dynamic birthday freebies post (SEO anchor content)
- [ ] Stripe wired but not activated

---

## 15. Out of Scope (v1)

The following are documented decisions but not in scope for the initial HTML launch or Phase 1 Remix build:

- User accounts, login, and profile management (Phase 1–2)
- Points ledger and tracking (Phase 4)
- Spin wheel and daily trivia (Phase 4)
- Real-time leaderboard (Phase 4)
- Automated dinner matching (Phase 2 — manual matching only at launch)
- Stripe payment processing (PayID only at launch)
- Email newsletter / subscriber capture (Phase 2)
- Mandarin Chinese language toggle (Phase 5)
- AdSense / Ezoic application (Phase 5, traffic-dependent)
- Dedicated Luckee Instagram account (personal account used at launch)
- Xiaohongshu (RedNote) presence (Phase 5)
- Admin panel for managing freebies content (Phase 2)
- Referral tracking / affiliate link click tracking (Phase 2)
- SMS / phone OTP authentication — no free production-grade option exists for Australian numbers; all native Supabase providers (Twilio, Vonage, MessageBird) charge per message. Use email OTP + passkeys at launch; revisit if phone verification becomes a hard product requirement

---

*Document maintained by Vanessa Chua. Next review: before first dinner event.*
