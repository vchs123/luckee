import type { Experience } from "~/data/types";
import { LuckboardToggle } from "~/components/LuckboardToggle";
import { slugify } from "~/lib/slugify";

export function ExperienceCard({ x }: { x: Experience }) {
  const isAmber = x.col === "amber";
  return (
    <div className="xc">
      <span className="xc-ico">{x.e}</span>
      <div>
        <p className="xc-cat">{x.cat}</p>
        <p className="xc-title">{x.n}</p>
        <p className="xc-desc">{x.d}</p>
        <div className="xc-foot">
          <span className={`xc-tag ${isAmber ? "amber" : "green"}`}>
            {isAmber ? "⚡ Limited time" : "✓ Always free"}
          </span>
          <LuckboardToggle itemType="experience" itemSlug={slugify(x.n)} />
        </div>
      </div>
    </div>
  );
}
