import { describe, expect, it } from "vitest";

import {
  fusedAbilityNames,
  fusedCombatKit,
  retainedAbilityGroups,
} from "./pathway-fusion";
import type { PathwaySwitch } from "./pathway-lineage";
import { createDefaultGameState, createSession } from "./session";
import { sequenceAbilities } from "./apotheosis";
import { combatKitFor } from "./combat-abilities";
import type { GameSession } from "./types";

function sessionAt(pathwayId: number, sequenceLevel: number): GameSession {
  const gs = { ...createDefaultGameState(pathwayId, "c1", "Klein"), sequenceLevel };
  return createSession(gs, "s1");
}

function withSwitch(session: GameSession, entry: PathwaySwitch): GameSession {
  return { ...session, pathwayLineage: { switches: [entry] } };
}

const RETAINED = [
  {
    name: "Foreign Whisper",
    description: "hears the dead",
    type: "passive" as const,
    sourceLevel: 5,
  },
  {
    name: "Foreign Strike",
    description: "a spectral blow",
    type: "active" as const,
    sourceLevel: 6,
  },
];

function neighborSwitch(overrides: Partial<PathwaySwitch> = {}): PathwaySwitch {
  return {
    fromPathwayId: 2,
    atSequence: 4,
    kind: "neighboring",
    switchTurn: 1,
    retained: RETAINED,
    ...overrides,
  };
}

describe("fusedAbilityNames", () => {
  it("returns the base kit unchanged when the character has never switched", () => {
    const session = sessionAt(1, 5);
    const base = sequenceAbilities(1, 5).abilities;
    expect(fusedAbilityNames(session)).toEqual(base);
  });

  it("appends retained abilities tagged (fused) after the current kit", () => {
    const session = withSwitch(sessionAt(3, 4), neighborSwitch());
    const names = fusedAbilityNames(session);
    expect(names).toContain("Foreign Whisper (fused)");
    expect(names).toContain("Foreign Strike (fused)");
    // The current pathway's own kit still leads.
    const base = sequenceAbilities(3, 4).abilities;
    expect(names.slice(0, base.length)).toEqual(base);
  });

  it("dedupes a retained ability whose name is already in the current kit", () => {
    const session = sessionAt(3, 4);
    const existing = sequenceAbilities(3, 4).abilities[0].replace(/\s*\(enhanced\)$/, "");
    const dup: PathwaySwitch = neighborSwitch({
      retained: [{ name: existing, description: "d", type: "passive", sourceLevel: 5 }],
    });
    const names = fusedAbilityNames(withSwitch(session, dup));
    expect(names).not.toContain(`${existing} (fused)`);
  });
});

describe("fusedCombatKit", () => {
  it("returns the base kit unchanged when the character has never switched", () => {
    const session = sessionAt(1, 5);
    expect(fusedCombatKit(session)).toEqual(combatKitFor(1, 5));
  });

  it("adds a combat ability per retained power, deduped against the base kit", () => {
    const session = withSwitch(sessionAt(3, 4), neighborSwitch());
    const kit = fusedCombatKit(session);
    const base = combatKitFor(3, 4);
    expect(kit.length).toBe(base.length + RETAINED.length);
    const names = kit.map((a) => a.name);
    expect(names).toContain("Foreign Whisper");
    expect(names).toContain("Foreign Strike");
    // Every fused ability is a well-formed CombatAbility.
    const fused = kit.find((a) => a.name === "Foreign Strike")!;
    expect(fused.potency).toBeGreaterThanOrEqual(0);
    expect(typeof fused.kind).toBe("string");
  });

  it("namespaces fused ability ids with a `fused-` prefix so they can't collide with base ids", () => {
    const session = withSwitch(sessionAt(3, 4), neighborSwitch());
    const kit = fusedCombatKit(session);
    const base = combatKitFor(3, 4);
    const baseIds = new Set(base.map((a) => a.id));
    const fused = kit.filter(
      (a) => a.name === "Foreign Whisper" || a.name === "Foreign Strike",
    );
    expect(fused).toHaveLength(2);
    for (const ability of fused) {
      expect(ability.id.startsWith("fused-")).toBe(true);
      expect(baseIds.has(ability.id)).toBe(false);
    }
    // All ids across the whole kit are unique (no key clash in combat options).
    expect(new Set(kit.map((a) => a.id)).size).toBe(kit.length);
  });

  it("dedupes a retained ability whose name is already in the base combat kit", () => {
    const base = combatKitFor(3, 4);
    const dupName = base[0].name;
    const session = withSwitch(
      sessionAt(3, 4),
      neighborSwitch({
        retained: [{ name: dupName, description: "d", type: "active", sourceLevel: 5 }],
      }),
    );
    // The duplicate is skipped, so the kit length is unchanged.
    expect(fusedCombatKit(session)).toHaveLength(base.length);
  });
});

describe("retainedAbilityGroups", () => {
  it("is empty when the character has never switched", () => {
    expect(retainedAbilityGroups(sessionAt(1, 5))).toEqual([]);
  });

  it("names the prior pathway and lists its retained abilities, newest first", () => {
    const session: GameSession = {
      ...sessionAt(3, 4),
      pathwayLineage: {
        switches: [
          neighborSwitch({ fromPathwayId: 2 }),
          neighborSwitch({ fromPathwayId: 6, kind: "unrelated" }),
        ],
      },
    };
    const groups = retainedAbilityGroups(session);
    expect(groups).toHaveLength(2);
    // Newest switch first.
    expect(groups[0].fromPathwayId).toBe(6);
    expect(groups[0].kind).toBe("unrelated");
    expect(groups[0].fromPathwayName).toBe("Tyrant");
    expect(groups[1].fromPathwayId).toBe(2);
    expect(groups[1].abilities.map((a) => a.name)).toContain("Foreign Whisper");
  });

  it("falls back to a plain label for an unknown prior pathway", () => {
    const session: GameSession = {
      ...sessionAt(3, 4),
      pathwayLineage: { switches: [neighborSwitch({ fromPathwayId: 999 })] },
    };
    expect(retainedAbilityGroups(session)[0].fromPathwayName).toBe("Pathway 999");
  });
});
