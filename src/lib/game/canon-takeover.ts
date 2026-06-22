import type { GameState, MemoryState } from "@/lib/ai";
import { addSessionFact } from "@/lib/ai";
import {
  getCanonCharacter,
  normalizeCanonName,
  type CanonCharacterPreset,
} from "@/lib/lore/canon-characters";
import type { StartScenario } from "@/lib/lore/start-scenarios";
import { createDigestionState } from "./digestion";
import {
  createDefaultGameState,
  createSession,
  type CreateSessionOptions,
} from "./session";
import { cityIdFromLocation } from "./travel";
import type { GameSession } from "./types";

// Canon-character takeover seeding (issue #92).
//
// Turns a matched `CanonCharacterPreset` into a fully seeded `GameSession` by
// COMPOSING the existing `createDefaultGameState`/`createSession` rather than
// duplicating them — then overriding the canon-specific fields the generic
// builders hardcode (sequence 9 / epoch-default location / chapter-1 timeline).
//
// Durability (issue #92's core insight): the character's identity and
// relationships live in the never-trimmed `characterBackground` (and the
// `prologueRecap` "how you arrive" bridge), NOT in trimmable session facts — so
// the narrator never loses the canon character's family/identity over a long
// chronicle. `earlySalienceFacts` are seeded as ordinary session facts for
// turn-0 immediacy only and are allowed to age out.

/**
 * Build a seeded session for a taken-over canon character. Honors a chosen
 * `startScenario` location when one is passed (so a compatible explicit start
 * is respected); otherwise the canon `startLocation` is used. Pure: returns a
 * NEW `GameSession`.
 */
export function createCanonCharacterSession(
  preset: CanonCharacterPreset,
  initialMemory: MemoryState,
  startScenario?: StartScenario,
  options: CreateSessionOptions = {},
): GameSession {
  // `background` (who they are / relationships) and `openingRecap` (the "how you
  // arrive at the story's start" bridge) are DISTINCT durable slots — never the
  // same string duplicated into both.
  const base = createDefaultGameState(
    preset.pathwayId,
    undefined,
    preset.displayName,
    preset.background,
    preset.epoch,
    preset.openingRecap,
    startScenario,
  );

  // Honor an explicit scenario location when given; else the canon start place.
  const location = startScenario ? base.location : preset.startLocation;
  const currentCity = cityIdFromLocation(location);

  const gameState: GameState = {
    ...base,
    sequenceLevel: preset.startSequence,
    location,
    ...(currentCity ? { currentCity } : {}),
    // A figure who BEGINS in an access-gated continent (e.g. Derrick Berg in the
    // City of Silver) holds their capability flags from the start, so the map +
    // travel gates treat their home as reachable. Absent for a mainland start.
    ...(preset.accessFlags ? { accessFlags: preset.accessFlags } : {}),
    // Re-seed digestion for the canon START sequence (the generic builder seeds
    // it for Seq 9; a non-9 canon start — Dunn/Daly at Seq 7 — needs the match).
    digestion: createDigestionState(preset.pathwayId, preset.startSequence),
    canonCharacterId: preset.id,
  };

  // Turn-0 salience only — allowed to age out, NOT the durable home for the
  // relationships (those live in `characterBackground`, set above).
  let memory = initialMemory;
  for (const description of preset.earlySalienceFacts ?? []) {
    memory = addSessionFact(memory, { type: "event", description, turnNumber: 0 });
  }

  // Seed the timeline gate at the character's introduction chapter (issue #63);
  // accept the full options so a future creation-time model pick threads through
  // (defaults are correct today).
  return createSession(gameState, undefined, undefined, memory, {
    ...options,
    canonPosition: preset.canonPosition,
  });
}

/**
 * Remove the player's OWN canon identity (the preset's display name + aliases,
 * normalized) from a narrator `npcsPresent` list, so the doppelganger can never
 * be added as a separate present NPC while the player IS that character. A
 * no-op when `canonCharacterId` is absent or unknown. Genuine other NPCs (and
 * the player's followers) pass through untouched. Pure.
 */
export function stripSelfFromNpcs(
  npcs: string[],
  canonCharacterId: string | undefined,
): string[] {
  if (!canonCharacterId) return npcs;
  const preset = getCanonCharacter(canonCharacterId);
  if (!preset) return npcs;
  const selfNames = new Set(
    [preset.displayName, ...preset.aliases].map(normalizeCanonName),
  );
  return npcs.filter((name) => !selfNames.has(normalizeCanonName(name)));
}
