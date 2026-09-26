import { Link } from "react-router";
import { m } from "framer-motion";
import { LuckeeMascot } from "~/components/LuckeeMascot";
import {
  GachaponCapsuleSvg,
  SparkleStarSvg,
  FourLeafCloverSvg,
  LuckyGoldCoinSvg,
} from "~/components/SvgIcons";
import { useAuth } from "~/hooks/useAuth";
import { fadeUp, inViewOnce } from "~/lib/motion";
import { playTactileClick } from "~/lib/sound";

/** Point values mirror the live rewards rules, not v2's placeholder tokens. */
const PILLARS = [
  {
    icon: <SparkleStarSvg size={22} />,
    title: "Daily spin",
    body: "One free spin every day · 10–500 pts",
    accent: false,
  },
  {
    icon: <FourLeafCloverSvg size={22} />,
    title: "Daily trivia",
    body: "Five quick questions, timed · up to 25 pts",
    accent: false,
  },
  {
    icon: <LuckyGoldCoinSvg size={22} />,
    title: "Upload receipts",
    body: "Snap a receipt · 5 pts each, +50 every 30",
    accent: false,
  },
  {
    icon: <GachaponCapsuleSvg size={22} />,
    title: "Gachapon",
    body: "Spend points on a capsule · 150 pts a pull",
    accent: true,
  },
];

export function RewardsBanner() {
  const { user, profile } = useAuth();

  return (
    <section
      id="rewards"
      className="relative overflow-hidden border-b border-[#ec489922] bg-gradient-to-b from-[#fff0f8] via-white to-[#fdf4ff] px-4 py-14 md:px-8 md:py-16"
    >
      <div className="mx-auto max-w-4xl">
        <m.div
          className="text-center"
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={inViewOnce}
        >
          <div className="mb-3 flex justify-center">
            <LuckeeMascot
              size="sm"
              pose="gachapon"
              speechBubble="Play daily & collect rewards in Melbourne!"
            />
          </div>

          <p className="eyebrow inline-flex items-center justify-center gap-1.5">
            <GachaponCapsuleSvg size={15} /> Rewards
          </p>
          <h2 className="sec-h mb-3 text-center">Sign up. Play daily. Win real prizes.</h2>
          <p className="sec-p mx-auto mb-8 max-w-2xl text-center">
            Create a free account and every login, spin, quiz and receipt earns points. Spend them on
            the gachapon machine for surprise food, drinks and prizes — collect a set and pick it up in
            Melbourne.
          </p>

          <div className="grid grid-cols-2 gap-3 text-left sm:grid-cols-4">
            {PILLARS.map((p) => (
              <Link
                key={p.title}
                to="/rewards"
                onClick={playTactileClick}
                className={`rounded-2xl border p-3.5 shadow-xs transition-all hover:border-[var(--pink)] hover:shadow-sm ${
                  p.accent ? "border-[#e91e8c44] bg-[#fff0f8]" : "border-[#ec489922] bg-white"
                }`}
              >
                <span className="mb-1.5 block">{p.icon}</span>
                <span
                  className={`block text-xs font-bold ${p.accent ? "text-[var(--pink)]" : "text-[var(--t1)]"}`}
                >
                  {p.title}
                </span>
                <span className="mt-0.5 block text-[11px] text-[var(--t2)]">{p.body}</span>
              </Link>
            ))}
          </div>

          <p className="sec-p mt-5 text-center">
            Plus a daily login streak, a trackable wishlist (Luckboard), and points for referring
            friends.
          </p>

          <div className="mt-4 flex flex-wrap justify-center gap-3">
            {user ? (
              <>
                <Link to="/rewards" onClick={playTactileClick} className="btn-pink">
                  {profile ? `Play now — ${profile.totalPoints} pts` : "Play now"}{" "}
                  <span className="arrow">→</span>
                </Link>
                <Link to="/profile" className="btn-ghost">
                  Your referral link →
                </Link>
              </>
            ) : (
              <>
                <Link to="/login" onClick={playTactileClick} className="btn-pink">
                  Sign up &amp; start earning <span className="arrow">→</span>
                </Link>
                <Link to="/rewards" className="btn-ghost">
                  How Rewards work →
                </Link>
              </>
            )}
          </div>
        </m.div>
      </div>
    </section>
  );
}
