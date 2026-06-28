import type {
  ChatMessage,
  GameState,
  InstructionType,
  LoreContext,
  MemoryState,
  NarrativeVerbosity,
  PinnedCodexEntity,
  PromptAssembly,
  PromptInput,
  PromptLayer,
  RetrievedLoreChunk,
} from "./types";
import { formatMemoryForPrompt, trimMemoryForBudget, CHARS_PER_TOKEN } from "./memory";
import { classifySanityTier, sanityNarrationDirective } from "./sanity";

// Rebalanced for story-memory consistency. The `history` layer is the
// continuity bottleneck — at 1,000 tokens it could barely hold the immediate
// window with no room for the running summary + recent bullets, so detail was
// trimmed away mid-session and turns lost track of each other. History is raised
// 1,000 -> 4,500 (it now comfortably holds the widened 8-turn immediate window
// plus the durable synopsis and recent bullets), gameState 1,000 -> 1,200, and
// lore is trimmed 4,000 -> 3,000 to partly offset it — lore is prompt-cached
// (≈10% of input price after the first call) and was NOT the bottleneck, so the
// trade lands cost on the cheap layer and tokens where continuity needs them.
// Net per-turn input is ~+2,700 tokens, a rounding error against every provider's
// context window (Haiku 200K, Sonnet/Opus 1M, GPT-4o 128K) and cents/turn even at
// premium tiers with caching — $0 on local Ollama. See docs/rag-per-turn-budget.md.
const TOKEN_BUDGET = {
  system: 2500,
  lore: 3000,
  gameState: 1200,
  history: 4500,
  instruction: 300,
  total: 11500,
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
  "worldStateChanges": [{"field": "string", "oldValue": any, "newValue": any, "reason": "string", "involuntaryCause": "abduction|forced-passage|capability-gated-teleport (OPTIONAL; only on a 'location' change that relocates the character to another city against their will)"}],
  "actingEvaluation": {"alignment": 0.0-1.0, "reasoning": "string"},
  "sanityImpact": number (-5 to +5; small residual nuance only — see Sanity below),
  "sanityEventTags": ["rest"|"human-connection"|"routine"|"ability-use"|"horror-encounter"],
  "actingMethodTaught": boolean (true ONLY when the acting method is explicitly taught/revealed this turn),
  "itemsDiscovered": [{"name": "string", "description": "string", "category": "mundane"}],
  "fundsDiscovered": number (pence found or lost in the fiction this turn; negative for a loss),
  "journalEntry": {"summary": "string (one sentence)", "eventType": "advancement|major-event|npc-encounter|discovery|timeline-divergence|death|combat"},
  "proposedSelfChange": {"field": "name|appearance|gender|pronouns|epithet|age|marks", "value": "string", "reason": "string"},
  "pursuers": ["string"] (names of NPCs actively hunting/pursuing the character — see Rules),
  "codexUpdates": [{"kind": "person|location|object|group|thread", "name": "string", "status": "string (concise current state)", "importance": "pivotal|standard (OPTIONAL)", "resolved": "boolean (OPTIONAL; threads only)"}] (record important recurring entities — see Codex below),
  "runningSummary": "string - the updated 'story so far' synopsis (see Running Summary below)"
}

