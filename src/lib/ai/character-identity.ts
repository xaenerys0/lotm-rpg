import type { ChatMessage } from "./types";

// ---------------------------------------------------------------------------
// AI test-character identity (name + background) — pure prompt + parse
// ---------------------------------------------------------------------------
//
// The dev/admin test-utilities surface forges throwaway characters; rather than
// canned text, it asks the player's own BYOK provider to invent a NAME, a short
// BACKGROUND, and a starting LOCATION. The name follows the naming register of a
// chosen Lord of the Mysteries region (Loen = Victorian English, Intis = French
// with the "de" particle, Feysac = Germanic/Norse, …) — the registers below are
// corpus-grounded (the wiki per-nation character rosters + the curated `@/lib/lore`
// city-tagged NPCs), not invented. Each region also carries a pool of naming
// FACETS that a per-call variety seed rotates through, so successive generations
// diverge instead of collapsing to a handful of stock names. The background is fed
// the character's home city, era, and how settled they are in their current potion
// (digestion) so it reads specific; the location is a Hybrid — the caller picks the
// region's canonical CITY and the model names a plausible venue WITHIN it. Pure
// here (prompt builder + forgiving parser, mirroring `codex-rebuild.ts`); the
// network shell is `generateCharacterIdentity` in `client.ts`. The AI layer stays
// rules-free, so the caller resolves the pathway/role NAMES (via `@/lib/rules`),
// the home city, and the era, and passes them all in as plain strings.

/** A LOTM region whose naming register shapes the generated name. */
export type CharacterRegion =
  | "loen"
  | "intis"
  | "feysac"
  | "rorsted"
  | "forsaken"
  | "balam";

interface RegionNaming {
  /** Player-facing label for the region picker. */
  label: string;
  /** The naming convention, written as direct guidance for the model. */
  directive: string;
  /** A few canon names in this register — for STYLE only, never to reuse. */
  examples: string;
  /**
   * A pool of naming FACETS to riff on (not fixed names). A per-call variety seed
   * samples two of these into the prompt so successive generations lean on
   * different corners of the register instead of collapsing to a handful of stock
   * names — the compositional fix for the "small set of names" repetition.
   */
  inspirations: string[];
}

/**
 * Corpus-grounded naming registers per region (verified against the wiki
 * per-nation rosters + the curated city-tagged NPCs in `@/lib/lore`). Loen is the
 * central Victorian-English setting; the others diverge by the novel's real-world
 * cultural inspirations.
 */
