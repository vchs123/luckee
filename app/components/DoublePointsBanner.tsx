import { useState, useEffect } from "react";
import { useAuth } from "~/hooks/useAuth";

function format(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

/**
 * App-wide announcement banner shown while a user's double-points booster is
 * active, with a live countdown until it deactivates.
 */
export function DoublePointsBanner() {
  const { profile } = useAuth();
  const until = profile?.doublePointsUntil ?? null;
  const [now, setNow] = useState(() => Date.now());

  const untilMs = until ? new Date(until).getTime() : 0;
  const active = untilMs > now;

  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [active]);

  if (!active) return null;

  return (
    <div className="dp-banner" role="status">
      <span className="dp-banner-icon">⚡</span>
      <span className="dp-banner-text">
        <strong>Double points active!</strong> Everything you earn counts twice.
      </span>
      <span className="dp-banner-timer">{format(untilMs - now)} left</span>
    </div>
  );
}
