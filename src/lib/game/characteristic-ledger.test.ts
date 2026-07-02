import { describe, expect, it } from "vitest";
import type { BeyonderCharacteristic } from "@/lib/types/rules";

import {
  convergenceFor,
  convergenceNarratorContext,
  emptyLedger,
  isValidCharacteristicLedgerShape,
  ledgerCharacteristicItemName,
  precipitatedItemsFor,
  precipitationFact,
  recordPrecipitation,
  resolveCharacteristicLedger,
} from "./characteristic-ledger";
import {
  createDefaultGameState,
  createSession,
  deserializeSession,
  serializeSession,
} from "./session";
import type { GameSession } from "./types";

function makeSession(pathwayId = 1, sequenceLevel = 9): GameSession {
  const gameState = createDefaultGameState(pathwayId, "char-1", "Klein", "A seer.");
  return createSession({ ...gameState, sequenceLevel }, "session-1");
}

/**
 * A session carrying the given characteristics (both recorded in the ledger AND
 * present in inventory as their canon-named items) — the state after precipitating
 * and still holding them, which is what Convergence reads.
 */
function sessionCarrying(
  pathwayId: number,
  sequenceLevel: number,
  carried: BeyonderCharacteristic[],
): GameSession {
  const base = makeSession(pathwayId, sequenceLevel);
  const inventory = [
    ...base.gameState.inventory,
    ...carried.map((c) => ({
      name: ledgerCharacteristicItemName(c.pathwayId, c.sequenceLevel) ?? "Unknown",
      description: "",
      category: "main-ingredient" as const,
    })),
  ];
  return {
    ...base,
    gameState: { ...base.gameState, inventory },
    characteristicLedger: { characteristics: carried },
  };
}

describe("characteristic ledger — shape", () => {
  it("emptyLedger is an empty characteristics list", () => {
    expect(emptyLedger()).toEqual({ characteristics: [] });
  });

  it("resolveCharacteristicLedger falls back to empty for a save with none", () => {
    const session = makeSession();
    expect(resolveCharacteristicLedger(session)).toEqual({ characteristics: [] });
  });

  it("resolveCharacteristicLedger returns the stored ledger when present", () => {
    const ledger = { characteristics: [{ pathwayId: 1, sequenceLevel: 8, quantity: 1 }] };
    const session = { ...makeSession(), characteristicLedger: ledger };
    expect(resolveCharacteristicLedger(session)).toBe(ledger);
  });

  it("validates a well-formed ledger", () => {
    expect(isValidCharacteristicLedgerShape({ characteristics: [] })).toBe(true);
    expect(
      isValidCharacteristicLedgerShape({
        characteristics: [{ pathwayId: 1, sequenceLevel: 8, quantity: 2 }],
      }),
    ).toBe(true);
  });

  it("rejects malformed ledgers", () => {
    expect(isValidCharacteristicLedgerShape(null)).toBe(false);
    expect(isValidCharacteristicLedgerShape([])).toBe(false);
    expect(isValidCharacteristicLedgerShape({})).toBe(false);
    expect(isValidCharacteristicLedgerShape({ characteristics: {} })).toBe(false);
    expect(
      isValidCharacteristicLedgerShape({ characteristics: [{ pathwayId: 1 }] }),
    ).toBe(false);
    expect(
      isValidCharacteristicLedgerShape({
        characteristics: [{ pathwayId: 1, sequenceLevel: 8, quantity: 0 }],
      }),
    ).toBe(false);
    expect(
      isValidCharacteristicLedgerShape({
        characteristics: [{ pathwayId: "x", sequenceLevel: 8, quantity: 1 }],
      }),
    ).toBe(false);
    expect(isValidCharacteristicLedgerShape({ characteristics: [null] })).toBe(false);
  });
});

describe("characteristic ledger — item naming + minting", () => {
  it("names a characteristic item by its canon role (matching the potion convention)", () => {
    const name = ledgerCharacteristicItemName(1, 9);
    expect(name).toBe("Seer Beyonder Characteristic");
  });

  it("returns null for an unknown pathway/sequence", () => {
    expect(ledgerCharacteristicItemName(999, 9)).toBeNull();
    expect(ledgerCharacteristicItemName(1, 42)).toBeNull();
  });

  it("mints one recoverable main-ingredient item per unit", () => {
    const items = precipitatedItemsFor([{ pathwayId: 1, sequenceLevel: 9, quantity: 2 }]);
    expect(items).toHaveLength(2);
    expect(items[0].category).toBe("main-ingredient");
    expect(items[0].name).toBe("Seer Beyonder Characteristic");
  });

  it("skips drops with an unknown pathway/sequence", () => {
    const items = precipitatedItemsFor([
      { pathwayId: 999, sequenceLevel: 9, quantity: 1 },
    ]);
    expect(items).toEqual([]);
  });

  it("treats a fractional/zero quantity as at least one unit", () => {
    const items = precipitatedItemsFor([
      { pathwayId: 1, sequenceLevel: 9, quantity: 0.4 },
    ]);
    expect(items).toHaveLength(1);
  });
});

