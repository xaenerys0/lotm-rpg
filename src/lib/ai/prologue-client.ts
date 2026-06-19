import { createAdapter } from "./providers";
import { AIError } from "./errors";
import { executeWithRetry } from "./client";
import { ensureUniqueChoiceIds } from "./validation";
import type { ProviderConfig, ChatMessage } from "./types";

export const MIN_PROLOGUE_SCENES = 6; // AI may not conclude before this many scenes (typical 6–8)
export const MAX_PROLOGUE_SCENES = 12; // forced conclusion safety cap

// Scene-shape contract (issue #119). A scored scene offers a handful of choices,
// each leaning toward a pathway REGION rather than a single pathway, and must
// branch across at least two regions so the player is choosing between
// neighborhoods (not re-picking one pathway every scene).
export const PROLOGUE_MIN_CHOICES = 3;
export const PROLOGUE_MAX_CHOICES = 5;
export const PROLOGUE_MIN_REGIONS_PER_SCENE = 2;
// A choice may lean toward 1–2 NEIGHBORING pathways within one region — never a
// clean 1:1 to a single pathway, never spread across regions.
export const PROLOGUE_MAX_AFFINITIES_PER_CHOICE = 2;

// ── Neighborhood affinity catalog (issue #119) ──
// The prologue's affinities are the canonical pathway "regions" (the Sefirah
// groups) over the PLAYABLE pathways — the ids with full potion/sequence
// content. A choice leans toward 1–2 neighboring pathways within ONE region, so
// the specific pathway emerges from the pattern of picks instead of being
// telegraphed by a single "the Death option" choice.
//
// This catalog is intentionally SELF-CONTAINED so the provider-agnostic AI layer
// keeps no dependency on the rules engine. A reconciliation test in `ai.test.ts`
// holds these ids/groups against `@/lib/rules` PATHWAY_GROUPS so the prologue's
// regions can never drift from canon. The engine-side tally
// (`tallyAffinities`/`selectTopCandidates` in `@/lib/game`) stays generic over
// any ids and is unchanged.

export interface PrologueAffinityRegion {
  /** Matches a `@/lib/rules` PATHWAY_GROUPS id (reconciled in tests). */
  groupId: string;
  /** The playable pathways in this region (a subset of the canon group). */
  pathwayIds: readonly number[];
  /** The shared texture the region's pathways express — shapes choice writing. */
  theme: string;
}

export const PROLOGUE_AFFINITY_REGIONS: readonly PrologueAffinityRegion[] = [
  {
    groupId: "mysteries",
    pathwayIds: [1, 7, 8],
    theme:
      "Observation before action; hidden patterns and forbidden knowledge; trickery, secrets, and the long view. The instinct to understand a thing — to read it, map it, or quietly outwit it — before ever touching it.",
  },
  {
    groupId: "god-almighty",
    pathwayIds: [2, 3, 6, 9],
    theme:
      "The inner life of others and the will that moves them; light, warmth, and protection offered freely; command and dominion; sacrifice and the weight one chooses to carry for others.",
  },
  {
    groupId: "eternal-darkness",
    pathwayIds: [4, 5],
    theme:
      "Mortality and what persists beyond it; spirits, the dead, and the night; concealment and the quiet of the dark. Curiosity rather than fear at the edge where life ends.",
  },
] as const;

// Every playable pathway id the prologue can lead to, and the region each is in.
export const PROLOGUE_PLAYABLE_PATHWAY_IDS: readonly number[] =
  PROLOGUE_AFFINITY_REGIONS.flatMap((r) => r.pathwayIds);

const REGION_OF_PATHWAY: ReadonlyMap<number, string> = new Map(
  PROLOGUE_AFFINITY_REGIONS.flatMap((r) =>
    r.pathwayIds.map((id) => [id, r.groupId] as const),
  ),
);

export interface AIPrologueChoice {
  id: string;
  text: string;
  affinities: Record<number, number>; // { pathwayId: weight }, weights > 0, within one region
}

