export function loader() {
  return new Response(
    `User-agent: *\nAllow: /\nSitemap: https://luckee-app.pages.dev/sitemap.xml\n`,
    { headers: { "Content-Type": "text/plain" } }
  );
}
