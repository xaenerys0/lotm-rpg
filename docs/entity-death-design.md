# Authoritative entity death & characteristic precipitation (issue #227)

The design of record for #227, the follow-up to the issue #212 laws simulation
(`docs/laws-simulation-design.md`). Ratified by the owner review on issue #227,
including five required amendments (recorded below). Delivered as one PR per
implementation phase; this document grows with each phase.

## The defect

Indestructibility fired only for a combat `"victory"` over an enemy flagged
`isBeyonder` with a `pathwayId` (`src/lib/game/combat.ts` `computeConsequences`),
and the drop was applied in React (`game-loop.tsx` `handleCombatResult`) —
`applyCombatResult` ignored `characteristicsDropped` entirely. So nothing
precipitated on a mutual kill, on a characteristic-bearing creature not flagged
`isBeyonder`, on an NPC or ally death, or on a death narrated outside combat.

Canon is cause-agnostic: a Beyonder's characteristic precipitates when they die,
whatever killed them and whatever their Sequence ("_This isn't only the case for
Beyonders who lose control; it's also the same for normal Beyonders after they
die_" — Book 1, ch. 207; also ch. 218).

## Why a redesign rather than a wider `if`

Widening the trigger alone would mint advancement-critical reagents from combat
metadata and AI prose. Canon is explicit that supernatural nature does not imply
ownership — "_Some evil spirits had Beyonder characteristics, but most of them
didn't_" (ch. 1263) — so the engine needs facts it never had:

| Missing fact                       | Consequence today                             | Contract                   |
| ---------------------------------- | --------------------------------------------- | -------------------------- |
| Who an actor IS                    | names key the roster, presence, Codex, combat | entity registry            |
| Whether they are alive             | travel can re-assert a dead follower          | registry life state        |
| What they OWN                      | `isBeyonder + pathwayId` guessed it           | trusted mechanical profile |
| Whether they MAY die               | canon figures could die before appearing      | canon mortality policy     |
| Which characteristic is which      | name-keyed items, one name = many objects     | `unitId`                   |
| Whether an application already ran | React-side, crash-window duplication          | receipt fingerprints       |

Two rules run through everything: **fail closed** (ambiguity never authorizes a
reward — a missing mortality policy means protected, unknown ownership means no
drop) and **the AI never supplies mechanics** (profiles come from the curated
catalogue or an engine-owned versioned generator; deaths from authorized commands).

## Owner amendments to the ratified plan

1. **Drop form.** A normal death precipitates the raw `main-ingredient`
   characteristic. A **loss-of-control (Rampager) death** may instead leave it
   bound in a **fused mystical item** carrying the same `unitId` — "_or it could be
   a mystical artifact that requires sealing_" (ch. 218) — which yields the original
   characteristic when purified or destroyed (wiki _Sealed Artifact_: "_if purified
   or destroyed, will result in the original Beyonder Characteristic_"). No Church
   grade or catalogue code is claimed at drop time (grades are after-the-fact
   designations), so a fused drop is **never** category `sealed-artifact` and the
   "sealed artifacts are never minted freely" guard stands. Modelled as
   `CharacteristicItemMetadata.form`; a fused unit is not advancement- or
   artifice-usable until purified back to `"raw"`, keeping its `unitId`.
2. **Corpus pins.** The Devil Dog is **Sequence 6 "Devil"** of the Abyss pathway
   (its encounter band may span 6–7; the precipitated unit is Seq 6). Hood Eugen's
   Sequence 7 is rendered **"Psychiatrist"** (Visionary is the pathway).
3. **Ambiguous legacy items** get a one-time trusted re-identification path rather
   than being silently neutered.
4. Re-baselined after issue #226 merged (the validated in-turn transaction channel
   is the transport the non-combat death intent reuses).
5. Phased delivery, each phase passing the full Pre-Commit Checklist alone.

## Domain model

Types live in `src/lib/types/entities.ts` (plus `CharacteristicUnitId` /
`CharacteristicItemMetadata` / `Item.characteristic?` in `src/lib/types/rules.ts`).

- **`EntityRegistryState`** — the sole identity and life-state authority.
  `AuthoritativeEntityRecord` carries display name, aliases, kind, `lifeState`,
  protections, profile state, and the ID's provenance. Roster, presence, society,
  person-Codex, and combat records become foreign keys to `entityId`. Aliases need
  not be unique: resolution answers `resolved | not-found | ambiguous`, and **no
  mechanical API accepts a name**.
- **`EntityMechanicalProfileState`** — `unknown` (the default) or `known` with a
  PERSISTED `MechanicalProfileSnapshot`, so a later catalogue or generator change
  cannot rewrite an existing save. `CharacteristicOwnership` is the only thing that
  authorizes a drop; `CombatProfile.isBeyonder` / `pathwayId` stay combat- and
  intel-only. Provenance is curated, generated (versioned + seeded), hunt, or
  trusted script — never an AI response.
- **`CanonMortalityPolicy`** — `mortal-after` (curated `minCanonPosition`, active
  epochs, allowlisted command sources) or `protected`. A missing or malformed
  policy resolves to protected, and `"narrative-intent"` is not allowlisted for
  canon figures: prose may describe a death, only an engine command applies one.
- **`EntityDeathRecord`** — idempotent per `(applicationId, entityId)`. Unrecovered
  precipitation lives here, not in the ledger, so a characteristic that fell out of
  reach is still real and still recoverable later.
- **`PrecipitatedCharacteristicUnit` / `CharacteristicItemMetadata`** — one
  `unitId` is both the precipitated unit and the identity of the item recovered
  from it. There is no separate item id, so a characteristic is consumed, traded,
  or lost exactly once.
- **`WorldEventState`** — death records, application receipts, legacy-combat
  reconciliations, and the journal outbox for one save.
- **`GameDomainEvent`** — the engine's output contract. Mechanical payload only;
  memory facts, journal rows, the after-action report, and the on-screen aftermath
  are formatted FROM events by adapters, never fed back in.

The ledger keeps its #212 meaning: `WorldCharacteristicLedger` is cumulative
player-**recovery** history, not a census, not current custody.

## Custody

Precipitation is recorded on any authorized death. Only player custody permits
recovery into inventory.

| Situation                                             | Death & precipitation                                       | Immediate recovery                                                      |
| ----------------------------------------------------- | ----------------------------------------------------------- | ----------------------------------------------------------------------- |
| Lethal victory, mortality allowed, no control failure | yes, if ownership known                                     | yes — field control                                                     |
| Lethal victory, canon/protection blocks the death     | no; entity stays alive                                      | no                                                                      |
| Victory plus survivable setback                       | death persists                                              | no — setback denies control                                             |
| Victory plus transformation                           | death persists                                              | no                                                                      |
| Fatal tactical victory, both deaths allowed           | `mutual-destruction`                                        | no                                                                      |
| Fatal tactical victory, enemy death blocked           | enemy alive; player failure proceeds                        | no                                                                      |
| Defeat / escape / stalemate                           | combat does not kill the enemy                              | no combat custody                                                       |
| **Loss-of-control death of the carrier**              | yes — the unit **may precipitate in `fused-mystical` form** | per the row above; a recovered fused unit needs purification before use |
| Another faction holds the remains                     | yes                                                         | no; faction recorded                                                    |
| Distant / off-screen death                            | yes                                                         | no                                                                      |
| AI current-scene death intent                         | only after identity + mortality validation                  | custody unresolved                                                      |
| Trusted scripted death                                | after the same authorization                                | only with trusted presence/control evidence                             |
| Companion / ally death                                | yes when authorized                                         | same rules; roster and presence reconcile                               |
| Characteristic hunt                                   | yes                                                         | target and spoils only after exact source + custody validation          |
| Creature-material hunt                                | explicit characteristics precipitate independently          | material follows the same custody decision                              |
| Curated artifact carried as loot                      | no artifact-form precipitation                              | ordinary loot custody                                                   |

## Exactly-once: identifiers and receipts

Every identity is derived, never randomly minted
(`src/lib/game/stable-identifiers.ts`): `canon:<ref>`,
`encounter:<id>:enemy`, `hunt:<huntId>:quarry`,
`entity:<sessionId>:turn:<n>:intro:<i>`, `legacy:<sessionId>:<digest>:<n>`,
`combat:<encounterId>`, `turn:<sessionId>:<turn>:<intent>`,
`death:<applicationId>:<entityId>`, `unit:<deathId>:p<pathway>:s<seq>:<n>`. Colon
grammar is enforced; a blank or ambiguous component throws rather than silently
colliding, and free-form surfaces are normalized and digested rather than
interpolated.

Applications are guarded by a canonical fingerprint of the normalized MECHANICAL
plan (`src/lib/game/receipt-fingerprint.ts`): RFC 8785 canonical JSON + SHA-256
(synchronous, `@noble/hashes` pinned — Web Crypto's digest is async and the engine
is pure). Presentation is excluded by construction (prose, descriptions, display
names, labels, wall-clock, presentation array order), and set-like arrays are
canonical multisets — order-insensitive, multiplicity-significant. Same
application id + kind + fingerprint is a **duplicate** no-op; same id with
different mechanics, kind, or an unknown fingerprint schema is a **conflict** that
mutates nothing. Unrepresentable values (`undefined`, `NaN`, `Infinity`, a Date /
Map / Set / class instance) are refused rather than coerced.

## Journal identity, without a migration

Event-derived journal rows use a deterministic **UUIDv5**:

```
JournalEntry.id = uuidV5(
  UUID_URL_NAMESPACE,
  `https://github.com/xaenerys0/lotm-rpg/journal-entry/v1/${projectionKind}/${rootEventId}`,
)
```

`journal_entries.id` is already a UUID primary key that remote sync upserts on
(`onConflict: "id"`), so a retried or crash-replayed flush writes the same row.
No database migration and no `sourceEventId` column.

## Narrative policy

Free prose is never phrase-scanned, rejected, or discarded: `AIResponse.narrative`
is preserved exactly, figurative language included ("the old him died", "victory
was in her grasp"). Only STRUCTURED claims — death intents, Codex updates, journal
flags — are validated against accepted domain events, and a contradictory claim is
dropped while the deterministic, event-derived aftermath states the authoritative
result.

## Phases

1. **Immutable contracts** — `src/lib/types/entities.ts`, characteristic metadata
   in `rules.ts`, `stable-identifiers.ts` (deterministic IDs + UUIDv5),
   `receipt-fingerprint.ts` (RFC 8785 + SHA-256 + receipt matching), pinned
   `@noble/hashes`.
2. **Entity, profile & mortality foundation** (additive) — `entities.ts` registry,
   `entity-death.ts` authorization, `@/lib/lore/entity-profiles.ts` curated
   profiles and mortality policies. The registry rides along as an optional,
   strictly-validated session sub-state; authority does not move yet.

   Corpus gaps this phase deliberately leaves fail-closed, for a ruling rather
   than invention:

   - **Ownership** is authored only for the six corpus-confirmed named foes. The
     other seven bestiary entries (the lost-control rampager, the haunting evil
     spirit, the headless sea-cult creature, the sea-god zealot, the Feysac
     brigand, desperate thugs, the rogue monster) are generic filler with no
     canon individual behind them, so nothing is authored; a fight against one
     goes through the versioned generator (Beyonder-framed ⇒ its own rung;
     mundane ⇒ none; otherwise unknown).
   - **Mortality** is authored for those six plus the playable canon roster.
     Every other canon figure in `npcs.ts` — hundreds of dossiers, including the
     Sequence 0–4 gods, angels, and saints — has no policy and is therefore
     protected. `protectedBestiaryIds()` reports the bestiary side of that gap.
   - **Materials**: no `harvestableMaterials` are authored, since the corpus names
     none for these six.

3. **Serialization & legacy reconciliation** — session/combat v2, foreign-key
   authority flip, conservative legacy identity + characteristic migration, the
   ambiguous-item re-identification path, `preserve-session-no-replay` for a
   resolved legacy combat blob with no receipt, crash-safe storage clearing.
4. **Death, units, inventory & provenance** — `applyEntityDeath`, precipitation
   units, raw vs fused-mystical form and purification, exact `InventoryItemRef`
   operations across advancement, pathway switching, artifice, marketplace, and
   loss; unit-exact Convergence.
5. **Combat & receipt authority** — tactical outcome vs authorized fate,
   `mutual-destruction`, one pure combat transaction, thin React handoff.
6. **Hunts** — stable hunt/quarry ids, exact-unit allocation, exhaustive refusals.
7. **NPC & non-combat death** — a constrained `entity-death` intent on the #226
   transaction transport, the pure turn transaction, deterministic aftermath.
8. **Failure, journal & persistence hardening** — terminal state ↔ registry,
   UUIDv5 projection, outbox acknowledgment, cloud retry.
9. **End-to-end, documentation & gates.**

## Corpus discipline

Canon content (mortality policies, ownership stacks, sequence names, pathway
attributions, chapter positions) is verified against `corpus/` — `git lfs install
&& git lfs pull` first, since the corpus files are LFS pointers on a fresh clone.
Where the corpus is silent or ambiguous the entry fails closed (`protected` /
`unknown` / `known-none`) and the gap is reported for a ruling; nothing beyond what
the corpus supports is authored without the owner's approval.
