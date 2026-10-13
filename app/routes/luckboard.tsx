import { Form, Link, redirect, useLoaderData } from "react-router";
import type { MetaFunction, LoaderFunctionArgs } from "react-router";
import { Bookmark, ExternalLink, Gift, RotateCcw, Search, Sparkles } from "lucide-react";
import { Nav } from "~/components/Nav";
import { Footer } from "~/components/Footer";
import { LuckboardToggle } from "~/components/LuckboardToggle";
import { requireAuth } from "~/lib/auth.server";
import { getSupabase } from "~/lib/supabase.server";
import { isAdminEmail } from "~/lib/admin.server";
import { freebieKey, slugify } from "~/lib/slugify";
import { PRIZES, computeCollection, type PrizeType } from "~/lib/gachapon";
import { BDAY_FOOD } from "~/data/birthday-food";
import { BDAY_BEAUTY } from "~/data/birthday-beauty";
import { SIGNUP_FREEBIES } from "~/data/sign-up-freebies";
import { MELB_TRANSPORT, MELB_CULTURE, MELB_CLASSES, MELB_OUTDOORS } from "~/data/free-melbourne";
import { DEALS } from "~/data/deals";

export const meta: MetaFunction = () => [
  { title: "Luckboard — Your Tracker | Luckee" },
  { name: "robots", content: "noindex" },
];

type LBStatus = "unexplored" | "want" | "done" | "skip";
type Show = "want" | "done" | "skip" | "all";
type ItemType = "freebie" | "experience" | "deal";

interface Item {
  type: ItemType;
  slug: string;
  name: string;
  sub: string;
  badge: string;
  /** This item's page on Luckee. */
  to: string;
  /** Where to claim it, when that's an outside site. */
  claim?: string;
}

// Everything that can be on a Luckboard. Slugs must match what the save
// buttons write: slugify(name) for freebies and experiences, the code for deals.
const ALL_ITEMS: Item[] = [
  ...BDAY_FOOD.map((f) => ({ type: "freebie" as const, slug: freebieKey(f), name: f.n, sub: f.pg, badge: "Birthday food", to: "/freebies/birthday-freebies?filter=food", claim: f.link })),
  ...BDAY_BEAUTY.map((f) => ({ type: "freebie" as const, slug: freebieKey(f), name: f.n, sub: f.pg, badge: "Birthday beauty", to: "/freebies/birthday-freebies?filter=beauty", claim: f.link })),
  ...SIGNUP_FREEBIES.map((f) => ({ type: "freebie" as const, slug: freebieKey(f), name: f.n, sub: f.pg, badge: "Sign-up bonus", to: "/freebies/sign-up-freebies", claim: f.link })),
  ...[...MELB_TRANSPORT, ...MELB_CULTURE, ...MELB_CLASSES, ...MELB_OUTDOORS].map((x) => ({
    type: "experience" as const, slug: slugify(x.n), name: x.n, sub: x.cat, badge: "Free Melbourne", to: "/freebies/free-melbourne",
  })),
  ...DEALS.map((d) => ({ type: "deal" as const, slug: d.cls, name: d.n, sub: d.sub, badge: "Deal", to: `/deals#${d.cls}` })),
];

// Two items sharing a key would share one saved status and a React key (which
// can render phantom duplicate cards). Catch it in development.
if (import.meta.env.DEV) {
  const keys = ALL_ITEMS.map((i) => `${i.type}:${i.slug}`);
  const dupes = keys.filter((k, n) => keys.indexOf(k) !== n);
  if (dupes.length) console.error("[luckboard] duplicate item keys:", [...new Set(dupes)]);
}

const SHOWS: { id: Show; label: string }[] = [
  { id: "want", label: "★ Want to try" },
  { id: "done", label: "✓ Done" },
  { id: "skip", label: "✕ Not for me" },
  { id: "all", label: "Explore all" },
];

const STATUS_BADGE: Record<LBStatus, { label: string; cls: string }> = {
  want: { label: "Want to try", cls: "bg-[#ffcf00] text-black border-black" },
  done: { label: "Done it", cls: "bg-black text-white border-black" },
  skip: { label: "Not for me", cls: "bg-neutral-200 text-neutral-700 border-neutral-400" },
  unexplored: { label: "Not explored", cls: "bg-white text-neutral-500 border-neutral-300" },
};

