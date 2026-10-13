import { useEffect, useRef, useState } from "react";
import { useRevalidator } from "react-router";
import { AnimatePresence, m } from "framer-motion";
import { Flame, HelpCircle, Sparkles, X } from "lucide-react";
import { CuteCapsule, type CuteCapsuleTheme } from "~/components/gachapon/CuteCapsule";
import { LuckeeMascotToken } from "~/components/LuckeeMascotToken";
import { PRIZES, PRIZE_WEIGHTS, PULL_COST, type PrizeType } from "~/lib/gachapon";
import { prefersReducedMotion } from "~/lib/reducedMotion";
import {
  playCapsuleDrop,
  playCoinSlotDrop,
  playCrankRatchet,
  playPrizePop3D,
  playTactileClick,
} from "~/lib/sound";

/*
 * v2's gachapon machine, on the real server.
 *
 * Every capsule comes from POST /api/gachapon, which charges, rolls and records
 * the pull in one locked database step. Nothing here decides a prize. "Pull ×N"
 * is N real pulls in a row, stopping at the first refusal (out of points, daily
 * limit), so it can never spend more than a single pull would allow.
 */

export interface RecentPull {
  prize_type: string;
  points_won: number | null;
  created_at: string;
}

interface Props {
  balance: number;
  freePulls: number;
  pullsToday: number;
  dailyLimit: number;
  recentPulls: RecentPull[];
  /** Switch the Rewards page to its Earn tab. */
  onEarn?: () => void;
}

type Outcome = { prize: PrizeType; pointsWon: number | null };
type Phase = "idle" | "inserting" | "cranking" | "dropped" | "revealing";

/** Each prize type gets its own capsule colour, so a reveal reads at a glance. */
const THEME: Record<PrizeType, CuteCapsuleTheme> = {
  food: "peach",
  drink: "mint",
  points: "lemon",
  double_points: "lavender",
  bonus_ticket: "strawberry",
  better_luck: "sky",
  grand: "rose",
};

const GRAND_ODDS = PRIZE_WEIGHTS.find((w) => w.type === "grand")?.weight ?? 0;

// The globe's resting capsules and their tumble paths while the crank turns.
const GLOBE: { theme: CuteCapsuleTheme; rotate: number; bob: number; x: number[]; y: number[]; r: number[] }[] = [
  { theme: "strawberry", rotate: -12, bob: 0.1, x: [0, 42, -38, 28, -18, 0], y: [0, -58, 20, -45, 12, 0], r: [0, 260, -180, 360, 45, 0] },
  { theme: "mint", rotate: 15, bob: 0.4, x: [0, -42, 32, -28, 16, 0], y: [0, -62, -18, 22, -30, 0], r: [0, -290, 150, -220, 60, 0] },
  { theme: "lemon", rotate: -8, bob: 0.8, x: [0, 28, -36, 42, -22, 0], y: [0, -46, 26, -56, 14, 0], r: [0, 330, -150, 270, -45, 0] },
  { theme: "lavender", rotate: 18, bob: 0.3, x: [0, -32, 42, -20, 26, 0], y: [0, 26, -56, 16, -42, 0], r: [0, -230, 210, -330, 30, 0] },
  { theme: "sky", rotate: -16, bob: 0.6, x: [0, 42, -26, 32, -36, 0], y: [0, -50, 14, -46, 22, 0], r: [0, 190, -260, 320, -50, 0] },
  { theme: "peach", rotate: 12, bob: 1.1, x: [0, -44, 24, -40, 15, 0], y: [0, 20, -60, 12, -46, 0], r: [0, -350, 90, -200, 40, 0] },
  { theme: "rose", rotate: -14, bob: 0.7, x: [0, 34, -30, 36, -26, 0], y: [0, -54, 24, -36, 10, 0], r: [0, 300, -330, 180, -80, 0] },
  { theme: "matcha", rotate: 16, bob: 1.3, x: [0, -26, 36, -42, 20, 0], y: [0, 36, -50, 14, -52, 0], r: [0, -200, 350, -120, 180, 0] },
];

