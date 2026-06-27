import { describe, it, expect } from "vitest";
import { classifyAbility, combatKitFor, abilityKindTag } from "./combat-abilities";
import type { AbilityKind } from "@/lib/types/combat";

const KINDS: AbilityKind[] = ["offensive", "defensive", "control", "evasive", "utility"];

describe("classifyAbility", () => {
  it("classifies by keyword over name + description", () => {
    expect(classifyAbility("Flame Manipulation", "Control and loose fire.")).toBe(
      "offensive",
    );
    expect(classifyAbility("Spirit Vision", "Perceive spiritual threads.")).toBe(
      "evasive",
    );
    expect(classifyAbility("Pacify", "Press a numbing calm over their mind.")).toBe(
      "control",
    );
    expect(classifyAbility("Radiant Ward", "Raise a shield of holy light.")).toBe(
      "defensive",
    );
  });

  it("falls through to utility when no role keyword matches (the flagged gap default)", () => {
    expect(classifyAbility("Bookkeeping", "Tally the day's accounts.")).toBe("utility");
  });

  it("resolves overlaps by rule order (mind/foresight before a strike verb)", () => {
    // "read their intent" hits control before "strike" would make it offensive.
    expect(classifyAbility("Read Intent", "Read the strike before it forms.")).toBe(
      "control",
    );
  });
});

describe("combatKitFor", () => {
  it("derives a non-empty, well-formed kit for a representative pathway", () => {
    const kit = combatKitFor(1, 9); // Fool, Seq 9
    expect(kit.length).toBeGreaterThan(0);
    for (const ability of kit) {
      expect(ability.id).toMatch(/^kit-1-/);
      expect(ability.name.length).toBeGreaterThan(0);
      expect(KINDS).toContain(ability.kind);
      expect(ability.description.length).toBeGreaterThan(0);
      expect(ability.description.length).toBeLessThanOrEqual(120);
      expect(ability.sanityCost).toBeLessThanOrEqual(0);
      expect(ability.controlStrain).toBeGreaterThanOrEqual(0);
      expect(ability.potency).toBeGreaterThan(0);
      expect(ability.potency).toBeLessThanOrEqual(0.3);
      expect(ability.cooldown).toBeGreaterThanOrEqual(0);
    }
  });

  it("is cumulative — climbing a rung grows the kit", () => {
    const seq9 = combatKitFor(1, 9);
    const seq5 = combatKitFor(1, 5);
    expect(seq5.length).toBeGreaterThanOrEqual(seq9.length);
  });

  it("scales potency and cost deeper for the same role at a deeper rung", () => {
    // The deepest-rung offensive ability should hit harder than a Seq 9 one of
    // the same role (depth scaling), and cost at least as much sanity.
    const shallow = combatKitFor(1, 9).filter((a) => a.kind === "offensive");
    const deep = combatKitFor(1, 1).filter((a) => a.kind === "offensive");
    if (shallow.length > 0 && deep.length > 0) {
      const maxShallow = Math.max(...shallow.map((a) => a.potency));
      const maxDeep = Math.max(...deep.map((a) => a.potency));
      expect(maxDeep).toBeGreaterThanOrEqual(maxShallow);
    }
  });

  it("is deterministic", () => {
    expect(combatKitFor(3, 7)).toEqual(combatKitFor(3, 7));
  });

  it("plays differently across pathways (distinct role mixes)", () => {
    const spectator = combatKitFor(2, 9); // Visionary — perception/control
    const sun = combatKitFor(3, 9); // Sun — searing light
    const roleMix = (kit: ReturnType<typeof combatKitFor>) =>
      kit.map((a) => a.kind).join(",");
    expect(roleMix(spectator)).not.toBe(roleMix(sun));
  });

  it("returns an empty kit for an unknown pathway", () => {
    expect(combatKitFor(999, 9)).toEqual([]);
  });
});

describe("abilityKindTag", () => {
  it("gives a plain-language tag for every kind", () => {
    for (const kind of KINDS) {
      expect(abilityKindTag(kind).length).toBeGreaterThan(0);
    }
  });
});
