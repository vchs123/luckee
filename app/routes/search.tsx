import { useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router";
import type { MetaFunction } from "react-router";
import { Nav } from "~/components/Nav";
import { Footer } from "~/components/Footer";
import { FreebieCard } from "~/components/FreebieCard";
import { ExperienceCard } from "~/components/ExperienceCard";
import { BDAY_FOOD } from "~/data/birthday-food";
import { BDAY_BEAUTY } from "~/data/birthday-beauty";
import { SIGNUP_FREEBIES } from "~/data/sign-up-freebies";
import { MELB_TRANSPORT, MELB_CULTURE, MELB_CLASSES, MELB_OUTDOORS } from "~/data/free-melbourne";
import { DEALS } from "~/data/deals";
import type { Freebie, Experience, Deal } from "~/data/types";

export const meta: MetaFunction = () => [
  { title: "Search — Luckee" },
  { name: "robots", content: "noindex" },
];

const ALL_FREEBIES: Freebie[] = [...BDAY_FOOD, ...BDAY_BEAUTY, ...SIGNUP_FREEBIES];
const ALL_EXPERIENCES: Experience[] = [...MELB_TRANSPORT, ...MELB_CULTURE, ...MELB_CLASSES, ...MELB_OUTDOORS];

function matchFreebie(f: Freebie, q: string) {
  return [f.n, f.r, f.pg, f.m].some((s) => s?.toLowerCase().includes(q));
}
function matchExperience(x: Experience, q: string) {
  return [x.n, x.d, x.cat].some((s) => s?.toLowerCase().includes(q));
}
function matchDeal(d: Deal, q: string) {
  return [d.n, d.sub, d.desc, d.reward].some((s) => s?.toLowerCase().includes(q));
}

// A small "popular right now" fallback set.
const POPULAR_FREEBIES = [BDAY_FOOD[0], BDAY_FOOD[1], BDAY_BEAUTY[0]];

export default function Search() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const q = (searchParams.get("q") ?? "").trim();
  const lq = q.toLowerCase();
  const [input, setInput] = useState(q);

  const freebieHits = lq ? ALL_FREEBIES.filter((f) => matchFreebie(f, lq)) : [];
  const experienceHits = lq ? ALL_EXPERIENCES.filter((x) => matchExperience(x, lq)) : [];
  const dealHits = lq ? DEALS.filter((d) => matchDeal(d, lq)) : [];
  const total = freebieHits.length + experienceHits.length + dealHits.length;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim().length < 2) return;
    navigate(`/search?q=${encodeURIComponent(input.trim())}`);
  };

  return (
    <>
      <Nav />
      <div className="wrap search-page">
        <div className="sec-hd">
          <p className="eyebrow">🔍 Search</p>
          <h1 className="sec-h">{q ? `Results for “${q}”` : "Search Luckee"}</h1>
          {q && <p className="sec-p">{total} {total === 1 ? "match" : "matches"} across freebies, experiences and deals.</p>}
        </div>

        <form className="search search-page-bar" onSubmit={submit}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="search"
            placeholder="Search freebies, deals, experiences…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            autoFocus
          />
        </form>

        {!q && (
          <p className="search-hint">Type at least 2 characters and hit enter. Try “Nando’s”, “coffee”, “gallery” or “Revolut”.</p>
        )}

        {q && total === 0 && (
          <div className="search-empty">
            <div className="search-empty-icon">🤷</div>
            <p className="search-empty-title">No results for “{q}”</p>
            <p className="search-empty-sub">We couldn’t find a freebie, experience or deal matching that. It might not be on Luckee yet — or try a broader term.</p>
            <h2 className="ssh food" style={{ marginTop: 28 }}>✨ Popular right now</h2>
            <div className="ga">
              {POPULAR_FREEBIES.map((f) => <FreebieCard key={f.n} freebie={f} />)}
            </div>
            <div className="search-empty-links">
              <Link to="/freebies" className="btn-pink">Browse all freebies →</Link>
              <Link to="/deals" className="btn-ghost">See the deals →</Link>
            </div>
          </div>
        )}

        {q && total > 0 && (
          <>
            {freebieHits.length > 0 && (
              <>
                <div className="ssh food">🎁 Freebies <span className="ssh-count">{freebieHits.length}</span></div>
                <div className="ga">
                  {freebieHits.map((f) => <FreebieCard key={`f-${f.n}`} freebie={f} />)}
                </div>
              </>
            )}

            {experienceHits.length > 0 && (
              <>
                <div className="ssh melb" style={{ marginTop: freebieHits.length ? 40 : 0 }}>🌿 Free experiences <span className="ssh-count">{experienceHits.length}</span></div>
                <div className="g4">
                  {experienceHits.map((x) => <ExperienceCard key={`x-${x.n}`} x={x} />)}
                </div>
              </>
            )}

            {dealHits.length > 0 && (
              <>
                <div className="ssh bty" style={{ marginTop: (freebieHits.length || experienceHits.length) ? 40 : 0 }}>💸 Deals <span className="ssh-count">{dealHits.length}</span></div>
                <div className="search-deals">
                  {dealHits.map((d) => (
                    <Link key={`d-${d.cls}`} to={`/deals#${d.cls}`} className="search-deal">
                      <span className="search-deal-em">{d.e}</span>
                      <span className="search-deal-info">
                        <span className="search-deal-name">{d.n}</span>
                        <span className="search-deal-sub">{d.sub}</span>
                      </span>
                      <span className="search-deal-reward">{d.reward}</span>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
      <Footer />
    </>
  );
}
