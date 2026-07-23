"use client";

export type FilterType = "all" | "food" | "beauty" | "nospend";

interface Props {
  active: FilterType;
  onChange: (f: FilterType) => void;
}

export function FilterBar({ active, onChange }: Props) {
  const btn = (id: FilterType, label: string) => (
    <button className={`fb${active === id ? " on" : ""}`} onClick={() => onChange(id)}>
      {label}
    </button>
  );
  return (
    <div className="fb-wrap">
      <span className="fb-lbl">Filter:</span>
      {btn("all", "All (15+)")}
      {btn("food", "🍔 Food & Drink")}
      {btn("beauty", "💄 Beauty & Retail")}
      {btn("nospend", "✓ No min spend only")}
    </div>
  );
}
