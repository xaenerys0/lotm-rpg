import { describe, expect, it } from "vitest";

import type { Item } from "@/lib/types/rules";

import { buildLegacy } from "./death";
import {
  artifactToItem,
  deserializeArtifacts,
  discoverableArtifacts,
  echoFacts,
  mintArtifact,
  pickStartingEcho,
  serializeArtifacts,
  type TimelineArtifact,
} from "./echoes";
import { createDefaultGameState, createSession } from "./session";

function makeSession(inventory: Item[], epoch?: number) {
  const gameState = {
    ...createDefaultGameState(1, "char-1", "Alice Moretti", "A clerk", epoch),
    inventory,
  };
  return createSession(gameState, "session-1");
}

function makeArtifact(overrides: Partial<TimelineArtifact> = {}): TimelineArtifact {
  return {
    id: "artifact-1",
    name: "Seer formula",
    description: "A recipe in faded ink.",
    originEpoch: 5,
    originCharacter: "Alice Moretti",
    originFate: "dead",
    createdAt: 1000,
    ...overrides,
  };
}

const FORMULA: Item = {
  name: "Seer potion formula",
  description: "Lavos squid blood, meteor crystal.",
  category: "potion-formula",
};

const TRINKET: Item = {
  name: "Brass monocle",
  description: "Cracked across one lens.",
  category: "supplementary-ingredient",
};

describe("mintArtifact", () => {
  it("prefers a potion formula as the signature possession", () => {
    const session = makeSession([TRINKET, FORMULA]);
    const legacy = buildLegacy(session, "fatal", 1000);
    const artifact = mintArtifact(session, legacy, 2000, "id-1");
    expect(artifact.name).toBe("Seer potion formula");
    expect(artifact.description).toContain("belonged to Alice Moretti");
    expect(artifact.originFate).toBe("dead");
    expect(artifact.originEpoch).toBe(5);
    expect(artifact.id).toBe("id-1");
    expect(artifact.createdAt).toBe(2000);
  });

  it("falls back to the first carried item without a formula", () => {
    const session = makeSession([TRINKET]);
    const legacy = buildLegacy(session, "transformation", 1000);
    const artifact = mintArtifact(session, legacy, 2000, "id-2");
    expect(artifact.name).toBe("Brass monocle");
    expect(artifact.originFate).toBe("transformed");
  });

  it("mints the character's journal when nothing is carried", () => {
    const session = makeSession([]);
    const legacy = buildLegacy(session, "fatal", 1000);
    const artifact = mintArtifact(session, legacy, 2000, "id-3");
    expect(artifact.name).toBe("Alice Moretti's weathered journal");
    expect(artifact.description).toContain("last entry unfinished");
  });

  it("records the session's epoch and handles a nameless fallen", () => {
    const session = makeSession([], 2);
    const legacy = { ...buildLegacy(session, "fatal", 1000) };
    delete legacy.characterName;
    const artifact = mintArtifact(session, legacy, 2000, "id-4");
    expect(artifact.originEpoch).toBe(2);
    expect(artifact.name).toBe("a nameless Beyonder's weathered journal");
  });

  it("generates id and timestamp by default", () => {
    const session = makeSession([]);
    const legacy = buildLegacy(session, "fatal", 1000);
    const artifact = mintArtifact(session, legacy);
    expect(artifact.id).toMatch(/[0-9a-f-]{36}/);
    expect(artifact.createdAt).toBeGreaterThan(0);
  });
});

describe("discoverableArtifacts", () => {
  const artifacts = [
    makeArtifact({ id: "a", originEpoch: 1 }),
    makeArtifact({ id: "b", originEpoch: 3 }),
    makeArtifact({ id: "c", originEpoch: 5 }),
  ];

  it("enforces the paradox guard — nothing from a later epoch", () => {
    expect(discoverableArtifacts(artifacts, 3).map((a) => a.id)).toEqual(["a", "b"]);
    expect(discoverableArtifacts(artifacts, 1).map((a) => a.id)).toEqual(["a"]);
  });

  it("treats an undefined epoch as the Fifth (everything surfaces)", () => {
    expect(discoverableArtifacts(artifacts, undefined)).toHaveLength(3);
  });
});

