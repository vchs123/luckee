import { useLoaderData } from "react-router";
import type { LoaderFunctionArgs, MetaFunction } from "react-router";
import { getSupabase } from "~/lib/supabase.server";
import type { CommunityPin } from "~/lib/pins";
import { userContext } from "~/lib/auth.context";
import { DropsTeaser } from "~/components/DropsTeaser";
import { likerKey, loadDrops } from "~/lib/drops.server";
import { melbToday } from "~/lib/melbDate";
import type { DealDrop } from "~/lib/drops";
import { useEffect, useRef } from "react";
import { Nav } from "~/components/Nav";
import { Footer } from "~/components/Footer";
import { Hero } from "~/components/Hero";
import { ReferralDeals } from "~/components/ReferralDeals";
import { TopPicks } from "~/components/TopPicks";
import { FreeMelbourne } from "~/components/FreeMelbourne";
import { DinnersTeaser } from "~/components/DinnersTeaser";
import { RewardsBanner } from "~/components/RewardsBanner";
import { Corkboard } from "~/components/Corkboard";
import { prefersReducedMotion } from "~/lib/reducedMotion";
import { initScrollReveals } from "~/lib/scrollReveal";

export const meta: MetaFunction = () => [
  { title: "Luckee — Melbourne Freebies, Deals & Community Dinners" },
  { name: "description", content: "Melbourne's best birthday freebies, affiliate deals, free experiences and community dinners — curated and verified by a local." },
  { property: "og:title", content: "Luckee — Melbourne Freebies, Deals & Community Dinners" },
  { property: "og:description", content: "Birthday perks, loyalty sign-ups, free galleries and community dinners — curated for Melbourne locals." },
  { property: "og:type", content: "website" },
];

/** Approved community pins for the corkboard, newest first. Empty until any are approved. */
export async function loader({ request, context }: LoaderFunctionArgs) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const env = (context as any)?.cloudflare?.env as Env;
  const viewer = context.get(userContext);
  let pins: CommunityPin[] = [];
  try {
    const supabase = getSupabase(env);
    const { data } = await supabase
      .from("community_pins")
      .select("id, user_id, title, spot, savings, notes, emoji, created_at")
      .eq("status", "approved")
      .order("reviewed_at", { ascending: false })
      .limit(8);
    const rows = data ?? [];
    const ids = [...new Set(rows.map((r) => r.user_id as string | null).filter((id): id is string => !!id))];
    const pinIds = rows.map((r) => r.id as string);
    const [{ data: profiles }, { data: likes }] = await Promise.all([
      ids.length ? supabase.from("user_profiles").select("id, username").in("id", ids) : Promise.resolve({ data: [] }),
      // Likes come from sql/community_pin_likes.sql; until it's run this errors and counts stay 0.
      pinIds.length
        ? supabase.from("community_pin_likes").select("pin_id, user_id").in("pin_id", pinIds)
        : Promise.resolve({ data: [] }),
    ]);
    const names = new Map((profiles ?? []).map((p) => [p.id as string, p.username as string]));
    const likeRows = (likes ?? []) as { pin_id: string; user_id: string }[];
    pins = rows.map((r) => ({
      id: r.id as string,
      title: r.title as string,
      spot: r.spot as string,
      savings: (r.savings as string | null) ?? null,
      notes: (r.notes as string | null) ?? null,
      emoji: r.emoji as string,
      username: names.get(r.user_id as string) ?? null,
      createdAt: r.created_at as string,
      likes: likeRows.filter((l) => l.pin_id === r.id).length,
      liked: !!viewer && likeRows.some((l) => l.pin_id === r.id && l.user_id === viewer.id),
      mine: !!viewer && r.user_id === viewer.id,
    }));
  } catch {
    /* the corkboard falls back to its example pins */
  }
  // The newest deal drops (empty until sql/deal_drops.sql has run and one is posted).
  let drops: DealDrop[] = [];
  try {
    drops = await loadDrops(getSupabase(env), env.SUPABASE_URL, likerKey(request, viewer), { limit: 3 });
  } catch {
    /* section hidden */
  }

  return { pins, drops, today: melbToday() };
}

export default function Home() {
  const { pins, drops, today } = useLoaderData<typeof loader>();
  const pageRef = useRef<HTMLDivElement>(null);

  // Scroll reveals for section headers (the hero animates on mount instead).
  useEffect(() => {
    if (prefersReducedMotion() || !pageRef.current) return;
    return initScrollReveals(pageRef.current);
  }, []);

  return (
    <>
      <Nav />
      <div ref={pageRef}>
        <Hero />
        <DropsTeaser drops={drops} today={today} />
        <ReferralDeals />
        <TopPicks />
        <FreeMelbourne />
        <DinnersTeaser />
        <RewardsBanner />
        <Corkboard pins={pins} />
      </div>
      <Footer />
    </>
  );
}
