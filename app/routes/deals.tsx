import { useEffect, useRef } from "react";
import type { MetaFunction } from "react-router";
import { Nav } from "~/components/Nav";
import { Footer } from "~/components/Footer";
import { LuckeeStamp } from "~/components/LuckeeStamp";
import { ReferralDealCard } from "~/components/ReferralDealCard";
import { DEALS } from "~/data/deals";
import { prefersReducedMotion } from "~/lib/reducedMotion";
import { initScrollReveals } from "~/lib/scrollReveal";

export const meta: MetaFunction = () => [
  { title: "Deals I Recommend — Referral Bonuses & Savings Apps | Luckee" },
  { name: "description", content: "Products Vanessa actually uses. Sign up via referral links to get a welcome bonus — Claude Pro, Blossom, Kris+ and Macadam." },
  { property: "og:title", content: "Deals | Luckee" },
  { tagName: "link", rel: "canonical", href: "https://luckee-app.pages.dev/deals" },
];

export default function Deals() {
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (prefersReducedMotion() || !rootRef.current) return;
    return initScrollReveals(rootRef.current);
  }, []);

  return (
    <>
      <Nav />
      <div className="wrap" ref={rootRef}>
        {/* v2's header banner: intro on the left, the stamp explained on the right. */}
        <div className="mb-8 mt-8 rounded-3xl border border-[#ec489926] bg-white p-6 shadow-xs md:p-8">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div className="sec-hd max-w-2xl" style={{ padding: 0 }}>
              <p className="eyebrow">💸 Referral deals</p>
              <h1 className="sec-h">Deals I recommend</h1>
              <p className="sec-p">
                Products I actually use. Sign up through my referral link and you'll usually get a
                welcome bonus — and so will I. Marked clearly where a referral code is involved.
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-3 self-start rounded-2xl border border-[#ec489926] bg-[#fff5fa] p-3.5 md:self-auto">
              <LuckeeStamp size="md" rotate={-5} tooltipText="Stamped on deals I use myself" />
              <div className="text-left">
                <p className="text-xs font-black text-[var(--t1)]">The Luckee stamp</p>
                <p className="mt-0.5 max-w-[160px] text-[11px] leading-tight text-[var(--t2)]">
                  On every deal here — each one is something I use myself.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-16 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
          {DEALS.map((d) => (
            <ReferralDealCard key={d.cls} deal={d} variant="full" />
          ))}
        </div>
      </div>
      <Footer />
    </>
  );
}
