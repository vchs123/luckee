"use client";
import { useState } from "react";
import { Link, useLocation } from "react-router";

export function Nav() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { pathname } = useLocation();

  const isFreebies = ["/freebies", "/freebies/birthday-freebies", "/freebies/sign-up-freebies", "/freebies/free-melbourne", "/freebies/events-calendar"].some(p => pathname.startsWith(p));

  const nlCls = (path: string) => `nl${pathname === path || (path === "/freebies" && isFreebies) ? " on" : ""}`;

  return (
    <>
      <div className="disco">🔗 Some links on this site are affiliate links — I earn a small commission if you sign up, at no cost to you. All recommendations are genuine.</div>
      <nav className="nav">
        <div className="nav-i">
          <Link to="/" className="nav-logo">Luckee</Link>
          <div className="nav-links">
            <div className="nd">
              <Link to="/freebies" className={nlCls("/freebies")}>Freebies ▾</Link>
              <div className="nd-m">
                <Link to="/freebies/birthday-freebies"><span>🎂</span> Birthday Freebies</Link>
                <Link to="/freebies/sign-up-freebies"><span>🎁</span> Sign-up Freebies</Link>
                <Link to="/freebies/free-melbourne"><span>🌿</span> Free Melbourne</Link>
                <Link to="/freebies/events-calendar"><span>🎉</span> Events Calendar</Link>
              </div>
            </div>
            <Link to="/deals" className={nlCls("/deals")}>Deals</Link>
            <Link to="/dinners" className={nlCls("/dinners")}>Dinners</Link>
            <Link to="/rewards" className={nlCls("/rewards")}>Rewards</Link>
            <Link to="/about" className={nlCls("/about")}>About</Link>
          </div>
          <div className="nav-r">
            <Link to="/dinners" className="btn-pink">Join free</Link>
          </div>
          <button className="hamburger" onClick={() => setMobileOpen(o => !o)} aria-label="Menu">
            {mobileOpen ? "✕" : "☰"}
          </button>
        </div>
      </nav>
      <div className={`mobile-nav${mobileOpen ? " open" : ""}`}>
        <Link to="/" onClick={() => setMobileOpen(false)}>Home</Link>
        <Link to="/freebies/birthday-freebies" className="ind" onClick={() => setMobileOpen(false)}>🎂 Birthday Freebies</Link>
        <Link to="/freebies/sign-up-freebies" className="ind" onClick={() => setMobileOpen(false)}>🎁 Sign-up Freebies</Link>
        <Link to="/freebies/free-melbourne" className="ind" onClick={() => setMobileOpen(false)}>🌿 Free Melbourne</Link>
        <Link to="/freebies/events-calendar" className="ind" onClick={() => setMobileOpen(false)}>🎉 Events Calendar</Link>
        <Link to="/deals" onClick={() => setMobileOpen(false)}>Deals</Link>
        <Link to="/dinners" onClick={() => setMobileOpen(false)}>Dinners</Link>
        <Link to="/rewards" onClick={() => setMobileOpen(false)}>Rewards</Link>
        <Link to="/about" onClick={() => setMobileOpen(false)}>About</Link>
      </div>
    </>
  );
}
