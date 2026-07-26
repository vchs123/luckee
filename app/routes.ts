import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
  index("routes/_index.tsx"),
  layout("routes/freebies-layout.tsx", [
    route("freebies", "routes/freebies._index.tsx"),
    route("freebies/birthday-freebies", "routes/freebies.birthday-freebies.tsx"),
    route("freebies/sign-up-freebies", "routes/freebies.sign-up-freebies.tsx"),
    route("freebies/free-melbourne", "routes/freebies.free-melbourne.tsx"),
    route("freebies/events-calendar", "routes/freebies.events-calendar.tsx"),
  ]),
  route("deals", "routes/deals.tsx"),
  route("dinners", "routes/dinners.tsx"),
  route("rewards", "routes/rewards.tsx"),
  route("about", "routes/about.tsx"),
  route("blog", "routes/blog._index.tsx"),
  route("blog/:slug", "routes/blog.$slug.tsx"),
  route("api/track-click", "routes/api.track-click.tsx"),
  route("sitemap.xml", "routes/sitemap.xml.tsx"),
  route("robots.txt", "routes/robots.txt.tsx"),
] satisfies RouteConfig;
