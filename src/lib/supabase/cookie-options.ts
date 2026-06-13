import type { CookieOptions } from "@supabase/ssr";

// Auth cookies must outlive the browser/PWA process so a session survives the
// app being closed and reopened. Without an explicit max-age, the auth cookies
// can be written as session cookies that the browser (and an installed PWA)
// discards on close — the player then appears logged out on next launch. We
// pin a long max-age (400 days, the browser-capped ceiling for cookie
// lifetime) so the refresh token persists; Supabase still rotates and expires
// the underlying JWT on its own schedule.
export const AUTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 400; // 400 days, in seconds

export const AUTH_COOKIE_OPTIONS: CookieOptions = {
  maxAge: AUTH_COOKIE_MAX_AGE,
};
