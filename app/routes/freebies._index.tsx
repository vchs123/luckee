import type { MetaFunction } from "react-router";
import { Link } from "react-router";

export const meta: MetaFunction = () => [
  { title: "Freebies Melbourne — Birthday Perks, Sign-up Bonuses & Free Experiences | Luckee" },
  { name: "description", content: "Browse Melbourne freebies by category: birthday perks, one-time sign-up bonuses, free experiences and annual events — all verified by a local." },
  { property: "og:title", content: "Freebies Melbourne | Luckee" },
  { property: "og:description", content: "Birthday perks, sign-up bonuses, free galleries, events — all in one place." },
];

const HUBS = [
  { cls: "food", em: "🍔", name: "Birthday Food & Drink", count: "9 verified offers", to: "/freebies/birthday-freebies?filter=food" },
  { cls: "bty",  em: "💄", name: "Birthday Beauty & Retail", count: "6 verified offers", to: "/freebies/birthday-freebies?filter=beauty" },
  { cls: "sgn",  em: "🎁", name: "Sign-up Freebies", count: "One-time bonuses", to: "/freebies/sign-up-freebies" },
  { cls: "melb", em: "🌿", name: "Free Melbourne", count: "20+ ongoing perks", to: "/freebies/free-melbourne" },
  { cls: "evnt", em: "🎉", name: "Events Calendar", count: "Annual free events", to: "/freebies/events-calendar" },
];

export default function FreebiesHub() {
  return (
    <div className="wrap">
      <div className="sec-hd">
        <p className="eyebrow">🎀 Browse by type</p>
        <h1 className="sec-h">Freebies</h1>
        <p className="sec-p">Birthday perks, one-time sign-up bonuses, free Melbourne experiences and upcoming events — all verified and regularly updated.</p>
      </div>
      <div className="hub">
        {HUBS.map(h => (
          <Link key={h.name} to={h.to} className={`hc ${h.cls}`}>
            <div className="hc-em">{h.em}</div>
            <div className="hc-name">{h.name}</div>
            <div className="hc-count">{h.count}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
