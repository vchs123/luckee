import { Resend } from "resend";

interface Context {
  cloudflare: { env: { RESEND_API_KEY: string } };
}

export function getResend(context: Context) {
  const apiKey = context.cloudflare.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("Missing RESEND_API_KEY");
  return new Resend(apiKey);
}
