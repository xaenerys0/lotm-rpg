import { describe, it, expect } from "vitest";

import { MAIN_INGREDIENTS } from "./main-ingredients-canon";
import { ALL_PATHWAYS, getSequence } from "./pathways";

// Permanent reconciliation guard (mirrors sequence-names-canon.test.ts): the
// rules-engine main ingredients must stay aligned with the corpus-generated
// `MAIN_INGREDIENTS` (the wiki Module:Sequence/standard data). A documented rung
// uses its canon PRIMARY material; an undocumented rung uses the canon "Or a
// {role} Beyonder Characteristic" option. Regenerate both with
// `pnpm rag:advancement-canon` — never hand-edit the generated file.
describe("main-ingredients-canon reconciliation", () => {
  it("every documented rung uses its canon PRIMARY material as the single main ingredient", () => {
    for (const [pathwayId, byLevel] of Object.entries(MAIN_INGREDIENTS)) {
      for (const [level, materials] of Object.entries(byLevel)) {
        const mains = getSequence(
          Number(pathwayId),
          Number(level),
        )!.prerequisiteItems.filter((i) => i.category === "main-ingredient");
        const where = `pathway ${pathwayId} Seq ${level}`;
        // Exactly one main ingredient per rung.
        expect(mains, where).toHaveLength(1);
        // …and it is the canon primary (first) material, verbatim.
        expect(mains[0].name, where).toBe(materials[0]);
      }
    }
  });

  it("an UNDOCUMENTED rung falls back to the same-tier role Beyonder Characteristic", () => {
    for (const pathway of ALL_PATHWAYS) {
      const documented = MAIN_INGREDIENTS[pathway.id] ?? {};
      for (const seq of pathway.sequences) {
        if (documented[seq.level]) continue; // covered by the reconciliation above
        const mains = seq.prerequisiteItems.filter(
          (i) => i.category === "main-ingredient",
        );
        expect(mains, `pathway ${pathway.id} Seq ${seq.level}`).toHaveLength(1);
        expect(mains[0].name, `pathway ${pathway.id} Seq ${seq.level}`).toBe(
          `${seq.name} Beyonder Characteristic`,
        );
      }
    }
  });

  it("the canon material map is well-formed (non-empty material lists, valid levels)", () => {
    for (const [pathwayId, byLevel] of Object.entries(MAIN_INGREDIENTS)) {
      expect(Number(pathwayId)).toBeGreaterThanOrEqual(1);
      expect(Number(pathwayId)).toBeLessThanOrEqual(22);
      for (const [level, materials] of Object.entries(byLevel)) {
        expect(Number(level)).toBeGreaterThanOrEqual(1);
        expect(Number(level)).toBeLessThanOrEqual(9);
        expect(materials.length).toBeGreaterThan(0);
        for (const m of materials) {
          expect(m.length).toBeGreaterThan(0);
          expect(m).toBe(m.trim());
          // Cleaned of wiki cruft.
          expect(m).not.toContain("(");
          expect(m).not.toMatch(/\bref\b/);
        }
      }
    }
  });
});
