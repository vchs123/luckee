import { useEffect, useState } from "react";
import { Link, useFetcher } from "react-router";
import { AnimatePresence, m } from "framer-motion";
import { CheckCircle2, Pin, PlusCircle, Send, X } from "lucide-react";
import { EXAMPLE_PINS } from "~/data/community-posts";
import { fadeUp, inViewOnce } from "~/lib/motion";
import { useAuth } from "~/hooks/useAuth";
import { PIN_EMOJIS, PIN_LIMITS, PIN_POINTS, type CommunityPin } from "~/lib/pins";

/** Note skins, cycled by position. */
const THEMES = [
  { bg: "bg-[#fffdf0]", tag: "bg-[#ffcf00] text-black", pin: "bg-red-600", tilt: "-rotate-2" },
  { bg: "bg-[#fdfaf5]", tag: "bg-black text-white", pin: "bg-blue-600", tilt: "rotate-1" },
  { bg: "bg-[#fef9ee]", tag: "bg-red-600 text-white", pin: "bg-yellow-400", tilt: "-rotate-1" },
  { bg: "bg-white", tag: "bg-[#ffcf00] text-black", pin: "bg-emerald-600", tilt: "rotate-2" },
];

type Note = {
  id: string;
  emoji: string;
  title: string;
  spot: string;
  savings: string | null;
  notes: string | null;
  badge: string;
};

/**
 * The community bulletin. Approved member pins (from the home loader) fill the
 * board; until the first one is approved, clearly labelled example pins show
 * what a pin looks like. Pinning is for signed-in members and every pin is
 * reviewed (admin.pins.tsx) before it appears.
 */
export function Corkboard({ pins }: { pins: CommunityPin[] }) {
  const { user, isAdmin } = useAuth();
  const [open, setOpen] = useState(false);
  const live = pins.length > 0;

  const notes: Note[] = live
    ? pins.map((p) => ({
        id: p.id,
        emoji: p.emoji,
        title: p.title,
        spot: p.spot,
        savings: p.savings,
        notes: p.notes,
        badge: p.username ? `@${p.username}` : "Member pin",
      }))
    : EXAMPLE_PINS.map((p) => ({
        id: p.id,
        emoji: p.avatar,
        title: p.dealTitle,
        spot: p.store,
        savings: p.savings,
        notes: p.comment,
        badge: p.badge,
      }));

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
            Food hacks, student discounts and finds pinned by Luckee members for other locals to use.
          </p>
        </m.div>

        <div className="mb-8 flex flex-col items-center justify-between gap-4 border-b-2 border-black pb-4 sm:flex-row">
          <div>
            <h3 className="text-2xl font-black uppercase tracking-tight text-black">
              {live ? "Freshly pinned" : "What a pinned find looks like"}
            </h3>
            <p className="text-xs font-bold uppercase text-neutral-700">
              {live
                ? "Checked by Luckee before they go up. Deals change, so confirm before you go."
                : "Examples only. Be the first to pin a real find!"}
            </p>
          </div>

          {user && !isAdmin ? (
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="btn-bold-black shadow-hard-sm inline-flex cursor-pointer items-center gap-2 px-6 py-3 text-xs font-black uppercase tracking-widest"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Pin a deal</span>
            </button>
          ) : !user ? (
            <Link
              to="/login"
              className="btn-bold-black shadow-hard-sm inline-flex items-center gap-2 px-6 py-3 text-xs font-black uppercase tracking-widest"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Sign in to pin a deal</span>
            </Link>
          ) : null}
        </div>

        <div className="grid grid-cols-1 gap-7 md:grid-cols-2 lg:grid-cols-4">
          {notes.map((post, i) => {
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
                  <div className="mb-3 flex items-center justify-between gap-2 pt-1 text-xs">
                    <span aria-hidden className="text-base">
                      {post.emoji}
                    </span>
                    <span
                      className={`truncate border border-black px-2 py-0.5 text-[10px] font-black shadow-xs ${post.badge.startsWith("@") ? "" : "uppercase"} ${theme.tag}`}
                    >
                      {post.badge}
                    </span>
                  </div>

                  <h4 className="mb-2 break-words text-lg font-black uppercase leading-snug text-black">{post.title}</h4>
                  <div className="mb-3 flex items-center justify-between gap-2 text-xs font-black uppercase">
                    <span className="min-w-0 break-words text-neutral-600">Spot: {post.spot}</span>
                    {post.savings && (
                      <span className="font-mono-code shrink-0 border border-black bg-red-600 px-2 py-0.5 font-black text-white shadow-xs">
                        {post.savings}
                      </span>
                    )}
                  </div>

                  {post.notes && (
                    <p className="font-hand mb-2 whitespace-pre-line break-words border-2 border-black/80 bg-white/80 p-3 text-base leading-snug text-neutral-900">
                      {post.notes}
                    </p>
                  )}
                </div>
              </m.div>
            );
          })}
        </div>

        <p className="mt-8 text-center text-xs font-bold uppercase tracking-tight text-neutral-800">
          Every pin is checked before it appears here. Approved pins earn {PIN_POINTS} pts.
        </p>
      </div>

      <AnimatePresence>{open && <PinForm onClose={() => setOpen(false)} />}</AnimatePresence>
    </section>
  );
}