const REDEMPTION_LABEL: Record<string, string> = {
  requested: "Requested",
  arranged: "Pickup arranged",
  collected: "Collected",
  cancelled: "Cancelled",
};

export async function loader({ request, context }: LoaderFunctionArgs) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const env = (context as any)?.cloudflare?.env as Env;
  const user = requireAuth(context);
  if (isAdminEmail(user.email)) return redirect("/admin");

  const supabase = getSupabase(env);
  const [lbRes, pullsRes, redemptionsRes] = await Promise.all([
    supabase.from("luckboard").select("item_type, item_slug, status").eq("user_id", user.id),
    supabase.from("gachapon_pulls").select("prize_type").eq("user_id", user.id),
    supabase
      .from("gachapon_redemptions")
      .select("id, prize_type, units, status, arranged_for, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  const statuses: Record<string, LBStatus> = {};
  for (const r of lbRes.data ?? []) statuses[`${r.item_type}:${r.item_slug}`] = r.status as LBStatus;

  const statusOf = (i: Item): LBStatus => statuses[`${i.type}:${i.slug}`] ?? "unexplored";
  const counts = {
    want: ALL_ITEMS.filter((i) => statusOf(i) === "want").length,
    done: ALL_ITEMS.filter((i) => statusOf(i) === "done").length,
    skip: ALL_ITEMS.filter((i) => statusOf(i) === "skip").length,
    all: ALL_ITEMS.length,
  };

  const url = new URL(request.url);
  const tab = url.searchParams.get("tab") === "won" ? "won" : "saved";
  const requested = url.searchParams.get("show");
  // Open on the user's list; someone with nothing saved yet gets the catalogue
  // instead of an empty page.
  const show: Show =
    requested === "want" || requested === "done" || requested === "skip" || requested === "all"
      ? requested
      : counts.want > 0
        ? "want"
        : "all";
  const q = (url.searchParams.get("q") ?? "").trim();

  const redemptions = (redemptionsRes.data ?? []) as {
    id: string; prize_type: string; units: number; status: string; arranged_for: string | null; created_at: string;
  }[];

  return {
    statuses,
    counts,
    tab,
    show,
    q,
    collection: computeCollection((pullsRes.data ?? []) as { prize_type: string }[], redemptions),
    redemptions,
  };
}

/** A link that keeps the other URL state and changes one piece. */
function hrefWith(current: { tab: string; show: string; q: string }, change: Partial<{ tab: string; show: string; q: string }>) {
  const next = { ...current, ...change };
  const params = new URLSearchParams();
  if (next.tab === "won") params.set("tab", "won");
  else {
    params.set("show", next.show);
    if (next.q) params.set("q", next.q);
  }
  return `/luckboard?${params}`;
}

export default function Luckboard() {
  const { statuses, counts, tab, show, q, collection, redemptions } = useLoaderData<typeof loader>();
  const state = { tab, show, q };
  const statusOf = (i: Item): LBStatus => statuses[`${i.type}:${i.slug}`] ?? "unexplored";

  const needle = q.toLowerCase();
  const items = ALL_ITEMS.filter((i) => (show === "all" ? true : statusOf(i) === show)).filter(
    (i) => !needle || `${i.name} ${i.sub} ${i.badge}`.toLowerCase().includes(needle),
  );
  const savedCount = counts.want + counts.done + counts.skip;
  const heldCount = collection.food + collection.drink + collection.grand;

  return (
    <>
      <Nav />
      <div className="wrap" style={{ paddingTop: 32, paddingBottom: 64 }}>
        <div className="mb-6">
          <p className="eyebrow">⭐ Personal tracker</p>
          <h1 className="font-fraunces text-3xl font-bold italic tracking-tight text-[var(--t1)] sm:text-4xl md:text-5xl">
            Luckboard
          </h1>
          <p className="mt-1 max-w-xl text-sm font-medium text-[var(--t2)] sm:text-base">
            The freebies, experiences and deals you've saved, and the prizes you've won from the gachapon.
          </p>
        </div>

        {/* Saved / Won */}
        <div className="mb-5 inline-flex border-[3px] border-black bg-white p-1 shadow-hard-sm">
          <Link
            to={hrefWith(state, { tab: "saved" })}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-wider sm:text-sm ${
              tab === "saved" ? "bg-black text-white" : "text-neutral-700 hover:bg-neutral-100"
            }`}
          >
            <Bookmark className="h-4 w-4" /> Saved
            <span className={`rounded-full px-2 text-[11px] ${tab === "saved" ? "bg-[#ffcf00] text-black" : "bg-neutral-200"}`}>{savedCount}</span>
          </Link>
          <Link
            to={hrefWith(state, { tab: "won" })}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-wider sm:text-sm ${
              tab === "won" ? "bg-red-600 text-white" : "text-neutral-700 hover:bg-neutral-100"
            }`}
          >
            <Sparkles className="h-4 w-4 text-[#ffcf00]" /> Won
            <span className={`rounded-full px-2 text-[11px] ${tab === "won" ? "bg-[#ffcf00] text-black" : "bg-neutral-200"}`}>{heldCount}</span>
          </Link>
        </div>

        {tab === "saved" ? (
          <>
            <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-wrap gap-1.5">
                {SHOWS.map((s) => (
                  <Link
                    key={s.id}
                    to={hrefWith(state, { show: s.id })}
                    className={`flex items-center gap-1.5 border-2 px-3 py-1.5 text-[11px] font-black uppercase tracking-wider ${
                      show === s.id ? "border-black bg-black text-white" : "border-black bg-white text-neutral-700 hover:bg-neutral-100"
                    }`}
                  >
                    {s.label}
                    <span className={`rounded-full px-1.5 text-[10px] ${show === s.id ? "bg-[#ffcf00] text-black" : "bg-neutral-200"}`}>
                      {counts[s.id]}
                    </span>
                  </Link>
                ))}
              </div>

              <Form method="get" className="relative w-full md:max-w-xs">
                <input type="hidden" name="show" value={show} />
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                <input
                  type="search"
                  name="q"
                  defaultValue={q}
                  placeholder="Search your Luckboard…"
                  aria-label="Search your Luckboard"
                  className="w-full border-2 border-black bg-white py-2 pl-9 pr-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[var(--pink)]"
                />
              </Form>
            </div>

            {items.length === 0 ? (
              <EmptySaved show={show} q={q} />
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((item) => (
                  <SavedCard key={`${item.type}:${item.slug}`} item={item} status={statusOf(item)} />
                ))}
              </div>
            )}
          </>
        ) : (
          <WonTab collection={collection} redemptions={redemptions} />
        )}
      </div>
      <Footer />
    </>
  );
}

