import { describe, it, expect } from "vitest";

import {
  anchorHighRisk,
  anchorPressure,
  anchorsRelevant,
  consecrateAnchor,
  damageAnchor,
  effectiveSupport,
  emptyAnchorState,
  isLost,
  isUnderAnchored,
  isValidAnchorStateShape,
  loseAnchor,
  repairAnchor,
  requiredSupport,
  requiresAnchors,
  supportShortfall,
  ANCHOR_INTEGRITY_MAX,
  ANCHOR_KIND_WEIGHT,
  DEMIGOD_TRAITS,
  MAX_ANCHOR_PRESSURE,
  SAINT_REQUIRED_SUPPORT,
  type AnchorState,
} from "./anchors";

function congregation(integrity = 100): AnchorState {
  return { anchors: [{ id: "c1", kind: "congregation", name: "Faithful", integrity }] };
}

describe("anchors — tier gating", () => {
  it("requiresAnchors is true only at Seq <= 2", () => {
    expect(requiresAnchors(2)).toBe(true);
    expect(requiresAnchors(1)).toBe(true);
    expect(requiresAnchors(0)).toBe(true);
    expect(requiresAnchors(3)).toBe(false);
    expect(requiresAnchors(9)).toBe(false);
  });

  it("anchorsRelevant covers the Saint tier downward (Seq <= 4)", () => {
    expect(anchorsRelevant(4)).toBe(true);
    expect(anchorsRelevant(2)).toBe(true);
    expect(anchorsRelevant(5)).toBe(false);
    expect(anchorsRelevant(9)).toBe(false);
  });
});

describe("anchors — support arithmetic", () => {
  it("effectiveSupport sums integrity weighted by kind", () => {
    const state: AnchorState = {
      anchors: [
        { id: "o", kind: "object", name: "Ring", integrity: 100 },
        { id: "p", kind: "place", name: "Chapel", integrity: 100 },
        { id: "c", kind: "congregation", name: "Flock", integrity: 100 },
      ],
    };
    expect(effectiveSupport(state)).toBe(
      100 * ANCHOR_KIND_WEIGHT.object +
        100 * ANCHOR_KIND_WEIGHT.place +
        100 * ANCHOR_KIND_WEIGHT.congregation,
    );
  });

  it("congregation is the strongest anchor kind", () => {
    expect(ANCHOR_KIND_WEIGHT.congregation).toBeGreaterThan(ANCHOR_KIND_WEIGHT.place);
    expect(ANCHOR_KIND_WEIGHT.place).toBeGreaterThan(ANCHOR_KIND_WEIGHT.object);
  });

  it("requiredSupport is 0 above Saint, constant for Saints, rising for Angels", () => {
    expect(requiredSupport(5)).toBe(0);
    expect(requiredSupport(9)).toBe(0);
    expect(requiredSupport(4)).toBe(SAINT_REQUIRED_SUPPORT);
    expect(requiredSupport(3)).toBe(SAINT_REQUIRED_SUPPORT);
    // Seq 2 needs more than a Saint; Seq 1 needs more than Seq 2.
    expect(requiredSupport(2)).toBeGreaterThan(requiredSupport(3));
    expect(requiredSupport(1)).toBeGreaterThan(requiredSupport(2));
  });

  it("supportShortfall floors at 0 when over-supported", () => {
    expect(supportShortfall(congregation(100), 4)).toBe(0);
    expect(supportShortfall(emptyAnchorState(), 5)).toBe(0);
    expect(supportShortfall(emptyAnchorState(), 1)).toBe(requiredSupport(1));
  });
});

