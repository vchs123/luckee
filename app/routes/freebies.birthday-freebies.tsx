"use client";
import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router";
import type { MetaFunction } from "react-router";
import { FreebieCard } from "~/components/FreebieCard";
import { FilterBar, type FilterType } from "~/components/FilterBar";
import { TipBox } from "~/components/TipBox";
import { BDAY_FOOD } from "~/data/birthday-food";
import { BDAY_BEAUTY } from "~/data/birthday-beauty";

export const meta: MetaFunction = () => [
  { title: "Birthday Freebies Melbourne 2026 — 15+ Verified Offers | Luckee" },
  { name: "description", content: "The complete guide to birthday freebies in Melbourne. 15+ verified offers across food, beauty and retail — with honest notes on minimum spend requirements." },
  { property: "og:title", content: "Birthday Freebies Melbourne 2026 | Luckee" },
  { property: "og:description", content: "15+ verified birthday freebies in Melbourne. Nando's, Krispy Kreme, Mecca, Sephora and more — updated July 2026." },
  { tagName: "link", rel: "canonical", href: "https://luckee-app.pages.dev/freebies/birthday-freebies" },
];

export default function BirthdayFreebies() {
  const [searchParams] = useSearchParams();
  const paramFilter = searchParams.get("filter");
  const [filter, setFilter] = useState<FilterType>(
    paramFilter === "food" ? "food" : paramFilter === "beauty" ? "beauty" : "all"
  );

  useEffect(() => {
    if (paramFilter === "food") setFilter("food");
    else if (paramFilter === "beauty") setFilter("beauty");
    else if (paramFilter === "nospend") setFilter("nospend");
    else setFilter("all");
  }, [paramFilter]);

  const showFood = filter === "all" || filter === "food" || filter === "nospend";
  const showBeauty = filter === "all" || filter === "beauty" || filter === "nospend";
  const foodItems = filter === "nospend" ? BDAY_FOOD.filter(f => f.ns) : BDAY_FOOD;
  const beautyItems = filter === "nospend" ? BDAY_BEAUTY.filter(f => f.ns) : BDAY_BEAUTY;

  return (
    <div className="wrap">
      <div className="sec-hd">
        <p style={{ fontSize: 12, color: "var(--t3)", marginBottom: 8 }}>
          <Link to="/freebies" style={{ cursor: "pointer", textDecoration: "underline" }}>Freebies</Link> → Birthday Freebies
        </p>
        <p className="eyebrow">🎂 Birthday guide</p>
        <h1 className="sec-h">Birthday Freebies Melbourne</h1>
        <p className="sec-p wide">The complete guide, verified July 2026. 15+ offers across food, beauty and retail — with honest notes on which ones actually require a minimum spend.</p>
      </div>

      <FilterBar active={filter} onChange={setFilter} />

      <TipBox icon="💡">
        Sign up 3–4 weeks before your birthday. Most programs email your voucher on the{" "}
        <strong>1st of your birthday month</strong>. Programs marked{" "}
        <strong style={{ color: "var(--warn)" }}>Min spend</strong> require a purchase to unlock the freebie.
      </TipBox>

      {showFood && (
        <>
          <div className="ssh food">🍔 Food & Drink</div>
          <div className="ga">
            {foodItems.map(f => <FreebieCard key={f.n} freebie={f} />)}
          </div>
        </>
      )}

      {showBeauty && (
        <>
          <div className="ssh bty" style={{ marginTop: showFood ? 40 : 0 }}>💄 Beauty & Retail</div>
          <div className="ga">
            {beautyItems.map(f => <FreebieCard key={f.n} freebie={f} />)}
          </div>
        </>
      )}

      <TipBox icon="⚠️" style={{ marginTop: 36 }}>
        <strong>Programs change:</strong> As of the 2025–26 relaunches, David Jones removed its $10 welcome voucher (Sept 2025), Mecca switched to product gifts instead of vouchers (Oct 2025), and Myer One was overhauled. Always verify on the brand's official app before relying on a specific value.
      </TipBox>
    </div>
  );
}
