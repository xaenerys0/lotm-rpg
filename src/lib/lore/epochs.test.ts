import { describe, expect, it } from "vitest";

import {
  epochNarrationDirective,
  epochOpeningBeat,
  getEpoch,
  passesEpochGate,
  DEFAULT_EPOCH_ID,
  EPOCHS,
} from "./epochs";

describe("EPOCHS", () => {
  it("covers all five epochs with player-safe pitches", () => {
    expect(EPOCHS.map((epoch) => epoch.id)).toEqual([1, 2, 3, 4, 5]);
    for (const epoch of EPOCHS) {
      expect(epoch.name.length).toBeGreaterThan(0);
      expect(epoch.summary.length).toBeGreaterThan(40);
      expect(epoch.startingLocation.length).toBeGreaterThan(0);
      expect(epoch.dangerModifier).toBeGreaterThanOrEqual(1);
    }
  });

  it("earlier epochs are harsher worlds", () => {
    expect(getEpoch(1).dangerModifier).toBeGreaterThan(getEpoch(5).dangerModifier);
    expect(getEpoch(2).dangerModifier).toBeGreaterThan(getEpoch(4).dangerModifier);
  });
});

describe("getEpoch", () => {
  it("defaults unknown/missing ids to the Fifth", () => {
    expect(getEpoch(undefined).id).toBe(DEFAULT_EPOCH_ID);
    expect(getEpoch(99).id).toBe(DEFAULT_EPOCH_ID);
    expect(getEpoch(3).era).toBe("Cataclysm Epoch");
  });
});

describe("narration & openings", () => {
  it("the Fifth is the baseline tone, but still seeds an awakening opening", () => {
    expect(epochNarrationDirective(5)).toBeNull();
    expect(epochNarrationDirective(undefined)).toBeNull();
    // The Fifth no longer falls back to the generic "I begin my journey as a
    // Sequence 9 Fool" line — it opens on an awakening from the prologue potion.
    expect(epochOpeningBeat(5)).toContain("Describe the opening scene");
    expect(epochOpeningBeat(5)).toContain("potion");
    expect(epochOpeningBeat(undefined)).toContain("Describe the opening scene");
  });

  it("every epoch seeds an awakening opening beat", () => {
    for (const id of [1, 2, 3, 4, 5] as const) {
      expect(epochOpeningBeat(id)).toContain("Describe the opening scene");
    }
  });

  it("the pre-Iron-Age epochs carry a tone directive", () => {
    for (const id of [1, 2, 3, 4] as const) {
      expect(epochNarrationDirective(id)).toContain("tone:");
    }
    expect(epochNarrationDirective(2)).toContain("inhuman");
  });
});

describe("passesEpochGate", () => {
  it("treats untagged entries as universal — they pass for every epoch", () => {
    for (const c of [1, 2, 3, 4, 5, undefined, null]) {
      expect(passesEpochGate(undefined, c)).toBe(true);
      expect(passesEpochGate(null, c)).toBe(true);
    }
  });

  it("passes a tagged entry only on an exact epoch match", () => {
    expect(passesEpochGate(1, 1)).toBe(true);
    expect(passesEpochGate(1, 2)).toBe(false);
    expect(passesEpochGate(5, 1)).toBe(false);
    expect(passesEpochGate(3, 3)).toBe(true);
  });

  it("defaults an absent character epoch to the Fifth", () => {
    expect(passesEpochGate(5, undefined)).toBe(true);
    expect(passesEpochGate(5, null)).toBe(true);
    expect(passesEpochGate(DEFAULT_EPOCH_ID, undefined)).toBe(true);
    expect(passesEpochGate(1, undefined)).toBe(false);
  });
});
