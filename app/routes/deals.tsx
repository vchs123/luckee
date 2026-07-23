import type { MetaFunction } from "react-router";
import { Nav } from "~/components/Nav";
import { Footer } from "~/components/Footer";
import { DealCard } from "~/components/DealCard";
import { DEALS } from "~/data/deals";

export const meta: MetaFunction = () => [
  { title: "Deals I Recommend — Referral Bonuses & Savings Apps | Luckee" },
  { name: "description", content: "Products Vanessa actually uses. Sign up via referral links to get a welcome bonus — Claude Pro, Blossom, Kris+ and Macadam." },
  { property: "og:title", content: "Deals | Luckee" },
  { tagName: "link", rel: "canonical", href: "https://luckee.com.au/deals" },
];

export default function Deals() {
  return (
    <>
      <Nav />
      <div className="wrap">
        <div className="sec-hd">
          <p className="eyebrow">💸 Referral deals</p>
          <h1 className="sec-h">Deals I recommend</h1>
          <p className="sec-p wide">Products I actually use. Sign up through my referral link and you'll usually get a welcome bonus — and so will I. Marked clearly where a referral code is involved.</p>
        </div>
        <div className="g4">
          {DEALS.map(d => <DealCard key={d.n} deal={d} />)}
        </div>
      </div>
      <Footer />
    </>
  );
}
