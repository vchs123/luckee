import { Link, useSearchParams } from "react-router";
import type { MetaFunction } from "react-router";
import { FreebieCard } from "~/components/FreebieCard";
import { FilterBar } from "~/components/FilterBar";
import { readFreebieFilters, applyFreebieFilters, hasActiveFilters } from "~/lib/freebieFilters";
import { SIGNUP_FREEBIES } from "~/data/sign-up-freebies";

export const meta: MetaFunction = () => [
  { title: "Sign-up Freebies Melbourne — One-Time Welcome Bonuses | Luckee" },
  { name: "description", content: "No birthday required. One-time sign-up bonuses from Melbourne loyalty programs worth joining: GYG, The Pass, Ferguson Plarre, Grill'd and Kathmandu." },
  { property: "og:title", content: "Sign-up Freebies Melbourne | Luckee" },
  { tagName: "link", rel: "canonical", href: "https://luckee-app.pages.dev/freebies/sign-up-freebies" },
];

export default function SignUpFreebies() {
  const [searchParams] = useSearchParams();
  const filters = readFreebieFilters(searchParams);
  const items = applyFreebieFilters(SIGNUP_FREEBIES, filters);

  return (
    <div className="wrap">
      <div className="sec-hd">
        <p className="eyebrow">🎁 One-time bonuses</p>
        <h1 className="sec-h">Sign-up Freebies</h1>
        <p className="sec-p">Join once and get the bonus — no birthday required. These are one-time welcome perks from loyalty programs worth signing up for regardless.</p>
      </div>
      <FilterBar categories={false} placeholder="Search sign-up bonuses…" />
      {items.length > 0 ? (
        <div className="ga">
          {items.map(f => <FreebieCard key={f.n} freebie={f} />)}
        </div>
      ) : (
        <p className="sec-p">
          No bonuses match those filters{filters.q ? ` and "${filters.q}"` : ""}.{" "}
          {hasActiveFilters(filters) && (
            <Link to="/freebies/sign-up-freebies" style={{ color: "var(--pink)", fontWeight: 700, textDecoration: "underline" }}>
              Clear them
            </Link>
          )}
        </p>
      )}
    </div>
  );
}
