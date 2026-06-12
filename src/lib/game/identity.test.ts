import { describe, expect, it } from "vitest";

import {
  activeIdentity,
  adjustReputation,
  applyExposure,
  checkExposure,
  createIdentity,
  createIdentityState,
  discardIdentity,
  identityCapability,
  identityPromptContext,
  isValidIdentityStateShape,
  recordIdentityUse,
  switchIdentity,
  DISGUISE_EXPOSURE_MULTIPLIER,
  EXPOSURE_EVENT_THRESHOLD,
  EXPOSURE_PER_NEW_NPC,
  EXPOSURE_PER_USE,
  type IdentityState,
} from "./identity";

const fields = (name = "Sherlock Moriarty") => ({
  name,
  appearance: "A lean detective in a grey coat",
  socialClass: "middle" as const,
  backstory: "A consulting detective newly arrived in the city.",
});

function fullState(): IdentityState {
  let state = createIdentityState();
  state = createIdentity(state, fields(), "full", 1000, "id-1");
  state = createIdentity(state, fields("Dwayne Dantès"), "full", 2000, "id-2");
  return state;
}

describe("identityCapability", () => {
  it("unlocks full management at the pathway's canonical threshold", () => {
    expect(identityCapability(1, 9)).toBe("basic"); // Seer
    expect(identityCapability(1, 6)).toBe("full"); // Faceless
    expect(identityCapability(1, 5)).toBe("full");
    expect(identityCapability(8, 8)).toBe("full"); // Error: Swindler
  });

  it("everyone else gets the basic disguise tier", () => {
    expect(identityCapability(3, 5)).toBe("basic");
    expect(identityCapability(99, 1)).toBe("basic");
  });
});

describe("createIdentity / discardIdentity / switchIdentity", () => {
  it("creates persistent personas under full capability", () => {
    const state = fullState();
    expect(state.identities).toHaveLength(2);
    expect(state.identities[0]).toMatchObject({
      name: "Sherlock Moriarty",
      activeDisguise: false,
      exposureRisk: 0,
      reputation: {},
      knownBy: [],
    });
  });

  it("caps basic capability at one surface-level disguise", () => {
    let state = createIdentityState();
    state = createIdentity(state, fields(), "basic", 1000, "id-1");
    expect(state.identities[0].activeDisguise).toBe(true);
    expect(() => createIdentity(state, fields("Other"), "basic")).toThrow(
      /one disguise at a time/,
    );
  });

  it("rejects blank and duplicate names", () => {
    const state = fullState();
    expect(() => createIdentity(state, fields("  "), "full")).toThrow(/needs a name/);
    expect(() => createIdentity(state, fields("sherlock moriarty"), "full")).toThrow(
      /already one of your faces/,
    );
  });

  it("switching is deliberate, validated, and reversible to the true face", () => {
    let state = fullState();
    state = switchIdentity(state, "id-2");
    expect(activeIdentity(state)?.name).toBe("Dwayne Dantès");
    state = switchIdentity(state, null);
    expect(activeIdentity(state)).toBeNull();
    expect(() => switchIdentity(state, "nope")).toThrow(/Unknown identity/);
  });

  it("discarding clears the active pointer when needed", () => {
    let state = switchIdentity(fullState(), "id-1");
    state = discardIdentity(state, "id-1");
    expect(state.identities.map((i) => i.id)).toEqual(["id-2"]);
    expect(state.activeIdentityId).toBeNull();
  });
});

describe("recordIdentityUse (NPC awareness)", () => {
  it("NPCs learn the active face and risk accrues", () => {
    let state = switchIdentity(fullState(), "id-1");
    state = recordIdentityUse(state, ["Dunn Smith", "Old Neil"]);
    const active = activeIdentity(state);
    expect(active?.knownBy).toEqual(["Dunn Smith", "Old Neil"]);
    expect(active?.exposureRisk).toBe(EXPOSURE_PER_USE + 2 * EXPOSURE_PER_NEW_NPC);
    // Known NPCs do not re-accrue the new-NPC cost.
    const again = recordIdentityUse(state, ["Dunn Smith"]);
    expect(activeIdentity(again)?.exposureRisk).toBe(
      EXPOSURE_PER_USE * 2 + 2 * EXPOSURE_PER_NEW_NPC,
    );
  });

  it("does not cross-reference other identities", () => {
    let state = switchIdentity(fullState(), "id-1");
    state = recordIdentityUse(state, ["Dunn Smith"]);
    expect(state.identities.find((i) => i.id === "id-2")?.knownBy).toEqual([]);
  });

  it("a surface disguise frays twice as fast", () => {
    let state = createIdentityState();
    state = createIdentity(state, fields(), "basic", 1000, "d-1");
    state = switchIdentity(state, "d-1");
    state = recordIdentityUse(state, ["Dunn Smith"]);
    expect(activeIdentity(state)?.exposureRisk).toBe(
      DISGUISE_EXPOSURE_MULTIPLIER * (EXPOSURE_PER_USE + EXPOSURE_PER_NEW_NPC),
    );
  });

  it("is a no-op with no active identity and caps risk at 100", () => {
    const state = fullState();
    expect(recordIdentityUse(state, ["Dunn Smith"])).toBe(state);
    let risky = switchIdentity(state, "id-1");
    for (let i = 0; i < 60; i++) risky = recordIdentityUse(risky, [`npc-${i}`]);
    expect(activeIdentity(risky)?.exposureRisk).toBe(100);
  });
});

