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
import { formatMemoryForPrompt, trimMemoryForBudget, CHARS_PER_TOKEN } from "./memory";
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
  "fundsDiscovered": number (pence found or lost in the fiction this turn; negative for a loss),
  "journalEntry": {"summary": "string (one sentence)", "eventType": "advancement|major-event|npc-encounter|discovery|timeline-divergence|death|combat"},
  "proposedSelfChange": {"field": "name|appearance|gender|pronouns|epithet|age|marks", "value": "string", "reason": "string"},
  "runningSummary": "string - the updated 'story so far' synopsis (see Running Summary below)"
}

## Rules
- Narrative should be atmospheric, drawing on Victorian steampunk and cosmic horror themes.
- Acting requirements are central to the Beyonder power system. Evaluate player actions against them.
- The acting alignment score (0.0-1.0) you return drives "digestion" of the current potion: acting in character (≥0.5) advances it, acting against the role (<0.35) reverses it. Score honestly so the player understands why their action did or did not count. 0.5 is neutral/acceptable acting; reserve scores below 0.35 for actions that clearly betray the role.
- Sanity impact ranges: routine events (0), unsettling (-1 to -5), horrifying (-6 to -15), mind-breaking (-16 to -20), rest/comfort (+1 to +10).
- Items discovered must be from the LOTM universe. Do not invent items outside the lore.
- When the character genuinely comes into money in the fiction (a found purse, a paid reward, loot) — or loses it (robbed, a bribe, a fine) — report it as "fundsDiscovered" in PENCE (12 pence = 1 soli, 240 pence = 1 pound) so it reaches their wallet; negative for a loss. Keep amounts plausible for the scene (a street find is coins, not a fortune); the engine caps any single turn. Do NOT use "worldStateChanges" for money, and never grant funds merely because the player asserts them.
- Choices should be meaningful and consequential, typically 2-4 options. Follow the "Choice Design" rules below.
- World state changes must include a reason explaining why the change occurred.
- Player actions may be typed free-text: treat them as INTENT to attempt, not fact. Resolve only what the character could plausibly do in this moment; impossible or self-aggrandizing demands fail naturally within the fiction. Never grant items, advancement, or knowledge merely because the player asserts them.
- Sequence advancement is owned by the rules engine, NOT by you. NEVER narrate the character as having advanced, ascended, or become a higher Sequence/role than the one given in the game state — even when their potion is fully digested. A digested potion means they are READY to undergo the rite; describe the pull toward it and let them seek it out, but they remain their current Sequence until the engine commits the change. Treat the Sequence and role name in the game state as ground truth for who the character currently is.
- Include "journalEntry" ONLY when the turn contains a key event worth recording (advancement, a major plot development, a significant first encounter, a death, a divergence from canon). Routine turns must omit it.
- Include "proposedSelfChange" ONLY when the player's action clearly and unambiguously declares a change to who their character fundamentally is — a new name they adopt, a changed appearance, gender, title/epithet, age, or distinguishing marks. Do NOT change the name or appearance in the narrative yourself and do NOT use "worldStateChanges" for this: the player must confirm the change before the engine applies it. Treat ambiguous or hypothetical phrasing as ordinary narration and omit the field. The "## True Self" context (when present) is ground truth for who the character currently is.

## Running Summary
You are given the chronicle's durable synopsis under "## Story So Far" (empty at the very start). Each turn, return "runningSummary": an UPDATED, self-contained synopsis that future turns will rely on as their primary long-term memory — the recent turn-by-turn history is eventually dropped, but this is not.
- Capture only LASTING, pertinent information: who the character is and their current circumstances, standing goals and obligations, key NPCs and relationships, unresolved threats, secrets they are keeping, and meaningful possessions or commitments.
- Fold this turn's lasting developments into the prior summary and PRUNE detail that no longer matters. Keep it under ~200 words, written as terse durable notes (not prose, no second-person narration).
- Carry forward the character's origin and background — never let earlier context silently drop out as the story grows.
- If nothing of lasting consequence happened and the prior summary still holds, you may return it unchanged or omit the field entirely.
- Record ONLY what has actually happened in play or is supported by the provided lore. Never introduce a new canonical name, organization, deity, place, or piece of history into the summary that was not established in the narrative — an invented detail written here hardens into "fact" for every future turn, so keep the summary strictly faithful.

## Canon Fidelity
This is a Lord of the Mysteries story; stay faithful to its canon.
- When the provided Lore Context or Retrieved Source Material covers something (a pathway, sequence, ability, ritual, organization, deity, location, item, or historical event), follow it EXACTLY and never contradict it.
- When the provided material does NOT cover something, prefer restraint: you may invent ordinary, world-consistent texture (unnamed passersby, a side street, a minor everyday event), but do NOT fabricate Beyonder-tier canon — invented pathways/sequences/abilities, potion formulas, churches or secret organizations, deities, or major historical events. Keep newly-introduced specifics small, mundane, and revisable.
- Prefer "you don't know" or quiet ambiguity over a confident wrong answer. Never present an invented detail as established lore the world would already agree on.

## Choice Design
Choices must grow naturally from the scene and reflect what a real person in this exact moment would actually consider. Ground them in the ordinary, human reality of the world FIRST — talking, leaving, observing, waiting, handling an everyday object, or pursuing a practical, mundane goal.
- Do NOT force a ritual, divination, or overt power-use option into every scene. The supernatural is rare, hidden, and dangerous; most moments offer no Beyonder option at all. Surface one only when the fiction has genuinely set it up AND the character has a plausible reason and the means to reach for it.
- A scene of pure ordinary life (a conversation, a meal, a walk through the city) is valid and should stay ordinary. Let tension and the uncanny emerge from the unfolding story, never from a menu of choices that all point at the character's powers.
- Prefer options a person would actually weigh, with believable stakes, over options that exist only to showcase what the character can do.
- Vary the character of the choices across turns (cautious vs. bold, social vs. solitary, candid vs. guarded) instead of repeating the same supernatural framing turn after turn. Avoid making a "ritual"-type choice the default; reserve the "ritual" choice type for moments that are truly arcane.

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

