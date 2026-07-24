import { createRequestHandler, RouterContextProvider } from "react-router";

type PagesEnv = Env & { ASSETS: Fetcher };

class CloudflareContext extends RouterContextProvider {
  readonly cloudflare: { env: PagesEnv; ctx: ExecutionContext };
  constructor(env: PagesEnv, ctx: ExecutionContext) {
    super();
    this.cloudflare = { env, ctx };
  }
}

const requestHandler = createRequestHandler(
  () => import("virtual:react-router/server-build"),
  import.meta.env.MODE,
);

export default {
  async fetch(request: Request, env: PagesEnv, ctx: ExecutionContext) {
    if (env.ASSETS) {
      const assetResponse = await env.ASSETS.fetch(request.url);
      if (assetResponse.status !== 404) return assetResponse;
    }
    return requestHandler(request, new CloudflareContext(env, ctx));
  },
} satisfies ExportedHandler<PagesEnv>;
