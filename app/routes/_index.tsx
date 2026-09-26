import type { MetaFunction } from "react-router";
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

export default function Home() {
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
        <ReferralDeals />
        <TopPicks />
        <FreeMelbourne />
        <DinnersTeaser />
        <RewardsBanner />
        <Corkboard />
      </div>
      <Footer />
    </>
  );
}
