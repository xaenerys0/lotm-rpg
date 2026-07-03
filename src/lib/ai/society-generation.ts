import type { ChatMessage } from "./types";

// ---------------------------------------------------------------------------
// AI-driven society generation — pure prompts + forgiving parsers
// ---------------------------------------------------------------------------
//
// The Society tab (Klein's Tarot Club and every pathway-appropriate equivalent)
// is AI-driven: the player's own BYOK provider invents the society's identity,
// the slate of candidates to invite, the "summoning above the gray fog" outcome
// when an invitation is extended, and the prose of a gathering. This module holds
// ONLY the pure prompt builders + forgiving parsers (the network shells are the
// `generateSociety*` functions in `client.ts`), mirroring `character-identity.ts`
// and `codex-rebuild.ts`.
//
// LAYER PURITY: this file is rules-free and lore-free — it MUST NOT import
// `@/lib/game` or `@/lib/lore`. The caller resolves the society kind label,
// pathway/role names, canon candidate SEEDS (the anti-hallucination whitelist),
// and epoch/city to plain strings and passes them in. The engine
// (`society.ts`) is the single strict validation/commit point; every parser here
// is forgiving (drop-not-throw), exactly like `parseCharacterIdentity`.

// --- Shared caps + JSON extraction ----------------------------------------

const NAME_MAX = 80;
const DESCRIPTION_MAX = 400;
const ETHOS_MAX = 300;
const MEETING_PLACE_MAX = 300;
const CODE_NAME_MAX = 80;
const REAL_NAME_MAX = 80;
const HINT_MAX = 240;
const ARC_MAX = 240;
const DOSSIER_MAX = 400;
const NARRATIVE_MAX = 1200;
const INTEL_LINE_MAX = 240;
const TRADED_NAME_MAX = 120;

/**
 * Hard cap on how many candidates a single slate may carry. Sized to hold the
 * largest canon roster (the 8-seat Tarot Club) PLUS a few invented originals, so a
 * full canon slate is never truncated by list-order when the model emits an
 * original before finishing the canon seeds.
 */
export const MAX_SOCIETY_CANDIDATES = 12;
/** Hard cap on how many intel lines a single gathering narration may carry. */
export const MAX_GATHERING_INTEL = 8;
/** How many naming facets the variety seed rotates in (anti-repetition). */
const VARIETY_MODULO = 997;

function clip(s: string, max: number): string {
  const trimmed = s.trim();
  return trimmed.length <= max ? trimmed : trimmed.slice(0, max).trimEnd();
}

/**
 * Forgiving JSON extraction shared by every parser: strip a ```json fence, parse,
 * and — on failure — retry on the first-`{`…last-`}` (or `[`…`]`) slice so prose
 * wrapping the JSON doesn't defeat it. Returns `null` when nothing parses (never
 * throws), exactly like `parseCharacterIdentity`.
 */
function extractJson(raw: string): unknown {
  let cleaned = raw.trim();
  const fence = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) cleaned = fence[1].trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    // Try an embedded object first, then an embedded array.
    for (const [open, close] of [
      ["{", "}"],
      ["[", "]"],
    ] as const) {
      const first = cleaned.indexOf(open);
      const last = cleaned.lastIndexOf(close);
      if (first !== -1 && last > first) {
        try {
          return JSON.parse(cleaned.slice(first, last + 1));
        } catch {
          // fall through
        }
      }
    }
    return null;
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function str(value: unknown): string {
  return typeof value === "string" ? value : "";
}

/** A per-call anti-repetition seed line, mirroring the identity generator. */
function varietyLine(variety?: number): string | null {
  if (variety === undefined || !Number.isFinite(variety)) return null;
  const token = Math.abs(Math.trunc(variety)) % VARIETY_MODULO;
  return `Variety token (make this generation distinct from any prior one): ${token}`;
}

// --- 1. Society identity ---------------------------------------------------

