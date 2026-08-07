import { useState, useEffect } from "react";
import { useSearchParams, Link, useLoaderData } from "react-router";
import type { MetaFunction, LoaderFunctionArgs } from "react-router";
import { FreebieCard } from "~/components/FreebieCard";
import { FilterBar, type FilterType } from "~/components/FilterBar";
import { TipBox } from "~/components/TipBox";
import { BDAY_FOOD } from "~/data/birthday-food";
import { BDAY_BEAUTY } from "~/data/birthday-beauty";
import { verifyUser } from "~/lib/auth.server";
import { getSupabase } from "~/lib/supabase.server";

export async function loader({ request, context }: LoaderFunctionArgs) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const env = (context as any)?.cloudflare?.env as Env;
  const user = await verifyUser(request, env);
  if (!user) return { daysUntilBirthday: null, loggedIn: false, hasDob: false };
  const supabase = getSupabase(env);
  const { data: p } = await supabase.from("user_profiles").select("dob").eq("id", user.id).single();
  if (!p?.dob) return { daysUntilBirthday: null, loggedIn: true, hasDob: false };
  const now = new Date(new Date().toLocaleString("en-AU", { timeZone: "Australia/Melbourne" }));
  const birthMonth = new Date(p.dob + "T00:00:00").getMonth();
  const nextBday = new Date(now.getFullYear(), birthMonth, 1);
  if (nextBday <= now) nextBday.setFullYear(nextBday.getFullYear() + 1);
  const days = Math.ceil((nextBday.getTime() - now.getTime()) / 86400000);
  return { daysUntilBirthday: days < 365 ? days : null, loggedIn: true, hasDob: true };
}

export const meta: MetaFunction = () => [
  { title: "Birthday Freebies Melbourne 2026 — 15+ Verified Offers | Luckee" },
  { name: "description", content: "The complete guide to birthday freebies in Melbourne. 15+ verified offers across food, beauty and retail — with honest notes on minimum spend requirements." },
  { property: "og:title", content: "Birthday Freebies Melbourne 2026 | Luckee" },
  { property: "og:description", content: "15+ verified birthday freebies in Melbourne. Nando's, Krispy Kreme, Mecca, Sephora and more — updated July 2026." },
  { tagName: "link", rel: "canonical", href: "https://luckee-app.pages.dev/freebies/birthday-freebies" },
];

export default function BirthdayFreebies() {
  const { daysUntilBirthday, loggedIn, hasDob } = useLoaderData<typeof loader>();
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

  const [verifiedOnly, setVerifiedOnly] = useState(false);

  const showFood = filter === "all" || filter === "food" || filter === "nospend";
  const showBeauty = filter === "all" || filter === "beauty" || filter === "nospend";
  const applyFilters = (items: typeof BDAY_FOOD) => {
    let out = filter === "nospend" ? items.filter(f => f.ns) : items;
    if (verifiedOnly) out = out.filter(f => f.verified);
    return out;
  };
  const foodItems = applyFilters(BDAY_FOOD);
  const beautyItems = applyFilters(BDAY_BEAUTY);

  return (
    <div className="wrap">
      <div className="sec-hd">
        <p style={{ fontSize: 12, color: "var(--t3)", marginBottom: 8 }}>
          <Link to="/freebies" style={{ cursor: "pointer", textDecoration: "underline" }}>Freebies</Link> → Birthday Freebies
        </p>
        <p className="eyebrow">🎂 Birthday guide</p>
        <h1 className="sec-h">Birthday Freebies Melbourne</h1>
        <p className="sec-p wide">The complete guide across food, beauty and retail — with honest notes on which ones require a minimum spend. Offers we've personally confirmed are tagged <strong>✓ Verified by Luckee</strong>; the rest are community-listed and pending a check. Use the toggle to show verified only.</p>
      </div>

      <FilterBar active={filter} onChange={setFilter} />

      <div className="vtog-wrap">
        <span className="vtog-lbl">Show:</span>
        <button className={`vtog${!verifiedOnly ? " on" : ""}`} onClick={() => setVerifiedOnly(false)}>All</button>
        <button className={`vtog${verifiedOnly ? " on" : ""}`} onClick={() => setVerifiedOnly(true)}>✓ Verified by Luckee only</button>
      </div>

      {!loggedIn && (
        <TipBox icon="🎂">
          <strong>Get a birthday countdown.</strong> <Link to="/login" style={{ color: "var(--pink)", fontWeight: 700, textDecoration: "underline" }}>Create a free account</Link> and add your birthday to see exactly how many days until your birthday month — plus track which freebies you've claimed.
        </TipBox>
      )}
      {loggedIn && !hasDob && (
        <TipBox icon="🎂">
          <strong>Add your birthday</strong> in your <Link to="/profile" style={{ color: "var(--pink)", fontWeight: 700, textDecoration: "underline" }}>profile</Link> to unlock your personal countdown on every offer below.
        </TipBox>
      )}

      <TipBox icon="💡">
        Sign up 3–4 weeks before your birthday. Most programs email your voucher on the{" "}
        <strong>1st of your birthday month</strong>. Programs marked{" "}
        <strong style={{ color: "var(--warn)" }}>Min spend</strong> require a purchase to unlock the freebie.
      </TipBox>

      {showFood && foodItems.length > 0 && (
        <>
          <div className="ssh food">🍔 Food & Drink</div>
          <div className="ga">
            {foodItems.map(f => <FreebieCard key={f.n} freebie={f} daysUntilBirthday={daysUntilBirthday} />)}
          </div>
        </>
      )}

      {showBeauty && beautyItems.length > 0 && (
        <>
          <div className="ssh bty" style={{ marginTop: showFood && foodItems.length > 0 ? 40 : 0 }}>💄 Beauty & Retail</div>
          <div className="ga">
            {beautyItems.map(f => <FreebieCard key={f.n} freebie={f} daysUntilBirthday={daysUntilBirthday} />)}
          </div>
        </>
      )}

      <TipBox icon="⚠️" style={{ marginTop: 36 }}>
        <strong>Programs change:</strong> As of the 2025–26 relaunches, David Jones removed its $10 welcome voucher (Sept 2025), Mecca switched to product gifts instead of vouchers (Oct 2025), and Myer One was overhauled. Always verify on the brand's official app before relying on a specific value.
      </TipBox>
    </div>
  );
}
