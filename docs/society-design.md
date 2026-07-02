# Society Tab — AI-Driven, Immersive, Canon-Grounded

The `/society` tab ("The Gathering") is AI-driven: the player's own BYOK provider
invents the society's identity, the slate of Beyonders to invite, the "summoning
above the gray fog" outcome, and the prose of each gathering — all heavily grounded
in the LOTM corpus but free to diverge. It supersedes the old fully-hardcoded
subsystem (issue #32), which drew members from a fixed 10-name tarot deck with vague
catalog "hints"/"arcs" and template intel.

The overriding discipline (shared with `generate`, `generateCodexRebuild`,
`generateCharacterIdentity`): **loose, forgiving parse in the AI layer → a single
strict validation/commit point in the pure game layer.** The engine
(`src/lib/game/society.ts`) owns every mechanic and is deterministic; the AI only
supplies text and dossiers. Every AI affordance is provider-gated with a working
deterministic fallback (the public e2e tier has no provider). Everything rides the
existing `game_sessions.data` JSONB — **no DB migration**.

## Locked design decisions

1. **Full world integration.** A recruited member is ALSO registered as a tracked
   ally (`joinRoster`, so they travel with the player and re-assert into scenes) and
   a Codex `person` entity (`applyCodexUpdate`, so the narrator holds them in
   `## Established Facts`). A canon figure you pull in (Audrey/Justice) is thereafter
   a real ally the story knows.
2. **Outgoing invitations only.** The player reaches out from their society to pull
   others in (the Sefirah Castle framing). There is no incoming-invitation subsystem.
3. **Free canon divergence.** Any corpus-appropriate canon figure is invitable at any
   time (no `canonPosition` timeline gate); invented NPCs are always available.

## Data model (`src/lib/game/society.ts`, additive + optional)

- `SocietyMember` gains `realName?`, `pathwayHintProse?`, `arcProse?`, `canonId?`,
  and `origin?: "canon" | "original" | "catalog"`. A legacy/deterministic member
  renders from the catalog indices (`pathwayHintId`/`arcId`); an AI-authored member
  has no catalog entry, so it **persists** its prose. `memberPathwayHint`/`memberArc`
  prefer the persisted prose, falling back to the catalog index — preserving the
  copy-edit-propagation property for catalog members.
- `SocietyState` gains `description?`, `ethos?`, `meetingPlace?` — the immersive
  fiction rendered by the panel; absent on a deterministically-founded society.
- `isValidSocietyShape` validates the new optional fields (string when present;
  `origin` a known literal). `migrateSocietyState` is **non-destructive** — an AI
  member (finite `arcId`/`pathwayHintId` = 0, plus prose) passes through untouched;
  legacy prose→id conversion is unchanged.

## Canon grounding (the anti-hallucination whitelist)

- `CANON_SOCIETY_MEMBERS: Record<SocietyKind, CanonCandidateSeed[]>` — corpus-verified
  seeds keyed by kind. `tarot-club` seeds the full roster (Justice/Audrey, The Hanged
  Man/Alger, The Sun/Derrick, The Magician/Fors, The Moon/Emlyn, The Hermit/Cattleya,
  The Star/Leonard, Judgment/Xio); `nighthawk-squad` seeds the Tingen team. The kinds
  with no clean corpus roster (church/pirate/scholars) draw wholly invented candidates.
  **Corpus caution honoured:** "The World" is the Fool's own second seat and
  "Death"/Azik is a planted false rumour — neither is a member, so neither appears.
- `canonCandidateSeeds(kind, { excludeCanonIds, excludeSelfId })` returns the seeds
  the AI enriches, minus anyone already seated and the player's own canon id.
- `commitInvitedMember` is the single strict commit point: it keeps a `canonId` ONLY
  when it matches an engine seed for this kind (else commits as an `"original"` with
  no `canonId`), and rejects a duplicate canon figure or a full table.
- `CANON_SOCIETY_FOUNDERS` + `seedCanonSociety(canonCharacterId)` pre-found a canon
  **convener's** society (Klein → the empty Tarot Club, bypassing the Seq-gated
  `foundSociety`); `null` for a non-founder (they use the invitation mechanic).
  Wired into `createCanonCharacterSession` (`canon-takeover.ts`).

## AI generation (`src/lib/ai/society-generation.ts` + `client.ts` shells)

Four pure prompt+parse pairs (rules-free, lore-free — the caller passes plain
strings), each with a `generateSociety*` network shell reusing the shared
`generateStructured` routine-model loop (corrective parse-retry, `null`/`[]` on
exhaustion):

| Generator                   | Purpose                                                    | Fallback when no provider             |
| --------------------------- | ---------------------------------------------------------- | ------------------------------------- |
| `generateSocietyIdentity`   | name/description/ethos/meeting place                       | deterministic `foundSociety` name     |
| `generateSocietyCandidates` | slate of canon seeds + invented NPCs                       | `recruitMember` (random catalog seat) |
| `generateInvitationOutcome` | the summoning + accept/decline verdict                     | — (only reached with a provider)      |
| `generateGathering`         | scene prose + one intel line per sharer + traded-item name | engine template + `INTEL_LEADS`       |

`holdGathering` gains `sharers: string[]` (who shared, one per fact — the engine's
decision); `applyGatheringNarration(outcome, narration)` overlays AI prose onto the
deterministic outcome (narrative → scene seed, intel lines → fact descriptions
positionally, traded name → the item the engine already granted; it can never MINT
an item the engine withheld).

## UI (`src/components/game/society-panel.tsx`)

Provider-gated (loads `ProviderConfig` from localStorage) with `role="status"`/
`role="alert"` for async, ≥24px controls, and WCAG-AA badges/meters:

- **Founding:** "Suggest an identity (AI)" fills editable name/description/ethos/
  meeting-place; else the manual form.
- **Header:** renders the society's description/creed/meeting-place fiction.
- **Invitation:** "Seek someone to invite" → a candidate **slate** (canon/original
  badge, dossier) → "Extend the invitation" → AI summoning narration → accept commits
  (+ tracked-ally + Codex integration) / "Pass" dismisses. No provider → the slate
  step runs the deterministic recruit instead.
- **Gatherings:** the AI narrative + intel render when produced; the template prose
  otherwise. Intel still lands in `sessionFacts` + a `major-event` journal entry.

## Tests

- Engine: `src/lib/game/society.test.ts` (commit/seeds/founders/narration overlay/
  prose preference/validation/migration).
- AI prompt+parse: `src/lib/ai/society-generation.test.ts`; client shells in
  `src/lib/ai/ai.test.ts` (adapter-mocked).
- Canon seeding: `src/lib/game/canon-takeover.test.ts`.
- a11y: `src/test/a11y.test.tsx` (founding form + founded-society-with-member).
- e2e: `e2e/society.spec.ts` (authenticated tier — the no-provider found→invite→
  convene path).
