import type {
  AdvancementAttempt,
  CharacteristicTransfer,
  ValidationResult,
  Violation,
  WorldCharacteristicLedger,
  BeyonderCharacteristic,
} from "@/lib/types/rules";
import {
  validateCharacteristicTransfer,
  validateConservation,
  validateIndestructibility,
  validatePrerequisites,
} from "./laws";

function applyAdvancementToLedger(
  ledger: WorldCharacteristicLedger,
  attempt: AdvancementAttempt,
): WorldCharacteristicLedger {
  const updated = structuredClone(ledger);

  for (const consumed of attempt.consumedCharacteristics) {
    const existing = updated.characteristics.find(
      (c) =>
        c.pathwayId === consumed.pathwayId &&
        c.sequenceLevel === consumed.sequenceLevel,
    );
    if (existing) {
      existing.quantity = Math.max(0, existing.quantity - consumed.quantity);
    }
  }

  const newChar: BeyonderCharacteristic = {
    pathwayId: attempt.currentPathwayId,
    sequenceLevel: attempt.targetSequence,
    quantity: 1,
  };
  const existingNew = updated.characteristics.find(
    (c) =>
      c.pathwayId === newChar.pathwayId &&
      c.sequenceLevel === newChar.sequenceLevel,
  );
  if (existingNew) {
    existingNew.quantity += 1;
  } else {
    updated.characteristics.push(newChar);
  }

  return updated;
}

export function validateAdvancement(
  attempt: AdvancementAttempt,
  worldLedger: WorldCharacteristicLedger,
): ValidationResult {
  const allViolations: Violation[] = [];

  const conservation = validateConservation(attempt);
  allViolations.push(...conservation.violations);

  const prerequisites = validatePrerequisites(attempt);
  allViolations.push(...prerequisites.violations);

  if (conservation.valid) {
    const ledgerAfter = applyAdvancementToLedger(worldLedger, attempt);
    const indestructibility = validateIndestructibility(
      worldLedger,
      ledgerAfter,
    );
    allViolations.push(...indestructibility.violations);
  }

  return {
    valid: allViolations.length === 0,
    violations: allViolations,
  };
}

export function validateTransfer(
  transfer: CharacteristicTransfer,
  worldLedger: WorldCharacteristicLedger,
): ValidationResult {
  return validateCharacteristicTransfer(transfer, worldLedger);
}
