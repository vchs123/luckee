"use client";
import { useState, useRef, useEffect } from "react";
import { Link, Form } from "react-router";
import { useAuth } from "~/hooks/useAuth";
import { prefersReducedMotion } from "~/lib/reducedMotion";

export function Nav() {
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const { user, profile, isAdmin } = useAuth();

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
      <nav className="nav" ref={navRef}>
        <div className="nav-i">
          <Link to="/" className="nav-logo">Luckee</Link>
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
        </div>
      </nav>
    </>
  );
}
