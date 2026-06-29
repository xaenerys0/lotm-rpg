import type { Item, ValidationResult, Violation } from "@/lib/types/rules";
import type { AIResponse, CodexUpdateInput } from "./types";
import { createMalformedOutputError } from "./errors";

// Residual free-form sanity bounds (issue #95): tightened to ±5 — the engine
// now owns the bulk of per-turn sanity via `sanityEventTags`, leaving the AI
// only a small narrative remainder.
const SANITY_IMPACT_MIN = -5;
const SANITY_IMPACT_MAX = 5;
const MAX_CHOICES = 6;
// Exported so `response-schema.ts` reuses the exact same lists in its structured-
// output enums rather than re-declaring them (single source of truth).
export const VALID_CHOICE_TYPES = ["action", "dialogue", "investigation", "ritual"];
// The sanity event tags the AI may emit (issue #95); unknown tags are dropped.
export const VALID_SANITY_EVENT_TAGS = [
  "rest",
  "human-connection",
  "routine",
  "ability-use",
  "horror-encounter",
];
const VALID_ITEM_CATEGORIES = [
  "main-ingredient",
  "supplementary-ingredient",
  "potion-formula",
  "mundane",
  "uniqueness",
];
// At most this many Codex deltas are carried from one turn (history-context
// Codex). Deltas are meant to be the few entities introduced/changed this turn,
// so a flood is a sign of a misbehaving narrator — cap it to keep output cost
// bounded. The game-layer `applyCodexUpdates` is the single real validation
// point (kind/importance whitelist + length caps); this is just a loose,
// drop-not-throw boundary carry (like `journalEntry`).
const MAX_CODEX_UPDATES = 6;

/**
 * Guarantee every choice has a unique, non-empty id. Ids double as React keys —
 * and, in the game loop, the handle used to recover the selected choice — so an
 * empty or duplicate id causes key collisions that render blank/omitted choices
 * or resolve the wrong option. Falls back to a stable index-based id whenever a
 * model omits or repeats one. Mutates each choice's id in place and returns the
 * same array. Shared by the main response parser and the prologue parser so both
 * AI paths get the same guarantee.
 */
export function ensureUniqueChoiceIds<T extends { id: string }>(choices: T[]): T[] {
  const seen = new Set<string>();
  choices.forEach((choice, i) => {
    let id = choice.id.trim();
    if (id === "" || seen.has(id)) {
      // Index-based fallback, bumped until unique — `choice-${i}` itself can
      // collide with another choice's LITERAL id (e.g. a real "choice-1"), so
      // re-check against `seen` instead of trusting the index alone.
      let n = i;
      do {
        id = `choice-${n}`;
        n++;
      } while (seen.has(id));
    }
    seen.add(id);
    choice.id = id;
  });
  return choices;
}

