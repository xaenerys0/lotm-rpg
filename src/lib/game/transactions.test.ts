import { describe, expect, it } from "vitest";

import type { Item } from "@/lib/types/rules";
import type { TransactionIntent } from "@/lib/ai";

import { TRANSACTION_FUNDS_CAP, applyTransactions, formatPence } from "./transactions";
import { PARAGON_PATHWAY_ID } from "./artifice";
import { getFunds } from "./marketplace";
import { createDefaultGameState, createSession } from "./session";
import type { GameSession } from "./types";

function mundane(name: string): Item {
  return { name, description: "An ordinary thing.", category: "mundane" };
}
function reagent(name: string): Item {
  return { name, description: "A reagent.", category: "main-ingredient" };
}
function uniqueness(name: string): Item {
  return { name, description: "The singular artifact.", category: "uniqueness" };
}
function characteristic(seq: number, pathway = "Paragon"): Item {
  return {
    name: `Sequence ${seq} ${pathway} Beyonder Characteristic`,
    description: "A precipitated characteristic.",
    category: "main-ingredient",
  };
}

function session(
  inventory: Item[] = [],
  funds = 100_000,
  pathwayId = 1,
  sequenceLevel = 5,
): GameSession {
  const base = createDefaultGameState(pathwayId, "c1", "Tester");
  return createSession({ ...base, sequenceLevel, inventory, funds }, "s1");
}

const NOW = 1_700_000_000_000;

function names(inv: Item[]): string[] {
  return inv.map((i) => i.name);
}

describe("formatPence", () => {
  it("formats pounds / soli / pence, omitting empty units", () => {
    expect(formatPence(0)).toBe("0d");
    expect(formatPence(11)).toBe("11d");
    expect(formatPence(12)).toBe("1s");
    expect(formatPence(240)).toBe("1£");
    expect(formatPence(253)).toBe("1£ 1s 1d");
    expect(formatPence(-24)).toBe("2s"); // magnitude
  });
});

describe("applyTransactions — no-ops", () => {
  it("returns the session unchanged for undefined / empty intents", () => {
    const s = session([mundane("Coat")]);
    expect(applyTransactions(s, undefined, NOW).session).toBe(s);
    const empty = applyTransactions(s, [], NOW);
    expect(empty.applied).toEqual([]);
    expect(empty.refused).toEqual([]);
  });
});

