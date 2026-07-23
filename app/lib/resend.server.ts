import { Resend } from "resend";

export function getResend(env: Env) {
  const { RESEND_API_KEY } = env;
  if (!RESEND_API_KEY) throw new Error("Missing RESEND_API_KEY");
  return new Resend(RESEND_API_KEY);
}
