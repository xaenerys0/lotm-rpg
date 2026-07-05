import { describe, expect, it } from "vitest";

import { buildEncounterFilter } from "./encounter-filter";
import { createDefaultGameState, createSession, seedArchetype } from "./session";
import { joinRoster } from "./tracked-npcs";
import { START_ARCHETYPES } from "@/lib/lore/start-archetypes";
import type { GameSession } from "./types";

function baseSession(): GameSession {
  return createSession(
    createDefaultGameState(1, "test-char-id", "Test Character", "A test background", 5),
  );
}

describe("buildEncounterFilter", () => {
  it("returns undefined when no gating state exists", () => {
    const session = baseSession();
    expect(buildEncounterFilter(session)).toBeUndefined();
  });

  it("sets currentChapter only for canon-character takeovers", () => {
    const session = {
      ...baseSession(),
      gameState: { ...baseSession().gameState, canonCharacterId: "klein-moretti" },
      canonPosition: 12,
    };
    const filter = buildEncounterFilter(session);
    expect(filter?.currentChapter).toBe(12);
  });

  it("omits currentChapter for non-canon characters", () => {
    const session = { ...baseSession(), canonPosition: 50 };
    const filter = buildEncounterFilter(session);
    expect(filter?.currentChapter).toBeUndefined();
  });

  it("derives playerFactions from GameState.factions", () => {
    const session = {
      ...baseSession(),
      gameState: { ...baseSession().gameState, factions: ["tarot-club"] },
    };
    const filter = buildEncounterFilter(session);
    expect(filter?.playerFactions).toEqual(["tarot-club"]);
  });

  it("maps societyState.kind to a canonical faction", () => {
    const archetype = START_ARCHETYPES.find((a) => a.id === "tingen-junior-nighthawk")!;
    let session = seedArchetype(baseSession(), archetype);
    const filter = buildEncounterFilter(session);
    expect(filter?.playerFactions).toContain("nighthawks");
  });

  it("merges GameState.factions and society-derived factions without duplicates", () => {
    const archetype = START_ARCHETYPES.find((a) => a.id === "tingen-junior-nighthawk")!;
    let session = seedArchetype(baseSession(), archetype);
    session = {
      ...session,
      gameState: { ...session.gameState, factions: ["nighthawks", "tarot-club"] },
    };
    const filter = buildEncounterFilter(session);
    expect([...(filter?.playerFactions ?? [])].sort()).toEqual([
      "nighthawks",
      "tarot-club",
    ]);
  });

  it("filters out non-canonical faction strings", () => {
    const session = {
      ...baseSession(),
      gameState: {
        ...baseSession().gameState,
        factions: ["tarot-club", "made-up-faction"],
      },
    };
    const filter = buildEncounterFilter(session);
    expect(filter?.playerFactions).toEqual(["tarot-club"]);
  });

  it("derives metNpcSlugs from the tracked-NPC roster", () => {
    let session = joinRoster(baseSession(), {
      name: "Roselle Gustav",
      disposition: "neutral",
      follows: false,
    });
    const filter = buildEncounterFilter(session);
    expect(filter?.metNpcSlugs).toContain("npc-roselle-gustav");
  });

  it("ignores tracked-NPC names that have no lore entry", () => {
    let session = joinRoster(baseSession(), {
      name: "Totally Unknown NPC",
      disposition: "neutral",
      follows: false,
    });
    const filter = buildEncounterFilter(session);
    expect(filter?.metNpcSlugs).toBeUndefined();
  });
});
