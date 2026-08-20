import type { MetaFunction } from "react-router";
import { Link, useNavigate } from "react-router";
import { useState, useEffect, useRef } from "react";
import { Nav } from "~/components/Nav";
import { Footer } from "~/components/Footer";
import { FreebieCard } from "~/components/FreebieCard";
import { ExperienceCard } from "~/components/ExperienceCard";
import { DealExplosion } from "~/components/DealExplosion";
import { Particles } from "~/components/Particles";
import { m } from "framer-motion";
import { BDAY_FOOD } from "~/data/birthday-food";
import { BDAY_BEAUTY } from "~/data/birthday-beauty";
import { MELB_TRANSPORT, MELB_CULTURE } from "~/data/free-melbourne";
import { prefersReducedMotion } from "~/lib/reducedMotion";
import { initScrollReveals } from "~/lib/scrollReveal";
import { fadeUp, staggerContainer } from "~/lib/motion";

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
  const heroRef = useRef<HTMLDivElement>(null);

  function handleSearchSubmit() {
    if (query.trim().length < 2) return;
    navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  }

  // Framer Motion scroll reveals for section headers (hero animates via variants below).
  useEffect(() => {
    if (prefersReducedMotion() || !heroRef.current) return;
    return initScrollReveals(heroRef.current);
  }, []);

  return (
    <>
      <Nav />
      <div ref={heroRef}>
        <div className="hero" style={{ position: "relative", overflow: "hidden" }}>
          <Particles />
          <m.div className="wrap" style={{ position: "relative", zIndex: 1 }}
            variants={staggerContainer(0.08)} initial="hidden" animate="show">
            <m.div className="hero-badge" variants={fadeUp}>✦ Melbourne's freebie hub</m.div>
            <m.h1 className="hero-h" variants={fadeUp}>Score Melbourne's best <span className="ac">freebies</span> every day</m.h1>
            <m.p className="hero-p" variants={fadeUp}>Birthday perks, loyalty sign-ups, free galleries and community dinners — curated for Melbourne locals.</m.p>
            <m.form className="search" variants={fadeUp} onSubmit={e => { e.preventDefault(); handleSearchSubmit(); }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="search"
                placeholder="Search freebies, deals, events..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSearchSubmit()}
              />
            </m.form>
            <m.div className="hcats" variants={fadeUp}>
              <Link to="/freebies/birthday-freebies" className="hcat">🎂 Birthday</Link>
              <Link to="/freebies/free-melbourne" className="hcat">🎨 Experiences</Link>
              <Link to="/freebies/birthday-freebies?filter=beauty" className="hcat">💄 Beauty</Link>
              <Link to="/freebies/birthday-freebies?filter=food" className="hcat">🍔 Food</Link>
              <Link to="/freebies/events-calendar" className="hcat">🎉 Events</Link>
              <Link to="/freebies/sign-up-freebies" className="hcat">💸 Sign-up bonuses</Link>
            </m.div>
          </m.div>
        </div>

        <div className="wrap center-sections">
          <div className="sec-hd">
            <p className="eyebrow">⭐ Top picks</p>
            <h2 className="sec-h">Today's best freebies</h2>
          </div>
          <p className="sec-p">Hand-checked favourites. Browse the full list — every offer is tagged <strong>✓ Verified by Luckee</strong> or flagged as community-listed so you know what's been confirmed.</p>
          <m.div className="g3" variants={staggerContainer(0.08)} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }}>
            {TOP_PICKS.map((f, i) => (
              <m.div key={f.n} variants={fadeUp} style={{ display: "grid" }}>
                <FreebieCard freebie={{ ...f, cat: i < 2 ? "food" : "bty" }} />
              </m.div>
            ))}
          </m.div>
          <div className="home-cta">
            <Link to="/freebies/birthday-freebies" className="btn-pink" style={{ display: "inline-block", marginTop: 20 }}>
              Browse all birthday freebies <span className="arrow">→</span>
            </Link>
          </div>

          <div className="dv" />

          <div className="sec-hd">
            <p className="eyebrow">🌿 No cost, ever</p>
            <h2 className="sec-h">Free in Melbourne right now</h2>
          </div>
          <p className="sec-p">World-class galleries, free trams, walking tours and workshops — your zero-dollar day out starts here.</p>
          <div className="g4">
            {MELB_SAMPLE.map(x => <ExperienceCard key={x.n} x={x} />)}
          </div>
          <div className="home-cta">
            <Link to="/freebies/free-melbourne" className="btn-pink" style={{ display: "inline-block", marginTop: 20 }}>
              Explore all free experiences <span className="arrow">→</span>
            </Link>
          </div>

          <div className="dv" />
        </div>

        <DealExplosion />

        <div className="wrap center-sections">
          <div className="dv" />

          <div className="tsr">
            <div className="tsr-txt">
              <h3>Community Dinners <span className="tsr-soon">(Coming Soon)</span></h3>
              <p>Language-matched community dinners with 2–6 new people. Non-profit, cost-neutral. Fill out a profile and I'll match you when the first tables open.</p>
            </div>
            <Link to="/dinners" className="tsr-cta">Join the waitlist →</Link>
          </div>

          <div className="dv" />

          <div className="sec-hd">
            <p className="eyebrow">🎰 Rewards</p>
            <h2 className="sec-h">Sign up. Play daily. Win real prizes.</h2>
          </div>
          <p className="sec-p">Create a free account and every login, spin, quiz and receipt earns points. Spend them on the gachapon machine for surprise food, drinks and prizes — collect a set and pick it up in Melbourne.</p>
          <div className="ecs">
            <div className="ec"><div className="ec-ico">🎡</div><h4>Daily spin</h4><p>One free spin every day on the prize wheel</p><span className="ec-pts">10–500 pts</span></div>
            <div className="ec"><div className="ec-ico">🧠</div><h4>Daily trivia</h4><p>Five quick questions, timed. Beat the clock</p><span className="ec-pts">Up to 25 pts</span></div>
            <div className="ec"><div className="ec-ico">🧾</div><h4>Upload receipts</h4><p>Snap a receipt to earn — with milestone bonuses</p><span className="ec-pts">5 pts each · +50 every 30</span></div>
            <div className="ec"><div className="ec-ico">🎰</div><h4>Play Gachapon</h4><p>Spend points on a capsule — food, drinks, boosters &amp; a rare grand prize</p><span className="ec-pts">150 pts = 1 pull</span></div>
          </div>
          <p className="sec-p" style={{ marginTop: 16 }}>Plus a daily login streak, trackable wishlist (Luckboard), and points for referring friends.</p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 12, justifyContent: "center" }}>
            <Link to="/login" className="btn-pink" style={{ display: "inline-block" }}>
              Sign up &amp; start earning <span className="arrow">→</span>
            </Link>
            <Link to="/rewards" className="btn-ghost" style={{ display: "inline-block" }}>
              How Rewards work →
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
