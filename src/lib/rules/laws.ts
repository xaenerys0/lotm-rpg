import type {
  AdvancementAttempt,
  BeyonderCharacteristic,
  CharacteristicTransfer,
  ConvergenceCheck,
  ConvergenceResult,
  ValidationResult,
  Violation,
  WorldCharacteristicLedger,
} from "@/lib/types/rules";
import { areNeighboringPathways, getPathway, getSequence } from "./pathways";

function totalCharacteristicCount(characteristics: BeyonderCharacteristic[]): number {
  let total = 0;
  for (const c of characteristics) {
    total += c.quantity;
  }
  return total;
}

export function validateIndestructibility(
  ledgerBefore: WorldCharacteristicLedger,
  ledgerAfter: WorldCharacteristicLedger,
): ValidationResult {
  const violations: Violation[] = [];

  const weightBefore = totalCharacteristicCount(ledgerBefore.characteristics);
  const weightAfter = totalCharacteristicCount(ledgerAfter.characteristics);

  if (weightAfter > weightBefore) {
    violations.push({
      law: "indestructibility",
      message: `Beyonder characteristics cannot be created. Total weight increased from ${weightBefore} to ${weightAfter}.`,
    });
  }

  if (weightAfter < weightBefore) {
    violations.push({
      law: "indestructibility",
      message: `Beyonder characteristics cannot be destroyed. Total weight decreased from ${weightBefore} to ${weightAfter}.`,
    });
  }

  return { valid: violations.length === 0, violations };
}

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

export function validateConservation(attempt: AdvancementAttempt): ValidationResult {
  const violations: Violation[] = [];

  if (attempt.targetSequence >= attempt.currentSequence) {
    violations.push({
      law: "conservation",
      message: `Target sequence ${attempt.targetSequence} must be lower (more powerful) than current sequence ${attempt.currentSequence}.`,
    });
  }

  if (attempt.targetSequence !== attempt.currentSequence - 1) {
    violations.push({
      law: "conservation",
      message: `Cannot skip sequences. Must advance from ${attempt.currentSequence} to ${attempt.currentSequence - 1}, not ${attempt.targetSequence}.`,
    });
  }

  const consumed = attempt.consumedCharacteristics;
  const ownPathwayConsumed = consumed.find(
    (c) =>
      c.pathwayId === attempt.currentPathwayId &&
      c.sequenceLevel === attempt.currentSequence,
  );

  if (!ownPathwayConsumed || ownPathwayConsumed.quantity < 1) {
    violations.push({
      law: "conservation",
      message: `Advancement requires consuming at least one Sequence ${attempt.currentSequence} characteristic of Pathway ${attempt.currentPathwayId}.`,
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

export function validatePrerequisites(attempt: AdvancementAttempt): ValidationResult {
  const violations: Violation[] = [];

  const pathway = getPathway(attempt.currentPathwayId);
  if (!pathway) {
    violations.push({
      law: "prerequisite",
      message: `Unknown pathway: ${attempt.currentPathwayId}.`,
    });
    return { valid: false, violations };
  }

  const targetSeq = getSequence(attempt.currentPathwayId, attempt.targetSequence);
  if (!targetSeq) {
    violations.push({
      law: "prerequisite",
      message: `Unknown target sequence: ${attempt.targetSequence} for pathway ${pathway.name}.`,
    });
    return { valid: false, violations };
  }

  const requiredFormula = targetSeq.prerequisiteItems.find(
    (i) => i.category === "potion-formula",
  );
  if (requiredFormula) {
    const hasFormula = attempt.availableItems.some(
      (i) => i.category === "potion-formula" && i.name === requiredFormula.name,
    );
    if (!hasFormula) {
      violations.push({
        law: "prerequisite",
        message: `Missing potion formula: "${requiredFormula.name}".`,
      });
    }
  }

  const requiredMainIngredients = targetSeq.prerequisiteItems.filter(
    (i) => i.category === "main-ingredient",
  );
  for (const ingredient of requiredMainIngredients) {
    const has = attempt.availableItems.some(
      (i) => i.category === "main-ingredient" && i.name === ingredient.name,
    );
    if (!has) {
      violations.push({
        law: "prerequisite",
        message: `Missing main ingredient: "${ingredient.name}".`,
      });
    }
  }

  const requiredSupplementary = targetSeq.prerequisiteItems.filter(
    (i) => i.category === "supplementary-ingredient",
  );
  for (const ingredient of requiredSupplementary) {
    const has = attempt.availableItems.some(
      (i) => i.category === "supplementary-ingredient" && i.name === ingredient.name,
    );
    if (!has) {
      violations.push({
        law: "prerequisite",
        message: `Missing supplementary ingredient: "${ingredient.name}".`,
      });
    }
  }

  if (targetSeq.advancementRitual && !attempt.ritualCompleted) {
    violations.push({
      law: "prerequisite",
      message: `Advancement ritual not completed: "${targetSeq.advancementRitual.description}".`,
    });
  }

  return { valid: violations.length === 0, violations };
}
