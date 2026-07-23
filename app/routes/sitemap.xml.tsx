import type { LoaderFunctionArgs } from "react-router";

const STATIC_ROUTES = [
  { url: "/", priority: "1.0", changefreq: "daily" },
  { url: "/freebies", priority: "0.9", changefreq: "weekly" },
  { url: "/freebies/birthday-freebies", priority: "1.0", changefreq: "monthly" },
  { url: "/freebies/sign-up-freebies", priority: "0.8", changefreq: "monthly" },
  { url: "/freebies/free-melbourne", priority: "0.8", changefreq: "monthly" },
  { url: "/freebies/events-calendar", priority: "0.7", changefreq: "monthly" },
  { url: "/deals", priority: "0.8", changefreq: "weekly" },
  { url: "/dinners", priority: "0.8", changefreq: "weekly" },
  { url: "/rewards", priority: "0.6", changefreq: "monthly" },
  { url: "/about", priority: "0.5", changefreq: "monthly" },
  { url: "/blog", priority: "0.7", changefreq: "weekly" },
];

const BASE = "https://luckee.com.au";

export async function loader(_: LoaderFunctionArgs) {
  let blogRoutes: { url: string; priority: string; changefreq: string }[] = [];

  try {
    const { getSupabase } = await import("~/lib/supabase.server");
    const supabase = getSupabase();
    const { data } = await supabase
      .from("posts")
      .select("slug, published_at")
      .eq("published", true)
      .order("published_at", { ascending: false });

    if (data) {
      blogRoutes = data.map(p => ({
        url: `/blog/${p.slug}`,
        priority: "0.8",
        changefreq: "monthly",
      }));
    }
  } catch {
    // Supabase not configured yet — skip blog routes
  }

  const allRoutes = [...STATIC_ROUTES, ...blogRoutes];
  const today = new Date().toISOString().split("T")[0];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allRoutes.map(r => `  <url>
    <loc>${BASE}${r.url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`).join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
