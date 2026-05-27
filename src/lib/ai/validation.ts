import type { Item, ValidationResult, Violation } from "@/lib/types/rules";
import type { AIResponse } from "./types";
import { createMalformedOutputError } from "./errors";

const SANITY_IMPACT_MIN = -20;
const SANITY_IMPACT_MAX = 10;
const MAX_CHOICES = 6;
const VALID_CHOICE_TYPES = ["action", "dialogue", "investigation", "ritual"];
const VALID_ITEM_CATEGORIES = [
  "main-ingredient",
  "supplementary-ingredient",
  "potion-formula",
];

export function parseAIResponse(raw: string): AIResponse {
  let cleaned = raw.trim();

  const jsonBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonBlockMatch) {
    cleaned = jsonBlockMatch[1].trim();
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw createMalformedOutputError(raw);
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw createMalformedOutputError(raw);
  }

  const obj = parsed as Record<string, unknown>;

  if (typeof obj.narrative !== "string" || obj.narrative.length === 0) {
    throw createMalformedOutputError(raw);
  }

  const response: AIResponse = {
    narrative: obj.narrative,
  };

  if (obj.choices !== undefined) {
    if (!Array.isArray(obj.choices)) {
      throw createMalformedOutputError(raw);
    }
    response.choices = obj.choices.map((c: unknown) => {
      const choice = c as Record<string, unknown>;
      return {
        id: String(choice.id ?? ""),
        text: String(choice.text ?? ""),
        type: VALID_CHOICE_TYPES.includes(String(choice.type))
          ? (String(choice.type) as "action" | "dialogue" | "investigation" | "ritual")
          : "action",
      };
    });
  }

  if (obj.worldStateChanges !== undefined) {
    if (!Array.isArray(obj.worldStateChanges)) {
      throw createMalformedOutputError(raw);
    }
    response.worldStateChanges = obj.worldStateChanges.map((s: unknown) => {
      const change = s as Record<string, unknown>;
      return {
        field: String(change.field ?? ""),
        oldValue: change.oldValue,
        newValue: change.newValue,
        reason: String(change.reason ?? ""),
      };
    });
  }

  if (obj.actingEvaluation !== undefined && obj.actingEvaluation !== null) {
    const eval_ = obj.actingEvaluation as Record<string, unknown>;
    response.actingEvaluation = {
      alignment: Number(eval_.alignment ?? 0),
      reasoning: String(eval_.reasoning ?? ""),
    };
  }

  if (obj.sanityImpact !== undefined && obj.sanityImpact !== null) {
    response.sanityImpact = Number(obj.sanityImpact);
  }

  if (obj.itemsDiscovered !== undefined) {
    if (!Array.isArray(obj.itemsDiscovered)) {
      throw createMalformedOutputError(raw);
    }
    response.itemsDiscovered = obj.itemsDiscovered.map((i: unknown) => {
      const item = i as Record<string, unknown>;
      return {
        name: String(item.name ?? ""),
        description: String(item.description ?? ""),
        category: VALID_ITEM_CATEGORIES.includes(String(item.category))
          ? (String(item.category) as Item["category"])
          : "supplementary-ingredient",
      };
    });
  }

  return response;
}

export function validateAIResponse(response: AIResponse): ValidationResult {
  const violations: Violation[] = [];

  if (
    response.sanityImpact !== undefined &&
    (response.sanityImpact < SANITY_IMPACT_MIN ||
      response.sanityImpact > SANITY_IMPACT_MAX)
  ) {
    violations.push({
      law: "conservation",
      message: `Sanity impact ${response.sanityImpact} out of range [${SANITY_IMPACT_MIN}, ${SANITY_IMPACT_MAX}]`,
    });
  }

  if (response.choices && response.choices.length > MAX_CHOICES) {
    violations.push({
      law: "conservation",
      message: `Too many choices: ${response.choices.length} (max ${MAX_CHOICES})`,
    });
  }

  if (response.actingEvaluation) {
    const { alignment } = response.actingEvaluation;
    if (alignment < 0 || alignment > 1) {
      violations.push({
        law: "conservation",
        message: `Acting alignment ${alignment} out of range [0, 1]`,
      });
    }
  }

  if (response.itemsDiscovered) {
    for (const item of response.itemsDiscovered) {
      if (!item.name || !item.description) {
        violations.push({
          law: "conservation",
          message: `Item missing required fields: name="${item.name}", description="${item.description}"`,
        });
      }
    }
  }

  if (response.worldStateChanges) {
    for (const change of response.worldStateChanges) {
      if (!change.field || !change.reason) {
        violations.push({
          law: "conservation",
          message: `State change missing required fields: field="${change.field}", reason="${change.reason}"`,
        });
      }
    }
  }

  return {
    valid: violations.length === 0,
    violations,
  };
}

export function sanitizeAIResponse(response: AIResponse): AIResponse {
  const sanitized = structuredClone(response);

  if (
    sanitized.sanityImpact !== undefined &&
    (sanitized.sanityImpact < SANITY_IMPACT_MIN ||
      sanitized.sanityImpact > SANITY_IMPACT_MAX)
  ) {
    sanitized.sanityImpact = Math.max(
      SANITY_IMPACT_MIN,
      Math.min(SANITY_IMPACT_MAX, sanitized.sanityImpact),
    );
  }

  if (sanitized.choices && sanitized.choices.length > MAX_CHOICES) {
    sanitized.choices = sanitized.choices.slice(0, MAX_CHOICES);
  }

  if (sanitized.actingEvaluation) {
    sanitized.actingEvaluation.alignment = Math.max(
      0,
      Math.min(1, sanitized.actingEvaluation.alignment),
    );
  }

  return sanitized;
}
