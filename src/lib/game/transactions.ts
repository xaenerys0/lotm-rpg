import type { GameState, SessionFact, TransactionIntent } from "@/lib/ai";
import { addSessionFact } from "@/lib/ai";
import type { Item } from "@/lib/types/rules";

import type { GameSession } from "./types";
import { isReagentCategory, removeItemsByName } from "./inventory";
import {
  PRICE_GUIDANCE,
  addItemToInventory,
  adjustFunds,
  artifactPriceGuidance,
  canAfford,
  canFenceItem,
  isMarketTradeable,
} from "./marketplace";
import { craftArtifact, craftCapability, type CraftOutcome } from "./artifice";

// ---------------------------------------------------------------------------
// In-turn transactions (issue #226)
// ---------------------------------------------------------------------------
//
// The narrator brokers a deal in the fiction (a purchase, sale, barter, artifact
// commission, or gift) and emits a structured `TransactionIntent`. The ENGINE —
// never the AI — validates and applies each intent here, atomically, reusing the
// tested funds/inventory/artifice primitives. This preserves the issue-#90
// anti-exploit guarantee: money and items still never ride the AI-mutable
// `worldStateChanges` allowlist; they move only through this validated channel.
//
// Guarantees:
//   - Affordability, ownership, category, tradeability, artifice gates, and
//     per-turn caps are all engine-enforced.
//   - A reagent or Sealed Artifact can NEVER be minted IN — those keep their
//     existing acquisition gates (purchase/hunt/grant). Items the character
//     already OWNS may be sold/bartered/gifted away, gated by tradeability.
//   - Nothing mutates on refusal; a refused intent becomes an in-world
//     `SessionFact` lead (the `discoveredItemLeadFact` / `freeTextRejection`
//     convention), never a throw and never a silent drop.
//
// Pure + deterministic (injected `now`). The React layer runs this in the
// per-turn commit tick chain (`applyAndCommitTurn`), where the full session —
// including `customArtifactState`, which a commission needs — is available.

/** The transaction kinds the engine applies. */
export type TransactionKind = "purchase" | "sale" | "barter" | "commission" | "gift";

/**
 * Per-intent backstop clamp (pence) on a flat funds swing with no item to value
 * against — a purchase price, a barter boot, a cash gift. 60000 pence = £250: a
 * substantial negotiated deal, far above the street-find `FUNDS_DISCOVERED_CAP`
 * (£10), but bounded so a "gift" can't conjure a fortune. A SALE is valued by the
 * sold item's price band instead (which caps a mundane trinket at pennies and a
 * high-grade artifact appropriately high), so it is not subject to this flat cap.
 */
export const TRANSACTION_FUNDS_CAP = 60000;

/** A transaction the engine applied, for the consequences recap. */
export interface AppliedTransaction {
  kind: TransactionKind;
  counterparty: string;
  /** Signed pence actually applied to the wallet (after clamping). */
  fundsDelta: number;
  /** Names of items that entered the inventory. */
  itemsIn: string[];
  /** Names of items that left the inventory. */
  itemsOut: string[];
  /** Diegetic one-line summary (also seeded as a memory fact). */
  summary: string;
}

/** A transaction the engine refused, surfaced as in-world narration. */
export interface RefusedTransaction {
  kind: string;
  counterparty: string;
  /** In-world lead explaining why the deal fell through. */
  reason: string;
}

export interface TransactionsResult {
  session: GameSession;
  applied: AppliedTransaction[];
  refused: RefusedTransaction[];
}

/** Format pence as Loen currency (12 pence = 1 soli, 20 soli = 1 pound). Pure. */
export function formatPence(pence: number): string {
  const total = Math.abs(Math.trunc(pence));
  const pounds = Math.floor(total / 240);
  const soli = Math.floor((total % 240) / 12);
  const d = total % 12;
  const parts: string[] = [];
  if (pounds > 0) parts.push(`${pounds}£`);
  if (soli > 0) parts.push(`${soli}s`);
  if (d > 0 || parts.length === 0) parts.push(`${d}d`);
  return parts.join(" ");
}

/** Join item names for prose, e.g. "the amulet and the ledger". */
function nameList(items: Item[]): string {
  const names = items.map((i) => i.name);
  if (names.length <= 1) return names[0] ?? "";
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
}

/** Whether an item the character owns may be traded/given away (never a Uniqueness or church relic). */
function isTradeableAway(item: Item): boolean {
  return isMarketTradeable(item) || canFenceItem(item);
}

/** The fair price band (pence) a single owned item fetches when sold. */
function saleBand(item: Item): { suggested: number; max: number } {
  const band =
    item.category === "sealed-artifact"
      ? artifactPriceGuidance(item)
      : PRICE_GUIDANCE[item.category];
  return { suggested: band.suggested, max: band.max };
}

function refusalFact(reason: string, turnNumber: number): SessionFact {
  return { type: "quest-progress", description: reason, turnNumber };
}

