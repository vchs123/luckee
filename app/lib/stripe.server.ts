import Stripe from "stripe";
import { env } from "cloudflare:workers";

export function getStripe() {
  const { STRIPE_SECRET_KEY } = env;
  if (!STRIPE_SECRET_KEY) throw new Error("Missing STRIPE_SECRET_KEY");
  return new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2026-06-24.dahlia" });
}