export const CHARACTER_REGIONS: Record<CharacterRegion, RegionNaming> = {
  loen: {
    label: "Loen Kingdom (Tingen / Backlund)",
    directive:
      "Victorian English: a given name plus a plain English surname (occupational, place, or patronymic — e.g. Smith, Mitchell, Hall, Stanton, Wilson, Carter, Cooper). No particles.",
    examples:
      "Klein Moretti, Audrey Hall, Dunn Smith, Leonard Mitchell, Isengard Stanton",
    inspirations: [
      "occupational surnames (Fletcher, Chandler, Mason, Thatcher, Sawyer)",
      "place / estate surnames (Ashcombe, Marlowe, Hartley, Wren)",
      "patronymic surnames (Harrison, Dawkins, Emerson, Nolan)",
      "gentry given names (Cecil, Talbot, Rosanna, Merrick, Gordon)",
      "plainer working-class given names (Bess, Ned, Walter, Ada, Frank)",
      "immigrant-inflected surnames woven into Loen life (Moretti, Kovász, Renn)",
    ],
  },
  intis: {
    label: "Intis Republic (Trier)",
    directive:
      "French: French given names and surnames, frequently carrying the noble particle 'de' (e.g. '… de Lacourt').",
    examples:
      "Angoulême de François, Valentine de Lacourt, Plessy Descartes, Séraphine, Clémence Athana",
    inspirations: [
      "particled 'de / du' surnames (de Rivière, du Plessis, de Vaux)",
      "commoner French surnames (Beaumont, Girard, Lemaire, Chastain)",
      "salon-set given names (Séraphine, Émile, Clémence, Baptiste)",
      "revolutionary-era plain given names (Marin, Odile, Gustave)",
      "soft liquid endings (-elle, -ault, -oise, -ien)",
      "ecclesiastic given names of the Blazing Sun faith (Athanase, Viève-adjacent)",
    ],
  },
  feysac: {
    label: "Feysac Empire",
    directive:
      "Germanic / Norse: hard, consonantal given names and house-surnames with Germanic roots, often ending in -horn or -on.",
    examples: "Awatoma Einhorn, Egor Einhorn, Larrion, Ozil, Snarner",
    inspirations: [
      "hard consonantal given names (Gunnar, Roderik, Bern, Ulf)",
      "house-surnames ending -horn / -on (Einhorn, Valdhorn, Ozon)",
      "compound war-surnames (Sturmwald, Eisen-, Kalt-)",
      "frontier-plain given names (Helda, Greta, Otho)",
      "throaty vowels and doubled consonants",
      "martial epithets kept to the prose, never the name",
    ],
  },
  rorsted: {
    label: "Rorsted Archipelago (Bayam, the Sonia Sea)",
    directive:
      "A colonial port mix: settlers carry Loen-English or French surnames, while native islanders carry SHORT, invented single names (not a real-world language).",
    examples:
      "Jahn Kottman, Danitz Dubois (settlers); Kalat, Ralph, Kalvetua (islanders)",
    inspirations: [
      "settler Loen-English surnames on a plain given name",
      "settler French surnames (Dubois, Lascaux, Renaud)",
      "SHORT invented islander single-names (Kalat, Ralph, Kalvetua)",
      "half-native blends (a Loen surname with an island given name)",
      "harbour nicknames earned on the docks",
      "mixed-tongue spice-market cant, kept to the prose",
    ],
  },
  forsaken: {
    label: "The Forsaken Land (City of Silver / Moon City)",
    directive:
      "Sparse and archaic: single or short two-part names in a mythic register; titles (Silver Knight, High Priest) carry status.",
    examples: "Colin Iliad, Darc Regence, Waite Chirmont, Nim, Aurmir",
    inspirations: [
      "single archaic given names (Nim, Aurmir, Darc)",
      "short two-part mythic names (Colin Iliad, Waite Chirmont)",
      "hard old syllables (-arc, -mir, -aite, -orn)",
      "spare, unadorned surnames when a second part appears",
      "silver / lightning / grey-fog imagery kept to the prose",
      "status titles (Silver Knight, High Priest) as prose weight, not the name",
    ],
  },
  balam: {
    label: "Southern Continent (Balam)",
    directive:
      "Iberian / Latin colonial: Spanish or Portuguese given names and surnames, sometimes the 'Don' honorific; the imperial death-line surname is Eggers.",
    examples: "Sia Palenque Eggers, Camus Castiya, Fernandez Oro, Maysanchez, Montserrat",
    inspirations: [
      "Spanish given + surname (Camus, Fernandez, Montserrat)",
      "Portuguese-inflected surnames (Oro, Palenque, Maysanchez)",
      "warm open vowels and -ez / -es endings",
      "the imperial death-line surname Eggers, used sparingly",
      "the 'Don' honorific carried in prose, not the name",
      "native-Balam blended names among the colonized",
    ],
  },
};

/** How settled the character is in their CURRENT potion (fed to the background). */
export type DigestionStage = "fresh" | "digested";

/** Resolved inputs for the generator — plain strings (the AI layer is rules-free). */
export interface CharacterIdentityInput {
  /** The pathway's display name (e.g. "Fool"). */
  pathwayName: string;
  /** The current rung's role name (e.g. "Seer"). */
  sequenceName: string;
  /** The numeric sequence (9..1) — for the prompt's context. */
  sequenceLevel: number;
  /** The naming register to follow. */
  region: CharacterRegion;
  /**
   * The engine-chosen home CITY (Hybrid location): the model grounds the
   * background and names a specific venue WITHIN it. Omitted → no city context.
   */
  cityName?: string;
  /** The era descriptor (the Fifth Epoch for admin builds). Omitted → no era line. */
  epochLabel?: string;
  /**
   * How settled the character is in the current potion — woven into the
   * background WITHOUT naming the digestion mechanic. Omitted → no digestion line.
   */
  digestionStage?: DigestionStage;
  /**
   * A per-call variety seed. The prompt is otherwise byte-identical every call,
   * which anchors the model onto a handful of stock names; this rotates which
   * naming FACETS the prompt highlights (and is quoted as an anti-repetition
   * token) so successive generations diverge. Omitted → deterministic facet pick.
   */
  variety?: number;
}

/** The generated identity. */
export interface CharacterIdentity {
  name: string;
  background: string;
  /** A specific starting venue/district within the region's city (Hybrid location). */
  location?: string;
}

/** Upper bounds (match the player background cap so the result is reusable). */
export const IDENTITY_NAME_MAX = 80;
export const IDENTITY_BACKGROUND_MAX = 1200;
/** A starting venue is a short phrase, not a paragraph. */
export const IDENTITY_LOCATION_MAX = 120;

/** How many naming facets the variety seed samples into a single prompt. */
const INSPIRATIONS_PER_PROMPT = 2;

