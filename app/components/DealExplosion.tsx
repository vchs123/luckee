import { useEffect, useRef } from "react";
import { Link } from "react-router";
import { prefersReducedMotion } from "~/lib/reducedMotion";
import { DEALS } from "~/data/deals";

const LOGO_MAP: Record<string, string> = {
  cld: "/claude-logo.png",
  bls: "/blossom-logo.png",
  krs: "/kris-plus-logo.png",
  mac: "/macadam-logo.png",
  rvl: "/revolut-logo.jpg",
  eat: "/eatclub-logo.svg",
};

const SPREAD_X = [-475, -285, -95, 95, 285, 475];
const FLOAT_DURATION = [2.8, 3.2, 2.6, 3.4, 3.0, 2.9];

function easeInOut(t: number) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

export function DealExplosion() {
  const outerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = outerRef.current;
    if (!el) return;

    const items = Array.from(el.querySelectorAll<HTMLElement>(".dlx-item"));

    if (window.matchMedia("(max-width: 640px)").matches) return;

    if (prefersReducedMotion()) {
      items.forEach((item, i) => { item.style.transform = `translateX(${SPREAD_X[i]}px)`; });
      return;
    }

    let rafId: number;

    function tick() {
      const rect = el!.getBoundingClientRect();
      // progress: 0 when .dlx top is at viewport top, 1 after 600px of scroll
      const raw = Math.max(0, Math.min(1, -rect.top / 600));
      const progress = easeInOut(raw);
      items.forEach((item, i) => {
        item.style.transform = `translateX(${SPREAD_X[i] * progress}px)`;
      });
      rafId = requestAnimationFrame(tick);
    }

    rafId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafId);
      items.forEach(item => { item.style.transform = ""; });
    };
  }, []);

  return (
    <div className="dlx" ref={outerRef}>
      <div className="dlx-inner">
        <div className="wrap">
          <div className="sec-hd">
            <p className="eyebrow">💸 Referral deals</p>
            <h2 className="sec-h">Deals I genuinely use</h2>
          </div>
          <p className="sec-p">Products I recommend. Sign up through my links and you'll usually get a bonus — so do I.</p>
        </div>
        <div className="dlx-stage">
          {DEALS.map((d, i) => (
            <Link
              key={d.cls}
              to={`/deals#${d.cls}`}
              className="dlx-item"
            >
              <div className="dlx-float" style={{ animationDuration: `${FLOAT_DURATION[i]}s` }}>
                {LOGO_MAP[d.cls] ? (
                  <img src={LOGO_MAP[d.cls]} alt={d.n} className={`dlx-logo${d.cls === "eat" ? " dl-logo-wide" : ""}`} width={90} height={90} />
                ) : (
                  <div className="dlx-logo dl-logo-emoji" aria-hidden="true">{d.e}</div>
                )}
                <div className="dlx-label">
                  <p className="dlx-name">{d.n}</p>
                  <span className="dlx-bonus">{d.reward}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
        <Link to="/deals" className="dlx-cta btn-ghost">
          See all deals →
        </Link>
      </div>
    </div>
  );
}
