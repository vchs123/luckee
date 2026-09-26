import { Link } from "react-router";
import { ArrowRight, Compass, MapPin, Sparkles } from "lucide-react";
import { BotanicLeafSvg } from "~/components/SvgIcons";
import { ExperienceCard } from "~/components/ExperienceCard";
import { playTactileClick } from "~/lib/sound";
import { MELB_TRANSPORT, MELB_CULTURE, MELB_CLASSES, MELB_OUTDOORS } from "~/data/free-melbourne";

const SAMPLE = [MELB_TRANSPORT[0], MELB_CULTURE[0], MELB_CULTURE[2], MELB_CULTURE[1]];
const TOTAL = MELB_TRANSPORT.length + MELB_CULTURE.length + MELB_CLASSES.length + MELB_OUTDOORS.length;

const HIGHLIGHTS = [
  {
    icon: <Compass className="h-4 w-4" />,
    title: "Free Tram Zone grid",
    body: "Travel fare-free across the CBD and Docklands grid without tapping a myki.",
  },
  {
    icon: <Sparkles className="h-4 w-4" />,
    title: "World-class public culture",
    body: "Permanent collections at NGV International, The Ian Potter Centre, ACMI and State Library are always $0.",
  },
  {
    icon: <MapPin className="h-4 w-4" />,
    title: "Laneways and botanic nature",
    body: "Royal Botanic Gardens, heritage arcades, live buskers and free guided city walks.",
  },
];

export function FreeMelbourne() {
  return (
    <section className="border-b border-[#0d948822] bg-gradient-to-b from-[#f0fdfa]/40 to-white px-4 py-14 md:px-8 md:py-16">
      <div className="mx-auto max-w-[1080px]">
        <div className="mb-6">
          <p className="eyebrow inline-flex items-center gap-1.5 text-[var(--melb)]">
            <BotanicLeafSvg size={15} /> No cost, ever
          </p>
          <h2 className="sec-h">Free in Melbourne right now</h2>
          <p className="sec-p mt-1">
            World-class galleries, free trams, walking tours and workshops — your zero-dollar day out
            starts here.
          </p>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-3.5 sm:grid-cols-3">
          {HIGHLIGHTS.map((h) => (
            <div
              key={h.title}
              className="flex items-start gap-3 rounded-2xl border border-[#0d94882e] bg-white/90 p-4 shadow-xs"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[var(--mb)] text-[var(--melb)] shadow-xs">
                {h.icon}
              </span>
              <div>
                <div className="text-xs font-black text-[var(--t1)]">{h.title}</div>
                <p className="mt-0.5 text-[11px] leading-snug text-[var(--t2)]">{h.body}</p>
              </div>
            </div>
          ))}
        </div>

        {/* The cards keep their Luckboard save toggle — restyled with the
            freebies pages in the next phase, so home and category pages match. */}
        <div className="g4">
          {SAMPLE.map((x) => (
            <ExperienceCard key={x.n} x={x} />
          ))}
        </div>

        <div className="pt-6 text-center">
          <Link
            to="/freebies/free-melbourne"
            onClick={playTactileClick}
            className="btn-ghost inline-flex items-center gap-2 border-[#0d948844] px-8 py-3 text-sm text-[var(--melb)] hover:border-[var(--melb)] hover:bg-[var(--melb)] hover:text-white"
          >
            <span>Explore all free experiences</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
          <p className="mt-2 text-xs font-medium text-[var(--t2)]">
            {TOTAL} zero-dollar city attractions, guided walks, public galleries and transit perks
          </p>
        </div>
      </div>
    </section>
  );
}
