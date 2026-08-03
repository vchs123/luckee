"use client";
import { useState, useRef, useEffect } from "react";
import { Link, useLocation, Form } from "react-router";
import { useAuth } from "~/hooks/useAuth";
import { prefersReducedMotion } from "~/lib/reducedMotion";

export function Nav() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const { pathname } = useLocation();
  const { user, profile, isAdmin } = useAuth();

  const isFreebies = ["/freebies", "/freebies/birthday-freebies", "/freebies/sign-up-freebies", "/freebies/free-melbourne", "/freebies/events-calendar"].some(p => pathname.startsWith(p));
  const nlCls = (path: string) => `nl${pathname === path || (path === "/freebies" && isFreebies) ? " on" : ""}`;

  useEffect(() => {
    if (!profileOpen) return;
    const handler = (e: MouseEvent) => {
      if (!profileRef.current?.contains(e.target as Node)) setProfileOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [profileOpen]);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const nav = navRef.current;
    if (!nav) return;
    const onScroll = () => {
      const progress = Math.min(window.scrollY / 200, 1);
      nav.style.backdropFilter = `blur(${8 + progress * 16}px)`;
      nav.style.background = `rgba(255,240,248,${0.7 + progress * 0.18})`;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <div className="disco">🔗 Some links on this site are affiliate links — I earn a small commission if you sign up, at no cost to you. All recommendations are genuine.</div>
      <nav className="nav" ref={navRef}>
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
            {isAdmin && <Link to="/admin" className={nlCls("/admin")} style={{ color: "var(--t3)", fontSize: 13 }}>Admin</Link>}
          </div>
          <div className="nav-r">
            {user ? (
              <div className="nav-user">
                {profile && <Link to="/rewards" className="nav-pts">{profile.totalPoints} pts</Link>}
                <div className="nd" ref={profileRef}>
                  <button className="nav-avatar" onClick={() => setProfileOpen(o => !o)}>
                    {(user.email?.[0] ?? "?").toUpperCase()}
                  </button>
                  {profileOpen && (
                    <div className="nd-m nd-m-right">
                      {isAdmin ? (
                        <Link to="/admin" onClick={() => setProfileOpen(false)}><span>⚙️</span> Admin dashboard</Link>
                      ) : (
                        <>
                          <Link to="/profile" onClick={() => setProfileOpen(false)}><span>👤</span> My profile</Link>
                          <Link to="/luckboard" onClick={() => setProfileOpen(false)}><span>⭐</span> Luckboard</Link>
                          <Link to="/rewards" onClick={() => setProfileOpen(false)}><span>🎡</span> Rewards</Link>
                        </>
                      )}
                      <Form method="post" action="/api/logout">
                        <button type="submit" onClick={() => setProfileOpen(false)}><span>🚪</span> Sign out</button>
                      </Form>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <Link to="/login" className="btn-pink">Sign in</Link>
            )}
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
        {user ? (
          <>
            {isAdmin ? (
              <Link to="/admin" onClick={() => setMobileOpen(false)}>Admin dashboard</Link>
            ) : (
              <>
                <Link to="/profile" onClick={() => setMobileOpen(false)}>My profile {profile ? `· ${profile.totalPoints} pts` : ""}</Link>
                <Link to="/luckboard" onClick={() => setMobileOpen(false)}>Luckboard</Link>
              </>
            )}
            <Form method="post" action="/api/logout">
              <button type="submit" className="ind"><span>🚪</span> Sign out</button>
            </Form>
          </>
        ) : (
          <Link to="/login" onClick={() => setMobileOpen(false)}>Sign in</Link>
        )}
      </div>
    </>
  );
}
