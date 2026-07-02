import type { SessionFact } from "@/lib/ai";
import {
  getSequence,
  validateCharacteristicTransfer,
  validateConvergence,
} from "@/lib/rules";
import type {
  BeyonderCharacteristic,
  CharacteristicTransfer,
  ConvergenceResult,
  Item,
  WorldCharacteristicLedger,
} from "@/lib/types/rules";

import type { GameSession } from "./types";

// ---------------------------------------------------------------------------
// The cosmic Laws of Beyonder Characteristics, wired into live simulation
// (issue #212). A LIGHT, single-player, per-save model — NOT a whole-world
// census. See `docs/laws-simulation-design.md`.
//
// - **Indestructibility** (felt): a slain Beyonder's characteristic is never
//   destroyed — it precipitates into a recoverable `main-ingredient` item and is
//   recorded in this ledger (`recordPrecipitation` / `precipitatedItemsFor`),
//   guarded by the rules-engine `validateCharacteristicTransfer` law.
// - **Convergence** (light): the same/neighbouring-pathway characteristics the
//   character has drawn near bend fate toward them — `convergenceFor` wraps the
//   `validateConvergence` law and `convergenceNarratorContext` renders the
//   binding `## Convergence` narrator beat.
//
// `WorldCharacteristicLedger { characteristics }` lives on
// `GameSession.characteristicLedger` (optional + strictly validated + preserved
// on the deserialize `...s` spread, never seeded — the `hunts`/`ritualState`
// pattern; no DB migration). Pure + deterministic like every engine subsystem;
// storage and combat wiring live in the React layer (`game-loop.tsx`).
// ---------------------------------------------------------------------------

/** A fresh, empty world-characteristic ledger. */
export function emptyLedger(): WorldCharacteristicLedger {
  return { characteristics: [] };
}

/** The session's ledger, or a fresh empty one for a save that never recorded one. */
export function resolveCharacteristicLedger(
  session: GameSession,
): WorldCharacteristicLedger {
  return session.characteristicLedger ?? emptyLedger();
}

function isValidCharacteristicShape(obj: unknown): boolean {
  if (typeof obj !== "object" || obj === null || Array.isArray(obj)) return false;
  const c = obj as Record<string, unknown>;
  if (!Number.isFinite(c.pathwayId)) return false;
  if (!Number.isFinite(c.sequenceLevel)) return false;
  if (!Number.isFinite(c.quantity) || (c.quantity as number) <= 0) return false;
  return true;
}

/** Strict shape check for a session's `characteristicLedger` (empty is valid). */
export function isValidCharacteristicLedgerShape(obj: unknown): boolean {
  if (typeof obj !== "object" || obj === null || Array.isArray(obj)) return false;
  const l = obj as Record<string, unknown>;
  if (!Array.isArray(l.characteristics)) return false;
  return l.characteristics.every(isValidCharacteristicShape);
}

/**
 * The recoverable item name for a Beyonder Characteristic of `pathwayId` at
 * `sequenceLevel`, matching the canon role-based convention `applyCanonMainIngredient`
 * (`pathways.ts`) and `deliverHuntedItem` use — `"{role} Beyonder Characteristic"`
 * — so a precipitated drop is advancement-usable (when it matches the character's
 * own pathway + target rung) and artifice-fusible / tradeable otherwise. `null`
 * for an unknown pathway/sequence.
 */
export function ledgerCharacteristicItemName(
  pathwayId: number,
  sequenceLevel: number,
): string | null {
  const seq = getSequence(pathwayId, sequenceLevel);
  if (!seq) return null;
  return `${seq.name} Beyonder Characteristic`;
}

/** The whole-unit count a drop's `quantity` mints/records (drops are integer counts). */
function dropUnits(quantity: number): number {
  return Math.max(1, Math.floor(quantity));
}

/**
 * Mint the recoverable `main-ingredient` items a set of dropped characteristics
 * precipitates into — one carried item per unit. Drops with an unknown
 * pathway/sequence (no canon name) are skipped, exactly like `recordPrecipitation`
 * (so the ledger and inventory never disagree on which drops landed). Pure.
 */
export function precipitatedItemsFor(dropped: BeyonderCharacteristic[]): Item[] {
  const items: Item[] = [];
  for (const drop of dropped) {
    const name = ledgerCharacteristicItemName(drop.pathwayId, drop.sequenceLevel);
    if (!name) continue;
    for (let i = 0; i < dropUnits(drop.quantity); i++) {
      items.push({
        name,
        description: `A Beyonder Characteristic precipitated from a slain Sequence ${drop.sequenceLevel} Beyonder — the indestructible core that passes to its next carrier. Fuse it into a Sealed Artifact, trade it, or — if it matches your own pathway and target rung — drink it to advance.`,
        category: "main-ingredient",
      });
    }
  }
  return items;
}

