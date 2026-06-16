import { describe, expect, it } from "vitest";

import {
  activeIdentity,
  adjustReputation,
  applyExposure,
  checkExposure,
  createIdentity,
  createIdentityState,
  detectAssumeIdentityIntent,
  discardIdentity,
  hasPreparedIdentity,
  identityCapability,
  identityPromptContext,
  isFateProof,
  isValidIdentityStateShape,
  recordIdentityUse,
  switchIdentity,
  ASSUME_VIA_PANEL_NARRATIVE,
  DISGUISE_EXPOSURE_MULTIPLIER,
  EXPOSURE_EVENT_THRESHOLD,
  EXPOSURE_PER_NEW_NPC,
  EXPOSURE_PER_USE,
  UNPREPARED_IDENTITY_NARRATIVE,
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
    expect(identityCapability(8, 8)).toBe("full"); // Error: Swindler
    expect(identityCapability(8, 6)).toBe("full");
  });

  it("unlocks the flawless tier for the high transformation sequences", () => {
    expect(identityCapability(1, 6)).toBe("flawless"); // Fool: Faceless
    expect(identityCapability(1, 5)).toBe("flawless");
    expect(identityCapability(8, 5)).toBe("flawless"); // Error: Dream Stealer
    expect(identityCapability(8, 4)).toBe("flawless");
  });

  it("marks only the Dream Stealer line as fate-proof", () => {
    expect(isFateProof(8, 5)).toBe(true);
    expect(isFateProof(8, 6)).toBe(false);
    expect(isFateProof(1, 6)).toBe(false); // Faceless is flawless but not fate-proof
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

describe("hasPreparedIdentity", () => {
  it("is false on a fresh state and true once a persona exists", () => {
    expect(hasPreparedIdentity(createIdentityState())).toBe(false);
    expect(hasPreparedIdentity(fullState())).toBe(true);
  });
});

describe("detectAssumeIdentityIntent", () => {
  it("catches assume-a-persona phrasings", () => {
    for (const input of [
      "I assume my false identity",
      "I want to wear a disguise now",
      "put on the persona of a dockworker",
      "I slip into the identity of the dead clerk",
      "take on the alias I prepared",
      "I adopt the guise of a noble",
    ]) {
      expect(detectAssumeIdentityIntent(input)).toBe(true);
    }
  });

  it("leaves ordinary actions alone", () => {
    for (const input of [
      "I walk to the harbour and look around",
      "I ask the sailor about the missing ship",
      "I draw my revolver and aim at the door",
      "I wear my coat against the cold",
      // Investigation, not assumption — must not be caught.
      "I try to find out the identity of the thief",
      "I uncover the persona behind the letters",
      "",
      "   ",
    ]) {
      expect(detectAssumeIdentityIntent(input)).toBe(false);
    }
  });
});

describe("assume-identity narration", () => {
  it("reads in-world, never as an error message", () => {
    for (const line of [UNPREPARED_IDENTITY_NARRATIVE, ASSUME_VIA_PANEL_NARRATIVE]) {
      expect(line.length).toBeGreaterThan(20);
      expect(line).not.toMatch(/error|invalid|failed|denied/i);
    }
    expect(UNPREPARED_IDENTITY_NARRATIVE).toMatch(/character sheet/i);
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

describe("flawless tier", () => {
  function flawlessState(fateProof = false): IdentityState {
    let state = createIdentityState();
    state = createIdentity(
      state,
      fields("The Stranger"),
      "flawless",
      1000,
      "f-1",
      fateProof,
    );
    return switchIdentity(state, "f-1");
  }

  it("creates a real, separate person — never a disguise, marked flawless", () => {
    const active = activeIdentity(flawlessState())!;
    expect(active.flawless).toBe(true);
    expect(active.activeDisguise).toBe(false);
    expect(active.fateProof).toBeUndefined();
  });

  it("allows multiple flawless personas (no basic cap)", () => {
    let state = createIdentityState();
    state = createIdentity(state, fields("Face One"), "flawless", 1, "a");
    state = createIdentity(state, fields("Face Two"), "flawless", 2, "b");
    expect(state.identities).toHaveLength(2);
  });

  it("accrues NO exposure risk but still records witnesses", () => {
    let state = flawlessState();
    state = recordIdentityUse(state, ["Dunn Smith", "Old Neil"]);
    const active = activeIdentity(state)!;
    expect(active.knownBy).toEqual(["Dunn Smith", "Old Neil"]);
    expect(active.exposureRisk).toBe(0);
  });

  it("is never connected to another face by a mundane NPC", () => {
    let state = createIdentityState();
    state = createIdentity(state, fields("The Stranger"), "flawless", 1, "f-1");
    state = createIdentity(state, fields("Sherlock Moriarty"), "full", 2, "id-2");
    // A shared witness knows both faces.
    state = switchIdentity(state, "id-2");
    state = recordIdentityUse(state, ["Leonard Mitchell"]);
    state = switchIdentity(state, "f-1");
    state = recordIdentityUse(state, ["Leonard Mitchell"]);
    // Even with a forced roll, a flawless persona never exposes.
    expect(checkExposure(state, () => 0)).toBeNull();
  });

  it("narrates a flawless persona as a real person, fate-proof when applicable", () => {
    const plain = identityPromptContext(flawlessState())!;
    expect(plain).toContain("FLAWLESS");
    expect(plain).toContain("real, separate person");
    expect(plain).not.toContain("divination");

    const fated = identityPromptContext(flawlessState(true))!;
    expect(fated).toContain("divination and fate-reading");
  });

  it("persists the flawless and fateProof flags", () => {
    const state = flawlessState(true);
    state.identities[0].fateProof = true;
    expect(isValidIdentityStateShape(state)).toBe(true);
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
