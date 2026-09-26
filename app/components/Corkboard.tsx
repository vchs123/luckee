import { m } from "framer-motion";
import { Pin, PlusCircle } from "lucide-react";
import { EXAMPLE_PINS } from "~/data/community-posts";
import { fadeUp, inViewOnce } from "~/lib/motion";

/** Note skins, cycled by position. */
const THEMES = [
  { bg: "bg-[#fffdf0]", tag: "bg-[#ffcf00] text-black", pin: "bg-red-600", tilt: "-rotate-2" },
  { bg: "bg-[#fdfaf5]", tag: "bg-black text-white", pin: "bg-blue-600", tilt: "rotate-1" },
  { bg: "bg-[#fef9ee]", tag: "bg-red-600 text-white", pin: "bg-yellow-400", tilt: "-rotate-1" },
  { bg: "bg-white", tag: "bg-[#ffcf00] text-black", pin: "bg-emerald-600", tilt: "rotate-2" },
];

export function Corkboard() {
  return (
    <section
      id="community"
      className="corkboard-surface relative overflow-hidden border-b-4 border-black px-4 py-20 md:px-8 md:py-24"
    >
      <span
        aria-hidden
        className="font-mono-code pointer-events-none absolute left-6 top-3 select-none border border-amber-400 bg-amber-100/90 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-amber-950"
      >
        Corkboard bulletin
      </span>

      <div className="relative z-10 mx-auto max-w-6xl pt-4">
        <m.div
          className="mb-10 text-center"
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={inViewOnce}
        >
          <span className="mb-4 inline-flex rotate-[-1deg] items-center gap-2 border-2 border-black bg-[#ffcf00] px-5 py-2 text-xs font-black uppercase tracking-widest text-black shadow-[4px_4px_0px_#000]">
            <Pin className="h-4 w-4 text-red-600" />
            Community bulletin
          </span>

          <h2 className="mb-3 text-4xl font-black uppercase leading-none tracking-tight text-black md:text-6xl">
            The{" "}
            <span className="inline-block bg-black px-2.5 py-0.5 text-white shadow-[4px_4px_0px_#ffcf00]">
              Melbourne deal hunter
            </span>{" "}
            bulletin
          </h2>
          <p className="mx-auto max-w-xl text-sm font-bold uppercase tracking-tight text-neutral-800 md:text-base">
            Soon you'll be able to pin Melbourne food hacks, student discounts and verified finds for
            other locals to use.
          </p>
        </m.div>

        <div className="mb-8 flex flex-col items-center justify-between gap-4 border-b-2 border-black pb-4 sm:flex-row">
          <div>
            <h3 className="text-2xl font-black uppercase tracking-tight text-black">
              What a pinned find looks like
            </h3>
            <p className="text-xs font-bold uppercase text-neutral-700">
              Examples only — pinning opens once review is in place
            </p>
          </div>

          <button
            type="button"
            disabled
            title="Community pinning opens soon"
            className="btn-bold-black shadow-hard-sm inline-flex cursor-not-allowed items-center gap-2 px-6 py-3 text-xs font-black uppercase tracking-widest opacity-60"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Pin a deal — opens soon</span>
          </button>
        </div>

        <div className="grid grid-cols-1 gap-7 md:grid-cols-2 lg:grid-cols-4">
          {EXAMPLE_PINS.map((post, i) => {
            const theme = THEMES[i % THEMES.length];
            return (
              <m.div
                key={post.id}
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={inViewOnce}
                className={`shadow-paper-lift hover:shadow-paper-hover relative flex flex-col justify-between rounded-xs border-2 border-black p-5 transition-all duration-300 hover:rotate-0 ${theme.bg} ${theme.tilt}`}
              >
                <span
                  aria-hidden
                  className={`absolute -top-3.5 left-1/2 z-20 h-6 w-6 -translate-x-1/2 rounded-full border-2 border-black shadow-[0_4px_6px_rgba(0,0,0,0.35)] ${theme.pin}`}
                />

                <div>
                  <div className="mb-3 flex items-center justify-between pt-1 text-xs">
                    <span aria-hidden className="text-base">
                      {post.avatar}
                    </span>
                    <span
                      className={`border border-black px-2 py-0.5 text-[10px] font-black uppercase shadow-xs ${theme.tag}`}
                    >
                      {post.badge}
                    </span>
                  </div>

                  <h4 className="mb-2 text-lg font-black uppercase leading-snug text-black">
                    {post.dealTitle}
                  </h4>
                  <div className="mb-3 flex items-center justify-between text-xs font-black uppercase">
                    <span className="text-neutral-600">Spot: {post.store}</span>
                    <span className="font-mono-code border border-black bg-red-600 px-2 py-0.5 font-black text-white shadow-xs">
                      {post.savings}
                    </span>
                  </div>

                  <p className="font-hand mb-2 border-2 border-black/80 bg-white/80 p-3 text-base leading-snug text-neutral-900">
                    {post.comment}
                  </p>
                </div>
              </m.div>
            );
          })}
        </div>

        <p className="mt-8 text-center text-xs font-bold uppercase tracking-tight text-neutral-800">
          Every pin will be checked before it appears here.
        </p>
      </div>
    </section>
  );
}
