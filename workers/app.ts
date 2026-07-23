import { createRequestHandler } from "react-router";

const requestHandler = createRequestHandler(
  () => import("virtual:react-router/server-build"),
  import.meta.env.MODE,
);

export default {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    return requestHandler(request, { cloudflare: { env, ctx } } as any);
  },
} satisfies ExportedHandler<Env>;
