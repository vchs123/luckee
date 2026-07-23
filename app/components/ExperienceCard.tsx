import type { Experience } from "~/data/types";

export function ExperienceCard({ x }: { x: Experience }) {
  const isAmber = x.col === "amber";
  return (
    <div className="xc">
      <span className="xc-ico">{x.e}</span>
      <div>
        <p className="xc-cat">{x.cat}</p>
        <p className="xc-title">{x.n}</p>
        <p className="xc-desc">{x.d}</p>
        <span className={`xc-tag ${isAmber ? "amber" : "green"}`}>
          {isAmber ? "⚡ Limited time" : "✓ Always free"}
        </span>
      </div>
    </div>
  );
}
