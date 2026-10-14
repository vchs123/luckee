import { useEffect, useRef, useState } from "react";
import { useFetcher, useRevalidator } from "react-router";
import { Disc3 } from "lucide-react";
import { playChime } from "~/lib/sound";
import { Confetti } from "~/components/rewards/Confetti";
import { EarnCard, btnPrimary } from "~/components/rewards/EarnCard";

// Cohesive modern palette — a pink→purple→blue→teal gradient with a warm jackpot accent.
// The server (/api/spin) picks the segment; this only draws it.
const SEGMENTS = [
  { pts: 10,  pct: 12.5, color: "#f472b6" },
  { pts: 15,  pct: 12.5, color: "#e879f9" },
  { pts: 20,  pct: 12.5, color: "#c084fc" },
  { pts: 25,  pct: 12.5, color: "#a78bfa" },
  { pts: 50,  pct: 12.5, color: "#818cf8" },
  { pts: 100, pct: 12.5, color: "#60a5fa" },
  { pts: 200, pct: 12.5, color: "#2dd4bf" },
  { pts: 500, pct: 12.5, color: "#fbbf24" },
];

// Cumulative degrees for each segment boundary
const segDegrees = SEGMENTS.reduce<number[]>((acc, s, i) => {
  acc.push((acc[i - 1] ?? 0) + (s.pct / 100) * 360);
  return acc;
}, []);

function segMid(i: number) {
  const start = i === 0 ? 0 : segDegrees[i - 1];
  const end = segDegrees[i];
  return (start + end) / 2;
}

function conicGradient() {
  let css = "conic-gradient(";
  SEGMENTS.forEach((s, i) => {
    const start = i === 0 ? 0 : segDegrees[i - 1];
    const end = segDegrees[i];
    css += `${s.color} ${start}deg ${end}deg${i < SEGMENTS.length - 1 ? ", " : ""}`;
  });
  return css + ")";
}

export function SpinCard({ hasSpunToday, initialPtsWon }: { hasSpunToday: boolean; initialPtsWon: number | null }) {
  const fetcher = useFetcher<{ pts: number; segIndex: number }>();
  const revalidator = useRevalidator();
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [resultPts, setResultPts] = useState<number | null>(initialPtsWon);
  const [showResult, setShowResult] = useState(hasSpunToday && initialPtsWon !== null);
  const wheelRef = useRef<HTMLDivElement>(null);
  const spun = hasSpunToday || showResult;

  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data?.pts !== undefined && spinning) {
      const { pts, segIndex } = fetcher.data;
      const mid = segMid(segIndex);
      // Spin so that `mid` degree lands at the top (pointer at 0°)
      const finalAngle = rotation + 5 * 360 + (360 - mid);
      if (wheelRef.current) {
        wheelRef.current.style.transition = "transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)";
        wheelRef.current.style.transform = `rotate(${finalAngle}deg)`;
      }
      setTimeout(() => {
        setResultPts(pts);
        setShowResult(true);
        setSpinning(false);
        setRotation(finalAngle % 360);
        playChime();
        revalidator.revalidate();
      }, 4200);
    }
  }, [fetcher.state, fetcher.data, spinning, rotation, revalidator]);

  const handleSpin = () => {
    if (spinning || spun) return;
    setSpinning(true);
    if (wheelRef.current) {
      wheelRef.current.style.transition = "none";
    }
    fetcher.submit({}, { method: "POST", action: "/api/spin" });
  };

  return (
    <EarnCard
      id="earn-spin"
      icon={<Disc3 className="h-5 w-5" />}
      title="Daily spin"
      badge="10–500 pts"
      sub="One free spin a day."
      done={spun && !spinning ? "Done today" : undefined}
    >
      <Confetti active={showResult && (resultPts ?? 0) >= 100} />
      <div className="spin-wrap">
        <div className={`spin-wheel-container${spun && !spinning ? " spun" : ""}`}>
          <div className="spin-pointer">▼</div>
          <div ref={wheelRef} className="spin-wheel" style={{ background: conicGradient() }}>
            {SEGMENTS.map((s, i) => {
              const mid = segMid(i);
              const rad = ((mid - 90) * Math.PI) / 180;
              // Position as a percentage of the wheel so labels scale with any wheel size.
              const rPct = 32.5; // 91px radius on a 280px wheel = 32.5% from centre
              const x = 50 + rPct * Math.cos(rad);
              const y = 50 + rPct * Math.sin(rad);
              return (
                <div
                  key={s.pts}
                  className="spin-label"
                  style={{ left: `${x}%`, top: `${y}%`, transform: `translate(-50%,-50%) rotate(${mid}deg)`, fontSize: 11 }}
                >
                  {s.pts}
                </div>
              );
            })}
          </div>
        </div>

        <div className="spin-info" aria-live="polite">
          {showResult ? (
            <div>
              <p className="text-5xl font-black leading-none tracking-tight text-[#e91e8c]">+{resultPts} pts</p>
              <p className="mt-2 text-sm font-black uppercase text-black">
                {(resultPts ?? 0) >= 100 ? "🎉 Lucky spin!" : "Added to your balance"}
              </p>
              <p className="mt-1 text-xs font-bold text-neutral-600">Come back tomorrow for another spin.</p>
            </div>
          ) : (
            <>
              <p className="mb-4 text-sm font-bold text-neutral-700">
                Every slice pays out, from 10 pts up to 500.
              </p>
              <button
                type="button"
                className={`${btnPrimary} px-6 py-3 text-sm`}
                onClick={handleSpin}
                disabled={spinning || spun || fetcher.state !== "idle"}
              >
                {spinning ? "Spinning…" : "Spin the wheel"}
              </button>
            </>
          )}
        </div>
      </div>
    </EarnCard>
  );
}
