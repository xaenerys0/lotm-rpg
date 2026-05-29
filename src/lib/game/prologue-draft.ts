import type { PrologueTurn } from "@/lib/ai";
import { PROLOGUE_DRAFT_KEY } from "./constants";

export interface PrologueDraft {
  step: "ai-prologue" | "first-potion";
  characterName: string;
  characterBackground: string;
  prologueHistory: PrologueTurn[];
  selectedPathwayId: number | null;
}

export function isValidDraftShape(obj: unknown): obj is PrologueDraft {
  if (typeof obj !== "object" || obj === null) return false;
  const d = obj as Record<string, unknown>;
  return (
    (d.step === "ai-prologue" || d.step === "first-potion") &&
    typeof d.characterName === "string" &&
    typeof d.characterBackground === "string" &&
    Array.isArray(d.prologueHistory) &&
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
