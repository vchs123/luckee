import type { MetaFunction } from "react-router";
import { Nav } from "~/components/Nav";
import { Footer } from "~/components/Footer";
import { TipBox } from "~/components/TipBox";

export const meta: MetaFunction = () => [
  { title: "Rewards — Earn Points, Win Prizes | Luckee" },
  { name: "description", content: "Earn points by using Luckee. Every 100 points = 1 monthly lucky draw entry. Points ledger, spin wheel and daily trivia launching with the site." },
  { property: "og:title", content: "Rewards | Luckee" },
];

const POINTS = [
  ["Complete your profile", "100 pts"],
  ["Click an affiliate deal link", "10 pts"],
  ["Self-report a successful deal sign-up", "50 pts"],
  ["Daily login", "5 pts"],
  ["Win daily trivia (5 correct)", "25 pts"],
  ["Attend a community dinner", "150 pts"],
  ["Refer a friend (who creates an account)", "200 pts"],
  ["Daily spin (free, once per day)", "10–500 pts"],
];

export default function Rewards() {
  return (
    <>
      <Nav />
      <div className="wrap">
        <div className="sec-hd">
          <p className="eyebrow">⭐ Points & prizes</p>
          <h1 className="sec-h">Rewards</h1>
          <p className="sec-p">Earn points by using Luckee. Every 100 points = 1 monthly lucky draw entry. Prizes funded by sponsors and affiliate commissions.</p>
        </div>
        <h3 style={{ fontSize: 15, fontWeight: 800, color: "var(--t2)", marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.07em" }}>How to earn</h3>
        <table className="ptable">
          <thead><tr><th>Action</th><th>Points</th></tr></thead>
          <tbody>
            {POINTS.map(([action, pts]) => (
              <tr key={action}><td>{action}</td><td>{pts}</td></tr>
            ))}
          </tbody>
        </table>
        <TipBox icon="🎁">
          <strong>Monthly lucky draw:</strong> Every 100 points = 1 draw entry. Random winner selected each month end. Prize announced via email and Luckee's social channels. Prizes are real cash-value gifts from sponsors — typically AUD $30–$150.
        </TipBox>
        <div className="reward-cards">
          <div className="rc"><div className="rc-ico">⭐</div><h4>Points ledger</h4><p>A running log of every point you've earned, with the action and date</p><span className="rc-badge">Launching with site</span></div>
          <div className="rc"><div className="rc-ico">🎡</div><h4>Spin wheel</h4><p>1 free spin daily. Extra spins earned for each completed deal sign-up</p><span className="rc-badge">Launching with site</span></div>
          <div className="rc"><div className="rc-ico">🧠</div><h4>Daily trivia</h4><p>5 questions per day themed around money, travel and the products on Deals</p><span className="rc-badge">Launching with site</span></div>
        </div>
      </div>
      <Footer />
    </>
  );
}
