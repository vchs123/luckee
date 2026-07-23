import { createRequestHandler, RouterContextProvider } from "react-router";

class CloudflareContext extends RouterContextProvider {
  readonly cloudflare: { env: Env; ctx: ExecutionContext };
  constructor(env: Env, ctx: ExecutionContext) {
    super();
    this.cloudflare = { env, ctx };
  }
}

const requestHandler = createRequestHandler(
  () => import("virtual:react-router/server-build"),
  import.meta.env.MODE,
);

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    return requestHandler(request, new CloudflareContext(env, ctx));
  },
} satisfies ExportedHandler<Env>;
