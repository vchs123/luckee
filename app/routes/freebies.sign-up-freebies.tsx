import type { MetaFunction } from "react-router";
import { Link } from "react-router";
import { FreebieCard } from "~/components/FreebieCard";
import { SIGNUP_FREEBIES } from "~/data/sign-up-freebies";

export const meta: MetaFunction = () => [
  { title: "Sign-up Freebies Melbourne — One-Time Welcome Bonuses | Luckee" },
  { name: "description", content: "No birthday required. One-time sign-up bonuses from Melbourne loyalty programs worth joining: GYG, The Pass, Ferguson Plarre, Grill'd and Kathmandu." },
  { property: "og:title", content: "Sign-up Freebies Melbourne | Luckee" },
  { tagName: "link", rel: "canonical", href: "https://luckee-app.pages.dev/freebies/sign-up-freebies" },
];

export default function SignUpFreebies() {
  return (
    <div className="wrap">
      <div className="sec-hd">
        <p style={{ fontSize: 12, color: "var(--t3)", marginBottom: 8 }}>
          <Link to="/freebies" style={{ textDecoration: "underline" }}>Freebies</Link> → Sign-up Freebies
        </p>
        <p className="eyebrow">🎁 One-time bonuses</p>
        <h1 className="sec-h">Sign-up Freebies</h1>
        <p className="sec-p">Join once and get the bonus — no birthday required. These are one-time welcome perks from loyalty programs worth signing up for regardless.</p>
      </div>
      <div className="ga">
        {SIGNUP_FREEBIES.map(f => <FreebieCard key={f.n} freebie={f} />)}
      </div>
    </div>
  );
}
