# Combat & Encounter Overhaul — Design + Phased Plan

Status: **Design for review** (pre-implementation). Author: combat-workflow-analysis.

This document specifies an overhaul of the combat experience (and, secondarily, the
potion-ingredient quests that feed it). It is grounded in the current code and in an
interview with the project owner. **Combat is the priority**; potion-quest options are
collected in Appendix B for a later decision.

---

## 1. Why this exists — the problems we're fixing

The current combat workflow is mechanically sound but **narratively hollow and opaque**.
Three concrete failures, traced to code:

1. **You fight the wrong people.** `deriveEncounterEnemy(state, ambush)`
   (`src/lib/game/combat.ts:805`) picks the opponent as `state.npcsPresent[0]` — the
   first NPC the AI happened to place in the scene. Because `npcsPresent` is on the
   AI-mutable allowlist (`world-state.ts`), an **ally** standing nearby silently becomes
   the combat target. There is no "who do you fight?" step and no framing for _why_.

2. **Generic foes.** When no NPC is present, the enemy is a hardcoded string —
   `"a lurking Beyonder"` (known threat) or `"an assailant in the fog"` (ambush) — with
   `sequenceLevel = player − 1`, no pathway, no abilities, no motive, no lore. Every
   confrontation reads the same.

3. **It's a black box.** The exchange offers options whose modifiers are hidden
   (`optionModifier`, `combat.ts:610`); you can't read your odds, can't tell what a choice
   does, can't tell how strong the enemy is, and the resolution consequences arrive
   without an itemized account.

The result, in the owner's words: combat is "lackluster, non-engaging, and mostly pits
you against your allies or just a 'lurking beyonder.'"

---

## 2. Design goals (from the interview)

The owner confirmed the following. These are **requirements**, not assumptions.

| Aspect              | Decision                                                                                                                                                                                                                                                                          |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Priority**        | Combat first, deeply; potion quests after (Appendix B).                                                                                                                                                                                                                           |
| **Engagement**      | Hit **all four** pillars: tactical depth, narrative/roleplay, tension & stakes, pathway fantasy.                                                                                                                                                                                  |
| **Opponents**       | **Do NOT gate allies out.** Instead, frame _why_ an ally fights you (mind-controlled by another Beyonder, lost control, hidden motive, coerced, fighting against their will). Plus: story-designed encounters, explicit target choice, and richer (lore-grounded) enemy identity. |
| **Combat flow**     | **Deepen** the existing 3-phase model (preparation → exchange → resolution). Evolution, not a rewrite.                                                                                                                                                                            |
| **Powers**          | **Curated ability kits** per pathway + Sequence, authored from the corpus, gaps filled where canon is thin.                                                                                                                                                                       |
| **Stakes**          | All of: live **loss-of-control** threat, sanity/spirit drain, lasting injury, artifacts/consumables. **Artifacts are NOT consumed unless their description explicitly says so.**                                                                                                  |
| **Authority**       | **Hybrid** (recommended & accepted): the deterministic engine owns math/rolls/resources/outcomes; the AI narrates richly within those results.                                                                                                                                    |
| **Clarity**         | All of: readable odds & risk before committing, legible choice effects, clear (intel-gated) enemy info, an itemized after-action breakdown.                                                                                                                                       |
| **Outcomes**        | Beyond win/lose: **subdue/non-lethal**, **snap an ally free**, **talk down/de-escalate**, **capture/spare/recruit**.                                                                                                                                                              |
| **Loss of control** | **Escalating spiral** (recommended): starts mild, compounds if pushed, can end in temporary madness or — at the extreme — transformation/death, but is recoverable if you back off in time. Most LOTM-authentic.                                                                  |
| **Deliverable now** | This design doc + phased plan, for review **before** building.                                                                                                                                                                                                                    |

---

## 3. What we keep (the good bones)

The overhaul **extends**, it does not discard:

- **Deterministic engine, AI narrates.** All mechanics stay in pure functions in
  `src/lib/game/combat.ts`, resolved under a single `randomFactor` rolled at encounter
  creation, so a serialized fight always resolves identically. The AI layer keeps the
  `"combat"` narration instruction and the `combatNarrationContext` summary.
- **The 3-phase `CombatEncounter` state machine** (`preparation → exchange → resolution`)
  and its serializable shape (survives reload).
- **The advantage model** (`computeBaseAdvantage`: preparation + sequence gap + pathway
  matchup + random factor − injuries) as the spine, now fed by richer inputs.