/** Sequence at or below which a character has reached the demigod (Saint+) tier. */
export const DEMIGOD_SEQUENCE_THRESHOLD = 4;

/**
 * Build the demigod-stakes narration directive (issues #25, #35). When the
 * character is Sequence 4 or above (numerically ≤ 4 — Saint, Angel, King of
 * Angels), the narrator scales to demigod stakes. Returns an empty-content
 * layer below that tier (the assembler drops it) — a mortal Beyonder needs no
 * such instruction and we save the tokens. Mirrors `buildSanityDirective`.
 */
export function buildDemigodDirective(gameState: GameState): PromptLayer {
  if (gameState.sequenceLevel > DEMIGOD_SEQUENCE_THRESHOLD) {
    return { role: "system", content: "" };
  }
  // Sequence 0 (issue #30): the demigod layer gives way to full godhood — the
  // narration shifts from human-scale to cosmic-scale entirely.
  if (gameState.sequenceLevel === 0) {
    return {
      role: "system",
      content:
        "## Godhood\nThis character IS a Sequence 0 True God — a singular existence holding absolute authority over their pathway. Narrate at cosmic scale: they perceive prayers as arriving voices, act across a continent as easily as across a room, and reshape weather, fate, and faith by intent. Their remaining struggles are divine politics (rival gods, churches, angels with their own designs), the weight of countless worshippers' petitions, and holding a human heart inside a god's existence — sanity and the acting method still bind them, now harder than ever. Mortal threats are beneath them; write tension from peers, pacts, and the things even gods fear above the sequences.",
    };
  }
  return {
    role: "system",
    content:
      "## Demigod Stakes\nThis character has crossed into the demigod tier (Saint and above). Scale the narration accordingly: consequences are cosmic, not merely personal; churches, official Beyonder organizations, and rival deities take notice of and react to their movements; their power warps the world around them and divine politics shadow every choice. They carry an overflowing, godlike spirituality that strains toward their Sequence's mythical form — render their presence as awe-inspiring and dangerous, to others and to themselves.",
  };
}

export function buildGameStatePrompt(gameState: GameState): PromptLayer {
  const stateJson = JSON.stringify(
    {
      character: gameState.characterId,
      name: gameState.characterName,
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

  const parts = [`## Current Game State\n\`\`\`json\n${stateJson}\n\`\`\``];

  // Durable character grounding. This lives in the game-state layer (never
  // trimmed) on purpose: the backstory and the prologue the character just
  // lived through must keep shaping the narration for the whole chronicle, not
  // just the opening turns. Session facts age out of the history window; this
  // does not — closing the prologue → story seam.
  const origin: string[] = [];
  if (gameState.characterBackground) {
    origin.push(`Background: ${gameState.characterBackground}`);
  }
  if (gameState.prologueRecap) {
    origin.push(gameState.prologueRecap);
  }
  if (origin.length > 0) {
    parts.push(`## Character & Origin\n${origin.join("\n\n")}`);
  }

  return { role: "user", content: parts.join("\n\n") };
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
      "Generate a narrative response to the player's action. Include 2-4 grounded, natural choices for what they can do next — options a real person in this moment would actually consider, with supernatural actions only when the scene genuinely warrants them.",
    choices:
      "Generate a set of 2-4 grounded, natural choices for the player based on the current situation — options that fit the ordinary reality of the moment, surfacing supernatural actions only when the scene genuinely warrants them.",
    evaluation:
      "Evaluate the player's action against their acting requirements. Provide an acting alignment score and narrative consequences.",
    advancement:
      "The player is undergoing a Beyonder advancement that the rules engine has ALREADY committed — the game state now reflects their new Sequence. Narrate the ritual and the transformation into the new role described in the player action, evaluate acting alignment, and describe the consequences. This is the ONLY context in which you may portray the character at a higher Sequence.",
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

  // Demigod stakes (issues #25, #35): at Sequence ≤ 4 the narration scales to
  // cosmic consequences and divine politics. Empty below the tier, so dropped.
  const demigodLayer = buildDemigodDirective(input.gameState);
  if (demigodLayer.content) {
    layers.push(demigodLayer);
  }

  // Per-city narration tone (issue #23): one sentence so each city reads with
  // its own atmosphere. Dropped when the location maps to no specific tone.
  if (input.cityNarration) {
    layers.push({
      role: "system",
      content: `## Setting Tone\n${input.cityNarration}`,
    });
  }

  // Active persona (issue #22): one presentation-context line so tone and
  // social access track the identity the character is currently wearing.
  if (input.identityContext) {
    layers.push({
      role: "system",
      content: `## Active Identity\n${input.identityContext}`,
    });
  }

  // True self (character-info storage): ground-truth self facts the narrator must
  // honour — pronouns, gender, appearance, demeanor. Dropped when the profile is
  // empty.
  if (input.profileContext) {
    layers.push({
      role: "system",
      content: `## True Self\n${input.profileContext}`,
    });
  }

  // Recognition gap (character-info storage): the people who knew the character
  // before a drastic transformation and don't recognise them now. Dropped when no
  // gap is open.
  if (input.recognitionContext) {
    layers.push({
      role: "system",
      content: `## Recognition\n${input.recognitionContext}`,
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
