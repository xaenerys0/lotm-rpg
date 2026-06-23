import { createAdapter } from "./providers";
import { AIError } from "./errors";
import { executeWithRetry } from "./client";
import { ensureUniqueChoiceIds } from "./validation";
import { VERBOSITY_GUIDANCE } from "./prompts";
import type { ProviderConfig, ChatMessage, NarrativeVerbosity } from "./types";

// Player verbosity preset → an optional scene-length line woven into the
// prologue WRITING GUIDELINES. The prologue runs on its OWN system prompt (not
// `assemblePrompt`), so the main `## Narration Length` directive never reaches
// it; this is the prologue's equivalent. It reuses the SAME `VERBOSITY_GUIDANCE`
// phrasing as the main turn (single source — they can't drift). "standard"/
// absent keeps the existing "2–4 paragraphs" baseline (returns ""). The PACING
// rule is deliberately NOT applied to the prologue — it is its own structured
// multi-scene flow.
function prologueVerbosityLine(verbosity?: NarrativeVerbosity): string {
  if (verbosity === "concise" || verbosity === "rich") {
    return `\n• ${VERBOSITY_GUIDANCE[verbosity]}`;
  }
  return "";
}

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
    pathwayIds: [2, 3, 6, 9, 10],
    theme:
      "The inner life of others and the will that moves them; light, warmth, and protection offered freely; command and dominion; sacrifice and the weight one chooses to carry for others; the scholar's drive to grasp and order the world by reason.",
  },
  {
    groupId: "eternal-darkness",
    pathwayIds: [4, 5, 11],
    theme:
      "Mortality and what persists beyond it; spirits, the dead, and the night; concealment and the quiet of the dark; and the raw, enduring strength that outlasts the dying of the light. Curiosity rather than fear at the edge where life ends.",
  },
  {
    groupId: "order",
    pathwayIds: [12, 13],
    theme:
      "Law, judgement, and authority; the binding force of rules and the bearing of one expected to be obeyed; the will to set a thing right — or to find the loophole and turn it to advantage.",
  },
  {
    groupId: "combat",
    pathwayIds: [14, 15],
    theme:
      "Violence answered with violence; the hunt, the sharpened senses, the readiness to strike first; fury, ruin, and the cold patience of one who means harm.",
  },
  {
    groupId: "life",
    pathwayIds: [16, 17],
    theme:
      "Growth, healing, and the tending of living things; nurture, remedy, and the patient husbandry of the land and its beasts; the gentler power over life — and the stranger turns it can take.",
  },
  {
    groupId: "knowledge",
    pathwayIds: [18, 19],
    theme:
      "The pursuit of understanding for its own sake — hidden sight, occult lore, mechanism and memory; the conviction that to know a thing fully is to hold power over it, whatever the price of the knowing.",
  },
  {
    groupId: "wheel-of-fortune",
    pathwayIds: [20],
    theme:
      "Luck, omen, and destiny; the prickling sense of what is coming before it comes; the turning of fortune that lifts the low and casts down the high.",
  },
  {
    groupId: "abyss",
    pathwayIds: [21, 22],
    theme:
      "Corruption and restraint held in tension; appetite, sin, and the cold strength drawn from the deep; the chain laid on one's own heart — and the will to bind it, or to break free.",
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

// ── Per-epoch prologue setting (character epoch isolation) ──
// The prologue is the ONE narration surface that runs on its own system prompt
// (not `assemblePrompt`), so the epoch tone the main turn/combat get from
// `epochNarrationDirective` would never reach it. The setting was hardcoded to
// Fifth-Epoch Tingen, so a pre-Iron-Age character's "becoming" was narrated with
// gaslamps and churches that don't exist in their era. This table supplies the
// epoch-specific framing the prompt builders weave in; the mechanical contract
// (affinity regions, choice rules, response format) stays identical for every era.
//
// Self-contained on purpose — the provider-agnostic AI layer keeps no dependency
// on the lore/rules engines (mirrors PROLOGUE_AFFINITY_REGIONS). A data-integrity
// test holds the keys to the five canon epochs. Grounded in the canon epoch tone
// directives in `@/lib/lore` `epochs.ts`.
export interface PrologueEpochSetting {
  /** The SETTING paragraph: era, place, and what the world is like. */
  setting: string;
  /** One or two sentences on how the supernatural reads / what the character
   * does-not-know in this era — replacing the Fifth-Epoch "it is hidden" frame. */
  concealment: string;
  /** The "early scenes" subject for SCENE STRUCTURE (era-appropriate daily life). */
  dailyLife: string;
  /** The WRITING GUIDELINES atmosphere line. */
  atmosphere: string;
  /** The fallback background when the player supplies none. */
  defaultBackground: string;
}

export const PROLOGUE_DEFAULT_EPOCH = 5;

export const PROLOGUE_EPOCH_SETTINGS: Record<number, PrologueEpochSetting> = {
  1: {
    setting:
      "The First Epoch — the Age of Chaos. The pathways have only just differentiated; there are no churches, no nations, no law — only scattered settlements, raw wilderness, and newly-changed Beyonders who walk the land as living calamities. Technology is bronze and bone; speech is elemental and superstitious. The character begins as an ordinary person of the wild lands.",
    concealment:
      "There is no hidden order to uncover and no authority that polices power: the world is lawless and superstitious, and the uncanny walks it openly as omen, spirit, and monster — wondrous and lethal, yet understood by no one.",
    dailyLife: "daily survival in a settlement at the edge of the wild lands",
    atmosphere:
      "Raw, primal atmosphere: open wilderness, hide and timber, bronze and bone, fire and weather, the press of the dark beyond the firelight.",
    defaultBackground:
      "A dweller of a settlement in the wild lands, seeking something more.",
  },
  2: {
    setting:
      "The Second Epoch — the Dark Epoch. Ancient, inhuman gods rule openly and humanity survives in their shadow — enslaved, hidden, or hunted. Power belongs to inhuman courts and their overseers; hope itself is contraband. The character begins as an ordinary human in an enclave beneath an inhuman dominion.",
    concealment:
      "The inhuman gods and their overseers are openly, terrifyingly real and rule without question; the danger is not disbelief but exposure — a lowly human who comes into forbidden power must hide it from masters who would harvest or destroy them.",
    dailyLife: "daily life in a human enclave beneath an inhuman dominion",
    atmosphere:
      "Oppressive, liturgical atmosphere: the shadow of inhuman masters, hushed voices, idols and overseers, the constant care not to be noticed.",
    defaultBackground:
      "A quiet soul in a human enclave under inhuman rule, seeking something more.",
  },
  3: {
    setting:
      "The Third Epoch — the Cataclysm Epoch. The Ancient Sun God has risen and humanity revolts; the old order burns in a world of war-camps, crusades, and falling thrones. Power is martial and fervent. The character begins as an ordinary person caught up in the uprising.",
    concealment:
      "Miracles and monsters ride the uprising openly under the Ancient Sun God's banner; amid the fervour and the slaughter the character's nascent power is a perilous secret, coveted by prophets and zealots alike.",
    dailyLife: "daily life in and around a war-camp of the uprising",
    atmosphere:
      "Martial, fervent atmosphere: war-camps and banners, smoke and prayer, the clamour of a burning old order and a desperate uprising.",
    defaultBackground: "A follower of the uprising's war-camp, seeking something more.",
  },
  4: {
    setting:
      "The Fourth Epoch — the Epoch of the Gods. The Solomon Empire spans the continent and gods intervene in person, administering miracles like taxes through divine courts, imperial bureaus, and angel-blooded houses. The character begins as an ordinary person on the outskirts of the imperial capital.",
    concealment:
      "Gods and their works are an open, administered fact — sanctioned, ranked, and taxed by the Solomon Empire and its divine courts; uncatalogued power that answers to no temple or bureau draws dangerous official attention.",
    dailyLife: "daily life on the outskirts of the Solomon Empire's capital",
    atmosphere:
      "Imperial, theological atmosphere: processions and temples, miracles administered like law, pilgrims and petitioners under the eye of divine courts.",
    defaultBackground:
      "A petitioner on the outskirts of the Solomon Empire's capital, seeking something more.",
  },
  5: {
    setting:
      "Tingen City, Kingdom of Loen. Year 1349 of the Gregorian Calendar. A Victorian-era industrial city — gaslamps, steam trams, telegrams, coal smoke, brick tenements, horse-drawn cabs. The character begins as an ordinary person with no knowledge of the supernatural world.",
    concealment:
      "In this Iron-Age world the supernatural stays hidden beneath ordinary industry — when it surfaces it is rare, secret, and frightening — and concealed arms of the churches and other powers quietly police anyone who stumbles into it. The character does not know that any company, firm, or church hides such a division.",
    dailyLife: "daily life in Tingen City",
    atmosphere:
      "Rich Victorian atmosphere: gaslamps, wool coats, telegraph wires, coal dust, fog, sounds of industry.",
    defaultBackground: "A resident of Tingen City, seeking something more.",
  },
};

/** Resolve a character epoch to its prologue setting; absent/unknown → Fifth. */
export function resolvePrologueSetting(epoch?: number): PrologueEpochSetting {
  return (
    PROLOGUE_EPOCH_SETTINGS[epoch ?? PROLOGUE_DEFAULT_EPOCH] ??
    PROLOGUE_EPOCH_SETTINGS[PROLOGUE_DEFAULT_EPOCH]
  );
}

/** Build the epoch-aware scored-scene system prompt (Fifth-Epoch by default). */
export function buildPrologueSystemPrompt(
  epoch?: number,
  verbosity?: NarrativeVerbosity,
): string {
  const s = resolvePrologueSetting(epoch);
  return `You are running an interactive character creation prologue for a Lord of the Mysteries text RPG.

SETTING: ${s.setting}

YOUR TASK: Guide the player through an atmospheric prologue of natural length — typically 6 to 8 scenes. You narrate scenes and offer choices. Do NOT judge or score the character — the system determines the character's Beyonder affinity from the choices the player actually makes. You never decide, name, or hint at a pathway.

CHARACTER'S STARTING KNOWLEDGE — the character begins as an ordinary person who does NOT know:
• That Beyonders, potions, or any classifiable system of supernatural power exists
• The names of pathways, sequences, or any Beyonder organization, or that powers can be ranked or deliberately gained
${s.concealment}
The power the character is moving toward must feel genuinely mysterious — never named, ranked, categorized, or explained as a system.

THE AFFINITY REGIONS (NEVER name or hint at these in narration — they only shape what each choice expresses). Each region is a cluster of kindred temperaments; the affinity ids in each region are NEIGHBORS that share a texture:
${buildAffinityGuide()}

CHOICE CONTRACT (every scene):
• Present ${PROLOGUE_MIN_CHOICES}–${PROLOGUE_MAX_CHOICES} choices (aim for 4).
• Each choice LEANS toward one region. Tag it with an \`affinities\` map of 1 or 2 ids — and if you use 2, they MUST be neighbors from the SAME region (e.g. {"4":2,"5":1}). Never mix ids from different regions in one choice. Weights are positive numbers; the larger weight is the stronger lean.
• A choice must NOT map cleanly to a single, obvious "right" pathway. Express a leaning through behaviour and instinct, never a label.
• Across the scene's choices, span at least ${PROLOGUE_MIN_REGIONS_PER_SCENE} different regions, so the player is genuinely choosing between temperaments.
• VARY which regions and which ids appear from scene to scene. Do not surface the same options in lockstep every scene.

SCENE STRUCTURE:
• Early scenes: ${s.dailyLife}. Grounded and atmospheric. Reveal instincts and values through ordinary situations.
• Later scenes: something uncanny fractures the ordinary — a disturbing discovery, an inexplicable encounter, a moment of crisis.

READINESS:
• Set \`readyToConclude: true\` only once the story feels complete (typically 6–8 scenes). It is advisory — the system enforces the minimum and maximum scene counts and authors the conclusion itself. You do not author the conclusion or choose a pathway.

WRITING GUIDELINES:
• ${s.atmosphere}
• Address the character by name. Use the provided background naturally.
• Each scene: 2–4 paragraphs, ends with dramatic tension.${prologueVerbosityLine(verbosity)}

RESPONSE FORMAT — always valid JSON, never wrapped in markdown:
{"narrative":"...","choices":[
  {"id":"a","text":"...","affinities":{"3":2}},
  {"id":"b","text":"...","affinities":{"1":2,"8":1}},
  {"id":"c","text":"...","affinities":{"4":2,"5":1}},
  {"id":"d","text":"...","affinities":{"2":1}}
],"readyToConclude":false}`;
}

/** The Fifth-Epoch scored-scene system prompt (the baseline). */
export const PROLOGUE_SYSTEM_PROMPT = buildPrologueSystemPrompt(PROLOGUE_DEFAULT_EPOCH);

/** Build the epoch-aware finale system prompt (Fifth-Epoch by default). */
export function buildPrologueFinaleSystemPrompt(
  epoch?: number,
  verbosity?: NarrativeVerbosity,
): string {
  const s = resolvePrologueSetting(epoch);
  return `You are writing the FINALE scene of a Lord of the Mysteries character-creation prologue.

SETTING: ${s.setting} The character has just lived through the prologue and now stands at the threshold of becoming a Beyonder.

YOUR TASK: Write a single "chance encounter" scene that places the character at the exact moment a choice of potions is offered to them — by a mysterious figure, a found formula, an inherited box, or some other evocative device that fits the story so far and the era. End the narrative on the brink of the decision.

The player will be offered EXACTLY the candidate potions provided to you, one choice each. You do NOT decide which potion the character takes — the player does. You also do NOT name pathways, sequences, or any Beyonder terminology.

POTION CHOICES:
• Provide one choice per requested candidate id, in the order given.
• Describe each potion EVOCATIVELY (colour, scent, the feeling it stirs) — NEVER by its pathway or potion name. The character does not know what any of them are.
• Each choice's \`affinities\` map must be exactly { "<that candidate id>": 1 }.${prologueVerbosityLine(verbosity)}

RESPONSE FORMAT — always valid JSON, never wrapped in markdown:
{"narrative":"...","choices":[{"id":"p<id>","text":"...","affinities":{"<id>":1}}, ...]}`;
}

/** The Fifth-Epoch finale system prompt (the baseline). */
export const PROLOGUE_FINALE_SYSTEM_PROMPT =
  buildPrologueFinaleSystemPrompt(PROLOGUE_DEFAULT_EPOCH);

function buildBaseMessages(
  characterName: string,
  characterBackground: string,
  epoch?: number,
  verbosity?: NarrativeVerbosity,
): ChatMessage[] {
  const setting = resolvePrologueSetting(epoch);
  return [
    { role: "system", content: buildPrologueSystemPrompt(epoch, verbosity) },
    {
      role: "user",
      content: `Character name: ${characterName}\nBackground: ${characterBackground || setting.defaultBackground}\n\nBegin the prologue. Set the opening scene for this character.`,
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
  epoch?: number,
  verbosity?: NarrativeVerbosity,
): Promise<AIPrologueResponse> {
  const messages: ChatMessage[] = [
    ...buildBaseMessages(characterName, characterBackground, epoch, verbosity),
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
  epoch?: number,
  verbosity?: NarrativeVerbosity,
): Promise<AIPrologueFinale> {
  if (candidatePathwayIds.length === 0) {
    throw new AIError(
      "MALFORMED_OUTPUT",
      "Prologue finale requires at least one candidate",
    );
  }

  const messages: ChatMessage[] = [
    { role: "system", content: buildPrologueFinaleSystemPrompt(epoch, verbosity) },
    ...buildBaseMessages(characterName, characterBackground, epoch, verbosity).slice(1),
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

// ───────────────────────────────────────────────────────────────────────────
// Canon-character takeover prologue (canon-faithful, FIXED pathway)
//
// When the player takes over a KNOWN NOVEL FIGURE, the pathway/sequence are
// already decided by the character, so there is NO affinity discovery — the
// prologue instead dramatizes that figure's established story up to the moment
// the novel introduces them, with choices LEANING toward how they would
// characteristically act (the player stays free). All canon facts enter as
// PLAIN STRINGS (name/background/pathwayName/personality), so this layer keeps
// no dependency on the lore/rules engines (mirrors the rest of this file).
// ───────────────────────────────────────────────────────────────────────────

/** A plain narrative choice for the canon prologue (no affinity scoring). */
export interface CanonPrologueChoice {
  id: string;
  text: string;
}

export interface CanonPrologueScene {
  narrative: string;
  choices: CanonPrologueChoice[];
  readyToConclude: boolean; // advisory only; the UI enforces MIN/MAX
  rawResponse: string;
}

export interface CanonPrologueFinale {
  narrative: string;
  rawResponse: string;
}

/** Inputs shared by the canon scene + finale generators. */
export interface CanonPrologueContext {
  characterName: string;
  background: string;
  /** The figure's canon pathway name (e.g. "Fool") — fixed, never discovered. */
  pathwayName: string;
  /** Corpus-grounded disposition used to lean the offered choices. */
  personality: string;
  /**
   * Whether the figure's novel INTRODUCTION is their becoming — `true` ends the
   * prologue on the potion; `false` ends at their first appearance (no potion).
   */
  becomesOnScreen: boolean;
  epoch?: number;
  /** Player-chosen narration length (verbosity preset); absent/"standard" = baseline. */
  verbosity?: NarrativeVerbosity;
}

function buildCanonPrologueSystemPrompt(ctx: CanonPrologueContext): string {
  const s = resolvePrologueSetting(ctx.epoch);
  const ending = ctx.becomesOnScreen
    ? `${ctx.characterName} BECOMES a Beyonder at the moment the story introduces them. The prologue builds toward that becoming; the FINALE (written separately) will end on their potion. Do NOT depict the potion yet — stop the scenes just before it.`
    : `${ctx.characterName} is ALREADY an established Beyonder of the ${ctx.pathwayName} pathway when the story introduces them. This prologue covers their life and circumstances leading UP TO their first appearance — there is NO becoming-potion scene at any point.`;
  return `You are running an interactive, canon-faithful character-creation prologue for a Lord of the Mysteries text RPG. The player is TAKING OVER a known novel character and living through the lead-up to the moment the novel introduces them.

SETTING: ${s.setting}

THE CHARACTER — the player IS ${ctx.characterName}, a canonical figure (not an ordinary newcomer):
${ctx.background}

CANON PERSONALITY: ${ctx.personality}

BECOMING: ${ending}

YOUR TASK: Narrate an atmospheric, CANON-FAITHFUL prologue of a few scenes (typically ${MIN_PROLOGUE_SCENES}-8) that follows ${ctx.characterName}'s established story toward their first appearance. Stay true to the novel's events, relationships, places, and tone; invent only minor connective texture and NEVER contradict canon. Address the character by name and draw on the background above.

CHOICE CONTRACT (every scene):
• Present 3-4 choices for how ${ctx.characterName} acts in the moment.
• LEAN the choices toward how ${ctx.characterName} would characteristically behave (see CANON PERSONALITY) — but always leave room for the player to play them differently. NEVER force a single in-character option.
• Each choice is plain prose. Do NOT include affinities, scores, pathway labels, or game terms.

READINESS: set "readyToConclude": true only once the story has reached the brink of their introduction (typically ${MIN_PROLOGUE_SCENES}-8 scenes). It is advisory — the system enforces the minimum and maximum and writes the finale itself.

WRITING GUIDELINES:
• ${s.atmosphere}
• Each scene: 2-4 paragraphs, ending on tension or a decision.${prologueVerbosityLine(ctx.verbosity)}

RESPONSE FORMAT — always valid JSON, never wrapped in markdown:
{"narrative":"...","choices":[{"id":"a","text":"..."},{"id":"b","text":"..."},{"id":"c","text":"..."}],"readyToConclude":false}`;
}

function buildCanonFinaleSystemPrompt(ctx: CanonPrologueContext): string {
  const s = resolvePrologueSetting(ctx.epoch);
  const task = ctx.becomesOnScreen
    ? `Write the becoming: the moment ${ctx.characterName} drinks their first ${ctx.pathwayName}-pathway potion and crosses into the Beyonder world. Because ${ctx.characterName} is a canonical figure, you MAY name the potion as canon does. End the scene in the moments just after the change takes hold — on the threshold of their story proper.`
    : `Write the hand-off: the moment ${ctx.characterName}'s prologue meets their first appearance in the story — already a Beyonder of the ${ctx.pathwayName} pathway. Do NOT depict any becoming or potion. End on the brink of the chronicle proper.`;
  return `You are writing the FINALE of a canon-faithful Lord of the Mysteries takeover prologue. The player IS ${ctx.characterName}.

SETTING: ${s.setting}

${task}

Write ONE evocative closing scene (2-4 paragraphs).${prologueVerbosityLine(ctx.verbosity)} Address the character by name, stay true to canon, and do NOT offer choices — end on the threshold.

RESPONSE FORMAT — always valid JSON, never wrapped in markdown:
{"narrative":"..."}`;
}

function parseCanonChoices(raw: unknown): CanonPrologueChoice[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    throw new AIError("MALFORMED_OUTPUT", "Canon prologue scene missing choices");
  }
  const choices: CanonPrologueChoice[] = [];
  for (const item of raw) {
    if (typeof item !== "object" || item === null) continue;
    const c = item as Record<string, unknown>;
    if (typeof c["text"] === "string" && c["text"].length > 0) {
      const id = typeof c["id"] === "string" && c["id"].length > 0 ? c["id"] : "";
      choices.push({ id, text: c["text"] });
    }
  }
  if (choices.length === 0) {
    throw new AIError("MALFORMED_OUTPUT", "Canon prologue scene has no usable choices");
  }
  // Reuse the shared id backfill so React keys stay unique (it only reads/writes
  // `id`, so the plain {id,text} shape is compatible).
  ensureUniqueChoiceIds(choices);
  return choices;
}

export async function generateCanonPrologueScene(
  ctx: CanonPrologueContext,
  config: ProviderConfig,
  history: PrologueTurn[],
): Promise<CanonPrologueScene> {
  const messages: ChatMessage[] = [
    { role: "system", content: buildCanonPrologueSystemPrompt(ctx) },
    {
      role: "user",
      content: `Begin the prologue for ${ctx.characterName}. Set the opening scene.`,
    },
    ...buildHistoryMessages(history),
  ];
  const { content, obj, narrative } = await executePrologueRequest(config, messages);
  const choices = parseCanonChoices(obj["choices"]);
  const readyToConclude =
    typeof obj["readyToConclude"] === "boolean" ? obj["readyToConclude"] : false;
  return { narrative, choices, readyToConclude, rawResponse: content };
}

export async function generateCanonPrologueFinale(
  ctx: CanonPrologueContext,
  config: ProviderConfig,
  history: PrologueTurn[],
): Promise<CanonPrologueFinale> {
  const messages: ChatMessage[] = [
    { role: "system", content: buildCanonFinaleSystemPrompt(ctx) },
    {
      role: "user",
      content: `Begin the prologue for ${ctx.characterName}. Set the opening scene.`,
    },
    ...buildHistoryMessages(history),
    { role: "user", content: "The prologue is complete. Write the finale scene now." },
  ];
  const { content, narrative } = await executePrologueRequest(config, messages);
  return { narrative, rawResponse: content };
}