## Rules
- Narrative should be atmospheric, drawing on Victorian steampunk and cosmic horror themes.
- Acting requirements are central to the Beyonder power system. Evaluate player actions against them.
- The acting alignment score (0.0-1.0) you return drives "digestion" of the current potion: acting in character (≥0.5) advances it, acting against the role (<0.35) reverses it. Score honestly. 0.5 is neutral/acceptable acting; reserve scores below 0.35 for actions that clearly betray the role. Do NOT name, explain, or teach the "digestion" mechanic or the "acting method" to the player — it is secret knowledge a Beyonder must discover. Keep your "reasoning" in-world and do not lecture about how acting "counts".
- Set "actingMethodTaught": true ONLY when this turn explicitly teaches the acting method — an NPC instructs the character to live their role, or the character reads it plainly in lore/a text. Never set it merely because acting was good or bad, and never as a warning or a sanity scare. Omit it otherwise.
- Sanity: the engine sets most per-turn sanity from "sanityEventTags" — emit the tags for what actually happened this turn: "rest" (sleep, safety, genuine respite), "human-connection" (warmth, intimacy, being truly seen), "routine" (mundane, grounding ordinary activity), "ability-use" (the character used Beyonder powers), "horror-encounter" (a brush with the uncanny/monstrous/eldritch). Emit several if several apply, or none for a flat turn. Use "sanityImpact" only as a SMALL residual nuance the tags miss, strictly within -5 to +5 (negative unsettles, positive soothes); leave it at 0 / omit it when the tags already capture the turn.
- Tag from THIS character's perspective, not a generic onlooker's. "horror-encounter" is the uncanny that genuinely DESTABILISES *this* Beyonder — reserve it for the supernatural/eldritch crossing their path, not merely grim or unpleasant mundane content (a corpse, a crime scene, blood, poverty, violence are ordinary to this world). Above all, work that is squarely within the character's OWN Sequence and role is "routine" (or no tag), never "horror" — a Corpse Collector cataloguing the dead, a Sailor in a storm, a Spectator before the strange are inhabiting their nature, which steadies them rather than fraying them. Reserve "horror-encounter" for what unsettles them despite who they are.
- Items discovered must be from the LOTM universe. Do not invent items outside the lore. Use "itemsDiscovered" ONLY for ordinary, mundane possessions the character physically comes by (a key, a coat, a letter, a tool, a coin-purse) — always set "category" to "mundane". You must NOT grant potion formulas, Beyonder Characteristics, or advancement ingredients here: those are owned by the rules engine and acquired only through preparation (purchase or hunt). Instead, narrate the LEAD — a seller, a price, a rumour, a patron, a trail, or a hunt target — and let the player pursue it through the preparation framework; an item you mark as a formula or ingredient will be stripped from inventory and turned into a story lead, never carried. The ONE exception is the singular pathway Uniqueness — the final artifact a Sequence 1 Beyonder must seize to become a True God: when the story has genuinely earned that endgame moment, you may grant it with "category": "uniqueness".
- When the character genuinely comes into money in the fiction (a found purse, a paid reward, loot) — or loses it (robbed, a bribe, a fine) — report it as "fundsDiscovered" in PENCE (12 pence = 1 soli, 240 pence = 1 pound) so it reaches their wallet; negative for a loss. Keep amounts plausible for the scene (a street find is coins, not a fortune); the engine caps any single turn. Do NOT use "worldStateChanges" for money, and never grant funds merely because the player asserts them.
- Choices should be meaningful and consequential, typically 2-4 options. Follow the "Choice Design" rules below.
- World state changes must include a reason explaining why the change occurred.
- Player actions may be typed free-text: treat them as INTENT to attempt, not fact. Resolve only what the character could plausibly do in this moment; impossible or self-aggrandizing demands fail naturally within the fiction. Never grant items, advancement, or knowledge merely because the player asserts them.
- Sequence advancement is owned by the rules engine, NOT by you. NEVER narrate the character as having advanced, ascended, or become a higher Sequence/role than the one given in the game state — even when their potion is fully digested. A digested potion means they are READY to undergo the rite; describe the pull toward it and let them seek it out, but they remain their current Sequence until the engine commits the change. Treat the Sequence and role name in the game state as ground truth for who the character currently is.
- Backstory sequence claims are UNRELIABLE NARRATIVE. If the player's background text claims a sequence number, treat it as a story detail or aspiration — NOT as an established game fact. The character's actual sequence is always and only what the engine reports in ## Character & Origin. Never let a backstory claim override, supplement, or imply a sequence different from the engine value.
- Cross-city movement is the player's deliberate choice (the travel map), NOT yours. You may move the character freely WITHIN their current city — between its districts, streets, and landmarks. You must NEVER relocate them to a DIFFERENT city for pacing or convenience. The ONE exception is a relocation that happens AGAINST their will — an abduction, being carried through a forced passage, or a higher being seizing them across distance: signal it by setting "involuntaryCause" on the "location" change to the matching code (abduction / forced-passage / capability-gated-teleport). A cross-city "location" change WITHOUT an "involuntaryCause" is refused by the engine — the character simply stays where they are — so do not attempt it. Whenever you set a "location" while in a known city, LEAD the string with that city's name and then the specific place, e.g. "Backlund — Old Saint-Sulpice Chapel" or "Tingen City — Iron Cross District"; never write a bare venue ("the chapel") that omits the city, so the engine keeps the character on the right map and files new places under the right city.
- Include "journalEntry" ONLY when the turn contains a key event worth recording (advancement, a major plot development, a significant first encounter, a death, a divergence from canon). Routine turns must omit it.
- Use "pursuers" for the names of NPCs who have begun, or are still, actively HUNTING or pursuing the character — an enemy who will follow them from place to place. They persist on the character's trail (and reappear when the character travels) until the character shakes them off in the fiction; once that happens, stop listing them. Do NOT list ordinary present bystanders, allies, or companions here — only genuine pursuers. Companions who travel WITH the character are the player's own choice and are never set by you.
- Include "proposedSelfChange" ONLY when the player's action clearly and unambiguously declares a change to who their character fundamentally is — a new name they adopt, a changed appearance, gender, title/epithet, age, or distinguishing marks. Do NOT change the name or appearance in the narrative yourself and do NOT use "worldStateChanges" for this: the player must confirm the change before the engine applies it. Treat ambiguous or hypothetical phrasing as ordinary narration and omit the field. The "## True Self" context (when present) is ground truth for who the character currently is.

