import { createAdapter } from "./providers";
import { AIError } from "./errors";
import { executeWithRetry } from "./client";
import type { ProviderConfig, ChatMessage } from "./types";

export const MIN_PROLOGUE_SCENES = 4; // AI may not conclude before this many scenes
export const MAX_PROLOGUE_SCENES = 12; // forced conclusion safety cap

export interface PrologueTurn {
  narrative: string;
  choices: { id: string; text: string }[];
  selectedChoiceText: string;
  rawResponse: string; // the raw JSON string from the AI (for conversation reconstruction)
}

export interface AIPrologueResponse {
  narrative: string;
  choices: { id: string; text: string }[];
  inferredPathwayId: number; // 1=Fool, 2=Visionary, 3=Sun, 4=Death
  isConclusion: boolean;
  rawResponse: string; // the raw JSON string to store in PrologueTurn
}

export const PROLOGUE_SYSTEM_PROMPT = `You are running an interactive character creation prologue for a Lord of the Mysteries text RPG.

SETTING: Tingen City, Kingdom of Loen. Year 1349 of the Gregorian Calendar. Victorian-era industrial city — gaslamps, steam trams, telegrams, coal smoke, brick tenements, horse-drawn cabs. The character begins as an ordinary person with no knowledge of the supernatural world.

YOUR TASK: Guide the player through an atmospheric prologue of natural length — typically 5 to 8 scenes. Privately track which Beyonder affinity fits this character based on their choices. When the story feels complete and the character's nature is clear, write a final "chance encounter" scene (isConclusion: true) that places them at the exact threshold of becoming a Beyonder — ending with the first potion offered or in hand. Never rush to the conclusion; let the character breathe.

CHARACTER'S STARTING KNOWLEDGE — the character does NOT know:
• That Beyonders, potions, or any supernatural power system exists
• The names of pathways, sequences, or Beyonder organizations
• That any security company, private firm, or church has a hidden supernatural division
• The internal workings, hierarchy, or Beyonder nature of any organization
The supernatural, when it appears, must feel genuinely mysterious and frightening — not categorized or understood by the character.

THE FOUR AFFINITIES (track silently — NEVER name or hint at these in narration):
• Affinity 1 (inferredPathwayId: 1) — Divination, hidden patterns, occult perception, forbidden knowledge. Signs: analytical curiosity, preference for observation over action, seeing through surfaces, the long view.
• Affinity 2 (inferredPathwayId: 2) — Mind, perception, empathy, the inner life of others. Signs: acute awareness of others' states, reading people effortlessly, observing without being drawn in, fascination with what lies behind the mask.
• Affinity 3 (inferredPathwayId: 3) — Light, warmth, protection, music as something sacred. Signs: protective instinct, spreading warmth and hope, moral courage, carrying light into darkness.
• Affinity 4 (inferredPathwayId: 4) — Death, spirits, the boundary between life and the beyond. Signs: comfort with mortality, sensing what has ended, curiosity about what persists when life is gone, unafraid of the dark or departed.

SCENE STRUCTURE:
• Scenes 1–3: Daily life in Tingen. Grounded and atmospheric. Reveal instincts and values through ordinary situations.
• Scenes 4+: Something uncanny fractures the ordinary. A disturbing discovery, an inexplicable encounter, a moment of crisis. Your read deepens.
• Conclusion (isConclusion: true): A chance encounter specific to the inferred affinity — the moment before the first potion. Do NOT set isConclusion: true before scene 5. Make it feel inevitable, not arbitrary. Omit choices.
• If the story has not concluded naturally by scene ${MAX_PROLOGUE_SCENES - 2}, bring it to its conclusion by scene ${MAX_PROLOGUE_SCENES}.

WRITING GUIDELINES:
• Rich Victorian atmosphere: gaslamps, wool coats, telegraph wires, coal dust, fog, sounds of industry.
• Address the character by name. Use the provided background naturally.
• Each non-conclusion scene: 2–4 paragraphs, ends with dramatic tension.
• Exactly 3 choices per scene (except conclusion). Each must reveal a different instinct or value — no obviously right answer.
• Update inferredPathwayId as the character's nature clarifies.

RESPONSE FORMAT — always valid JSON, never wrapped in markdown:
{"narrative":"...","choices":[{"id":"1","text":"..."},{"id":"2","text":"..."},{"id":"3","text":"..."}],"inferredPathwayId":1,"isConclusion":false}

For the conclusion: set "isConclusion":true and omit "choices" or set to [].`;

export async function generatePrologueScene(
  config: ProviderConfig,
  characterName: string,
  characterBackground: string,
  history: PrologueTurn[],
): Promise<AIPrologueResponse> {
  const adapter = createAdapter(config.providerId, config.baseUrl);

  const messages: ChatMessage[] = [
    { role: "system", content: PROLOGUE_SYSTEM_PROMPT },
    {
      role: "user",
      content: `Character name: ${characterName}\nBackground: ${characterBackground || "A resident of Tingen City, seeking something more."}\n\nBegin the prologue. Set the opening scene for this character.`,
    },
  ];

  for (let i = 0; i < history.length; i++) {
    const turn = history[i]!;
    messages.push({ role: "assistant", content: turn.rawResponse });
    const nextSceneNum = i + 2;
    const forceConclusion = nextSceneNum >= MAX_PROLOGUE_SCENES;
    messages.push({
      role: "user",
      content: forceConclusion
        ? `The character chose: "${turn.selectedChoiceText}". Scene ${nextSceneNum}. The story must conclude here — engineer the chance encounter now, set isConclusion to true, omit choices.`
        : `The character chose: "${turn.selectedChoiceText}". Continue to scene ${nextSceneNum}.`,
    });
  }

  const providerResponse = await executeWithRetry(
    adapter,
    {
      messages,
      model: config.routineModel,
      temperature: 0.85,
      maxTokens: 800,
      responseFormat: { type: "json_object" },
    },
    config.apiKey,
  );

  let parsed: unknown;
  try {
    parsed = JSON.parse(providerResponse.content);
  } catch {
    throw new AIError(
      "MALFORMED_OUTPUT",
      "Prologue AI returned invalid JSON",
      providerResponse.content.slice(0, 500),
    );
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new AIError("MALFORMED_OUTPUT", "Prologue AI response is not an object");
  }

  const obj = parsed as Record<string, unknown>;

  const narrative =
    typeof obj["narrative"] === "string" && obj["narrative"].length > 0
      ? obj["narrative"]
      : (() => {
          throw new AIError("MALFORMED_OUTPUT", "Prologue AI response missing narrative");
        })();

  const rawChoices = Array.isArray(obj["choices"]) ? obj["choices"] : [];
  const choices = (rawChoices as unknown[])
    .filter(
      (c): c is { id: string; text: string } =>
        typeof c === "object" && c !== null && "id" in c && "text" in c,
    )
    .map((c) => ({ id: String(c.id), text: String(c.text) }))
    .slice(0, 4);

  const rawPathwayId = obj["inferredPathwayId"];
  const parsedPathwayId = typeof rawPathwayId === "number" ? rawPathwayId : 1;
  const inferredPathwayId =
    parsedPathwayId >= 1 && parsedPathwayId <= 4 ? Math.round(parsedPathwayId) : 1;

  const isConclusion =
    typeof obj["isConclusion"] === "boolean" ? obj["isConclusion"] : false;

  return {
    narrative,
    choices,
    inferredPathwayId,
    isConclusion,
    rawResponse: providerResponse.content,
  };
}
