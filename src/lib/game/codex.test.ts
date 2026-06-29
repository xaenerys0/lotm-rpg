import { describe, it, expect } from "vitest";
import type { CodexUpdateInput } from "@/lib/ai";
import type { GameSession } from "./types";
import {
  applyCodexUpdate,
  applyCodexUpdates,
  codexCounts,
  codexRebuildDigest,
  filterCodexEntities,
  emptyCodexState,
  isValidCodexStateShape,
  mergeCodexEntities,
  MAX_CODEX_ENTITIES,
  MAX_PINNED_ENTITIES,
  pinnedEntitiesForPrompt,
  recordCodexTurn,
  removeCodexEntity,
  resolveCodexState,
  seedCodexFromSession,
  selectPinnedEntities,
  setCodexImportance,
  touchCodexEntities,
  updateCodexEntity,
  type CodexEntity,
  type CodexState,
} from "./codex";

// Deterministic id factory for tests.
function counter() {
  let n = 0;
  return () => `e${n++}`;
}

function update(
  over: Partial<CodexUpdateInput> & { kind: string; name: string },
): CodexUpdateInput {
  return over;
}

const scene = (
  over: Partial<{
    location: string;
    npcsPresent: string[];
    activeQuests: string[];
  }> = {},
) => ({
  location: over.location ?? "Tingen City — Iron Cross District",
  npcsPresent: over.npcsPresent ?? [],
  activeQuests: over.activeQuests ?? [],
});

describe("emptyCodexState / resolveCodexState", () => {
  it("creates an empty registry", () => {
    expect(emptyCodexState()).toEqual({ entities: [] });
  });
  it("resolves an absent state to empty", () => {
    expect(resolveCodexState()).toEqual({ entities: [] });
    const s: CodexState = { entities: [] };
    expect(resolveCodexState(s)).toBe(s);
  });
});

describe("applyCodexUpdate — creation", () => {
  it("creates a new entity with defaults", () => {
    const id = counter();
    const state = applyCodexUpdate(
      emptyCodexState(),
      update({ kind: "person", name: "Klein", status: "a wary Seer" }),
      3,
      id,
    );
    expect(state.entities).toHaveLength(1);
    expect(state.entities[0]).toMatchObject({
      id: "e0",
      kind: "person",
      name: "Klein",
      status: "a wary Seer",
      importance: "standard",
      firstSeenTurn: 3,
      lastSeenTurn: 3,
    });
  });

  it("honours importance, note, resolved and aliases on creation", () => {
    const state = applyCodexUpdate(
      emptyCodexState(),
      update({
        kind: "thread",
        name: "Owes Dunn a favour",
        importance: "pivotal",
        note: "incurred during the Tarot Club raid",
        resolved: true,
        aliases: ["the debt", "the debt", "Owes Dunn a favour"],
      }),
      2,
      counter(),
    );
    const e = state.entities[0];
    expect(e.importance).toBe("pivotal");
    expect(e.note).toBe("incurred during the Tarot Club raid");
    expect(e.resolved).toBe(true);
    // Dedupe + exclude the entity's own name from aliases.
    expect(e.aliases).toEqual(["the debt"]);
  });

  it("drops a delta with an unknown kind", () => {
    const state = applyCodexUpdate(
      emptyCodexState(),
      update({ kind: "creature", name: "X" }),
      1,
      counter(),
    );
    expect(state.entities).toHaveLength(0);
  });

  it("drops a delta with a blank name", () => {
    const state = applyCodexUpdate(
      emptyCodexState(),
      update({ kind: "person", name: "   " }),
      1,
      counter(),
    );
    expect(state.entities).toHaveLength(0);
  });

  it("ignores an unknown importance (defaults to standard)", () => {
    const state = applyCodexUpdate(
      emptyCodexState(),
      update({ kind: "object", name: "Mirror", importance: "legendary" }),
      1,
      counter(),
    );
    expect(state.entities[0].importance).toBe("standard");
  });

  it("clamps overlong name, status, and note", () => {
    const state = applyCodexUpdate(
      emptyCodexState(),
      update({
        kind: "location",
        name: "L".repeat(200),
        status: "S".repeat(400),
        note: "N".repeat(900),
      }),
      1,
      counter(),
    );
    const e = state.entities[0];
    expect(e.name.length).toBe(80);
    expect(e.status.length).toBe(200);
    expect((e.note ?? "").length).toBe(600);
  });

  it("caps the number of aliases", () => {
    const state = applyCodexUpdate(
      emptyCodexState(),
      update({
        kind: "person",
        name: "Many",
        aliases: ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j"],
      }),
      1,
      counter(),
    );
    expect((state.entities[0].aliases ?? []).length).toBe(8);
  });
});