## Running Summary
You are given the chronicle's durable synopsis under "## Story So Far" (empty at the very start). Each turn, return "runningSummary": an UPDATED, self-contained synopsis that future turns will rely on as their primary long-term memory — the recent turn-by-turn history is eventually dropped, but this is not.
- Maintain it as a set of LABELLED lines, each carrying only lasting, established facts. Use exactly these labels, each on its own line, and OMIT any label that has nothing established yet:
  - Who: the character — name, their current Sequence/role as established IN PLAY (never a higher one than the game state shows), and defining traits.
  - Situation: where they are now and their immediate circumstances.
  - Goals: standing objectives and obligations.
  - Ties: key NPCs and the nature of each relationship.
  - Threads: unresolved threats, secrets being kept, debts owed, and meaningful possessions or commitments.
- Each turn, fold the turn's lasting developments into the matching label and PRUNE detail that no longer matters; OVERWRITE a label's contents to keep them current rather than letting stale facts linger. Keep the whole summary under ~200 words of terse notes (not prose, no second-person narration).
- Carry the character's origin and background forward under the relevant labels — never let earlier context silently drop out as the story grows, and never blank the whole summary at once.
- If nothing of lasting consequence happened and the prior summary still holds, you may return it unchanged or omit the field entirely.
- The "## Ground Truth" block in the History is authoritative: if your synopsis ever disagrees with it about location, who is present, or the character's Sequence/role, correct the synopsis to match it.
- Record ONLY what has actually happened in play or is supported by the provided lore. Never introduce a new canonical name, organization, deity, place, or piece of history into the summary that was not established in the narrative — an invented detail written here hardens into "fact" for every future turn, so keep the summary strictly faithful.

