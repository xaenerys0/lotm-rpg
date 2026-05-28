import { createAdapter } from "./providers";
import { AIError } from "./errors";
import type { ProviderConfig, ChatMessage } from "./types";

export const PROLOGUE_TURN_COUNT = 5;

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

SETTING: Tingen City, Kingdom of Loen. Year 1349 of the Gregorian Calendar. Victorian-era industrial city — gaslamps, steam trams, telegrams, coal smoke, brick tenements, horse-drawn cabs. Beneath the mundane surface lies a world of Beyonders: Extraordinaries who have consumed special potions derived from the remains of fallen Beyonders to gain supernatural powers.

YOUR TASK: Guide the player through a 5-scene interactive prologue. Privately track which Beyonder pathway fits this character based on their choices. In the final scene, engineer a specific "chance encounter" that delivers them to that pathway's threshold — the moment before their first potion.

THE FOUR PATHWAYS (track silently, never name them):
• Fool (pathwayId: 1) — Seer, Clown, Magician. Investigation, divination, forbidden knowledge, occult curiosity, patterns and secrets, mental arts. Signs: analytical curiosity, uncovering hidden things, skeptical thinking, interest in the esoteric.
• Visionary (pathwayId: 2) — Prophet, Oracle, Saint. Dreams, prophecy, premonitions, spiritual attunement, divine faith, intuitive empathy. Signs: vivid dreams, intuition, deep empathy, perceiving meaning beyond appearances, spiritual or religious inclination.
• Sun (pathwayId: 3) — Redeemer, Purifier, Holy Knight. Protection, healing, righteousness, sacrifice, justice, the Church of the Eternal Blazing Sun. Signs: protective instinct, moral courage, willingness to sacrifice for others, strong sense of justice.
• Death (pathwayId: 4) — Reaper, Sleepless, Spirit Medium. Spirits, mortality, the boundary between worlds, spirit communication. Signs: comfort with darkness and death, philosophical acceptance of mortality, attraction to the occult and the departed.

SCENE STRUCTURE (5 scenes total):
Scenes 1–2: Daily life in Tingen City. Grounded, atmospheric. Player choices reveal their instincts, priorities, and values.
Scenes 3–4: Something uncanny fractures the ordinary. A mysterious discovery, an uncanny encounter, a moment of crisis. Your pathway reading deepens.
Scene 5 (isConclusion: true): The chance encounter. Write a scene specific to the pathway this character has gravitated toward — a scene that places them at the exact threshold of becoming a Beyonder, ending with the first potion in their hands or offered to them. Feel inevitable, not arbitrary. Omit the choices array.

WRITING GUIDELINES:
• Rich Victorian atmosphere: gaslamps, wool coats, telegraph wires, coal dust, fog, the sounds of industry.
• Address the character by name. Use the provided background naturally.
• Each scene: 2–3 paragraphs, ends with clear dramatic tension.
• Exactly 3 choices per scene (except the conclusion). Choices must feel equally viable — no obvious right answer. Each choice should reveal a different value or instinct.
• Update inferredPathwayId as the character's nature clarifies.

RESPONSE FORMAT — always valid JSON, never wrapped in markdown:
{"narrative":"...","choices":[{"id":"1","text":"..."},{"id":"2","text":"..."},{"id":"3","text":"..."}],"inferredPathwayId":1,"isConclusion":false}

For the conclusion scene: set "isConclusion":true and omit "choices" or set to [].`;

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
    const isFinalScene = nextSceneNum === PROLOGUE_TURN_COUNT;
    messages.push({
      role: "user",
      content: isFinalScene
        ? `The character chose: "${turn.selectedChoiceText}". This is scene ${nextSceneNum} of ${PROLOGUE_TURN_COUNT} — the final scene. Engineer the chance encounter. Set isConclusion to true and omit choices.`
        : `The character chose: "${turn.selectedChoiceText}". Continue to scene ${nextSceneNum} of ${PROLOGUE_TURN_COUNT}.`,
    });
  }

  const providerResponse = await adapter.makeRequest(
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
