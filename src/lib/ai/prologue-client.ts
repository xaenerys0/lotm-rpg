import { createAdapter } from "./providers";
import { AIError } from "./errors";
import { executeWithRetry } from "./client";
import type { ProviderConfig, ChatMessage } from "./types";

export const MIN_PROLOGUE_SCENES = 4; // AI may not conclude before this many scenes
export const MAX_PROLOGUE_SCENES = 12; // forced conclusion safety cap

// Number of distinct Beyonder affinities surfaced per scored scene. Scoped to
// the four shipped pathways today; the engine-side tally is generic over N, so
// only this scene-shape contract changes when more pathways are added.
export const PROLOGUE_AFFINITY_COUNT = 4;

export interface AIPrologueChoice {
  id: string;
  text: string;
  affinities: Record<number, number>; // { pathwayId: weight }, weights > 0
}

export interface PrologueTurn {
  narrative: string;
  choices: AIPrologueChoice[];
  selectedChoiceText: string; // for memory facts + history reconstruction
  selectedAffinities: Record<number, number>; // the picked choice's weight map (tally input)
  rawResponse: string; // the raw JSON string from the AI (for conversation reconstruction)
}

// Scored scene generator: the AI narrates and tags choices, but NEVER decides
// the pathway. The engine accumulates `selectedAffinities` and computes the
// finale candidates.
export interface AIPrologueResponse {
  narrative: string;
  choices: AIPrologueChoice[]; // exactly PROLOGUE_AFFINITY_COUNT, one per affinity
  readyToConclude: boolean; // advisory only; the engine enforces MIN/MAX
  rawResponse: string;
}

// Player-decided finale: the engine passes in the candidate pathway ids; the AI
// renders exactly those as potion choices for the player to pick from.
export interface AIPrologueFinale {
  narrative: string;
  choices: AIPrologueChoice[]; // one per candidate pathway; affinities = { pathwayId: 1 }
  rawResponse: string;
}

export const PROLOGUE_SYSTEM_PROMPT = `You are running an interactive character creation prologue for a Lord of the Mysteries text RPG.

SETTING: Tingen City, Kingdom of Loen. Year 1349 of the Gregorian Calendar. Victorian-era industrial city — gaslamps, steam trams, telegrams, coal smoke, brick tenements, horse-drawn cabs. The character begins as an ordinary person with no knowledge of the supernatural world.

YOUR TASK: Guide the player through an atmospheric prologue of natural length — typically 5 to 8 scenes. You narrate scenes and offer choices. Do NOT judge or score the character — the system determines the character's Beyonder affinity from the choices the player actually makes. You never decide, name, or hint at a pathway.

CHARACTER'S STARTING KNOWLEDGE — the character does NOT know:
• That Beyonders, potions, or any supernatural power system exists
• The names of pathways, sequences, or Beyonder organizations
• That any security company, private firm, or church has a hidden supernatural division
• The internal workings, hierarchy, or Beyonder nature of any organization
The supernatural, when it appears, must feel genuinely mysterious and frightening — not categorized or understood by the character.

THE FOUR AFFINITIES (NEVER name or hint at these in narration — they only shape what each choice expresses):
• Affinity 1 — Divination, hidden patterns, occult perception, forbidden knowledge. Signs: analytical curiosity, preference for observation over action, seeing through surfaces, the long view.
• Affinity 2 — Mind, perception, empathy, the inner life of others. Signs: acute awareness of others' states, reading people effortlessly, observing without being drawn in, fascination with what lies behind the mask.
• Affinity 3 — Light, warmth, protection, music as something sacred. Signs: protective instinct, spreading warmth and hope, moral courage, carrying light into darkness.
• Affinity 4 — Death, spirits, the boundary between life and the beyond. Signs: comfort with mortality, sensing what has ended, curiosity about what persists when life is gone, unafraid of the dark or departed.

SCENE STRUCTURE:
• Scenes 1–3: Daily life in Tingen. Grounded and atmospheric. Reveal instincts and values through ordinary situations.
• Scenes 4+: Something uncanny fractures the ordinary. A disturbing discovery, an inexplicable encounter, a moment of crisis.

CHOICE CONTRACT (every scene):
• Each scene MUST present EXACTLY ${PROLOGUE_AFFINITY_COUNT} choices, each expressing exactly one of the four affinities. All four must appear — one choice each.
• Tag each choice with its \`affinities\` map, e.g. {"3":1}. Weights must be positive.
• VARY which affinity appears in which position from scene to scene. No choice may be the obviously "right" option.

READINESS:
• Set \`readyToConclude: true\` only once the story feels complete (typically 5–8 scenes). It is advisory — the system enforces the minimum and maximum scene counts and authors the conclusion itself. You do not author the conclusion or choose a pathway.

WRITING GUIDELINES:
• Rich Victorian atmosphere: gaslamps, wool coats, telegraph wires, coal dust, fog, sounds of industry.
• Address the character by name. Use the provided background naturally.
• Each scene: 2–4 paragraphs, ends with dramatic tension.

RESPONSE FORMAT — always valid JSON, never wrapped in markdown:
{"narrative":"...","choices":[
  {"id":"a","text":"...","affinities":{"3":1}},
  {"id":"b","text":"...","affinities":{"1":1}},
  {"id":"c","text":"...","affinities":{"4":1}},
  {"id":"d","text":"...","affinities":{"2":1}}
],"readyToConclude":false}`;

