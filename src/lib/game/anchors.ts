// ---------------------------------------------------------------------------
// Anchors system (issues #35, #25)
// ---------------------------------------------------------------------------
//
// Anchors are the tier-gated stabilising resource that opposes the godhood
// pressure a high-Sequence Beyonder carries. In Lord of the Mysteries canon an
// Anchor (a meaningful object, a consecrated place, or — strongest of all — a
// congregation of believers) fixes the Beyonder's self-image against the mental
// imprint of their Sequence's mythical creature form. Rising Sequence = rising
// mythical pressure; an Anchor of matching strength holds the self in place.
// The balance is inherently unstable and drifts, and anchors can be stolen or
// destroyed — at which point the Beyonder slides toward losing control and
// being assimilated by the mythical form (a Rampager monster).
//
// Design doc: docs/anchors-design.md (issue #35). This engine is PURE and
// ADDITIVE: it computes a per-turn sanity drain (`anchorPressure`) and a
// high-risk flag (`anchorHighRisk`) that the game loop threads into the EXISTING
// sanity engine (`applySanityImpact`) and death/failure engine
// (`evaluateFailure` / `evaluateLossOfControl`). It never duplicates those
// consequence ladders.
//
// Integration point (the game loop is NOT modified by this module):
//   const drain = anchorPressure(session.anchorState ?? emptyAnchorState(),
//                                gameState.sequenceLevel);
//   // fold `drain` into the same sanity-delta accumulation used for
//   // sanityDelta(event), then clamp via applySanityImpact(...).
//   const highRisk = anchorHighRisk(session.anchorState ?? emptyAnchorState(),
//                                   gameState.sequenceLevel);
//   // thread `highRisk` into evaluateFailure({ ..., highRisk }).

// ─── Types ───────────────────────────────────────────────────────────

export type AnchorKind = "object" | "place" | "congregation";

export interface Anchor {
  id: string;
  kind: AnchorKind;
  name: string;
  /** 0 (broken) … 100 (pristine). The anchor's current holding strength. */
  integrity: number;
}

export interface AnchorState {
  anchors: Anchor[];
}

export const ANCHOR_INTEGRITY_MIN = 0;
export const ANCHOR_INTEGRITY_MAX = 100;

const ANCHOR_KINDS: readonly AnchorKind[] = ["object", "place", "congregation"];

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function emptyAnchorState(): AnchorState {
  return { anchors: [] };
}

// ─── Tier gating ─────────────────────────────────────────────────────

/**
 * Anchors are MANDATORY from Sequence 2 (Angels and Kings of Angels): canon
 * "From Sequence 2, one had to rely on external Anchors to maintain a balance."
 */
export function requiresAnchors(sequenceLevel: number): boolean {
  return sequenceLevel <= 2;
}

/**
 * Anchors become RELEVANT at Saint (Sequence 4–3): the incomplete mythical form
 * begins to tug. Below Saint (Seq ≥ 5) there is no anchor pressure at all.
 */
export function anchorsRelevant(sequenceLevel: number): boolean {
  return sequenceLevel <= 4;
}

// ─── Support arithmetic ──────────────────────────────────────────────

/**
 * Per-kind weighting of an anchor's integrity. A congregation of believers is
 * the strongest anchor ("the faith of the mass"); a consecrated place is
 * middling; a significant personal object is the weakest — matching canon, where
 * Saints lean on meaningful marks while Angels need believers.
 */
export const ANCHOR_KIND_WEIGHT: Record<AnchorKind, number> = {
  object: 0.5,
  place: 0.75,
  congregation: 1,
};

/** Sum of integrity × kind-weight across all anchors. */
export function effectiveSupport(state: AnchorState): number {
  return state.anchors.reduce(
    (sum, a) => sum + a.integrity * ANCHOR_KIND_WEIGHT[a.kind],
    0,
  );
}

/** A Saint's mild baseline anchoring need (the incomplete mythical form). */
export const SAINT_REQUIRED_SUPPORT = 40;
/** Per-step extra support each rung below Saint demands (Seq 2, then Seq 1). */
export const ANGEL_SUPPORT_PER_STEP = 60;

/**
 * Effective anchor support a character at this sequence needs to stay balanced.
 * 0 above Saint; a modest constant for Saints (Seq 4–3); rising steeply for
 * Angels (Seq 2) and Kings of Angels (Seq 1) — the deeper the godhood, the more
 * faith it takes to hold the self.
 */
