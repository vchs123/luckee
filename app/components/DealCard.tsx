import type { Deal } from "~/data/types";
import { BLOSSOM_TIERS } from "~/data/deals";
import { useAuth } from "~/hooks/useAuth";

export function DealCard({ deal: d }: { deal: Deal }) {
  const { user } = useAuth();
  return (
    <div className={`dc ${d.cls}`}>
      <div className="dc-s" />
      <div className="dc-b">
        <div className="dc-hd">
          <span className="dc-em">{d.e}</span>
          <div>
            <p className="dc-name">{d.n}</p>
            <p className="dc-sub">{d.sub}</p>
          </div>
        </div>

        {d.cls === "bls" ? (
          <BlossomReward />
        ) : (
          <div className="dc-rw">
            <p className="dc-rl">{d.rl}</p>
            <p className="dc-rv">{d.reward}</p>
          </div>
        )}

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
            <span key={tag} className="dc-tag">{tag}</span>
          ))}
        </div>
      </div>
      <div className="dc-ft">
        <a
          href={d.link}
          target="_blank"
          rel="noopener noreferrer"
          className="dc-cta"
          onClick={() => {
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
          }}
        >
          {d.cta}
        </a>
      </div>
    </div>
  );
}

function BlossomReward() {
  return (
    <div className="dc-rw">
      <p className="dc-rl">Referral bonus — $10 on first $50 deposit</p>
      <div className="bls-tiers">
        {BLOSSOM_TIERS.map(tier => (
          <div key={tier.name} className="bls-tier">
            <span className="bls-tier-name">{tier.name}</span>
            <span className="bls-tier-rate">{tier.rate}</span>
            <span className="bls-tier-note">{tier.from} · {tier.access}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
