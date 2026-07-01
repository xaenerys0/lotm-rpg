import { describe, expect, it } from "vitest";

import { getCumulativeAbilities } from "@/lib/rules";

import { combatKitFor } from "./combat-abilities";
import {
  currentJoinSequence,
  fusedAbilityNames,
  fusedCombatKit,
  heldAbilityGroups,
  heldCumulativeAbilities,
  retainedAbilityGroups,
} from "./pathway-fusion";
import type { PathwaySwitch, RetainedAbility } from "./pathway-lineage";
import { createDefaultGameState, createSession } from "./session";
import { sequenceAbilities } from "./apotheosis";
import type { GameSession } from "./types";

function sessionAt(pathwayId: number, sequenceLevel: number): GameSession {
  const gs = { ...createDefaultGameState(pathwayId, "c1", "Klein"), sequenceLevel };
  return createSession(gs, "s1");
}

const RETAINED: RetainedAbility[] = [
  {
    name: "Foreign Whisper",
    description: "hears the dead",
    type: "passive",
    sourceLevel: 5,
  },
  {
    name: "Foreign Strike",
    description: "a spectral blow",
    type: "active",
    sourceLevel: 6,
  },
];

// A character now on `currentPid` at `currentSeq` who switch-ADVANCED here from
// `fromPid` — they left the old pathway one rung above (`currentSeq + 1`), so the
// join cap is `currentSeq`.
function switched(
  currentPid: number,
  currentSeq: number,
  fromPid: number,
  retained: RetainedAbility[] = RETAINED,
): GameSession {
  const entry: PathwaySwitch = {
    fromPathwayId: fromPid,
    atSequence: currentSeq + 1,
    kind: "neighboring",
    switchTurn: 1,
    retained,
  };
  return { ...sessionAt(currentPid, currentSeq), pathwayLineage: { switches: [entry] } };
}

describe("currentJoinSequence", () => {
  it("is 9 (uncapped) with no lineage, else one rung below where they last left", () => {
    expect(currentJoinSequence(sessionAt(1, 5))).toBe(9);
    // Left Visionary at Seq 4, joined Sun at Seq 3.
    expect(currentJoinSequence(switched(3, 3, 2))).toBe(3);
  });
});

describe("heldCumulativeAbilities / heldAbilityGroups", () => {
  it("returns the full kit for a save that never switched", () => {
    const held = heldCumulativeAbilities(sessionAt(1, 5));
    expect(held).toEqual(getCumulativeAbilities(1, 5));
  });

  it("caps a switched character to the rungs they actually joined at (the loss)", () => {
    const session = switched(3, 3, 2); // Sun Seq 3, joined at Seq 3
    const held = heldCumulativeAbilities(session);
    const full = getCumulativeAbilities(3, 3);
    // Missing the weaker Sun rungs (Seq 4-9) never digested — fewer than the full kit.
    expect(held.length).toBeLessThan(full.length);
    expect(held.every((a) => a.sourceLevel <= 3)).toBe(true);
    // The sheet groups are capped to match.
    expect(heldAbilityGroups(session).every((g) => g.level <= 3)).toBe(true);
  });
});

describe("fusedAbilityNames", () => {
  it("returns the base kit unchanged when the character has never switched", () => {
    expect(fusedAbilityNames(sessionAt(1, 5))).toEqual(sequenceAbilities(1, 5).abilities);
  });

  it("leads with the capped current kit, then appends retained abilities tagged (fused)", () => {
    const session = switched(3, 3, 2);
    const names = fusedAbilityNames(session);
    const base = heldCumulativeAbilities(session).map((a) =>
      a.enhanced ? `${a.name} (enhanced)` : a.name,
    );
    expect(names.slice(0, base.length)).toEqual(base);
    expect(names).toContain("Foreign Whisper (fused)");
    expect(names).toContain("Foreign Strike (fused)");
  });

  it("dedupes a retained ability whose name is already in the current kit", () => {
    const existing = heldCumulativeAbilities(sessionAt(3, 3))[0].name;
    const session = switched(3, 3, 2, [
      { name: existing, description: "d", type: "passive", sourceLevel: 5 },
    ]);
    expect(fusedAbilityNames(session)).not.toContain(`${existing} (fused)`);
  });

  it("uses the apex overlays (not the cap) for a switched character at the throne", () => {
    // A rare switch-then-ascend edge: at Seq 0 the True God overlay stands, plus
    // the fused retained kit — the join cap does not apply above the sequences.
    const godWithLineage = switched(1, 0, 2);
    const names = fusedAbilityNames(godWithLineage);
    expect(names).toEqual(
      expect.arrayContaining([expect.stringContaining("Foreign Whisper (fused)")]),
    );
    expect(fusedCombatKit(godWithLineage).length).toBeGreaterThan(0);
  });
});

