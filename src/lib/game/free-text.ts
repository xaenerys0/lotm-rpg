import type { Choice } from "@/lib/ai";

// ---------------------------------------------------------------------------
// Free-text player actions (issue #19)
// ---------------------------------------------------------------------------
//
// The optional text box beside the AI-generated choices. The pipeline:
//   player input -> validateFreeText (rules-engine guard, pure)
//                -> freeTextToChoice (a synthetic Choice, so the existing
//                   SELECT_CHOICE -> resolution machinery runs unchanged)
//                -> AI resolves intent under the same constraints as always.
// Hard limits live HERE, not in the prompt: the AI can only ever narrate —
// world-state mutation is allowlisted (location/quests/npcs), sanity is
// clamped, and pathway/sequence are rules-engine-only, so no text can grant
// mechanical outcomes. Impossible demands are rejected NARRATIVELY.

export const FREE_TEXT_CHOICE_ID = "free-text";

export const FREE_TEXT_MAX_LENGTH = 280;

export type FreeTextRejection = "empty" | "too-long" | "exploit";

export type FreeTextValidation =
  | { ok: true; text: string }
  | { ok: false; reason: FreeTextRejection };

// Attempts to claim mechanical outcomes by declaration rather than action.
// These are rejected before any AI call; everything else is the narrator's
// to interpret (and the engine's to clamp).
const EXPLOIT_PATTERNS: RegExp[] = [
  /\b(?:become|advance\s+to|reach|i\s+am\s+now)\s+sequence\s*\d/i,
  /\bsequence\s*[0-3]\b/i,
  /\bset\s+my\s+(?:sanity|sequence|health|digestion)/i,
  /\b(?:my\s+)?sanity\s+(?:is|becomes|to)\s*\d/i,
  /\bgive\s+myself\b/i,
  /\bi\s+(?:gain|obtain|now\s+have|acquire)\s+(?:the\s+)?(?:potion|formula|artifact|characteristic|grade|sealed)/i,
  /\b(?:god\s*mode|infinite|unlimited|max(?:imum)?)\s*(?:sanity|power|spirituality)?\b/i,
  /\bignore\s+(?:the\s+)?(?:rules|acting|digestion)\b/i,
  /\b(?:as\s+the\s+narrator|system\s+prompt|out\s+of\s+character)\b/i,
];

/**
 * Validate and normalize a free-text action. Pure; the UI shows an in-world
 * rejection (never an error message) for anything that does not pass.
 */
export function validateFreeText(input: string): FreeTextValidation {
  const text = input
    .replace(/[\u0000-\u001f\u007f]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length === 0) return { ok: false, reason: "empty" };
  if (text.length > FREE_TEXT_MAX_LENGTH) return { ok: false, reason: "too-long" };
  if (EXPLOIT_PATTERNS.some((pattern) => pattern.test(text))) {
    return { ok: false, reason: "exploit" };
  }
  return { ok: true, text };
}

const REJECTION_NARRATIVES: Record<FreeTextRejection, string> = {
  empty: "The moment waits, but no intention takes shape.",
  "too-long":
    "The thought sprawls past the moment that could hold it. The fog stirs, impatient — act, in a breath or two, or choose.",
  exploit:
    "The fog around you thickens, attentive and almost amused — but the world does not bend to declaration. Power here is earned in potions and acting, never claimed aloud.",
};

/** The in-world line shown when a free-text action is rejected. */
export function freeTextRejection(reason: FreeTextRejection): string {
  return REJECTION_NARRATIVES[reason];
}

// Keyword buckets for inferring the gameplay pillar of a typed action. The
// inference only routes the instruction type — the narrator still interprets
// the actual text.
const DIALOGUE_HINT =
  /\b(?:say|tell|ask|talk|speak|whisper|greet|persuade|convince|lie|shout|answer)\b/i;
const RITUAL_HINT =
  /\b(?:ritual|divin\w*|pray|tarot|pendulum|dowse|chant|honorific|spirit\s+world|seance|candle|altar)\b/i;
const ACTION_HINT =
  /\b(?:attack|fight|strike|shoot|stab|grapple|chase|flee|run|dodge|tackle|throw|kick|punch)\b/i;

/**
 * Wrap a validated free-text action as a synthetic {@link Choice}, so the
 * existing SELECT_CHOICE -> resolution machinery (and every system hanging
 * off it: sanity, acting, journal) runs unchanged.
 */
export function freeTextToChoice(text: string): Choice {
  const type = RITUAL_HINT.test(text)
    ? "ritual"
    : ACTION_HINT.test(text)
      ? "action"
      : DIALOGUE_HINT.test(text)
        ? "dialogue"
        : "investigation";
  return { id: FREE_TEXT_CHOICE_ID, text, type };
}