describe("artifactToItem", () => {
  it("carries the provenance into the item", () => {
    const item = artifactToItem(makeArtifact());
    expect(item.name).toBe("Seer formula");
    expect(item.description).toContain("faded ink");
    // An echo is a keepsake, not an advancement reagent (issue #90).
    expect(item.category).toBe("mundane");
  });
});

describe("echoFacts", () => {
  it("foreshadows up to three echoes and excludes the carried one", () => {
    const artifacts = [
      makeArtifact({ id: "a" }),
      makeArtifact({ id: "b", originFate: "transformed" }),
      makeArtifact({ id: "c" }),
      makeArtifact({ id: "d" }),
      makeArtifact({ id: "e" }),
    ];
    const carried = artifacts[0];
    const facts = echoFacts(artifacts, carried);
    // 3 foreshadow facts (a excluded) + 1 carried item fact.
    expect(facts).toHaveLength(4);
    expect(facts[0].type).toBe("event");
    expect(facts[0].description).toContain("was transformed");
    expect(facts[3].type).toBe("item-change");
    expect(facts[3].description).toContain("Begins the story carrying Seer formula");
    expect(facts.every((fact) => fact.turnNumber === 0)).toBe(true);
  });

  it("mentions the era for non-Fifth artifacts and 'died' for the dead", () => {
    const facts = echoFacts([makeArtifact({ originEpoch: 2 })], null);
    expect(facts).toHaveLength(1);
    expect(facts[0].description).toContain("died");
    expect(facts[0].description).toContain("epoch 2 era");
  });

  it("returns nothing for an empty timeline", () => {
    expect(echoFacts([], null)).toEqual([]);
  });
});

describe("pickStartingEcho", () => {
  const artifacts = [
    makeArtifact({ id: "a", originEpoch: 1 }),
    makeArtifact({ id: "b", originEpoch: 5 }),
  ];

  it("returns null when the roll fails", () => {
    expect(pickStartingEcho(artifacts, 5, () => 0)).toBeNull();
    expect(pickStartingEcho(artifacts, 5, () => 0.49)).toBeNull();
  });

  it("picks deterministically among discoverable artifacts when the roll passes", () => {
    const rolls = [0.9, 0];
    const echo = pickStartingEcho(artifacts, 5, () => rolls.shift() ?? 0);
    expect(echo?.id).toBe("a");
    const lateRolls = [0.9, 0.99];
    const last = pickStartingEcho(artifacts, 5, () => lateRolls.shift() ?? 0);
    expect(last?.id).toBe("b");
  });

  it("respects the paradox guard before rolling", () => {
    const futureOnly = [makeArtifact({ id: "x", originEpoch: 5 })];
    expect(pickStartingEcho(futureOnly, 2, () => 0.99)).toBeNull();
    expect(pickStartingEcho([], 5, () => 0.99)).toBeNull();
  });
});

describe("serialization", () => {
  it("round-trips a valid list", () => {
    const artifacts = [
      makeArtifact(),
      makeArtifact({ id: "2", originFate: "transformed" }),
    ];
    expect(deserializeArtifacts(serializeArtifacts(artifacts))).toEqual(artifacts);
  });

  it("rejects malformed payloads", () => {
    expect(deserializeArtifacts("not json")).toBeNull();
    expect(deserializeArtifacts('{"a":1}')).toBeNull();
    expect(deserializeArtifacts('[{"id":"x"}]')).toBeNull();
    expect(
      deserializeArtifacts(
        JSON.stringify([{ ...makeArtifact(), originFate: "ascended" }]),
      ),
    ).toBeNull();
    expect(
      deserializeArtifacts(JSON.stringify([{ ...makeArtifact(), originEpoch: "five" }])),
    ).toBeNull();
  });
});
