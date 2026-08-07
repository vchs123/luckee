import type { MetaFunction } from "react-router";
import { Link } from "react-router";
import { Nav } from "~/components/Nav";
import { Footer } from "~/components/Footer";

export const meta: MetaFunction = () => [
  { title: "About Luckee — Melbourne's Freebie Hub" },
  { name: "description", content: "Why Vanessa built Luckee — a single place for Melbourne locals to find what's free, discover deals worth signing up for, and meet people over a shared meal." },
  { property: "og:title", content: "About Luckee" },
];

export default function About() {
  return (
    <>
      <Nav />
      <div className="wrap">
        <div className="sec-hd">
          <p className="eyebrow">👋 The story</p>
          <h1 className="sec-h">About Luckee</h1>
        </div>
        <div className="about-grid">
          <div>
            <div className="about-card">
              <h4>Why I built this</h4>
              <p>Melbourne is one of the best cities in the world for freebies — free trams, free world-class galleries, birthday perks from dozens of brands. But finding them requires trawling Reddit, outdated blogs, and loyalty apps that don't talk to each other.</p>
              <p>Luckee is a single place where Melbourne locals can find what's free, discover deals worth signing up for, and meet other people over a shared meal — matched by language and interests, not an algorithm.</p>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div className="xc"><div className="xc-ico">📍</div><div><p className="xc-title">Based in Melbourne</p><p className="xc-desc">All freebies research is focused on Melbourne, with national deals flagged separately.</p></div></div>
            <div className="xc"><div className="xc-ico">🌏</div><div><p className="xc-title">Built for Melbourne's Chinese-speaking community</p><p className="xc-desc">Starting with Teochew and Mandarin-speaking locals. Language support expanding with the community.</p></div></div>
            <div className="xc"><div className="xc-ico">🔗</div><div><p className="xc-title">Transparent about affiliate links</p><p className="xc-desc">Deals earn a referral commission. Freebies content is independent — no brand pays to appear in the guide.</p></div></div>
          </div>
        </div>
        <div className="dv" />
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <Link to="/privacy" className="btn-ghost">Privacy Policy</Link>
          <Link to="/terms" className="btn-ghost">Terms & Conditions</Link>
          <Link to="/copyright" className="btn-ghost">Copyright Policy</Link>
          <Link to="/partner" className="btn-ghost">Partner With Us</Link>
        </div>
      </div>
      <Footer />
    </>
  );
}