/** Resolved inputs for the society-identity generator (plain strings). */
export interface SocietyIdentityInput {
  /** The kind's canonical label ("The Tarot Club", "A Circle of Scholars"). */
  kindLabel: string;
  /** The founder's pathway display name (e.g. "Fool"). */
  pathwayName: string;
  /** The founder's current rung role name (e.g. "Seer"). */
  sequenceName: string;
  /** The era descriptor (the Fifth Epoch in normal play). Omitted → no era line. */
  epochLabel?: string;
  /** The founder's home city, for grounding. Omitted → no city line. */
  cityName?: string;
  /**
   * A short corpus flavour line for this KIND of society (the caller passes it —
   * e.g. the Tarot Club's "convene above the gray fog, known by tarot cards").
   * Omitted → the model invents freely within the kind.
   */
  canonKindReference?: string;
  /** Anti-repetition seed. */
  variety?: number;
}

/** The generated society identity. */
export interface SocietyIdentity {
  name: string;
  description: string;
  ethos: string;
  meetingPlace: string;
}

const SOCIETY_IDENTITY_SYSTEM = `You invent the identity of a secret society a Beyonder founds in a Lord of the Mysteries text RPG.

Return ONLY valid JSON of this exact shape (no prose, no markdown fences):
{"name": "string", "description": "string", "ethos": "string", "meetingPlace": "string"}

Rules:
- "name": an evocative, fitting name for this KIND of society and the founder's pathway. If a canon reference is provided, honour its spirit (e.g. the Tarot Club) but you may diverge.
- "description": 1-2 sentences on what the society is and who it draws.
- "ethos": one sentence on its guiding creed or purpose (what members gain, how they bind).
- "meetingPlace": one sentence on where and how it convenes (the fiction of the gathering — "above the gray fog", a smoke-room, a ship's hold).
- Keep it grounded and world-consistent. NEVER fabricate Beyonder-tier canon (gods, named organizations, relics) that wasn't provided. Prefer atmosphere over grand claims.`;

/** Build the society-identity chat messages from resolved inputs. */
export function buildSocietyIdentityPrompt(input: SocietyIdentityInput): ChatMessage[] {
  const lines = [
    `Kind of society: ${input.kindLabel}`,
    `Founder's pathway: ${input.pathwayName}`,
    `Founder's current role: ${input.sequenceName}`,
  ];
  if (input.cityName) lines.push(`Founder's city: ${input.cityName}`);
  if (input.epochLabel) lines.push(`Era: ${input.epochLabel}`);
  if (input.canonKindReference) {
    lines.push(
      `Canon reference for this kind (honour its spirit): ${input.canonKindReference}`,
    );
  }
  const variety = varietyLine(input.variety);
  if (variety) lines.push(variety);
  lines.push("", "Generate the society's name, description, ethos, and meeting place.");
  return [
    { role: "system", content: SOCIETY_IDENTITY_SYSTEM },
    { role: "user", content: lines.join("\n") },
  ];
}

/**
 * Forgiving parse of the society identity — requires a non-empty `name`; defaults
 * the prose fields to "" and clamps all to their caps. Returns `null` when no
 * usable name (the `parseCharacterIdentity` shape).
 */
export function parseSocietyIdentity(raw: string): SocietyIdentity | null {
  const parsed = asRecord(extractJson(raw));
  if (!parsed) return null;
  const name = clip(str(parsed.name), NAME_MAX);
  if (name === "") return null;
  return {
    name,
    description: clip(str(parsed.description), DESCRIPTION_MAX),
    ethos: clip(str(parsed.ethos), ETHOS_MAX),
    meetingPlace: clip(str(parsed.meetingPlace), MEETING_PLACE_MAX),
  };
}

// --- 2. Candidate slate ----------------------------------------------------

/** A canon candidate seed the caller passes as grounding (plain strings). */
export interface CanonSeedLite {
  canonId: string;
  codeName: string;
  realName: string;
  roleHint: string;
}

