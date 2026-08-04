// Shared gachapon prize definitions — safe to import on both client and server.

export const PULL_COST = 150;

export type PrizeType =
  | "food"
  | "drink"
  | "points"
  | "double_points"
  | "bonus_ticket"
  | "better_luck"
  | "grand";

export interface PrizeMeta {
  icon: string;
  label: string;
  /** Colour used for the capsule + reveal card. */
  color: string;
  /** How many of this capsule are needed to redeem a physical prize (0 = instant, not collectible). */
  threshold: number;
}

export const PRIZES: Record<PrizeType, PrizeMeta> = {
  food:          { icon: "🍔", label: "Free food",          color: "#f97316", threshold: 5 },
  drink:         { icon: "🥤", label: "Free drink",         color: "#0d9488", threshold: 5 },
  points:        { icon: "⭐", label: "Bonus points",       color: "#fbbf24", threshold: 0 },
  double_points: { icon: "⚡", label: "Double-points day",  color: "#7c3aed", threshold: 0 },
  bonus_ticket:  { icon: "🎟️", label: "Free pull",          color: "#e91e8c", threshold: 0 },
  better_luck:   { icon: "😅", label: "Better luck next time", color: "#a08bb8", threshold: 0 },
  grand:         { icon: "🎁", label: "Grand prize",        color: "#dc2626", threshold: 1 },
};

/** Prize types that are collected toward a physical redemption. */
export const COLLECTIBLE_TYPES: PrizeType[] = ["food", "drink", "grand"];

// Weighted roll table — weights are percentages summing to 100.
export const PRIZE_WEIGHTS: { type: PrizeType; weight: number }[] = [
  { type: "food",          weight: 28 },
  { type: "drink",         weight: 28 },
  { type: "points",        weight: 25 },
  { type: "double_points", weight: 8 },
  { type: "bonus_ticket",  weight: 6 },
  { type: "better_luck",   weight: 4 },
  { type: "grand",         weight: 1 },
];