describe("applyCodexUpdate — matching existing", () => {
  const seed = () =>
    applyCodexUpdate(
      emptyCodexState(),
      update({ kind: "person", name: "Klein", status: "a Seer", aliases: ["Mr. Fool"] }),
      1,
      counter(),
    );

  it("matches by name (case-insensitive) and updates status + lastSeenTurn", () => {
    const next = applyCodexUpdate(
      seed(),
      update({ kind: "person", name: "klein", status: "now a Clown" }),
      5,
    );
    expect(next.entities).toHaveLength(1);
    expect(next.entities[0].status).toBe("now a Clown");
    expect(next.entities[0].lastSeenTurn).toBe(5);
    expect(next.entities[0].firstSeenTurn).toBe(1);
  });

  it("does not overwrite status with a blank one", () => {
    const next = applyCodexUpdate(seed(), update({ kind: "person", name: "Klein" }), 4);
    expect(next.entities[0].status).toBe("a Seer");
  });

  it("matches when the delta's name equals an existing alias", () => {
    const next = applyCodexUpdate(
      seed(),
      update({ kind: "person", name: "Mr. Fool", status: "the enigmatic one" }),
      6,
    );
    expect(next.entities).toHaveLength(1);
    expect(next.entities[0].status).toBe("the enigmatic one");
  });

  it("matches when an existing name equals one of the delta's aliases", () => {
    const next = applyCodexUpdate(
      seed(),
      update({ kind: "person", name: "Gehrman", aliases: ["Klein"] }),
      6,
    );
    expect(next.entities).toHaveLength(1);
  });

  it("does not match across kinds", () => {
    const next = applyCodexUpdate(seed(), update({ kind: "location", name: "Klein" }), 6);
    expect(next.entities).toHaveLength(2);
  });

  it("merges aliases and upgrades importance + resolved on update", () => {
    const next = applyCodexUpdate(
      seed(),
      update({
        kind: "person",
        name: "Klein",
        importance: "pivotal",
        aliases: ["The Fool"],
      }),
      7,
    );
    expect(next.entities[0].importance).toBe("pivotal");
    expect(next.entities[0].aliases).toEqual(["Mr. Fool", "The Fool"]);
  });

  it("never moves lastSeenTurn backward", () => {
    const next = applyCodexUpdate(seed(), update({ kind: "person", name: "Klein" }), -3);
    expect(next.entities[0].lastSeenTurn).toBe(1);
  });
});

describe("applyCodexUpdates — batch + eviction", () => {
  it("folds a batch in order", () => {
    const state = applyCodexUpdates(
      emptyCodexState(),
      [
        update({ kind: "person", name: "A" }),
        update({ kind: "location", name: "B" }),
        update({ kind: "person", name: "A", status: "updated" }),
      ],
      2,
      counter(),
    );
    expect(state.entities).toHaveLength(2);
    expect(state.entities.find((e) => e.name === "A")?.status).toBe("updated");
  });

  it("defaults to no updates", () => {
    expect(applyCodexUpdates(emptyCodexState(), undefined, 1).entities).toHaveLength(0);
  });

  it("evicts the lowest-salience entity when over capacity, protecting pivotal", () => {
    const id = counter();
    let state = emptyCodexState();
    // 240 standard persons, each seen at a distinct (increasing) turn.
    for (let i = 0; i < MAX_CODEX_ENTITIES; i++) {
      state = applyCodexUpdate(state, update({ kind: "person", name: `p${i}` }), i, id);
    }
    expect(state.entities).toHaveLength(MAX_CODEX_ENTITIES);
    // Add a pivotal — one over capacity, so the oldest standard ("p0") is dropped.
    state = applyCodexUpdate(
      state,
      update({ kind: "person", name: "VIP", importance: "pivotal" }),
      999,
      id,
    );
    expect(state.entities).toHaveLength(MAX_CODEX_ENTITIES);
    expect(state.entities.some((e) => e.name === "VIP")).toBe(true);
    expect(state.entities.some((e) => e.name === "p0")).toBe(false);
  });
});

