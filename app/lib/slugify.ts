import type { Freebie } from "~/data/types";

/** A freebie's Luckboard key: its explicit id if it has one, else its name. */
export function freebieKey(f: Freebie): string {
  return f.id ?? slugify(f.n);
}

export function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
