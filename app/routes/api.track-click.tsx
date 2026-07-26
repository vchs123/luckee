import type { ActionFunctionArgs } from "react-router";

export async function action({ request, context }: ActionFunctionArgs) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const env = (context as any)?.cloudflare?.env as Env;
  if (!env?.DISCORD_WEBHOOK_URL) return new Response("ok");

  let deal_name: string | undefined;
  try {
    const body = await request.json();
    deal_name = (body as any).deal_name;
  } catch {
    return new Response("ok");
  }

  if (!deal_name) return new Response("ok");

  try {
    await fetch(env.DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: `💳 **Referral click: ${deal_name}**` }),
    });
  } catch { /* non-fatal */ }

  return new Response("ok");
}
