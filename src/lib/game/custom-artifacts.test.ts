import { describe, expect, it } from "vitest";

import type { ArtifactEffect } from "@/lib/lore";

import {
  type CustomArtifact,
  type CustomArtifactState,
  CUSTOM_ARTIFACT_NAME_CAP,
  MAX_CUSTOM_ARTIFACTS,
  craftedArtifactFact,
  customArtifactForItem,
  emptyCustomArtifactState,
  findCustomArtifact,
  forgetCustomArtifact,
  isValidCustomArtifactShape,
  isValidCustomArtifactStateShape,
  mintCustomArtifactItem,
  nextCustomArtifactCode,
  registerCustomArtifact,
  resolveCustomArtifactState,
} from "./custom-artifacts";
import { createDefaultGameState, createSession } from "./session";
import type { GameSession } from "./types";

const sampleEffects: ArtifactEffect[] = [
  { label: "New Face", description: "Wear another's face.", hook: "identity" },
];

function sampleArtifact(over: Partial<CustomArtifact> = {}): CustomArtifact {
  return {
    code: "C2-001",
    name: "Maker's Mask",
    grade: 2,
    sourcePathwayId: 1,
    sourceSequence: 5,
    effects: sampleEffects,
    drawback: "It frays the wearer.",
    craftedAtTurn: 0,
    ...over,
  };
}

function sessionWith(state: CustomArtifactState | undefined): GameSession {
  const base = createDefaultGameState(1, "c1", "Tester");
  const session = createSession(base, "s1");
  return state ? { ...session, customArtifactState: state } : session;
}

describe("custom-artifact state helpers", () => {
  it("emptyCustomArtifactState / resolve default", () => {
    expect(emptyCustomArtifactState()).toEqual({ artifacts: [], nextOrdinal: 1 });
    expect(resolveCustomArtifactState(undefined)).toEqual({
      artifacts: [],
      nextOrdinal: 1,
    });
    const s = { artifacts: [sampleArtifact()], nextOrdinal: 2 };
    expect(resolveCustomArtifactState(s)).toBe(s);
  });

  it("nextCustomArtifactCode embeds the grade and a padded ordinal", () => {
    expect(nextCustomArtifactCode(emptyCustomArtifactState(), 3)).toBe("C3-001");
    expect(nextCustomArtifactCode({ artifacts: [], nextOrdinal: 42 }, 0)).toBe("C0-042");
  });
});

describe("mintCustomArtifactItem", () => {
  it("mints a self-describing, non-consumable sealed-artifact item", () => {
    const item = mintCustomArtifactItem(sampleArtifact());
    expect(item.category).toBe("sealed-artifact");
    expect(item.name).toBe("Sealed Artifact C2-001 — Maker's Mask");
    expect(item.consumable).toBe(false);
    expect(item.description).toContain("Grade 2");
    expect(item.description).toContain("New Face");
    expect(item.description).toContain("It frays the wearer.");
  });

  it("includes flavour and tolerates an effect-less artifact", () => {
    const item = mintCustomArtifactItem(
      sampleArtifact({ flavor: "A pewter domino mask.", effects: [] }),
    );
    expect(item.description).toContain("A pewter domino mask.");
    expect(item.description).not.toContain("Powers:");
  });
});

describe("lookups", () => {
  it("findCustomArtifact / customArtifactForItem resolve by embedded code", () => {
    const state: CustomArtifactState = { artifacts: [sampleArtifact()], nextOrdinal: 2 };
    const session = sessionWith(state);
    expect(findCustomArtifact(session, "C2-001")?.name).toBe("Maker's Mask");
    expect(findCustomArtifact(session, "C9-999")).toBeUndefined();

    const item = mintCustomArtifactItem(sampleArtifact());
    expect(customArtifactForItem(item, state)?.code).toBe("C2-001");
    // A catalogue (non-crafted) artifact code is not in the registry.
    expect(
      customArtifactForItem(
        {
          name: "Sealed Artifact 2-049 — Puppet",
          description: "",
          category: "sealed-artifact",
        },
        state,
      ),
    ).toBeUndefined();
    // A non-artifact item.
    expect(
      customArtifactForItem(
        { name: "Honey", description: "", category: "mundane" },
        state,
      ),
    ).toBeUndefined();
    // No state at all.
    expect(customArtifactForItem(item, undefined)).toBeUndefined();
  });
});

