import type { PrologueTurn, AIPrologueFinale } from "@/lib/ai";
import { PROLOGUE_DRAFT_KEY } from "./constants";

export interface PrologueDraft {
  step: "ai-prologue" | "first-potion";
  characterName: string;
  characterBackground: string;
  prologueHistory: PrologueTurn[];
  selectedPathwayId: number | null;
  // Persisted so a refresh mid-finale re-renders without a regenerate.
  finale?: AIPrologueFinale | null;
}

function isAffinityMap(value: unknown): value is Record<number, number> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const entries = Object.entries(value as Record<string, unknown>);
  // Must be a non-empty map of numeric values.
  if (entries.length === 0) return false;
  return entries.every(([, weight]) => typeof weight === "number");
}

function isValidTurn(value: unknown): value is PrologueTurn {
  if (typeof value !== "object" || value === null) return false;
  const t = value as Record<string, unknown>;
  return (
    typeof t.narrative === "string" &&
    Array.isArray(t.choices) &&
    typeof t.selectedChoiceText === "string" &&
    typeof t.rawResponse === "string" &&
    isAffinityMap(t.selectedAffinities)
  );
}

export function isValidDraftShape(obj: unknown): obj is PrologueDraft {
  if (typeof obj !== "object" || obj === null) return false;
  const d = obj as Record<string, unknown>;
  return (
    (d.step === "ai-prologue" || d.step === "first-potion") &&
    typeof d.characterName === "string" &&
    typeof d.characterBackground === "string" &&
    Array.isArray(d.prologueHistory) &&
    d.prologueHistory.every(isValidTurn) &&
    (d.selectedPathwayId === null || typeof d.selectedPathwayId === "number")
  );
}

export function isActivePrologueDraft(obj: unknown): boolean {
  if (typeof obj !== "object" || obj === null) return false;
  const d = obj as Record<string, unknown>;
  return d.step === "ai-prologue" || d.step === "first-potion";
}

export function clearDraft(): void {
  try {
    localStorage.removeItem(PROLOGUE_DRAFT_KEY);
  } catch {
    // Storage unavailable
  }
}
