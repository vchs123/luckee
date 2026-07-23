import type { MetaFunction } from "react-router";
import { Link, useNavigate } from "react-router";
import { useState } from "react";
import { Nav } from "~/components/Nav";
import { Footer } from "~/components/Footer";
import { FreebieCard } from "~/components/FreebieCard";
import { ExperienceCard } from "~/components/ExperienceCard";
import { DealCard } from "~/components/DealCard";
import { BDAY_FOOD } from "~/data/birthday-food";
import { BDAY_BEAUTY } from "~/data/birthday-beauty";
import { MELB_TRANSPORT, MELB_CULTURE } from "~/data/free-melbourne";
import { DEALS } from "~/data/deals";

export const meta: MetaFunction = () => [
  { title: "Luckee — Melbourne Freebies, Deals & Community Dinners" },
  { name: "description", content: "Melbourne's best birthday freebies, affiliate deals, free experiences and community dinners — curated and verified by a local." },
  { property: "og:title", content: "Luckee — Melbourne Freebies, Deals & Community Dinners" },
  { property: "og:description", content: "Birthday perks, loyalty sign-ups, free galleries and community dinners — curated for Melbourne locals." },
  { property: "og:type", content: "website" },
];

const TOP_PICKS = [BDAY_FOOD[0], BDAY_FOOD[1], BDAY_BEAUTY[0]];
const MELB_SAMPLE = [MELB_TRANSPORT[0], MELB_CULTURE[0], MELB_CULTURE[2], MELB_CULTURE[1]];

export default function Home() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  function handleSearch(q: string) {
    setQuery(q);
    if (q.length < 2) return;
    const lq = q.toLowerCase();
    const allFreebies = [...BDAY_FOOD, ...BDAY_BEAUTY];
    const match = allFreebies.find(f =>
      f.n.toLowerCase().includes(lq) ||
      f.r.toLowerCase().includes(lq) ||
      f.pg.toLowerCase().includes(lq)
    );
    if (match) {
      const filter = match.cat === "bty" ? "?filter=beauty" : "?filter=food";
      navigate(`/freebies/birthday-freebies${filter}`);
    }
  }

  return (
    <>
      <Nav />
      <div>
        <div className="hero">
          <div className="wrap">
            <div className="hero-badge">✦ Melbourne's freebie hub</div>
            <h1 className="hero-h">Score Melbourne's best <span className="ac">freebies</span> every day</h1>
            <p className="hero-p">Birthday perks, loyalty sign-ups, free galleries and community dinners — curated for Melbourne locals.</p>
            <div className="search">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="text"
                placeholder="Search freebies, deals, events..."
                value={query}
                onChange={e => handleSearch(e.target.value)}
              />
            </div>
            <div className="hcats">
              <Link to="/freebies/birthday-freebies" className="hcat">🎂 Birthday</Link>
              <Link to="/freebies/free-melbourne" className="hcat">🎨 Experiences</Link>
              <Link to="/freebies/birthday-freebies?filter=beauty" className="hcat">💄 Beauty</Link>
              <Link to="/freebies/birthday-freebies?filter=food" className="hcat">🍔 Food</Link>
              <Link to="/freebies/events-calendar" className="hcat">🎉 Events</Link>
              <Link to="/freebies/sign-up-freebies" className="hcat">💸 Sign-up bonuses</Link>
            </div>
          </div>
        </div>

        <div className="wrap">
          <div className="sec-hd">
            <p className="eyebrow">⭐ Top picks</p>
            <h2 className="sec-h">Today's best freebies</h2>
          </div>
          <div className="g3">
            {TOP_PICKS.map((f, i) => (
              <FreebieCard key={f.n} freebie={{ ...f, cat: i < 2 ? "food" : "bty" }} />
            ))}
          </div>

          <div className="dv" />

          <p className="eyebrow">🌿 No cost, ever</p>
          <h2 className="sec-h">Free in Melbourne right now</h2>
          <p className="sec-p">World-class galleries, free trams, walking tours and workshops — your zero-dollar day out starts here.</p>
          <div className="g4">
            {MELB_SAMPLE.map(x => <ExperienceCard key={x.n} x={x} />)}
          </div>
          <Link to="/freebies/free-melbourne" className="btn-pink" style={{ display: "inline-block", marginTop: 20 }}>
            Explore all free experiences →
          </Link>

          <div className="dv" />

          <p className="eyebrow">💸 Referral deals</p>
          <h2 className="sec-h">Deals I genuinely use</h2>
          <p className="sec-p">Products I recommend. Sign up through my links and you'll usually get a bonus — so do I.</p>
          <div className="g4">
            {DEALS.map(d => <DealCard key={d.n} deal={d} />)}
          </div>
          <Link to="/deals" className="btn-ghost" style={{ display: "inline-block", marginTop: 20 }}>
            See all deals →
          </Link>

          <div className="dv" />

          <div className="tsr">
            <div className="tsr-txt">
              <h3>Next Teochew table — Melbourne</h3>
              <p>Language-matched community dinners with 2–6 new people. Non-profit, cost-neutral. Fill out a profile and I'll match you.</p>
            </div>
            <Link to="/dinners" className="tsr-cta">Join the waitlist →</Link>
          </div>

          <div className="dv" />

          <p className="eyebrow">🎰 Rewards</p>
          <h2 className="sec-h">Earn points, win prizes</h2>
          <p className="sec-p">Every deal click, dinner and daily login earns points toward the monthly lucky draw.</p>
          <div className="ecs">
            <div className="ec"><div className="ec-ico">⭐</div><h4>Earn points</h4><p>Click deals, attend dinners, play trivia, log in daily</p><span className="ec-pts">Up to 200 pts per action</span></div>
            <div className="ec"><div className="ec-ico">🎡</div><h4>Spin to win</h4><p>One free spin per day. Bonus spins for deal sign-ups</p><span className="ec-pts">Coming with launch</span></div>
            <div className="ec"><div className="ec-ico">🎁</div><h4>Monthly draw</h4><p>100 points = 1 entry. Winner announced each month</p><span className="ec-pts">Sponsored prizes</span></div>
          </div>
          <Link to="/rewards" className="btn-ghost" style={{ display: "inline-block", marginTop: 20 }}>
            How Rewards work →
          </Link>
        </div>
      </div>
      <Footer />
    </>
  );
}
