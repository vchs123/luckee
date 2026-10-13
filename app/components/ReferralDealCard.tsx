import { useEffect, useRef, useState } from "react";
import { Link, useFetcher } from "react-router";
import { Bookmark, Check, ChevronDown, Copy, ExternalLink } from "lucide-react";
import type { Deal } from "~/data/types";
import { BLOSSOM_TIERS } from "~/data/deals";
import { LuckeeStamp } from "~/components/LuckeeStamp";
import { LuckboardToggle } from "~/components/LuckboardToggle";
import { useAuth } from "~/hooks/useAuth";
import { trackDealClick } from "~/lib/dealClick";
import { playCoinSparkle, playTactileClick } from "~/lib/sound";

/** Brand marks. A deal without one falls back to its emoji. */
const LOGOS: Partial<Record<Deal["cls"], string>> = {
  cld: "/claude-logo.png",
  bls: "/blossom-logo.png",
  krs: "/kris-plus-logo.png",
  mac: "/macadam-logo.png",
  rvl: "/revolut-logo.jpg",
  eat: "/eatclub-logo.svg",
};

interface Props {
  deal: Deal;
  /** compact: the home page row. full: /deals, with everything the deal carries. */
  variant?: "compact" | "full";
}

/**
 * One referral deal, shared by the home page and /deals so the two can't drift.
 *
 * The Luckboard slug is always `deal.cls`: that's what the Luckboard page looks
 * deals up by. (The home page once used a name slug, so its saves never showed
 * up there — see sql/fix_deal_luckboard_slugs.sql.)
 */
