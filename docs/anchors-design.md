# Anchors System Design (issue #35)

Status: research + implementation-ready design. The engine that realises this
doc lives at `src/lib/game/anchors.ts` (issue #25). This file is the issue #35
deliverable: it grounds the Anchors system in Lord of the Mysteries canon and
specifies the concrete game design — data model, function signatures, and the
integration points with the existing sanity (`src/lib/game/sanity.ts`) and
death/failure (`src/lib/game/death.ts`) engines.

---

## 1. Canon grounding

All quotations below are from the cleaned Fandom wiki dump (`/tmp/wiki-docs.jsonl`),
named by source page.

### What an Anchor is

> "The Anchor can be many things as long as it helps the Beyonder secure their
> sanity against the influence and Godhood of the Beyonder Characteristics.
> Anchors are required for high-sequence Beyonders to maintain rationality and
> resist the strong inclination to lose control, the urges buried deep in their
> collective subconscious." — _Anchor_

An Anchor is **not** primarily a way to preserve humanity. It is a counterweight
that fixes the Beyonder's self-image against the "mental imprint" buried inside
the Beyonder Characteristic — the pull of the Sequence's **mythical creature
form** (its Godhood):

> "Its main purpose was to form a corresponding understanding, positioning, and
> image, one that would resist the mental imprint within the Beyonder
> Characteristic so as to maintain an intricate balance… Under the balance
> between the Beyonder characteristics and the Anchor, the Beyonder could then
> barely maintain their humanity… This sort of balance isn't too stable, and it
> often tilts to a certain extent." — _Anchor_

So the canon model is a **tug-of-war**: rising Sequence = rising godhood/mythical
pressure, and an Anchor of matching strength holds the self in place. The balance
is inherently unstable and drifts over time.

### When Anchors become mandatory

- Madness first stirs around the **Mid sequences** (~Sequence 5).
- External Anchors become **mandatory from Sequence 2** upward:

> "From Sequence 2, one had to rely on external Anchors to maintain a balance." — _Beyonders_

This design treats **Sequence ≤ 2 as the hard "anchors required" gate** (Angels
and Kings of Angels), with optional, lighter anchoring available to **Saints
(Sequence 4–3)**.

### The mythical creature form (the thing anchors resist)

> "A Mythical Creature is the divine form of a Sequence 4 or higher Beyonder.
> Beyonders at Sequence 4 and 3 only possess an incomplete Mythical Creature
> Form; only at Sequence 2 and above does a Beyonder become a true Mythical
> Creature." — _Mythical Creature Form_

> Angels "are complete mythical creatures and require an anchor to prevent
> 'Them' from going mad." — _Angels_

Losing the anchor balance means being **assimilated by the mythical form** — the
loss-of-control cascade ending in a Rampager monster (_Beyonders_).

### Anchor types by tier

- **Saints (Seq 4–3)** can anchor on **personally meaningful marks** (objects,
  places, strong emotional memories) and benefit from a **small following**:
  > "Saints do not necessarily need followers as an Anchor, instead, they could
  > use marks that are significant and mystically meaningful in their life…
  > they can also benefit from a small number of followers as anchors." — _Anchor_
- **Angels and above (Seq ≤ 2)** anchor chiefly on **believers / congregations**:
  > "For existences at the level of Angels or above, Anchor mostly refers to
  > 'Their' believers. This is why Gods build Churches and gather followers." — _Anchor_
- **Fool & Error pathways** can manufacture believers from **avatars / marionettes**:
  > "Existences at the level of Angels and above of the Fool Pathway and Error
  > Pathway… can form a group of avatars or marionettes respectively and make
  > them 'Their' own believers… this can effectively provide the best anchor." — _Anchor_

### How anchors are lost or damaged (attack vectors)

1. **Theft** (Error pathway / Worm of Time): "'They' can directly Steal the
   anchors of Beyonders through certain Loopholes… very useful at the critical
   moment of an advancement or apotheosis ritual, the sudden decrease in anchors
   would tip the balance of advancing Beyonders and make them lose control on
   the spot." — _Error Pathway/Abilities_. Canon instance: Amon stealing Klein's
   anchors during the Fool Uniqueness ritual (_Amon/History_).
2. **Destabilisation by a rival deity** — church-vs-church warfare aimed at the
   enemy's believers (_Church of the God of Combat_).
3. **Doctrinal error** — a Bible/honorific-name mistake points prayers at the
   wrong target and the deity "lose[s] their anchors" (_Anchor_).
4. **Catastrophic loss of the congregation/object** — a shattered church or a
   destroyed significant object (_Church of the Earth Mother_).

### Canon examples used to shape the model

- **Klein Moretti (The Fool):** Tarot Club members praying as his anchor for
  Sefirah Castle (_Sefirah Castle_); the Fool and Sea God believers balancing the
  Celestial Worthy's will during his apotheosis (_Klein's Apotheosis Ritual_).
- **Silver Knight:** strong emotional life-marks as a Saint's anchor (_Anchor_).
- **Sealed Artifacts as ritual anchors:** the Fallen Flute used by Colin as an
  advancement anchor (_Fallen Flute_).

