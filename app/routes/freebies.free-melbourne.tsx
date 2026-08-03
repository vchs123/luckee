import { useState, useEffect, useRef } from "react";
import type { MetaFunction } from "react-router";
import { Link } from "react-router";
import { prefersReducedMotion } from "~/lib/reducedMotion";
import { initScrollReveals } from "~/lib/scrollReveal";
import { ExperienceCard } from "~/components/ExperienceCard";
import { TipBox } from "~/components/TipBox";
import { MELB_TRANSPORT, MELB_CULTURE, MELB_CLASSES, MELB_OUTDOORS } from "~/data/free-melbourne";

export const meta: MetaFunction = () => [
  { title: "Free Things to Do in Melbourne 2026 — Complete Guide | Luckee" },
  { name: "description", content: "A full day out in Melbourne CBD can cost nothing. Free trams, world-class galleries, walking tours, outdoor fitness and workshops — year-round guide by a local." },
  { property: "og:title", content: "Free Things to Do in Melbourne 2026 | Luckee" },
  { tagName: "link", rel: "canonical", href: "https://luckee-app.pages.dev/freebies/free-melbourne" },
];

const ALL = [...MELB_TRANSPORT, ...MELB_CULTURE, ...MELB_CLASSES, ...MELB_OUTDOORS];

export default function FreeMelbourne() {
  const [view, setView] = useState<"list" | "map">("list");
  const [mounted, setMounted] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (prefersReducedMotion() || !rootRef.current) return;
    initScrollReveals(rootRef.current);
  }, [view]);

  return (
    <div className="wrap" ref={rootRef}>
      <div className="sec-hd">
        <p style={{ fontSize: 12, color: "var(--t3)", marginBottom: 8 }}>
          <Link to="/freebies" style={{ textDecoration: "underline" }}>Freebies</Link> → Free Melbourne
        </p>
        <p className="eyebrow">🌿 Zero cost, ongoing</p>
        <h1 className="sec-h">Free in Melbourne</h1>
        <p className="sec-p wide">A full day out in the Melbourne CBD can cost absolutely nothing. Free trams, world-class galleries, walking tours, outdoor fitness and community workshops — year-round.</p>
      </div>

      <TipBox icon="🚃">
        <strong>Half-price public transport</strong> is running state-wide from Monday 1 June 2026 until 1 January 2027. The maximum Full Fare daily cap drops from $11.40 to $5.70. Under-18s travel free across Victoria with a Youth myki; seniors/carers/DSP recipients travel free on weekends.
      </TipBox>

      <div className="melb-view-toggle">
        <button className={`melb-vbtn${view === "list" ? " active" : ""}`} onClick={() => setView("list")}>☰ List</button>
        <button className={`melb-vbtn${view === "map" ? " active" : ""}`} onClick={() => setView("map")}>🗺 Map</button>
      </div>

      {view === "map" && mounted && (
        <div className="melb-map-wrap">
          {/* lazy import so leaflet CSS/JS only loads when map is shown */}
          <MapLazy experiences={ALL} />
        </div>
      )}

      {view === "list" && (
        <>
          <div className="ssh melb">🚃 Getting around</div>
          <div className="ga">{MELB_TRANSPORT.map(x => <ExperienceCard key={x.n} x={x} />)}</div>

          <div className="ssh melb" style={{ marginTop: 36 }}>🎨 Culture & arts</div>
          <div className="ga">{MELB_CULTURE.map(x => <ExperienceCard key={x.n} x={x} />)}</div>

          <div className="ssh melb" style={{ marginTop: 36 }}>🏃 Classes & workshops</div>
          <div className="ga">{MELB_CLASSES.map(x => <ExperienceCard key={x.n} x={x} />)}</div>

          <div className="ssh melb" style={{ marginTop: 36 }}>🌳 Markets & outdoors</div>
          <div className="ga">{MELB_OUTDOORS.map(x => <ExperienceCard key={x.n} x={x} />)}</div>
        </>
      )}
    </div>
  );
}

function MapLazy({ experiences }: { experiences: typeof ALL }) {
  const [MapComponent, setMapComponent] = useState<React.ComponentType<{ experiences: typeof ALL }> | null>(null);

  useEffect(() => {
    import("~/components/MelbourneMap").then(m => setMapComponent(() => m.MelbourneMap));
  }, []);

  if (!MapComponent) return <div className="melb-map-loading">Loading map…</div>;
  return <MapComponent experiences={experiences} />;
}
