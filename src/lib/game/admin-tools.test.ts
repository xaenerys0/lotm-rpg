import { describe, expect, it } from "vitest";

import { getSequence, siblingPathwayIds } from "@/lib/rules";

import {
  ADMIN_CHARACTER_ID_PREFIX,
  buildAdminCharacter,
  forceLossOfControl,
  grantArtifactsToSession,
  lossOfControlPreview,
  makeAdvancementReady,
  makeAdvancementReadyState,
  setSessionFunds,
  setSessionSanity,
} from "./admin-tools";
import { effectiveSupport, requiredSupport } from "./anchors";
import { uniquenessItemFor } from "./apotheosis";
import { canAttemptApotheosis } from "./apotheosis";
import { canAttemptPillarAscension, PILLAR_SEQUENCE } from "./pillars";
import { ascensionRiteReady } from "./ascension-rite";
import { canAttemptSwitch, switchRelation } from "./pathway-switch";
import { fusedAbilityNames } from "./pathway-fusion";
import { deserializeSession, serializeSession } from "./session";

// Fool (1) belongs to the Lord of Mysteries Pillar family {1,7,8}; Justiciar (12)
// belongs to no Pillar family. White Tower (10) carries deep-rung ingredients.
const FOOL = 1;
const JUSTICIAR = 12;

