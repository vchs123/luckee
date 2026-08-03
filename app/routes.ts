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

  // Auth
  route("login", "routes/login.tsx"),
  route("auth/callback", "routes/auth.callback.tsx"),
  route("profile/setup", "routes/profile.setup.tsx"),
  route("profile", "routes/profile.tsx"),
  route("r/:username", "routes/r.$username.tsx"),
  route("luckboard", "routes/luckboard.tsx"),

  // Admin
  layout("routes/admin-layout.tsx", [
    route("admin", "routes/admin.tsx"),
    route("admin/users", "routes/admin.users.tsx"),
    route("admin/users/:id", "routes/admin.users.$id.tsx"),
    route("admin/trivia", "routes/admin.trivia.tsx"),
    route("admin/trivia/new", "routes/admin.trivia.new.tsx"),
    route("admin/trivia/:id", "routes/admin.trivia.$id.tsx"),
    route("admin/proof", "routes/admin.proof.tsx"),
    route("admin/proof/:id", "routes/admin.proof.$id.tsx"),
  ]),

  // API
  route("api/logout", "routes/api.logout.tsx"),
  route("api/spin", "routes/api.spin.tsx"),
  route("api/trivia", "routes/api.trivia.tsx"),
  route("api/award-points", "routes/api.award-points.tsx"),
  route("api/proof", "routes/api.proof.tsx"),
  route("api/proof/upload-url", "routes/api.proof.upload-url.tsx"),
  route("api/track-click", "routes/api.track-click.tsx"),
  route("api/luckboard", "routes/api.luckboard.tsx"),

  route("sitemap.xml", "routes/sitemap.xml.tsx"),
  route("robots.txt", "routes/robots.txt.tsx"),
] satisfies RouteConfig;
