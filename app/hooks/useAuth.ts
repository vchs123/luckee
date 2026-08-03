import { useRouteLoaderData } from "react-router";
import type { loader as rootLoader } from "~/root";

export function useAuth() {
  const data = useRouteLoaderData<typeof rootLoader>("root");
  return {
    user: data?.user ?? null,
    profile: data?.profile ?? null,
    isAdmin: data?.user?.email === "luckee.app@gmail.com",
    luckboard: (data?.luckboard ?? {}) as Record<string, string>,
  };
}
