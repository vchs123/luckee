import { Link, useLoaderData } from "react-router";
import type { LoaderFunctionArgs, MetaFunction } from "react-router";
import { Nav } from "~/components/Nav";
import { Footer } from "~/components/Footer";
import { DropCard } from "~/components/DropCard";
import { getSupabase } from "~/lib/supabase.server";
import { userContext } from "~/lib/auth.context";
import { likerKey, loadDrops } from "~/lib/drops.server";
import { melbNow } from "~/lib/melbDate";
import { DROP_CATEGORIES, ENDED_KEEP_DAYS, dropState, isDropCategory, type DealDrop } from "~/lib/drops";

export const meta: MetaFunction = () => [
  { title: "Deal drops — free food & discounts in Melbourne | Luckee" },
  { name: "description", content: "Fresh Melbourne freebies and discounts as they drop: what's free, where, and how to get it." },
  { property: "og:title", content: "Deal drops — Melbourne freebies as they land" },
  { property: "og:description", content: "Fresh Melbourne freebies and discounts: what's free, where, and how to get it." },
  { property: "og:type", content: "website" },
];

export async function loader({ request, context }: LoaderFunctionArgs) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const env = (context as any)?.cloudflare?.env as Env;
  const type = new URL(request.url).searchParams.get("type");
  const category = isDropCategory(type) ? type : undefined;
  let drops: DealDrop[] = [];
  try {
    drops = await loadDrops(getSupabase(env), env.SUPABASE_URL, likerKey(request, context.get(userContext)), { limit: 200, category });
  } catch {
    /* shown as "coming soon" */
  }
  // On now and coming up first; ended ones in their own section for
  // ENDED_KEEP_DAYS; older ones are archived (admin only).
  const now = melbNow();
  const state = new Map(drops.map((d) => [d.id, dropState(d, now)]));
  const startOf = (d: DealDrop) => d.startsOn ?? d.endsOn ?? "";
  const lastOf = (d: DealDrop) => d.endsOn ?? d.startsOn ?? "";
  const current = [
    ...drops.filter((d) => state.get(d.id) === "live"),
    ...drops.filter((d) => state.get(d.id) === "upcoming").sort((a, b) => startOf(a).localeCompare(startOf(b))),
  ];
  const ended = drops.filter((d) => state.get(d.id) === "ended").sort((a, b) => lastOf(b).localeCompare(lastOf(a)));
  return { current, ended, now, category: category ?? null };
}

export default function Drops() {
  const { current, ended, now, category } = useLoaderData<typeof loader>();
  const chip = (on: boolean) =>
    `shrink-0 border-2 border-black px-3 py-1.5 text-xs font-black uppercase tracking-wider ${on ? "bg-black text-white" : "bg-white text-black hover:bg-[#fff0f8]"}`;
  return (
    <>
      <Nav />
      <main className="wrap pb-16">
        <div className="sec-hd">
          <p className="eyebrow">🎁 Deal drops</p>
          <h1 className="sec-h">Fresh freebies & discounts</h1>
          <p className="sec-p">What's free or cheap around Melbourne right now, and exactly how to get it. Like the ones you're keen on and share them with a friend.</p>
        </div>
        <nav aria-label="Filter deal drops" className="no-scrollbar mb-6 flex gap-2 overflow-x-auto pb-1">
          <Link to="/drops" className={chip(!category)} aria-current={!category ? "page" : undefined} preventScrollReset>
            All
          </Link>
          {DROP_CATEGORIES.map((c) => (
            <Link
              key={c.key}
              to={`/drops?type=${c.key}`}
              className={chip(category === c.key)}
              aria-current={category === c.key ? "page" : undefined}
              preventScrollReset
            >
              {c.label}
            </Link>
          ))}
        </nav>
        {current.length === 0 ? (
          <p className="text-[15px] text-[var(--t3)]">
            {category ? "Nothing in this category right now. Check back soon!" : "Nothing on right now. Fresh drops are on their way!"}
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {current.map((d) => (
              <DropCard key={d.id} drop={d} now={now} />
            ))}
          </div>
        )}

        {ended.length > 0 && (
          <section aria-labelledby="ended-h" className="mt-14">
            <div className="mb-5 border-b-2 border-black pb-2">
              <h2 id="ended-h" className="text-xl font-black uppercase tracking-tight text-black">Ended</h2>
              <p className="text-xs font-bold text-neutral-600">
                Missed it? These have finished. They stay here for {ENDED_KEEP_DAYS} days in case they come back.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {ended.map((d) => (
                <DropCard key={d.id} drop={d} now={now} />
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