export function parseAIResponse(raw: string): AIResponse {
  let cleaned = raw.trim();

  const jsonBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonBlockMatch) {
    cleaned = jsonBlockMatch[1].trim();
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    // Forgiving fallback: models sometimes wrap the JSON in a sentence or stray
    // tokens. Try the outermost {...} span before giving up.
    const first = cleaned.indexOf("{");
    const last = cleaned.lastIndexOf("}");
    if (first === -1 || last <= first) {
      throw createMalformedOutputError(raw);
    }
    try {
      parsed = JSON.parse(cleaned.slice(first, last + 1));
    } catch {
      throw createMalformedOutputError(raw);
    }
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw createMalformedOutputError(raw);
  }

  const obj = parsed as Record<string, unknown>;

  if (typeof obj.narrative !== "string" || obj.narrative.length === 0) {
    throw createMalformedOutputError(raw);
  }

  const response: AIResponse = {
    narrative: obj.narrative,
  };

  if (obj.choices !== undefined) {
    if (!Array.isArray(obj.choices)) {
      throw createMalformedOutputError(raw);
    }
    response.choices = ensureUniqueChoiceIds(
      obj.choices.map((c: unknown) => {
        const choice = c as Record<string, unknown>;
        return {
          id: String(choice.id ?? ""),
          text: String(choice.text ?? ""),
          type: VALID_CHOICE_TYPES.includes(String(choice.type))
            ? (String(choice.type) as "action" | "dialogue" | "investigation" | "ritual")
            : "action",
        };
      }),
    );
  }

  if (obj.worldStateChanges !== undefined) {
    if (!Array.isArray(obj.worldStateChanges)) {
      throw createMalformedOutputError(raw);
    }
    response.worldStateChanges = obj.worldStateChanges.map((s: unknown) => {
      const change = s as Record<string, unknown>;
      return {
        field: String(change.field ?? ""),
        oldValue: change.oldValue,
        newValue: change.newValue,
        reason: String(change.reason ?? ""),
        // Against-the-will relocation code (issue #101) — carried only when the
        // AI supplied a string; the engine narrows it to a known cause.
        ...(typeof change.involuntaryCause === "string"
          ? { involuntaryCause: change.involuntaryCause }
          : {}),
      };
    });
  }

  if (obj.actingEvaluation !== undefined && obj.actingEvaluation !== null) {
    const eval_ = obj.actingEvaluation as Record<string, unknown>;
    const rawAlignment = Number(eval_.alignment ?? 0);
    response.actingEvaluation = {
      alignment: Number.isFinite(rawAlignment) ? rawAlignment : 0,
      reasoning: String(eval_.reasoning ?? ""),
    };
  }

  if (obj.sanityImpact !== undefined && obj.sanityImpact !== null) {
    const rawImpact = Number(obj.sanityImpact);
    if (Number.isFinite(rawImpact)) {
      response.sanityImpact = rawImpact;
    }
  }

  // Engine-scored sanity event tags (issue #95) — normalized to the known set,
  // dropping unknowns rather than throwing (loose channel, like journalEntry).
  // The empty array is dropped so the field stays absent when nothing fired.
  if (Array.isArray(obj.sanityEventTags)) {
    const tags = obj.sanityEventTags
      .map((t: unknown) => String(t))
      .filter((t: string) => VALID_SANITY_EVENT_TAGS.includes(t));
    if (tags.length > 0) {
      response.sanityEventTags = tags;
    }
  }

  // Acting-method taught flag (issue #95) — carried only when literally true;
  // any other value leaves the field absent (drop-not-throw).
  if (obj.actingMethodTaught === true) {
    response.actingMethodTaught = true;
  }

  // Pursuers (issue #101) — the narrator's channel for who is hunting the
  // character. Normalize to clean, de-duplicated, non-empty names; an empty
  // result is dropped (drop-not-throw, like sanityEventTags).
  if (Array.isArray(obj.pursuers)) {
    const names = Array.from(
      new Set(
        obj.pursuers
          .map((n: unknown) => String(n).trim())
          .filter((n: string) => n !== ""),
      ),
    );
    if (names.length > 0) {
      response.pursuers = names;
    }
  }

  if (obj.itemsDiscovered !== undefined) {
    if (!Array.isArray(obj.itemsDiscovered)) {
      throw createMalformedOutputError(raw);
    }
    response.itemsDiscovered = obj.itemsDiscovered.map((i: unknown) => {
      const item = i as Record<string, unknown>;
      return {
        name: String(item.name ?? ""),
        description: String(item.description ?? ""),
        category: VALID_ITEM_CATEGORIES.includes(String(item.category))
          ? (String(item.category) as Item["category"])
          : "mundane",
      };
    });
  }

  // Durable rolling summary — stored trimmed and only when non-blank, so a turn
  // that omits it leaves the prior synopsis untouched. Length-capping is owned
  // solely by the persistence boundary (`addTurn`), the only path into memory.
  if (typeof obj.runningSummary === "string") {
    const trimmed = obj.runningSummary.trim();
    if (trimmed !== "") {
      response.runningSummary = trimmed;
    }
  }

  // Story-consistency Codex deltas (history-context Codex) — carried through
  // loosely, like `journalEntry`: keep only well-formed items (string kind +
  // non-empty name), coerce optional fields, drop the rest, and cap the count.
  // `applyCodexUpdates` (@/lib/game/codex) is the single real validation point.
  if (Array.isArray(obj.codexUpdates)) {
    const updates = obj.codexUpdates
      .filter(
        (u: unknown): u is Record<string, unknown> =>
          typeof u === "object" && u !== null && !Array.isArray(u),
      )
      .map((u) => {
        const update: CodexUpdateInput = {
          kind: String(u.kind ?? ""),
          name: String(u.name ?? "").trim(),
        };
        if (typeof u.status === "string") update.status = u.status.trim();
        if (typeof u.importance === "string") update.importance = u.importance.trim();
        if (typeof u.note === "string") update.note = u.note.trim();
        if (u.resolved === true) update.resolved = true;
        if (Array.isArray(u.aliases)) {
          const aliases = u.aliases
            .map((a: unknown) => String(a).trim())
            .filter((a: string) => a !== "");
          if (aliases.length > 0) update.aliases = aliases;
        }
        return update;
      })
      .filter((u) => u.kind !== "" && u.name !== "")
      .slice(0, MAX_CODEX_UPDATES);
    if (updates.length > 0) {
      response.codexUpdates = updates;
    }
  }

  // Currency found/lost in the fiction (issue #16 follow-up) — whitelisted as a
  // finite number; the engine clamps it to the per-turn cap before applying.
  if (obj.fundsDiscovered !== undefined && obj.fundsDiscovered !== null) {
    const rawFunds = Number(obj.fundsDiscovered);
    if (Number.isFinite(rawFunds)) {
      response.fundsDiscovered = rawFunds;
    }
  }

  // Optional true-self change proposal (character-info storage) — whitelisted
  // through; `validateSelfChangeProposal` is the single validation point and the
  // change is never applied without an explicit player confirm.
  if (typeof obj.proposedSelfChange === "object" && obj.proposedSelfChange !== null) {
    const p = obj.proposedSelfChange as Record<string, unknown>;
    response.proposedSelfChange = {
      field: String(p.field ?? ""),
      value: String(p.value ?? ""),
      ...(typeof p.reason === "string" ? { reason: p.reason } : {}),
    };
  }

  return response;
}