export function requiredSupport(sequenceLevel: number): number {
  if (!anchorsRelevant(sequenceLevel)) return 0;
  if (!requiresAnchors(sequenceLevel)) return SAINT_REQUIRED_SUPPORT;
  // Seq 2 → one step, Seq 1 → two steps, on top of the Saint baseline.
  const steps = 2 - sequenceLevel + 1;
  return SAINT_REQUIRED_SUPPORT + steps * ANGEL_SUPPORT_PER_STEP;
}

/** Support shortfall (required − effective), floored at 0. */
export function supportShortfall(state: AnchorState, sequenceLevel: number): number {
  return Math.max(0, requiredSupport(sequenceLevel) - effectiveSupport(state));
}

// ─── Per-turn pressure (sanity integration) ──────────────────────────

/** Largest per-turn sanity drain an under-anchored Beyonder can suffer. */
export const MAX_ANCHOR_PRESSURE = 20;
/** Shortfall (in support units) that maps to the maximum drain. */
export const PRESSURE_SHORTFALL_SCALE = 120;

/**
 * Per-turn sanity drain when anchor support is insufficient for the character's
 * sequence. Returns a NON-POSITIVE sanity delta (0 when fully supported, or when
 * the sequence is too low to care; down to −MAX_ANCHOR_PRESSURE when wholly
 * unanchored at the deepest tier). The game loop applies it via the existing
 * `applySanityImpact` clamp — this module never mutates sanity itself.
 */
export function anchorPressure(state: AnchorState, sequenceLevel: number): number {
  const shortfall = supportShortfall(state, sequenceLevel);
  if (shortfall <= 0) return 0;
  const ratio = Math.min(1, shortfall / PRESSURE_SHORTFALL_SCALE);
  return -Math.round(ratio * MAX_ANCHOR_PRESSURE);
}

/** Whether this character is dangerously under-anchored right now. */
export function isUnderAnchored(state: AnchorState, sequenceLevel: number): boolean {
  return supportShortfall(state, sequenceLevel) > 0;
}

/**
 * Maps an under-anchored character onto the failure engine's `highRisk` flag.
 * The caller threads this straight into `evaluateFailure({ …, highRisk })` /
 * `evaluateLossOfControl({ …, highRisk })`; the consequence ladder is NOT
 * duplicated here. This is the canon "anchor theft mid-ritual tips the balance
 * and the advancing Beyonder loses control on the spot".
 */
export function anchorHighRisk(state: AnchorState, sequenceLevel: number): boolean {
  return requiresAnchors(sequenceLevel) && isUnderAnchored(state, sequenceLevel);
}

// ─── Acquisition / damage / repair ───────────────────────────────────

export interface NewAnchorFields {
  kind: AnchorKind;
  name: string;
}

/**
 * Consecrate a new anchor at full integrity. Throws on a blank name or a
 * duplicate name (the UI surfaces both as in-world limits, mirroring identity).
 */
export function consecrateAnchor(
  state: AnchorState,
  fields: NewAnchorFields,
  id: string = crypto.randomUUID(),
): AnchorState {
  const name = fields.name.trim();
  if (name === "") throw new Error("An anchor needs a name.");
  if (state.anchors.some((a) => a.name.toLowerCase() === name.toLowerCase())) {
    throw new Error(`"${name}" is already one of your anchors.`);
  }
  const anchor: Anchor = {
    id,
    kind: fields.kind,
    name,
    integrity: ANCHOR_INTEGRITY_MAX,
  };
  return { anchors: [...state.anchors, anchor] };
}

function adjustIntegrity(state: AnchorState, id: string, delta: number): AnchorState {
  return {
    anchors: state.anchors.map((a) =>
      a.id === id
        ? {
            ...a,
            integrity: clamp(
              a.integrity + delta,
              ANCHOR_INTEGRITY_MIN,
              ANCHOR_INTEGRITY_MAX,
            ),
          }
        : a,
    ),
  };
}

/**
 * Reduce an anchor's integrity (theft, a shattered church, doctrinal error). A
 * negative `amount` is treated as its magnitude. Does NOT auto-remove a zeroed
 * anchor — a believerless congregation can be re-grown; use `loseAnchor` to drop
 * it explicitly.
 */