---

## 2. Game design

### 2.1 Concept

Anchors are a **tier-gated stabilising resource** that opposes the godhood
pressure a high-Sequence character carries. Mechanically they feed the existing
**sanity engine** as a per-turn drain when support is insufficient, and they
escalate the **death/failure engine** when the character loses control while
under-anchored.

We deliberately keep the engine **pure and additive**: it computes a per-turn
sanity drain and a `highRisk` flag, both of which thread into systems that
already exist. No existing module is duplicated — `anchors.ts` imports
`sanityDelta` semantics and the `evaluateFailure` / `evaluateLossOfControl`
`highRisk` concept rather than reinventing consequence ladders.

### 2.2 Data model

```ts
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
```

`AnchorState` lives on `GameSession` as an **optional, strictly validated field**
— exactly mirroring `identityState`:

```ts
// in GameSession (src/lib/game/types.ts)
anchorState?: import("./anchors").AnchorState;
```

It is seeded lazily (a Seq 9 starter has no anchors and needs none), validated by
`isValidAnchorStateShape`, and round-tripped by the same strict
serialize/deserialize discipline `deserializeSession` already enforces for
`identityState`, `digestion`, and `injuries`.

### 2.3 Tier gating

```ts
/** Anchors are mandatory from Sequence 2 (Angels and above). */
export function requiresAnchors(sequenceLevel: number): boolean {
  return sequenceLevel <= 2;
}

/** Saints (Seq 4–3) may anchor optionally; below Saint there is no pressure. */
export function anchorsRelevant(sequenceLevel: number): boolean {
  return sequenceLevel <= 4;
}
```

- **Seq ≥ 5:** anchors irrelevant — no pressure, no requirement.
- **Seq 4–3 (Saint):** anchors optional. Being unanchored adds a _mild_ pressure
  (the incomplete mythical form tugging) but is survivable.
- **Seq ≤ 2 (Angel / King of Angels):** anchors **required**. Insufficient
  support produces steep per-turn sanity drain and flags `highRisk` for the
  failure engine.

### 2.4 Anchor support vs. required support

A character needs **total effective anchor support** scaled to how deep into the
godhood tiers they are. Effective support sums each anchor's integrity, weighted
by kind (a congregation of believers is the strongest anchor at the Angel tier,
matching canon):

```ts
export const ANCHOR_KIND_WEIGHT: Record<AnchorKind, number> = {
  object: 0.5, // a significant personal object / Sealed Artifact
  place: 0.75, // a consecrated place
  congregation: 1, // believers — the strongest, "the faith of the mass"
};

/** Sum of integrity × kind-weight across all anchors, in [0, …]. */
export function effectiveSupport(state: AnchorState): number;

/** Support a character at this sequence needs to stay balanced. */
export function requiredSupport(sequenceLevel: number): number;
```

`requiredSupport` is `0` above Seq 4, a modest constant for Saints, and rises
steeply for Angels (Seq 2) and Kings of Angels (Seq 1) — the deeper the godhood,
the more faith it takes to hold the self.

### 2.5 Per-turn pressure (sanity integration)

```ts
/**
 * Per-turn sanity drain when anchor support is insufficient for the character's
 * sequence. Returns a NON-POSITIVE number (a sanity delta) in the same units the
 * sanity engine uses; 0 when support meets or exceeds the requirement, or when
 * the sequence is too low to care. The game loop applies it via the existing
 * `applySanityImpact` clamp.
 */
export function anchorPressure(state: AnchorState, sequenceLevel: number): number;
```

The shortfall (`requiredSupport - effectiveSupport`, floored at 0) is scaled into
a drain capped at `MAX_ANCHOR_PRESSURE`. A fully-anchored Angel pays nothing; a
wholly-unanchored Angel pays the cap every turn — a rapid slide toward zero
sanity (loss of control) unless they raise believers.

**Integration point (documented; the loop is NOT modified by this task):** the
game loop calls `anchorPressure(session.anchorState ?? emptyAnchorState(),
gameState.sequenceLevel)` once per resolved turn and folds the result into the
same sanity-delta accumulation that already handles `sanityDelta(event)` events,
then clamps with `applySanityImpact`. A convenience helper is exported:

```ts
/** Whether this character is dangerously under-anchored right now. */
export function isUnderAnchored(state: AnchorState, sequenceLevel: number): boolean;
```

> **UI status:** the acquisition path below is surfaced to the player by the
> character-sheet `AnchorsSection` (`src/components/game/character-sheet.tsx`),
> shown at the Saint tier (Seq ≤ 4). Object and place anchors are consecrated by
> name as a Saint's "meaningful marks"; a **congregation** anchor is gated on the
> character having an actual following (secret-society members + rostered allies),
> via the pure `canConsecrateCongregation(followingSize)` helper — believers are
> the strongest anchor and cannot be conjured from nothing. This is what makes the
> Saint-tier anchors requirement in `advancement.ts` reachable in normal play.

### 2.6 Acquisition, damage, repair

