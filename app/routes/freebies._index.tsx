import type { MetaFunction } from "react-router";
import { Link } from "react-router";
import { BDAY_FOOD } from "~/data/birthday-food";
import { BDAY_BEAUTY } from "~/data/birthday-beauty";
import { SIGNUP_FREEBIES } from "~/data/sign-up-freebies";
import { MELB_TRANSPORT, MELB_CULTURE, MELB_CLASSES, MELB_OUTDOORS } from "~/data/free-melbourne";
import { EVENTS } from "~/data/events";

const verified = (items: { verified: boolean }[]) => items.filter(i => i.verified).length;
const MELB_COUNT = MELB_TRANSPORT.length + MELB_CULTURE.length + MELB_CLASSES.length + MELB_OUTDOORS.length;

export const meta: MetaFunction = () => [
  { title: "Freebies Melbourne — Birthday Perks, Sign-up Bonuses & Free Experiences | Luckee" },
  { name: "description", content: "Browse Melbourne freebies by category: birthday perks, one-time sign-up bonuses, free experiences and annual events — all verified by a local." },
  { property: "og:title", content: "Freebies Melbourne | Luckee" },
  { property: "og:description", content: "Birthday perks, sign-up bonuses, free galleries, events — all in one place." },
  { tagName: "link", rel: "canonical", href: "https://luckee-app.pages.dev/freebies" },
];

const HUBS = [
  { cls: "food", em: "🍔", name: "Birthday Food & Drink", count: `${BDAY_FOOD.length} offers · ${verified(BDAY_FOOD)} verified`, to: "/freebies/birthday-freebies?filter=food" },
  { cls: "bty",  em: "💄", name: "Birthday Beauty & Retail", count: `${BDAY_BEAUTY.length} offers · ${verified(BDAY_BEAUTY)} verified`, to: "/freebies/birthday-freebies?filter=beauty" },
  { cls: "sgn",  em: "🎁", name: "Sign-up Freebies", count: `${SIGNUP_FREEBIES.length} one-time bonuses`, to: "/freebies/sign-up-freebies" },
  { cls: "melb", em: "🌿", name: "Free Melbourne", count: `${MELB_COUNT} ongoing perks`, to: "/freebies/free-melbourne" },
  { cls: "evnt", em: "🎉", name: "Events Calendar", count: `${EVENTS.length} annual free events`, to: "/freebies/events-calendar" },
];

export default function FreebiesHub() {
  return (
    <div className="wrap">
      <div className="sec-hd">
        <p className="eyebrow">🎀 Browse by type</p>
        <h1 className="sec-h">Freebies</h1>
        <p className="sec-p">Birthday perks, one-time sign-up bonuses, free Melbourne experiences and upcoming events. Each offer is tagged <strong>✓ Verified by Luckee</strong> or flagged community-listed, and the list is regularly updated.</p>
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
