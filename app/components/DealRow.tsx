import type { Deal } from "~/data/types";
import { BLOSSOM_TIERS } from "~/data/deals";
import { useAuth } from "~/hooks/useAuth";

export function DealRow({ deal: d }: { deal: Deal }) {
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
    <div className={`dl-row ${d.cls}`}>
      <div className="dl-row-left">
        <div className="dl-row-em">{d.e}</div>
        <p className="dl-row-name">{d.n}</p>
        <p className="dl-row-sub">{d.sub}</p>
      </div>

      <div className="dl-row-right">
        <div className="dl-row-rw">
          <p className="dc-rl">{d.rl}</p>
          {d.cls === "bls" ? (
            <div className="bls-tiers" style={{ marginTop: 6 }}>
              {BLOSSOM_TIERS.map(tier => (
                <div key={tier.name} className="bls-tier">
                  <span className="bls-tier-name">{tier.name}</span>
                  <span className="bls-tier-rate">{tier.rate}</span>
                  <span className="bls-tier-note">{tier.from} · {tier.access}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="dc-rv">{d.reward}</p>
          )}
        </div>

        <p className="dc-desc">{d.desc}</p>

        {d.cls === "bls" && (
          <p className="bls-disclaimer">Target returns are not guaranteed. Not a bank. Read the PDS before investing.</p>
        )}

        {d.code && (
          <div className="dc-code">
            <span className="dc-cl">Referral code</span>
            <span className="dc-cv">{d.code}</span>
          </div>
        )}

        <div className="dc-tags">
          {d.tags.map(tag => (
            <span key={tag} className={`dc-tag`}>{tag}</span>
          ))}
        </div>

        <a
          href={d.link}
          target="_blank"
          rel="noopener noreferrer"
          className="dc-cta"
          onClick={handleClick}
        >
          {d.cta.endsWith("→") ? <>{d.cta.slice(0, -1)}<span className="arrow">→</span></> : d.cta}
        </a>
      </div>
    </div>
  );
}
