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
    const session = seedArchetype(baseSession(), archetype);
    const filter = buildEncounterFilter(session);
    expect(filter?.playerFactions).toContain("nighthawks");
  });

  it("derives City of Silver faction from durable Forsaken origin state", () => {
    const session: GameSession = {
      ...baseSession(),
      gameState: {
        ...baseSession().gameState,
        location: "Silver City",
        currentCity: "silver-city",
        accessFlags: ["dream-world-passage", "silver-city-passage"],
      },
    };
    const filter = buildEncounterFilter(session);
    expect(filter?.playerFactions).toContain("city-of-silver");
  });

  it("derives Moon City faction from durable Forsaken origin state", () => {
    const session: GameSession = {
      ...baseSession(),
      gameState: {
        ...baseSession().gameState,
        location: "Moon City",
        currentCity: "moon-city",
        accessFlags: ["dream-world-passage", "moon-city-passage"],
      },
    };
    const filter = buildEncounterFilter(session);
    expect(filter?.playerFactions).toContain("moon-city");
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

  it("enables rare encounters during an active advancement ritual", () => {
    const session: GameSession = {
      ...baseSession(),
      ritualState: {} as GameSession["ritualState"],
    };
    const filter = buildEncounterFilter(session);
    expect(filter?.includeRare).toBe(true);
  });

  it("enables rare encounters during an ascension rite", () => {
    const session: GameSession = {
      ...baseSession(),
      ascensionRite: {} as GameSession["ascensionRite"],
    };
    const filter = buildEncounterFilter(session);
    expect(filter?.includeRare).toBe(true);
  });

  it("enables rare encounters for advancement-scripted turns", () => {
    const session: GameSession = {
      ...baseSession(),
      pendingTurnKind: "advancement",
    };
    const filter = buildEncounterFilter(session);
    expect(filter?.includeRare).toBe(true);
  });

  it("derives metNpcSlugs from the tracked-NPC roster", () => {
    const session = joinRoster(baseSession(), {
      name: "Roselle Gustav",
      disposition: "neutral",
      follows: false,
    });
    const filter = buildEncounterFilter(session);
    expect(filter?.metNpcSlugs).toContain("npc-roselle-gustav");
  });

  it("ignores tracked-NPC names that have no lore entry", () => {
    const session = joinRoster(baseSession(), {
      name: "Totally Unknown NPC",
      disposition: "neutral",
      follows: false,
    });
    const filter = buildEncounterFilter(session);
    expect(filter?.metNpcSlugs).toBeUndefined();
  });
});
