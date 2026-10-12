import { useRouteLoaderData } from "react-router";
import type { loader as rootLoader } from "~/root";

export function useAuth() {
  const data = useRouteLoaderData<typeof rootLoader>("root");
  return {
    user: data?.user ?? null,
    profile: data?.profile ?? null,
    // Decided on the server: comparing emails here would ship the admin
    // address to every visitor's browser.
    isAdmin: data?.isAdmin ?? false,
    luckboard: (data?.luckboard ?? {}) as Record<string, string>,
  };
}