describe("touchCodexEntities", () => {
  const seed = () =>
    applyCodexUpdates(
      emptyCodexState(),
      [
        update({ kind: "person", name: "Klein", aliases: ["Mr. Fool"] }),
        update({ kind: "location", name: "Backlund" }),
      ],
      1,
      counter(),
    );

  it("bumps lastSeenTurn for a matching name", () => {
    const next = touchCodexEntities(seed(), ["Klein"], 8);
    expect(next.entities.find((e) => e.name === "Klein")?.lastSeenTurn).toBe(8);
    expect(next.entities.find((e) => e.name === "Backlund")?.lastSeenTurn).toBe(1);
  });

  it("matches an entity name as a substring of a present location string", () => {
    const next = touchCodexEntities(seed(), ["Backlund — Cathedral of Serenity"], 9);
    expect(next.entities.find((e) => e.name === "Backlund")?.lastSeenTurn).toBe(9);
  });

  it("matches by alias", () => {
    const next = touchCodexEntities(seed(), ["Mr. Fool"], 5);
    expect(next.entities.find((e) => e.name === "Klein")?.lastSeenTurn).toBe(5);
  });

  it("never creates an entity for an unknown name", () => {
    const next = touchCodexEntities(seed(), ["A Stranger"], 5);
    expect(next.entities).toHaveLength(2);
  });

  it("does not false-match a short entity name inside a longer word (word boundary)", () => {
    const short = applyCodexUpdate(
      emptyCodexState(),
      update({ kind: "person", name: "Al" }),
      1,
      () => "al-1",
    );
    // "Al" must not match inside "Alley District".
    expect(touchCodexEntities(short, ["Alley District"], 9)).toBe(short);
    // But it still matches a real word-boundary occurrence.
    expect(touchCodexEntities(short, ["Al the fence"], 9).entities[0].lastSeenTurn).toBe(
      9,
    );
  });

  it("returns the same state when nothing matches or no names are given", () => {
    const s = seed();
    expect(touchCodexEntities(s, [], 5)).toBe(s);
    expect(touchCodexEntities(s, ["", "  "], 5)).toBe(s);
    expect(touchCodexEntities(s, ["Nobody"], 5)).toBe(s);
  });
});

describe("recordCodexTurn", () => {
  it("applies deltas then auto-touches present location and NPCs", () => {
    const id = counter();
    const base = applyCodexUpdate(
      emptyCodexState(),
      update({ kind: "person", name: "Old Friend" }),
      1,
      id,
    );
    const next = recordCodexTurn(
      base,
      [update({ kind: "location", name: "Backlund" })],
      { location: "Backlund", npcsPresent: ["Old Friend"] },
      10,
      id,
    );
    expect(next.entities.find((e) => e.name === "Old Friend")?.lastSeenTurn).toBe(10);
    expect(next.entities.find((e) => e.name === "Backlund")?.lastSeenTurn).toBe(10);
  });
});

describe("removeCodexEntity", () => {
  it("removes by id and no-ops on an unknown id", () => {
    const state = applyCodexUpdate(
      emptyCodexState(),
      update({ kind: "person", name: "X" }),
      1,
      () => "x1",
    );
    expect(removeCodexEntity(state, "x1").entities).toHaveLength(0);
    expect(removeCodexEntity(state, "nope").entities).toHaveLength(1);
  });
});

