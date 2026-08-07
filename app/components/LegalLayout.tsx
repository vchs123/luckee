import type { ReactNode } from "react";
import { Link } from "react-router";
import { Nav } from "~/components/Nav";
import { Footer } from "~/components/Footer";

const LEGAL_LINKS = [
  { to: "/privacy", label: "Privacy Policy" },
  { to: "/terms", label: "Terms & Conditions" },
  { to: "/copyright", label: "Copyright Policy" },
  { to: "/partner", label: "Partner With Us" },
];

export function LegalLayout({
  eyebrow,
  title,
  updated,
  active,
  children,
}: {
  eyebrow: string;
  title: string;
  updated: string;
  active: string;
  children: ReactNode;
}) {
  return (
    <>
      <Nav />
      <div className="wrap legal">
        <div className="sec-hd">
          <p style={{ fontSize: 12, color: "var(--t3)", marginBottom: 8 }}>
            <Link to="/about" style={{ textDecoration: "underline" }}>About</Link> → {title}
          </p>
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="sec-h">{title}</h1>
          <p className="legal-updated">Last updated: {updated}</p>
        </div>

        <div className="legal-nav">
          {LEGAL_LINKS.map((l) => (
            <Link key={l.to} to={l.to} className={`legal-nav-link${l.to === active ? " on" : ""}`}>
              {l.label}
            </Link>
          ))}
        </div>

        <div className="legal-body">{children}</div>

        <p className="legal-disclaimer">
          This document is provided in good faith as general information and is not legal advice.
          Have a question? Email <a href="mailto:hello@luckee.com.au">hello@luckee.com.au</a>.
        </p>
      </div>
      <Footer />
    </>
  );
}
