import type { Choice, GameState } from "@/lib/ai";

// ---------------------------------------------------------------------------
// Context-dependent input modes (issue #24)
// ---------------------------------------------------------------------------
//
// The scene's input affordances follow its narrative context. Combat is
// exogenous (an active encounter takes the surface over); the other modes are
// INFERRED from the AI's own choice mix, then shape what the player sees:
//   - exploration   -> the free-text box leads
//   - ritual        -> a guided step interface with material selection
//   - dialogue      -> conversation framing with an "ask about" topic helper
//   - investigation -> clue listing + combine-two-clues deduction helper
// Every guided mode COMPOSES a free-text action and submits it through the
// existing validated pipeline (issue #19) — one resolution path, no new
// machinery for the AI or the rules engine.

export type InputMode =
  | "exploration"
  | "combat"
  | "ritual"
  | "dialogue"
  | "investigation";

/**
 * Infer the scene's input mode from the AI's choice mix (plurality of choice
 * types, ties broken toward the more specific mode), with narrative keywords
 * as a tiebreaker-only signal. Deterministic.
 */
export function detectInputMode(
  choices: readonly Choice[],
  narrative: string = "",
): InputMode {
  if (choices.length === 0) return "exploration";

  const counts = { ritual: 0, dialogue: 0, investigation: 0, action: 0 };
  for (const choice of choices) {
    if (choice.type === "ritual") counts.ritual++;
    else if (choice.type === "dialogue") counts.dialogue++;
    else if (choice.type === "investigation") counts.investigation++;
    else counts.action++;
  }

  const half = choices.length / 2;
  if (counts.ritual >= half) return "ritual";
  if (counts.dialogue >= half) return "dialogue";
  if (counts.investigation >= half) {
    return "investigation";
  }

  // No plurality: let strong narrative cues nudge, else exploration.
  if (/\britual|altar|honorific|s[eé]ance|divination\b/i.test(narrative)) {
    return "ritual";
  }
  if (counts.dialogue > 0 && /\basks?|says|replies|conversation\b/i.test(narrative)) {
    return "dialogue";
  }
  return "exploration";
}

export const INPUT_MODE_LABELS: Record<InputMode, string> = {
  exploration: "Exploration — act freely",
  combat: "Combat — tactical exchange",
  ritual: "Ritual — guided steps",
  dialogue: "Conversation",
  investigation: "Investigation — weigh the clues",
};

/** The ritual mode's fixed step script (guided, not mechanical). */
export const RITUAL_STEPS = [
  "Purify the ground and mark the boundary",
  "Lay out the chosen materials",
  "Speak the honorific name, exactly",
  "Make the request — and nothing more",
] as const;

/**
 * Compose the guided ritual into one free-text action. Validated downstream
 * by the issue-#19 pipeline like any typed action.
 */
export function composeRitualAction(
  materials: readonly string[],
  intent: string,
): string {
  const materialText =
    materials.length > 0 ? ` using ${materials.join(", ")}` : " with what I carry";
  return `I prepare the ritual ground carefully${materialText}, speak the proper honorific, and petition: ${intent.trim()}`;
}

/** Compose an "ask about" conversational action. */
export function composeDialogueAction(npc: string, topic: string): string {
  return `I ask ${npc} about ${topic.trim()}`;
}

/**
 * The clues an investigation scene can weigh: present NPCs, carried items,
 * active quests, and the place itself. Deterministic order.
 */
export function gatherClues(state: GameState): string[] {
  return [
    ...state.npcsPresent.map((npc) => `${npc} (witness)`),
    ...state.inventory.map((item) => item.name),
    ...state.activeQuests,
    state.location,
  ];
}

/** Compose a two-clue deduction into one free-text action. */
export function composeDeduction(clueA: string, clueB: string): string {
  return `I weigh what I know: how does "${clueA}" connect to "${clueB}"? I examine both for the thread between them.`;
}
