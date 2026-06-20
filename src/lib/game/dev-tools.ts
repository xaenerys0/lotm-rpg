import type { GameState } from "@/lib/ai";
import { getSequence } from "@/lib/rules";

import { createDigestionState } from "./digestion";
import { createDefaultGameState, createSession } from "./session";
import type { GameSession } from "./types";

// ---------------------------------------------------------------------------
// Dev-only test affordances (scene-art / image-generation testing).
// ---------------------------------------------------------------------------
//
// Reaching the scene-art trigger moments organically (combat, sequence
// advancement, apotheosis, pillar ascension) takes a long playthrough — digest
// a potion through repeated in-character acting, gather/buy ingredients, perform
// rituals. To test image generation quickly we seed a premade character that is
// already one click away from the easiest trigger, and gate the whole affair
// behind an env flag so nothing reaches normal play.
//
// Pure functions only (engine layer / coverage mandate). The React surface — a
// dev-only dashboard button and the standalone art harness — lives in the
// components layer and consults `devToolsEnabled()`.

/** A real truthy value only — `undefined`/empty/`0`/`false`/`off` are OFF, so an
 * explicit disable can't be read as truthy (mirrors the RAG env-flag pattern). */
export function devToolsEnabled(): boolean {
  const raw = process.env.NEXT_PUBLIC_DEV_TOOLS;
  if (!raw) return false;
  const v = raw.trim().toLowerCase();
  return v !== "" && v !== "0" && v !== "false" && v !== "off";
}

/** Fixed id for the premade test character: re-seeding overwrites the same save
 * (idempotent) and the deletion UI recognises it to keep it from being wiped. */
export const TEST_CHARACTER_ID = "dev-test-character";

/** The premade test character is protected from the normal delete controls. */
export function isUndeletableCharacter(sessionId: string): boolean {
  return sessionId === TEST_CHARACTER_ID;
}

/** Default pathway for the test character (Pathway 1 — a fully-authored pathway). */
const TEST_PATHWAY_ID = 1;

/**
 * Build a premade test character poised to reach the scene-art triggers in a
 * click or two. It stands at Sequence 9 with its current potion fully digested
 * and the next potion's exact ingredients in hand, so the AdvancementPanel
 * unlocks immediately (Seq 9 → 8 needs no ritual or anchors) — one arm-confirm
 * produces an `advancement` consequences turn (the same `ENGINE_RESOLUTION`
 * path apotheosis and pillar ascension use). A deep wallet and the always-
 * available CombatLauncher cover the combat-resolution generation point too.
 *
 * Pure and keyed to a fixed id, so re-seeding is idempotent. The dev-only
 * dashboard button persists the returned session.
 */
export function createTestCharacter(
  pathwayId: number = TEST_PATHWAY_ID,
  now: number = Date.now(),
): GameSession {
  const base = createDefaultGameState(pathwayId, undefined, "Test Subject");
  // Advancement reads requirements from the TARGET sequence (one rung lower).
  const target = getSequence(pathwayId, 8);
  const gameState: GameState = {
    ...base,
    // sanity/maxSanity already 100 from createDefaultGameState.
    sequenceLevel: 9,
    funds: 100_000,
    // A fully-digested current potion unlocks the AdvancementPanel.
    digestion: { ...createDigestionState(pathwayId, 9), progress: 100, complete: true },
    // The next potion's prerequisites verbatim (category + name) satisfy the
    // ingredient gate via hasItemMatching.
    inventory: (target?.prerequisiteItems ?? []).map((item) => ({ ...item })),
  };
  return {
    ...createSession(gameState, TEST_CHARACTER_ID, now),
    // Reveal the digestion / acting-method UI so the seeded state shows fully.
    actingMethodState: { knowsMethod: true, alignedStreak: 0 },
  };
}