/** Resolved inputs for the candidate-slate generator. */
export interface SocietyCandidatesInput {
  societyName: string;
  kindLabel: string;
  pathwayName: string;
  epochLabel?: string;
  cityName?: string;
  /** The founder's numeric sequence, for context. */
  sequenceLevel: number;
  /** Corpus-verified canon seeds to enrich (may be empty). */
  canonSeeds: CanonSeedLite[];
  /** How many wholly-INVENTED original NPCs to add beyond the canon seeds. */
  inventCount: number;
  /** Anti-repetition seed. */
  variety?: number;
}

/** One generated invitation candidate (transient — not persisted until accepted). */
export interface SocietyCandidate {
  origin: "canon" | "original";
  /** Echoed back for a canon candidate ONLY; the engine re-whitelists it. */
  canonId?: string;
  codeName: string;
  realName?: string;
  /** Dossier prose → the committed member's `pathwayHintProse`. */
  pathwayHint: string;
  /** Dossier prose → the committed member's `arcProse`. */
  arc: string;
  /** A one-to-two sentence "why they might answer the call now". */
  dossier: string;
}

const SOCIETY_CANDIDATES_SYSTEM = `You propose a SLATE of Beyonders a secret society might invite in a Lord of the Mysteries text RPG.

Return ONLY valid JSON of this exact shape (no prose, no markdown fences):
{"candidates": [{"origin": "canon"|"original", "canonId": "string (canon only)", "codeName": "string", "realName": "string", "pathwayHint": "string", "arc": "string", "dossier": "string"}]}

Rules:
- Include EVERY provided canon seed as a candidate with origin "canon" and its EXACT canonId and codeName — you may enrich its realName, pathwayHint, arc, and dossier, but never invent a NEW canonId.
- Then ADD the requested number of ORIGINAL candidates (origin "original", NO canonId) — believable Beyonders who fit this society and era. Give each a fitting codeName, an optional realName, a short "pathwayHint" (what their Beyonder nature hints at), an "arc" (a private matter they carry), and a one-to-two-sentence "dossier" (why they might answer the call now).
- Keep originals grounded and world-consistent; NEVER fabricate Beyonder-tier canon (real gods, named canon organizations/relics) for an original.
- Write the pathwayHint and arc in a form that reads after "This one …" and "They …" respectively (third person).`;

/** Build the candidate-slate chat messages from resolved inputs. */
export function buildSocietyCandidatesPrompt(
  input: SocietyCandidatesInput,
): ChatMessage[] {
  const lines = [
    `Society: ${input.societyName} (${input.kindLabel})`,
    `Founder's pathway: ${input.pathwayName} (Sequence ${input.sequenceLevel})`,
  ];
  if (input.cityName) lines.push(`City: ${input.cityName}`);
  if (input.epochLabel) lines.push(`Era: ${input.epochLabel}`);
  if (input.canonSeeds.length > 0) {
    lines.push(
      "Canon seeds to INCLUDE (enrich but keep canonId + codeName exact):",
      ...input.canonSeeds.map(
        (seed) =>
          `- canonId=${seed.canonId} | ${seed.codeName} (${seed.realName}) — ${seed.roleHint}`,
      ),
    );
  } else {
    lines.push("Canon seeds: none — invent the whole slate.");
  }
  lines.push(`Original candidates to invent: ${Math.max(0, input.inventCount)}`);
  const variety = varietyLine(input.variety);
  if (variety) lines.push(variety);
  lines.push("", "Generate the candidate slate.");
  return [
    { role: "system", content: SOCIETY_CANDIDATES_SYSTEM },
    { role: "user", content: lines.join("\n") },
  ];
}

/**
 * Forgiving parse of a candidate slate — accepts a bare array or `{candidates:[…]}`,
 * drops items with no code name, carries `canonId` only for a canon-origin item,
 * clamps every field, and caps the count. Never throws → `[]`.
 */
