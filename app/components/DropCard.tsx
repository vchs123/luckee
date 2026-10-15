import { useEffect, useRef, useState } from "react";
import { Link, useFetcher } from "react-router";
import { CalendarClock, Check, Copy, Heart, Mail, MapPin, Share2 } from "lucide-react";
import { categoryOf, whenLabel, type DealDrop } from "~/lib/drops";

/**
 * One deal drop. `full` is the post's own page (/drops/:slug): the title isn't
 * a link and the photo is larger. `now` is the Melbourne date and time from
 * the loader, so "On now"/"Ended" render the same on the server and in the
 * browser.
 */
export function DropCard({ drop, now, full = false }: { drop: DealDrop; now: string; full?: boolean }) {
  const when = whenLabel(drop, now);
  const ends = when?.ended ? when : null;
  const cat = categoryOf(drop.category);
  const href = `/drops/${drop.slug}`;

  return (
    <article className={`flex flex-col border-[3px] border-black bg-white shadow-hard-sm ${ends ? "opacity-75" : ""}`}>
      {drop.imageUrl && (
        <div className={`overflow-hidden border-b-[3px] border-black bg-neutral-100 ${full ? "aspect-[4/3]" : "aspect-[16/10]"}`}>
          <img src={drop.imageUrl} alt="" loading={full ? "eager" : "lazy"} className="h-full w-full object-cover" />
        </div>
      )}
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="mb-2 flex flex-wrap items-center gap-1.5">
          <span className="text-xl" aria-hidden="true">{drop.emoji}</span>
          <span className={`border border-black px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${cat.badge}`}>
            {cat.label}
          </span>
          {drop.saving && (
            <span className="border border-black bg-white px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-black">
              {drop.saving}
            </span>
          )}
          {when?.live && (
            <span className="border border-black bg-black px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white">
              On now
            </span>
          )}
          {ends && (
            <span className="border border-black bg-neutral-200 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-neutral-600">
              Ended
            </span>
          )}
        </div>

        {full ? (
          <h1 className="text-2xl font-black leading-tight text-black sm:text-3xl">{drop.title}</h1>
        ) : (
          <h3 className="text-lg font-black leading-snug text-black">
            <Link to={href} className="hover:text-[#e91e8c]">
              {drop.title}
            </Link>
          </h3>
        )}

        {drop.place && (
          <p className="mt-1 flex items-center gap-1 text-xs font-bold text-neutral-600">
            <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /> {drop.place}
          </p>
        )}
        {when && (
          <p className="mt-1 flex items-center gap-1 text-xs font-bold text-neutral-600">
            <CalendarClock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /> {when.text}
          </p>
        )}

        {drop.body && (
          <p className={`mt-3 whitespace-pre-line text-sm leading-relaxed text-neutral-800 ${full ? "" : "line-clamp-4"}`}>
            {drop.body}
          </p>
        )}

        <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
          <LikeButton drop={drop} />
          <ShareButton drop={drop} />
          {drop.sourceUrl && (
            <a
              href={drop.sourceUrl}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="ml-auto text-[11px] font-black uppercase tracking-wider text-black underline decoration-[#e91e8c] decoration-2 underline-offset-2"
            >
              See the post ↗
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

const pill =
  "inline-flex cursor-pointer items-center gap-1.5 border-2 border-black bg-white px-3 py-1.5 text-xs font-black text-black transition-colors hover:bg-[#fff0f8]";

/** Open to everyone; the server counts members per account and visitors per browser. */
function LikeButton({ drop }: { drop: DealDrop }) {
  const fetcher = useFetcher<{ ok: boolean; liked?: boolean; count?: number }>();
  const pending = fetcher.state !== "idle";
  const optimistic = pending ? !drop.liked : undefined;
  const done = fetcher.data?.ok && !pending;
  const liked = done ? !!fetcher.data!.liked : (optimistic ?? drop.liked);
  const count = done ? (fetcher.data!.count ?? drop.likes) : drop.likes + (optimistic === undefined ? 0 : optimistic ? 1 : -1);

  return (
    <fetcher.Form method="post" action="/api/drops/like">
      <input type="hidden" name="dropId" value={drop.id} />
      <button type="submit" className={pill} aria-pressed={liked} aria-label={`${liked ? "Unlike" : "Like"} (${count} likes)`}>
        <Heart className={`h-4 w-4 ${liked ? "fill-red-600 text-red-600" : ""}`} strokeWidth={2.5} />
        {count}
      </button>
    </fetcher.Form>
  );
}

/**
 * The phone's own share sheet where there is one (WhatsApp, Messages,
 * Instagram stories…); otherwise a small menu of links and copy-link.
 */
function ShareButton({ drop }: { drop: DealDrop }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  const url = () => `${window.location.origin}/drops/${drop.slug}`;
  const text = `${drop.title}${drop.place ? ` (${drop.place})` : ""}`;

  const onShare = async () => {
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: drop.title, text, url: url() });
      } catch {
        /* dismissed */
      }
      return;
    }
    setOpen((o) => !o);
  };

  const enc = encodeURIComponent;
  const links = open
    ? [
        { label: "WhatsApp", href: `https://wa.me/?text=${enc(`${text} ${url()}`)}` },
        { label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${enc(url())}` },
        { label: "X", href: `https://twitter.com/intent/tweet?text=${enc(text)}&url=${enc(url())}` },
      ]
    : [];

  return (
    <div className="relative" ref={ref}>
      <button type="button" className={pill} onClick={onShare} aria-expanded={open} aria-haspopup="menu">
        <Share2 className="h-4 w-4" /> Share
      </button>
      {open && (
        <div role="menu" className="absolute bottom-[calc(100%+6px)] left-0 z-30 min-w-[180px] border-[3px] border-black bg-white p-1 shadow-hard-md">
          <button
            type="button"
            role="menuitem"
            className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm font-bold hover:bg-[#fff0f8]"
            onClick={() =>
              navigator.clipboard
                .writeText(url())
                .then(() => {
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                })
                .catch(() => {})
            }
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} {copied ? "Copied" : "Copy link"}
          </button>
          {links.map((l) => (
            <a
              key={l.label}
              role="menuitem"
              href={l.href}
              target="_blank"
              rel="noopener noreferrer"
              className="block px-3 py-2 text-sm font-bold hover:bg-[#fff0f8]"
            >
              {l.label}
            </a>
          ))}
          <a
            role="menuitem"
            href={`mailto:?subject=${enc(drop.title)}&body=${enc(`${text}\n${typeof window !== "undefined" ? url() : ""}`)}`}
            className="flex items-center gap-2 px-3 py-2 text-sm font-bold hover:bg-[#fff0f8]"
          >
            <Mail className="h-4 w-4" /> Email
          </a>
        </div>
      )}
    </div>
  );
}
