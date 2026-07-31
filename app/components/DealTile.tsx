import type { Deal } from "~/data/types";
import { useAuth } from "~/hooks/useAuth";

export function DealTile({ deal: d }: { deal: Deal }) {
  const { user } = useAuth();

  function handleClick() {
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", "referral_click", { deal_name: d.n });
    }
    fetch("/api/track-click", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deal_name: d.n }),
    }).catch(() => {});
    if (user) {
      fetch("/api/award-points", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "deal_click", description: `Clicked ${d.n} deal` }),
      }).catch(() => {});
    }
  }

  return (
    <div className={`dl-tile ${d.cls}`}>
      <div className="dl-tile-em">{d.e}</div>
      <div>
        <p className="dl-tile-name">{d.n}</p>
        <p className="dl-tile-sub">{d.sub}</p>
      </div>
      <div className="dl-tile-bonus">{d.reward}</div>
      <a
        href={d.link}
        target="_blank"
        rel="noopener noreferrer"
        className="dl-tile-cta"
        onClick={handleClick}
      >
        {d.cta.endsWith("→") ? <>{d.cta.slice(0, -1)}<span className="arrow">→</span></> : d.cta}
      </a>
    </div>
  );
}