describe("characteristic ledger — precipitation (Indestructibility)", () => {
  it("records a death-drop into an empty ledger", () => {
    const drop: BeyonderCharacteristic = { pathwayId: 1, sequenceLevel: 8, quantity: 1 };
    const ledger = recordPrecipitation(emptyLedger(), [drop]);
    expect(ledger.characteristics).toEqual([
      { pathwayId: 1, sequenceLevel: 8, quantity: 1 },
    ]);
  });

  it("increments an existing entry rather than duplicating it", () => {
    const before = { characteristics: [{ pathwayId: 1, sequenceLevel: 8, quantity: 1 }] };
    const ledger = recordPrecipitation(before, [
      { pathwayId: 1, sequenceLevel: 8, quantity: 2 },
    ]);
    expect(ledger.characteristics).toEqual([
      { pathwayId: 1, sequenceLevel: 8, quantity: 3 },
    ]);
  });

  it("does not mutate the input ledger", () => {
    const before = { characteristics: [{ pathwayId: 1, sequenceLevel: 8, quantity: 1 }] };
    recordPrecipitation(before, [{ pathwayId: 1, sequenceLevel: 8, quantity: 1 }]);
    expect(before.characteristics[0].quantity).toBe(1);
  });

  it("refuses a malformed (non-positive) drop rather than minting it", () => {
    const ledger = recordPrecipitation(emptyLedger(), [
      { pathwayId: 1, sequenceLevel: 8, quantity: 0 },
    ]);
    expect(ledger.characteristics).toEqual([]);
  });

  it("skips an unknown-pathway drop (so the ledger matches what was minted)", () => {
    const ledger = recordPrecipitation(emptyLedger(), [
      { pathwayId: 999, sequenceLevel: 9, quantity: 1 },
      { pathwayId: 1, sequenceLevel: 8, quantity: 1 },
    ]);
    // Only the resolvable drop is recorded — the same skip `precipitatedItemsFor`
    // applies, so the ledger never carries an entry with no inventory counterpart.
    expect(ledger.characteristics).toEqual([
      { pathwayId: 1, sequenceLevel: 8, quantity: 1 },
    ]);
    expect(
      precipitatedItemsFor([{ pathwayId: 999, sequenceLevel: 9, quantity: 1 }]),
    ).toEqual([]);
  });

  it("records the same unit count a fractional drop mints", () => {
    const ledger = recordPrecipitation(emptyLedger(), [
      { pathwayId: 1, sequenceLevel: 8, quantity: 1.6 },
    ]);
    expect(ledger.characteristics).toEqual([
      { pathwayId: 1, sequenceLevel: 8, quantity: 1 },
    ]);
    expect(
      precipitatedItemsFor([{ pathwayId: 1, sequenceLevel: 8, quantity: 1.6 }]),
    ).toHaveLength(1);
  });
});

describe("characteristic ledger — Convergence", () => {
  it("returns none when nothing is recorded", () => {
    const result = convergenceFor(makeSession(1, 9));
    expect(result.strength).toBe("none");
    expect(convergenceNarratorContext(makeSession(1, 9))).toBeNull();
  });

  it("is strong (and renders a beat) for a same-pathway characteristic still carried", () => {
    const session = sessionCarrying(1, 9, [
      { pathwayId: 1, sequenceLevel: 8, quantity: 1 },
    ]);
    expect(convergenceFor(session).strength).toBe("strong");
    const ctx = convergenceNarratorContext(session);
    expect(ctx).toContain("Convergence");
    expect(ctx).toContain("strongly");
  });

  it("is weak for only a neighbouring-pathway characteristic still carried", () => {
    // Pathways 2 and 3 (Visionary/Sun) are neighbours.
    const session = sessionCarrying(2, 9, [
      { pathwayId: 3, sequenceLevel: 9, quantity: 1 },
    ]);
    expect(convergenceFor(session).strength).toBe("weak");
    expect(convergenceNarratorContext(session)).toContain("faintly");
  });

  it("drops the beat for an unrelated-pathway characteristic only", () => {
    const session = sessionCarrying(1, 9, [
      { pathwayId: 4, sequenceLevel: 9, quantity: 1 },
    ]);
    expect(convergenceFor(session).strength).toBe("none");
    expect(convergenceNarratorContext(session)).toBeNull();
  });

  it("self-corrects: a recorded characteristic no longer carried stops steering fate", () => {
    // The ledger still records the precipitation, but the item has left inventory
    // (drunk/traded/crafted away) — Convergence must go quiet rather than stay on.
    const session: GameSession = {
      ...makeSession(1, 9),
      characteristicLedger: {
        characteristics: [{ pathwayId: 1, sequenceLevel: 8, quantity: 1 }],
      },
    };
    const charName = ledgerCharacteristicItemName(1, 8);
    expect(session.gameState.inventory.map((i) => i.name)).not.toContain(charName);
    expect(convergenceFor(session).strength).toBe("none");
    expect(convergenceNarratorContext(session)).toBeNull();
  });
});

describe("characteristic ledger — memory fact", () => {
  it("builds an item-change fact naming the recovered characteristics", () => {
    const items = precipitatedItemsFor([{ pathwayId: 1, sequenceLevel: 9, quantity: 1 }]);
    const fact = precipitationFact(items, 7);
    expect(fact.type).toBe("item-change");
    expect(fact.turnNumber).toBe(7);
    expect(fact.description).toContain("Seer Beyonder Characteristic");
  });
});

describe("characteristic ledger — session round-trip", () => {
  it("preserves a valid ledger through (de)serialize", () => {
    const session: GameSession = {
      ...makeSession(),
      characteristicLedger: {
        characteristics: [{ pathwayId: 1, sequenceLevel: 8, quantity: 2 }],
      },
    };
    const round = deserializeSession(serializeSession(session));
    expect(round?.characteristicLedger).toEqual(session.characteristicLedger);
  });

  it("rejects a save carrying a malformed ledger", () => {
    const session = {
      ...makeSession(),
      characteristicLedger: { characteristics: [{ pathwayId: 1 }] },
    } as unknown as GameSession;
    expect(deserializeSession(serializeSession(session))).toBeNull();
  });

  it("a save with no ledger stays valid and round-trips without one", () => {
    const round = deserializeSession(serializeSession(makeSession()));
    expect(round).not.toBeNull();
    expect(round?.characteristicLedger).toBeUndefined();
  });
});
