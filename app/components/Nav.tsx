import { useState, useRef, useEffect, type ReactNode } from "react";
import { Link, Form, useLocation } from "react-router";
import { AnimatePresence, m } from "framer-motion";
import { LogOut, Search, Settings, Star, User, Volume2, VolumeX, X, Disc3 } from "lucide-react";
import { useAuth } from "~/hooks/useAuth";
import { prefersReducedMotion } from "~/lib/reducedMotion";
import { isSoundEnabled, playTactileClick, setSoundEnabled } from "~/lib/sound";
import { LuckeeMascot } from "~/components/LuckeeMascot";
import { LuckyGoldCoinSvg } from "~/components/SvgIcons";

/** Searches that return results from the site's own listings. */
const POPULAR = ["Birthday", "Krispy Kreme", "Nando's", "Free tram", "Gallery", "Coffee"];

const iconBtn =
  "flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-[#ec489933] bg-white/70 text-[#6b4d82] shadow-xs transition-colors hover:bg-white hover:text-[#e91e8c]";

/**
 * v2's header: a strip of what Luckee is, the mascot logo, and sound, search,
 * points and account controls. Search opens a drawer that submits to /search.
 */
export function Nav() {
  const { user, profile, isAdmin } = useAuth();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [sound, setSound] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // The preference lives in localStorage, so read it after hydration.
  useEffect(() => setSound(isSoundEnabled()), []);

  // Close the drawers on navigation.
  useEffect(() => {
    setSearchOpen(false);
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    if (!menuOpen && !searchOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        setSearchOpen(false);
      }
    };
    const onDown = (e: MouseEvent) => {
      if (menuOpen && !menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, [menuOpen, searchOpen]);

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

  const toggleSound = () => {
    const next = !sound;
    setSoundEnabled(next);
    setSound(next);
    if (next) playTactileClick();
  };

  return (
    <>
      {/* What Luckee is, in one line. It scrolls away; the bar below stays. */}
      <div className="overflow-hidden bg-[#1e0a2e] px-4 py-1.5 text-[11px] font-semibold tracking-wide text-[#ffe4f2]">
        <div className="mx-auto flex max-w-[1080px] items-center justify-start gap-2 overflow-x-auto whitespace-nowrap no-scrollbar sm:justify-center">
          <span className="rounded-full bg-[#e91e8c] px-2 text-[10px] font-extrabold uppercase tracking-wider text-white">
            Melbourne local
          </span>
          <span>Birthday freebies, sign-up perks &amp; deals</span>
          <span className="text-[#ec4899]" aria-hidden="true">•</span>
          <span>Daily spin, trivia &amp; a gachapon of free food</span>
        </div>
      </div>

      <nav className="nav" ref={navRef} aria-label="Site">
        <div className="mx-auto flex h-[60px] max-w-[1080px] items-center justify-between gap-3 px-4 sm:px-6">
          <Link to="/" className="group flex items-center gap-2" aria-label="Luckee home">
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[#ec489933] bg-white shadow-xs transition-transform group-hover:scale-105">
              <LuckeeMascot size="xs" pose="winking" interactive={false} />
            </span>
            <span className="font-fraunces text-2xl font-bold italic tracking-tight text-[#1e0a2e] transition-colors group-hover:text-[#e91e8c] md:text-[28px]">
              Luckee
            </span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-2.5">
            <button
              type="button"
              onClick={toggleSound}
              className={`${iconBtn} hidden sm:flex`}
              aria-pressed={sound}
              aria-label={sound ? "Turn sound effects off" : "Turn sound effects on"}
              title={sound ? "Sound on" : "Sound off"}
            >
              {sound ? <Volume2 className="h-4 w-4 text-[#e91e8c]" /> : <VolumeX className="h-4 w-4 text-neutral-400" />}
            </button>

            <button
              type="button"
              onClick={() => setSearchOpen((o) => !o)}
              aria-expanded={searchOpen}
              aria-controls="site-search"
              className={`flex h-9 cursor-pointer items-center gap-1.5 rounded-full border px-3 text-xs font-black shadow-xs transition-colors ${
                searchOpen
                  ? "border-[#e91e8c] bg-[#e91e8c] text-white"
                  : "border-[#ec489933] bg-white text-[#1e0a2e] hover:bg-[#fff0f8]"
              }`}
            >
              <Search className={`h-3.5 w-3.5 ${searchOpen ? "text-white" : "text-[#e91e8c]"}`} />
              <span className="hidden sm:inline">Search</span>
              <span className="sr-only sm:hidden">Search</span>
            </button>

            {user ? (
              <>
                {profile && !isAdmin && (
                  <Link
                    to="/rewards"
                    className="flex h-9 items-center gap-1.5 rounded-full border border-[#f59e0b44] bg-[#fef3c7] px-3 text-xs font-black text-[#92400e] shadow-xs transition-colors hover:bg-[#fde68a]"
                    title="Your points"
                  >
                    <LuckyGoldCoinSvg size={16} />
                    <span>{profile.totalPoints.toLocaleString("en-AU")}</span>
                    <span className="sr-only">points</span>
                  </Link>
                )}
                <div className="relative" ref={menuRef}>
                  <button
                    type="button"
                    onClick={() => setMenuOpen((o) => !o)}
                    aria-expanded={menuOpen}
                    aria-haspopup="menu"
                    aria-label="Account menu"
                    className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border-2 border-black bg-[#e91e8c] text-sm font-black text-white"
                  >
                    {(user.email?.[0] ?? "?").toUpperCase()}
                  </button>
                  {menuOpen && (
                    <div
                      role="menu"
                      className="absolute right-0 top-[calc(100%+8px)] z-[200] min-w-[210px] border-[3px] border-black bg-white p-1.5 shadow-hard-md"
                    >
                      {isAdmin ? (
                        <MenuLink to="/admin" icon={<Settings className="h-4 w-4" />} label="Admin dashboard" />
                      ) : (
                        <>
                          <MenuLink to="/profile" icon={<User className="h-4 w-4" />} label="My profile" />
                          <MenuLink to="/luckboard" icon={<Star className="h-4 w-4" />} label="Luckboard" />
                          <MenuLink to="/rewards" icon={<Disc3 className="h-4 w-4" />} label="Rewards" />
                        </>
                      )}
                      {/* No onClick that closes the menu here: the form lives inside the
                          menu, so closing it removes the form before the browser submits
                          it and the sign-out silently never happens. Signing out
                          navigates away, which closes the menu anyway. */}
                      <Form method="post" action="/api/logout">
                        <button
                          type="submit"
                          role="menuitem"
                          className="flex w-full cursor-pointer items-center gap-2.5 px-3 py-2 text-left text-sm font-bold text-[#1e0a2e] hover:bg-[#fff0f8] hover:text-[#e91e8c]"
                        >
                          <LogOut className="h-4 w-4" /> Sign out
                        </button>
                      </Form>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <Link
                to="/login"
                className="flex h-9 items-center border-2 border-black bg-[#e91e8c] px-4 text-xs font-black uppercase tracking-wider text-white shadow-hard-sm transition-transform hover:-translate-y-0.5"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>

        <AnimatePresence initial={false}>
          {searchOpen && (
            <m.div
              id="site-search"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="overflow-hidden border-t border-[#ec489926] bg-white/95 shadow-md"
            >
              <div className="mx-auto max-w-[720px] space-y-3 px-4 py-4">
                <Form action="/search" method="get" role="search" className="flex items-center gap-2">
                  <label className="flex flex-1 items-center rounded-2xl border-2 border-black bg-[#fff0f8] px-3.5 py-2 focus-within:ring-2 focus-within:ring-[#e91e8c]">
                    <Search className="mr-2 h-4 w-4 shrink-0 text-[#a08bb8]" aria-hidden="true" />
                    <span className="sr-only">Search Luckee</span>
                    <input
                      ref={searchRef}
                      type="search"
                      name="q"
                      placeholder="Search freebies, deals, places…"
                      className="w-full bg-transparent text-sm font-medium text-[#1e0a2e] placeholder-[#9c84b4] focus:outline-none"
                    />
                  </label>
                  <button
                    type="submit"
                    className="shrink-0 cursor-pointer border-2 border-black bg-black px-4 py-2.5 text-xs font-black uppercase tracking-wider text-white transition-transform active:scale-95 sm:px-6"
                  >
                    Search
                  </button>
                  <button
                    type="button"
                    onClick={() => setSearchOpen(false)}
                    className="cursor-pointer border-2 border-black bg-neutral-100 p-2 text-neutral-600 hover:bg-neutral-200 hover:text-black"
                    aria-label="Close search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </Form>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="mr-1 text-[10px] font-black uppercase tracking-wider text-[#6b4d82]">Popular:</span>
                  {POPULAR.map((q) => (
                    <Link
                      key={q}
                      to={`/search?q=${encodeURIComponent(q)}`}
                      className="rounded-full border border-[#ec489933] bg-[#fff0f8] px-2.5 py-1 text-[11px] font-bold text-[#1e0a2e] transition-colors hover:bg-[#ffe4f2] hover:text-[#e91e8c]"
                    >
                      {q}
                    </Link>
                  ))}
                </div>
              </div>
            </m.div>
          )}
        </AnimatePresence>
      </nav>
    </>
  );
}

function MenuLink({ to, icon, label }: { to: string; icon: ReactNode; label: string }) {
  return (
    <Link
      to={to}
      role="menuitem"
      className="flex items-center gap-2.5 px-3 py-2 text-sm font-bold text-[#1e0a2e] hover:bg-[#fff0f8] hover:text-[#e91e8c]"
    >
      {icon} {label}
    </Link>
  );
}
