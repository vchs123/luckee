"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { m } from "framer-motion";
import { Check, Search, ShieldCheck, X } from "lucide-react";
import { readFreebieFilters, hasActiveFilters, type CategoryFilter } from "~/lib/freebieFilters";
import { playTactileClick } from "~/lib/sound";

interface Props {
  /** Category pills only make sense where a page holds more than one category. */
  categories?: boolean;
  placeholder?: string;
}

/**
 * The filter strip. Every control writes to the URL, so the filtered view is
 * shareable, survives a reload and is rendered on the server.
 */
export function FilterBar({ categories = true, placeholder = "Search brands (e.g. Nando's, Mecca, Boost)…" }: Props) {
  const [params, setParams] = useSearchParams();
  const f = readFreebieFilters(params);

  // The text box stays responsive while the URL catches up a beat later, so a
  // search doesn't push a history entry per keystroke.
  const [draft, setDraft] = useState(f.q);
  useEffect(() => setDraft(f.q), [f.q]);
  useEffect(() => {
    if (draft === f.q) return;
    const id = setTimeout(() => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (draft.trim()) next.set("q", draft.trim());
          else next.delete("q");
          return next;
        },
        { replace: true, preventScrollReset: true },
      );
    }, 300);
    return () => clearTimeout(id);
  }, [draft, f.q, setParams]);

  /** Write one param, dropping it entirely when it returns to its default. */
  function update(key: string, value: string | null) {
    playTactileClick();
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value === null) next.delete(key);
        else next.set(key, value);
        // `filter=nospend` is the legacy spelling; never write it back.
        if (key === "nospend" && next.get("filter") === "nospend") next.delete("filter");
        return next;
      },
      { preventScrollReset: true },
    );
  }

  const pill = (id: CategoryFilter, label: string) => (
    <button
      key={id}
      type="button"
      className={`fb${f.category === id ? " on" : ""}`}
      onClick={() => update("filter", id === "all" ? null : id)}
      style={{ position: "relative", overflow: "hidden" }}
      aria-pressed={f.category === id}
    >
      {f.category === id && (
        <m.span
          layoutId="filter-pill-bg"
          className="filter-active-bg"
          style={{ position: "absolute", inset: 0, borderRadius: 9999, background: "var(--pink)", zIndex: 0 }}
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
        />
      )}
      <span style={{ position: "relative", zIndex: 1 }}>{label}</span>
    </button>
  );

  const toggle = (active: boolean, onClick: () => void, icon: React.ReactNode, label: string, tone: string) => (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition-colors ${
        active ? tone : "border-neutral-200 bg-neutral-50 text-neutral-600 hover:bg-neutral-100"
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );

  return (
    <div className="mb-6">
      {categories && (
        <div className="fb-wrap">
          <span className="fb-lbl">Filter:</span>
          {pill("all", "All")}
          {pill("food", "🍔 Food & Drink")}
          {pill("beauty", "💄 Beauty & Retail")}
        </div>
      )}

      <div className="mt-3 flex flex-col items-stretch gap-3 rounded-2xl border border-[#ec489922] bg-white p-3 shadow-xs sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--t3)]" />
          <input
            type="search"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={placeholder}
            aria-label="Search this page"
            className="w-full rounded-xl border border-neutral-200 py-2 pl-10 pr-4 text-sm focus:border-[var(--pink)] focus:outline-none"
          />
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {toggle(
            f.nospend,
            () => update("nospend", f.nospend ? null : "1"),
            <Check className="h-3 w-3" />,
            "No min spend",
            "border-[#059669] bg-[#059669] text-white",
          )}
          {toggle(
            f.verified,
            () => update("verified", f.verified ? null : "1"),
            <ShieldCheck className="h-3 w-3" />,
            "Verified by Luckee",
            "border-[var(--pink)] bg-[var(--pink)] text-white",
          )}
          {hasActiveFilters(f) && (
            <button
              type="button"
              onClick={() => {
                playTactileClick();
                setParams(new URLSearchParams(), { preventScrollReset: true });
              }}
              className="flex shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-bold text-[var(--t2)] underline transition-colors hover:text-[var(--pink)]"
            >
              <X className="h-3 w-3" />
              Clear
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