describe("buildAdminCharacter", () => {
  it("seeds a fresh potion at the start of digestion", () => {
    const session = buildAdminCharacter(
      { pathwayId: FOOL, sequenceLevel: 7, digestion: "start" },
      "admin-fixed",
      1000,
    );
    expect(session.id).toBe("admin-fixed");
    expect(session.gameState.sequenceLevel).toBe(7);
    expect(session.gameState.digestion!).toMatchObject({ progress: 0, complete: false });
    // Acting method is revealed by default and a deep wallet is seeded.
    expect(session.actingMethodState?.knowsMethod).toBe(true);
    expect(session.gameState.funds).toBeGreaterThan(0);
  });

  it("seeds a fully-digested potion at the end of digestion", () => {
    const session = buildAdminCharacter({
      pathwayId: FOOL,
      sequenceLevel: 6,
      digestion: "end",
    });
    expect(session.gameState.digestion!.complete).toBe(true);
    expect(session.gameState.digestion!.progress).toBe(100);
    expect(session.id.startsWith(ADMIN_CHARACTER_ID_PREFIX)).toBe(true);
  });

  it("clamps the requested sequence into the playable range", () => {
    expect(
      buildAdminCharacter({ pathwayId: FOOL, sequenceLevel: 99, digestion: "start" })
        .gameState.sequenceLevel,
    ).toBe(9);
    expect(
      buildAdminCharacter({ pathwayId: FOOL, sequenceLevel: 0, digestion: "start" })
        .gameState.sequenceLevel,
    ).toBe(1);
  });

  it("honours explicit funds and clamps sanity to the max", () => {
    const session = buildAdminCharacter({
      pathwayId: FOOL,
      sequenceLevel: 9,
      digestion: "start",
      funds: 42,
      sanity: 9999,
    });
    expect(session.gameState.funds).toBe(42);
    expect(session.gameState.sanity).toBe(session.gameState.maxSanity);
  });

  it("can disable the acting-method reveal", () => {
    const session = buildAdminCharacter({
      pathwayId: FOOL,
      sequenceLevel: 9,
      digestion: "start",
      knowsActingMethod: false,
    });
    expect(session.actingMethodState).toBeUndefined();
  });

  it("makes a character advancement-ready (ingredients + digested)", () => {
    const session = buildAdminCharacter({
      pathwayId: 10,
      sequenceLevel: 9,
      digestion: "start",
      advancementReady: true,
    });
    const target = getSequence(10, 8);
    expect(target?.prerequisiteItems.length ?? 0).toBeGreaterThan(0);
    for (const item of target?.prerequisiteItems ?? []) {
      expect(session.gameState.inventory.some((i) => i.name === item.name)).toBe(true);
    }
    expect(session.gameState.digestion!.complete).toBe(true);
  });

  it("grants example sealed artifacts and ignores unknown codes", () => {
    const session = buildAdminCharacter({
      pathwayId: FOOL,
      sequenceLevel: 9,
      digestion: "start",
      artifactNumbers: ["0-08", "9-999"],
    });
    const artifacts = session.gameState.inventory.filter(
      (i) => i.category === "sealed-artifact",
    );
    expect(artifacts).toHaveLength(1);
  });

  it("force-grants acquired powers (permanent and temporary)", () => {
    const session = buildAdminCharacter({
      pathwayId: FOOL,
      sequenceLevel: 9,
      digestion: "start",
      acquiredPowers: [
        { name: "Borrowed Flame", sourceName: "a fallen Red Priest" },
        { name: "Fading Sight", permanence: "temporary", method: "prometheus-theft" },
      ],
    });
    expect(session.acquiredPowers).toHaveLength(2);
    expect(session.acquiredPowers?.[0]).toMatchObject({
      name: "Borrowed Flame",
      permanence: "permanent",
      sourceName: "a fallen Red Priest",
    });
    expect(session.acquiredPowers?.[1].turnsRemaining).toBeGreaterThan(0);
    // Round-trips through (de)serialize without being dropped as malformed.
    const round = deserializeSession(serializeSession(session));
    expect(round).not.toBeNull();
    expect(round!.acquiredPowers).toHaveLength(2);
  });

  it("consecrates explicit anchors", () => {
    const session = buildAdminCharacter({
      pathwayId: FOOL,
      sequenceLevel: 3,
      digestion: "start",
      anchors: [{ kind: "object", name: "A silver pocketwatch" }],
    });
    expect(session.anchorState?.anchors).toHaveLength(1);
    expect(session.anchorState?.anchors[0]).toMatchObject({
      kind: "object",
      name: "A silver pocketwatch",
    });
  });

  it("poises an apotheosis-ready True God candidate (Seq 1 + Uniqueness + anchors)", () => {
    const session = buildAdminCharacter({
      pathwayId: FOOL,
      sequenceLevel: 5,
      digestion: "start",
      endgame: "apotheosis",
    });
    expect(session.gameState.sequenceLevel).toBe(1);
    expect(
      session.gameState.inventory.some((i) => i.name === uniquenessItemFor(FOOL).name),
    ).toBe(true);
    expect(effectiveSupport(session.anchorState!)).toBeGreaterThanOrEqual(
      requiredSupport(0),
    );
    expect(canAttemptApotheosis(session)).toBe(true);
    // The apex ascent is a matured rite now — the endgame build seeds it fully
    // formed (true-god tier) so it is poised to attempt immediately.
    expect(session.ascensionRite).toEqual({
      tier: "true-god",
      pathwayId: FOOL,
      fidelity: 1,
    });
    expect(ascensionRiteReady(session)).toBe(true);
  });

  it("poises a pillar-ready True God (Seq 0 + sibling Uniquenesses)", () => {
    const session = buildAdminCharacter({
      pathwayId: FOOL,
      sequenceLevel: 1,
      digestion: "start",
      endgame: "pillar",
    });
    expect(session.gameState.sequenceLevel).toBe(0);
    for (const siblingId of siblingPathwayIds(FOOL)) {
      expect(
        session.gameState.inventory.some(
          (i) => i.name === uniquenessItemFor(siblingId).name,
        ),
      ).toBe(true);
    }
    expect(canAttemptPillarAscension(session)).toBe(true);
    expect(session.ascensionRite).toEqual({
      tier: "pillar",
      pathwayId: FOOL,
      fidelity: 1,
    });
    expect(ascensionRiteReady(session)).toBe(true);
  });

  it("falls back to apotheosis when the pathway has no Pillar family", () => {
    const session = buildAdminCharacter({
      pathwayId: JUSTICIAR,
      sequenceLevel: 4,
      digestion: "start",
      endgame: "pillar",
    });
    expect(siblingPathwayIds(JUSTICIAR)).toHaveLength(0);
    expect(session.gameState.sequenceLevel).toBe(1);
    expect(canAttemptApotheosis(session)).toBe(true);
  });

  it("stands up an ascended True God (Seq 0) with no rite to attempt", () => {
    const session = buildAdminCharacter({
      pathwayId: FOOL,
      sequenceLevel: 5,
      digestion: "start",
      endgame: "true-god",
    });
    expect(session.gameState.sequenceLevel).toBe(0);
    // Already ascended — no ascension rite is seeded (nothing to attempt).
    expect(session.ascensionRite).toBeUndefined();
  });

  it("stands up an enthroned Pillar (Above the Sequence) for a family pathway", () => {
    const session = buildAdminCharacter({
      pathwayId: FOOL,
      sequenceLevel: 5,
      digestion: "start",
      endgame: "pillar-enthroned",
    });
    expect(session.gameState.sequenceLevel).toBe(PILLAR_SEQUENCE);
    expect(session.ascensionRite).toBeUndefined();
  });

  it("falls back to an ascended True God when enthroning a non-Pillar pathway", () => {
    const session = buildAdminCharacter({
      pathwayId: JUSTICIAR,
      sequenceLevel: 5,
      digestion: "start",
      endgame: "pillar-enthroned",
    });
    expect(siblingPathwayIds(JUSTICIAR)).toHaveLength(0);
    expect(session.gameState.sequenceLevel).toBe(0);
    expect(session.ascensionRite).toBeUndefined();
  });
});

