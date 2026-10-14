import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import { DropCard } from "~/components/DropCard";
import type { DealDrop } from "~/lib/drops";

/** The newest deal drops on the home page. Renders nothing until there are any. */
export function DropsTeaser({ drops, today }: { drops: DealDrop[]; today: string }) {
  if (drops.length === 0) return null;
  return (
    <section className="wrap py-14" aria-labelledby="drops-teaser-h">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">🎁 Just dropped</p>
          <h2 id="drops-teaser-h" className="sec-h">Fresh deal drops</h2>
        </div>
        <Link
          to="/drops"
          className="inline-flex items-center gap-1.5 border-2 border-black bg-white px-4 py-2 text-xs font-black uppercase tracking-wider text-black shadow-hard-sm hover:bg-[#fff0f8]"
        >
          See all drops <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {drops.map((d) => (
          <DropCard key={d.id} drop={d} today={today} />
        ))}
      </div>
    </section>
  );
}