describe("curation ops", () => {
  const seed = () =>
    applyCodexUpdates(
      emptyCodexState(),
      [
        update({ kind: "person", name: "Klein", status: "a Seer", note: "keep" }),
        update({ kind: "person", name: "Mr. Fool", status: "the enigma" }),
      ],
      1,
      counter(),
    );

  it("updateCodexEntity edits fields, clamps, and keeps id/turns", () => {
    const s = seed();
    const id = s.entities[0].id;
    const next = updateCodexEntity(s, id, {
      status: "now a Clown",
      importance: "pivotal",
      kind: "person",
      resolved: false,
    });
    const e = next.entities[0];
    expect(e.id).toBe(id);
    expect(e.status).toBe("now a Clown");
    expect(e.importance).toBe("pivotal");
    expect(e.firstSeenTurn).toBe(1);
  });

  it("updateCodexEntity rejects a blank name, ignores bad kind/importance, clears note", () => {
    const s = seed();
    const id = s.entities[0].id;
    const next = updateCodexEntity(s, id, {
      name: "   ",
      kind: "alien" as never,
      importance: "vital" as never,
      note: "  ",
    });
    expect(next.entities[0].name).toBe("Klein");
    expect(next.entities[0].kind).toBe("person");
    expect(next.entities[0].importance).toBe("standard");
    expect(next.entities[0].note).toBeUndefined();
  });

  it("updateCodexEntity no-ops on an unknown id", () => {
    const s = seed();
    expect(updateCodexEntity(s, "nope", { status: "x" })).toEqual(s);
  });

  it("setCodexImportance pins/unpins", () => {
    const s = seed();
    const id = s.entities[0].id;
    expect(setCodexImportance(s, id, "pivotal").entities[0].importance).toBe("pivotal");
  });

  it("mergeCodexEntities folds drop into keep (aliases, turns) and removes drop", () => {
    const s = applyCodexUpdates(
      emptyCodexState(),
      [
        update({ kind: "person", name: "Stagnation Entity", aliases: ["the rot"] }),
        update({ kind: "person", name: "The Stagnation Entity" }),
      ],
      1,
      counter(),
    );
    // Bump the second one's lastSeenTurn so the max is observable.
    const bumped = touchCodexEntities(s, ["The Stagnation Entity"], 20);
    const [keep, drop] = bumped.entities;
    const merged = mergeCodexEntities(bumped, keep.id, drop.id);
    expect(merged.entities).toHaveLength(1);
    expect(merged.entities[0].id).toBe(keep.id);
    expect(merged.entities[0].aliases).toContain("the rot");
    expect(merged.entities[0].aliases).toContain("The Stagnation Entity");
    expect(merged.entities[0].lastSeenTurn).toBe(20);
    expect(merged.entities[0].firstSeenTurn).toBe(1);
  });

  it("mergeCodexEntities no-ops on same/unknown ids", () => {
    const s = seed();
    const id = s.entities[0].id;
    expect(mergeCodexEntities(s, id, id)).toBe(s);
    expect(mergeCodexEntities(s, id, "nope")).toBe(s);
    expect(mergeCodexEntities(s, "nope", id)).toBe(s);
  });
});

describe("seedCodexFromSession — heuristic depth", () => {
  it("files a collective-named present NPC as a group, not a person", () => {
    const session = {
      id: "s",
      turnCount: 5,
      gameState: {
        characterId: "c",
        pathwayId: 1,
        sequenceLevel: 4,
        sanity: 50,
        maxSanity: 100,
        inventory: [],
        location: "The Golden Dream",
        npcsPresent: ["The Veiled Woman", "The Veiled Woman's Sect"],
        activeQuests: [],
      },
    } as unknown as GameSession;
    const state = seedCodexFromSession(session, counter());
    expect(state.entities.find((e) => e.name === "The Veiled Woman")?.kind).toBe(
      "person",
    );
    expect(state.entities.find((e) => e.name === "The Veiled Woman's Sect")?.kind).toBe(
      "group",
    );
  });

  it("mines Goals/Threads from the running summary into thread entities", () => {
    const session = {
      id: "s",
      turnCount: 9,
      gameState: {
        characterId: "c",
        pathwayId: 1,
        sequenceLevel: 4,
        sanity: 50,
        maxSanity: 100,
        inventory: [],
        location: "The Golden Dream",
        npcsPresent: [],
        activeQuests: [],
      },
      memory: {
        immediateTurns: [],
        recentSummaries: [],
        sessionFacts: [],
        runningSummary:
          "Who: Andrew, Sequence 4.\nGoals: Establish spirit world anchors; investigate the Shattered Archive.\nThreads: Carries a sealed demigod; awaits a meeting with the Captain.",
      },
    } as unknown as GameSession;
    const threads = seedCodexFromSession(session, counter()).entities.filter(
      (e) => e.kind === "thread",
    );
    expect(threads.map((t) => t.name)).toEqual([
      "Establish spirit world anchors",
      "investigate the Shattered Archive",
      "Carries a sealed demigod",
      "awaits a meeting with the Captain",
    ]);
  });
});