describe("fusedCombatKit", () => {
  it("returns the base kit unchanged when the character has never switched", () => {
    expect(fusedCombatKit(sessionAt(1, 5))).toEqual(combatKitFor(1, 5));
  });

  it("adds a combat ability per retained power over the capped base", () => {
    const session = switched(3, 3, 2);
    const kit = fusedCombatKit(session);
    const baseCount = heldCumulativeAbilities(session).length;
    expect(kit.length).toBe(baseCount + RETAINED.length);
    const names = kit.map((a) => a.name);
    expect(names).toContain("Foreign Whisper");
    expect(names).toContain("Foreign Strike");
  });

  it("namespaces fused ability ids with a `fused-` prefix so they can't collide", () => {
    const session = switched(3, 3, 2);
    const kit = fusedCombatKit(session);
    const fused = kit.filter((a) => a.id.startsWith("fused-"));
    expect(fused.length).toBe(RETAINED.length);
    // Every id across the whole kit is unique (no key clash in combat options).
    expect(new Set(kit.map((a) => a.id)).size).toBe(kit.length);
  });

  it("dedupes a retained ability whose name is already in the (capped) base kit", () => {
    // The current rung's first ability IS in the capped base kit.
    const baseName = heldCumulativeAbilities(sessionAt(3, 3))[0].name;
    const session = switched(3, 3, 2, [
      { name: baseName, description: "d", type: "active", sourceLevel: 5 },
    ]);
    // The dup is skipped, so no fused ability is added.
    const heldCount = heldCumulativeAbilities(session).length;
    expect(fusedCombatKit(session)).toHaveLength(heldCount);
  });
});

describe("retainedAbilityGroups", () => {
  it("is empty when the character has never switched", () => {
    expect(retainedAbilityGroups(sessionAt(1, 5))).toEqual([]);
  });

  it("names the prior pathway and lists its retained abilities, newest first", () => {
    const session: GameSession = {
      ...sessionAt(3, 2),
      pathwayLineage: {
        switches: [
          {
            fromPathwayId: 2,
            atSequence: 4,
            kind: "neighboring",
            switchTurn: 1,
            retained: RETAINED,
          },
          {
            fromPathwayId: 6,
            atSequence: 3,
            kind: "unrelated",
            switchTurn: 2,
            retained: RETAINED,
          },
        ],
      },
    };
    const groups = retainedAbilityGroups(session);
    expect(groups).toHaveLength(2);
    expect(groups[0].fromPathwayId).toBe(6);
    expect(groups[0].kind).toBe("unrelated");
    expect(groups[0].fromPathwayName).toBe("Tyrant");
    expect(groups[1].fromPathwayId).toBe(2);
  });

  it("falls back to a plain label for an unknown prior pathway", () => {
    const session: GameSession = {
      ...sessionAt(3, 3),
      pathwayLineage: {
        switches: [
          {
            fromPathwayId: 999,
            atSequence: 4,
            kind: "neighboring",
            switchTurn: 1,
            retained: RETAINED,
          },
        ],
      },
    };
    expect(retainedAbilityGroups(session)[0].fromPathwayName).toBe("Pathway 999");
  });
});
