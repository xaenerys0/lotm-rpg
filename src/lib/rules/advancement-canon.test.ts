import { describe, expect, it } from "vitest";

import { ADVANCEMENT_RITUALS, RITUAL_FROM_SEQUENCE } from "./advancement-canon";

// Data-integrity guard for the corpus-generated Advancement Ritual `steps`
// (issue #209) — each rite distinguishes its tangible MATERIALS from its lived
// CONDITION beats, so the engine can reconcile materials with the potion's
// reagents while enforcing the conditions symbolically. Regenerate with
// `pnpm rag:advancement-canon` — never hand-edit the generated file.
describe("advancement-canon tagged steps", () => {
  it("only carries rituals from Sequence 5 and below", () => {
    for (const byLevel of Object.values(ADVANCEMENT_RITUALS)) {
      for (const level of Object.keys(byLevel)) {
        expect(Number(level)).toBeLessThanOrEqual(RITUAL_FROM_SEQUENCE);
        expect(Number(level)).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it("tags every step material | condition and carries at least one condition beat", () => {
    for (const [pathwayId, byLevel] of Object.entries(ADVANCEMENT_RITUALS)) {
      for (const [level, ritual] of Object.entries(byLevel)) {
        const where = `pathway ${pathwayId} Seq ${level}`;
        expect(ritual.steps, where).toBeDefined();
        const steps = ritual.steps!;
        for (const step of steps) {
          expect(["material", "condition"], where).toContain(step.kind);
          expect(step.text.length, where).toBeGreaterThan(0);
        }
        // The lived rite (the description) always yields ≥1 condition beat.
        expect(
          steps.some((s) => s.kind === "condition"),
          `${where}: no condition beat`,
        ).toBe(true);
      }
    }
  });

  it("derives its material steps from the canon ingredient `requirements`", () => {
    for (const byLevel of Object.values(ADVANCEMENT_RITUALS)) {
      for (const ritual of Object.values(byLevel)) {
        const materials = ritual.steps!.filter((s) => s.kind === "material");
        // One material step per canon requirement (cleaned), order preserved.
        expect(materials).toHaveLength(ritual.requirements.length);
      }
    }
  });
});
