import { useState, useRef } from "react";
import { useFetcher, useRevalidator } from "react-router";
import { prefersReducedMotion } from "~/lib/reducedMotion";
import { playChime } from "~/lib/sound";
import { PULL_COST, PRIZES, type PrizeType } from "~/lib/gachapon";

type PullResult = { ok: boolean; prize?: PrizeType; pointsWon?: number | null; balance?: number; error?: string };

const CAPSULE_COLORS = ["#e91e8c", "#7c3aed", "#0d9488", "#f97316", "#fbbf24", "#3b82f6"];

function resultMessage(prize: PrizeType, pointsWon: number | null | undefined): string {
  switch (prize) {
    case "points":        return `You won ${pointsWon} points!`;
    case "double_points": return "Double points for the next 24 hours!";
    case "bonus_ticket":  return "A free pull — go again on the house!";
    case "better_luck":   return "Better luck next time!";
    case "food":          return "Free food capsule — collect 5 to redeem!";
    case "drink":         return "Free drink capsule — collect 5 to redeem!";
    case "grand":         return "GRAND PRIZE! Head to the collection to redeem.";
  }
}

export function GachaponMachine({ balance, freePulls }: { balance: number; freePulls: number }) {
  const fetcher = useFetcher<PullResult>();
  const revalidator = useRevalidator();
  const [phase, setPhase] = useState<"idle" | "cranking" | "result">("idle");
  const [result, setResult] = useState<{ prize: PrizeType; pointsWon: number | null } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const busyRef = useRef(false);

  const canPull = freePulls > 0 || balance >= PULL_COST;
  const needed = PULL_COST - balance;

  const handlePull = () => {
    if (busyRef.current || !canPull) return;
    busyRef.current = true;
    setError(null);
    setResult(null);
    setPhase("cranking");

    const reduced = prefersReducedMotion();
    const submit = async () => {
      const res = await fetch("/api/gachapon", { method: "POST" });
      const data = await res.json() as PullResult;
      if (!data.ok || !data.prize) {
        setError(data.error ?? "Something went wrong. Please try again.");
        setPhase("idle");
        busyRef.current = false;
        return;
      }
      const finish = () => {
        setResult({ prize: data.prize!, pointsWon: data.pointsWon ?? null });
        setPhase("result");
        playChime();
        revalidator.revalidate();
        busyRef.current = false;
      };
      if (reduced) finish();
      else setTimeout(finish, 1600); // let the crank animation play
    };
    submit();
  };

  const reset = () => {
    setResult(null);
    setPhase("idle");
    setError(null);
  };

  const showConfetti = phase === "result" && result != null &&
    (result.prize === "grand" || (result.prize === "points" && (result.pointsWon ?? 0) >= 150));

  return (
    <div className="gacha">
      {showConfetti && (
        <div className="confetti-wrap" aria-hidden="true">
          {Array.from({ length: 30 }, (_, i) => (
            <div
              key={i}
              className="confetti-piece"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 0.5}s`,
                background: CAPSULE_COLORS[i % CAPSULE_COLORS.length],
                width: 6 + Math.random() * 8,
                height: 6 + Math.random() * 8,
              }}
            />
          ))}
        </div>
      )}

      <div className={`gacha-machine${phase === "cranking" ? " cranking" : ""}`}>
        <div className="gacha-dome">
          <div className="gacha-capsules">
            {CAPSULE_COLORS.map((c, i) => (
              <span key={i} className="gacha-cap" style={{ background: c }} />
            ))}
          </div>
        </div>
        <div className="gacha-body">
          <div className="gacha-knob" />
          <div className="gacha-slot">
            {phase === "result" && result && (
              <div className="gacha-capsule-out" style={{ background: PRIZES[result.prize].color }} />
            )}
          </div>
        </div>
      </div>

      {phase === "result" && result ? (
        <div className="gacha-result">
          <span className="gacha-result-icon">{PRIZES[result.prize].icon}</span>
          <p className="gacha-result-label">{PRIZES[result.prize].label}</p>
          <p className="gacha-result-msg">{resultMessage(result.prize, result.pointsWon)}</p>
          <button className="btn-pink gacha-again" onClick={reset}>
            {canPull ? "Play again" : "Done"}
          </button>
        </div>
      ) : (
        <div className="gacha-controls">
          {error && <p className="gacha-error">{error}</p>}
          <button
            className={`btn-pink gacha-grab${phase === "cranking" ? " cranking" : ""}`}
            onClick={handlePull}
            disabled={phase === "cranking" || !canPull}
          >
            {phase === "cranking"
              ? "Cranking…"
              : freePulls > 0
                ? `Free pull! (${freePulls} left)`
                : `Grab a capsule · −${PULL_COST} pts`}
          </button>
          {!canPull && (
            <p className="gacha-hint">You need {needed} more points for a pull.</p>
          )}
          {freePulls === 0 && canPull && (
            <p className="gacha-hint">Balance: {balance} pts · {Math.floor(balance / PULL_COST)} pull{Math.floor(balance / PULL_COST) === 1 ? "" : "s"} available</p>
          )}
        </div>
      )}
    </div>
  );
}
