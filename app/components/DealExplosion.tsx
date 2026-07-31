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

export function DealExplosion() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth < 640);
  }, []);

  useEffect(() => {
    if (isMobile || prefersReducedMotion()) return;
    const section = sectionRef.current;
    if (!section) return;

    let ctx: { revert: () => void } | null = null;

    import("gsap").then(({ gsap }) => {
      import("gsap/ScrollTrigger").then(({ ScrollTrigger }) => {
        gsap.registerPlugin(ScrollTrigger);
        ctx = gsap.context(() => {
          const items = section.querySelectorAll<HTMLElement>(".dlx-item");
          const labels = section.querySelectorAll<HTMLElement>(".dlx-label");

          gsap.set(items, { x: 0 });
          gsap.set(labels, { opacity: 0, y: 10 });

          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: section,
              start: "top top",
              end: "+=600",
              pin: true,
              scrub: 1.2,
              anticipatePin: 1,
            },
          });

          tl.to(items, {
            x: (i: number) => SPREAD_X[i],
            ease: "power2.inOut",
            duration: 1,
          });

          tl.to(labels, {
            opacity: 1,
            y: 0,
            ease: "power2.out",
            stagger: 0.05,
            duration: 0.4,
          }, 0.6);
        }, section);
      });
    });

    return () => ctx?.revert();
  }, [isMobile]);

  return (
    <div className="dlx" ref={sectionRef}>
      <div className="dlx-inner">
        <div className="dlx-items">
          {DEALS.map((d, i) => (
            <Link
              key={d.cls}
              to="/deals"
              className="dlx-item"
              style={{ animationDuration: `${FLOAT_DURATION[i]}s` }}
            >
              <img
                src={LOGO_MAP[d.cls]}
                alt={d.n}
                className="dlx-logo"
                width={90}
                height={90}
              />
              <div className="dlx-label">
                <p className="dlx-name">{d.n}</p>
                <span className="dlx-bonus">{d.reward}</span>
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
