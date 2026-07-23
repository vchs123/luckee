import { Resend } from "resend";
import { env } from "cloudflare:workers";

export function getResend() {
  const { RESEND_API_KEY } = env;
  if (!RESEND_API_KEY) throw new Error("Missing RESEND_API_KEY");
  return new Resend(RESEND_API_KEY);
}