export function parseSocietyCandidates(raw: string): SocietyCandidate[] {
  const parsed = extractJson(raw);
  const rec = asRecord(parsed);
  const list: unknown[] | null = Array.isArray(parsed)
    ? parsed
    : Array.isArray(rec?.candidates)
      ? (rec.candidates as unknown[])
      : null;
  if (!list) return [];

  const out: SocietyCandidate[] = [];
  for (const entry of list) {
    if (out.length >= MAX_SOCIETY_CANDIDATES) break;
    const o = asRecord(entry);
    if (!o) continue;
    const codeName = clip(str(o.codeName), CODE_NAME_MAX);
    if (codeName === "") continue;
    const origin: "canon" | "original" = o.origin === "canon" ? "canon" : "original";
    const canonId = origin === "canon" ? clip(str(o.canonId), NAME_MAX) : "";
    const realName = clip(str(o.realName), REAL_NAME_MAX);
    out.push({
      origin,
      ...(canonId ? { canonId } : {}),
      codeName,
      ...(realName ? { realName } : {}),
      pathwayHint: clip(str(o.pathwayHint), HINT_MAX),
      arc: clip(str(o.arc), ARC_MAX),
      dossier: clip(str(o.dossier), DOSSIER_MAX),
    });
  }
  return out;
}

// --- 3. Invitation outcome -------------------------------------------------

/** Resolved inputs for the "summoning above the gray fog" outcome. */
export interface InvitationOutcomeInput {
  societyName: string;
  kindLabel: string;
  /** The society's meeting-place fiction, if it has one. */
  meetingPlace?: string;
  /** The inviter's current role name, for the "reaching out" framing. */
  inviterRoleName: string;
  candidate: {
    codeName: string;
    realName?: string;
    dossier: string;
    origin: string;
  };
}

/** The generated invitation result. */
export interface InvitationOutcome {
  accepted: boolean;
  narrative: string;
}

const INVITATION_SYSTEM = `You narrate a secret society reaching out to summon a distant Beyonder to its table in a Lord of the Mysteries text RPG — the "extending an invitation" beat (in canon, the Fool reaches from above the gray fog to pull a Beyonder in).

Return ONLY valid JSON of this exact shape (no prose, no markdown fences):
{"accepted": true|false, "narrative": "string"}

Rules:
- "accepted": whether the candidate answers the call and takes a seat. Most invitations succeed, but a wary or ill-disposed candidate may decline — decide from the candidate's dossier and nature.
- "narrative": 2-4 sentences narrating the summoning across the fog and the candidate's response, in an atmospheric, close third person.
- Do NOT resolve any mechanics or state — only the fiction of the invitation.`;

/** Build the invitation-outcome chat messages. */
export function buildInvitationOutcomePrompt(
  input: InvitationOutcomeInput,
): ChatMessage[] {
  const who = input.candidate.realName
    ? `${input.candidate.codeName} (${input.candidate.realName})`
    : input.candidate.codeName;
  const lines = [
    `Society: ${input.societyName} (${input.kindLabel})`,
    input.meetingPlace ? `Meeting place: ${input.meetingPlace}` : null,
    `You reach out as: ${input.inviterRoleName}`,
    `Candidate: ${who} [${input.candidate.origin}]`,
    `Candidate dossier: ${input.candidate.dossier || "(unknown)"}`,
    "",
    "Narrate the summoning and whether they accept.",
  ].filter((line): line is string => line !== null);
  return [
    { role: "system", content: INVITATION_SYSTEM },
    { role: "user", content: lines.join("\n") },
  ];
}

/**
 * Forgiving parse of the invitation outcome — requires a non-empty `narrative`;
 * `accepted` defaults to `true` (an invitation succeeds unless the model clearly
 * says otherwise). Returns `null` when there is no usable narrative.
 */
export function parseInvitationOutcome(raw: string): InvitationOutcome | null {
  const parsed = asRecord(extractJson(raw));
  if (!parsed) return null;
  const narrative = clip(str(parsed.narrative), NARRATIVE_MAX);
  if (narrative === "") return null;
  return {
    accepted: parsed.accepted === false ? false : true,
    narrative,
  };
}

// --- 4. Gathering narration ------------------------------------------------

