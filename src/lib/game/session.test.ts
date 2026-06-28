import { describe, expect, it } from "vitest";

import {
  createDefaultGameState,
  createSession,
  isValidSessionShape,
  seedArchetype,
  serializeSession,
  deserializeSession,
} from "./session";
import { getStartArchetype, getStartScenario, type StartArchetype } from "@/lib/lore";

// ─── createDefaultGameState — start archetypes (issue #131) ─────────────

describe("createDefaultGameState — start archetypes", () => {
  it("a plain location start is unchanged (no archetype)", () => {
    const gs = createDefaultGameState(1, "c1", "Hero", "My own story", 5);
    expect(gs.characterBackground).toBe("My own story");
    expect(gs.accessFlags).toBeUndefined();
    expect(gs.openingBeat).toBeUndefined();
  });

  it("an archetype sets the location, opening beat, and current city", () => {
    const a = getStartArchetype("tingen-junior-nighthawk")!;
    const gs = createDefaultGameState(
      5,
      "c1",
      "Hero",
      "My own story",
      5,
      undefined,
      undefined,
      a,
    );
    expect(gs.location).toBe("Tingen City");
    expect(gs.currentCity).toBe("tingen");
    expect(gs.openingBeat).toBe(a.openingBeat);
  });

  it("folds the relationship grounding into the durable character background", () => {
    const a = getStartArchetype("tingen-klein-classmate")!;
    const gs = createDefaultGameState(
      1,
      "c1",
      "Hero",
      "My own story",
      5,
      undefined,
      undefined,
      a,
    );
    // The player's background is preserved AND the durable grounding is appended.
    expect(gs.characterBackground).toContain("My own story");
    expect(gs.characterBackground).toContain("classmate of Klein Moretti");
  });

  it("supplies the grounding even when the player wrote no background", () => {
    const a = getStartArchetype("tingen-klein-classmate")!;
    const gs = createDefaultGameState(
      1,
      "c1",
      "Hero",
      undefined,
      5,
      undefined,
      undefined,
      a,
    );
    expect(gs.characterBackground).toBe(
      "You begin your chronicle as a classmate of Klein Moretti at Khoy University.",
    );
  });

  it("seeds the dream-world passage + currentCity for a Forsaken origin scenario (issue #132)", () => {
    const scenario = getStartScenario("forsaken-city-of-silver")!;
    const gs = createDefaultGameState(
      3,
      "c1",
      "Knight",
      undefined,
      5,
      undefined,
      scenario,
    );
    expect(gs.location).toBe("Silver City");
    expect(gs.currentCity).toBe("silver-city");
    expect(gs.accessFlags).toEqual(["dream-world-passage", "silver-city-passage"]);
  });

  it("seeds the dream-world passage for a Forsaken origin archetype (issue #132)", () => {
    const archetype = getStartArchetype("forsaken-silver-knight")!;
    const gs = createDefaultGameState(
      3,
      "c1",
      "Knight",
      undefined,
      5,
      undefined,
      undefined,
      archetype,
    );
    expect(gs.location).toBe("Silver City");
    expect(gs.currentCity).toBe("silver-city");
    expect(gs.accessFlags).toEqual(["dream-world-passage", "silver-city-passage"]);
  });

  it("seeds the moon-city passage (not silver) for a Moon City origin (issue #133)", () => {
    const scenario = getStartScenario("forsaken-moon-city")!;
    const gs = createDefaultGameState(
      5,
      "c1",
      "Watcher",
      undefined,
      5,
      undefined,
      scenario,
    );
    expect(gs.location).toBe("Moon City");
    expect(gs.currentCity).toBe("moon-city");
    // A Moon native knows only Moon — never the City of Silver (mutual unawareness).
    expect(gs.accessFlags).toEqual(["dream-world-passage", "moon-city-passage"]);
  });

  it("grants no access flags for an ordinary central start", () => {
    const gs = createDefaultGameState(1, "c1", "Hero", undefined, 5);
    expect(gs.accessFlags).toBeUndefined();
  });

  it("uses selectedSequence when passed directly", () => {
    const gs = createDefaultGameState(
      17,
      "c1",
      "Hero",
      undefined,
      5,
      undefined,
      undefined,
      undefined,
      7,
    );
    expect(gs.sequenceLevel).toBe(7);
    expect(gs.digestion!.sequenceLevel).toBe(7);
  });

  it("defaults to Seq 9 when selectedSequence is absent", () => {
    const gs = createDefaultGameState(1, "c1", "Hero");
    expect(gs.sequenceLevel).toBe(9);
  });

  it("clamps an out-of-range selectedSequence to a playable rung (1..9)", () => {
    const args = ["c1", "Hero", undefined, 5, undefined, undefined, undefined] as const;
    // Below 1 (e.g. the Seq 0 / Pillar end-game sentinels) clamps up to 1.
    const tooLow = createDefaultGameState(1, ...args, 0);
    expect(tooLow.sequenceLevel).toBe(1);
    expect(tooLow.digestion!.sequenceLevel).toBe(1);
    // Above 9 clamps down to 9.
    const tooHigh = createDefaultGameState(1, ...args, 42);
    expect(tooHigh.sequenceLevel).toBe(9);
  });

  it("bounds the start sequence to a born-but-climbable archetype's range", () => {
    // A Sanguine is born at Seq 7 (the ceiling) but may begin already climbed
    // down to Seq 5 (minStartSequence: 5, maxStartSequence: 7, issue #183).
    const sanguine = getStartArchetype("backlund-sanguine-moon")!;
    const make = (seq: number | undefined) =>
      createDefaultGameState(
        17,
        "c1",
        "Vamp",
        undefined,
        5,
        undefined,
        undefined,
        sanguine,
        seq,
      );

    // At the born ceiling (7) the just-born beat is used, NOT the established one.
    const born = make(7);
    expect(born.sequenceLevel).toBe(7);
    expect(born.openingBeat).toBe(sanguine.openingBeat);

    // Climbed below the ceiling (5) → the established beat + the chosen rung.
    const climbed = make(5);
    expect(climbed.sequenceLevel).toBe(5);
    expect(climbed.digestion!.sequenceLevel).toBe(5);
    expect(climbed.openingBeat).toBe(sanguine.openingBeatEstablished);

    // An out-of-range pick is clamped to the archetype's ceiling (7), never 8/9.
    expect(make(9).sequenceLevel).toBe(7);
    // Below the floor clamps up to the floor (5).
    expect(make(3).sequenceLevel).toBe(5);
    // Absent selection defaults to the ceiling (7), not a flat 9.
    expect(make(undefined).sequenceLevel).toBe(7);
  });
});

