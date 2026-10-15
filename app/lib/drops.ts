/** Deal drops: short admin posts about free deals and discounts (/drops). */

export const DROP_LIMITS = { title: 90, place: 60, saving: 30, body: 1500 } as const;

export const DROP_EMOJIS = ["🎁", "🍜", "☕", "🧋", "🍕", "🍩", "🍔", "🍦", "🥐", "💄", "🛍️", "🎟️", "🎓", "🎉"] as const;

/** What kind of deal it is. Stored as the key; shown as the label. */
export const DROP_CATEGORIES = [
  { key: "free", label: "Free", badge: "bg-emerald-400 text-black" },
  { key: "min_spend", label: "Min spend", badge: "bg-sky-300 text-black" },
  { key: "bogo", label: "Buy 1 get 1", badge: "bg-pink-300 text-black" },
  { key: "discount", label: "Discount", badge: "bg-[#ffcf00] text-black" },
] as const;
export type DropCategory = (typeof DROP_CATEGORIES)[number]["key"];
export const isDropCategory = (v: unknown): v is DropCategory => DROP_CATEGORIES.some((c) => c.key === v);
export const categoryOf = (key: string) => DROP_CATEGORIES.find((c) => c.key === key) ?? DROP_CATEGORIES[0];

export type DealDrop = {
  id: string;
  slug: string;
  title: string;
  category: DropCategory;
  place: string | null;
  saving: string | null;
  body: string | null;
  emoji: string;
  imageUrl: string | null;
  sourceUrl: string | null;
  /** First day, "YYYY-MM-DD". With no end date it's a one-day deal. */
  startsOn: string | null;
  /** Last day, "YYYY-MM-DD". */
  endsOn: string | null;
  allDay: boolean;
  /** "HH:MM" when not all day. */
  startTime: string | null;
  endTime: string | null;
  publishedAt: string;
  likes: number;
  /** This visitor has liked it. */
  liked: boolean;
};

/** "18 Oct", or "Sat 18 Oct" with the weekday (built by hand: en-AU puts a comma after it). */
const day = (d: string, weekday: boolean) => {
  const date = new Date(`${d}T00:00:00Z`);
  const dm = date.toLocaleDateString("en-AU", { day: "numeric", month: "short", timeZone: "UTC" });
  return weekday ? `${date.toLocaleDateString("en-AU", { weekday: "short", timeZone: "UTC" })} ${dm}` : dm;
};

/** "12pm", "12:30pm" from "HH:MM". */
export function fmtTime(t: string): string {
  const [h, m] = t.split(":").map(Number);
  const suffix = h < 12 ? "am" : "pm";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return m ? `${h12}:${String(m).padStart(2, "0")}${suffix}` : `${h12}${suffix}`;
}

/**
 * When a drop is on, in words, against Melbourne `now` ("YYYY-MM-DDTHH:MM"):
 * "Sat 18 Oct · 12pm–3pm", "18–20 Oct · All day", "Until 31 Oct",
 * "Today · 12pm–3pm". `ended` once the last day (and end time) has passed.
 */
export function whenLabel(
  d: Pick<DealDrop, "startsOn" | "endsOn" | "allDay" | "startTime" | "endTime">,
  now: string,
): { text: string; ended: boolean; live: boolean } | null {
  const today = now.slice(0, 10);
  const time = now.slice(11, 16);
  const first = d.startsOn ?? null;
  const last = d.endsOn ?? d.startsOn ?? null;
  const times = !d.allDay && d.startTime ? (d.endTime ? `${fmtTime(d.startTime)}–${fmtTime(d.endTime)}` : `from ${fmtTime(d.startTime)}`) : null;
  if (!first && !last) return times ? { text: times[0].toUpperCase() + times.slice(1), ended: false, live: false } : null;

  const ended = !!last && (last < today || (last === today && !d.allDay && !!d.endTime && d.endTime <= time));
  const live = !ended && (!first || first <= today) && (!last || last >= today);

  let dates: string;
  if (first && last && first !== last) {
    const sameMonth = first.slice(0, 7) === last.slice(0, 7);
    dates = sameMonth ? `${Number(first.slice(8))}–${day(last, false)}` : `${day(first, false)} – ${day(last, false)}`;
  } else if (first) {
    dates = first === today ? "Today" : day(first, true);
  } else {
    dates = last === today ? "Ends today" : `Until ${day(last!, false)}`;
  }
  const text = [dates, times ?? (first && d.allDay ? "All day" : null)].filter(Boolean).join(" · ");
  return { text, ended, live };
}

/** Ended drops stay in the public "Ended" section this long after their last day. */
export const ENDED_KEEP_DAYS = 60;

/** "YYYY-MM-DD" plus `n` days. */
export function addDays(date: string, n: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export type DropState = "upcoming" | "live" | "ended" | "archived";

/**
 * Where a drop belongs, against Melbourne `now`: on the main feed (upcoming or
 * live), in the "Ended" section, or archived (ended more than ENDED_KEEP_DAYS
 * ago: off the public site, still in admin). A drop with no dates never ends.
 */
export function dropState(
  d: Pick<DealDrop, "startsOn" | "endsOn" | "allDay" | "startTime" | "endTime">,
  now: string,
): DropState {
  const w = whenLabel(d, now);
  if (w?.ended) {
    const last = (d.endsOn ?? d.startsOn)!;
    return addDays(last, ENDED_KEEP_DAYS) < now.slice(0, 10) ? "archived" : "ended";
  }
  return w?.live || !(d.startsOn ?? d.endsOn) ? "live" : "upcoming";
}

/** The last day an ended drop shows publicly, "YYYY-MM-DD", or null if it never ends. */
export function endedVisibleUntil(d: Pick<DealDrop, "startsOn" | "endsOn">): string | null {
  const last = d.endsOn ?? d.startsOn;
  return last ? addDays(last, ENDED_KEEP_DAYS) : null;
}
