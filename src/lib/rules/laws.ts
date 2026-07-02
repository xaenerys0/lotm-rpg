import type {
  BeyonderCharacteristic,
  CharacteristicTransfer,
  ConvergenceCheck,
  ConvergenceResult,
  ValidationResult,
  Violation,
  WorldCharacteristicLedger,
} from "@/lib/types/rules";
import { areNeighboringPathways } from "./pathways";

// ---------------------------------------------------------------------------
// The cosmic Laws of Beyonder Characteristics (issue #212) — the two wired into
// live simulation via `@/lib/game/characteristic-ledger`:
//
// - **Convergence** (`validateConvergence`): high-Sequence items of the same or
//   a neighbouring pathway unconsciously draw a character's fate — the narrator
//   Convergence beat.
// - **Indestructibility** (`validateCharacteristicTransfer`): a characteristic is
//   never destroyed, only passed from one carrier to the next — the guard on a
//   slain Beyonder's characteristic precipitating into the recoverable ledger.
//
// The former whole-world `validateIndestructibility` weight-census and the
// `validateConservation`/`validatePrerequisites` advancement gates were retired
// in issue #212: the light per-save recoverable ledger cannot maintain a whole-
// world census, and the advancement gate is already owned by
// `@/lib/game/advancement.ts` + `potion-preparation.ts`. See
// `docs/laws-simulation-design.md`.
// ---------------------------------------------------------------------------

export function validateCharacteristicTransfer(
  transfer: CharacteristicTransfer,
  ledgerBefore: WorldCharacteristicLedger,
): ValidationResult {
  const violations: Violation[] = [];

  if (transfer.characteristic.quantity <= 0) {
    violations.push({
      law: "indestructibility",
      message: "Transfer quantity must be positive.",
    });
  }

  const available = ledgerBefore.characteristics.find(
    (c) =>
      c.pathwayId === transfer.characteristic.pathwayId &&
      c.sequenceLevel === transfer.characteristic.sequenceLevel,
  );

  if (!available || available.quantity < transfer.characteristic.quantity) {
    violations.push({
      law: "indestructibility",
      message: `Cannot transfer ${transfer.characteristic.quantity} characteristic(s) of Pathway ${transfer.characteristic.pathwayId} Seq ${transfer.characteristic.sequenceLevel} — only ${available?.quantity ?? 0} exist.`,
    });
  }

  return { valid: violations.length === 0, violations };
}

export function validateConvergence(check: ConvergenceCheck): ConvergenceResult {
  const attracted: BeyonderCharacteristic[] = [];

  for (const characteristic of check.nearbyCharacteristics) {
    const isSamePathway = characteristic.pathwayId === check.characterPathwayId;
    const isNeighboring = areNeighboringPathways(
      check.characterPathwayId,
      characteristic.pathwayId,
    );

    if (isSamePathway || isNeighboring) {
      attracted.push(characteristic);
    }
  }

  let strength: ConvergenceResult["strength"] = "none";
  if (attracted.length > 0) {
    const hasSamePathway = attracted.some(
      (c) => c.pathwayId === check.characterPathwayId,
    );
    strength = hasSamePathway ? "strong" : "weak";
  }

  return { attracted, strength };
}
