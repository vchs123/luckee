import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import { LuckyGoldCoinSvg } from "~/components/SvgIcons";
import { ReferralDealCard } from "~/components/ReferralDealCard";
import { DEALS } from "~/data/deals";
import { playTactileClick } from "~/lib/sound";

// Claude Pro stays on /deals only, keeping the homepage row lighter.
const PREVIEW = DEALS.filter((d) => d.cls !== "cld").slice(0, 4);

export function ReferralDeals() {
  return (
    <section
      id="coupons"
      className="relative border-b border-[#ec48992e] bg-gradient-to-b from-[#f0f4ff]/40 via-white to-[#fff0f8]/40 px-4 py-14 sm:px-6 sm:py-16 md:py-20 lg:px-8"
    >
      <div className="mx-auto max-w-[1080px]">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <span className="mb-2.5 inline-flex items-center gap-1.5 rounded-full border border-[#ec489933] bg-[#fff0f8] px-3 py-1 text-xs font-black uppercase tracking-wider text-[var(--pink)]">
              <LuckyGoldCoinSvg size={14} />
              Tested &amp; recommended
            </span>
            <h2 className="font-fraunces text-2xl font-bold italic tracking-tight text-[var(--t1)] sm:text-3xl md:text-4xl">
              Referral deals I genuinely use
            </h2>
            <p className="mt-1 max-w-xl text-sm font-medium text-[var(--t2)]">
              Curated sign-up perks and member bonuses with transparent terms. Look for the Luckee
              stamp on deals I've personally tried and tested.
            </p>
          </div>

          <Link
            to="/deals"
            onClick={playTactileClick}
            className="group inline-flex items-center gap-1.5 self-start text-xs font-bold text-[var(--pink)] transition-colors hover:text-[#be185d] sm:text-sm md:self-end"
          >
            <span>View all deals</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
          {PREVIEW.map((d) => (
            <ReferralDealCard key={d.cls} deal={d} variant="compact" />
          ))}
        </div>

        <div className="text-center">
          <Link
            to="/deals"
            onClick={playTactileClick}
            className="btn-pink inline-flex items-center gap-2 px-7 py-2.5 text-xs font-bold shadow-xs hover:shadow-md"
          >
            <span>Browse all verified referral codes</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