describe("anchors — per-turn pressure", () => {
  it("is zero when fully supported or below the Saint tier", () => {
    expect(anchorPressure(emptyAnchorState(), 5)).toBe(0);
    expect(anchorPressure(emptyAnchorState(), 9)).toBe(0);
    expect(anchorPressure(congregation(100), 4)).toBe(0);
  });

  it("is a non-positive drain when under-anchored", () => {
    const drain = anchorPressure(emptyAnchorState(), 2);
    expect(drain).toBeLessThan(0);
    expect(drain).toBeGreaterThanOrEqual(-MAX_ANCHOR_PRESSURE);
  });

  it("a wholly-unanchored Angel pays the maximum pressure", () => {
    expect(anchorPressure(emptyAnchorState(), 1)).toBe(-MAX_ANCHOR_PRESSURE);
  });

  it("a deeper shortfall drains at least as much as a shallower one", () => {
    const seq1 = anchorPressure(emptyAnchorState(), 1);
    const seq2 = anchorPressure(emptyAnchorState(), 2);
    expect(seq1).toBeLessThanOrEqual(seq2);
  });

  it("isUnderAnchored matches a non-zero shortfall", () => {
    expect(isUnderAnchored(emptyAnchorState(), 2)).toBe(true);
    expect(isUnderAnchored(congregation(100), 4)).toBe(false);
    expect(isUnderAnchored(emptyAnchorState(), 9)).toBe(false);
  });
});

describe("anchors — highRisk mapping (death/failure integration)", () => {
  it("is true only for an under-anchored Beyonder at the required tier", () => {
    expect(anchorHighRisk(emptyAnchorState(), 2)).toBe(true);
    expect(anchorHighRisk(emptyAnchorState(), 1)).toBe(true);
    // A Saint is relevant but not REQUIRED to anchor — no highRisk escalation.
    expect(anchorHighRisk(emptyAnchorState(), 4)).toBe(false);
    // A well-anchored Angel is not high-risk.
    expect(anchorHighRisk(congregation(100), 2)).toBe(false);
    // Below the tier entirely.
    expect(anchorHighRisk(emptyAnchorState(), 9)).toBe(false);
  });
});

describe("anchors — consecrate / damage / repair / lose", () => {
  it("consecrates a new anchor at full integrity", () => {
    const state = consecrateAnchor(emptyAnchorState(), {
      kind: "place",
      name: "Tingen Chapel",
    });
    expect(state.anchors).toHaveLength(1);
    expect(state.anchors[0].integrity).toBe(ANCHOR_INTEGRITY_MAX);
    expect(state.anchors[0].kind).toBe("place");
    expect(state.anchors[0].name).toBe("Tingen Chapel");
  });

  it("rejects a blank name", () => {
    expect(() =>
      consecrateAnchor(emptyAnchorState(), { kind: "object", name: "  " }),
    ).toThrow();
  });

  it("rejects a duplicate name (case-insensitive)", () => {
    const state = consecrateAnchor(emptyAnchorState(), {
      kind: "object",
      name: "Holy Ring",
    });
    expect(() =>
      consecrateAnchor(state, { kind: "object", name: "holy ring" }),
    ).toThrow();
  });

  it("damages an anchor toward zero, clamped, without removing it", () => {
    const state = consecrateAnchor(emptyAnchorState(), {
      kind: "congregation",
      name: "Flock",
      // id omitted -> uuid; capture it
    });
    const id = state.anchors[0].id;
    const damaged = damageAnchor(state, id, 40);
    expect(damaged.anchors[0].integrity).toBe(60);
    // Over-damage clamps at 0 and keeps the anchor present (re-growable).
    const zeroed = damageAnchor(damaged, id, 999);
    expect(zeroed.anchors[0].integrity).toBe(0);
    expect(zeroed.anchors).toHaveLength(1);
    expect(isLost(zeroed.anchors[0])).toBe(true);
  });

  it("treats a negative damage amount as its magnitude", () => {
    const state = consecrateAnchor(emptyAnchorState(), {
      kind: "object",
      name: "Relic",
    });
    const id = state.anchors[0].id;
    expect(damageAnchor(state, id, -30).anchors[0].integrity).toBe(70);
  });

  it("repairs an anchor toward full, clamped", () => {
    let state = consecrateAnchor(emptyAnchorState(), {
      kind: "place",
      name: "Shrine",
    });
    const id = state.anchors[0].id;
    state = damageAnchor(state, id, 50);
    expect(repairAnchor(state, id, 20).anchors[0].integrity).toBe(70);
    expect(repairAnchor(state, id, 999).anchors[0].integrity).toBe(ANCHOR_INTEGRITY_MAX);
  });

  it("damage/repair leave other anchors untouched", () => {
    let state = consecrateAnchor(emptyAnchorState(), { kind: "object", name: "A" });
    state = consecrateAnchor(state, { kind: "place", name: "B" });
    const idA = state.anchors[0].id;
    const after = damageAnchor(state, idA, 10);
    expect(after.anchors[1].integrity).toBe(ANCHOR_INTEGRITY_MAX);
  });

  it("loseAnchor removes the anchor by id", () => {
    let state = consecrateAnchor(emptyAnchorState(), { kind: "object", name: "A" });
    state = consecrateAnchor(state, { kind: "place", name: "B" });
    const idA = state.anchors[0].id;
    const after = loseAnchor(state, idA);
    expect(after.anchors).toHaveLength(1);
    expect(after.anchors[0].name).toBe("B");
  });

  it("damaging a congregation raises pressure for an Angel (canon anchor theft)", () => {
    const before = anchorPressure(congregation(100), 1);
    const stolen = damageAnchor(congregation(100), "c1", 80);
    const after = anchorPressure(stolen, 1);
    expect(after).toBeLessThan(before);
  });
});