/**
 * Record a set of death-drops into the ledger (Indestructibility). A drop is
 * recorded only when it also mints a recoverable item (a resolvable canon name)
 * AND is a well-formed transfer — the rules-engine `validateCharacteristicTransfer`
 * law rejects a non-positive quantity — so the ledger's entries stay one-for-one
 * with what precipitated into inventory (same skip + same `dropUnits` count as
 * `precipitatedItemsFor`). Folded into the recoverable pool (increment-or-push).
 * Returns a NEW ledger; pure.
 */
export function recordPrecipitation(
  ledger: WorldCharacteristicLedger,
  dropped: BeyonderCharacteristic[],
): WorldCharacteristicLedger {
  const characteristics = ledger.characteristics.map((c) => ({ ...c }));
  for (const drop of dropped) {
    // Skip a drop with no canon name — `precipitatedItemsFor` mints nothing for
    // it, so recording it would leave a ledger entry with no carried counterpart.
    if (ledgerCharacteristicItemName(drop.pathwayId, drop.sequenceLevel) === null) {
      continue;
    }
    // A slain Beyonder's characteristic is never created from nothing — it passes
    // from the fallen carrier to a new one. Guard the transfer's well-formedness
    // (a non-positive quantity is refused) via the Indestructibility law.
    const carrier: WorldCharacteristicLedger = { characteristics: [drop] };
    const transfer: CharacteristicTransfer = {
      toEntityId: "player",
      characteristic: drop,
      source: "death-drop",
    };
    if (!validateCharacteristicTransfer(transfer, carrier).valid) continue;

    const units = dropUnits(drop.quantity);
    const existing = characteristics.find(
      (c) => c.pathwayId === drop.pathwayId && c.sequenceLevel === drop.sequenceLevel,
    );
    if (existing) {
      existing.quantity += units;
    } else {
      characteristics.push({
        pathwayId: drop.pathwayId,
        sequenceLevel: drop.sequenceLevel,
        quantity: units,
      });
    }
  }
  return { characteristics };
}

/**
 * The Convergence result for the character: how strongly the precipitated
 * characteristics the character STILL carries pull their fate toward the same or
 * a neighbouring pathway. Reads the ledger intersected with the current inventory
 * (a characteristic drunk to advance, traded, or crafted away leaves inventory and
 * so stops steering fate — the accounting can't drift into a permanently-on beat).
 * Wraps the rules-engine `validateConvergence` law.
 */
export function convergenceFor(session: GameSession): ConvergenceResult {
  const ledger = resolveCharacteristicLedger(session);
  const carriedNames = new Set(session.gameState.inventory.map((item) => item.name));
  const stillCarried = ledger.characteristics.filter((c) => {
    const name = ledgerCharacteristicItemName(c.pathwayId, c.sequenceLevel);
    return name !== null && carriedNames.has(name);
  });
  return validateConvergence({
    characterPathwayId: session.gameState.pathwayId,
    characterSequence: session.gameState.sequenceLevel,
    nearbyCharacteristics: stillCarried,
  });
}

/**
 * The binding `## Convergence` narrator block (threaded via
 * `GenerateOptions.convergenceContext` → `prompts.ts`), or `null` when nothing is
 * attracted. Tells the narrator to steer fate — chance encounters, rumours,
 * coincidences — toward the same/neighbouring pathway the character's
 * characteristics resonate with, without naming the law. Pure.
 */
export function convergenceNarratorContext(session: GameSession): string | null {
  const result = convergenceFor(session);
  if (result.strength === "none" || result.attracted.length === 0) return null;

  const pull = result.strength === "strong" ? "strongly" : "faintly";
  const count = result.attracted.length;
  const noun = count === 1 ? "characteristic" : "characteristics";
  return (
    `The ${count} Beyonder ${noun} of the same or a neighbouring pathway the ` +
    `character has drawn near ${pull} bend fate toward that line (the Law of ` +
    `Convergence). Low- and Mid-Sequence Beyonders of it, and their ` +
    `characteristics, are unconsciously pulled toward the character — chance ` +
    `encounters, rumours, and coincidences favour crossing paths with them. ` +
    `Weave this as subtle fate-steering; never announce the law by name.`
  );
}

/**
 * The memory fact for a precipitation event — a slain Beyonder's characteristic
 * passing into the character's hands. Pure.
 */
export function precipitationFact(items: Item[], turnNumber: number): SessionFact {
  const names = items.map((i) => i.name).join(", ");
  return {
    type: "item-change",
    description: `A slain Beyonder's characteristic precipitated into your hands (${names}) — indestructible, it passed to a new carrier.`,
    turnNumber,
  };
}