function successFact(description: string, turnNumber: number): SessionFact {
  return { type: "event", description, turnNumber };
}

/** The lead text for a refused-transaction reason. */
const CRAFT_REFUSAL_REASON: Record<Exclude<CraftOutcome, "crafted">, string> = {
  "no-capability":
    "no artisan you could reach would take the commission, so nothing was forged",
  "missing-characteristic":
    "you had no fitting Beyonder Characteristic to fuse, so the commission came to nothing",
  "god-tier-forbidden":
    "no artisan could bind a power so far beyond mortal craft; the commission was refused",
  "invalid-name": "the commission was never properly named, and nothing was forged",
  unaffordable: "you could not cover the artisan's fee, so the commission fell through",
  "at-capacity":
    "you could carry no more crafted relics, so the commission was set aside",
};

/**
 * Validate and apply the narrator's in-turn transactions to the session. Each
 * intent is validated and applied INDEPENDENTLY — one refusal never blocks the
 * others — and nothing mutates on a refusal. Returns the updated session plus the
 * applied / refused summaries for the consequences recap. Pure + deterministic.
 */
export function applyTransactions(
  session: GameSession,
  intents: TransactionIntent[] | undefined,
  now: number = Date.now(),
): TransactionsResult {
  const applied: AppliedTransaction[] = [];
  const refused: RefusedTransaction[] = [];
  if (!intents || intents.length === 0) {
    return { session, applied, refused };
  }

  let working = session;
  const turnNumber = session.turnCount;

  const refuse = (intent: TransactionIntent, reason: string) => {
    refused.push({ kind: intent.kind, counterparty: intent.counterparty, reason });
    working = {
      ...working,
      memory: addSessionFact(working.memory, refusalFact(reason, turnNumber)),
    };
  };

  const succeed = (
    intent: TransactionIntent,
    nextState: GameState,
    fundsDelta: number,
    itemsIn: string[],
    itemsOut: string[],
    summary: string,
  ) => {
    applied.push({
      kind: intent.kind as TransactionKind,
      counterparty: intent.counterparty,
      fundsDelta,
      itemsIn,
      itemsOut,
      summary,
    });
    working = {
      ...working,
      gameState: nextState,
      memory: addSessionFact(working.memory, successFact(summary, turnNumber)),
      updatedAt: now,
    };
  };

  for (const intent of intents) {
    const who = intent.counterparty;
    const itemsIn = intent.itemsIn ?? [];
    const itemsOut = intent.itemsOut ?? [];

    // A commission routes entirely through the artifice engine (which owns the
    // consume-characteristic + debit-fee + mint), ignoring itemsIn/out/fundsDelta.
    if (intent.kind === "commission") {
      if (!intent.commission) {
        refuse(
          intent,
          `The commission with ${who} was never spelled out, and nothing was forged.`,
        );
        continue;
      }
      const capability = craftCapability(working);
      const result = craftArtifact(
        working,
        {
          characteristicItemName: intent.commission.characteristicItemName,
          mode: capability.canSelfCraft ? "self" : "commission",
          name: intent.commission.artifactName,
          flavor: intent.commission.flavor,
        },
        now,
      );
      if (result.outcome !== "crafted") {
        refuse(
          intent,
          `The commission with ${who} fell through — ${CRAFT_REFUSAL_REASON[result.outcome]}.`,
        );
        continue;
      }
      // On "crafted", `craftArtifact` always returns `session`/`item`/`fee` and has
      // already seeded its own crafted-artifact fact + stamped the session; adopt
      // it wholesale and record the applied summary.
      working = result.session!;
      const fee = result.fee ?? 0;
      applied.push({
        kind: "commission",
        counterparty: who,
        fundsDelta: -fee,
        itemsIn: [result.item!.name],
        itemsOut: [intent.commission.characteristicItemName],
        summary: `Commissioned ${intent.commission.artifactName} from ${who} for ${formatPence(fee)}.`,
      });
      continue;
    }

    // Items RECEIVED may only be mundane loot or the singular Uniqueness — a
    // reagent (or a Sealed Artifact, which parse coerces to mundane) can never be
    // minted through a deal; it keeps its existing acquisition gate.
    const blockedIn = itemsIn.find((i) => isReagentCategory(i.category));
    if (blockedIn) {
      refuse(
        intent,
        `${blockedIn.name} can't simply be bought from ${who}; such things are come by through the proper channels — a seller through the market, or a hunt — so the deal came to nothing.`,
      );
      continue;
    }

    // Items GIVEN UP must be genuinely owned (matched by name against the real
    // inventory) and tradeable away — the engine trusts its own inventory's
    // category, not the AI's claimed one. A running count of the still-available
    // copies per name is decremented as each `itemsOut` entry claims one, so
    // trading away two of an item the character holds only one of is refused
    // (otherwise proceeds would be valued for two while `removeItemsByName` — one
    // removal per entry — could only take the single copy).
    const availableByName = new Map<string, number>();
    for (const carried of working.gameState.inventory) {
      availableByName.set(carried.name, (availableByName.get(carried.name) ?? 0) + 1);
    }
    let ownershipOk = true;
    for (const out of itemsOut) {
      const owned = working.gameState.inventory.find((i) => i.name === out.name);
      const remaining = availableByName.get(out.name) ?? 0;
      if (!owned || remaining <= 0) {
        refuse(
          intent,
          `You had no ${out.name} to give ${who}, so the deal fell through.`,
        );
        ownershipOk = false;
        break;
      }
      if (!isTradeableAway(owned)) {
        refuse(
          intent,
          `${owned.name} is not something you could trade away, so the deal with ${who} came to nothing.`,
        );
        ownershipOk = false;
        break;
      }
      availableByName.set(out.name, remaining - 1);
    }
    if (!ownershipOk) continue;

    // Resolve the funds movement, clamped per kind.
    const aiDelta = Number.isFinite(intent.fundsDelta)
      ? Math.trunc(intent.fundsDelta as number)
      : 0;
    let fundsDelta = 0;
    if (intent.kind === "sale" && itemsOut.length === 0) {
      refuse(intent, `There was nothing to sell ${who}, so the deal came to nothing.`);
      continue;
    }

    if (intent.kind === "sale") {
      // Proceeds are valued by the sold items' price bands, not the AI's number:
      // its price is clamped to the band max, and an omitted price defaults to the
      // band suggested — so a "sold" mundane trinket can never mint a fortune.
      let ceiling = 0;
      let suggested = 0;
      for (const out of itemsOut) {
        const owned = working.gameState.inventory.find((i) => i.name === out.name)!;
        const band = saleBand(owned);
        ceiling += band.max;
        suggested += band.suggested;
      }
      const asked = aiDelta > 0 ? aiDelta : suggested;
      fundsDelta = Math.min(Math.max(asked, 0), ceiling);
    } else if (intent.kind === "gift") {
      // A gift is one-sided. When the character GIVES an item away, no money comes
      // back (else "gift item out + cash in" would be a valuation-free sale); only
      // a purely inbound gift (no `itemsOut`) credits the wallet, bounded by the cap.
      fundsDelta =
        itemsOut.length > 0 ? 0 : Math.min(Math.max(aiDelta, 0), TRANSACTION_FUNDS_CAP);
    } else {
      // purchase / barter — money the character PAYS only (a boot on a barter, the
      // price on a purchase), clamped to [-CAP, 0]. Cash the character RECEIVES
      // must go through a "sale" so it is valued against the item's price band —
      // otherwise a "barter" (cheap item out + a large positive delta) would mint
      // money the band clamp is meant to bound.
      fundsDelta = Math.max(Math.min(aiDelta, 0), -TRANSACTION_FUNDS_CAP);
    }

    // Affordability: any net payment must be covered.
    if (fundsDelta < 0 && !canAfford(working.gameState, -fundsDelta)) {
      refuse(
        intent,
        `You couldn't cover what ${who} was asking (${formatPence(-fundsDelta)}), so the deal fell through.`,
      );
      continue;
    }

    // Apply: money then items out then items in.
    let nextState =
      fundsDelta !== 0 ? adjustFunds(working.gameState, fundsDelta) : working.gameState;
    if (itemsOut.length > 0) {
      nextState = {
        ...nextState,
        inventory: removeItemsByName(nextState.inventory, itemsOut),
      };
    }
    for (const item of itemsIn) {
      nextState = addItemToInventory(nextState, item);
    }

    const summary = summarize(intent.kind, who, itemsIn, itemsOut, fundsDelta);
    succeed(
      intent,
      nextState,
      fundsDelta,
      itemsIn.map((i) => i.name),
      itemsOut.map((i) => i.name),
      summary,
    );
  }

  return { session: working, applied, refused };
}

/** The diegetic summary for an applied non-commission transaction. Pure. */
function summarize(
  kind: string,
  who: string,
  itemsIn: Item[],
  itemsOut: Item[],
  fundsDelta: number,
): string {
  const inNames = nameList(itemsIn);
  const outNames = nameList(itemsOut);
  if (kind === "purchase") {
    return inNames
      ? `Bought ${inNames} from ${who} for ${formatPence(-fundsDelta)}.`
      : `Paid ${who} ${formatPence(-fundsDelta)}.`;
  }
  if (kind === "sale") {
    // A sale always carries an item (validated above), so `outNames` is set.
    return `Sold ${outNames} to ${who} for ${formatPence(fundsDelta)}.`;
  }
  if (kind === "barter") {
    return `Bartered ${outNames || "goods"} to ${who} for ${inNames || "goods"}.`;
  }
  // gift — one-sided.
  if (outNames) return `Gave ${outNames} to ${who}.`;
  if (inNames && fundsDelta > 0)
    return `Received ${inNames} and ${formatPence(fundsDelta)} from ${who}.`;
  if (inNames) return `Received ${inNames} from ${who}.`;
  return `Received ${formatPence(fundsDelta)} from ${who}.`;
}
