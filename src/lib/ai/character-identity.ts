import type { ChatMessage } from "./types";

// ---------------------------------------------------------------------------
// AI test-character identity (name + background) — pure prompt + parse
// ---------------------------------------------------------------------------
//
// The dev/admin test-utilities surface forges throwaway characters; rather than
// canned text, it asks the player's own BYOK provider to invent a NAME and a
// short BACKGROUND. The name follows the naming register of a chosen Lord of the
// Mysteries region (Loen = Victorian English, Intis = French with the "de"
// particle, Feysac = Germanic/Norse, …) — the registers below are corpus-grounded
// (the wiki per-nation character rosters + the curated `@/lib/lore` city-tagged
// NPCs), not invented. Pure here (prompt builder + forgiving parser, mirroring
// `codex-rebuild.ts`); the network shell is `generateCharacterIdentity` in
// `client.ts`. The AI layer stays rules-free, so the caller resolves the pathway
// and sequence NAMES (via `@/lib/rules`) and passes them in as plain strings.

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
  },
  intis: {
    label: "Intis Republic (Trier)",
    directive:
      "French: French given names and surnames, frequently carrying the noble particle 'de' (e.g. '… de Lacourt').",
    examples:
      "Angoulême de François, Valentine de Lacourt, Plessy Descartes, Séraphine, Clémence Athana",
  },
  feysac: {
    label: "Feysac Empire",
    directive:
      "Germanic / Norse: hard, consonantal given names and house-surnames with Germanic roots, often ending in -horn or -on.",
    examples: "Awatoma Einhorn, Egor Einhorn, Larrion, Ozil, Snarner",
  },
  rorsted: {
    label: "Rorsted Archipelago (Bayam, the Sonia Sea)",
    directive:
      "A colonial port mix: settlers carry Loen-English or French surnames, while native islanders carry SHORT, invented single names (not a real-world language).",
    examples:
      "Jahn Kottman, Danitz Dubois (settlers); Kalat, Ralph, Kalvetua (islanders)",
  },
  forsaken: {
    label: "The Forsaken Land (City of Silver / Moon City)",
    directive:
      "Sparse and archaic: single or short two-part names in a mythic register; titles (Silver Knight, High Priest) carry status.",
    examples: "Colin Iliad, Darc Regence, Waite Chirmont, Nim, Aurmir",
  },
  balam: {
    label: "Southern Continent (Balam)",
    directive:
      "Iberian / Latin colonial: Spanish or Portuguese given names and surnames, sometimes the 'Don' honorific; the imperial death-line surname is Eggers.",
    examples: "Sia Palenque Eggers, Camus Castiya, Fernandez Oro, Maysanchez, Montserrat",
  },
};

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
}

/** The generated identity. */
export interface CharacterIdentity {
  name: string;
  background: string;
}

/** Upper bounds (match the player background cap so the result is reusable). */
export const IDENTITY_NAME_MAX = 80;
export const IDENTITY_BACKGROUND_MAX = 1200;

const IDENTITY_SYSTEM = `You invent a TEST CHARACTER for a Lord of the Mysteries text RPG: a name and a short third-person background.

Return ONLY valid JSON of this exact shape (no prose, no markdown fences):
{"name": "string", "background": "string"}

Rules:
- "name": a believable character name that fits the REGION's naming convention (provided in the request). Use the convention's structure (given + surname, particles, single names) but INVENT a fresh person — never reuse a famous canon protagonist's full name (e.g. Klein Moretti, Audrey Hall).
- "background": 2-4 sentences (about 90 words or fewer), third person, grounding the character in their pathway role and region with mundane, world-consistent texture. NEVER claim a higher Sequence or tier than the one given, and NEVER fabricate Beyonder-tier canon (gods, organizations, named relics). Prefer ordinary, evocative detail over grand claims.`;

/** Build the identity chat messages from the resolved inputs. */
export function buildCharacterIdentityPrompt(
  input: CharacterIdentityInput,
): ChatMessage[] {
  const region = CHARACTER_REGIONS[input.region] ?? CHARACTER_REGIONS.loen;
  const user = [
    `Region: ${region.label}`,
    `Naming convention: ${region.directive}`,
    `Canon names in this register (STYLE reference only — do NOT reuse): ${region.examples}`,
    `Pathway: ${input.pathwayName}`,
    `Current role: ${input.sequenceName} (Sequence ${input.sequenceLevel})`,
    "",
    "Generate the name and background.",
  ].join("\n");
  return [
    { role: "system", content: IDENTITY_SYSTEM },
    { role: "user", content: user },
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
  return {
    name: clip(name, IDENTITY_NAME_MAX),
    background: clip(background, IDENTITY_BACKGROUND_MAX),
  };
}