describe("selectPinnedEntities / pinnedEntitiesForPrompt", () => {
  function build(): CodexState {
    const id = counter();
    let s = emptyCodexState();
    s = applyCodexUpdate(
      s,
      update({ kind: "person", name: "Pivotal A", importance: "pivotal" }),
      5,
      id,
    );
    s = applyCodexUpdate(
      s,
      update({ kind: "person", name: "Pivotal C", importance: "pivotal" }),
      2,
      id,
    );
    s = applyCodexUpdate(s, update({ kind: "person", name: "Scene B" }), 9, id);
    s = applyCodexUpdate(s, update({ kind: "person", name: "Offscreen D" }), 9, id);
    s = applyCodexUpdate(
      s,
      update({
        kind: "thread",
        name: "Settled vow",
        importance: "pivotal",
        resolved: true,
      }),
      3,
      id,
    );
    return s;
  }

  it("pins all pivotal + scene-relevant standard, excludes resolved + offscreen", () => {
    const pinned = selectPinnedEntities(build(), scene({ npcsPresent: ["Scene B"] }));
    const names = pinned.map((e) => e.name);
    expect(names).toContain("Pivotal A");
    expect(names).toContain("Pivotal C");
    expect(names).toContain("Scene B");
    expect(names).not.toContain("Offscreen D");
    expect(names).not.toContain("Settled vow");
  });

  it("orders pivotal-first, then by recency, then by name", () => {
    const pinned = selectPinnedEntities(build(), scene({ npcsPresent: ["Scene B"] }));
    expect(pinned.map((e) => e.name)).toEqual(["Pivotal A", "Pivotal C", "Scene B"]);
  });

  it("does not pin a short standard entity matched only inside a longer word", () => {
    const id = counter();
    const s = applyCodexUpdate(
      emptyCodexState(),
      update({ kind: "person", name: "Al" }),
      1,
      id,
    );
    // Scene location "Alley" must not pin the standard entity "Al".
    expect(selectPinnedEntities(s, scene({ location: "Alley District" }))).toHaveLength(
      0,
    );
    // A real word-boundary mention does pin it.
    expect(
      selectPinnedEntities(s, scene({ npcsPresent: ["Al"] })).map((e) => e.name),
    ).toEqual(["Al"]);
  });

  it("matches a standard entity named in an active quest", () => {
    const id = counter();
    const s = applyCodexUpdate(
      emptyCodexState(),
      update({ kind: "object", name: "Silver Mirror" }),
      1,
      id,
    );
    const pinned = selectPinnedEntities(
      s,
      scene({ activeQuests: ["Recover the Silver Mirror"] }),
    );
    expect(pinned.map((e) => e.name)).toContain("Silver Mirror");
  });

  it("hard-caps the pinned subset", () => {
    const id = counter();
    let s = emptyCodexState();
    for (let i = 0; i < MAX_PINNED_ENTITIES + 5; i++) {
      s = applyCodexUpdate(
        s,
        update({ kind: "person", name: `V${i}`, importance: "pivotal" }),
        i,
        id,
      );
    }
    expect(selectPinnedEntities(s, scene()).length).toBe(MAX_PINNED_ENTITIES);
  });

  it("maps to the prompt shape, carrying the resolved flag only when set", () => {
    const id = counter();
    let s = applyCodexUpdate(
      s_empty(),
      update({ kind: "person", name: "Ally", importance: "pivotal", status: "loyal" }),
      4,
      id,
    );
    s = applyCodexUpdate(
      s,
      update({ kind: "thread", name: "Open hook", importance: "pivotal" }),
      4,
      id,
    );
    const pinned = pinnedEntitiesForPrompt(s, scene());
    const ally = pinned.find((e) => e.name === "Ally");
    expect(ally).toEqual({
      kind: "person",
      name: "Ally",
      status: "loyal",
      importance: "pivotal",
      lastSeenTurn: 4,
    });
    expect(pinned.find((e) => e.name === "Open hook")).not.toHaveProperty("resolved");
  });
});

function s_empty(): CodexState {
  return emptyCodexState();
}

describe("filterCodexEntities", () => {
  function build(): CodexState {
    const id = counter();
    let s = emptyCodexState();
    s = applyCodexUpdate(
      s,
      update({ kind: "person", name: "Klein", status: "a Seer", aliases: ["Mr. Fool"] }),
      9,
      id,
    );
    s = applyCodexUpdate(
      s,
      update({ kind: "person", name: "Audrey", importance: "pivotal" }),
      5,
      id,
    );
    s = applyCodexUpdate(s, update({ kind: "location", name: "Backlund" }), 7, id);
    s = applyCodexUpdate(
      s,
      update({ kind: "thread", name: "Settled vow", resolved: true }),
      2,
      id,
    );
    return s;
  }

  it("returns all unresolved entities by default, sorted pivotal-first then recency", () => {
    const result = filterCodexEntities(build());
    expect(result.map((e) => e.name)).toEqual(["Audrey", "Klein", "Backlund"]);
  });

  it("filters by kind", () => {
    expect(filterCodexEntities(build(), { kind: "location" }).map((e) => e.name)).toEqual(
      ["Backlund"],
    );
    // "all" is a no-op filter.
    expect(filterCodexEntities(build(), { kind: "all" })).toHaveLength(3);
  });

  it("matches text over name, status, and aliases (case-insensitive)", () => {
    expect(filterCodexEntities(build(), { text: "seer" }).map((e) => e.name)).toEqual([
      "Klein",
    ]);
    expect(filterCodexEntities(build(), { text: "mr. fool" }).map((e) => e.name)).toEqual(
      ["Klein"],
    );
    expect(filterCodexEntities(build(), { text: "nothing" })).toHaveLength(0);
  });

  it("includes resolved threads only when asked", () => {
    expect(
      filterCodexEntities(build(), { includeResolved: true }).map((e) => e.name),
    ).toContain("Settled vow");
    expect(filterCodexEntities(build()).map((e) => e.name)).not.toContain("Settled vow");
  });
});

