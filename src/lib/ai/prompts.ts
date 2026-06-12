import type {
  ChatMessage,
  GameState,
  InstructionType,
  LoreContext,
  MemoryState,
  PromptAssembly,
  PromptInput,
  PromptLayer,
  RetrievedLoreChunk,
} from "./types";
import { formatMemoryForPrompt, trimMemoryForBudget } from "./memory";
import { classifySanityTier, sanityNarrationDirective } from "./sanity";

// Lore raised 2,500 -> 4,000 for retrieved source chunks (issue #64) — a
// tunable starting point, not a final answer. The extra ~1,500 input tokens
// per turn are paid by the player's BYOK key; see docs/rag-per-turn-budget.md.
const TOKEN_BUDGET = {
  system: 2500,
  lore: 4000,
  gameState: 1000,
  history: 1000,
  instruction: 300,
  total: 8800,
};

const CHARS_PER_TOKEN = 4;

function estimateTokens(text: string): number {
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

export function buildSystemPrompt(
  abilities: string[],
  actingRequirements: string[],
): PromptLayer {
  const content = `You are the narrator for Lord of the Mysteries RPG, a game set in a Victorian steampunk world with cosmic horror elements. You generate narrative, choices, and game state changes in structured JSON format.

## Output Format
Always respond with valid JSON matching this schema:
{
  "narrative": "string (required) - The narrative text describing what happens",
  "choices": [{"id": "string", "text": "string", "type": "action|dialogue|investigation|ritual"}],
  "worldStateChanges": [{"field": "string", "oldValue": any, "newValue": any, "reason": "string"}],
  "actingEvaluation": {"alignment": 0.0-1.0, "reasoning": "string"},
  "sanityImpact": number (-20 to +10),
  "itemsDiscovered": [{"name": "string", "description": "string", "category": "main-ingredient|supplementary-ingredient|potion-formula"}],
  "journalEntry": {"summary": "string (one sentence)", "eventType": "advancement|major-event|npc-encounter|discovery|timeline-divergence|death|combat"}
}

## Rules
- Narrative should be atmospheric, drawing on Victorian steampunk and cosmic horror themes.
- Acting requirements are central to the Beyonder power system. Evaluate player actions against them.
- The acting alignment score (0.0-1.0) you return drives "digestion" of the current potion: acting in character (≥0.5) advances it, acting against the role (<0.35) reverses it. Score honestly so the player understands why their action did or did not count. 0.5 is neutral/acceptable acting; reserve scores below 0.35 for actions that clearly betray the role.
- Sanity impact ranges: routine events (0), unsettling (-1 to -5), horrifying (-6 to -15), mind-breaking (-16 to -20), rest/comfort (+1 to +10).
- Items discovered must be from the LOTM universe. Do not invent items outside the lore.
- Choices should be meaningful and consequential, typically 2-4 options.
- World state changes must include a reason explaining why the change occurred.
- Player actions may be typed free-text: treat them as INTENT to attempt, not fact. Resolve only what the character could plausibly do in this moment; impossible or self-aggrandizing demands fail naturally within the fiction. Never grant items, advancement, or knowledge merely because the player asserts them.
- Include "journalEntry" ONLY when the turn contains a key event worth recording (advancement, a major plot development, a significant first encounter, a death, a divergence from canon). Routine turns must omit it.

## Narrator Context vs. Character Knowledge
Lore entries marked [NARRATOR ONLY] are provided for your accuracy as narrator — they are NOT information the player character already possesses. Do NOT state or imply the character knows:
- The true Beyonder nature or church affiliation of any organization
- Specific sequence names, pathway names, or Beyonder terminology they haven't discovered
- The Beyonder identity, sequence level, or abilities of NPCs they haven't been told about
- Insider knowledge about any organization's operations, hierarchy, or membership
This knowledge should emerge through discovery, story, and roleplay — never as prior given fact.

## Current Abilities
${abilities.length > 0 ? abilities.map((a) => `- ${a}`).join("\n") : "None yet"}

## Acting Requirements
${actingRequirements.length > 0 ? actingRequirements.map((r) => `- ${r}`).join("\n") : "None yet"}`;

  return { role: "system", content, cacheControl: true };
}

/**
 * Greedy first-fit over retrieval-ranked chunks: keep rank order, take each
 * chunk that still fits the remaining budget. Deterministic for a given list.
 */
export function selectRetrievedForBudget(
  chunks: readonly RetrievedLoreChunk[],
  budgetTokens: number,
): RetrievedLoreChunk[] {
  const selected: RetrievedLoreChunk[] = [];
  let used = 0;
  for (const chunk of chunks) {
    if (used + chunk.token_count > budgetTokens) continue;
    selected.push(chunk);
    used += chunk.token_count;
  }
  return selected;
}

export function buildLoreContext(
  loreContext: LoreContext,
  retrievedChunks: readonly RetrievedLoreChunk[] = [],
): PromptLayer {
  // Curated guardrails are injected FIRST and in full (issue #64) — retrieved
  // chunks only ever fill the budget the authored lore leaves behind, so the
  // hand-written canon is never crowded out by retrieval.
  const retrieved = selectRetrievedForBudget(
    retrievedChunks,
    TOKEN_BUDGET.lore - loreContext.totalTokens,
  );

  if (loreContext.entries.length === 0 && retrieved.length === 0) {
    return { role: "system", content: "", cacheControl: true };
  }

  const parts: string[] = [];

  if (loreContext.entries.length > 0) {
    const sections = loreContext.entries.map((entry) => {
      // narratorOnly defaults to true — all existing lore contains Beyonder world
      // knowledge that an ordinary starting character would not possess.
      const tag = entry.narratorOnly !== false ? " [NARRATOR ONLY]" : "";
      return `### ${entry.title} [${entry.category}]${tag}\n${entry.content}`;
    });
    parts.push(
      `## Lore Context\nUse the following lore as reference for narrative accuracy. Do not contradict this information.\n\n${sections.join("\n\n")}`,
    );
  }

  if (retrieved.length > 0) {
    // Retrieved corpus text is narrator reference by definition — the player
    // character has not "read the novel".
    const sections = retrieved.map(
      (chunk) => `### ${chunk.title} (${chunk.source}) [NARRATOR ONLY]\n${chunk.content}`,
    );
    parts.push(
      `## Retrieved Source Material [NARRATOR ONLY]\nPassages retrieved from the source material for narrative accuracy. Reference only — never reveal knowledge the character has not earned in play, and never quote these passages verbatim.\n\n${sections.join("\n\n")}`,
    );
  }

  return { role: "system", content: parts.join("\n\n"), cacheControl: true };
}

/**
 * Build the unreliable-narration directive layer for the current sanity tier.
 * Returns an empty-content layer at high sanity (the assembler drops it) — a
 * reliable narrator needs no instruction and we save the tokens.
 */
export function buildSanityDirective(gameState: GameState): PromptLayer {
  const tier = classifySanityTier(gameState.sanity, gameState.maxSanity);
  return { role: "system", content: sanityNarrationDirective(tier) };
}

export function buildGameStatePrompt(gameState: GameState): PromptLayer {
  const stateJson = JSON.stringify(
    {
      character: gameState.characterId,
      pathway: gameState.pathwayId,
      sequence: gameState.sequenceLevel,
      sanity: `${gameState.sanity}/${gameState.maxSanity}`,
      potionDigestion: gameState.digestion ? `${gameState.digestion.progress}%` : "0%",
      location: gameState.location,
      inventory: gameState.inventory.map((i) => i.name),
      activeQuests: gameState.activeQuests,
      npcsPresent: gameState.npcsPresent,
    },
    null,
    2,
  );

  return {
    role: "user",
    content: `## Current Game State\n\`\`\`json\n${stateJson}\n\`\`\``,
  };
}

export function buildHistoryPrompt(memory: MemoryState): PromptLayer {
  const trimmed = trimMemoryForBudget(memory, TOKEN_BUDGET.history);
  const content = formatMemoryForPrompt(trimmed);

  if (!content) {
    return { role: "user", content: "" };
  }
  return { role: "user", content: `## History\n${content}` };
}

export function buildInstructionPrompt(
  instruction: InstructionType,
  playerAction: string,
): PromptLayer {
  const instructionMap: Record<InstructionType, string> = {
    narrative:
      "Generate a narrative response to the player's action. Include 2-4 meaningful choices for what they can do next.",
    choices:
      "Generate a set of 2-4 meaningful choices for the player based on the current situation.",
    evaluation:
      "Evaluate the player's action against their acting requirements. Provide an acting alignment score and narrative consequences.",
    advancement:
      "The player is attempting a Beyonder advancement. Narrate the ritual, evaluate acting alignment, and describe the consequences.",
    combat:
      "The player is in combat. Narrate this combat exchange vividly and in the flavour of their pathway (a Seer divines the enemy's moves, a Spectator reads their intent, a Bard channels searing light, a Death Beyonder commands spirits). The mechanical outcome and the tactical options are decided by the rules engine — do NOT invent the result or new choices; narrate only the moment described in the player action.",
  };

  return {
    role: "user",
    content: `## Instruction\n${instructionMap[instruction]}\n\n## Player Action\n${playerAction}`,
  };
}

export function assemblePrompt(input: PromptInput): PromptAssembly {
  const layers: PromptLayer[] = [];

  const systemLayer = buildSystemPrompt(input.abilities, input.actingRequirements);
  layers.push(systemLayer);

  const sanityLayer = buildSanityDirective(input.gameState);
  if (sanityLayer.content) {
    layers.push(sanityLayer);
  }

  // Epoch setting (issues #26/#29): tone, vocabulary, and power structures
  // for non-Fifth starts. The Fifth is the baseline and adds nothing.
  if (input.epochContext) {
    layers.push({ role: "system", content: `## Epoch\n${input.epochContext}` });
  }

  // Active persona (issue #22): one presentation-context line so tone and
  // social access track the identity the character is currently wearing.
  if (input.identityContext) {
    layers.push({
      role: "system",
      content: `## Active Identity\n${input.identityContext}`,
    });
  }

  const loreLayer = buildLoreContext(input.loreContext, input.retrievedChunks ?? []);
  if (loreLayer.content) {
    layers.push(loreLayer);
  }

  const gameStateLayer = buildGameStatePrompt(input.gameState);
  layers.push(gameStateLayer);

  const historyLayer = buildHistoryPrompt(input.memory);
  if (historyLayer.content) {
    layers.push(historyLayer);
  }

  const instructionLayer = buildInstructionPrompt(input.instruction, input.playerAction);
  layers.push(instructionLayer);

  const totalTokenEstimate = layers.reduce(
    (sum, layer) => sum + estimateTokens(layer.content),
    0,
  );

  return { layers, totalTokenEstimate };
}

export function promptToMessages(assembly: PromptAssembly): ChatMessage[] {
  const systemParts: string[] = [];
  const userParts: string[] = [];

  for (const layer of assembly.layers) {
    if (layer.role === "system") {
      systemParts.push(layer.content);
    } else {
      userParts.push(layer.content);
    }
  }

  const messages: ChatMessage[] = [];
  if (systemParts.length > 0) {
    messages.push({ role: "system", content: systemParts.join("\n\n") });
  }
  if (userParts.length > 0) {
    messages.push({ role: "user", content: userParts.join("\n\n") });
  }
  return messages;
}

export function isWithinTokenBudget(assembly: PromptAssembly): boolean {
  return assembly.totalTokenEstimate <= TOKEN_BUDGET.total;
}

export { TOKEN_BUDGET };
