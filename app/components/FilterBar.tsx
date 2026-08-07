"use client";
import { motion } from "framer-motion";

export type FilterType = "all" | "food" | "beauty" | "nospend";

interface Props {
  active: FilterType;
  onChange: (f: FilterType) => void;
}

export function FilterBar({ active, onChange }: Props) {
  const btn = (id: FilterType, label: string) => (
    <button
      key={id}
      className={`fb${active === id ? " on" : ""}`}
      onClick={() => onChange(id)}
      style={{ position: "relative", overflow: "hidden" }}
    >
      {active === id && (
        <motion.span
          layoutId="filter-pill-bg"
          className="filter-active-bg"
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 9999,
            background: "var(--pink)",
            zIndex: 0,
          }}
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
        />
      )}
      <span style={{ position: "relative", zIndex: 1 }}>{label}</span>
    </button>
  );
  return (
    <div className="fb-wrap">
      <span className="fb-lbl">Filter:</span>
      {btn("all", "All")}
      {btn("food", "🍔 Food & Drink")}
      {btn("beauty", "💄 Beauty & Retail")}
      {btn("nospend", "✓ No min spend only")}
    </div>
  );
}