function SavedCard({ item, status }: { item: Item; status: LBStatus }) {
  const badge = STATUS_BADGE[status];
  const faded = status === "skip";
  return (
    <div className={`flex flex-col justify-between border-[3px] border-black p-4 shadow-hard-sm ${faded ? "bg-neutral-50" : "bg-white"}`}>
      <div>
        <div className="mb-2.5 flex items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="border border-black bg-[#fff0f8] px-2 py-0.5 text-[9.5px] font-black uppercase tracking-wider text-[var(--pink)]">
              {item.badge}
            </span>
            <span className={`border px-2 py-0.5 text-[9.5px] font-black uppercase tracking-wider ${badge.cls}`}>{badge.label}</span>
          </div>
          {/* Its own fetcher per card: quick taps on two cards can't cancel each other. */}
          <LuckboardToggle itemType={item.type} itemSlug={item.slug} />
        </div>
        <h2 className={`text-sm font-black uppercase leading-tight sm:text-base ${faded ? "text-neutral-500" : "text-black"}`}>
          {item.name}
        </h2>
        <p className="mt-1 text-xs text-[var(--t2)]">{item.sub}</p>
      </div>

      <div className="mt-4 flex items-center gap-2 border-t-2 border-black/10 pt-3">
        <Link to={item.to} className="text-[11px] font-black uppercase tracking-wider text-[var(--pink)] hover:underline">
          View on Luckee →
        </Link>
        {item.claim && (
          <a
            href={item.claim}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto inline-flex items-center gap-1 border-2 border-black bg-[#ffcf00] px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-black hover:bg-[#ffe04d]"
          >
            Claim <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
    </div>
  );
}

function EmptySaved({ show, q }: { show: Show; q: string }) {
  const message = q
    ? `Nothing on your Luckboard matches "${q}".`
    : show === "want"
      ? "Nothing marked Want to try yet."
      : show === "done"
        ? "Nothing marked Done yet. Tick things off as you claim them."
        : show === "skip"
          ? "Nothing marked Not for me."
          : "No items to show.";
  return (
    <div className="border-[3px] border-black bg-white px-6 py-14 text-center shadow-hard-md">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center border-2 border-black bg-[#ffcf00] shadow-hard-sm">
        <Gift className="h-7 w-7 text-black" />
      </div>
      <p className="mx-auto mb-6 max-w-sm text-sm font-bold text-neutral-700">{message}</p>
      <div className="flex flex-wrap justify-center gap-2">
        {(q || show !== "all") && (
          <Link
            to={`/luckboard?show=all`}
            className="inline-flex items-center gap-2 border-2 border-black bg-black px-4 py-2 text-xs font-black uppercase tracking-wider text-white"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Explore all
          </Link>
        )}
        <Link
          to="/freebies"
          className="inline-flex items-center gap-2 border-2 border-black bg-[#ffcf00] px-4 py-2 text-xs font-black uppercase tracking-wider text-black"
        >
          <Bookmark className="h-3.5 w-3.5" /> Browse freebies
        </Link>
      </div>
    </div>
  );
}

function WonTab({
  collection,
  redemptions,
}: {
  collection: Record<"food" | "drink" | "grand", number>;
  redemptions: { id: string; prize_type: string; units: number; status: string; arranged_for: string | null; created_at: string }[];
}) {
  const types: ("food" | "drink" | "grand")[] = ["food", "drink", "grand"];
  const nothingYet = types.every((t) => collection[t] === 0) && redemptions.length === 0;

  if (nothingYet) {
    return (
      <div className="border-[3px] border-black bg-white px-6 py-14 text-center shadow-hard-md">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center border-2 border-black bg-[#ffcf00] text-2xl shadow-hard-sm">🎰</div>
        <p className="mx-auto mb-6 max-w-sm text-sm font-bold text-neutral-700">
          Nothing won yet. Food, drink and grand-prize capsules from the gachapon collect here.
        </p>
        <Link
          to="/rewards"
          className="inline-flex items-center gap-2 border-2 border-black bg-red-600 px-5 py-2.5 text-xs font-black uppercase tracking-widest text-white hover:bg-black"
        >
          <Sparkles className="h-4 w-4 text-[#ffcf00]" /> Play the gachapon
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {types.map((type) => {
          const prize = PRIZES[type as PrizeType];
          const held = collection[type];
          const ready = held >= prize.threshold;
          const pct = Math.min(100, Math.round((held / prize.threshold) * 100));
          return (
            <div key={type} className="border-[3px] border-black bg-white p-4 shadow-hard-sm">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-2xl" aria-hidden>{prize.icon}</span>
                {ready && (
                  <span className="border border-black bg-emerald-400 px-2 py-0.5 text-[9.5px] font-black uppercase tracking-wider text-black">
                    Ready to redeem
                  </span>
                )}
              </div>
              <h2 className="text-sm font-black uppercase text-black">{prize.label}</h2>
              <p className="mt-1 text-xs font-bold text-neutral-600">
                {held} of {prize.threshold} collected
              </p>
              <div className="mt-2 h-2.5 border-2 border-black bg-neutral-100" role="progressbar" aria-valuenow={held} aria-valuemin={0} aria-valuemax={prize.threshold}>
                <div className="h-full" style={{ width: `${pct}%`, background: prize.color }} />
              </div>
            </div>
          );
        })}
      </div>

      {redemptions.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-black uppercase tracking-wider text-black">Your redemptions</h2>
          <div className="space-y-2">
            {redemptions.map((r) => {
              const prize = PRIZES[r.prize_type as PrizeType];
              return (
                <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 border-2 border-black bg-white px-3 py-2">
                  <span className="text-xs font-black text-black">
                    {prize?.icon} {prize?.label ?? r.prize_type} ×{r.units}
                  </span>
                  <span className="text-[11px] font-bold text-neutral-600">
                    {REDEMPTION_LABEL[r.status] ?? r.status}
                    {r.arranged_for ? ` · ${r.arranged_for}` : ""}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <Link
        to="/rewards"
        className="inline-flex items-center gap-2 border-2 border-black bg-red-600 px-5 py-2.5 text-xs font-black uppercase tracking-widest text-white hover:bg-black"
      >
        <Sparkles className="h-4 w-4 text-[#ffcf00]" /> Redeem or play on Rewards
      </Link>
    </div>
  );
}
