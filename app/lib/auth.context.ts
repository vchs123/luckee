import { createContext } from "react-router";
import type { User } from "@supabase/supabase-js";

/**
 * The signed-in user for the current request, resolved once by the root
 * middleware in `app/root.tsx`.
 *
 * Deliberately not in `auth.server.ts`: that module is server-only by filename
 * convention, and this context is just a token with no server dependencies.
 */
export const userContext = createContext<User | null>(null);
