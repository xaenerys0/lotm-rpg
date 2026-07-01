import { describe, expect, it } from "vitest";

import { getCumulativeAbilities } from "@/lib/rules";

import {
  fusedRetainedAbilities,
  hasSwitchedPathways,
  isValidPathwayLineageShape,
  makePathwaySwitch,
  recordPathwaySwitch,
  retainedAbilitiesFor,
  type PathwayLineageState,
  type PathwaySwitch,
} from "./pathway-lineage";
import { createDefaultGameState, createSession } from "./session";

function switchEntry(overrides: Partial<PathwaySwitch> = {}): PathwaySwitch {
  return {
    fromPathwayId: 2,
    atSequence: 4,
    kind: "neighboring",
    switchTurn: 3,
    retained: [{ name: "X", description: "old", type: "passive", sourceLevel: 5 }],
    ...overrides,
  };
}

describe("retainedAbilitiesFor", () => {
  it("keeps only the abilities sourced ABOVE the switch rung (the loss rule)", () => {
    const retained = retainedAbilitiesFor(2, 4);
    expect(retained.length).toBeGreaterThan(0);
    // Every kept ability was earned at a shallower rung than the switch (Seq > 4).
    expect(retained.every((a) => a.sourceLevel > 4)).toBe(true);
    // None sourced at the switch rung itself survives — that characteristic is lost.
    expect(retained.some((a) => a.sourceLevel === 4)).toBe(false);
  });

  it("drops exactly the switch-rung abilities from the full cumulative kit", () => {
    const full = getCumulativeAbilities(2, 4);
    const retained = retainedAbilitiesFor(2, 4);
    const droppedNames = full.filter((a) => a.sourceLevel === 4).map((a) => a.name);
    expect(droppedNames.length).toBeGreaterThan(0);
    for (const name of droppedNames) {
      expect(retained.some((a) => a.name === name)).toBe(false);
    }
  });

  it("carries name/description/type/sourceLevel through", () => {
    const [first] = retainedAbilitiesFor(1, 3);
    expect(typeof first.name).toBe("string");
    expect(typeof first.description).toBe("string");
    expect(["passive", "active"]).toContain(first.type);
    expect(Number.isFinite(first.sourceLevel)).toBe(true);
  });
});

describe("makePathwaySwitch", () => {
  it("builds a switch record with the frozen retained snapshot", () => {
    const entry = makePathwaySwitch(2, 4, "neighboring", 7);
    expect(entry.fromPathwayId).toBe(2);
    expect(entry.atSequence).toBe(4);
    expect(entry.kind).toBe("neighboring");
    expect(entry.switchTurn).toBe(7);
    expect(entry.retained).toEqual(retainedAbilitiesFor(2, 4));
    expect(entry.retained.length).toBeGreaterThan(0);
  });
});

describe("recordPathwaySwitch", () => {
  it("creates a fresh lineage from undefined", () => {
    const entry = switchEntry();
    const lineage = recordPathwaySwitch(undefined, entry);
    expect(lineage.switches).toEqual([entry]);
  });

  it("appends to an existing lineage (oldest → newest)", () => {
    const a = switchEntry({ fromPathwayId: 2 });
    const b = switchEntry({ fromPathwayId: 3 });
    const lineage = recordPathwaySwitch(recordPathwaySwitch(undefined, a), b);
    expect(lineage.switches.map((s) => s.fromPathwayId)).toEqual([2, 3]);
  });
});

describe("fusedRetainedAbilities", () => {
  it("returns [] for an absent lineage", () => {
    expect(fusedRetainedAbilities(undefined)).toEqual([]);
  });

  it("dedupes by name, most-recent switch winning", () => {
    const lineage: PathwayLineageState = {
      switches: [
        switchEntry({
          retained: [{ name: "X", description: "old", type: "passive", sourceLevel: 5 }],
        }),
        switchEntry({
          retained: [{ name: "X", description: "new", type: "active", sourceLevel: 6 }],
        }),
      ],
    };
    const fused = fusedRetainedAbilities(lineage);
    expect(fused).toHaveLength(1);
    expect(fused[0].description).toBe("new");
    expect(fused[0].type).toBe("active");
  });

  it("keeps distinct abilities across switches", () => {
    const lineage: PathwayLineageState = {
      switches: [
        switchEntry({
          retained: [{ name: "A", description: "a", type: "passive", sourceLevel: 5 }],
        }),
        switchEntry({
          retained: [{ name: "B", description: "b", type: "active", sourceLevel: 6 }],
        }),
      ],
    };
    const names = fusedRetainedAbilities(lineage).map((a) => a.name);
    expect(names).toContain("A");
    expect(names).toContain("B");
  });
});