const IDENTITY_SYSTEM = `You invent a TEST CHARACTER for a Lord of the Mysteries text RPG: a NAME, a short third-person BACKGROUND, and a specific starting LOCATION.

Return ONLY valid JSON of this exact shape (no prose, no markdown fences):
{"name": "string", "background": "string", "location": "string"}

Rules:
- "name": a believable, FRESH person whose name fits the REGION's naming convention (provided in the request). Compose it from the convention's parts (given + surname, particles, single names) and the naming facets highlighted for this request. Be genuinely inventive — vary the given name, the surname, the syllables, and the sound; do NOT fall back on a handful of stock names, and NEVER reuse a canon example or a famous protagonist's full name (Klein Moretti, Audrey Hall, …). The examples show REGISTER only.
- "background": 2-4 sentences (about 90 words or fewer), third person, grounding the character in their pathway ROLE, their REGION and CITY, and the ERA with mundane, world-consistent texture. When a digestion state is given, weave in HOW settled they are in their current power WITHOUT ever naming the "digestion" or "acting method" mechanic — a FRESH potion reads as raw and still-surfacing, a DIGESTED one as worn-in and second nature. NEVER claim a higher Sequence or tier than the one given, and NEVER fabricate Beyonder-tier canon (gods, organizations, named relics). Prefer ordinary, evocative detail over grand claims.
- "location": a SPECIFIC, plausible starting place WITHIN the given city — a named street, quarter, lodging, workplace, or venue that fits the character's station (e.g. "a rented attic off the Iron Cross foundries"). Just the place; do NOT restate the city name. Omit (empty string) only if no city was provided.`;

/**
 * Rotate `INSPIRATIONS_PER_PROMPT` facets out of the pool by the variety seed, so
 * each call leans on different corners of the register. Deterministic under the
 * seed (defaults to 0); returns the whole pool when it is too small to rotate.
 */
function sampleInspirations(pool: string[], variety?: number): string[] {
  if (pool.length <= INSPIRATIONS_PER_PROMPT) return pool;
  const seed = Number.isFinite(variety) ? Math.abs(Math.trunc(variety as number)) : 0;
  const start = seed % pool.length;
  return Array.from(
    { length: INSPIRATIONS_PER_PROMPT },
    (_, i) => pool[(start + i) % pool.length],
  );
}

/** Build the identity chat messages from the resolved inputs. */
export function buildCharacterIdentityPrompt(
  input: CharacterIdentityInput,
): ChatMessage[] {
  const region = CHARACTER_REGIONS[input.region] ?? CHARACTER_REGIONS.loen;
  const facets = sampleInspirations(region.inspirations, input.variety);
  const lines = [
    `Region: ${region.label}`,
    `Naming convention: ${region.directive}`,
    `Naming facets to lean on THIS time: ${facets.join("; ")}`,
    `Canon names in this register (STYLE reference only — do NOT reuse): ${region.examples}`,
  ];
  if (input.cityName) lines.push(`City: ${input.cityName}`);
  if (input.epochLabel) lines.push(`Era: ${input.epochLabel}`);
  lines.push(
    `Pathway: ${input.pathwayName}`,
    `Current role: ${input.sequenceName} (Sequence ${input.sequenceLevel})`,
  );
  if (input.digestionStage) {
    lines.push(
      input.digestionStage === "fresh"
        ? "Digestion of current potion: FRESH — newly taken, its power still raw and surfacing, not yet mastered."
        : "Digestion of current potion: DIGESTED — fully settled, the power worn-in and second nature.",
    );
  }
  if (input.variety !== undefined) {
    lines.push(
      `Variety token (invent someone entirely new, unlike any prior generation): ${input.variety}`,
    );
  }
  lines.push("", "Generate the name, background, and location.");
  return [
    { role: "system", content: IDENTITY_SYSTEM },
    { role: "user", content: lines.join("\n") },
  ];
}

function clip(s: string, max: number): string {
  return s.length <= max ? s : s.slice(0, max).trimEnd();
}

/**
 * Forgiving parse of the identity output — extracts a fenced/embedded JSON
 * object, requires a non-empty `name`, defaults `background` to "", and clamps
 * both to their caps. Never throws (returns `null` when no usable name), exactly
 * like `parseCodexRebuild`.
 */
export function parseCharacterIdentity(raw: string): CharacterIdentity | null {
  let cleaned = raw.trim();
  const fence = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) cleaned = fence[1].trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    const first = cleaned.indexOf("{");
    const last = cleaned.lastIndexOf("}");
    if (first === -1 || last <= first) return null;
    try {
      parsed = JSON.parse(cleaned.slice(first, last + 1));
    } catch {
      return null;
    }
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return null;
  }
  const o = parsed as Record<string, unknown>;
  const name = typeof o.name === "string" ? o.name.trim() : "";
  if (name === "") return null;
  const background = typeof o.background === "string" ? o.background.trim() : "";
  const location = typeof o.location === "string" ? o.location.trim() : "";
  return {
    name: clip(name, IDENTITY_NAME_MAX),
    background: clip(background, IDENTITY_BACKGROUND_MAX),
    // Only surface a location when the model actually named one — a blank string
    // means "no city was provided", and the caller falls back to the city name.
    ...(location ? { location: clip(location, IDENTITY_LOCATION_MAX) } : {}),
  };
}
