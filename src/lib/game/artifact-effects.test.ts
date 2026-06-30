import { describe, expect, it } from "vitest";

import { mintArtifactItem, getSealedArtifact } from "@/lib/lore";
import type { Item } from "@/lib/types/rules";

import {
  artifactCombatEffects,
  artifactIdentityCapabilities,
  artifactNarratorContext,
  artifactPowerAcquisitions,
  artifactSanityActions,
  carriedArtifactEffects,
  carriedEffectsByHook,
  deriveArtifactDrawback,
  deriveArtifactEffects,
  effectHookForAbility,
} from "./artifact-effects";
import {
  type CustomArtifact,
  type CustomArtifactState,
  mintCustomArtifactItem,
} from "./custom-artifacts";
import { createDefaultGameState, createSession } from "./session";
import type { GameSession } from "./types";

function sessionWithInventory(
  inventory: Item[],
  customArtifactState?: CustomArtifactState,
): GameSession {
  const base = createDefaultGameState(1, "c1", "Tester");
  const session = createSession({ ...base, inventory }, "s1");
  return customArtifactState ? { ...session, customArtifactState } : session;
}

describe("effectHookForAbility", () => {
  it("routes by keyword, falls back to combat role, then narrator", () => {
    expect(effectHookForAbility("Faceless", "Assume another's face as a disguise")).toBe(
      "identity",
    );
    expect(effectHookForAbility("Prometheus", "Steal a Beyonder power")).toBe(
      "acquired-power",
    );
    expect(effectHookForAbility("Mercy", "Calm and heal a troubled mind")).toBe("sanity");
    expect(effectHookForAbility("Star Descent", "Teleport to a pictured place")).toBe(
      "access",
    );
    expect(effectHookForAbility("Midas", "Conjure fortune and gold")).toBe("funds");
    expect(effectHookForAbility("Smite", "A blade of fire strikes the foe")).toBe(
      "combat",
    );
    expect(effectHookForAbility("Ledger", "Notes the weather politely")).toBe("narrator");
  });
});

describe("deriveArtifactEffects", () => {
  it("derives effects from a real pathway+sequence rung", () => {
    // Fool (1) at Seq 9 has canon abilities — they distil into effects.
    const effects = deriveArtifactEffects(1, 9, 3);
    expect(effects.length).toBeGreaterThan(0);
    expect(effects.length).toBeLessThanOrEqual(3);
    for (const e of effects) {
      expect(e.label.length).toBeGreaterThan(0);
      expect(e.params?.grade).toBe(3);
      expect(e.params?.sourcePathwayId).toBe(1);
    }
  });

  it("falls back to a single narrator effect when a rung has no abilities", () => {
    // An out-of-range sequence has no Sequence data → fallback.
    const effects = deriveArtifactEffects(1, 99, 0);
    expect(effects).toHaveLength(1);
    expect(effects[0].hook).toBe("narrator");
  });
});

describe("deriveArtifactDrawback", () => {
  it("names the pathway and scales severity by grade", () => {
    const g0 = deriveArtifactDrawback(1, 0);
    const g3 = deriveArtifactDrawback(1, 3);
    expect(g0).toContain("Fool");
    expect(g0).not.toBe(g3);
    expect(g0.length).toBeGreaterThan(0);
    expect(g3.length).toBeGreaterThan(0);
  });

  it("handles an unknown pathway gracefully", () => {
    expect(deriveArtifactDrawback(999, 2)).toContain("the pathway");
  });
});

describe("carriedArtifactEffects", () => {
  it("resolves catalogue and crafted artifacts, skips non-artifacts", () => {
    const catalogue = mintArtifactItem(getSealedArtifact("2-081")!); // Ring of Mimicry
    const crafted: CustomArtifact = {
      code: "C2-001",
      name: "Maker's Mask",
      grade: 2,
      sourcePathwayId: 1,
      sourceSequence: 5,
      effects: [
        { label: "New Face", description: "Wear another's face.", hook: "identity" },
      ],
      drawback: "frays",
      craftedAtTurn: 0,
    };
    const craftedItem = mintCustomArtifactItem(crafted);
    const mundane: Item = { name: "Honey", description: "", category: "mundane" };

    const session = sessionWithInventory([catalogue, craftedItem, mundane], {
      artifacts: [crafted],
      nextOrdinal: 2,
    });
    const carried = carriedArtifactEffects(session);
    expect(carried).toHaveLength(2);
    expect(carried.find((c) => c.code === "2-081")?.effects[0].hook).toBe(
      "acquired-power",
    );
    expect(carried.find((c) => c.code === "C2-001")?.effects[0].hook).toBe("identity");
  });

  it("is empty when nothing is carried", () => {
    expect(carriedArtifactEffects(sessionWithInventory([]))).toEqual([]);
  });
});

describe("per-hook surfacing helpers", () => {
  const crafted: CustomArtifact = {
    code: "C2-001",
    name: "Many-Faced Relic",
    grade: 2,
    sourcePathwayId: 1,
    sourceSequence: 5,
    effects: [
      { label: "New Face", description: "Wear another's face.", hook: "identity" },
      { label: "Soothe", description: "Calm a mind.", hook: "sanity" },
      { label: "Smite", description: "A burst of force.", hook: "combat" },
      {
        label: "Copy",
        description: "Mimic a power.",
        hook: "acquired-power",
        params: { acquisition: "ring-of-mimicry" },
      },
    ],
    drawback: "frays",
    craftedAtTurn: 0,
  };
  const session = sessionWithInventory([mintCustomArtifactItem(crafted)], {
    artifacts: [crafted],
    nextOrdinal: 2,
  });

  it("filters by hook and surfaces each system's affordances", () => {
    expect(carriedEffectsByHook(session, "identity")).toHaveLength(1);
    expect(artifactIdentityCapabilities(session)[0].label).toBe("New Face");
    expect(artifactSanityActions(session)[0].label).toBe("Soothe");
    expect(artifactCombatEffects(session)[0].label).toBe("Smite");
    const acq = artifactPowerAcquisitions(session);
    expect(acq[0].acquisition).toBe("ring-of-mimicry");
  });

  it("artifactPowerAcquisitions omits a missing acquisition param", () => {
    const noParam: CustomArtifact = {
      ...crafted,
      code: "C2-002",
      effects: [{ label: "Copy", description: "Mimic a power.", hook: "acquired-power" }],
    };
    const s = sessionWithInventory([mintCustomArtifactItem(noParam)], {
      artifacts: [noParam],
      nextOrdinal: 3,
    });
    expect(artifactPowerAcquisitions(s)[0].acquisition).toBeUndefined();
  });
});

describe("artifactNarratorContext", () => {
  it("is empty with no artifacts and lists every carried effect otherwise", () => {
    expect(artifactNarratorContext(sessionWithInventory([]))).toBe("");

    const catalogue = mintArtifactItem(getSealedArtifact("0-02")!); // Trunsoest Brass Book
    const session = sessionWithInventory([catalogue]);
    const context = artifactNarratorContext(session);
    expect(context).toContain("Sealed Artifacts");
    expect(context).toContain(catalogue.name);
    expect(context).toContain("Writ of Law");
  });
});
