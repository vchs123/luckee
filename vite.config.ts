import { reactRouter } from "@react-router/dev/vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig(({ command }) => ({
  plugins: [
    cloudflare({
      viteEnvironment: { name: "ssr" },
      // Dev needs a config with "main" so the plugin can run the SSR worker; the
      // Pages config can't have one. See wrangler.dev.jsonc. Build is left alone
      // so `npm run build` and `wrangler pages deploy` behave exactly as before.
      ...(command === "serve" ? { configPath: "./wrangler.dev.jsonc" } : {}),
    }),
    tailwindcss(),
    reactRouter(),
  ],
  resolve: {
    tsconfigPaths: true,
  },
}));