describe("anchors — demigod traits data", () => {
  it("has an entry for each demigod tier (Seq 4-1)", () => {
    for (const level of [4, 3, 2, 1]) {
      const t = DEMIGOD_TRAITS[level];
      expect(t).toBeDefined();
      expect(t.title.length).toBeGreaterThan(0);
      expect(t.lifespan.length).toBeGreaterThan(0);
      expect(t.mythicalForm.length).toBeGreaterThan(0);
      expect(t.prayerResponse.length).toBeGreaterThan(0);
    }
  });

  it("titles track the canon tiers", () => {
    expect(DEMIGOD_TRAITS[4].title).toBe("Saint");
    expect(DEMIGOD_TRAITS[3].title).toBe("Saint");
    expect(DEMIGOD_TRAITS[2].title).toBe("Angel");
    expect(DEMIGOD_TRAITS[1].title).toBe("King of Angels");
  });
});

describe("anchors — session-shape validation", () => {
  it("accepts a well-formed AnchorState", () => {
    expect(isValidAnchorStateShape(emptyAnchorState())).toBe(true);
    expect(isValidAnchorStateShape(congregation(50))).toBe(true);
  });

  it("rejects non-objects and arrays", () => {
    expect(isValidAnchorStateShape(null)).toBe(false);
    expect(isValidAnchorStateShape(42)).toBe(false);
    expect(isValidAnchorStateShape([])).toBe(false);
  });

  it("rejects a missing or non-array anchors field", () => {
    expect(isValidAnchorStateShape({})).toBe(false);
    expect(isValidAnchorStateShape({ anchors: "nope" })).toBe(false);
  });

  it("rejects anchors with a bad kind, id, name, or integrity", () => {
    expect(
      isValidAnchorStateShape({
        anchors: [{ id: "x", kind: "temple", name: "T", integrity: 10 }],
      }),
    ).toBe(false);
    expect(
      isValidAnchorStateShape({
        anchors: [{ id: "", kind: "object", name: "T", integrity: 10 }],
      }),
    ).toBe(false);
    expect(
      isValidAnchorStateShape({
        anchors: [{ id: "x", kind: "object", name: 5, integrity: 10 }],
      }),
    ).toBe(false);
    expect(
      isValidAnchorStateShape({
        anchors: [{ id: "x", kind: "object", name: "T", integrity: 200 }],
      }),
    ).toBe(false);
    expect(
      isValidAnchorStateShape({
        anchors: [{ id: "x", kind: "object", name: "T", integrity: -1 }],
      }),
    ).toBe(false);
    expect(
      isValidAnchorStateShape({
        anchors: [{ id: "x", kind: "object", name: "T", integrity: "lots" }],
      }),
    ).toBe(false);
    expect(isValidAnchorStateShape({ anchors: [null] })).toBe(false);
  });
});