## Codex (recurring entities)
Maintain a durable record of the people, places, objects, groups, and unresolved plot threads that matter across the whole chronicle, so a figure or promise from a hundred turns ago is never contradicted when it returns. Use "codexUpdates" — an array of DELTAS, not a restatement of the whole cast.
- Emit an entry ONLY when an entity is first introduced OR its standing materially changes (an ally turns, an NPC dies, a place is destroyed, a debt is incurred or repaid). A routine turn that establishes nothing new emits no "codexUpdates" at all.
- "kind" is one of: "person", "location", "object", "group" (organizations, congregations, factions), or "thread" (an open promise, debt, vow, secret, or hook the story still owes a payoff).
- "name" is the entity's stable name; "status" is a SHORT present-tense note of its current state (e.g. "alive; reluctant ally, hiding in Backlund", "destroyed in the fire", "owed a favour — unpaid"). Keep each under ~20 words.
- Set "importance": "pivotal" for the figures, places, and threads central to the chronicle (recurring allies/enemies, the character's seat of power, a driving vow) — these are always kept in view; omit it (defaults to "standard") for minor or incidental entities.
- For a "thread", set "resolved": true on the turn it is finally settled, so it stops being treated as an open obligation.
- Record ONLY what play or the provided lore has established — never invent canon here (the same fidelity rule as the running summary). The "## Established Facts" block in the History is this record fed back to you: treat it as authoritative and do not contradict it.

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
  // A Pillar — above the sequences (issue #99 Part B; the engine's
  // `PILLAR_SEQUENCE` sentinel is the only negative level). Cosmic scale beyond
  // even a True God: the character is now one of the four things the gods answer
  // to. Checked first, since the sentinel is < the demigod threshold.
  if (gameState.sequenceLevel < 0) {
    return {
      role: "system",
      content:
        "## Above the Sequence\nThis character is no longer a Beyonder, nor merely a True God — they are one of the four PILLARS that hold the world's order open (the cosmic apex above Sequence 0). Narrate beyond godhood: they are a fixture of reality itself, the seat their entire family of pathways draws authority from; their attention alone reshapes faith, fate, and the boundaries between the sequences and what lies above them. The only forces that matter at this scale are the other Pillars (peers and counterweights), the outer unknowable things even Pillars regard warily, and the unbearable strain of holding a single human thread of self inside a load-bearing piece of the universe. There are no mortal or divine threats — only cosmic equilibrium, the politics of the apex, and what it costs to remain someone while being something. The acting method and sanity bind harder than ever.",
    };
  }
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

  // Canon-character takeover (issue #92): the player IS this canonical figure.
  // Guard against the residual third-person gap — the narrator must never write
  // them as a separate present character.
  if (gameState.canonCharacterId && gameState.characterName) {
    let directive = `## You Are This Character\nThe player character IS ${gameState.characterName} — the canonical figure, not a lookalike. Never portray ${gameState.characterName} as a separate present character, NPC, or third party; they are the protagonist you are narrating for.`;
    // Bias the PRESENTED choices toward what this figure would canonically do
    // (personality-aligned suggestions) — the player remains free to act against
    // type, and you must never force an in-character action.
    if (gameState.canonPersonality) {
      directive += `\n${gameState.characterName} is, in canon: ${gameState.canonPersonality} Shape the choices you OFFER so they reflect how ${gameState.characterName} would characteristically think and act — but the player is always free to choose against type, and you must never force an in-character action or remove the option to act differently.`;
    }
    parts.push(directive);
  }

  return { role: "user", content: parts.join("\n\n") };
}

/**
 * Compact, authoritative anchor pinned at the TOP of the history layer — right
 * above the AI-maintained "## Story So Far" synopsis. The running summary can
 * drift from the engine's ground truth (a recursive-summarization failure mode),
 * so this restates the few most drift-prone facts (current location, who is
 * present) and tells the narrator that THESE win over any conflicting detail in
 * the notes below. Terse on purpose (~30 tokens): the full state is already in
 * the never-trimmed `## Current Game State` layer; this is a local reminder
 * placed next to the synopsis where the model attends to it.
 */