describe("codexCounts", () => {
  it("counts unresolved entities by kind, skipping resolved threads", () => {
    const id = counter();
    let s = emptyCodexState();
    s = applyCodexUpdate(s, update({ kind: "person", name: "P" }), 1, id);
    s = applyCodexUpdate(s, update({ kind: "location", name: "L" }), 1, id);
    s = applyCodexUpdate(s, update({ kind: "thread", name: "Open" }), 1, id);
    s = applyCodexUpdate(
      s,
      update({ kind: "thread", name: "Done", resolved: true }),
      1,
      id,
    );
    expect(codexCounts(s)).toEqual({
      person: 1,
      location: 1,
      object: 0,
      group: 0,
      thread: 1,
    });
  });
});

describe("seedCodexFromSession", () => {
  function session(over: Partial<GameSession> = {}): GameSession {
    return {
      id: "s1",
      turnCount: 42,
      gameState: {
        characterId: "c1",
        pathwayId: 1,
        sequenceLevel: 7,
        sanity: 50,
        maxSanity: 100,
        inventory: [],
        location: "Backlund — Cathedral",
        npcsPresent: ["A Constable"],
        activeQuests: [],
        ...(over.gameState ?? {}),
      },
      ...over,
    } as unknown as GameSession;
  }

  it("seeds the present location and NPCs", () => {
    const state = seedCodexFromSession(session(), counter());
    expect(
      state.entities.find(
        (e) => e.kind === "location" && e.name === "Backlund — Cathedral",
      ),
    ).toBeTruthy();
    expect(
      state.entities.find((e) => e.kind === "person" && e.name === "A Constable"),
    ).toBeTruthy();
  });

  it("seeds roster allies/pursuers as pivotal followers", () => {
    const state = seedCodexFromSession(
      session({
        trackedNpcState: {
          roster: [
            { name: "Companion", disposition: "ally", follows: true },
            { name: "Hunter", disposition: "hostile", follows: true },
            { name: "Acquaintance", disposition: "neutral", follows: false },
          ],
        },
      } as Partial<GameSession>),
      counter(),
    );
    const companion = state.entities.find((e) => e.name === "Companion");
    const hunter = state.entities.find((e) => e.name === "Hunter");
    const acq = state.entities.find((e) => e.name === "Acquaintance");
    expect(companion?.importance).toBe("pivotal");
    expect(companion?.status).toContain("travels with you");
    expect(hunter?.importance).toBe("pivotal");
    expect(hunter?.status).toContain("pursuer");
    expect(acq?.importance).toBe("standard");
    expect(acq?.status).toContain("Known to you");
  });

  it("seeds anchors (mapped by kind), the society, and custom locations", () => {
    const state = seedCodexFromSession(
      session({
        anchorState: {
          anchors: [
            { id: "a1", kind: "object", name: "Silver Locket", integrity: 100 },
            { id: "a2", kind: "place", name: "The Chapel", integrity: 80 },
            { id: "a3", kind: "congregation", name: "The Faithful", integrity: 60 },
          ],
        },
        societyState: { name: "The Tarot Club" },
        gameState: {
          characterId: "c1",
          pathwayId: 1,
          sequenceLevel: 7,
          sanity: 50,
          maxSanity: 100,
          inventory: [],
          location: "Backlund",
          npcsPresent: [],
          activeQuests: [],
          customLocations: [
            { cityId: "backlund", slug: "custom-den", name: "The Hidden Den" },
          ],
        },
      } as unknown as Partial<GameSession>),
      counter(),
    );
    expect(state.entities.find((e) => e.name === "Silver Locket")?.kind).toBe("object");
    expect(state.entities.find((e) => e.name === "The Chapel")?.kind).toBe("location");
    expect(state.entities.find((e) => e.name === "The Faithful")?.kind).toBe("group");
    expect(state.entities.find((e) => e.name === "The Tarot Club")?.kind).toBe("group");
    expect(state.entities.find((e) => e.name === "The Hidden Den")?.kind).toBe(
      "location",
    );
    // Stamped at the save's turn count.
    expect(state.entities.every((e) => e.lastSeenTurn === 42)).toBe(true);
  });

  it("handles a bare session with nothing to seed but a location", () => {
    const state = seedCodexFromSession(
      session({
        gameState: {
          characterId: "c1",
          pathwayId: 1,
          sequenceLevel: 9,
          sanity: 100,
          maxSanity: 100,
          inventory: [],
          location: "   ",
          npcsPresent: [],
          activeQuests: [],
        },
      } as unknown as Partial<GameSession>),
      counter(),
    );
    expect(state.entities).toHaveLength(0);
  });
});