export const PROLOGUE_FINALE_SYSTEM_PROMPT = `You are writing the FINALE scene of a Lord of the Mysteries character-creation prologue.

SETTING: Tingen City, Kingdom of Loen, year 1349 — a Victorian-era industrial city of gaslamps, coal smoke, and fog. The character has just lived through the prologue and now stands at the threshold of becoming a Beyonder.

YOUR TASK: Write a single "chance encounter" scene that places the character at the exact moment a choice of potions is offered to them — by a mysterious figure, a found formula, an inherited box, or some other evocative device that fits the story so far. End the narrative on the brink of the decision.

The player will be offered EXACTLY the candidate potions provided to you, one choice each. You do NOT decide which potion the character takes — the player does. You also do NOT name pathways, sequences, or any Beyonder terminology.

POTION CHOICES:
• Provide one choice per requested candidate id, in the order given.
• Describe each potion EVOCATIVELY (colour, scent, the feeling it stirs) — NEVER by its pathway or potion name. The character does not know what any of them are.
• Each choice's \`affinities\` map must be exactly { "<that candidate id>": 1 }.

RESPONSE FORMAT — always valid JSON, never wrapped in markdown:
{"narrative":"...","choices":[{"id":"p<id>","text":"...","affinities":{"<id>":1}}, ...]}`;

function buildBaseMessages(
  characterName: string,
  characterBackground: string,
): ChatMessage[] {
  return [
    { role: "system", content: PROLOGUE_SYSTEM_PROMPT },
    {
      role: "user",
      content: `Character name: ${characterName}\nBackground: ${characterBackground || "A resident of Tingen City, seeking something more."}\n\nBegin the prologue. Set the opening scene for this character.`,
    },
  ];
}

function buildHistoryMessages(history: PrologueTurn[]): ChatMessage[] {
  const messages: ChatMessage[] = [];
  for (let i = 0; i < history.length; i++) {
    const turn = history[i]!;
    messages.push({ role: "assistant", content: turn.rawResponse });
    messages.push({
      role: "user",
      content: `The character chose: "${turn.selectedChoiceText}". Continue to scene ${i + 2}.`,
    });
  }
  return messages;
}

function parseObject(content: string): Record<string, unknown> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new AIError(
      "MALFORMED_OUTPUT",
      "Prologue AI returned invalid JSON",
      content.slice(0, 500),
    );
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new AIError("MALFORMED_OUTPUT", "Prologue AI response is not an object");
  }
  return parsed as Record<string, unknown>;
}

function requireNarrative(obj: Record<string, unknown>): string {
  const narrative = obj["narrative"];
  if (typeof narrative !== "string" || narrative.length === 0) {
    throw new AIError("MALFORMED_OUTPUT", "Prologue AI response missing narrative");
  }
  return narrative;
}

// Shared request path for both prologue generators: identical provider config,
// JSON parse, and narrative requirement. Returns the raw content (for
// rawResponse), the parsed object, and the validated narrative.
async function executePrologueRequest(
  config: ProviderConfig,
  messages: ChatMessage[],
): Promise<{ content: string; obj: Record<string, unknown>; narrative: string }> {
  const adapter = createAdapter(config.providerId, config.baseUrl);
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
  const obj = parseObject(providerResponse.content);
  const narrative = requireNarrative(obj);
  return { content: providerResponse.content, obj, narrative };
}

/**
 * Validate and normalize a single AI choice. Requires `id`, `text`, and an
 * `affinities` map whose keys are positive integers with positive weights.
 * Returns the choice plus its dominant (argmax) affinity id.
 */
