import type { Deal } from "~/data/types";
import { useAuth } from "~/hooks/useAuth";
import { trackDealClick } from "~/lib/dealClick";

export function DealTile({ deal: d }: { deal: Deal }) {
  const { user } = useAuth();

  function handleClick() {
    trackDealClick(d.n, { awardPoints: Boolean(user) });
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