export function validateAIResponse(response: AIResponse): ValidationResult {
  const violations: Violation[] = [];

  if (
    response.sanityImpact !== undefined &&
    (response.sanityImpact < SANITY_IMPACT_MIN ||
      response.sanityImpact > SANITY_IMPACT_MAX)
  ) {
    violations.push({
      law: "conservation",
      message: `Sanity impact ${response.sanityImpact} out of range [${SANITY_IMPACT_MIN}, ${SANITY_IMPACT_MAX}]`,
    });
  }

  if (response.choices && response.choices.length > MAX_CHOICES) {
    violations.push({
      law: "conservation",
      message: `Too many choices: ${response.choices.length} (max ${MAX_CHOICES})`,
    });
  }

  if (response.choices) {
    for (const choice of response.choices) {
      if (!choice.text.trim()) {
        violations.push({
          law: "conservation",
          message: `Choice missing text: id="${choice.id}"`,
        });
      }
    }
  }

  if (response.actingEvaluation) {
    const { alignment } = response.actingEvaluation;
    if (alignment < 0 || alignment > 1) {
      violations.push({
        law: "conservation",
        message: `Acting alignment ${alignment} out of range [0, 1]`,
      });
    }
  }

  if (response.itemsDiscovered) {
    for (const item of response.itemsDiscovered) {
      if (!item.name || !item.description) {
        violations.push({
          law: "conservation",
          message: `Item missing required fields: name="${item.name}", description="${item.description}"`,
        });
      }
    }
  }

  if (response.worldStateChanges) {
    for (const change of response.worldStateChanges) {
      if (!change.field || !change.reason) {
        violations.push({
          law: "conservation",
          message: `State change missing required fields: field="${change.field}", reason="${change.reason}"`,
        });
      }
    }
  }

  return {
    valid: violations.length === 0,
    violations,
  };
}

export function sanitizeAIResponse(response: AIResponse): AIResponse {
  const sanitized = structuredClone(response);

  if (
    sanitized.sanityImpact !== undefined &&
    (sanitized.sanityImpact < SANITY_IMPACT_MIN ||
      sanitized.sanityImpact > SANITY_IMPACT_MAX)
  ) {
    sanitized.sanityImpact = Math.max(
      SANITY_IMPACT_MIN,
      Math.min(SANITY_IMPACT_MAX, sanitized.sanityImpact),
    );
  }

  if (sanitized.choices) {
    // Drop blank choices — an empty label renders a nameless button (WCAG) and
    // is the "blank choice" symptom; then cap the count.
    sanitized.choices = sanitized.choices.filter((c) => c.text.trim() !== "");
    if (sanitized.choices.length > MAX_CHOICES) {
      sanitized.choices = sanitized.choices.slice(0, MAX_CHOICES);
    }
  }

  if (sanitized.actingEvaluation) {
    sanitized.actingEvaluation.alignment = Math.max(
      0,
      Math.min(1, sanitized.actingEvaluation.alignment),
    );
  }

  if (sanitized.itemsDiscovered) {
    sanitized.itemsDiscovered = sanitized.itemsDiscovered.filter(
      (item) => item.name && item.description,
    );
  }

  if (sanitized.worldStateChanges) {
    sanitized.worldStateChanges = sanitized.worldStateChanges.filter(
      (change) => change.field && change.reason,
    );
  }

  return sanitized;
}
