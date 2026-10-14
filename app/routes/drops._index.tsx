import { useLoaderData } from "react-router";
import type { LoaderFunctionArgs, MetaFunction } from "react-router";
import { Nav } from "~/components/Nav";
import { Footer } from "~/components/Footer";
import { DropCard } from "~/components/DropCard";
import { getSupabase } from "~/lib/supabase.server";
import { userContext } from "~/lib/auth.context";
import { likerKey, loadDrops } from "~/lib/drops.server";
import { melbToday } from "~/lib/melbDate";
import type { DealDrop } from "~/lib/drops";

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
  let drops: DealDrop[] = [];
  try {
    drops = await loadDrops(getSupabase(env), env.SUPABASE_URL, likerKey(request, context.get(userContext)), { limit: 60 });
  } catch {
    /* shown as "coming soon" */
  }
  return { drops, today: melbToday() };
}

export default function Drops() {
  const { drops, today } = useLoaderData<typeof loader>();
  return (
    <>
      <Nav />
      <main className="wrap pb-16">
        <div className="sec-hd">
          <p className="eyebrow">🎁 Deal drops</p>
          <h1 className="sec-h">Fresh freebies & discounts</h1>
          <p className="sec-p">What's free or cheap around Melbourne right now, and exactly how to get it. Like the ones you're keen on and share them with a friend.</p>
        </div>
        {drops.length === 0 ? (
          <p className="text-[15px] text-[var(--t3)]">The first drops are on their way. Check back soon!</p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {drops.map((d) => (
              <DropCard key={d.id} drop={d} today={today} />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