- **Existing subsystems we compose with, never duplicate:** `sanity.ts`
  (`sanityDelta`, `evaluateLossOfControl`, the tier ladder), `death.ts`
  (`evaluateFailure` → setback/permadeath), `anchors.ts` (`anchorHighRisk`),
  `apotheosis.ts` `sequenceAbilities` / `getCumulativeAbilities` (canon ability data),
  `inventory.ts` (`removeItemsByName`), `tracked-npcs.ts` (roster — for capture/recruit),
  `lib/lore/sealed-artifacts` (artifact grades/backlash).
- **The intel-gating** (`enemyIntel`, `combat.ts:829`) — extended, not replaced.

---

## 4. Target architecture

Four new concepts layer onto the existing engine. Each is a pure data structure with
pure functions, colocated tests, and (where persisted) strict shape validation following
the established `hunt.ts`/`anchors.ts` pattern.

### 4.1 Encounter framing — _who you fight, and why_

Replace `deriveEncounterEnemy`'s "grab `npcsPresent[0]`" with an explicit, framed
opponent selection.

```ts
// src/lib/types/combat.ts (new)
export type EncounterFraming =
  | "hostile-beyonder" // a genuine enemy Beyonder
  | "mundane-threat" // thugs, beasts, ordinary danger
  | "mind-controlled" // an ally/NPC puppeteered by another Beyonder
  | "lost-control" // an ally/NPC who has lost control of themselves
  | "rival-motive" // someone with their own agenda, not truly your foe
  | "coerced" // forced to attack you against their will
  | "beast"; // a supernatural creature / monster

export interface EncounterContext {
  framing: EncounterFraming;
  /** True when the opponent is someone the player knows (ally/companion/named NPC). */
  isKnownPerson: boolean;
  /** If mind-controlled/coerced: the puppeteer's identity, when known. */
  controllerName?: string;
  /** One-line in-world reason this fight is happening. */
  motive?: string;
  /** Whether a non-lethal / snap-free / talk-down resolution is available. */
  reconcilable: boolean;
}
```

`Enemy` gains optional `combatKitId`, `framing` defaults, and a `bestiaryId`. The
encounter carries its `EncounterContext`.

**Opponent sourcing** (a new `selectOpponents(state)` pure function), surfaced to the
player as an **explicit target list** instead of an auto-pick:

1. **Present NPCs** — each present NPC is offered _with_ a framing. Allies are NOT
   filtered out; an ally appears tagged (e.g. "mind-controlled — fighting against their
   will"). The framing is proposed by the AI (validated) or defaulted by the engine from
   disposition (`tracked-npcs.ts` roster: an `ally` who attacks must carry a
   reconcilable framing — `mind-controlled`/`lost-control`/`coerced`).
2. **Curated bestiary** — a corpus-grounded catalogue of region/Sequence-appropriate
   foes (Appendix A). Picks fit the current city/location and the player's Sequence band.
3. **Named story antagonists** — pursuers from `trackedNpcState` (hostiles who follow)
   surface as targets when present.

This single change fixes complaint #1 (never silently fight an ally) and #2 (no more bare
"lurking Beyonder" — the fallback becomes a framed bestiary pick), **without** gating
allies out: it reframes them.

### 4.2 Combat ability kits — _pathway fantasy + tactical depth_

Canon ability data already exists: `sequenceAbilities(pathwayId, level)` →
`getCumulativeAbilities` returns every rung's abilities (`pathways.ts` Seq 9–5,
`demigod-abilities.ts` Seq 4–1), each a `{name, description}`. Today combat only uses the
_names_ as flavor labels on generic "ability" options. We promote them to a real toolkit.

```ts
// src/lib/game/combat-abilities.ts (new)
export type AbilityKind = "offensive" | "defensive" | "control" | "evasive" | "utility";

export interface CombatAbility {
  id: string;
  name: string; // canon ability name
  kind: AbilityKind;
  description: string; // canon description, condensed for combat
  /** Resource cost when invoked. */
  sanityCost: number;
  /** Strain added to the loss-of-control meter (§4.3). 0 for safe abilities. */
  controlStrain: number;
  /** Rounds before re-use (within one fight). */
  cooldown: number;
  /** Advantage contribution, before edge/intel scaling. */
  potency: number;
  /** Optional: framing/kind this ability is especially strong against. */
  counters?: EncounterFraming[];
}
```

`combatKitFor(pathwayId, sequenceLevel)` derives the kit by **mapping the canon abilities
to combat roles** (a curated classification table keyed by ability name/keywords, grounded
in the corpus `<Pathway>/Abilities` pages, gaps filled where canon is thin — exactly the
`demigod-abilities.ts` precedent). A Spectator's kit (perception/foresight/control) plays
differently from a Marauder's (force/physical). The kit is **cumulative** like the
underlying abilities, so climbing rungs visibly grows your options.

