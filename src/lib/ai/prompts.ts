import type {
  ChatMessage,
  GameState,
  InstructionType,
  LoreContext,
  MemoryState,
  PromptAssembly,
  PromptInput,
  PromptLayer,
} from "./types";
import { formatMemoryForPrompt, trimMemoryForBudget } from "./memory";

const TOKEN_BUDGET = {
  system: 2500,
  lore: 2500,
  gameState: 1000,
  history: 1000,
  instruction: 300,
  total: 7300,
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
  "itemsDiscovered": [{"name": "string", "description": "string", "category": "main-ingredient|supplementary-ingredient|potion-formula"}]
}

## Rules
- Narrative should be atmospheric, drawing on Victorian steampunk and cosmic horror themes.
- Acting requirements are central to the Beyonder power system. Evaluate player actions against them.
- Sanity impact ranges: routine events (0), unsettling (-1 to -5), horrifying (-6 to -15), mind-breaking (-16 to -20), rest/comfort (+1 to +10).
- Items discovered must be from the LOTM universe. Do not invent items outside the lore.
- Choices should be meaningful and consequential, typically 2-4 options.
- World state changes must include a reason explaining why the change occurred.

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

export function buildLoreContext(loreContext: LoreContext): PromptLayer {
  if (loreContext.entries.length === 0) {
    return { role: "system", content: "", cacheControl: true };
  }

  const sections = loreContext.entries.map((entry) => {
    // narratorOnly defaults to true — all existing lore contains Beyonder world
    // knowledge that an ordinary starting character would not possess.
    const tag = entry.narratorOnly !== false ? " [NARRATOR ONLY]" : "";
    return `### ${entry.title} [${entry.category}]${tag}\n${entry.content}`;
  });

  const content = `## Lore Context\nUse the following lore as reference for narrative accuracy. Do not contradict this information.\n\n${sections.join("\n\n")}`;

  return { role: "system", content, cacheControl: true };
}

export function buildGameStatePrompt(gameState: GameState): PromptLayer {
  const stateJson = JSON.stringify(
    {
      character: gameState.characterId,
      pathway: gameState.pathwayId,
      sequence: gameState.sequenceLevel,
      sanity: `${gameState.sanity}/${gameState.maxSanity}`,
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
      "The player is in combat. Narrate the combat round, apply damage/effects, and provide tactical choices.",
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

  const loreLayer = buildLoreContext(input.loreContext);
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