describe("adjustReputation", () => {
  it("tracks per-identity standing, clamped to [-100, 100]", () => {
    let state = fullState();
    state = adjustReputation(state, "id-1", "Nighthawks", 30);
    state = adjustReputation(state, "id-1", "Nighthawks", -160);
    state = adjustReputation(state, "id-2", "Nighthawks", 10);
    expect(state.identities[0].reputation.Nighthawks).toBe(-100);
    expect(state.identities[1].reputation.Nighthawks).toBe(10);
    expect(adjustReputation(state, "nope", "x", 5)).toBe(state);
  });
});

describe("exposure", () => {
  function riskyState(): IdentityState {
    let state = switchIdentity(fullState(), "id-1");
    // Both faces known by the same witness.
    state = recordIdentityUse(state, ["Leonard Mitchell"]);
    state = switchIdentity(state, "id-2");
    state = recordIdentityUse(state, ["Leonard Mitchell"]);
    state = switchIdentity(state, "id-1");
    for (let i = 0; i < 30; i++) state = recordIdentityUse(state, []);
    return state;
  }

  it("stays quiet below the risk threshold", () => {
    const calm = switchIdentity(fullState(), "id-1");
    expect(activeIdentity(calm)!.exposureRisk).toBeLessThan(EXPOSURE_EVENT_THRESHOLD);
    expect(checkExposure(calm, () => 0)).toBeNull();
  });

  it("a shared witness can connect two faces once risk runs high", () => {
    const state = riskyState();
    const event = checkExposure(state, () => 0);
    expect(event).toEqual({ npc: "Leonard Mitchell", identityIds: ["id-1", "id-2"] });
    // The roll can also spare you.
    expect(checkExposure(state, () => 0.99)).toBeNull();
  });

  it("applyExposure links the faces, dents both reputations, and resets risk", () => {
    const state = riskyState();
    const event = checkExposure(state, () => 0)!;
    const after = applyExposure(state, event);
    const [a, b] = after.identities;
    expect(a.exposedTo).toContain("Leonard Mitchell");
    expect(b.exposedTo).toContain("Leonard Mitchell");
    expect(a.reputation["Leonard Mitchell"]).toBe(-20);
    expect(b.reputation["Leonard Mitchell"]).toBe(-20);
    expect(activeIdentity(after)?.exposureRisk).toBe(30);
    // The same witness cannot expose the same pair twice.
    expect(checkExposure(after, () => 0)).toBeNull();
  });
});

describe("identityPromptContext", () => {
  it("describes the active persona as presentation, not truth", () => {
    const state = switchIdentity(fullState(), "id-1");
    const context = identityPromptContext(state)!;
    expect(context).toContain('"Sherlock Moriarty"');
    expect(context).toContain("middle class");
    expect(context).toContain("not the character's true self");
    expect(identityPromptContext(fullState())).toBeNull();
  });
});

describe("isValidIdentityStateShape", () => {
  it("accepts persisted state and rejects malformed payloads", () => {
    expect(isValidIdentityStateShape(fullState())).toBe(true);
    expect(isValidIdentityStateShape(null)).toBe(false);
    expect(isValidIdentityStateShape({ identities: "x", activeIdentityId: null })).toBe(
      false,
    );
    expect(
      isValidIdentityStateShape({ identities: [{ id: 1 }], activeIdentityId: null }),
    ).toBe(false);
    expect(isValidIdentityStateShape({ identities: [], activeIdentityId: 5 })).toBe(
      false,
    );
  });
});