export interface PrologueTurn {
  narrative: string;
  choices: AIPrologueChoice[];
  selectedChoiceText: string; // for memory facts + history reconstruction
  selectedAffinities: Record<number, number>; // the picked choice's weight map (tally input)
  rawResponse: string; // the raw JSON string from the AI (for conversation reconstruction)
}

// Scored scene generator: the AI narrates and tags choices with region-leaning
// affinity weights, but NEVER decides the pathway. The engine accumulates the
// picked `selectedAffinities` and computes the finale candidates.
export interface AIPrologueResponse {
  narrative: string;
  choices: AIPrologueChoice[]; // PROLOGUE_MIN_CHOICES..PROLOGUE_MAX_CHOICES, spanning ≥2 regions
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

// The narrator-facing description of the affinity regions — built from the
// single-source catalog so the prompt and validation can never disagree.
function buildAffinityGuide(): string {
  return PROLOGUE_AFFINITY_REGIONS.map(
    (r) =>
      `• Region "${r.groupId}" (affinity ids ${r.pathwayIds.join(", ")}): ${r.theme}`,
  ).join("\n");
}

export const PROLOGUE_SYSTEM_PROMPT = `You are running an interactive character creation prologue for a Lord of the Mysteries text RPG.

SETTING: Tingen City, Kingdom of Loen. Year 1349 of the Gregorian Calendar. Victorian-era industrial city — gaslamps, steam trams, telegrams, coal smoke, brick tenements, horse-drawn cabs. The character begins as an ordinary person with no knowledge of the supernatural world.

YOUR TASK: Guide the player through an atmospheric prologue of natural length — typically 6 to 8 scenes. You narrate scenes and offer choices. Do NOT judge or score the character — the system determines the character's Beyonder affinity from the choices the player actually makes. You never decide, name, or hint at a pathway.

CHARACTER'S STARTING KNOWLEDGE — the character does NOT know:
• That Beyonders, potions, or any supernatural power system exists
• The names of pathways, sequences, or Beyonder organizations
• That any security company, private firm, or church has a hidden supernatural division
• The internal workings, hierarchy, or Beyonder nature of any organization
The supernatural, when it appears, must feel genuinely mysterious and frightening — not categorized or understood by the character.

THE AFFINITY REGIONS (NEVER name or hint at these in narration — they only shape what each choice expresses). Each region is a cluster of kindred temperaments; the affinity ids in each region are NEIGHBORS that share a texture:
${buildAffinityGuide()}

CHOICE CONTRACT (every scene):
• Present ${PROLOGUE_MIN_CHOICES}–${PROLOGUE_MAX_CHOICES} choices (aim for 4).
• Each choice LEANS toward one region. Tag it with an \`affinities\` map of 1 or 2 ids — and if you use 2, they MUST be neighbors from the SAME region (e.g. {"4":2,"5":1}). Never mix ids from different regions in one choice. Weights are positive numbers; the larger weight is the stronger lean.
• A choice must NOT map cleanly to a single, obvious "right" pathway. Express a leaning through behaviour and instinct, never a label.
• Across the scene's choices, span at least ${PROLOGUE_MIN_REGIONS_PER_SCENE} different regions, so the player is genuinely choosing between temperaments.
• VARY which regions and which ids appear from scene to scene. Do not surface the same options in lockstep every scene.

SCENE STRUCTURE:
• Early scenes: daily life in Tingen. Grounded and atmospheric. Reveal instincts and values through ordinary situations.
• Later scenes: something uncanny fractures the ordinary — a disturbing discovery, an inexplicable encounter, a moment of crisis.

READINESS:
• Set \`readyToConclude: true\` only once the story feels complete (typically 6–8 scenes). It is advisory — the system enforces the minimum and maximum scene counts and authors the conclusion itself. You do not author the conclusion or choose a pathway.

WRITING GUIDELINES:
• Rich Victorian atmosphere: gaslamps, wool coats, telegraph wires, coal dust, fog, sounds of industry.
• Address the character by name. Use the provided background naturally.
• Each scene: 2–4 paragraphs, ends with dramatic tension.

RESPONSE FORMAT — always valid JSON, never wrapped in markdown:
{"narrative":"...","choices":[
  {"id":"a","text":"...","affinities":{"3":2}},
  {"id":"b","text":"...","affinities":{"1":2,"8":1}},
  {"id":"c","text":"...","affinities":{"4":2,"5":1}},
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
 * `affinities` map. Out-of-range or malformed weights are dropped (the engine
 * tally is additive — a stray weight is forgiven, not thrown). The choice's
 * affinities are then snapped to the dominant id's REGION (within-region only,
 * issue #119) and capped at {@link PROLOGUE_MAX_AFFINITIES_PER_CHOICE} neighbors.
 * Returns the normalized choice plus its dominant (argmax) affinity id and region.
 */
function parseChoice(raw: unknown): {
  choice: AIPrologueChoice;
  dominant: number;
  regionId: string;
} {
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

  // Keep only well-formed weights for PLAYABLE pathway ids; drop the rest.
  const cleaned: Array<{ id: number; weight: number }> = [];
  for (const [key, value] of Object.entries(rawAffinities as Record<string, unknown>)) {
    const id = Number(key);
    if (
      Number.isInteger(id) &&
      REGION_OF_PATHWAY.has(id) &&
      typeof value === "number" &&
      value > 0
    ) {
      cleaned.push({ id, weight: value });
    }
  }
  if (cleaned.length === 0) {
    throw new AIError(
      "MALFORMED_OUTPUT",
      "Prologue choice has no valid playable-pathway affinity",
    );
  }

  // Dominant = greatest weight; ties break toward the lowest id (determinism).
  cleaned.sort((a, b) => b.weight - a.weight || a.id - b.id);
  const dominant = cleaned[0]!.id;
  const regionId = REGION_OF_PATHWAY.get(dominant)!;

  // Within-region only: keep the dominant's region, capped to the top neighbors.
  const affinities: Record<number, number> = {};
  for (const { id, weight } of cleaned) {
    if (REGION_OF_PATHWAY.get(id) !== regionId) continue;
    if (Object.keys(affinities).length >= PROLOGUE_MAX_AFFINITIES_PER_CHOICE) break;
    affinities[id] = weight;
  }

  return { choice: { id: c["id"], text: c["text"], affinities }, dominant, regionId };
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
  if (
    !Array.isArray(rawChoices) ||
    rawChoices.length < PROLOGUE_MIN_CHOICES ||
    rawChoices.length > PROLOGUE_MAX_CHOICES
  ) {
    throw new AIError(
      "MALFORMED_OUTPUT",
      `Prologue scene must have between ${PROLOGUE_MIN_CHOICES} and ${PROLOGUE_MAX_CHOICES} choices`,
    );
  }

  const choices: AIPrologueChoice[] = [];
  const regions = new Set<string>();
  for (const raw of rawChoices) {
    const { choice, regionId } = parseChoice(raw);
    choices.push(choice);
    regions.add(regionId);
  }

  // A scene must branch across regions so the player is choosing between
  // neighborhoods, not re-picking the same pathway.
  if (regions.size < PROLOGUE_MIN_REGIONS_PER_SCENE) {
    throw new AIError(
      "MALFORMED_OUTPUT",
      `Prologue scene must span at least ${PROLOGUE_MIN_REGIONS_PER_SCENE} affinity regions`,
    );
  }

  // Advisory only; never default to concluding.
  const readyToConclude =
    typeof obj["readyToConclude"] === "boolean" ? obj["readyToConclude"] : false;

  // Ids are React keys in the choice list — guarantee they are unique/non-empty
  // even if the model repeats or omits one.
  ensureUniqueChoiceIds(choices);
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

  // Ids are React keys — guarantee uniqueness even if the model repeats one.
  ensureUniqueChoiceIds(choices);
  return { narrative, choices, rawResponse: content };
}
