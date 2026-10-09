import type { Freebie } from "~/data/types";

export type CategoryFilter = "all" | "food" | "beauty";

export interface FreebieFilters {
  category: CategoryFilter;
  /** Only offers with no minimum spend. */
  nospend: boolean;
  /** Only offers we've confirmed ourselves. */
  verified: boolean;
  /** Free-text match on brand, program or reward. */
  q: string;
}

/**
 * Filters live in the URL so a filtered view can be shared, linked and
 * server-rendered. `?filter=nospend` is still honoured: it was the old way of
 * asking for no-minimum-spend offers, before it became a toggle that combines
 * with a category.
 */
export function readFreebieFilters(params: URLSearchParams): FreebieFilters {
  const filter = params.get("filter");
  return {
    category: filter === "food" ? "food" : filter === "beauty" ? "beauty" : "all",
    nospend: params.get("nospend") === "1" || filter === "nospend",
    verified: params.get("verified") === "1",
    q: params.get("q")?.trim() ?? "",
  };
}

export function applyFreebieFilters<T extends Freebie>(items: T[], f: FreebieFilters): T[] {
  const needle = f.q.toLowerCase();
  return items.filter((item) => {
    if (f.nospend && !item.ns) return false;
    if (f.verified && !item.verified) return false;
    if (!needle) return true;
    return (
      item.n.toLowerCase().includes(needle) ||
      item.pg.toLowerCase().includes(needle) ||
      item.r.toLowerCase().includes(needle)
    );
  });
}

/** True when anything is narrowing the list — drives the "clear" affordance. */
export function hasActiveFilters(f: FreebieFilters): boolean {
  return f.category !== "all" || f.nospend || f.verified || f.q !== "";
}
