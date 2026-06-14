import { describe, expect, it } from "vitest";

import { createSession, createDefaultGameState } from "./session";
import {
  buildRetrievalQuery,
  toRetrievedLoreChunks,
  RETRIEVAL_QUERY_CHAR_CAP,
} from "./lore-retrieval";
import type { GameSession } from "./types";
import type { RetrievedChunk } from "@/lib/lore";
import { buildTurnRecord } from "@/lib/ai";
import type { AIResponse } from "@/lib/ai";

function sessionWith(overrides: Partial<GameSession["gameState"]> = {}): GameSession {
  const gameState = { ...createDefaultGameState(1, "c1", "Klein"), ...overrides };
  return createSession(gameState, "s1", 1000);
}

function withLastNarrative(session: GameSession, narrative: string): GameSession {
  const response = { narrative, choices: [] } as unknown as AIResponse;
  const turn = buildTurnRecord(session.turnCount, "did a thing", response);
  return {
    ...session,
    memory: { ...session.memory, immediateTurns: [turn] },
  };
}

describe("buildRetrievalQuery", () => {
  it("includes the location, quests, and present NPCs", () => {
    const session = sessionWith({
      location: "Backlund",
      activeQuests: ["Find the missing clerk"],
      npcsPresent: ["Old Neil"],
    });
    const query = buildRetrievalQuery(session);
    expect(query).toContain("Backlund");
    expect(query).toContain("Find the missing clerk");
    expect(query).toContain("Old Neil");
  });

  it("seeds from the opening beat on the very first turn (no history yet)", () => {
    const session = sessionWith({
      location: "Tingen City",
      openingBeat: "The potion still burns on my tongue.",
    });
    expect(buildRetrievalQuery(session)).toContain("The potion still burns");
  });

  it("prefers the most recent narrative beat once play has begun", () => {
    const base = sessionWith({ location: "Trier", openingBeat: "An opening beat." });
    const session = withLastNarrative(base, "A masked figure slips into the alley.");
    const query = buildRetrievalQuery(session);
    expect(query).toContain("A masked figure slips into the alley.");
    // Once there is history, the opening beat is no longer the query seed.
    expect(query).not.toContain("An opening beat.");
  });

  it("caps the query length", () => {
    const session = withLastNarrative(
      sessionWith({ location: "Tingen City" }),
      "fog ".repeat(1000),
    );
    expect(buildRetrievalQuery(session).length).toBeLessThanOrEqual(
      RETRIEVAL_QUERY_CHAR_CAP,
    );
  });
});

describe("toRetrievedLoreChunks", () => {
  it("narrows retrieval rows to the prompt-assembler slice", () => {
    const chunk = {
      id: "chunk-1",
      title: "The Fog",
      content: "Grey fog over the city.",
      source: "novel",
      token_count: 7,
      // retrieval-only fields that must be dropped:
      ref: { chapter: 1 },
      tags: ["novel"],
      canon_order: 1,
      arc_bucket: "clown",
      concealment_tier: 0,
      in_world_date: "1349",
      epoch: 5,
      fts_rank: 1,
      vec_rank: 1,
      rrf_score: 0.03,
    } as RetrievedChunk;
    expect(toRetrievedLoreChunks([chunk])).toEqual([
      {
        id: "chunk-1",
        title: "The Fog",
        content: "Grey fog over the city.",
        source: "novel",
        token_count: 7,
      },
    ]);
  });

  it("maps an empty list to an empty list", () => {
    expect(toRetrievedLoreChunks([])).toEqual([]);
  });
});
