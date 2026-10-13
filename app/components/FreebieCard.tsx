import { Link } from "react-router";
import { AlertTriangle, Bookmark, Cake, Calendar, Check, ExternalLink, Smartphone } from "lucide-react";
import type { Freebie } from "~/data/types";
import { LuckboardToggle } from "~/components/LuckboardToggle";
import { renderBrandOrEmojiSvg } from "~/components/SvgIcons";
import { useAuth } from "~/hooks/useAuth";
import { freebieKey } from "~/lib/slugify";

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
  const { user } = useAuth();

  return (
    <div className={`fc ${f.cat} card-lift`}>
      <div className="fc-stripe" />
      <div className="fc-b">
        <div className="fc-top">
          <span className="fc-em flex items-center justify-center">
            {renderBrandOrEmojiSvg(f.e, 24, "w-6 h-6")}
          </span>
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
          <p className="fc-d">
            <Smartphone className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--t3)]" />
            <span>{f.m}</span>
          </p>
          <p className="fc-d">
            <Calendar className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--t3)]" />
            <span>{f.t}</span>
          </p>
          {f.c && (
            <p className={f.ns ? "fc-d" : "fc-dc"}>
              {f.ns ? (
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#059669]" />
              ) : (
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--warn)]" />
              )}
              <span>{f.c}</span>
            </p>
          )}
          {daysUntilBirthday != null && daysUntilBirthday > 0 && (
            <p className="fc-bday-cd">
              <Cake className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>
                Birthday month in {daysUntilBirthday} day{daysUntilBirthday === 1 ? "" : "s"}
              </span>
            </p>
          )}
        </div>
        <div className="fc-ft">
          {f.verified ? (
            <span className="fc-ver">✓ Verified by Luckee</span>
          ) : (
            <span className="fc-ver fc-unver">Community · unverified</span>
          )}
          {user ? (
            <LuckboardToggle itemType="freebie" itemSlug={freebieKey(f)} />
          ) : (
            <Link
              to="/login"
              title="Sign in to save this to your Luckboard"
              aria-label="Sign in to save this to your Luckboard"
              className="shrink-0 rounded-full border border-[#ec489933] bg-white p-1.5 text-[var(--t3)] transition-colors hover:text-[var(--pink)]"
            >
              <Bookmark className="h-4 w-4" />
            </Link>
          )}
          <a href={f.link} target="_blank" rel="noopener noreferrer" className="fc-cta">
            Get freebie <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
