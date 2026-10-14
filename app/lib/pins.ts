/** Community pins: limits shared by the corkboard form, /api/pins and admin. */

export const PIN_POINTS = 10; // paid when the admin approves a pin
export const PIN_MAX_PENDING = 3; // waiting for review at once, per member
export const PIN_MAX_PER_DAY = 5; // submissions in 24 hours, per member

export const PIN_LIMITS = { title: 80, spot: 60, savings: 30, notes: 400 } as const;

/** The only icons a pin can carry, so the board can't be filled with arbitrary text. */
export const PIN_EMOJIS = ["📌", "🍜", "☕", "🧋", "🍕", "🍩", "🍔", "🎓", "🛍️", "🎟️", "🍦", "🥐"] as const;

export type CommunityPin = {
  id: string;
  title: string;
  spot: string;
  savings: string | null;
  notes: string | null;
  emoji: string;
  username: string | null;
  createdAt: string;
};