describe("default id factory + edge turn counts", () => {
  it("uses crypto.randomUUID by default across the apply paths", () => {
    const created = applyCodexUpdate(
      emptyCodexState(),
      update({ kind: "person", name: "A" }),
      1,
    );
    expect(typeof created.entities[0].id).toBe("string");
    expect(created.entities[0].id.length).toBeGreaterThan(0);

    const batched = applyCodexUpdates(
      emptyCodexState(),
      [update({ kind: "person", name: "B" })],
      1,
    );
    expect(batched.entities[0].id.length).toBeGreaterThan(0);

    const recorded = recordCodexTurn(
      emptyCodexState(),
      [update({ kind: "person", name: "C" })],
      { location: "X", npcsPresent: [] },
      1,
    );
    expect(recorded.entities[0].id.length).toBeGreaterThan(0);
  });

  it("seeds with the default id factory and floors a non-finite turnCount to 0", () => {
    const session = {
      id: "s1",
      turnCount: Number.NaN,
      gameState: {
        characterId: "c1",
        pathwayId: 1,
        sequenceLevel: 9,
        sanity: 100,
        maxSanity: 100,
        inventory: [],
        location: "Tingen",
        npcsPresent: [],
        activeQuests: [],
      },
    } as unknown as GameSession;
    const state = seedCodexFromSession(session);
    expect(state.entities[0].lastSeenTurn).toBe(0);
    expect(state.entities[0].id.length).toBeGreaterThan(0);
  });
});