/** Resolved inputs for a gathering's narration (the engine decided the mechanics). */
export interface GatheringInput {
  societyName: string;
  kindLabel: string;
  meetingPlace?: string;
  members: {
    codeName: string;
    pathwayHint: string;
    arc: string;
    disposition: number;
  }[];
  /** The code names the engine decided share intel this gathering (in order). */
  sharerCodeNames: string[];
  /** Whether the engine granted a traded item this gathering. */
  itemTraded: boolean;
  locationName?: string;
  epochLabel?: string;
}

/** The generated gathering prose (overlaid onto the deterministic outcome). */
export interface GatheringNarration {
  narrative: string;
  /** One intel line per sharer, in order. */
  intel: string[];
  /** A name for the traded item, only when the engine granted one. */
  tradedItemName?: string;
}

const GATHERING_SYSTEM = `You narrate a secret society's gathering in a Lord of the Mysteries text RPG. The engine has ALREADY decided the mechanics (who shares intel, whether an item is traded) — you only supply the prose.

Return ONLY valid JSON of this exact shape (no prose, no markdown fences):
{"narrative": "string", "intel": ["string", ...], "tradedItemName": "string"}

Rules:
- "narrative": 2-4 sentences setting the scene of the gathering (the table, the hidden faces, the mood).
- "intel": EXACTLY one line per member listed as sharing, in the SAME order — each a concrete, actionable lead or warning that member brings (a place, a name, a rumour). Do not add or omit lines.
- "tradedItemName": the name of the single item traded across the table this gathering — ONLY if told an item was traded; otherwise omit it.
- Keep it grounded; NEVER fabricate Beyonder-tier canon (gods, named organizations, relics).`;

/** Build the gathering-narration chat messages. */
export function buildGatheringPrompt(input: GatheringInput): ChatMessage[] {
  const lines = [
    `Society: ${input.societyName} (${input.kindLabel})`,
    input.meetingPlace ? `Meeting place: ${input.meetingPlace}` : null,
    input.locationName ? `The founder is at: ${input.locationName}` : null,
    input.epochLabel ? `Era: ${input.epochLabel}` : null,
    "Members at the table:",
    ...input.members.map(
      (m) =>
        `- ${m.codeName}: this one ${m.pathwayHint || "keeps their nature hidden"}; they ${
          m.arc || "carry a private matter"
        } (trust ${m.disposition})`,
    ),
    input.sharerCodeNames.length > 0
      ? `Members sharing intel this gathering (write one intel line each, in this order): ${input.sharerCodeNames.join(", ")}`
      : "No member shares intel this gathering (return an empty intel array).",
    input.itemTraded
      ? "An item is traded across the table — name it in tradedItemName."
      : "No item is traded this gathering — omit tradedItemName.",
    "",
    "Narrate the gathering.",
  ].filter((line): line is string => line !== null);
  return [
    { role: "system", content: GATHERING_SYSTEM },
    { role: "user", content: lines.join("\n") },
  ];
}

/**
 * Forgiving parse of the gathering narration — requires a non-empty `narrative`;
 * `intel` is coerced to a clamped string array (capped), `tradedItemName` carried
 * only when a non-blank string. Returns `null` when there is no usable narrative.
 *
 * POSITIONAL: `intel[i]` corresponds to the i-th member the engine decided shares
 * (`applyGatheringNarration` overlays it onto `facts[i]`), so a non-string/blank
 * entry is preserved as `""` rather than filtered out — dropping it would shift
 * every later line onto the wrong member. The overlay keeps the engine's template
 * fact for a `""` slot.
 */
export function parseGatheringNarration(raw: string): GatheringNarration | null {
  const parsed = asRecord(extractJson(raw));
  if (!parsed) return null;
  const narrative = clip(str(parsed.narrative), NARRATIVE_MAX);
  if (narrative === "") return null;
  const intel = Array.isArray(parsed.intel)
    ? parsed.intel
        .slice(0, MAX_GATHERING_INTEL)
        .map((line) => (typeof line === "string" ? clip(line, INTEL_LINE_MAX) : ""))
    : [];
  const tradedItemName = clip(str(parsed.tradedItemName), TRADED_NAME_MAX);
  return {
    narrative,
    intel,
    ...(tradedItemName ? { tradedItemName } : {}),
  };
}