describe("registerCustomArtifact", () => {
  it("registers, allocates a code, and bumps nextOrdinal", () => {
    const result = registerCustomArtifact(
      emptyCustomArtifactState(),
      {
        name: "  Maker's Mask  ",
        grade: 2,
        sourcePathwayId: 1,
        sourceSequence: 5,
        effects: sampleEffects,
        drawback: "It frays the wearer.",
        flavor: "  A mask.  ",
        ownerName: "  Klein  ",
      },
      7,
    );
    expect(result.outcome).toBe("registered");
    expect(result.artifact?.code).toBe("C2-001");
    expect(result.artifact?.name).toBe("Maker's Mask");
    expect(result.artifact?.flavor).toBe("A mask.");
    expect(result.artifact?.ownerName).toBe("Klein");
    expect(result.artifact?.craftedAtTurn).toBe(7);
    expect(result.state?.nextOrdinal).toBe(2);
    expect(result.state?.artifacts).toHaveLength(1);
  });

  it("rejects a blank name and a full registry", () => {
    expect(
      registerCustomArtifact(
        emptyCustomArtifactState(),
        {
          name: "   ",
          grade: 1,
          sourcePathwayId: 1,
          sourceSequence: 4,
          effects: [],
          drawback: "x",
        },
        0,
      ).outcome,
    ).toBe("missing-name");

    const full: CustomArtifactState = {
      artifacts: Array.from({ length: MAX_CUSTOM_ARTIFACTS }, (_, i) =>
        sampleArtifact({ code: `C1-${String(i).padStart(3, "0")}` }),
      ),
      nextOrdinal: MAX_CUSTOM_ARTIFACTS + 1,
    };
    expect(
      registerCustomArtifact(
        full,
        {
          name: "Overflow",
          grade: 1,
          sourcePathwayId: 1,
          sourceSequence: 4,
          effects: [],
          drawback: "x",
        },
        0,
      ).outcome,
    ).toBe("at-capacity");
  });

  it("truncates an over-long name to the cap", () => {
    const long = "z".repeat(CUSTOM_ARTIFACT_NAME_CAP + 20);
    const result = registerCustomArtifact(
      emptyCustomArtifactState(),
      {
        name: long,
        grade: 0,
        sourcePathwayId: 2,
        sourceSequence: 2,
        effects: [],
        drawback: "x",
      },
      0,
    );
    expect(result.artifact?.name.length).toBe(CUSTOM_ARTIFACT_NAME_CAP);
  });
});

describe("forgetCustomArtifact", () => {
  it("drops a code and no-ops on an absent one", () => {
    const state: CustomArtifactState = { artifacts: [sampleArtifact()], nextOrdinal: 2 };
    expect(forgetCustomArtifact(state, "C2-001").artifacts).toHaveLength(0);
    expect(forgetCustomArtifact(state, "C9-999")).toBe(state);
  });
});

describe("craftedArtifactFact", () => {
  it("records the relic and its drawback", () => {
    const fact = craftedArtifactFact(sampleArtifact(), 3);
    expect(fact.type).toBe("event");
    expect(fact.turnNumber).toBe(3);
    expect(fact.description).toContain("Maker's Mask");
    expect(fact.description).toContain("New Face");
    expect(fact.description).toContain("It frays the wearer.");
  });
});

describe("shape validation", () => {
  it("accepts a well-formed artifact and state", () => {
    expect(isValidCustomArtifactShape(sampleArtifact())).toBe(true);
    expect(
      isValidCustomArtifactStateShape({ artifacts: [sampleArtifact()], nextOrdinal: 1 }),
    ).toBe(true);
  });

  it("rejects malformed artifacts", () => {
    expect(isValidCustomArtifactShape(null)).toBe(false);
    expect(isValidCustomArtifactShape(sampleArtifact({ code: "2-049" }))).toBe(false);
    expect(isValidCustomArtifactShape(sampleArtifact({ name: "" }))).toBe(false);
    expect(isValidCustomArtifactShape(sampleArtifact({ grade: 5 as never }))).toBe(false);
    expect(isValidCustomArtifactShape(sampleArtifact({ sourcePathwayId: 1.5 }))).toBe(
      false,
    );
    expect(isValidCustomArtifactShape(sampleArtifact({ sourceSequence: 9.5 }))).toBe(
      false,
    );
    expect(
      isValidCustomArtifactShape(
        sampleArtifact({ effects: [{ label: "", description: "", hook: "narrator" }] }),
      ),
    ).toBe(false);
    expect(isValidCustomArtifactShape(sampleArtifact({ effects: "x" as never }))).toBe(
      false,
    );
    expect(isValidCustomArtifactShape(sampleArtifact({ drawback: 5 as never }))).toBe(
      false,
    );
    expect(isValidCustomArtifactShape(sampleArtifact({ flavor: 5 as never }))).toBe(
      false,
    );
    expect(isValidCustomArtifactShape(sampleArtifact({ ownerName: 5 as never }))).toBe(
      false,
    );
    expect(
      isValidCustomArtifactShape(sampleArtifact({ craftedAtTurn: Number.NaN })),
    ).toBe(false);
    // A non-string effect description and a missing hook are also rejected.
    expect(
      isValidCustomArtifactShape(
        sampleArtifact({
          effects: [{ label: "x", description: 1 as never, hook: "narrator" }],
        }),
      ),
    ).toBe(false);
    expect(
      isValidCustomArtifactShape(
        sampleArtifact({
          effects: [{ label: "x", description: "y", hook: "" as never }],
        }),
      ),
    ).toBe(false);
  });

  it("rejects malformed state", () => {
    expect(isValidCustomArtifactStateShape(null)).toBe(false);
    expect(isValidCustomArtifactStateShape({ artifacts: "x", nextOrdinal: 1 })).toBe(
      false,
    );
    expect(isValidCustomArtifactStateShape({ artifacts: [], nextOrdinal: 0 })).toBe(
      false,
    );
    expect(
      isValidCustomArtifactStateShape({ artifacts: [{ bad: true }], nextOrdinal: 1 }),
    ).toBe(false);
  });

  it("validates an effect's optional params object", () => {
    expect(
      isValidCustomArtifactShape(
        sampleArtifact({
          effects: [{ label: "x", description: "y", hook: "combat", params: { a: 1 } }],
        }),
      ),
    ).toBe(true);
    expect(
      isValidCustomArtifactShape(
        sampleArtifact({
          effects: [
            { label: "x", description: "y", hook: "combat", params: [] as never },
          ],
        }),
      ),
    ).toBe(false);
  });
});