export function ReferralDealCard({ deal: d, variant = "compact" }: Props) {
  const full = variant === "full";
  const { user } = useAuth();
  const fetcher = useFetcher<{ ok: boolean; pts: number }>();
  const [toast, setToast] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  // "See more" only when the clamp actually hides text. Measured after mount
  // (the server can't know), and again when the width changes the wrapping.
  const descRef = useRef<HTMLParagraphElement>(null);
  const [clamped, setClamped] = useState(true);
  useEffect(() => {
    if (!full) return;
    const el = descRef.current;
    if (!el) return;
    const measure = () => {
      if (!expanded) setClamped(el.scrollHeight > el.clientHeight + 1);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [full, expanded]);

  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data?.pts) {
      setToast(`+${fetcher.data.pts} pts`);
      const t = setTimeout(() => setToast(null), 2500);
      return () => clearTimeout(t);
    }
  }, [fetcher.state, fetcher.data]);

  function handleOutbound() {
    // Points go through the fetcher, not trackDealClick, so the toast can show them.
    trackDealClick(d, { awardPoints: false });
    if (user) {
      fetcher.submit(
        { action: "deal_click", deal: d.cls },
        { method: "POST", action: "/api/award-points", encType: "application/json" },
      );
    }
  }

  function copyCode(code: string) {
    navigator.clipboard?.writeText(code).then(
      () => {
        playCoinSparkle();
        setCopied(true);
        setTimeout(() => setCopied(false), 2200);
      },
      () => {},
    );
  }

  const logo = LOGOS[d.cls];
  const ctaLabel = d.cta.replace(/\s*→\s*$/, "");
  const extraTags = full ? d.tags : [];

  return (
    <div
      id={full ? d.cls : undefined}
      className="group relative flex scroll-mt-24 flex-col justify-between rounded-2xl border border-[#ec489926] bg-white p-4 shadow-xs transition-all hover:border-[#ec489955] hover:shadow-md"
    >
      {toast && (
        <span className="absolute right-3 top-3 z-10 rounded-full bg-[#059669] px-2.5 py-1 text-xs font-black text-white shadow-md">
          {toast}
        </span>
      )}

      <div>
        <div className="mb-3 flex items-center justify-between gap-2">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#ec489922] bg-[#faf5ff] transition-colors group-hover:border-[#ec489944]">
            {logo ? (
              <img src={logo} alt="" width={34} height={34} className="object-contain" />
            ) : (
              <span aria-hidden className="text-xl">{d.e}</span>
            )}
          </span>
          <span className="flex items-center gap-2">
            <LuckeeStamp size="xs" rotate={-6} tooltipText="Tried & tested by Luckee" />
            {!full && d.tags[0] && (
              <span className="rounded-full border border-[#ec489922] bg-[#faf5ff] px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-[var(--t2)]">
                {d.tags[0]}
              </span>
            )}
          </span>
        </div>

        <h3 className="line-clamp-1 text-sm font-bold tracking-tight text-[var(--t1)] transition-colors group-hover:text-[var(--pink)] sm:text-base">
          {d.n}
        </h3>
        {full && <p className="text-[11px] text-[var(--t3)]">{d.sub}</p>}

        {/* `rl` carries instructions as well as labels — Revolut's bonus needs a
            DM on Instagram *before* signing up — so it's shown on both variants. */}
        <p className="mt-2 text-[10px] font-black uppercase tracking-wider text-[var(--t3)]">{d.rl}</p>
        <p className="mb-2 text-xs font-black text-[var(--pink)] sm:text-sm">{d.reward}</p>

        {full ? (
          <div className="mb-3">
            <p ref={descRef} className={`text-xs leading-relaxed text-[var(--t2)] ${expanded ? "" : "line-clamp-3"}`}>{d.desc}</p>
            {(clamped || expanded) && (
            <button
              type="button"
              onClick={() => {
                playTactileClick();
                setExpanded((e) => !e);
              }}
              aria-expanded={expanded}
              className="mt-1 flex cursor-pointer items-center gap-1 text-[10px] font-black uppercase text-[var(--pink)] transition-colors hover:text-[#be185d]"
            >
              {expanded ? "Show less" : "See more"}
              <ChevronDown className={`h-3 w-3 transition-transform ${expanded ? "rotate-180" : ""}`} />
            </button>
            )}
          </div>
        ) : (
          <p className="mb-4 line-clamp-2 text-[11px] leading-relaxed text-[var(--t2)]">{d.desc}</p>
        )}

        {full && d.cls === "bls" && (
          <div className="mb-3 rounded-xl border border-[#05966922] bg-[#f0fdf7] p-2.5">
            <ul className="space-y-1">
              {BLOSSOM_TIERS.map((tier) => (
                <li key={tier.name} className="flex flex-wrap items-baseline justify-between gap-x-2 text-[11px]">
                  <span className="font-bold text-[#047857]">{tier.name}</span>
                  <span className="font-black text-[var(--t1)]">{tier.rate}</span>
                  <span className="w-full text-[10px] text-[var(--t3)]">{tier.from} · {tier.access}</span>
                </li>
              ))}
            </ul>
            {/* Financial product: this disclaimer is not optional. */}
            <p className="mt-2 text-[10px] leading-snug text-[var(--t3)]">
              Target returns are not guaranteed. Not a bank. Read the PDS before investing.
            </p>
          </div>
        )}

        {extraTags.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {extraTags.map((tag) => (
              <span key={tag} className="rounded-full bg-[#faf5ff] px-2 py-0.5 text-[10px] font-bold text-[var(--t2)]">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2 border-t border-neutral-100 pt-2">
        {d.code && (
          <div className="flex items-center justify-between rounded-xl border border-[#ec489933] bg-[#fff5fa] p-1 pl-2.5">
            <span className="font-mono-code truncate text-xs font-black tracking-wider text-[var(--t1)]">{d.code}</span>
            <button
              type="button"
              onClick={() => copyCode(d.code!)}
              className={`flex cursor-pointer items-center gap-1 rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-wider transition-all ${
                copied ? "bg-emerald-500 text-white shadow-xs" : "bg-[var(--pink)] text-white hover:bg-[#be185d]"
              }`}
            >
              {copied ? <><Check className="h-3 w-3" /> Copied</> : <><Copy className="h-3 w-3" /> Copy</>}
            </button>
          </div>
        )}

        <div className="flex items-center gap-2">
          {user ? (
            <span className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[#ec489922] bg-white py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--t2)]">
              <LuckboardToggle itemType="deal" itemSlug={d.cls} />
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

          {full ? (
            <a
              href={d.link}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleOutbound}
              className="btn-pink inline-flex shrink-0 items-center gap-1.5 px-4 py-2 text-xs"
            >
              {ctaLabel}
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          ) : (
            <a
              href={d.link}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleOutbound}
              className="shrink-0 rounded-xl bg-neutral-900 p-1.5 text-white transition-colors hover:bg-black"
              title={`Visit ${d.n}`}
              aria-label={`Visit ${d.n}`}
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