These abilities become real options in the exchange (§4.4), spending sanity/spirit and
control-strain, gated by cooldown — the source of tactical depth.

### 4.3 The control meter — _loss of control as a live, escalating threat_

A combat-scoped strain track, seeded from current sanity and pushed by risky play. It is
**derived/transient on the encounter** (no DB migration), and folds into the existing
`sanity.ts` loss-of-control ladder and `death.ts` at resolution.

```ts
// on CombatEncounter
controlStrain: number; // 0..1, accumulates during the fight
controlTier: "steady" | "frayed" | "slipping" | "spiral";
```

- **Sources of strain:** aggressive overreach without an edge, invoking high-grade sealed
  artifacts (reuses `artifactBacklash`), pushing an ability whose `controlStrain > 0`,
  fighting while already low on sanity, and the horror of a stronger foe.
- **Escalation (the spiral):**
  - `steady` → no effect.
  - `frayed` → a narrated impulse; small penalty.
  - `slipping` → you are forced into a reckless act for one decision point (an option is
    pre-selected / your safe options are constrained); a real penalty.
  - `spiral` → at resolution this routes through `evaluateLossOfControl` with
    `highRisk` (and `anchorHighRisk` for high-Sequence Beyonders): `setback` →
    `transformation` → `fatal`, scaled by Sequence. Becoming a monster / death is the
    extreme tail.
- **Recovery:** defensive/evasive choices, de-escalation, and in-role acting reduce strain
  — you can pull back from the brink if you stop pushing. This mirrors the canon and the
  existing `inRoleDrainMultiplier`/recovery design in `sanity.ts`.

The meter is **shown** (clarity): a labeled track with its tier, and each risky option is
tagged with its strain cost.

### 4.4 Deepened exchange + legible choices

