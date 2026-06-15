// ---------------------------------------------------------------------------
// Transformation rites (issue: character-info storage)
// ---------------------------------------------------------------------------
//
// Pure data: canon-weighty advancement moments that traditionally remake who a
// Beyonder IS — most notably a new Witch (Demoness pathway, Seq 7) taking a new
// name, often after a change of body and the heightened allure the role brings.
//
// The rite is presentation + a pre-filled true-self edit, NOT a mechanical
// advancement change: `advancement.ts` owns the climb unchanged. When an
// advancement reaches a rung that has a rite, the React layer offers (never
// forces) a renaming/transformation scene seeded from this data and commits the
// player's choices through `applyProfileChange`.

import type { DemeanorTrait } from "./profile";

export interface TransformationRite {
  pathwayId: number;
  /** The sequence reached (target rung) at which the rite fires. */
  sequenceLevel: number;
  /** The role this rite marks, e.g. "Witch". */
  riteName: string;
  /** Narration seed for the renaming/transformation scene. */
  prompt: string;
  /** Whether the rite traditionally involves taking a new name. */
  suggestsRename: boolean;
  /** Suggested new appearance text the editor pre-fills. */
  appearanceSuggestion?: string;
  /** Demeanor/allure traits the rite suggests adding. */
  demeanorSuggestions: DemeanorTrait[];
  /**
   * Whether this rite is drastic enough to pre-tick the recognition gap (a
   * change of body/gender/allure that strangers the people who knew the old you).
   */
  pretickRecognitionGap: boolean;
}

export const TRANSFORMATION_RITES: readonly TransformationRite[] = [
  {
    // Demoness pathway (id 15), Seq 7 "Witch".
    pathwayId: 15,
    sequenceLevel: 7,
    riteName: "Witch",
    prompt:
      "You have become a Witch. Tradition calls for a new name to mark the woman you now are — the change of body and the allure it carries make the person you were feel like a stranger's memory. Who are you now?",
    suggestsRename: true,
    appearanceSuggestion:
      "Remade by the rite — a striking new figure whose presence draws the eye.",
    demeanorSuggestions: [{ id: "allure", label: "heightened allure" }],
    pretickRecognitionGap: true,
  },
];

/** The rite (if any) fired by reaching `targetSequence` on `pathwayId`. */
export function transformationRiteFor(
  pathwayId: number,
  targetSequence: number,
): TransformationRite | undefined {
  return TRANSFORMATION_RITES.find(
    (r) => r.pathwayId === pathwayId && r.sequenceLevel === targetSequence,
  );
}