function buildGroundTruthAnchor(gameState: GameState): string {
  const present =
    gameState.npcsPresent.length > 0
      ? gameState.npcsPresent.join(", ")
      : "no specific named NPCs";
  return [
    "## Ground Truth (authoritative)",
    "These engine facts override any conflicting detail in the story notes below — if the synopsis or a past turn disagrees with these, THESE are correct:",
    `- Current location: ${gameState.location}`,
    `- Present this scene: ${present}`,
  ].join("\n");
}

/** Per-kind label for an `## Established Facts` line. */
const CODEX_KIND_LABELS: Record<string, string> = {
  person: "Person",
  location: "Place",
  object: "Object",
  group: "Group",
  thread: "Thread",
};

/**
 * Compact, authoritative `## Established Facts` block (history-context Codex)
 * pinned alongside the ground-truth anchor. Built from the engine's
 * scene-relevant + pivotal Codex entities — a stable index of who/what matters
 * so a figure or open thread from long ago is not contradicted when it returns.
 * The selection is already hard-capped by the engine (`selectPinnedEntities`),
 * so this block is bounded no matter how large the full Codex grows — the
 * per-turn budget stays flat. Returns "" when there is nothing pinned.
 */
function buildEstablishedFacts(entities: readonly PinnedCodexEntity[]): string {
  if (entities.length === 0) return "";
  const lines = entities.map((e) => {
    const label = CODEX_KIND_LABELS[e.kind] ?? "Entity";
    const status = e.status ? ` — ${e.status}` : "";
    const resolved = e.kind === "thread" && e.resolved ? " (resolved)" : "";
    const seen = Number.isFinite(e.lastSeenTurn)
      ? ` (last seen turn ${e.lastSeenTurn})`
      : "";
    return `- [${label}] ${e.name}${status}${resolved}${seen}`;
  });
  return [
    "## Established Facts (canon — do not contradict)",
    "These are established people, places, objects, groups, and open threads from the chronicle so far. Keep them consistent — do not contradict a status, kill off someone already gone, or drop an unresolved thread:",
    ...lines,
  ].join("\n");
}

export function buildHistoryPrompt(
  memory: MemoryState,
  gameState?: GameState,
  pinnedEntities: readonly PinnedCodexEntity[] = [],
): PromptLayer {
  const trimmed = trimMemoryForBudget(memory, TOKEN_BUDGET.history);
  const content = formatMemoryForPrompt(trimmed);

  if (!content) {
    return { role: "user", content: "" };
  }
  // Anchor only once there is history to anchor against (turn 0 has none, and the
  // game-state layer already carries the ground truth on its own). The Established
  // Facts block rides next to the ground-truth anchor, above the synopsis.
  const anchors = gameState
    ? [buildGroundTruthAnchor(gameState), buildEstablishedFacts(pinnedEntities)].filter(
        (s) => s !== "",
      )
    : [buildEstablishedFacts(pinnedEntities)].filter((s) => s !== "");
  const body = anchors.length > 0 ? `${anchors.join("\n\n")}\n\n${content}` : content;
  return { role: "user", content: `## History\n${body}` };
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
      "The player is in combat. Narrate this combat exchange vividly and in the flavour of their pathway (a Seer divines the enemy's moves, a Spectator reads their intent, a Bard channels searing light, a Death Beyonder commands spirits). The mechanical outcome and the tactical options are decided by the rules engine — do NOT invent the result or new choices; narrate only the moment described in the player action. HONOUR the cues the player action carries: if the fight is framed as a mind-controlled comrade or a coerced ally, portray them fighting against their will (not a true enemy); if the player is trying to snap them free, talk them down, subdue, capture, or spare, let that intent shape the prose; and if the player's control is fraying, slipping, or spiralling, render them wrestling their OWN power as much as the foe.",
  };

  return {
    role: "user",
    content: `## Instruction\n${instructionMap[instruction]}\n\n## Player Action\n${playerAction}`,
  };
}