```ts
/** Consecrate a new anchor (object / place / congregation) at full integrity. */
export function consecrateAnchor(
  state: AnchorState,
  fields: { kind: AnchorKind; name: string },
  id?: string,
): AnchorState;

/** Reduce an anchor's integrity (theft, a shattered church, doctrinal error). */
export function damageAnchor(state: AnchorState, id: string, amount: number): AnchorState;

/** Restore integrity (growing the congregation, mending the object). */
export function repairAnchor(state: AnchorState, id: string, amount: number): AnchorState;

/** Remove an anchor whose integrity has hit 0, or that is deliberately released. */
export function loseAnchor(state: AnchorState, id: string): AnchorState;
```

All are **pure** and clamp integrity to `[0, 100]`. `damageAnchor` does **not**
auto-remove a zeroed anchor — a believerless congregation can be re-grown — but
`isLost(anchor)` reports `integrity === 0` and `loseAnchor` removes it explicitly.

### 2.7 Loss consequences (death/failure integration)

Anchors do not introduce a new failure ladder. Instead they feed the existing
one through **two documented hooks**, mapped onto concepts the engines already
expose:

1. **Sanity pressure → loss of control.** Under-anchoring drains sanity each turn
   (§2.5). When sanity bottoms out, the existing `isLossOfControl` /
   `evaluateLossOfControl` path runs unchanged. Because an Angel sits at
   `sequenceLevel ≤ 2`, the sanity ladder already classifies their loss of
   control as **fatal** — the unanchored Angel becoming a Rampager monster, per
   canon.

2. **`highRisk` escalation during fragile moments.** Being under-anchored is
   exactly the "fragile, high-risk moment" the failure engine already models
   (`LossOfControlContext.highRisk`, `FailureContext.highRisk`). The anchors
   engine exposes the predicate the caller passes straight through:

```ts
/**
 * Maps an under-anchored character onto the failure engine's `highRisk` flag.
 * The caller threads this into `evaluateFailure({ …, highRisk })` /
 * `evaluateLossOfControl({ …, highRisk })` — the consequence ladder is NOT
 * duplicated here.
 */
export function anchorHighRisk(state: AnchorState, sequenceLevel: number): boolean;
```

This is the canon "anchor theft mid-ritual tips the balance and the advancing
Beyonder loses control on the spot": steal/damage their anchors so
`anchorHighRisk` becomes true, and the next failure escalates one rung up the
existing ladder (e.g. a combat defeat that would have been a `setback` becomes a
`transformation`/`permadeath`).

### 2.8 Demigod flavour data

For the character sheet (UI consumed later), `anchors.ts` exports pure
per-tier descriptive data:

```ts
export interface DemigodTraits {
  /** e.g. "Saint" / "Angel" / "King of Angels". */
  title: string;
  lifespan: string; // canon lifespan note
  mythicalForm: string; // incomplete vs. complete mythical creature
  prayerResponse: string; // who/where they can answer prayers (Seq ≤ 3 / ≤ 2)
}

/** Keyed by sequence level for the demigod tiers (4,3,2,1). */
export const DEMIGOD_TRAITS: Record<number, DemigodTraits>;
```

Grounded in canon: Saints (Seq 4–3) "gain great lifespan… most cannot live longer
than 500 years" with an **incomplete** mythical form and prayer-response from Seq
3; Angels (Seq 2–1) are **complete** mythical creatures, near-immortal but still
mortally killable, who "respond to prayers all over the world."

### 2.9 Why this shape

- **Additive & pure** — no edits to sanity/death engines; anchors _feed_ them via
  documented helpers (`anchorPressure`, `anchorHighRisk`). Imports, never
  duplicates, the consequence ladders.
- **Canon-faithful tiering** — required from Seq 2, optional for Saints,
  congregation > place > object weighting matches "the faith of the mass" being
  the strongest anchor.
- **Session-shape parity** — `anchorState` mirrors `identityState` exactly
  (optional, strict `isValidAnchorStateShape`, strict deserialize), so old saves
  remain valid and malformed JSON is rejected rather than coerced.
- **Attack surface for stories** — `damageAnchor` + `anchorHighRisk` directly
  model canon anchor theft/destabilisation as a setup for a dramatic, escalated
  failure.

## Appendix — deliberately dormant per-turn sanity decay (issue #95)

The sanity/digestion rework in issue #95 introduced a hybrid per-turn sanity
model (AI event tags scored by the engine + a small AI residual). Two decay
sources stayed **deliberately dormant** in that pass and are NOT wired into
normal turn resolution:

- **`anchorPressure(state, seq)`** — the non-positive per-turn sanity pressure an
  under-anchored Saint+/Angel should feel. It remains defined, tested, and ready,
  but is not yet folded into `applyResolution`'s sanity accumulation. Wiring it in
  (Saints+, Seq ≤ 4) is explicitly out of scope and deferred.
- **`acting-neglect` sanity decay** — neglecting the acting method does NOT drain
  sanity. Neglect still bites, but only as a **digestion reversal** (contradictory
  acting in `digestion.ts`), not as a sanity hit.

Both are intentional gaps, kept dormant to keep the issue-#95 change focused;
they are tracked for a later pass.