// ─── seedArchetype ─────────────────────────────────────────────────────

describe("seedArchetype", () => {
  function baseSession(pathwayId = 5) {
    return createSession(createDefaultGameState(pathwayId, "c1", "Hero"), "s1", 1000);
  }

  it("seeds the tracked-ally roster as following allies", () => {
    const a = getStartArchetype("tingen-junior-nighthawk")!;
    const seeded = seedArchetype(baseSession(), a, 2000);
    const roster = seeded.trackedNpcState?.roster ?? [];
    expect(roster.map((n) => n.name)).toContain("Leonard Mitchell");
    const ally = roster.find((n) => n.name === "Leonard Mitchell")!;
    expect(ally.disposition).toBe("ally");
    expect(ally.follows).toBe(true);
  });

  it("seeds an optional society pre-membership", () => {
    const a = getStartArchetype("tingen-junior-nighthawk")!;
    const seeded = seedArchetype(baseSession(), a, 2000);
    expect(seeded.societyState?.kind).toBe("nighthawk-squad");
    expect(seeded.societyState?.name).toBe("The Tingen Nighthawks");
    expect(seeded.societyState?.members).toEqual([]);
  });

  it("records the relationship grounding facts in memory", () => {
    const a = getStartArchetype("tingen-junior-nighthawk")!;
    const seeded = seedArchetype(baseSession(), a, 2000);
    const descriptions = seeded.memory.sessionFacts.map((f) => f.description);
    expect(
      descriptions.some((d) => d.includes("junior member of the Tingen Nighthawks")),
    ).toBe(true);
  });

  it("leaves society unseeded for an archetype without a society seed", () => {
    const a = getStartArchetype("tingen-klein-classmate")!;
    const seeded = seedArchetype(baseSession(1), a, 2000);
    expect(seeded.societyState).toBeUndefined();
    expect(seeded.trackedNpcState?.roster.map((n) => n.name)).toEqual(["Klein Moretti"]);
  });

  it("is a no-op on the roster/society/facts when an archetype has empty seeds", () => {
    const empty: StartArchetype = {
      id: "empty-test",
      label: "A nobody",
      epoch: 5,
      location: "Tingen City",
      relationship: "circle-member",
      circleNpcs: ["Klein Moretti"],
      blurb: "b",
      openingBeat: "o",
      seeds: {},
    };
    const before = baseSession();
    const seeded = seedArchetype(before, empty, 2000);
    expect(seeded.trackedNpcState).toBeUndefined();
    expect(seeded.societyState).toBeUndefined();
    expect(seeded.memory.sessionFacts).toEqual(before.memory.sessionFacts);
  });

  it("produces a session that survives (de)serialization validation", () => {
    const a = getStartArchetype("tingen-junior-nighthawk")!;
    const seeded = seedArchetype(baseSession(), a, 2000);
    const restored = deserializeSession(serializeSession(seeded));
    expect(restored).not.toBeNull();
    expect(restored?.societyState?.kind).toBe("nighthawk-squad");
    expect(restored?.trackedNpcState?.roster.map((n) => n.name)).toContain(
      "Leonard Mitchell",
    );
  });
});