// Player-chosen narration length. "standard" is the baseline and adds nothing
// (the assembler drops an empty-content layer, saving tokens — like
// `buildSanityDirective` at the high tier). Length is governed HERE, by a soft
// directive, never by lowering `MAX_OUTPUT_TOKENS` — that cap holds the whole
// JSON (narrative + running summary + choices), so squeezing it would truncate
// the object mid-write.
//
// This phrasing is the SINGLE source shared by the main turn (below) AND the
// prologue (`prologueVerbosityLine` in `prologue-client.ts`), so the two
// narration surfaces can never drift apart. "standard" has no entry — it is the
// baseline that emits no guidance.
export const VERBOSITY_GUIDANCE: Record<
  Exclude<NarrativeVerbosity, "standard">,
  string
> = {
  concise:
    "Keep it tight — at most 1–2 short paragraphs (roughly 120 words). Lead with what actually changes, keep atmosphere to a line or two, and stop; do not pad or restate.",
  rich: "Write fuller, more atmospheric prose — three to four paragraphs of vivid sensory and emotional texture — while still advancing only the current beat; never sprawl beyond this moment.",
};

/**
 * Build the optional `## Narration Length` directive from the player's verbosity
 * preset. Returns an empty-content layer for "standard"/absent (the assembler
 * drops it); applies to every instruction, including combat.
 */
export function buildVerbosityDirective(verbosity?: NarrativeVerbosity): PromptLayer {
  const guidance =
    verbosity && verbosity !== "standard" ? VERBOSITY_GUIDANCE[verbosity] : undefined;
  return {
    role: "system",
    content: guidance ? `## Narration Length\n${guidance}` : "",
  };
}

/**
 * Build the `## Pacing & Agency` directive that stops the narrator playing the
 * character forward — advance ONE beat, stop at the next decision point, never
 * resolve the player's pending choice. Engine-committed narration turns are
 * EXEMPT (an empty-content layer, dropped): `combat` is a multi-exchange state
 * machine (`@/lib/game/combat.ts`) that hands control back at each mechanical
 * decision point, and `advancement` is a single engine-decided climactic beat
 * routed through ENGINE_RESOLUTION (the engine already owns the outcome and the
 * next turn resumes normal play) — neither is the narrator "playing the
 * character forward", so the rule would be redundant or counterproductive.
 */
const PACING_EXEMPT_INSTRUCTIONS: readonly InstructionType[] = ["combat", "advancement"];

export function buildPacingDirective(instruction: InstructionType): PromptLayer {
  if (PACING_EXEMPT_INSTRUCTIONS.includes(instruction)) {
    return { role: "system", content: "" };
  }
  return {
    role: "system",
    content: `## Pacing & Agency
- Advance the story ONE beat, then STOP at the next decision point and hand control back to the player. A beat is a single action and its immediate consequence — not a whole scene or a chain of events.
- NEVER decide, speak, or act for the player's character beyond the action they just took, and NEVER resolve the choice they are about to make. End on the cusp of their next decision, not past it.
- Do not skip ahead through multiple actions, locations, conversations, or scene changes in one turn. Let the next thing happen only after the player chooses it.
- You MAY briefly compress purely uneventful travel or downtime (a sentence or two of montage), but stop the moment anything consequential, any decision, any new person, or any new scene would begin.`,
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

  const historyLayer = buildHistoryPrompt(
    input.memory,
    input.gameState,
    input.pinnedEntities,
  );
  if (historyLayer.content) {
    layers.push(historyLayer);
  }

  // Narration length (player verbosity preset): applies to every turn including
  // combat. Empty for "standard"/absent, so the layer is dropped.
  const verbosityLayer = buildVerbosityDirective(input.verbosity);
  if (verbosityLayer.content) {
    layers.push(verbosityLayer);
  }

  // Pacing & agency: stop the narrator playing the character forward. Empty for
  // combat (the engine's decision points already enforce beat-by-beat handoff),
  // so the layer is dropped there.
  const pacingLayer = buildPacingDirective(input.instruction);
  if (pacingLayer.content) {
    layers.push(pacingLayer);
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
