import { useEffect, useRef } from "react";
import { Link, useLocation, useSearchParams } from "react-router";
import {
  BurgerSvg,
  BeautyCosmeticsSvg,
  LuckyGoldCoinSvg,
  BotanicLeafSvg,
  SparkleStarSvg,
} from "~/components/SvgIcons";
import { playTactileClick } from "~/lib/sound";
import { prefersReducedMotion } from "~/lib/reducedMotion";
import { BDAY_FOOD } from "~/data/birthday-food";
import { BDAY_BEAUTY } from "~/data/birthday-beauty";
import { SIGNUP_FREEBIES } from "~/data/sign-up-freebies";
import { MELB_TRANSPORT, MELB_CULTURE, MELB_CLASSES, MELB_OUTDOORS } from "~/data/free-melbourne";
import { EVENTS } from "~/data/events";

const BIRTHDAY = "/freebies/birthday-freebies";

/** Counts come from the data, so they can't drift the way hardcoded ones do. */
const TABS = [
  { path: BIRTHDAY, filter: "food", label: "Food & Drink", count: BDAY_FOOD.length, icon: <BurgerSvg size={15} /> },
  { path: BIRTHDAY, filter: "beauty", label: "Beauty & Retail", count: BDAY_BEAUTY.length, icon: <BeautyCosmeticsSvg size={15} /> },
  { path: "/freebies/sign-up-freebies", filter: null, label: "Sign-up bonuses", count: SIGNUP_FREEBIES.length, icon: <LuckyGoldCoinSvg size={15} /> },
  {
    path: "/freebies/free-melbourne",
    filter: null,
    label: "Free Melbourne",
    count: MELB_TRANSPORT.length + MELB_CULTURE.length + MELB_CLASSES.length + MELB_OUTDOORS.length,
    icon: <BotanicLeafSvg size={15} />,
  },
  { path: "/freebies/events-calendar", filter: null, label: "Events", count: EVENTS.length, icon: <SparkleStarSvg size={15} /> },
];

/**
 * Category switcher for the freebies section. Tabs are links, not state, so
 * every category keeps its own URL — Food and Beauty are two filtered views of
 * the birthday page, the rest are their own routes.
 */
export function FreebiesTabs() {
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const filter = searchParams.get("filter");
  const navRef = useRef<HTMLElement>(null);
  const activeRef = useRef<HTMLAnchorElement>(null);

  // On a narrow screen the current page's tab can sit off to the right, so
  // bring it into the strip. Scrolls the strip itself, never the page.
  useEffect(() => {
    const nav = navRef.current;
    const active = activeRef.current;
    if (!nav || !active) return;
    const offset = active.offsetLeft - (nav.clientWidth - active.clientWidth) / 2;
    nav.scrollTo({ left: Math.max(0, offset), behavior: prefersReducedMotion() ? "auto" : "smooth" });
  }, [pathname, filter]);

  return (
    <nav
      ref={navRef}
      aria-label="Freebie categories"
      className="flex items-center gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {TABS.map((tab) => {
        const onRoute = pathname === tab.path;
        // Exact match: this route, and this filter. On the birthday page with no
        // filter both categories are showing, so neither pill claims to be the
        // selected one — they're marked as belonging to the current page instead.
        const selected = onRoute && tab.filter === filter;
        const onPage = onRoute && !selected;

        return (
          <Link
            key={`${tab.path}${tab.filter ?? ""}`}
            ref={selected || (onPage && tab.filter === "food") ? activeRef : undefined}
            to={tab.filter ? `${tab.path}?filter=${tab.filter}` : tab.path}
            onClick={playTactileClick}
            aria-current={selected ? "page" : undefined}
            className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold transition-all sm:text-sm ${
              selected
                ? "bg-[var(--pink)] text-white shadow-xs"
                : onPage
                  ? "border border-[#e91e8c55] bg-[var(--pl)] text-[var(--pink)]"
                  : "border border-[#ec489922] bg-white text-[var(--t2)] hover:bg-[#fff0f8]"
            }`}
          >
            {tab.icon}
            <span>
              {tab.label} <span className="font-extrabold opacity-70">({tab.count})</span>
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
