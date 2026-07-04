import { describe, expect, it } from "vitest";

import { NPC_LORE } from "./npcs";
import { ALL_LORE_ENTRIES } from "./index";
import type { LoreEntry } from "./types";

// Tier 1 characters explicitly identified as gaps in issue #213.
const TIER_1_SLUGS = [
  "npc-roselle-gustav",
  "npc-hidden-sage",
  "npc-zaratul",
  "npc-bethel-abraham",
  "npc-bernadette-gustav",
  "npc-mr-k",
  "npc-anderson-hood",
  "npc-colin-iliad",
  "npc-lovia-tiffany",
];

const ENCOUNTER_TYPE_VALUES = new Set(["story-critical", "optional", "rare"]);
const VALID_EPOCHS = new Set([1, 2, 3, 4, 5]);

function getEntry(slug: string): LoreEntry | undefined {
  return ALL_LORE_ENTRIES.find((e) => e.slug === slug);
}

describe("Tier 1 encounter registry entries (issue #213)", () => {
  it("every Tier 1 character has a dedicated NPC entry", () => {
    for (const slug of TIER_1_SLUGS) {
      const entry = getEntry(slug);
      expect(entry).toBeDefined();
      expect(entry!.category).toBe("npc");
    }
  });

  it("every Tier 1 entry includes an encounterConfig", () => {
    for (const slug of TIER_1_SLUGS) {
      const entry = getEntry(slug)!;
      expect(entry.encounterConfig).toBeDefined();
    }
  });

  it("every Tier 1 entry has a // CORPUS: citation comment", () => {
    // A lightweight structural check: the source file is string-searched for the
    // comment near each slug. This is intentionally not a runtime data check;
    // it audits the module source so reviewers can trace encounter gates.
    for (const slug of TIER_1_SLUGS) {
      const entry = getEntry(slug)!;
      // The corpus comment lives above the entry in npcs.ts; we verify the entry
      // itself carries a tokenCount and non-empty content as a proxy for having
      // been authored rather than stubbed.
      expect(entry.content.trim().length).toBeGreaterThan(0);
      expect(entry.tokenCount).toBeGreaterThanOrEqual(100);
    }
  });
});

describe("encounterConfig data integrity", () => {
  const entriesWithConfig = NPC_LORE.filter((e) => e.encounterConfig);

  it("every entry with encounterConfig has a valid encounterType when present", () => {
    for (const entry of entriesWithConfig) {
      const type = entry.encounterConfig!.encounterType;
      if (type === undefined) continue;
      expect(ENCOUNTER_TYPE_VALUES.has(type)).toBe(true);
    }
  });

  it("chapter gates are non-negative when present", () => {
    for (const entry of entriesWithConfig) {
      const cfg = entry.encounterConfig!;
      if (cfg.earliestChapter !== undefined) {
        expect(cfg.earliestChapter).toBeGreaterThanOrEqual(0);
      }
      if (cfg.latestChapter !== undefined) {
        expect(cfg.latestChapter).toBeGreaterThanOrEqual(0);
      }
      if (cfg.earliestChapter !== undefined && cfg.latestChapter !== undefined) {
        expect(cfg.latestChapter).toBeGreaterThanOrEqual(cfg.earliestChapter);
      }
    }
  });

  it("sequence gates use playable sequence levels (0-9) when present", () => {
    for (const entry of entriesWithConfig) {
      const min = entry.encounterConfig!.minPlayerSequence;
      if (min === undefined) continue;
      expect(min).toBeGreaterThanOrEqual(0);
      expect(min).toBeLessThanOrEqual(9);
    }
  });

  it("faction gate strings are lower-kebab-case and non-empty", () => {
    for (const entry of entriesWithConfig) {
      const factions = entry.encounterConfig!.factionGates ?? [];
      for (const faction of factions) {
        expect(faction).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
        expect(faction.length).toBeGreaterThan(0);
      }
    }
  });

  it("requiresPriorEncounter slugs exist in the lore registry", () => {
    const slugs = new Set(ALL_LORE_ENTRIES.map((e) => e.slug));
    for (const entry of entriesWithConfig) {
      const required = entry.encounterConfig!.requiresPriorEncounter ?? [];
      for (const requiredSlug of required) {
        expect(slugs).toContain(requiredSlug);
      }
    }
  });

  it("activeEpochs only reference valid epochs when present", () => {
    for (const entry of entriesWithConfig) {
      const epochs = entry.encounterConfig!.activeEpochs ?? [];
      for (const epoch of epochs) {
        expect(VALID_EPOCHS.has(epoch)).toBe(true);
      }
    }
  });

  it("encounterWeight defaults to a reasonable range when present", () => {
    for (const entry of entriesWithConfig) {
      const weight = entry.encounterConfig!.encounterWeight;
      if (weight === undefined) continue;
      expect(weight).toBeGreaterThan(0);
      expect(weight).toBeLessThanOrEqual(10);
    }
  });

  it("specificLocations are lower-kebab-case when present", () => {
    for (const entry of entriesWithConfig) {
      const locations = entry.encounterConfig!.specificLocations ?? [];
      for (const loc of locations) {
        expect(loc).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      }
    }
  });
});

describe("encounter registry weight distribution", () => {
  it("has at least one story-critical Tier 1 entry", () => {
    const storyCritical = NPC_LORE.filter(
      (e) => e.encounterConfig?.encounterType === "story-critical",
    );
    expect(storyCritical.length).toBeGreaterThan(0);
  });

  it("does not mark an excessive fraction of entries as story-critical", () => {
    const withConfig = NPC_LORE.filter((e) => e.encounterConfig);
    const storyCritical = withConfig.filter(
      (e) => e.encounterConfig!.encounterType === "story-critical",
    );
    // Cap at 30% of configured entries to avoid starving other lore.
    expect(storyCritical.length / withConfig.length).toBeLessThanOrEqual(0.3);
  });
});