function parseChoice(raw: unknown): { choice: AIPrologueChoice; dominant: number } {
  if (typeof raw !== "object" || raw === null) {
    throw new AIError("MALFORMED_OUTPUT", "Prologue choice is not an object");
  }
  const c = raw as Record<string, unknown>;
  if (typeof c["id"] !== "string" || typeof c["text"] !== "string") {
    throw new AIError("MALFORMED_OUTPUT", "Prologue choice missing id or text");
  }
  const rawAffinities = c["affinities"];
  if (
    typeof rawAffinities !== "object" ||
    rawAffinities === null ||
    Array.isArray(rawAffinities)
  ) {
    throw new AIError("MALFORMED_OUTPUT", "Prologue choice missing affinities map");
  }

  const affinities: Record<number, number> = {};
  let dominant = 0;
  let dominantWeight = -Infinity;
  for (const [key, value] of Object.entries(rawAffinities as Record<string, unknown>)) {
    const id = Number(key);
    if (!Number.isInteger(id) || id < 1) {
      throw new AIError("MALFORMED_OUTPUT", `Invalid affinity pathway id: ${key}`);
    }
    if (typeof value !== "number" || !(value > 0)) {
      throw new AIError("MALFORMED_OUTPUT", `Invalid affinity weight for ${key}`);
    }
    affinities[id] = value;
    if (value > dominantWeight || (value === dominantWeight && id < dominant)) {
      dominantWeight = value;
      dominant = id;
    }
  }
  if (dominant === 0) {
    throw new AIError("MALFORMED_OUTPUT", "Prologue choice has an empty affinities map");
  }

  return { choice: { id: c["id"], text: c["text"], affinities }, dominant };
}

export async function generatePrologueScene(
  config: ProviderConfig,
  characterName: string,
  characterBackground: string,
  history: PrologueTurn[],
): Promise<AIPrologueResponse> {
  const messages: ChatMessage[] = [
    ...buildBaseMessages(characterName, characterBackground),
    ...buildHistoryMessages(history),
  ];
  const { content, obj, narrative } = await executePrologueRequest(config, messages);

  const rawChoices = obj["choices"];
  if (!Array.isArray(rawChoices) || rawChoices.length !== PROLOGUE_AFFINITY_COUNT) {
    throw new AIError(
      "MALFORMED_OUTPUT",
      `Prologue scene must have exactly ${PROLOGUE_AFFINITY_COUNT} choices`,
    );
  }

  const choices: AIPrologueChoice[] = [];
  const dominants = new Set<number>();
  for (const raw of rawChoices) {
    const { choice, dominant } = parseChoice(raw);
    choices.push(choice);
    dominants.add(dominant);
  }

  // Every affinity must be represented exactly once (no duplicate dominants).
  const expected = Array.from({ length: PROLOGUE_AFFINITY_COUNT }, (_, i) => i + 1);
  if (
    dominants.size !== PROLOGUE_AFFINITY_COUNT ||
    !expected.every((id) => dominants.has(id))
  ) {
    throw new AIError(
      "MALFORMED_OUTPUT",
      `Prologue scene must express each of the ${PROLOGUE_AFFINITY_COUNT} affinities exactly once`,
    );
  }

  // Advisory only; never default to concluding.
  const readyToConclude =
    typeof obj["readyToConclude"] === "boolean" ? obj["readyToConclude"] : false;

  return { narrative, choices, readyToConclude, rawResponse: content };
}

/**
 * Generate the player-decided finale. `candidatePathwayIds` is an ENGINE output
 * passed in — the only place a pathway id ever enters a prompt. The AI offers
 * exactly these candidate potions; the player's pick IS the final pathway.
 */
export async function generatePrologueFinale(
  config: ProviderConfig,
  characterName: string,
  characterBackground: string,
  history: PrologueTurn[],
  candidatePathwayIds: number[],
): Promise<AIPrologueFinale> {
  if (candidatePathwayIds.length === 0) {
    throw new AIError(
      "MALFORMED_OUTPUT",
      "Prologue finale requires at least one candidate",
    );
  }

  const messages: ChatMessage[] = [
    { role: "system", content: PROLOGUE_FINALE_SYSTEM_PROMPT },
    ...buildBaseMessages(characterName, characterBackground).slice(1),
    ...buildHistoryMessages(history),
    {
      role: "user",
      content: `The prologue is complete. Write the finale scene now. Offer EXACTLY these candidate potions as choices, in this order, one choice each: ${candidatePathwayIds
        .map((id) => `candidate ${id} (affinities {"${id}":1})`)
        .join(", ")}. Describe each potion evocatively without naming any pathway.`,
    },
  ];
  const { content, obj, narrative } = await executePrologueRequest(config, messages);

  const rawChoices = obj["choices"];
  if (!Array.isArray(rawChoices)) {
    throw new AIError("MALFORMED_OUTPUT", "Prologue finale missing choices");
  }

  const choices: AIPrologueChoice[] = [];
  const covered = new Set<number>();
  for (const raw of rawChoices) {
    const { choice, dominant } = parseChoice(raw);
    choices.push(choice);
    covered.add(dominant);
  }

  // Exactly one valid choice per requested candidate id.
  for (const id of candidatePathwayIds) {
    if (!covered.has(id)) {
      throw new AIError(
        "MALFORMED_OUTPUT",
        `Prologue finale missing a choice for candidate ${id}`,
      );
    }
  }

  return { narrative, choices, rawResponse: content };
}
