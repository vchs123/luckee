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
};

const SPREAD_X = [-380, -190, 0, 190, 380];
const FLOAT_DURATION = [2.8, 3.2, 2.6, 3.4, 3.0];

function easeOut(t: number) {
  return 1 - (1 - t) * (1 - t);
}

export function DealExplosion() {
  const outerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = outerRef.current;
    if (!el) return;

    const items = Array.from(el.querySelectorAll<HTMLElement>(".dlx-item"));

    if (prefersReducedMotion()) {
      items.forEach((item, i) => {
        item.style.transform = `translateX(${SPREAD_X[i]}px)`;
      });
      return;
    }

    function update() {
      const rect = el!.getBoundingClientRect();
      const vh = window.innerHeight;
      // How much of the section is visible in the viewport
      const visible = Math.max(0, Math.min(rect.bottom, vh) - Math.max(rect.top, 0));
      const maxVisible = Math.min(rect.height, vh);
      // Reach full spread when 75% of max-visible height is in view
      const raw = maxVisible > 0 ? visible / (maxVisible * 0.75) : 0;
      const progress = easeOut(Math.min(1, raw));

      items.forEach((item, i) => {
        item.style.transform = `translateX(${SPREAD_X[i] * progress}px)`;
      });
    }

    window.addEventListener("scroll", update, { passive: true });
    update();
    return () => {
      window.removeEventListener("scroll", update);
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
              to="/deals"
              className="dlx-item"
              style={{ "--tx": `${SPREAD_X[i]}px` } as React.CSSProperties}
            >
              <div className="dlx-float" style={{ animationDuration: `${FLOAT_DURATION[i]}s` }}>
                <img src={LOGO_MAP[d.cls]} alt={d.n} className="dlx-logo" width={90} height={90} />
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