/** What a prize means for the player. Thresholds come from PRIZES so this can't go stale. */
function describe(o: Outcome): string {
  switch (o.prize) {
    case "points":
      return `+${o.pointsWon ?? 0} points added to your balance.`;
    case "double_points":
      return "Double points on everything you earn for the next 24 hours.";
    case "bonus_ticket":
      return "Your next pull is on the house.";
    case "better_luck":
      return "No prize this time. Better luck next pull!";
    case "food":
    case "drink":
      return `Added to your collection. Collect ${PRIZES[o.prize].threshold} to redeem one.`;
    case "grand":
      return "The grand prize! Arrange your pickup from your collection.";
  }
}

function title(o: Outcome): string {
  return o.prize === "points" ? `${o.pointsWon ?? 0} bonus points` : PRIZES[o.prize].label;
}

function ago(iso: string): string {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function GachaponMachine({ balance, freePulls, pullsToday, dailyLimit, recentPulls, onEarn }: Props) {
  const revalidator = useRevalidator();
  const [mode, setMode] = useState<"interactive" | "auto">("interactive");
  const [count, setCount] = useState(1);
  const [phase, setPhase] = useState<Phase>("idle");
  const [crankAngle, setCrankAngle] = useState(0);
  const [outcomes, setOutcomes] = useState<Outcome[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const doneRef = useRef<HTMLButtonElement>(null);

  // Free pulls are spent first, then 150 points each — capped by today's limit.
  const leftToday = Math.max(0, dailyLimit - pullsToday);
  const affordable = freePulls + Math.floor(balance / PULL_COST);
  const available = Math.min(affordable, leftToday);
  const effectiveCount = Math.max(1, Math.min(count, available || 1));
  const busy = phase !== "idle";

  // Escape closes the reveal; focus lands on its button so keyboard users can.
  useEffect(() => {
    if (phase !== "revealing") return;
    doneRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPhase("idle");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase]);

  async function pull(n: number) {
    if (busy) return;
    if (available <= 0) {
      playTactileClick();
      setError(
        leftToday <= 0
          ? `You've used all ${dailyLimit} pulls for today. Come back tomorrow!`
          : `You need ${PULL_COST - balance} more points for a pull.`,
      );
      return;
    }
    const reduced = prefersReducedMotion();
    const target = Math.max(1, Math.min(n, available));
    setError(null);
    setOutcomes([]);

    setPhase("inserting");
    playCoinSlotDrop();
    if (!reduced) await wait(320);

    setPhase("cranking");
    setCrankAngle((a) => a + 720 * (target > 1 ? 2 : 1));
    playCrankRatchet();
    if (!reduced) {
      setTimeout(playCrankRatchet, 200);
      setTimeout(playCrankRatchet, 450);
    }

    const started = Date.now();
    const won: Outcome[] = [];
    let stoppedBecause: string | null = null;
    for (let i = 0; i < target; i++) {
      try {
        const res = await fetch("/api/gachapon", { method: "POST" });
        const data = (await res.json()) as { ok: boolean; prize?: PrizeType; pointsWon?: number | null; error?: string };
        if (!data.ok || !data.prize) {
          stoppedBecause = data.error ?? "The machine jammed. Please try again.";
          break;
        }
        won.push({ prize: data.prize, pointsWon: data.pointsWon ?? null });
      } catch {
        stoppedBecause = "Couldn't reach the machine. Check your connection and try again.";
        break;
      }
    }
    // Let the globe finish its tumble even when the server is quick.
    if (!reduced) await wait(Math.max(0, 900 - (Date.now() - started)));

    if (won.length) {
      setOutcomes(won);
      setPhase("dropped");
      playCapsuleDrop();
    } else {
      setPhase("idle");
    }
    if (stoppedBecause) {
      setError(won.length ? `Pulled ${won.length} of ${target}, then stopped: ${stoppedBecause}` : stoppedBecause);
    }
    // Balance, collection and recent pulls all changed on the server.
    revalidator.revalidate();
  }

  async function open() {
    if (phase !== "dropped") return;
    setPhase("revealing");
    playPrizePop3D();
    if (prefersReducedMotion()) return;
    try {
      // Loaded on demand: browser-only, and only needed once a capsule opens.
      const confetti = (await import("canvas-confetti")).default;
      const opts = { disableForReducedMotion: true, colors: ["#ff5733", "#fbbf24", "#38bdf8", "#ec4899", "#10b981"] };
      confetti({ ...opts, particleCount: outcomes.length > 1 ? 120 : 80, spread: 70, origin: { y: 0.6 } });
      setTimeout(() => {
        confetti({ ...opts, particleCount: 50, angle: 60, spread: 55, origin: { x: 0 } });
        confetti({ ...opts, particleCount: 50, angle: 120, spread: 55, origin: { x: 1 } });
      }, 250);
    } catch {
      /* confetti is decoration */
    }
  }

  const hasCapsules = phase === "dropped" && outcomes.length > 0;

  return (
    <div className="relative overflow-hidden px-1 py-4">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
          {/* Left: the player's real balance */}
          <div className="space-y-5 lg:col-span-3">
            <div className="relative border-4 border-black bg-[#ffcf00] p-5 shadow-hard-md">
              <div className="absolute -left-2 -top-3.5 rotate-[-2deg] border border-black bg-black px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white">
                Your pulls
              </div>
              <div className="mb-4 mt-1 flex items-center gap-3.5">
                <div className="flex h-13 w-13 shrink-0 items-center justify-center border-2 border-black bg-white shadow-hard-sm">
                  <LuckeeMascotToken size={44} animateShimmer interactive={false} showGlow />
                </div>
                <div>
                  <div className="text-3xl font-black leading-none tracking-tight text-black">{available}</div>
                  <div className="text-[10px] font-black uppercase text-neutral-800">available now</div>
                </div>
              </div>
              <dl className="space-y-1 text-[11px] font-bold text-black">
                <div className="flex justify-between"><dt>Points</dt><dd className="font-black">{balance}</dd></div>
                <div className="flex justify-between"><dt>Free pulls</dt><dd className="font-black">{freePulls}</dd></div>
                <div className="flex justify-between"><dt>Left today</dt><dd className="font-black">{leftToday} of {dailyLimit}</dd></div>
                <div className="flex justify-between"><dt>Cost</dt><dd className="font-black">{PULL_COST} pts a pull</dd></div>
              </dl>
              {available <= 0 && leftToday > 0 && onEarn && (
                <button
                  type="button"
                  onClick={() => {
                    playTactileClick();
                    onEarn();
                  }}
                  className="mt-4 flex w-full cursor-pointer items-center justify-center gap-2 border-2 border-black bg-black px-3 py-2.5 text-xs font-black uppercase tracking-widest text-white shadow-hard-sm hover:bg-red-600"
                >
                  Earn more points
                </button>
              )}
            </div>
          </div>

          {/* Centre: the machine */}
          <div className="relative flex flex-col items-center lg:col-span-6">
            <div className="pointer-events-none absolute -right-1 top-4 z-30 hidden rotate-12 border-2 border-black bg-white p-1.5 shadow-hard-sm sm:block">
              <div className="text-[8px] font-black uppercase tracking-widest text-neutral-500">Grand prize</div>
              <div className="text-sm font-black text-red-600">{GRAND_ODDS}% a pull</div>
            </div>

            <div className="relative flex w-[205px] flex-col items-center sm:w-[225px]">
              {/* Token tube — interactive mode only */}
              {mode === "interactive" && (
                <div className="absolute -left-7 top-10 z-[25] flex select-none flex-col items-center sm:-left-9 sm:top-12">
                  <div className="h-2 w-8 border-2 border-black bg-neutral-800" />
                  <div className="-mt-0.5 h-2.5 w-6 rounded-t-md border-2 border-black bg-gradient-to-b from-neutral-200 to-neutral-500" />
                  <div className="relative flex h-28 w-5 flex-col items-center justify-end overflow-hidden border-2 border-y-0 border-black bg-gradient-to-r from-white/85 via-sky-100/30 to-white/60 p-0.5 sm:h-32 sm:w-6">
                    {available > 0 ? (
                      <div className="flex w-full flex-col-reverse items-center pb-0.5">
                        {Array.from({ length: Math.min(available - 1, 9) }).map((_, i) => (
                          <div key={i} className="flex w-full justify-center" style={{ marginBottom: i === 0 ? 0 : -2 }}>
                            <div className="h-1.5 w-4 rounded-full border border-black bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-600" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="rotate-90 whitespace-nowrap text-[7px] font-black uppercase tracking-widest text-neutral-400">Empty</span>
                    )}
                  </div>
                  <div className="h-3 w-7 rounded-b-md border-2 border-black bg-gradient-to-b from-neutral-300 to-neutral-700" />
                  {available > 0 && (
                    <m.button
                      type="button"
                      drag
                      dragSnapToOrigin
                      dragElastic={0.2}
                      whileDrag={{ scale: 1.28, zIndex: 70 }}
                      onDragStart={() => setDragging(true)}
                      onDragEnd={(_e, info) => {
                        setDragging(false);
                        if (info.offset.x > 25) pull(1);
                      }}
                      onClick={() => pull(1)}
                      disabled={busy}
                      aria-label={`Insert a token and pull (${PULL_COST} points or a free pull)`}
                      title="Drag to the slot, or tap"
                      className="-mt-1 cursor-grab touch-none active:cursor-grabbing disabled:cursor-not-allowed"
                    >
                      <LuckeeMascotToken size={17} animateShimmer showGlow interactive={false} />
                    </m.button>
                  )}
                  <span className="mt-1 border border-black bg-black px-1 py-0.5 text-[6px] font-black uppercase text-[#ffcf00]">Tokens</span>
                </div>
              )}

              {/* Dome */}
              <div className="relative z-20 flex h-6 w-28 items-center justify-center rounded-t-full border-[3px] border-b-0 border-black bg-red-600 sm:w-32">
                <div className="h-1.5 w-8 border border-black bg-yellow-300" />
              </div>

              {/* Globe */}
              <div className="relative z-10 flex h-[162px] w-[185px] items-end justify-center overflow-hidden rounded-b-xl rounded-t-full border-[3px] border-black bg-gradient-to-b from-white/95 via-sky-50/40 to-white/80 p-1.5 shadow-[inset_0_6px_16px_rgba(255,255,255,0.8),inset_0_-8px_12px_rgba(0,0,0,0.1),4px_4px_0px_#000] sm:w-[205px]">
                <div className="pointer-events-none absolute left-4 top-2 z-20 h-16 w-3.5 -rotate-12 rounded-full bg-gradient-to-b from-white/90 to-transparent" />
                <div className="relative z-10 flex w-full max-w-[172px] flex-wrap items-end justify-center -space-x-1.5 -space-y-2 px-0.5 pb-1.5">
                  {GLOBE.map((c, i) => (
                    <m.div
                      key={c.theme}
                      animate={
                        phase === "cranking"
                          ? { x: c.x, y: c.y, rotate: c.r, scale: [1, 1.25, 0.82, 1.2, 0.9, 1] }
                          : { x: 0, y: [0, -3, 0], rotate: [c.rotate, c.rotate + (i % 2 === 0 ? 3.5 : -3.5), c.rotate], scale: 1 }
                      }
                      transition={
                        phase === "cranking"
                          ? { duration: 0.88, ease: "easeInOut", repeat: Infinity }
                          : { duration: 2.2 + c.bob * 0.4, repeat: Infinity, ease: "easeInOut" }
                      }
                      className="-m-0.5 flex items-center justify-center"
                      aria-hidden
                    >
                      <CuteCapsule theme={c.theme} size={30} showGlow={false} />
                    </m.div>
                  ))}
                </div>
              </div>

              {/* Base */}
              <div className="relative z-20 -mt-1.5 flex w-[195px] flex-col items-center rounded-b-2xl border-[3px] border-t-0 border-black bg-[#ffcf00] p-3 pt-2.5 shadow-[inset_0_2px_0_rgba(255,255,255,0.4),5px_5px_0_#000] sm:w-[215px]">
                <div className="mb-2 flex items-center gap-1 rounded-xs border-2 border-black bg-black p-0.5 shadow-[1.5px_1.5px_0_#fff]" role="group" aria-label="Mode">
                  {(["interactive", "auto"] as const).map((m2) => (
                    <button
                      key={m2}
                      type="button"
                      onClick={() => {
                        playTactileClick();
                        setMode(m2);
                      }}
                      aria-pressed={mode === m2}
                      className={`cursor-pointer rounded-xs px-2.5 py-0.5 text-[8.5px] font-black uppercase tracking-wider ${
                        mode === m2 ? "bg-[#ffcf00] text-black" : "text-neutral-400 hover:text-white"
                      }`}
                    >
                      {m2 === "interactive" ? "Interactive" : "Auto mode"}
                    </button>
                  ))}
                </div>

                <div className="mb-2.5 flex w-full items-center justify-center gap-2.5 px-0.5">
                  {/* Coin slot */}
                  <button
                    type="button"
                    onClick={() => pull(1)}
                    disabled={busy}
                    aria-label="Insert a token and pull"
                    className={`relative flex h-15 select-none flex-col items-center justify-between rounded-md border-2 bg-gradient-to-b from-neutral-800 to-neutral-950 px-1.5 py-1 shadow-[inset_0_1.5px_3px_rgba(255,255,255,0.2),1.5px_1.5px_0_#000] transition-all active:scale-95 disabled:cursor-not-allowed ${
                      dragging ? "scale-105 border-[#ffcf00] ring-2 ring-[#ffcf00]" : "border-black"
                    }`}
                  >
                    <span className={`whitespace-pre text-center font-mono-code text-[6px] font-black uppercase leading-[1.1] ${dragging ? "text-[#ffcf00]" : "text-amber-400"}`}>
                      {dragging ? "DROP\nHERE" : "INSERT\nTOKEN"}
                    </span>
                    <span className="relative flex h-6 w-6 items-center justify-center">
                      <span className="h-5 w-1 rounded-xs border border-neutral-700 bg-black" />
                      <AnimatePresence>
                        {phase === "inserting" && (
                          <m.span
                            initial={{ y: -8, scale: 0.9, opacity: 1 }}
                            animate={{ y: 6, scale: 0.35, opacity: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3, ease: "easeIn" }}
                            className="absolute"
                          >
                            <LuckeeMascotToken size={18} interactive={false} />
                          </m.span>
                        )}
                      </AnimatePresence>
                    </span>
                    <span className="flex items-center gap-0.5">
                      <span className={`h-1 w-1 rounded-full ${available > 0 ? "bg-emerald-400" : "bg-red-500"}`} />
                      <span className="text-[6px] font-black uppercase text-neutral-400">{available > 0 ? "Ready" : "Empty"}</span>
                    </span>
                  </button>

                  {/* Crank */}
                  <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-black bg-gradient-to-b from-neutral-100 to-neutral-300 shadow-[inset_0_1.5px_3px_#fff,inset_0_-1.5px_3px_rgba(0,0,0,0.3),2px_2px_0_#000]">
                    <m.button
                      type="button"
                      animate={{ rotate: crankAngle }}
                      transition={{ duration: 0.85, ease: [0.34, 1.56, 0.64, 1] }}
                      onClick={() => pull(mode === "auto" ? effectiveCount : 1)}
                      disabled={busy}
                      aria-label={mode === "auto" ? `Turn the crank for ${effectiveCount} pulls` : "Turn the crank"}
                      className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border-2 border-black bg-gradient-to-b from-red-500 to-red-700 shadow-[inset_0_1.5px_2px_rgba(255,255,255,0.6),inset_0_-1.5px_3px_rgba(0,0,0,0.5),1.5px_1.5px_0_#000] active:scale-95 disabled:cursor-not-allowed"
                    >
                      <span className="h-2.5 w-7 rounded-xs border border-black bg-gradient-to-b from-white to-neutral-200" />
                    </m.button>
                  </div>
                </div>

                {/* Chute */}
                <div className="relative flex h-16 w-32 items-center justify-center overflow-hidden rounded-lg border-2 border-black bg-neutral-950 p-1.5 shadow-[inset_0_4px_8px_rgba(0,0,0,0.95)]">
                  <AnimatePresence>
                    {hasCapsules && (
                      <m.button
                        type="button"
                        initial={{ y: -35, opacity: 0, scale: 0.4 }}
                        animate={{ y: 0, opacity: 1, scale: 1, rotate: [0, -12, 12, 0] }}
                        exit={{ scale: 0, opacity: 0 }}
                        onClick={open}
                        aria-label={outcomes.length > 1 ? `Open ${outcomes.length} capsules` : "Open your capsule"}
                        className="flex cursor-pointer flex-col items-center"
                      >
                        {outcomes.length > 1 ? (
                          <span className="mb-0.5 flex items-center -space-x-3">
                            {outcomes.slice(0, 3).map((o, i) => (
                              <CuteCapsule key={i} theme={THEME[o.prize]} size={i === 1 ? 28 : 26} animateBounce showGlow />
                            ))}
                          </span>
                        ) : (
                          <CuteCapsule theme={THEME[outcomes[0].prize]} size={34} animateBounce showGlow />
                        )}
                        <span className="mt-0.5 flex items-center gap-1 text-[8px] font-black uppercase tracking-wider text-[#ffcf00]">
                          <Sparkles className="h-2 w-2" />
                          {outcomes.length > 1 ? `Open (${outcomes.length}×)!` : "Tap to open!"}
                        </span>
                      </m.button>
                    )}
                  </AnimatePresence>
                  {(phase === "cranking" || phase === "inserting") && (
                    <span className="flex items-center gap-1 text-[10px] font-black uppercase text-[#ffcf00]" role="status">
                      <Sparkles className="h-2.5 w-2.5" /> Dispensing…
                    </span>
                  )}
                </div>

                {mode === "interactive" ? (
                  <p className="mt-2 text-center text-[7.5px] font-black uppercase tracking-tight text-neutral-800">
                    Drag a token to the slot or turn the crank
                  </p>
                ) : (
                  <div className="mt-2 flex w-full flex-col items-center space-y-1.5">
                    <div className="flex w-full items-center justify-between rounded-xs border-2 border-black bg-black p-1 text-white">
                      <span className="ml-1 text-[8px] font-black uppercase text-yellow-300">Pull:</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setCount((c) => Math.max(1, c - 1))}
                          disabled={effectiveCount <= 1 || busy}
                          aria-label="One fewer"
                          className="flex h-4.5 w-4.5 cursor-pointer items-center justify-center border border-neutral-600 bg-neutral-800 text-xs font-black disabled:opacity-30"
                        >
                          −
                        </button>
                        <span className="min-w-6 px-1.5 text-center font-mono-code text-xs font-black text-[#ffcf00]" aria-live="polite">
                          {effectiveCount}×
                        </span>
                        <button
                          type="button"
                          onClick={() => setCount((c) => Math.min(Math.max(1, available), c + 1))}
                          disabled={effectiveCount >= Math.max(1, available) || busy}
                          aria-label="One more"
                          className="flex h-4.5 w-4.5 cursor-pointer items-center justify-center border border-neutral-600 bg-neutral-800 text-xs font-black disabled:opacity-30"
                        >
                          +
                        </button>
                        <button
                          type="button"
                          onClick={() => setCount(Math.max(1, available))}
                          disabled={available <= 0 || busy}
                          className="ml-0.5 cursor-pointer border border-black bg-red-600 px-1.5 py-0.5 text-[7px] font-black uppercase text-white disabled:opacity-40"
                        >
                          Max
                        </button>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => pull(effectiveCount)}
                      disabled={busy || available <= 0}
                      className={`flex w-full items-center justify-center gap-1.5 border-2 border-black px-3 py-2.5 text-[10.5px] font-black uppercase tracking-wider ${
                        available > 0 && !busy ? "cursor-pointer bg-black text-white hover:bg-red-600" : "cursor-not-allowed bg-neutral-300 text-neutral-600"
                      }`}
                    >
                      <LuckeeMascotToken size={16} interactive={false} />
                      {busy && phase !== "dropped" ? `Dispensing ${effectiveCount}×…` : available > 0 ? `Insert & turn (${effectiveCount}×)` : "No pulls left"}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {error && (
              <p role="alert" className="mt-4 max-w-sm border-2 border-black bg-white px-3 py-2 text-center text-xs font-bold text-red-700 shadow-hard-sm">
                {error}
              </p>
            )}
          </div>

          {/* Right: the player's own recent pulls */}
          <div className="space-y-5 lg:col-span-3">
            <div className="border-4 border-black bg-white p-5 shadow-hard-md">
              <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-red-600">
                <Flame className="h-4 w-4" /> Your recent pulls
              </div>
              {recentPulls.length === 0 ? (
                <p className="text-xs font-bold text-neutral-600">Your pulls will show up here.</p>
              ) : (
                <ul className="space-y-2.5">
                  {recentPulls.map((p, i) => {
                    const prize = PRIZES[p.prize_type as PrizeType];
                    if (!prize) return null;
                    return (
                      <li key={`${p.created_at}-${i}`} className="border-2 border-black bg-[#fdfaf5] p-2.5 text-xs">
                        <div className="flex items-center justify-between font-black uppercase text-black">
                          <span className="flex items-center gap-2">
                            <CuteCapsule theme={THEME[p.prize_type as PrizeType]} size={18} showGlow={false} />
                            {p.prize_type === "points" ? `${p.points_won ?? 0} pts` : prize.label}
                          </span>
                          <span className="text-[10px] font-bold text-neutral-500">{ago(p.created_at)}</span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
            <div className="border-4 border-black bg-[#fffdf0] p-5 shadow-hard-md">
              <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-wider text-black">
                <HelpCircle className="h-4 w-4" /> How it works
              </div>
              <ul className="space-y-1 text-[11px] font-bold leading-relaxed text-neutral-700">
                <li>{PULL_COST} points or a free pull per capsule, up to {dailyLimit} a day.</li>
                <li>Collect {PRIZES.food.threshold} food or {PRIZES.drink.threshold} drink capsules to redeem one.</li>
                <li>A grand prize is redeemable straight away.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Reveal */}
      <AnimatePresence>
        {phase === "revealing" && outcomes.length > 0 && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-4" role="dialog" aria-modal="true" aria-label="Your prizes">
            <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setPhase("idle")} className="absolute inset-0" />
            <m.div
              initial={{ scale: 0.2, y: 80, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.3, opacity: 0, transition: { duration: 0.25 } }}
              transition={{ type: "spring", damping: 20, stiffness: 160 }}
              className="relative z-10 my-auto flex max-h-[90vh] w-full max-w-[400px] flex-col overflow-hidden border-4 border-black bg-white p-4 shadow-hard-lg"
            >
              <div className="mb-3 flex items-center justify-between border-b-2 border-black pb-2">
                <span className="flex items-center gap-1 border-2 border-black bg-red-600 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-white">
                  <Sparkles className="h-3 w-3" />
                  {outcomes.length > 1 ? `${outcomes.length}× pull` : "Capsule open"}
                </span>
                <button
                  type="button"
                  onClick={() => setPhase("idle")}
                  aria-label="Close"
                  className="flex h-6 w-6 cursor-pointer items-center justify-center border-2 border-black bg-black text-white hover:bg-red-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>

              <ul className="space-y-2.5 overflow-y-auto">
                {outcomes.map((o, i) => (
                  <li key={i} className="flex items-center gap-3 border-2 border-black p-2.5" style={{ background: `${PRIZES[o.prize].color}14` }}>
                    <CuteCapsule theme={THEME[o.prize]} size={outcomes.length > 1 ? 30 : 42} isCracked showGlow />
                    <div className="min-w-0">
                      <p className="text-sm font-black uppercase leading-tight text-black sm:text-base">
                        <span aria-hidden>{PRIZES[o.prize].icon}</span> {title(o)}
                      </p>
                      <p className="mt-0.5 text-[11px] font-bold text-neutral-600">{describe(o)}</p>
                    </div>
                  </li>
                ))}
              </ul>

              <button
                ref={doneRef}
                type="button"
                onClick={() => setPhase("idle")}
                className="mt-3 cursor-pointer border-2 border-black bg-black px-4 py-2 text-[11px] font-black uppercase tracking-widest text-white hover:bg-red-600"
              >
                Done
              </button>
            </m.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