describe("applyTransactions — purchase", () => {
  it("debits funds and adds the bought item", () => {
    const s = session([], 500);
    const intent: TransactionIntent = {
      kind: "purchase",
      counterparty: "a vendor",
      fundsDelta: -120,
      itemsIn: [mundane("Brass Key")],
    };
    const { session: next, applied, refused } = applyTransactions(s, [intent], NOW);
    expect(refused).toEqual([]);
    expect(getFunds(next.gameState)).toBe(380);
    expect(names(next.gameState.inventory)).toContain("Brass Key");
    expect(applied[0]).toMatchObject({ kind: "purchase", fundsDelta: -120 });
    expect(applied[0].itemsIn).toEqual(["Brass Key"]);
    expect(applied[0].summary).toContain("Bought Brass Key");
  });

  it("refuses an unaffordable purchase and mutates nothing", () => {
    const s = session([], 50);
    const intent: TransactionIntent = {
      kind: "purchase",
      counterparty: "a vendor",
      fundsDelta: -400,
      itemsIn: [mundane("Silver Watch")],
    };
    const { session: next, applied, refused } = applyTransactions(s, [intent], NOW);
    expect(applied).toEqual([]);
    expect(refused[0].reason).toMatch(/couldn't cover/);
    expect(getFunds(next.gameState)).toBe(50);
    expect(next.gameState.inventory).toHaveLength(0);
    // The refusal is surfaced as an in-world memory fact.
    expect(
      next.memory.sessionFacts.some((f) => f.description.includes("fell through")),
    ).toBe(true);
  });

  it("refuses bringing in a reagent (kept on its acquisition gate)", () => {
    const s = session([], 100_000);
    const intent: TransactionIntent = {
      kind: "purchase",
      counterparty: "a smuggler",
      fundsDelta: -50,
      itemsIn: [reagent("Sequence 5 Corpse Collector Beyonder Characteristic")],
    };
    const { session: next, applied, refused } = applyTransactions(s, [intent], NOW);
    expect(applied).toEqual([]);
    expect(refused[0].reason).toMatch(/proper channels/);
    expect(getFunds(next.gameState)).toBe(100_000);
    expect(next.gameState.inventory).toHaveLength(0);
  });

  it("summarizes a pure payment (a purchase with no item, e.g. a bribe)", () => {
    const s = session([], 500);
    const { applied } = applyTransactions(
      s,
      [{ kind: "purchase", counterparty: "a guard", fundsDelta: -100 }],
      NOW,
    );
    expect(applied[0].summary).toBe("Paid a guard 8s 4d.");
  });

  it("clamps an absurd purchase price to the per-intent cap", () => {
    const s = session([], 10_000_000);
    const intent: TransactionIntent = {
      kind: "purchase",
      counterparty: "a swindler",
      fundsDelta: -9_999_999,
      itemsIn: [mundane("A Deed")],
    };
    const { session: next, applied } = applyTransactions(s, [intent], NOW);
    expect(applied[0].fundsDelta).toBe(-TRANSACTION_FUNDS_CAP);
    expect(getFunds(next.gameState)).toBe(10_000_000 - TRANSACTION_FUNDS_CAP);
  });
});

describe("applyTransactions — sale", () => {
  it("credits funds (clamped to the band) and removes the sold item", () => {
    const s = session([mundane("Old Amulet")], 0);
    const intent: TransactionIntent = {
      kind: "sale",
      counterparty: "a collector",
      fundsDelta: 999_999, // absurd; clamped to the mundane band max (40)
      itemsOut: [{ name: "Old Amulet", description: "", category: "mundane" }],
    };
    const { session: next, applied } = applyTransactions(s, [intent], NOW);
    expect(applied[0].fundsDelta).toBe(40); // mundane max band
    expect(getFunds(next.gameState)).toBe(40);
    expect(names(next.gameState.inventory)).not.toContain("Old Amulet");
    expect(applied[0].summary).toContain("Sold Old Amulet");
  });

  it("defaults an omitted price to the band's suggested value", () => {
    const s = session([reagent("Rat Bile")], 0);
    const intent: TransactionIntent = {
      kind: "sale",
      counterparty: "an alchemist",
      itemsOut: [{ name: "Rat Bile", description: "", category: "main-ingredient" }],
    };
    const { applied } = applyTransactions(s, [intent], NOW);
    // main-ingredient suggested band = 350.
    expect(applied[0].fundsDelta).toBe(350);
  });

  it("refuses selling something not owned", () => {
    const s = session([], 0);
    const intent: TransactionIntent = {
      kind: "sale",
      counterparty: "a fence",
      fundsDelta: 100,
      itemsOut: [{ name: "Phantom Ring", description: "", category: "mundane" }],
    };
    const { session: next, applied, refused } = applyTransactions(s, [intent], NOW);
    expect(applied).toEqual([]);
    expect(refused[0].reason).toMatch(/had no Phantom Ring/);
    expect(getFunds(next.gameState)).toBe(0);
  });

  it("refuses a sale with nothing to sell", () => {
    const s = session([], 0);
    const { applied, refused } = applyTransactions(
      s,
      [{ kind: "sale", counterparty: "a fence", fundsDelta: 100 }],
      NOW,
    );
    expect(applied).toEqual([]);
    expect(refused[0].reason).toMatch(/nothing to sell/);
  });

  it("refuses selling more copies than are owned (no quantity exploit)", () => {
    const s = session([mundane("Silver Coin")], 0); // only one owned
    const intent: TransactionIntent = {
      kind: "sale",
      counterparty: "a collector",
      itemsOut: [
        { name: "Silver Coin", description: "", category: "mundane" },
        { name: "Silver Coin", description: "", category: "mundane" },
      ],
    };
    const { session: next, applied, refused } = applyTransactions(s, [intent], NOW);
    expect(applied).toEqual([]);
    expect(refused[0].reason).toMatch(/had no Silver Coin/);
    expect(getFunds(next.gameState)).toBe(0);
    expect(names(next.gameState.inventory)).toEqual(["Silver Coin"]);
  });

  it("refuses selling an untradeable item (the Uniqueness)", () => {
    const s = session([uniqueness("The Fool's Marionette")], 0);
    const intent: TransactionIntent = {
      kind: "sale",
      counterparty: "a broker",
      fundsDelta: 5000,
      itemsOut: [
        { name: "The Fool's Marionette", description: "", category: "uniqueness" },
      ],
    };
    const { session: next, applied, refused } = applyTransactions(s, [intent], NOW);
    expect(applied).toEqual([]);
    expect(refused[0].reason).toMatch(/not something you could trade away/);
    expect(names(next.gameState.inventory)).toContain("The Fool's Marionette");
  });
});

describe("applyTransactions — barter", () => {
  it("moves both item legs and applies a clamped boot", () => {
    const s = session([mundane("Pocket Watch")], 1000);
    const intent: TransactionIntent = {
      kind: "barter",
      counterparty: "a tinker",
      fundsDelta: -50, // small boot the character pays
      itemsOut: [{ name: "Pocket Watch", description: "", category: "mundane" }],
      itemsIn: [mundane("Compass")],
    };
    const { session: next, applied } = applyTransactions(s, [intent], NOW);
    expect(names(next.gameState.inventory)).toEqual(["Compass"]);
    expect(getFunds(next.gameState)).toBe(950);
    expect(applied[0].summary).toContain("Bartered Pocket Watch");
  });

  it("moves multiple items on each leg (prose lists two and three names)", () => {
    const s = session([mundane("Ring"), mundane("Coin")], 0);
    const intent: TransactionIntent = {
      kind: "barter",
      counterparty: "a dealer",
      itemsOut: [
        { name: "Ring", description: "", category: "mundane" },
        { name: "Coin", description: "", category: "mundane" },
      ],
      itemsIn: [mundane("Vial"), mundane("Cloth"), mundane("Chain")],
    };
    const { session: next, applied } = applyTransactions(s, [intent], NOW);
    expect(names(next.gameState.inventory)).toEqual(["Vial", "Cloth", "Chain"]);
    expect(applied[0].summary).toBe(
      "Bartered Ring and Coin to a dealer for Vial, Cloth, and Chain.",
    );
  });

  it("refuses to mint cash on a barter (positive boot clamped to zero)", () => {
    // A cheap item out + a large positive delta must NOT pay out — that inflow
    // path is a sale (band-valued). The item still changes hands; no money mints.
    const s = session([mundane("Twine")], 0);
    const intent: TransactionIntent = {
      kind: "barter",
      counterparty: "a mark",
      fundsDelta: 50_000,
      itemsOut: [{ name: "Twine", description: "", category: "mundane" }],
      itemsIn: [mundane("Button")],
    };
    const { session: next, applied } = applyTransactions(s, [intent], NOW);
    expect(applied[0].fundsDelta).toBe(0);
    expect(getFunds(next.gameState)).toBe(0);
    expect(names(next.gameState.inventory)).toEqual(["Button"]);
  });

  it("falls back to 'goods' when a barter leg has no items", () => {
    // Give an item for a cash boot (no incoming item) → inNames falls back.
    const giveOnly = applyTransactions(
      session([mundane("Brooch")], 0),
      [
        {
          kind: "barter",
          counterparty: "a buyer",
          fundsDelta: 30,
          itemsOut: [{ name: "Brooch", description: "", category: "mundane" }],
        },
      ],
      NOW,
    );
    expect(giveOnly.applied[0].summary).toBe("Bartered Brooch to a buyer for goods.");
    // Receive an item for a cash boot (no outgoing item) → outNames falls back.
    const getOnly = applyTransactions(
      session([], 500),
      [
        {
          kind: "barter",
          counterparty: "a seller",
          fundsDelta: -30,
          itemsIn: [mundane("Trinket")],
        },
      ],
      NOW,
    );
    expect(getOnly.applied[0].summary).toBe("Bartered goods to a seller for Trinket.");
  });
});

describe("applyTransactions — gift", () => {
  it("gives an owned item away with no funds movement", () => {
    const s = session([mundane("Locket")], 200);
    const intent: TransactionIntent = {
      kind: "gift",
      counterparty: "a friend",
      itemsOut: [{ name: "Locket", description: "", category: "mundane" }],
    };
    const { session: next, applied } = applyTransactions(s, [intent], NOW);
    expect(next.gameState.inventory).toHaveLength(0);
    expect(getFunds(next.gameState)).toBe(200);
    expect(applied[0].summary).toBe("Gave Locket to a friend.");
  });

  it("does not credit cash when an item is gifted away (one-sided)", () => {
    const s = session([mundane("Ring")], 100);
    const intent: TransactionIntent = {
      kind: "gift",
      counterparty: "a rival",
      fundsDelta: 5000, // a gift GIVEN takes no money back
      itemsOut: [{ name: "Ring", description: "", category: "mundane" }],
    };
    const { session: next, applied } = applyTransactions(s, [intent], NOW);
    expect(applied[0].fundsDelta).toBe(0);
    expect(getFunds(next.gameState)).toBe(100);
    expect(next.gameState.inventory).toHaveLength(0);
  });

  it("receives an item and a clamped cash gift", () => {
    const s = session([], 0);
    const intent: TransactionIntent = {
      kind: "gift",
      counterparty: "a patron",
      fundsDelta: 9_999_999, // clamped to TRANSACTION_FUNDS_CAP
      itemsIn: [mundane("Letter of Introduction")],
    };
    const { session: next, applied } = applyTransactions(s, [intent], NOW);
    expect(getFunds(next.gameState)).toBe(TRANSACTION_FUNDS_CAP);
    expect(names(next.gameState.inventory)).toContain("Letter of Introduction");
    expect(applied[0].summary).toContain("Received Letter of Introduction and");
  });

  it("ignores a negative fundsDelta on a gift (one-sided)", () => {
    const s = session([], 500);
    const intent: TransactionIntent = {
      kind: "gift",
      counterparty: "a beggar",
      fundsDelta: -300,
      itemsIn: [mundane("A Crust of Bread")],
    };
    const { session: next, applied } = applyTransactions(s, [intent], NOW);
    expect(getFunds(next.gameState)).toBe(500);
    expect(applied[0].fundsDelta).toBe(0);
    expect(applied[0].summary).toBe("Received A Crust of Bread from a beggar.");
  });

  it("summarizes a pure cash gift", () => {
    const s = session([], 0);
    const { applied } = applyTransactions(
      s,
      [{ kind: "gift", counterparty: "a stranger", fundsDelta: 24 }],
      NOW,
    );
    expect(applied[0].summary).toBe("Received 2s from a stranger.");
  });
});

describe("applyTransactions — commission", () => {
  it("routes through craftArtifact: mints the artifact, consumes the characteristic, debits the fee", () => {
    const s = session([characteristic(6)], 100_000, PARAGON_PATHWAY_ID, 6);
    const intent: TransactionIntent = {
      kind: "commission",
      counterparty: "an artisan",
      commission: {
        characteristicItemName: "Sequence 6 Paragon Beyonder Characteristic",
        artifactName: "Whispering Compass",
      },
    };
    const { session: next, applied, refused } = applyTransactions(s, [intent], NOW);
    expect(refused).toEqual([]);
    // Characteristic consumed; a crafted artifact minted in its place.
    expect(names(next.gameState.inventory)).not.toContain(
      "Sequence 6 Paragon Beyonder Characteristic",
    );
    expect(next.gameState.inventory.some((i) => i.category === "sealed-artifact")).toBe(
      true,
    );
    expect(getFunds(next.gameState)).toBeLessThan(100_000);
    expect(applied[0]).toMatchObject({ kind: "commission", counterparty: "an artisan" });
    expect(applied[0].summary).toContain("Commissioned Whispering Compass");
  });

  it("refuses a commission with no inputs", () => {
    const s = session([], 100_000);
    const { applied, refused } = applyTransactions(
      s,
      [{ kind: "commission", counterparty: "an artisan" }],
      NOW,
    );
    expect(applied).toEqual([]);
    expect(refused[0].reason).toMatch(/never spelled out/);
  });

  it("maps a craftArtifact refusal to an in-world lead", () => {
    const s = session([], 100_000);
    const intent: TransactionIntent = {
      kind: "commission",
      counterparty: "an artisan",
      commission: {
        characteristicItemName: "Sequence 6 Paragon Beyonder Characteristic", // not carried
        artifactName: "Ghost Bell",
      },
    };
    const { applied, refused } = applyTransactions(s, [intent], NOW);
    expect(applied).toEqual([]);
    expect(refused[0].reason).toMatch(/no fitting Beyonder Characteristic/);
  });
});

describe("applyTransactions — independence & atomicity", () => {
  it("applies the valid intents even when one is refused", () => {
    const s = session([mundane("Ledger")], 1000);
    const intents: TransactionIntent[] = [
      {
        kind: "purchase",
        counterparty: "a shop",
        fundsDelta: -100,
        itemsIn: [mundane("Ink")],
      },
      {
        kind: "sale",
        counterparty: "a fence",
        fundsDelta: 50,
        itemsOut: [{ name: "Nonexistent", description: "", category: "mundane" }],
      },
      {
        kind: "gift",
        counterparty: "a clerk",
        itemsOut: [{ name: "Ledger", description: "", category: "mundane" }],
      },
    ];
    const { session: next, applied, refused } = applyTransactions(s, intents, NOW);
    expect(applied).toHaveLength(2);
    expect(refused).toHaveLength(1);
    expect(names(next.gameState.inventory)).toEqual(["Ink"]); // Ledger gifted away, Ink bought
    expect(getFunds(next.gameState)).toBe(900);
  });
});