describe("makeAdvancementReadyState", () => {
  it("appends the next potion's ingredients and completes digestion", () => {
    const base = buildAdminCharacter({
      pathwayId: 10,
      sequenceLevel: 9,
      digestion: "start",
    }).gameState;
    const ready = makeAdvancementReadyState(base);
    expect(ready.digestion!.complete).toBe(true);
    expect(ready.inventory.length).toBeGreaterThan(base.inventory.length);
  });
});

describe("active-save mutators", () => {
  const session = buildAdminCharacter({
    pathwayId: FOOL,
    sequenceLevel: 6,
    digestion: "start",
  });

  it("sets sanity (clamped) and funds (exact)", () => {
    expect(setSessionSanity(session, -5).gameState.sanity).toBe(0);
    expect(setSessionSanity(session, 1e9).gameState.sanity).toBe(
      session.gameState.maxSanity,
    );
    expect(setSessionFunds(session, 777).gameState.funds).toBe(777);
    expect(setSessionFunds(session, -10).gameState.funds).toBe(0);
  });

  it("grants artifacts onto an existing save", () => {
    const next = grantArtifactsToSession(session, ["0-08"]);
    expect(next.gameState.inventory.some((i) => i.category === "sealed-artifact")).toBe(
      true,
    );
  });

  it("makes an existing save advancement-ready and reveals the method", () => {
    const next = makeAdvancementReady(session);
    expect(next.gameState.digestion!.complete).toBe(true);
    expect(next.actingMethodState?.knowsMethod).toBe(true);
  });

  it("forces a loss of control by emptying sanity", () => {
    expect(forceLossOfControl(session).gameState.sanity).toBe(0);
  });
});

describe("lossOfControlPreview", () => {
  it("scales severity with sequence", () => {
    const setback = buildAdminCharacter({
      pathwayId: FOOL,
      sequenceLevel: 9,
      digestion: "start",
    });
    const transformation = buildAdminCharacter({
      pathwayId: FOOL,
      sequenceLevel: 5,
      digestion: "start",
    });
    expect(lossOfControlPreview(setback)).toBe("setback");
    expect(lossOfControlPreview(transformation)).toBe("transformation");
  });

  it("is fatal for an under-anchored Angel (high risk)", () => {
    // Seq 2 with no anchors → requiresAnchors + under-anchored → highRisk escalation.
    const angel = buildAdminCharacter({
      pathwayId: FOOL,
      sequenceLevel: 2,
      digestion: "start",
      anchors: [],
    });
    expect(lossOfControlPreview(angel)).toBe("fatal");
  });
});

describe("buildAdminCharacter — pathway switching (issue #211)", () => {
  it("switchReadyTarget poises the character to exchange into a neighbour", () => {
    // Visionary (2) at Seq 4, neighbour Sun (3).
    const session = buildAdminCharacter({
      pathwayId: 2,
      sequenceLevel: 4,
      digestion: "end",
      switchReadyTarget: 3,
    });
    expect(session.gameState.digestion?.complete).toBe(true);
    expect(canAttemptSwitch(session, 3)).toBe(true);
  });

  it("switchReadyTarget also poises an UNRELATED (poison) exchange", () => {
    // Fool (1) at Seq 4; Visionary (2) is an unrelated pathway (not a neighbour).
    const session = buildAdminCharacter({
      pathwayId: 1,
      sequenceLevel: 4,
      digestion: "end",
      switchReadyTarget: 2,
    });
    expect(switchRelation(1, 2)).toBe("unrelated");
    expect(canAttemptSwitch(session, 2)).toBe(true);
  });

  it("fusedPathways seeds a lineage whose retained abilities fuse into the sheet", () => {
    const session = buildAdminCharacter({
      pathwayId: 3,
      sequenceLevel: 4,
      digestion: "end",
      fusedPathways: [2],
    });
    expect(session.pathwayLineage?.switches).toHaveLength(1);
    const entry = session.pathwayLineage!.switches[0];
    expect(entry.fromPathwayId).toBe(2);
    expect(entry.retained.length).toBeGreaterThan(0);
    // The fused abilities surface for the narrator/combat derivations.
    const names = fusedAbilityNames(session);
    expect(names.some((n) => n.endsWith("(fused)"))).toBe(true);
  });
});
