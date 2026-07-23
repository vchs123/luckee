export function loader() {
  return new Response(
    `User-agent: *\nAllow: /\nSitemap: https://luckee.com.au/sitemap.xml\n`,
    { headers: { "Content-Type": "text/plain" } }
  );
}
