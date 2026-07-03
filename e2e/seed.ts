import type { Page } from "@playwright/test";
import {
  serializeSession,
  ACTIVE_SESSION_KEY,
  SESSION_INDEX_KEY,
  SESSION_KEY_PREFIX,
  type GameSession,
} from "@/lib/game";

/**
 * Seed a saved character into localStorage before the app's scripts run, so an
 * authenticated-tier spec can exercise a game screen without any live AI call.
 *
 * Writes the session index, the serialized session, and the active-character
 * pointer (issue #196 — the shared fixture the specs previously inlined).
 * `extraKeys` lets a spec persist sibling state alongside the save (e.g. an
 * in-progress combat encounter under its `COMBAT_KEY_PREFIX` key).
 */
export async function seedActiveSession(
  page: Page,
  session: GameSession,
  extraKeys?: Record<string, string>,
): Promise<void> {
  const entries: [string, string][] = [
    [SESSION_INDEX_KEY, JSON.stringify([session.id])],
    [SESSION_KEY_PREFIX + session.id, serializeSession(session)],
    [ACTIVE_SESSION_KEY, session.id],
    ...Object.entries(extraKeys ?? {}),
  ];
  await page.addInitScript((seeded: [string, string][]) => {
    for (const [key, value] of seeded) localStorage.setItem(key, value);
  }, entries);
}
