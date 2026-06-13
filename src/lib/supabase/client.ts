import { createBrowserClient } from "@supabase/ssr";
import { AUTH_COOKIE_OPTIONS } from "./cookie-options";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      // Persist the auth cookies past the browser/PWA process so a session
      // survives the app being closed and reopened (see cookie-options.ts).
      cookieOptions: AUTH_COOKIE_OPTIONS,
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    },
  );
}

/**
 * Best-effort browser client for optional, network-dependent features. Returns
 * the client cast to the caller's structural client type, or `null` if
 * construction throws (e.g. missing env) — so best-effort callers can simply
 * no-op when offline or signed out instead of crashing the render.
 */
export function createBrowserClientSafe<T>(): T | null {
  try {
    return createClient() as unknown as T;
  } catch {
    return null;
  }
}