Keep the bounded exchange (not a full free-form round system — the owner chose "deepen the
3-phase model"), but make it a real back-and-forth:

- **Enemy state evolves between points.** The enemy takes a stance
  (`pressing`/`guarded`/`reeling`/`desperate`) that shifts which of your options pay off,
  and reacts to your last choice. This is engine-computed and shown.
- **Options come from your kit**, not just three templated verbs: invoke a named ability
  (with cost/cooldown/strain), press/guard/evade, use a carried artifact, **or pursue a
  resolution line** (subdue / try to snap them free / talk them down — §4.5).
- **Legibility (clarity):** every option shows a plain-language effect tag and a coarse
  direction (e.g. "Aggressive — strong if you hold the edge, risky otherwise · +strain"),
  and a coarse **odds/threat read** is shown for the fight (intel-gated: vague without
  intelligence, a rough band with `partial`, specific with `thorough`). We expose
  _direction and risk_, never the exact hidden number — preserving tension.

### 4.5 Outcome spectrum — _more than win/lose_

`CombatOutcome` expands from `victory | defeat | escape | stalemate` to add:

```ts
export type CombatOutcome =
  | "victory"
  | "defeat"
  | "escape"
  | "stalemate" // existing
  | "subdued" // won non-lethally — no kill, no dropped characteristic
  | "freed" // broke the control over a turned ally — ally restored
  | "talked-down" // ended by words/intimidation/motive — no violence outcome
  | "captured" // foe taken alive (interrogation/leverage/recruit hook)
  | "spared"; // victory, but you let them live
```

These are **driven by the player's chosen line**, not random:

- **Subdue / non-lethal:** declare a non-lethal stance in preparation or pick subduing
  options; on a winning advantage you get `subdued` instead of `victory` (foe lives; for a
  Beyonder, no characteristic drops — the trade-off for mercy).
- **Snap them free:** for a `mind-controlled`/`coerced` opponent, a dedicated line of
  effort (skill/power/sanity checks across the exchange, harder than simply winning) yields
  `freed` — the ally is restored and may join/return to the roster.
- **Talk down:** for a `reconcilable` framing, de-escalation options accumulate toward
  `talked-down`; reaching it ends the fight without a violent resolution.
- **Capture / spare / recruit:** on a decisive win, choose to take them alive
  (`captured`) or release (`spared`); these emit world-ripple memory facts and can add a
  tracked NPC.

`computeConsequences` branches on the richer outcome: e.g. `subdued`/`talked-down`/`freed`
drop no characteristic and carry lighter sanity/injury costs but may cost an opportunity
(no loot); `captured` seeds a follow-up hook.

### 4.6 Artifact / consumable model fix

**Today:** ritual materials are consumed by the act of preparing, and sealed artifacts are
consumed when used mid-fight (`computeConsequences` adds them to `itemsLost`).
**Required change:** _artifacts persist unless their description says they're consumed._

- Introduce an explicit consumability signal on `Item` (a `consumable?: boolean`, or a
  derivation `isConsumable(item)` from category/description — single source of truth in
  `inventory.ts`). Sealed artifacts default **non-consumable**; one-use potions / ritual
  reagents whose description states single-use are consumable.
- `computeConsequences`, `scorePreparation` (ritual-material handling), and the dynamic
  artifact options stop adding non-consumable artifacts to `itemsLost`. Backlash/sanity
  cost (`artifactBacklash`) still applies on use — the _risk_ of invoking a relic stays; it
  just isn't destroyed.
- The combat UI stops labeling reusable artifacts as "consumed."

---

## 5. Clarity surfaces (UI)

All in `src/components/game/combat-encounter.tsx`, with new pure formatters in the engine
(kept testable):

1. **Threat assessment card** (preparation): danger tier, coarse odds band (intel-gated),
   the encounter **framing** ("Your comrade Lawrence — mind-controlled; he doesn't want
   this"), and what's at stake.
2. **Enemy dossier** (extend `enemyIntel`): name, framing, rough/exact strength, pathway,
   and — at `thorough` — known kit abilities and counters.
3. **Legible decision options:** effect tag + risk/strain tag per option; the control
   meter with its tier; the enemy's current stance.
4. **After-action report** (resolution): itemized — outcome, sanity delta (with cause),
   injuries (severity + recovery), items gained/lost (and explicitly _what was NOT_
   consumed), control outcome, characteristics, and any world ripple (freed ally, captive,
   reputation).

a11y (WCAG 2.2 AA) and the axe suite (`src/test/a11y.test.tsx`) extended for every new
component; an `e2e/` Playwright spec for the new combat flow (per the project's "done"
bar).

---

## 6. Phased implementation plan

Each phase is independently shippable, keeps `pnpm test` + the **95% coverage gate** green,
updates the relevant scoped `CLAUDE.md`, and (for user-facing changes) extends `e2e/` and
the a11y suite. Phases are ordered so the **highest-impact fix (opponents) lands first**.

### Phase 0 — Types & foundations (no behavior change)

- Add `EncounterFraming`, `EncounterContext`, expanded `CombatOutcome`, control fields, and
  `CombatAbility` to `src/lib/types/combat.ts`; the consumability signal to `rules.ts`.
- Pure helpers + tests; update `src/lib/types/CLAUDE.md`.
- _Outcome:_ compiles, all existing tests pass, no gameplay change.

### Phase 1 — Opponent & encounter framing ★ fixes the core complaint

- New `selectOpponents(state)` + `EncounterContext` derivation; retire
  `deriveEncounterEnemy`'s `npcsPresent[0]` auto-pick.
- Curated **bestiary** (Appendix A) keyed by region/Sequence; AI-proposed framing with
  engine validation (an `ally` opponent must be `reconcilable`).
- UI: explicit **target selection** with framing before a fight starts.
- Tests: every framing path, ally-reframing, bestiary selection, validation. e2e: target
  picker. Update `combat.ts`/`game-loop` CLAUDE docs.

### Phase 2 — Combat ability kits ★ pathway fantasy

- `combat-abilities.ts`: `combatKitFor(pathwayId, sequenceLevel)` mapping canon abilities →
  combat roles (corpus-grounded classification table; gaps flagged like
  `demigod-abilities.ts`). Cumulative.
- Wire kits into the exchange as real, costed options (replaces the thin dynamic-ability
  slots).
- Tests: kit derivation for representative pathways across Sequence bands; cost/cooldown.

### Phase 3 — Deepened exchange, control meter & stakes

- Control meter (§4.3): strain accrual, tier escalation, recovery; integrate
  `evaluateLossOfControl`/`anchorHighRisk`/`death.ts` at resolution.
- Enemy stance evolution + reactive options; legible effect/risk tags.
- **Artifact consumability fix** (§4.6).
- Tests: spiral escalation/recovery, forced-reckless at `slipping`, resolution routing,
  non-consumable artifacts survive.

### Phase 4 — Outcome spectrum

- Expanded outcomes + `computeConsequences` branching; resolution-line tracking across the
  exchange (subdue / snap-free / talk-down / capture / spare / recruit).
- World ripple: memory facts, `tracked-npcs` roster updates (freed ally rejoins, captive).
- Tests: each outcome's trigger and consequences; ally restored to roster; no-drop on
  non-lethal.

### Phase 5 — Clarity UI & polish

- Threat assessment card, extended dossier, legible options, after-action report.
- a11y suite + `e2e/` spec for the full new flow; verbosity/contrast respected.

### Phase 6 — AI narration integration

- Prompt updates (`src/lib/ai/prompts.ts`): feed framing, chosen abilities, control tier,
  and the resolution line into `combatNarrationContext` so narration matches mechanics
  (mind-control reads as mind-control; a snap-free reads as saving your friend).
- Keep `ENGINE_RESOLUTION`/`narrationOnly` plumbing; the engine still decides.

---

## 7. Risks & mitigations

- **Authoring volume (kits + bestiary, 22 pathways).** Mitigate by deriving from existing
  corpus data (`sequenceAbilities`) and a classification table; fill gaps incrementally,
  flagged inline (the `demigod-abilities.ts` precedent). Ship Phase 2 with the original
  nine pathways fully curated and the rest mapped by rule, then refine.
- **Coverage gate (95%).** Every phase adds colocated `*.test.ts`; new `components/game/*.ts`
  logic shells get added to `coverage.include` per the project convention.
- **AI proposing an inappropriate framing** (e.g. tagging a hostile as `ally`). The engine
  validates: framing must be consistent with `tracked-npcs` disposition; an ally combatant
  is forced to a reconcilable framing or the fight is refused — same "engine truth over AI
  string" principle as the movement gate.
- **Scope creep into a full round-based system.** Explicitly out of scope — the owner chose
  to _deepen_ the 3-phase model. Round-based remains a possible future.

---

## 8. Open questions for your review

These are the points I would otherwise have to assume. Flagging rather than guessing:

1. **Spirit vs. sanity as the power resource.** LOTM has "Spirituality" distinct from
   mental sanity. Do we want a separate spirit/stamina pool for ability costs, or fold
   ability cost into the existing sanity + control-strain model? (Default proposed: reuse
   sanity + control-strain, no new pool, to avoid resource sprawl.)
2. **Bestiary breadth for v1.** Start with a small curated set per region (Tingen/Backlund
   etc.) and expand, or invest in a broad catalogue up front? (Default: small, high-quality,
   expand later.)
3. **Recruit depth.** Should `recruit` be a full companion-acquisition flow (via
   `tracked-npcs` + society systems) in this overhaul, or just seed a memory-fact hook now
   and build the flow later? (Default: hook now, flow later.)
4. **Ambush handling.** Keep the explicit "Brave an ambush" launcher, or fold ambush into
   the framed encounter system as a property of the context? (Default: fold in — ambush
   becomes a context flag, capped preparation as today.)

---

## Appendix A — Curated bestiary (sketch)

A pure data module (`src/lib/lore/bestiary.ts`), corpus-grounded, following the
`sealed-artifacts` / `start-scenarios` data-module pattern. Each entry:

```ts
interface BestiaryFoe {
  id: string;
  name: string;
  framing: EncounterFraming;
  pathwayId?: number; // if a Beyonder
  sequenceBand: [number, number];
  regions?: string[]; // city/region ids it can appear in
  description: string; // canon-grounded
  signatureAbilities: string[];
  motive?: string;
}
```

Seed examples (to be verified against `corpus/` before authoring): region-appropriate
mundane threats, Beyonder cultists/rogues by pathway, and supernatural beasts. Selection is
filtered by the player's location and Sequence band so a fight fits the scene.

## Appendix B — Potion-ingredient quest options (decide later)

The owner asked to see options before deciding. Combat-first, so this is deferred, but
recorded. Today a hunt/formula-pursuit just appends a templated label to `activeQuests` and
counts down N turns to a single combat/claim — no quest-giver, no mid-quest content, no
agency.

- **Option Q1 — Lightweight but framed (lowest effort).** Keep the countdown, but add a
  quest-giver/patron, stakes, lore context for the ingredient, and visible milestones
  instead of a bare counter. Reuses existing `hunt.ts`/`formula-pursuit.ts` plumbing.
- **Option Q2 — Staged mini-adventures (medium).** Each hunt becomes 2–4 beats (lead →
  complication → climax) with a choice at each beat, culminating in the new framed combat
  (a hunt naturally produces a bestiary encounter). Best synergy with the combat overhaul.
- **Option Q3 — Player-driven/freeform (variable).** Lean on the AI narrator with engine
  guardrails; ingredient acquisition stays engine-gated but the _path_ is open free-text.

Recommendation (for when we get there): **Q2**, because the combat overhaul gives hunts a
real climax to build toward, turning ingredient-gathering into an arc instead of a timer.
</content>
