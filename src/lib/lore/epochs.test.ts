import { describe, expect, it } from "vitest";

import {
  epochNarrationDirective,
  epochOpeningBeat,
  getEpoch,
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
  it("the Fifth is the baseline: no extra directive, default opening", () => {
    expect(epochNarrationDirective(5)).toBeNull();
    expect(epochNarrationDirective(undefined)).toBeNull();
    expect(epochOpeningBeat(5)).toBeNull();
  });

  it("other epochs carry a tone directive and an opening beat", () => {
    for (const id of [1, 2, 3, 4] as const) {
      expect(epochNarrationDirective(id)).toContain("tone:");
      expect(epochOpeningBeat(id)).toContain("Describe the opening scene");
    }
    expect(epochNarrationDirective(2)).toContain("inhuman");
  });
});
