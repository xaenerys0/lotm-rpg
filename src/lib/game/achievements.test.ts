import { describe, expect, it, vi } from "vitest";

import {
  divergenceScore,
  evaluateAchievements,
  getAchievement,
  legacyCount,
  showcaseStats,
  ACHIEVEMENTS,
} from "./achievements";
import { buildLegacy, serializeLegacies } from "./death";
import {
  fetchLeaderboard,
  publishShowcase,
  toShowcaseRow,
  type ShowcaseClient,
} from "./showcase-sync";
import { createDefaultGameState, createSession } from "./session";
import type { GameSession } from "./types";

function session(overrides: Partial<GameSession> = {}): GameSession {
  return {
    ...createSession(createDefaultGameState(1, "c1", "Klein"), "s1", 1000),
    ...overrides,
  };
}

describe("ACHIEVEMENTS", () => {
  it("has unique ids and named checks", () => {
    const ids = ACHIEVEMENTS.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const a of ACHIEVEMENTS) {
      expect(a.name.length).toBeGreaterThan(0);
      expect(a.description.length).toBeGreaterThan(10);
    }
    expect(getAchievement("first-sip")?.name).toBe("The First Sip");
    expect(getAchievement("nope")).toBeUndefined();
  });
});

describe("evaluateAchievements", () => {
  it("a fresh session has earned nothing", () => {
    expect(evaluateAchievements(session())).toEqual([]);
  });

  it("derives milestones only from data the session carries", () => {
    const s = session({ turnCount: 60 });
    s.gameState.sequenceLevel = 7;
    s.gameState.injuries = [
      { id: "i1", description: "A burned hand", severity: "minor", recoveryTurns: 2 },
    ];
    s.gameState.funds = 500;
    const earned = evaluateAchievements(s);
    for (const id of [
      "first-sip",
      "method-actor",
      "sequence-8",
      "sequence-7",
      "long-road",
      "scarred",
      "merchant",
    ]) {
      expect(earned).toContain(id);
    }
    expect(earned).not.toContain("sequence-5");
    expect(earned).not.toContain("the-end");
  });

  it("recognizes haunted timelines and ended chronicles", () => {
    const fallen = buildLegacy(session(), "fatal", 2000);
    const haunted = session();
    haunted.memory.sessionFacts.push({
      type: "event",
      description: fallen.epitaph,
      turnNumber: 0,
    });
    expect(evaluateAchievements(haunted)).toContain("haunted-timeline");

    const ended = session({
      ended: { fate: "dead", severity: "fatal", scene: "x", at: 1 },
    });
    expect(evaluateAchievements(ended)).toContain("the-end");
  });
});

describe("divergenceScore", () => {
  it("is 0-ish for a fresh canon-start session and capped at 100", () => {
    expect(divergenceScore(session())).toBe(0);
    const wild = session({
      turnCount: 200,
      ended: { fate: "dead", severity: "fatal", scene: "x", at: 1 },
      identityState: {
        identities: [
          {
            id: "i1",
            name: "Sherlock",
            appearance: "",
            socialClass: "middle",
            reputation: {},
            knownBy: [],
            activeDisguise: false,
            exposureRisk: 0,
            exposedTo: [],
            createdAt: 1,
          },
        ],
        activeIdentityId: null,
      },
    });
    wild.gameState.location = "Backlund";
    wild.memory.sessionFacts.push(
      { type: "event", description: "A lost control in Tingen", turnNumber: 0 },
      { type: "event", description: "their story is still whispered", turnNumber: 0 },
      { type: "event", description: "a quiet warning about powers", turnNumber: 0 },
      { type: "event", description: "their story is still whispered too", turnNumber: 0 },
    );
    expect(divergenceScore(wild)).toBe(100);
  });

  it("each signal moves the needle", () => {
    const travelled = session();
    travelled.gameState.location = "Backlund";
    expect(divergenceScore(travelled)).toBe(15);
    const turns = session({ turnCount: 20 });
    expect(divergenceScore(turns)).toBe(10);
  });
});

