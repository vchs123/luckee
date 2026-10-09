import { Link } from "react-router";
import { Bookmark } from "lucide-react";
import type { Experience } from "~/data/types";
import { LuckboardToggle } from "~/components/LuckboardToggle";
import { renderBrandOrEmojiSvg } from "~/components/SvgIcons";
import { useAuth } from "~/hooks/useAuth";
import { slugify } from "~/lib/slugify";

export function ExperienceCard({ x }: { x: Experience }) {
  const { user } = useAuth();
  const isAmber = x.col === "amber";

  return (
    <div className="xc card-lift">
      <span className="xc-ico flex items-center justify-center">
        {renderBrandOrEmojiSvg(x.e, 26, "w-6 h-6")}
      </span>
      <div>
        <p className="xc-cat">{x.cat}</p>
        <p className="xc-title">{x.n}</p>
        <p className="xc-desc">{x.d}</p>
        <div className="xc-foot">
          <span className={`xc-tag ${isAmber ? "amber" : "green"}`}>
            {isAmber ? `⚡ ${x.t}` : `✓ ${x.t}`}
          </span>
          {user ? (
            <LuckboardToggle itemType="experience" itemSlug={slugify(x.n)} />
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
        </div>
      </div>
    </div>
  );
}
