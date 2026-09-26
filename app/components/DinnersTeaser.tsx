import { Link } from "react-router";
import { ArrowRight, Utensils } from "lucide-react";
import { playTactileClick } from "~/lib/sound";

const PILLARS = [
  {
    emoji: "🗣️",
    title: "Language matching",
    body: "Practise speaking, or chat comfortably",
    skin: "bg-[#fff0f8] border-[#ec48991a]",
  },
  {
    emoji: "👥",
    title: "2–6 people",
    body: "Small, intimate group tables",
    skin: "bg-[#f0fdfa] border-[#0d94881a]",
  },
  {
    emoji: "🌱",
    title: "Cost-neutral",
    body: "Split the bill evenly, no markups",
    skin: "bg-[#fdf4ff] border-[#a855f71a]",
  },
];

export function DinnersTeaser() {
  return (
    <section
      id="dinners"
      className="border-b border-[#ec489922] bg-gradient-to-b from-white to-[#fff0f8] px-4 py-16 md:px-8 md:py-20"
    >
      <div className="mx-auto max-w-[1080px]">
        <div className="shadow-paper-lift relative overflow-hidden rounded-3xl border border-[#ec48992e] bg-white p-8 md:p-12">
          <div className="max-w-2xl">
            <p className="eyebrow inline-flex items-center gap-1.5">
              <Utensils className="h-3.5 w-3.5" /> Dinners
            </p>

            <h2 className="sec-h mb-3">
              Community Dinners{" "}
              <span className="text-2xl font-normal text-[var(--t3)] md:text-3xl">(Coming soon)</span>
            </h2>

            <p className="sec-p mb-6">
              Language-matched community dinners with 2–6 new people. Non-profit, cost-neutral. Fill
              out a profile and I'll match you when the first tables open.
            </p>

            <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {PILLARS.map((p) => (
                <div key={p.title} className={`rounded-2xl border p-3.5 ${p.skin}`}>
                  <div aria-hidden className="mb-1 text-xl">
                    {p.emoji}
                  </div>
                  <div className="text-xs font-bold text-[var(--t1)]">{p.title}</div>
                  <div className="mt-0.5 text-[11px] text-[var(--t2)]">{p.body}</div>
                </div>
              ))}
            </div>

            <Link
              to="/dinners"
              onClick={playTactileClick}
              className="btn-pink inline-flex items-center gap-2 px-8 py-3 text-sm shadow-lg"
            >
              <span>Join the waitlist</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
