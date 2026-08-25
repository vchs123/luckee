"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router";
import { m, useMotionValue, useSpring, useTransform } from "framer-motion";
import { prefersReducedMotion } from "~/lib/reducedMotion";
import { useAuth } from "~/hooks/useAuth";

type Tab = { to: string; icon: string; label: string; match: (p: string) => boolean };

const TABS: Tab[] = [
  { to: "/", icon: "🏠", label: "Home", match: p => p === "/" },
  { to: "/freebies", icon: "🎁", label: "Freebies", match: p => p.startsWith("/freebies") },
  { to: "/deals", icon: "💸", label: "Deals", match: p => p === "/deals" },
  { to: "/dinners", icon: "🍜", label: "Dinners", match: p => p === "/dinners" },
  { to: "/rewards", icon: "🎡", label: "Rewards", match: p => p === "/rewards" },
];

const N = TABS.length;
const BAR_H = 64;      // solid bar height
const SVG_H = 108;     // extra headroom above the bar for the bubble
const TOP = SVG_H - BAR_H;
const SOCKET_W = 44;   // half-width of the socket at rest
const DEPTH = 26;      // how far the socket dips at rest
const R = 25;          // bubble radius
const MAX_INNER = 560; // tabs stay grouped rather than stretching across a wide screen

/**
 * Top edge of the bar with a socket melted into it around `cx`.
 *
 * Every join is horizontal-to-horizontal, so the curve is tangent-continuous
 * end to end and the liquid never creases:
 *   - entering (cx-w, TOP) the handle runs along +x, matching the flat edge
 *   - at the floor (cx, TOP+depth) both handles are horizontal and collinear
 *   - leaving (cx+w, TOP) the handle runs along -x, matching the flat edge
 */
function topEdge(w: number, cx: number, depth: number, width: number) {
  const k = w * 0.52;   // handle length along the flat edge
  const hw = w * 0.42;  // handle length across the socket floor
  const y = TOP + depth;
  return (
    `M0,${TOP} L${cx - w},${TOP} ` +
    `C${cx - w + k},${TOP} ${cx - hw},${y} ${cx},${y} ` +
    `C${cx + hw},${y} ${cx + w - k},${TOP} ${cx + w},${TOP} ` +
    `L${width},${TOP}`
  );
}

export function BottomNav() {
  const { pathname } = useLocation();
  const { isAdmin } = useAuth();
  const wrapRef = useRef<HTMLElement>(null);
  const [width, setWidth] = useState(0);
  const [reduce, setReduce] = useState(false);

  const activeIndex = TABS.findIndex(t => t.match(pathname));
  // Keep the socket parked at the last real tab on pages with no tab (/about, /login…).
  const [parked, setParked] = useState(activeIndex < 0 ? 0 : activeIndex);
  useEffect(() => {
    if (activeIndex >= 0) setParked(activeIndex);
  }, [activeIndex]);

  useEffect(() => setReduce(prefersReducedMotion()), []);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width));
    ro.observe(el);
    setWidth(el.getBoundingClientRect().width);
    return () => ro.disconnect();
  }, []);

  // Tabs are capped and centred, so the socket has to track that inner box.
  const inner = Math.min(width, MAX_INNER);
  const originX = (width - inner) / 2;
  const centre = (i: number) => originX + (inner / N) * (i + 0.5);

  // Target follows the active tab instantly; the spring is what melts.
  const target = useMotionValue(0);
  useEffect(() => {
    if (width > 0) target.set(centre(parked));
  }, [parked, width, target]);

  const cx = useSpring(target, reduce ? { stiffness: 2000, damping: 100 } : { stiffness: 260, damping: 28, mass: 0.9 });

  // Distance still to travel, normalised — this is what drives the melt.
  const travel = useTransform<number, number>([cx, target], ([c, t]) =>
    Math.min(Math.abs(c - t) / (inner / N || 1), 1)
  );

  // Off-tab pages flatten the socket out entirely.
  const presence = useSpring(activeIndex >= 0 ? 1 : 0, { stiffness: 300, damping: 30 });
  useEffect(() => { presence.set(activeIndex >= 0 ? 1 : 0); }, [activeIndex, presence]);

  // Mid-flight the socket stretches wide and shallow, then reforms deep and tight.
  const w = useTransform(travel, t => SOCKET_W * (1 + 0.6 * t));
  const depth = useTransform<number, number>([travel, presence], ([t, p]) => DEPTH * (1 - 0.45 * t) * p);

  const fill = useTransform<number, string>([w, cx, depth], ([ww, c, d]) =>
    width > 0 ? `${topEdge(ww, c, d, width)} L${width},${SVG_H} L0,${SVG_H} Z` : ""
  );
  const stroke = useTransform<number, string>([w, cx, depth], ([ww, c, d]) =>
    width > 0 ? topEdge(ww, c, d, width) : ""
  );

  const bubbleX = useTransform(cx, c => c - R);
  const bubbleY = useTransform(depth, d => TOP + d - 2 * R + 4);
  const bubbleScaleX = useTransform(travel, t => 1 + 0.18 * t);
  const bubbleScaleY = useTransform(travel, t => 1 - 0.14 * t);

  const activeIcon = useMemo(() => TABS[parked]?.icon ?? "", [parked]);

  // The admin only sees the dashboard, which has its own sidebar nav.
  if (isAdmin) return null;

  return (
    <nav className="bnav" ref={wrapRef} aria-label="Primary">
      <svg className="bnav-svg" width={width || 1} height={SVG_H} viewBox={`0 0 ${width || 1} ${SVG_H}`} aria-hidden="true">
        <m.path className="bnav-fill" d={fill} />
        <m.path className="bnav-edge" d={stroke} fill="none" />
      </svg>

      <m.div
        className="bnav-bubble"
        style={{ x: bubbleX, y: bubbleY, scaleX: bubbleScaleX, scaleY: bubbleScaleY, opacity: presence }}
        aria-hidden="true"
      >
        <span className="bnav-bubble-ico">{activeIcon}</span>
      </m.div>

      <ul className="bnav-tabs">
        {TABS.map((t, i) => {
          const on = i === activeIndex;
          return (
            <li key={t.to}>
              <Link to={t.to} className={`bnav-tab${on ? " on" : ""}`} aria-current={on ? "page" : undefined}>
                <span className="bnav-ico">{t.icon}</span>
                <span className="bnav-lbl">{t.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