// ─── canonCharacterId (issue #92) ───────────────────────────────────────

describe("canonCharacterId persistence + shape validation", () => {
  function canonSession() {
    const gs = createDefaultGameState(1);
    gs.canonCharacterId = "klein-moretti";
    return createSession(gs, "canon-1", 1000);
  }

  it("round-trips canonCharacterId through (de)serialization", () => {
    const restored = deserializeSession(serializeSession(canonSession()));
    expect(restored?.gameState.canonCharacterId).toBe("klein-moretti");
  });

  it("accepts a valid string id and an absent field", () => {
    expect(isValidSessionShape(canonSession())).toBe(true);
    const plain = createSession(createDefaultGameState(1), "plain-1", 1000);
    expect(plain.gameState.canonCharacterId).toBeUndefined();
    expect(isValidSessionShape(plain)).toBe(true);
  });

  it("rejects a malformed canonCharacterId (non-string / empty)", () => {
    const bad = canonSession();
    (bad.gameState as unknown as Record<string, unknown>).canonCharacterId = 42;
    expect(isValidSessionShape(bad)).toBe(false);
    const empty = canonSession();
    empty.gameState.canonCharacterId = "";
    expect(isValidSessionShape(empty)).toBe(false);
  });

  it("round-trips canonPersonality and rejects a malformed value", () => {
    const gs = createDefaultGameState(1);
    gs.canonCharacterId = "klein-moretti";
    gs.canonPersonality = "Cautious, cunning, secretive.";
    const session = createSession(gs, "canon-p", 1000);
    const restored = deserializeSession(serializeSession(session));
    expect(restored?.gameState.canonPersonality).toBe("Cautious, cunning, secretive.");
    // Absent is valid; non-string / empty is rejected.
    expect(isValidSessionShape(session)).toBe(true);
    const bad = createSession(gs, "canon-p2", 1000);
    (bad.gameState as unknown as Record<string, unknown>).canonPersonality = 7;
    expect(isValidSessionShape(bad)).toBe(false);
    const empty = createSession(gs, "canon-p3", 1000);
    empty.gameState.canonPersonality = "";
    expect(isValidSessionShape(empty)).toBe(false);
  });
});

describe("pendingTurnKind persistence + shape validation (issue #171)", () => {
  function kindSession(kind: unknown) {
    const s = createSession(
      createDefaultGameState(1),
      "kind-1",
      1000,
    ) as unknown as Record<string, unknown>;
    s.pendingTurnKind = kind;
    return s;
  }

  it("accepts a known kind, null, or an absent field, and round-trips it", () => {
    expect(isValidSessionShape(kindSession("combat"))).toBe(true);
    expect(isValidSessionShape(kindSession("advancement"))).toBe(true);
    expect(isValidSessionShape(kindSession(null))).toBe(true);
    const plain = createSession(createDefaultGameState(1), "plain-2", 1000);
    expect(isValidSessionShape(plain)).toBe(true);
    const restored = deserializeSession(serializeSession(kindSession("combat") as never));
    expect(restored?.pendingTurnKind).toBe("combat");
  });

  it("rejects an unknown kind value", () => {
    expect(isValidSessionShape(kindSession("nonsense"))).toBe(false);
    expect(isValidSessionShape(kindSession(7))).toBe(false);
  });
});

describe("Codex persistence + backfill (history-context Codex)", () => {
  it("backfills a Codex from existing state for a save that predates it", () => {
    const session = createSession(
      createDefaultGameState(1, "c1", "Hero"),
      "codex-1",
      1000,
    );
    session.gameState.npcsPresent = ["Old Neil"];
    // Simulate a legacy save: drop the codexState before serializing.
    const raw = JSON.parse(serializeSession(session)) as Record<string, unknown>;
    delete raw.codexState;
    const restored = deserializeSession(JSON.stringify(raw));
    expect(restored?.codexState).toBeDefined();
    expect(
      restored?.codexState?.entities.some(
        (e) => e.kind === "person" && e.name === "Old Neil",
      ),
    ).toBe(true);
  });

  it("preserves an explicit codexState round-trip and rejects a malformed one", () => {
    const session = createSession(
      createDefaultGameState(1),
      "codex-2",
      1000,
    ) as unknown as Record<string, unknown>;
    session.codexState = {
      entities: [
        {
          id: "x1",
          kind: "person",
          name: "Welch",
          status: "a fence",
          importance: "pivotal",
          firstSeenTurn: 1,
          lastSeenTurn: 3,
        },
      ],
    };
    expect(isValidSessionShape(session)).toBe(true);
    const restored = deserializeSession(serializeSession(session as never));
    expect(restored?.codexState?.entities[0].name).toBe("Welch");

    session.codexState = { entities: [{ id: "x", kind: "alien", name: "X" }] };
    expect(isValidSessionShape(session)).toBe(false);
  });
});
