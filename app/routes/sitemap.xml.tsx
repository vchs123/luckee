import type { LoaderFunctionArgs } from "react-router";
import { dropState } from "~/lib/drops";
import { melbNow } from "~/lib/melbDate";

const STATIC_ROUTES = [
  { url: "/", priority: "1.0", changefreq: "daily" },
  { url: "/freebies", priority: "0.9", changefreq: "weekly" },
  { url: "/freebies/birthday-freebies", priority: "1.0", changefreq: "monthly" },
  { url: "/freebies/sign-up-freebies", priority: "0.8", changefreq: "monthly" },
  { url: "/freebies/free-melbourne", priority: "0.8", changefreq: "monthly" },
  { url: "/freebies/events-calendar", priority: "0.7", changefreq: "monthly" },
  { url: "/drops", priority: "0.8", changefreq: "daily" },
  { url: "/deals", priority: "0.8", changefreq: "weekly" },
  { url: "/dinners", priority: "0.8", changefreq: "weekly" },
  { url: "/rewards", priority: "0.6", changefreq: "monthly" },
  { url: "/about", priority: "0.5", changefreq: "monthly" },
  { url: "/blog", priority: "0.7", changefreq: "weekly" },
  { url: "/privacy", priority: "0.3", changefreq: "yearly" },
  { url: "/terms", priority: "0.3", changefreq: "yearly" },
  { url: "/copyright", priority: "0.3", changefreq: "yearly" },
  { url: "/partner", priority: "0.4", changefreq: "yearly" },
  { url: "/contact", priority: "0.4", changefreq: "yearly" },
];

export async function loader({ request, context }: LoaderFunctionArgs) {
  const BASE = new URL(request.url).origin;
  let blogRoutes: { url: string; priority: string; changefreq: string }[] = [];

  try {
    const { getSupabase } = await import("~/lib/supabase.server");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const env = (context as any)?.cloudflare?.env as Env;
    const supabase = getSupabase(env);
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

    const { data: drops } = await supabase
      .from("deal_drops")
      .select("*")
      .eq("published", true)
      .order("published_at", { ascending: false })
      .limit(500);
    if (drops) {
      // Archived drops (ended over 60 days ago) are off the site.
      const now = melbNow();
      const listed = drops.filter(
        (d) =>
          dropState(
            {
              startsOn: d.starts_on ?? null,
              endsOn: d.ends_on ?? null,
              allDay: d.all_day !== false,
              startTime: typeof d.start_time === "string" ? d.start_time.slice(0, 5) : null,
              endTime: typeof d.end_time === "string" ? d.end_time.slice(0, 5) : null,
            },
            now,
          ) !== "archived",
      );
      blogRoutes.push(...listed.map((d) => ({ url: `/drops/${d.slug}`, priority: "0.6", changefreq: "weekly" })));
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