describe("hasSwitchedPathways", () => {
  it("is false with no lineage and true with a recorded switch", () => {
    const base = createSession(createDefaultGameState(1, "char-1", "Klein"), "session-1");
    expect(hasSwitchedPathways(base)).toBe(false);
    const switched = {
      ...base,
      pathwayLineage: recordPathwaySwitch(undefined, switchEntry()),
    };
    expect(hasSwitchedPathways(switched)).toBe(true);
  });

  it("is false for an empty switches list", () => {
    const base = createSession(createDefaultGameState(1, "char-1", "Klein"), "session-1");
    expect(hasSwitchedPathways({ ...base, pathwayLineage: { switches: [] } })).toBe(
      false,
    );
  });
});

describe("isValidPathwayLineageShape", () => {
  it("accepts a well-formed lineage", () => {
    expect(isValidPathwayLineageShape({ switches: [switchEntry()] })).toBe(true);
    expect(isValidPathwayLineageShape({ switches: [] })).toBe(true);
  });

  it("rejects non-objects and a non-array switches field", () => {
    expect(isValidPathwayLineageShape(null)).toBe(false);
    expect(isValidPathwayLineageShape([])).toBe(false);
    expect(isValidPathwayLineageShape("x")).toBe(false);
    expect(isValidPathwayLineageShape({ switches: "x" })).toBe(false);
  });

  it("rejects individual bad fields on a switch entry", () => {
    const bad = (patch: Record<string, unknown>) =>
      isValidPathwayLineageShape({ switches: [{ ...switchEntry(), ...patch }] });
    expect(bad({ atSequence: "x" })).toBe(false);
    expect(bad({ switchTurn: "x" })).toBe(false);
    expect(isValidPathwayLineageShape({ switches: [null] })).toBe(false);
    expect(isValidPathwayLineageShape({ switches: [[]] })).toBe(false);
  });

  it("rejects a retained ability with a non-string description", () => {
    expect(
      isValidPathwayLineageShape({
        switches: [
          {
            ...switchEntry(),
            retained: [{ name: "A", description: 5, type: "passive", sourceLevel: 5 }],
          },
        ],
      }),
    ).toBe(false);
    expect(
      isValidPathwayLineageShape({ switches: [{ ...switchEntry(), retained: [null] }] }),
    ).toBe(false);
  });

  it("rejects a malformed switch entry", () => {
    expect(
      isValidPathwayLineageShape({ switches: [{ ...switchEntry(), kind: "bogus" }] }),
    ).toBe(false);
    expect(
      isValidPathwayLineageShape({
        switches: [{ ...switchEntry(), fromPathwayId: "x" }],
      }),
    ).toBe(false);
    expect(
      isValidPathwayLineageShape({ switches: [{ ...switchEntry(), retained: "x" }] }),
    ).toBe(false);
  });

  it("rejects a malformed retained ability", () => {
    expect(
      isValidPathwayLineageShape({
        switches: [
          switchEntry({
            retained: [{ name: "", description: "d", type: "passive", sourceLevel: 5 }],
          }),
        ],
      }),
    ).toBe(false);
    expect(
      isValidPathwayLineageShape({
        switches: [
          {
            ...switchEntry(),
            retained: [{ name: "A", description: "d", type: "bogus", sourceLevel: 5 }],
          },
        ],
      }),
    ).toBe(false);
    expect(
      isValidPathwayLineageShape({
        switches: [
          {
            ...switchEntry(),
            retained: [{ name: "A", description: "d", type: "active", sourceLevel: "x" }],
          },
        ],
      }),
    ).toBe(false);
  });
});
