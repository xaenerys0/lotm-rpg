/**
 * JSON Schema for the narrator's per-turn response (issue #201, item 3).
 *
 * Anthropic supports server-side structured outputs (`output_config.format`): the
 * API enforces this schema and returns a schema-valid object, removing the need
 * for the prose system directive + reactive corrective-retry loop on that path.
 * Kept co-located with `parseAIResponse` (`validation.ts`) so the two stay in
 * sync — it mirrors the prose `## Output Format` schema in `buildSystemPrompt`.
 *
 * Honours Anthropic's structured-output constraints:
 * - `additionalProperties: false` on every object.
 * - `enum`s for the fixed-value fields.
 * - NO numeric range / string-length constraints (unsupported). `sanityImpact`
 *   (±5) and `actingEvaluation.alignment` (0–1) stay clamped client-side in
 *   `validation.ts` — they always have been.
 * - `required` is kept MINIMAL (`narrative` only) so the parser's existing
 *   drop-and-default tolerance is preserved and the model is never forced to
 *   emit a field it has nothing for.
 *
 * Arbitrary world-state values (`oldValue`/`newValue`) are modelled as a scalar
 * union — every world-state change the prompt asks for is a scalar (a location
 * string, a flag, a count), and a strict schema can't express "any".
 *
 * The choice-type and sanity-tag enums REUSE the validation constants
 * (`VALID_CHOICE_TYPES` / `VALID_SANITY_EVENT_TAGS`) so the schema and the parser
 * can't drift. The item-category enum is the deliberate `mundane`/`uniqueness`
 * SUBSET of `VALID_ITEM_CATEGORIES` (the narrator may not mint reagents/formulas).
 */
import { VALID_CHOICE_TYPES, VALID_SANITY_EVENT_TAGS } from "./validation";

/** A scalar value for world-state old/new fields (no arbitrary objects/arrays). */
const SCALAR_VALUE = {
  anyOf: [{ type: "string" }, { type: "number" }, { type: "boolean" }, { type: "null" }],
} as const;

export const AI_RESPONSE_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["narrative"],
  properties: {
    narrative: { type: "string" },
    choices: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "text", "type"],
        properties: {
          id: { type: "string" },
          text: { type: "string" },
          type: {
            type: "string",
            enum: [...VALID_CHOICE_TYPES],
          },
        },
      },
    },
    worldStateChanges: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["field", "newValue", "reason"],
        properties: {
          field: { type: "string" },
          oldValue: SCALAR_VALUE,
          newValue: SCALAR_VALUE,
          reason: { type: "string" },
          involuntaryCause: {
            type: "string",
            enum: ["abduction", "forced-passage", "capability-gated-teleport"],
          },
        },
      },
    },
    actingEvaluation: {
      type: "object",
      additionalProperties: false,
      required: ["alignment", "reasoning"],
      properties: {
        alignment: { type: "number" },
        reasoning: { type: "string" },
      },
    },
    sanityImpact: { type: "number" },
    sanityEventTags: {
      type: "array",
      items: {
        type: "string",
        enum: [...VALID_SANITY_EVENT_TAGS],
      },
    },
    actingMethodTaught: { type: "boolean" },
    itemsDiscovered: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "description", "category"],
        properties: {
          name: { type: "string" },
          description: { type: "string" },
          // The narrator may only mint ordinary loot ("mundane") or the singular
          // pathway artifact ("uniqueness"); reagent/formula categories are
          // engine-owned and stripped, so they are not offered here.
          category: { type: "string", enum: ["mundane", "uniqueness"] },
        },
      },
    },
    fundsDiscovered: { type: "number" },
    journalEntry: {
      type: "object",
      additionalProperties: false,
      required: ["summary", "eventType"],
      properties: {
        summary: { type: "string" },
        eventType: {
          type: "string",
          enum: [
            "advancement",
            "major-event",
            "npc-encounter",
            "discovery",
            "timeline-divergence",
            "death",
            "combat",
          ],
        },
      },
    },
    proposedSelfChange: {
      type: "object",
      additionalProperties: false,
      required: ["field", "value", "reason"],
      properties: {
        field: {
          type: "string",
          enum: ["name", "appearance", "gender", "pronouns", "epithet", "age", "marks"],
        },
        value: { type: "string" },
        reason: { type: "string" },
      },
    },
    pursuers: {
      type: "array",
      items: { type: "string" },
    },
    codexUpdates: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["kind", "name", "status"],
        properties: {
          kind: {
            type: "string",
            enum: ["person", "location", "object", "group", "thread"],
          },
          name: { type: "string" },
          status: { type: "string" },
          importance: { type: "string", enum: ["pivotal", "standard"] },
          resolved: { type: "boolean" },
        },
      },
    },
    runningSummary: { type: "string" },
  },
} as const;
