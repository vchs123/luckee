import { useState } from "react";
import { Link } from "react-router";
import { ArrowRight, Bookmark, Check, Copy, ExternalLink } from "lucide-react";
import { LuckyGoldCoinSvg } from "~/components/SvgIcons";
import { LuckeeStamp } from "~/components/LuckeeStamp";
import { LuckboardToggle } from "~/components/LuckboardToggle";
import { useAuth } from "~/hooks/useAuth";
import { DEALS } from "~/data/deals";
import { slugify } from "~/lib/slugify";
import { trackDealClick } from "~/lib/dealClick";
import { playCoinSparkle, playTactileClick } from "~/lib/sound";

/** Brand marks, as used by the other deal surfaces. */
const LOGO_MAP: Record<string, string> = {
  cld: "/claude-logo.png",
  bls: "/blossom-logo.png",
  krs: "/kris-plus-logo.png",
  mac: "/macadam-logo.png",
  rvl: "/revolut-logo.jpg",
  eat: "/eatclub-logo.svg",
};

// Claude Pro stays on /deals only, keeping the homepage row lighter.
const PREVIEW = DEALS.filter((d) => d.cls !== "cld").slice(0, 4);

export function ReferralDeals() {
  const { user } = useAuth();
  const [copied, setCopied] = useState<string | null>(null);

  function copyCode(code: string, name: string) {
    navigator.clipboard?.writeText(code).then(
      () => {
        playCoinSparkle();
        setCopied(name);
        setTimeout(() => setCopied((c) => (c === name ? null : c)), 2200);
      },
      () => {},
    );
  }

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
          {PREVIEW.map((d) => {
            const isCopied = copied === d.n;
            return (
              <div
                key={d.n}
                className="group flex flex-col justify-between rounded-2xl border border-[#ec489926] bg-white p-4 shadow-xs transition-all hover:border-[#ec489955] hover:shadow-md"
              >
                <div>
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <span className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl border border-[#ec489922] bg-[#faf5ff] transition-colors group-hover:border-[#ec489944]">
                      {LOGO_MAP[d.cls] ? (
                        <img src={LOGO_MAP[d.cls]} alt="" width={34} height={34} className="object-contain" />
                      ) : (
                        <span aria-hidden className="text-xl">{d.e}</span>
                      )}
                    </span>

                    <span className="flex items-center gap-2">
                      <LuckeeStamp size="xs" rotate={-6} tooltipText="Tried & tested by Luckee" />
                      <span className="rounded-full border border-[#ec489922] bg-[#faf5ff] px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-[var(--t2)]">
                        {d.tags[0] ?? "Referral"}
                      </span>
                    </span>
                  </div>

                  <h3 className="line-clamp-1 text-sm font-bold tracking-tight text-[var(--t1)] transition-colors group-hover:text-[var(--pink)]">
                    {d.n}
                  </h3>
                  <p className="mb-2 mt-0.5 line-clamp-1 text-xs font-black text-[var(--pink)]">
                    {d.reward}
                  </p>
                  <p className="mb-4 line-clamp-2 text-[11px] leading-relaxed text-[var(--t2)]">
                    {d.desc}
                  </p>
                </div>

                <div className="space-y-2 border-t border-neutral-100 pt-2">
                  {d.code && (
                    <div className="flex items-center justify-between rounded-xl border border-[#ec489933] bg-[#fff5fa] p-1 pl-2.5">
                      <span className="font-mono-code truncate text-xs font-black tracking-wider text-[var(--t1)]">
                        {d.code}
                      </span>
                      <button
                        type="button"
                        onClick={() => copyCode(d.code!, d.n)}
                        className={`flex cursor-pointer items-center gap-1 rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-wider transition-all ${
                          isCopied
                            ? "bg-emerald-500 text-white shadow-xs"
                            : "bg-[var(--pink)] text-white hover:bg-[#be185d]"
                        }`}
                      >
                        {isCopied ? (
                          <>
                            <Check className="h-3 w-3" /> Copied
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" /> Copy
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    {user ? (
                      <span className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[#ec489922] bg-white py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--t2)]">
                        <LuckboardToggle itemType="deal" itemSlug={slugify(d.n)} />
                        Luckboard
                      </span>
                    ) : (
                      <Link
                        to="/login"
                        className="flex flex-1 items-center justify-center gap-1 rounded-xl border border-[#ec489922] bg-white px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--t2)] transition-colors hover:bg-neutral-50 hover:text-[var(--t1)]"
                      >
                        <Bookmark className="h-3 w-3 text-[var(--pink)]" />
                        Save it
                      </Link>
                    )}

                    <a
                      href={d.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => trackDealClick(d.n, { awardPoints: Boolean(user) })}
                      className="shrink-0 rounded-xl bg-neutral-900 p-1.5 text-white transition-colors hover:bg-black"
                      title={`Visit ${d.n}`}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
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
