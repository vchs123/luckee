import { Link, useLocation } from "react-router";

/** Page titles for the freebies section, keyed by path. */
export const FREEBIE_PAGE_TITLES: Record<string, string> = {
  "/freebies/birthday-freebies": "Birthday Freebies",
  "/freebies/sign-up-freebies": "Sign-up Freebies",
  "/freebies/free-melbourne": "Free Melbourne",
  "/freebies/events-calendar": "Events Calendar",
};

/**
 * "Freebies → Birthday Freebies" — rendered once by the freebies layout rather
 * than hand-written in each route.
 */
export function Breadcrumb() {
  const { pathname } = useLocation();
  const title = FREEBIE_PAGE_TITLES[pathname];
  if (!title) return null;

  return (
    <nav aria-label="Breadcrumb" className="mb-2 text-xs text-[var(--t3)]">
      <Link to="/freebies" className="underline">
        Freebies
      </Link>{" "}
      → <span aria-current="page">{title}</span>
    </nav>
  );
}
