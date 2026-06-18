import { describe, expect, it } from "vitest";

import { ALL_PATHWAYS, getPathway } from "./index";
import { SEQUENCE_NAMES } from "./sequence-names-canon";

// ---------------------------------------------------------------------------
// Canon reconciliation (issue #99 Part A)
// ---------------------------------------------------------------------------
//
// `sequence-names-canon.ts` is generated from the committed wiki dump
// (Module:Sequence/standard) and is the single source of truth for every
// pathway's sequence names, levels 9 → 0 — including the sequel (Circle of
// Inevitability) rungs the novel never reached. These tests hold the curated
// `pathways.ts` data against that canon so the two can never silently diverge:
// every Sequence object's name must equal its canon name, and every pathway's
// Seq 0 (the True God / Above-the-Sequence title) must equal the pathway name.

const ALL_LEVELS = [9, 8, 7, 6, 5, 4, 3, 2, 1, 0] as const;

type Verdict = "match" | "mismatch" | "current-only" | "canon-only";

describe("sequence-names canon map", () => {
  it("covers all 22 pathways at every rung 9 → 0 (220 names)", () => {
    expect(Object.keys(SEQUENCE_NAMES)).toHaveLength(22);
    let total = 0;
    for (let id = 1; id <= 22; id++) {
      const byLevel = SEQUENCE_NAMES[id];
      expect(byLevel, `pathway ${id} present`).toBeDefined();
      for (const level of ALL_LEVELS) {
        expect(typeof byLevel[level], `pathway ${id} Seq ${level} name`).toBe("string");
        expect(byLevel[level].length).toBeGreaterThan(0);
        total++;
      }
    }
    expect(total).toBe(220);
  });

  it("sources the sequel rungs the novel never reached (spot checks)", () => {
    // The later thirteen pathways' Saint/Angel/King-of-Angels rungs (Seq 4-1)
    // and every Seq 0 honorific come from the wiki's sequel coverage.
    expect(SEQUENCE_NAMES[10][1]).toBe("Omniscient Eye"); // White Tower
    expect(SEQUENCE_NAMES[11][1]).toBe("Hand of God"); // Twilight Giant
    expect(SEQUENCE_NAMES[16][2]).toBe("Desolate Matriarch"); // Mother
    expect(SEQUENCE_NAMES[17][1]).toBe("Beauty Goddess"); // Moon
    // Eternal Darkness family Seq 0 titles (the Evernight Goddess ascends into
    // the Eternal Darkness Pillar in the sequel — see issue #99 Part B).
    expect(SEQUENCE_NAMES[4][0]).toBe("Death");
    expect(SEQUENCE_NAMES[5][0]).toBe("Darkness");
    expect(SEQUENCE_NAMES[11][0]).toBe("Twilight Giant");
  });
});

describe("pathways.ts reconciles against canon", () => {
  // Build the full report once: per pathway/level, compare the curated name to
  // the canon name and record a verdict.
  const report: {
    id: number;
    level: number;
    verdict: Verdict;
    current?: string;
    canon?: string;
  }[] = [];
  for (const pathway of ALL_PATHWAYS) {
    const canonByLevel = SEQUENCE_NAMES[pathway.id] ?? {};
    const currentByLevel = new Map(pathway.sequences.map((s) => [s.level, s.name]));
    const levels = new Set<number>([
      ...Object.keys(canonByLevel).map(Number),
      ...currentByLevel.keys(),
    ]);
    for (const level of levels) {
      // Seq 0 is the apotheosis tier — it is never a stored Sequence object, so
      // a "canon-only" verdict there is expected and handled separately below.
      if (level === 0) continue;
      const current = currentByLevel.get(level);
      const canon = canonByLevel[level];
      let verdict: Verdict;
      if (current !== undefined && canon !== undefined)
        verdict = current === canon ? "match" : "mismatch";
      else if (current !== undefined) verdict = "current-only";
      else verdict = "canon-only";
      report.push({ id: pathway.id, level, verdict, current, canon });
    }
  }

  it("has no name mismatches against canon (Seq 9-1)", () => {
    const mismatches = report.filter((r) => r.verdict === "mismatch");
    expect(
      mismatches,
      `mismatches: ${mismatches
        .map(
          (m) => `pathway ${m.id} Seq ${m.level} current=${m.current} canon=${m.canon}`,
        )
        .join("; ")}`,
    ).toHaveLength(0);
  });

  it("has no curated sequence without a canon name (Seq 9-1)", () => {
    const currentOnly = report.filter((r) => r.verdict === "current-only");
    expect(
      currentOnly,
      `current-only: ${currentOnly.map((m) => `pathway ${m.id} Seq ${m.level} (${m.current})`).join("; ")}`,
    ).toHaveLength(0);
  });

  it("every pathway runs Seq 9 → 1 with canon names", () => {
    for (const pathway of ALL_PATHWAYS) {
      const levels = pathway.sequences.map((s) => s.level).sort((a, b) => b - a);
      expect(levels, `pathway ${pathway.id} levels`).toEqual([9, 8, 7, 6, 5, 4, 3, 2, 1]);
      for (const seq of pathway.sequences) {
        expect(seq.name, `pathway ${pathway.id} Seq ${seq.level}`).toBe(
          SEQUENCE_NAMES[pathway.id][seq.level],
        );
      }
    }
  });

  it("each pathway's name is its canon Seq 0 (Above-the-Sequence) title", () => {
    for (let id = 1; id <= 22; id++) {
      expect(getPathway(id)?.name, `pathway ${id} Seq 0`).toBe(SEQUENCE_NAMES[id][0]);
    }
  });

  it("classification scales canonically (High 4-3, Demigod 2-1)", () => {
    for (const pathway of ALL_PATHWAYS) {
      for (const seq of pathway.sequences) {
        if (seq.level === 4 || seq.level === 3)
          expect(seq.classification, `pathway ${pathway.id} Seq ${seq.level}`).toBe(
            "High",
          );
        if (seq.level === 2 || seq.level === 1)
          expect(seq.classification, `pathway ${pathway.id} Seq ${seq.level}`).toBe(
            "Demigod",
          );
      }
    }
  });
});