describe("showcaseStats / legacyCount", () => {
  it("derives public stats from the session", () => {
    const s = session({ turnCount: 12 });
    s.gameState.sequenceLevel = 8;
    s.gameState.funds = 90;
    s.memory.sessionFacts.push({
      type: "event",
      description: "Defeated the canal lurker",
      turnNumber: 3,
    });
    expect(showcaseStats(s)).toEqual({
      turns: 12,
      combatsWon: 1,
      potionsConsumed: 2,
      funds: 90,
    });
  });

  it("counts stored legacies and tolerates junk", () => {
    const legacies = [buildLegacy(session(), "fatal", 1)];
    expect(legacyCount(serializeLegacies(legacies))).toBe(1);
    expect(legacyCount(null)).toBe(0);
    expect(legacyCount("junk")).toBe(0);
  });
});

describe("showcase-sync", () => {
  const rows = [
    {
      user_id: "u1",
      display_name: "Klein",
      public: true,
      pathway_id: 1,
      sequence_level: 7,
      achievement_ids: ["a", "b"],
      divergence_score: 40,
      stats: { turns: 10, combatsWon: 1, potionsConsumed: 3, funds: 50 },
      updated_at: "2026-06-13T00:00:00Z",
    },
    {
      user_id: "u2",
      display_name: "Audrey",
      public: true,
      pathway_id: 2,
      sequence_level: 8,
      achievement_ids: ["a", "b", "c"],
      divergence_score: 70,
      stats: { turns: 5, combatsWon: 0, potionsConsumed: 2, funds: 10 },
      updated_at: "2026-06-13T00:00:00Z",
    },
  ];

  function makeClient(error: { message: string } | null = null) {
    const limit = vi.fn().mockResolvedValue({ data: rows, error });
    const eq = vi.fn().mockReturnValue({ limit });
    const select = vi.fn().mockReturnValue({ eq });
    const upsert = vi.fn().mockResolvedValue({ error });
    return { client: { from: vi.fn().mockReturnValue({ select, upsert }) }, eq, upsert };
  }

  it("builds and publishes the showcase row (upsert by user)", async () => {
    const s = session();
    const row = toShowcaseRow(s, {
      userId: "u1",
      displayName: "  ",
      isPublic: true,
      achievementIds: ["first-sip"],
      divergence: 12,
      stats: showcaseStats(s),
    });
    expect(row.display_name).toBe("A nameless Beyonder");
    expect(row.public).toBe(true);
    const { client, upsert } = makeClient();
    await publishShowcase(client as unknown as ShowcaseClient, row);
    expect(upsert).toHaveBeenCalledWith([row], { onConflict: "user_id" });
  });

  it("ranks by metric, filters by pathway, and only ever asks for public rows", async () => {
    const { client, eq } = makeClient();
    const bySeq = await fetchLeaderboard(client as unknown as ShowcaseClient, {
      metric: "sequence",
    });
    expect(eq).toHaveBeenCalledWith("public", true);
    expect(bySeq.map((e) => e.userId)).toEqual(["u1", "u2"]);

    const byAch = await fetchLeaderboard(client as unknown as ShowcaseClient, {
      metric: "achievements",
    });
    expect(byAch.map((e) => e.userId)).toEqual(["u2", "u1"]);

    const byDiv = await fetchLeaderboard(client as unknown as ShowcaseClient, {
      metric: "divergence",
      pathwayId: 1,
    });
    expect(byDiv.map((e) => e.userId)).toEqual(["u1"]);
  });

  it("surfaces failures", async () => {
    const failing = makeClient({ message: "down" });
    await expect(
      fetchLeaderboard(failing.client as unknown as ShowcaseClient, {
        metric: "sequence",
      }),
    ).rejects.toThrow(/board is unreadable/);
    await expect(
      publishShowcase(failing.client as unknown as ShowcaseClient, {
        user_id: "u1",
        pathway_id: 1,
        sequence_level: 9,
      }),
    ).rejects.toThrow(/Publishing your showcase failed/);
  });
});
