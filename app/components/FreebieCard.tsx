import type { Freebie } from "~/data/types";
import { LuckboardToggle } from "~/components/LuckboardToggle";
import { slugify } from "~/lib/slugify";

interface Props {
  freebie: Freebie;
  daysUntilBirthday?: number | null;
}

const CAT_LABEL: Record<string, string> = {
  food: "Food & Drink",
  bty: "Beauty & Retail",
  sgn: "Sign-up bonus",
};

export function FreebieCard({ freebie: f, daysUntilBirthday }: Props) {
  return (
    <div className={`fc ${f.cat}`}>
      <div className="fc-stripe" />
      <div className="fc-b">
        <div className="fc-top">
          <span className="fc-em">{f.e}</span>
          <div className="fc-inf">
            <p className="fc-cat">{CAT_LABEL[f.cat]}</p>
            <p className="fc-brand">{f.n}</p>
            <p className="fc-prog">{f.pg}</p>
          </div>
          <span className={`bn ${f.ns ? "bn-ok" : "bn-warn"}`}>
            {f.ns ? "✓ No min spend" : "⚠ Min spend"}
          </span>
        </div>
        <div className="fc-rw">
          <p className="fc-rl">What you get</p>
          <p className="fc-rv">{f.r}</p>
        </div>
        <div className="fc-dt">
          <p className="fc-d"><span>📱</span><span>{f.m}</span></p>
          <p className="fc-d"><span>📅</span><span>{f.t}</span></p>
          {f.c && <p className="fc-dc"><span>⚠</span><span>{f.c}</span></p>}
          {daysUntilBirthday != null && daysUntilBirthday > 0 && (
            <p className="fc-bday-cd">
              <span>🎂</span>
              <span>{daysUntilBirthday === 0 ? "It's your birthday month!" : `Birthday month in ${daysUntilBirthday} day${daysUntilBirthday === 1 ? "" : "s"}`}</span>
            </p>
          )}
        </div>
        <div className="fc-ft">
          <span className="fc-ver">✓ Verified Jul 2026</span>
          <LuckboardToggle itemType="freebie" itemSlug={slugify(f.n)} />
          <a href={f.link} target="_blank" rel="noopener noreferrer" className="fc-cta">
            Get freebie <span className="arrow">→</span>
          </a>
        </div>
      </div>
    </div>
  );
}
