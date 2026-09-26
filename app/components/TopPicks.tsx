import { useState } from "react";
import { Link } from "react-router";
import { m } from "framer-motion";
import { ArrowRight, Gift, RotateCcw, ShieldCheck, Sparkles } from "lucide-react";
import { SparkleStarSvg, renderBrandOrEmojiSvg } from "~/components/SvgIcons";
import { playTactileClick, playCoinSparkle } from "~/lib/sound";
import { BDAY_FOOD } from "~/data/birthday-food";
import { BDAY_BEAUTY } from "~/data/birthday-beauty";
import type { Freebie } from "~/data/types";

/** The badges that drop into the pile — the verified picks, in data order. */
const DROPS: Freebie[] = [
  ...BDAY_FOOD.filter((f) => f.verified).slice(0, 5),
  ...BDAY_BEAUTY.filter((f) => f.verified).slice(0, 2),
];

/** Per-category colourway, keyed off the same `cat` the cards use elsewhere. */
const SKINS: Record<Freebie["cat"], string> = {
  food: "bg-[#fff7ed] border-[#fdba74] text-[#9a3412]",
  bty: "bg-[#faf5ff] border-[#d8b4fe] text-[#6b21a8]",
  sgn: "bg-[#f0fdf4] border-[#86efac] text-[#15803d]",
};

const PERK_SKINS: Record<Freebie["cat"], string> = {
  food: "bg-[#ffedd5] text-[#c2410c]",
  bty: "bg-[#f3e8ff] text-[#7e22ce]",
  sgn: "bg-[#dcfce7] text-[#15803d]",
};

/** Deterministic tilt — no randomness, so the server and client agree. */
function tilt(i: number) {
  const from = i % 2 === 0 ? -14 - i : 14 + i;
  const to = i % 2 === 0 ? -3.5 + i * 0.3 : 3.5 - i * 0.3;
  return { from, to, delay: 0.1 + i * 0.18 };
}

const BENEFITS = [
  {
    icon: <Gift className="h-4 w-4" />,
    title: "100% zero-cost perks",
    body: "Genuine birthday meals, drinks and gifts with no surprise subscriptions or fees.",
  },
  {
    icon: <ShieldCheck className="h-4 w-4" />,
    title: "Luckee-stamped verification",
    body: "Checked by a Melbourne local, with confirmed claim windows, app steps and store terms.",
  },
  {
    icon: <Sparkles className="h-4 w-4" />,
    title: "Instant direct claims",
    body: "Official links and step-by-step sign-up instructions so you can redeem fast.",
  },
];

export function TopPicks() {
  // Bumping the key remounts the pile, replaying the drop animation.
  const [dropKey, setDropKey] = useState(0);

  return (
    <section id="freebies" className="border-b border-[#ec489922] bg-white px-4 py-16 md:px-8 md:py-20">
      <div className="mx-auto max-w-[1080px]">
        <div className="mb-6">
          <p className="eyebrow inline-flex items-center gap-1.5">
            <SparkleStarSvg size={14} /> Curated perks
          </p>
          <h2 className="sec-h">Luckee's top freebies</h2>
          <p className="sec-p mt-1">
            Hand-checked Melbourne favourites. Every offer is tagged{" "}
            <strong>✓ Verified by Luckee</strong> or flagged as community-listed, so you know what's
            been confirmed.
          </p>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-3.5 sm:grid-cols-3">
          {BENEFITS.map((b) => (
            <div
              key={b.title}
              className="flex items-start gap-3 rounded-2xl border border-[#ec48992e] bg-[#fff0f8] p-4"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-[var(--pink)] shadow-xs">
                {b.icon}
              </span>
              <div>
                <div className="text-xs font-black text-[var(--t1)]">{b.title}</div>
                <p className="mt-0.5 text-[11px] leading-snug text-[var(--t2)]">{b.body}</p>
              </div>
            </div>
          ))}
        </div>

        {/* The drop stage */}
        <div className="mb-8 overflow-hidden rounded-3xl border-2 border-dashed border-[#ec489938] bg-gradient-to-b from-[#faf5ff] via-[#fff5fa] to-white p-5 shadow-xs sm:p-8">
          <div className="mb-6 flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#ec489933] bg-white px-3 py-1 shadow-xs">
              <span className="h-2 w-2 rounded-full bg-[#059669]" />
              <span className="text-[11px] font-extrabold tracking-tight text-[var(--t2)]">
                Melbourne freebie drop • tap a brand to explore
              </span>
            </span>

            <button
              type="button"
              onClick={() => {
                playTactileClick();
                setDropKey((k) => k + 1);
              }}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-[#ec489933] bg-white px-3 py-1 text-[11px] font-bold text-[var(--pink)] shadow-xs transition-colors hover:bg-[#fff0f8] active:scale-95"
              title="Replay the drop"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Drop again</span>
            </button>
          </div>

          <div
            key={dropKey}
            className="relative mx-auto flex min-h-[170px] max-w-3xl flex-wrap items-center justify-center gap-3 px-2 py-4 sm:min-h-[190px] sm:gap-4"
          >
            {DROPS.map((f, i) => {
              const { from, to, delay } = tilt(i);
              return (
                <m.div
                  key={f.n}
                  initial={{ y: -190, opacity: 0, scale: 0.65, rotate: from }}
                  animate={{ y: 0, opacity: 1, scale: 1, rotate: to }}
                  transition={{ type: "spring", stiffness: 240, damping: 17, mass: 1.05, delay }}
                  whileHover={{ scale: 1.1, rotate: 0, zIndex: 35 }}
                  whileTap={{ scale: 0.94 }}
                >
                  <Link
                    to={f.cat === "bty" ? "/freebies/birthday-freebies?filter=beauty" : "/freebies/birthday-freebies?filter=food"}
                    onClick={playCoinSparkle}
                    className={`group inline-flex select-none items-center gap-2.5 rounded-2xl border-2 px-4 py-2.5 shadow-md transition-shadow sm:px-5 sm:py-3 ${SKINS[f.cat]}`}
                  >
                    <span className="shrink-0 transition-transform group-hover:scale-110">
                      {renderBrandOrEmojiSvg(f.e, 22, "w-5.5 h-5.5")}
                    </span>
                    <span className="text-left">
                      <span className="flex items-center gap-1.5 text-xs font-black tracking-tight sm:text-sm">
                        {f.n}
                        <span className="text-[10px] text-[var(--pink)] opacity-0 transition-opacity group-hover:opacity-100">
                          →
                        </span>
                      </span>
                      <span
                        className={`mt-0.5 inline-block rounded-md px-1.5 text-[10px] font-extrabold ${PERK_SKINS[f.cat]}`}
                      >
                        ✓ {f.r}
                      </span>
                    </span>
                  </Link>
                </m.div>
              );
            })}
          </div>

          <div className="mt-4 h-1 w-full bg-gradient-to-r from-transparent via-[#ec489933] to-transparent" />
        </div>

        <div className="pt-2 text-center">
          <Link
            to="/freebies/birthday-freebies"
            onClick={playTactileClick}
            className="btn-pink inline-flex items-center gap-2 px-8 py-3 text-sm"
          >
            <span>Browse all birthday freebies</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
          <p className="mt-2 text-xs font-medium text-[var(--t2)]">
            Explore the full food, beauty, birthday and sign-up perks
          </p>
        </div>
      </div>
    </section>
  );
}
