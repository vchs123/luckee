/** Deal drops: short admin posts about free deals and discounts (/drops). */

export const DROP_LIMITS = { title: 90, place: 60, saving: 30, body: 1500 } as const;

export const DROP_EMOJIS = ["🎁", "🍜", "☕", "🧋", "🍕", "🍩", "🍔", "🍦", "🥐", "💄", "🛍️", "🎟️", "🎓", "🎉"] as const;

export type DealDrop = {
  id: string;
  slug: string;
  title: string;
  place: string | null;
  saving: string | null;
  body: string | null;
  emoji: string;
  imageUrl: string | null;
  sourceUrl: string | null;
  /** Last day of the deal, "YYYY-MM-DD", if known. */
  endsOn: string | null;
  publishedAt: string;
  likes: number;
  /** This visitor has liked it. */
  liked: boolean;
};

/** "Ends 30 Oct", "Ends today", "Ended" — against the Melbourne date. */
export function endsLabel(endsOn: string | null, today: string): { text: string; ended: boolean } | null {
  if (!endsOn) return null;
  if (endsOn < today) return { text: "Ended", ended: true };
  if (endsOn === today) return { text: "Ends today", ended: false };
  const d = new Date(`${endsOn}T00:00:00Z`).toLocaleDateString("en-AU", { day: "numeric", month: "short", timeZone: "UTC" });
  return { text: `Ends ${d}`, ended: false };
}
