import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { m } from "framer-motion";
import { Particles } from "~/components/Particles";
import { LuckeeMascot } from "~/components/LuckeeMascot";
import {
  SparkleStarSvg,
  BirthdayCakeSvg,
  BotanicLeafSvg,
  BeautyCosmeticsSvg,
  BurgerSvg,
  LuckyGoldCoinSvg,
  GachaponCapsuleSvg,
} from "~/components/SvgIcons";
import { playTactileClick } from "~/lib/sound";
import { fadeUp, staggerContainer } from "~/lib/motion";

/** The four headline destinations, as cards. */
const QUICK_CARDS = [
  {
    to: "/freebies/birthday-freebies",
    title: "Birthday Freebies",
    desc: "Nando's, Boost, Krispy Kreme",
    badge: "Up to $320 value",
    icon: <BirthdayCakeSvg size={20} />,
  },
  {
    to: "/freebies/free-melbourne",
    title: "Free Melbourne",
    desc: "CBD Tram Zone, NGV, Botanic",
    badge: "Always $0",
    icon: <BotanicLeafSvg size={20} />,
  },
  {
    to: "/freebies/birthday-freebies?filter=food",
    title: "Food & Drinks",
    desc: "Jiancha, San Churro, A1",
    badge: "Up to 100% off",
    icon: <BurgerSvg size={20} />,
  },
  {
    to: "/rewards",
    title: "Gachapon Prizes",
    desc: "Spin daily, collect loot",
    badge: "Win real prizes",
    icon: <GachaponCapsuleSvg size={20} />,
  },
];

/** The remaining categories, as pills — every hero destination stays reachable. */
const QUICK_PILLS = [
  { to: "/freebies/birthday-freebies?filter=beauty", label: "Beauty", icon: <BeautyCosmeticsSvg size={14} /> },
  { to: "/freebies/events-calendar", label: "Events", icon: <SparkleStarSvg size={14} /> },
  { to: "/freebies/sign-up-freebies", label: "Sign-up bonuses", icon: <LuckyGoldCoinSvg size={14} /> },
];

export function Hero() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  function handleSearchSubmit() {
    if (query.trim().length < 2) return;
    navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  }

  return (
    <section className="relative overflow-hidden border-b border-[#ec48992e] bg-gradient-to-b from-[#fff0f8] via-[#fdf4ff] to-[#f0f4ff] px-4 pt-6 pb-12 sm:px-6 sm:pt-10 sm:pb-14 lg:px-8">
      <Particles />
      <m.div
        className="relative z-[1] mx-auto max-w-[1080px]"
        variants={staggerContainer(0.08)}
        initial="hidden"
        animate="show"
      >
        {/* Headline + search on the left, mascot stage on the right */}
        <m.div
          className="mb-6 rounded-3xl border border-[#ec489933] bg-white/85 p-6 shadow-lg shadow-[#e91e8c0a] backdrop-blur-md sm:p-8 md:p-10"
          variants={fadeUp}
        >
          <div className="grid grid-cols-1 items-center gap-6 md:grid-cols-12 md:gap-8">
            <div className="text-left md:col-span-8">
              <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border-[1.5px] border-[#e91e8c40] bg-[var(--pl)] px-3.5 py-1 text-[12.5px] font-extrabold text-[var(--pink)]">
                <SparkleStarSvg size={13} /> Melbourne's freebie hub
              </div>

              <h1 className="font-fraunces mb-3 text-3xl font-bold italic leading-[1.12] tracking-tight text-[var(--t1)] sm:text-4xl md:text-5xl">
                Irresistible deals, freebies and{" "}
                <span className="text-[var(--pink)]">mystery prizes</span>
              </h1>

              <form
                className="search"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSearchSubmit();
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
                <input
                  type="search"
                  placeholder="Search freebies, deals, events..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </form>

              <div className="mt-3 flex flex-wrap gap-2">
                {QUICK_PILLS.map((pill) => (
                  <Link
                    key={pill.to}
                    to={pill.to}
                    onClick={playTactileClick}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[#ec489926] bg-white/90 px-3 py-1.5 text-xs font-bold text-[var(--t2)] transition-colors hover:border-[#ec489966] hover:text-[var(--pink)]"
                  >
                    {pill.icon}
                    {pill.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Mascot stage — a shortcut into Rewards */}
            <div className="flex flex-col items-center justify-center md:col-span-4">
              <Link
                to="/rewards"
                onClick={playTactileClick}
                title="Tap Luckee to open your Rewards Hub"
                className="group relative flex w-full max-w-[260px] flex-col items-center justify-center rounded-3xl border border-[#ec489933] bg-gradient-to-b from-[#fff5fa] to-[#ffe4f2] p-6 shadow-sm transition-all hover:shadow-md"
              >
                <div className="my-2 transition-transform group-hover:scale-105">
                  <LuckeeMascot size="lg" pose="winking" speechBubble="Claim freebies!" interactive={false} />
                </div>

                <div className="mt-1 text-center">
                  <div className="font-fraunces flex items-center justify-center gap-1 text-base font-bold text-[var(--t1)]">
                    <span>Meet Luckee</span>
                    <SparkleStarSvg size={14} />
                  </div>
                  <p className="mt-0.5 text-[11px] font-semibold text-[var(--t2)]">
                    Spin daily, earn points &amp; redeem free prizes
                  </p>
                </div>
              </Link>
            </div>
          </div>
        </m.div>

        {/* Four quick-action cards */}
        <m.div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4" variants={fadeUp}>
          {QUICK_CARDS.map((card) => (
            <Link
              key={card.to}
              to={card.to}
              onClick={playTactileClick}
              className="group flex flex-col justify-between rounded-2xl border border-[#ec489926] bg-white/90 p-3.5 text-left shadow-xs transition-all hover:border-[#ec489966] hover:bg-white hover:shadow-md sm:p-4"
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#ec489922] bg-[#fff0f8] transition-transform group-hover:scale-110">
                  {card.icon}
                </span>
                <span className="rounded-full border border-[#ec489922] bg-[var(--pl)] px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-[var(--pink)]">
                  {card.badge}
                </span>
              </div>
              <div>
                <div className="text-xs font-bold text-[var(--t1)] transition-colors group-hover:text-[var(--pink)] sm:text-sm">
                  {card.title}
                </div>
                <div className="mt-0.5 truncate text-[11px] text-[var(--t2)]">{card.desc}</div>
              </div>
            </Link>
          ))}
        </m.div>
      </m.div>
    </section>
  );
}
