import type { LoaderFunctionArgs } from "react-router";

// Well-known AI / search crawler tokens we explicitly welcome.
const AI_BOTS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "anthropic-ai",
  "Claude-User",
  "Google-Extended",
  "PerplexityBot",
  "CCBot",
  "Applebot",
  "Applebot-Extended",
  "Amazonbot",
  "Bytespider",
  "Meta-ExternalAgent",
  "cohere-ai",
];

export function loader({ request }: LoaderFunctionArgs) {
  const origin = new URL(request.url).origin;

  const explicit = AI_BOTS.map((bot) => `User-agent: ${bot}\nAllow: /\n`).join("\n");

  const body =
    `# All crawlers welcome\nUser-agent: *\nAllow: /\n\n` +
    `# Named AI & search bots (explicitly allowed)\n${explicit}\n` +
    `Sitemap: ${origin}/sitemap.xml\n`;

  return new Response(body, { headers: { "Content-Type": "text/plain" } });
}