export function damageAnchor(
  state: AnchorState,
  id: string,
  amount: number,
): AnchorState {
  return adjustIntegrity(state, id, -Math.abs(amount));
}

/** Restore integrity (growing the congregation, mending the object). */
export function repairAnchor(
  state: AnchorState,
  id: string,
  amount: number,
): AnchorState {
  return adjustIntegrity(state, id, Math.abs(amount));
}

/** True once an anchor has been emptied of all holding strength. */
export function isLost(anchor: Anchor): boolean {
  return anchor.integrity <= ANCHOR_INTEGRITY_MIN;
}

/** Remove an anchor entirely (a zeroed one, or a deliberately released one). */
export function loseAnchor(state: AnchorState, id: string): AnchorState {
  return { anchors: state.anchors.filter((a) => a.id !== id) };
}

// ─── Demigod flavour data (character-sheet display) ──────────────────

export interface DemigodTraits {
  /** e.g. "Saint" / "Angel" / "King of Angels". */
  title: string;
  /** Canon lifespan note for the tier. */
  lifespan: string;
  /** Incomplete vs. complete mythical creature form. */
  mythicalForm: string;
  /** Who/where they can answer prayers (Seq ≤ 3 locally, Seq ≤ 2 worldwide). */
  prayerResponse: string;
}

/**
 * Per-sequence demigod descriptors for the Saint→Angel tiers (Seq 4–1). Pure
 * data, grounded in canon (the Sequence, Angels, and Mythical Creature Form
 * pages). Consumed by the character sheet later; not fed to the AI.
 */
export const DEMIGOD_TRAITS: Record<number, DemigodTraits> = {
  4: {
    title: "Saint",
    lifespan: "Greatly extended — varies by pathway, but most live under 500 years.",
    mythicalForm:
      "Incomplete mythical creature form; it cannot be manifested without severe consequences.",
    prayerResponse:
      "Cannot yet answer prayers; the godhood of a Saint is only beginning to take shape.",
  },
  3: {
    title: "Saint",
    lifespan: "Greatly extended — most Saints live under 500 years.",
    mythicalForm:
      "Incomplete mythical creature form; said by Mr. Door to be a pathway's finest level to dwell at.",
    prayerResponse:
      "Can answer prayers within a limited area through an Honorific Name pointing to them.",
  },
  2: {
    title: "Angel",
    lifespan:
      "Near-immortal and unaging, yet still mortal — even a Sequence 2 can die of old age in time.",
    mythicalForm:
      "A complete mythical creature; requires an anchor to keep from going mad.",
    prayerResponse:
      "Can respond to prayers all over the world; once called a Subsidiary God.",
  },
  1: {
    title: "King of Angels",
    lifespan:
      "Near-immortal and unaging; needs powerful anchors and abilities to forestall eventual death.",
    mythicalForm:
      "A complete mythical creature whose unanchored form devours the self into godhood.",
    prayerResponse:
      "Answers prayers worldwide; an Archangel who, having accommodated a Uniqueness, becomes a Half-True God.",
  },
};

// ─── Session-shape validation (mirrors identityState) ────────────────

function isValidAnchorShape(obj: unknown): boolean {
  if (typeof obj !== "object" || obj === null || Array.isArray(obj)) return false;
  const a = obj as Record<string, unknown>;
  if (typeof a.id !== "string" || a.id.length === 0) return false;
  if (typeof a.name !== "string") return false;
  if (typeof a.kind !== "string" || !ANCHOR_KINDS.includes(a.kind as AnchorKind)) {
    return false;
  }
  if (!Number.isFinite(a.integrity)) return false;
  const integrity = a.integrity as number;
  if (integrity < ANCHOR_INTEGRITY_MIN || integrity > ANCHOR_INTEGRITY_MAX) {
    return false;
  }
  return true;
}

/** Strict shape check for a persisted `AnchorState` (mirrors identity). */
export function isValidAnchorStateShape(obj: unknown): boolean {
  if (typeof obj !== "object" || obj === null || Array.isArray(obj)) return false;
  const s = obj as Record<string, unknown>;
  if (!Array.isArray(s.anchors)) return false;
  return s.anchors.every(isValidAnchorShape);
}
