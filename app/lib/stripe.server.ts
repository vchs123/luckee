import Stripe from "stripe";

interface Context {
  cloudflare: { env: { STRIPE_SECRET_KEY: string } };
}

export function getStripe(context: Context) {
  const key = context.cloudflare.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Missing STRIPE_SECRET_KEY");
  return new Stripe(key, { apiVersion: "2025-06-30.basil" });
}