const field =
  "w-full border-2 border-black bg-[#fdfaf5] px-3 py-2 text-sm font-bold normal-case text-black focus:bg-[#fffdf0] focus:outline-none";

function PinForm({ onClose }: { onClose: () => void }) {
  const fetcher = useFetcher<{ ok: boolean; error?: string }>();
  const [emoji, setEmoji] = useState<string>(PIN_EMOJIS[0]);
  const done = fetcher.state === "idle" && fetcher.data?.ok;
  const sending = fetcher.state !== "idle";

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <m.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="pin-form-title"
        initial={{ scale: 0.95, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 16 }}
        onClick={(e) => e.stopPropagation()}
        className="relative max-h-[90vh] w-full max-w-md overflow-y-auto border-4 border-black bg-white p-6 text-black shadow-hard-lg"
      >
        <div className="mb-4 flex items-center justify-between border-b-2 border-black pb-3">
          <h3 id="pin-form-title" className="text-2xl font-black uppercase tracking-tight">
            Pin a Melbourne deal
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 cursor-pointer items-center justify-center border-2 border-black bg-black text-white hover:bg-red-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {done ? (
          <div className="py-6 text-center" role="status">
            <CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-emerald-600" />
            <h4 className="mb-1 text-xl font-black uppercase">Pinned for review</h4>
            <p className="text-sm font-bold text-neutral-700">
              We'll check it, usually within a day. Once it's approved it goes up on the board and you get {PIN_POINTS} pts.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="btn-bold-black mt-5 cursor-pointer px-6 py-3 text-xs font-black uppercase tracking-widest"
            >
              Done
            </button>
          </div>
        ) : (
          <fetcher.Form method="post" action="/api/pins" className="space-y-4 text-xs font-black uppercase">
            <fieldset>
              <legend className="mb-1">Pick an icon</legend>
              <div className="flex flex-wrap gap-1.5">
                {PIN_EMOJIS.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setEmoji(e)}
                    aria-pressed={emoji === e}
                    className={`flex h-9 w-9 cursor-pointer items-center justify-center border-2 text-lg ${
                      emoji === e ? "border-black bg-[#ffcf00]" : "border-neutral-300 bg-white hover:border-black"
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
              <input type="hidden" name="emoji" value={emoji} />
            </fieldset>
            <label className="block">
              <span className="mb-1 block">Deal or special *</span>
              <input className={field} name="title" required minLength={3} maxLength={PIN_LIMITS.title} placeholder="e.g. $1 dumplings on Tuesdays" />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1 block">Venue or suburb *</span>
                <input className={field} name="spot" required minLength={2} maxLength={PIN_LIMITS.spot} placeholder="e.g. Footscray" />
              </label>
              <label className="block">
                <span className="mb-1 block">Saving</span>
                <input className={field} name="savings" maxLength={PIN_LIMITS.savings} placeholder="e.g. Half price" />
              </label>
            </div>
            <label className="block">
              <span className="mb-1 block">How to get it</span>
              <textarea
                className={field}
                name="notes"
                rows={3}
                maxLength={PIN_LIMITS.notes}
                placeholder="Days and times, what to show or say, anything that tripped you up."
              />
            </label>
            <p className="text-[11px] font-bold normal-case text-neutral-600">
              Shown with your username once it's approved. Please only pin deals you've seen yourself, no referral codes.
            </p>
            {fetcher.data?.error && (
              <p className="border-2 border-black bg-red-100 p-2.5 text-xs font-bold normal-case text-red-800">{fetcher.data.error}</p>
            )}
            <button
              type="submit"
              disabled={sending}
              className="btn-bold-black flex w-full cursor-pointer items-center justify-center gap-2 py-3 text-xs font-black uppercase tracking-widest disabled:opacity-60"
            >
              <Send className="h-4 w-4" />
              <span>{sending ? "Sending…" : "Send for review"}</span>
            </button>
          </fetcher.Form>
        )}
      </m.div>
    </div>
  );
}
