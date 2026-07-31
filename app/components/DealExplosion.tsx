import { useEffect, useRef, useState } from "react";
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

function easeInOut(t: number) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

export function DealExplosion() {
  const outerRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth < 640);
  }, []);

  useEffect(() => {
    if (isMobile) return;
    const outer = outerRef.current;
    if (!outer) return;

    const items = Array.from(outer.querySelectorAll<HTMLElement>(".dlx-item"));
    const labels = Array.from(outer.querySelectorAll<HTMLElement>(".dlx-label"));

    if (prefersReducedMotion()) {
      items.forEach((item, i) => { item.style.transform = `translateX(${SPREAD_X[i]}px)`; });
      labels.forEach(label => { label.style.opacity = "1"; });
      return;
    }

    function update() {
      const rect = outer!.getBoundingClientRect();
      // progress 0→1 as outer scrolls from top:0 to top:-600
      const progress = Math.max(0, Math.min(1, -rect.top / 600));

      items.forEach((item, i) => {
        item.style.transform = `translateX(${SPREAD_X[i] * easeInOut(progress)}px)`;
      });

      // labels fade in during the last 45% of the animation
      const lp = Math.max(0, Math.min(1, (progress - 0.55) / 0.45));
      labels.forEach(label => {
        label.style.opacity = String(lp);
        label.style.transform = `translateY(${8 * (1 - lp)}px)`;
      });
    }

    window.addEventListener("scroll", update, { passive: true });
    update();

    return () => {
      window.removeEventListener("scroll", update);
      items.forEach(item => { item.style.transform = ""; });
      labels.forEach(label => { label.style.opacity = ""; label.style.transform = ""; });
    };
  }, [isMobile]);

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
            <Link key={d.cls} to="/deals" className="dlx-item">
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