describe("codexRebuildDigest", () => {
  it("assembles the synopsis, journal beats, and facts into the AI input", () => {
    const session = {
      turnCount: 235,
      gameState: { characterName: "Andrew Abraham" },
      memory: {
        runningSummary: "Ties: Captain Edwina Edwards.",
        sessionFacts: [
          { type: "npc-encounter", description: "Met Danitz Dubois", turnNumber: 5 },
          { type: "event", description: "Anchored in the Spirit World", turnNumber: 9 },
        ],
      },
    } as unknown as GameSession;
    const journal = {
      entries: [
        {
          turnNumber: 12,
          eventType: "combat",
          summary: "Fought the Stagnation Entity",
          involvedNpcs: ["Stagnation Entity"],
          narrative: "The clockwork rot lunged.",
        },
        {
          turnNumber: 40,
          eventType: "discovery",
          summary: "Travelled to Fors's Refuge",
          involvedNpcs: [],
          narrative: "Fors waited in the back room with the Gilded Eye.",
        },
      ],
      annotations: [],
    } as never;

    const digest = codexRebuildDigest(session, journal);
    expect(digest.characterName).toBe("Andrew Abraham");
    expect(digest.runningSummary).toContain("Captain Edwina Edwards");
    expect(digest.currentTurn).toBe(235);
    expect(digest.facts).toEqual(["Met Danitz Dubois", "Anchored in the Spirit World"]);
    expect(digest.journal[0]).toEqual({
      turnNumber: 12,
      eventType: "combat",
      summary: "Fought the Stagnation Entity",
      npcs: ["Stagnation Entity"],
      narrative: "The clockwork rot lunged.",
    });
    // An entry with no NPCs still carries the recent-window narrative — that's
    // where characters behind possessive place-names (Fors) surface.
    expect(digest.journal[1]).not.toHaveProperty("npcs");
    expect(digest.journal[1].narrative).toContain("Fors");
  });

  it("clips narratives and attaches them only to the most-recent window", () => {
    const entries = Array.from({ length: 100 }, (_, i) => ({
      turnNumber: i,
      eventType: "discovery",
      summary: `Travelled, beat ${i}`,
      involvedNpcs: [],
      narrative: "N".repeat(500),
    }));
    const session = {
      turnCount: 100,
      gameState: { characterName: "X" },
      memory: { sessionFacts: [] },
    } as unknown as GameSession;
    const digest = codexRebuildDigest(session, { entries, annotations: [] } as never);
    // The oldest of the 100-entry tail is outside the 80-entry narrative window.
    expect(digest.journal[0]).not.toHaveProperty("narrative");
    const last = digest.journal[digest.journal.length - 1];
    expect(last.narrative).toBeDefined();
    expect(last.narrative!.length).toBeLessThanOrEqual(320);
  });

  it("handles a journal entry missing its narrative field", () => {
    const session = {
      turnCount: 3,
      gameState: { characterName: "X" },
      memory: { sessionFacts: [] },
    } as unknown as GameSession;
    const digest = codexRebuildDigest(session, {
      entries: [
        { turnNumber: 1, eventType: "combat", summary: "A clash", involvedNpcs: [] },
      ],
      annotations: [],
    } as never);
    expect(digest.journal[0]).not.toHaveProperty("narrative");
  });

  it("omits characterName/runningSummary when absent", () => {
    const session = {
      turnCount: 1,
      gameState: {},
      memory: { sessionFacts: [] },
    } as unknown as GameSession;
    const digest = codexRebuildDigest(session, { entries: [], annotations: [] } as never);
    expect(digest).not.toHaveProperty("characterName");
    expect(digest).not.toHaveProperty("runningSummary");
    expect(digest.journal).toEqual([]);
    expect(digest.facts).toEqual([]);
  });
});

describe("isValidCodexStateShape", () => {
  const valid: CodexEntity = {
    id: "e1",
    kind: "person",
    name: "Klein",
    status: "a Seer",
    importance: "standard",
    firstSeenTurn: 1,
    lastSeenTurn: 1,
  };

  it("accepts a well-formed state", () => {
    expect(isValidCodexStateShape({ entities: [valid] })).toBe(true);
    expect(isValidCodexStateShape(emptyCodexState())).toBe(true);
  });

  it("accepts optional aliases/note/resolved", () => {
    expect(
      isValidCodexStateShape({
        entities: [{ ...valid, aliases: ["Fool"], note: "n", resolved: false }],
      }),
    ).toBe(true);
  });

  it("rejects non-objects and missing entities array", () => {
    expect(isValidCodexStateShape(null)).toBe(false);
    expect(isValidCodexStateShape([])).toBe(false);
    expect(isValidCodexStateShape({})).toBe(false);
    expect(isValidCodexStateShape({ entities: "no" })).toBe(false);
  });

  it("rejects malformed entities", () => {
    expect(isValidCodexStateShape({ entities: [{ ...valid, id: "" }] })).toBe(false);
    expect(isValidCodexStateShape({ entities: [{ ...valid, kind: "alien" }] })).toBe(
      false,
    );
    expect(isValidCodexStateShape({ entities: [{ ...valid, name: "" }] })).toBe(false);
    expect(isValidCodexStateShape({ entities: [{ ...valid, status: 1 }] })).toBe(false);
    expect(isValidCodexStateShape({ entities: [{ ...valid, importance: "key" }] })).toBe(
      false,
    );
    expect(isValidCodexStateShape({ entities: [{ ...valid, firstSeenTurn: "x" }] })).toBe(
      false,
    );
    expect(isValidCodexStateShape({ entities: [{ ...valid, lastSeenTurn: NaN }] })).toBe(
      false,
    );
    expect(isValidCodexStateShape({ entities: [{ ...valid, aliases: "x" }] })).toBe(
      false,
    );
    expect(isValidCodexStateShape({ entities: [{ ...valid, aliases: [1] }] })).toBe(
      false,
    );
    expect(isValidCodexStateShape({ entities: [{ ...valid, note: 5 }] })).toBe(false);
    expect(isValidCodexStateShape({ entities: [{ ...valid, resolved: "yes" }] })).toBe(
      false,
    );
    expect(isValidCodexStateShape({ entities: [null] })).toBe(false);
  });
});
