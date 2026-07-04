# Phase 5: Character Encounter Registry Planning

> **Implementation status:** Steps 1–4 and 6–7 completed. Tier 1 entries added,
> encounter registry type/gates implemented, and corpus extraction scripts created.
> Tier 2 remains pending a full corpus sweep.

## Part A: Extended LoreEntry Type

Proposed extended type for `src/lib/lore/types.ts`:

```typescript src/lib/lore/types.ts
import type { LoreCategoryEnum } from "@/lib/types/database";
export type LoreCategory = LoreCategoryEnum;
export interface LoreEntry {
  slug: string;
  title: string;
  category: LoreCategory;
  content: string;
  pathway?: string;
  epoch?: number;
  city?: string;
  npcs: string[];
  sequences: number[];
  tags: string[];
  tokenCount: number;
  // When undefined or true: the AI uses this for narrator accuracy but should not
  // treat it as information the player character already possesses. Set to false
  // only for entries describing genuinely public knowledge (geography, era context).
  narratorOnly?: boolean;
  // === ENCOUNTER REGISTRY FIELDS (Issue #213) ===
  /**
   * Encounter configuration for making characters encounterable (issue #213).
   * Absent = no special encounter rules (uses default city/pathway injection).
   */
  encounterConfig?: {
    /** Earliest chapter in the novel when this character appears. Used for spoiler gating. */
    earliestChapter?: number;
    /**
     * Latest chapter this character should appear without spoilers.
     * Absent = no upper limit (safe for all post-introduction play).
     */
    latestChapter?: number;
    /**
     * Specific locations beyond city-level (e.g., "backlund-empress-borough", "tingen-nighthawks-headquarters").
     * If absent, city-level matching applies.
     */
    specificLocations?: string[];
    /**
     * Faction affiliations that gate encounters. Player must be affiliated
     * (via GameState.factions) to encounter this character naturally.
     * Examples: "tarot-club", "aurora-order", "nighthawks", "moses-ascetic-order"
     */
    factionGates?: string[];
    /**
     * Minimum player sequence to encounter this character naturally.
     * Used for high-sequence figures who shouldn't appear to Sequence 9 players.
     */
    minPlayerSequence?: number;
    /**
     * Characters this NPC requires the player to have met first.
     * Enables relationship-based gating (e.g., "must meet Roselle before Bernadette").
     */
    requiresPriorEncounter?: string[]; // slugs of other NPCs
    /**
     * How frequently this character should appear when conditions are met.
     * Higher = more likely. Default = 1.0. Story-critical figures = 2.0+.
     */
    encounterWeight?: number;
    /**
     * Type of encounter. 'story-critical' = always inject if conditions met.
     * 'optional' = weighted selection. 'rare' = low probability, special occasions.
     */
    encounterType?: "story-critical" | "optional" | "rare";
    /**
     * Epochs when this character can be encountered.
     * Defaults to entry's `epoch` field if absent.
     * Useful for characters who span multiple epochs (e.g., Azik Eggers).
     */
    activeEpochs?: number[];
  };
}
```

**Confidence Level: 75%**

- ✅ Confident this solves the immediate problem
- ⚠️ Uncertain if all edge cases are covered (dream encounters, historical projections, possession scenarios)
- ✅ `encounterConfig` is implemented as a separate `EncounterConfig` interface in `src/lib/lore/types.ts`

---

## Part B: Full Corpus Sweep — Character Discovery Strategy

### Recommended Approach: Multi-Method Extraction

Given the corpus structure (XML wiki dump + EPUB novel), I recommend:

#### Method 1: Wiki XML Parsing (Primary)

Parse `corpus/wiki/lordofthemystery_pages_current.xml` to extract:

- Character infoboxes (pathway, sequence, affiliation, status)
- Page view counts (proxy for importance)
- Category tags (identifies "Character" pages)

**Implementation:**

```bash
# Extract character page titles with occurrence counts
grep -c '<page>' corpus/wiki/lordofthemystery_pages_current.xml
# Parse Character-category pages with pathway/sequence data
```

**Confidence: 85%** — Wiki has structured data, but XML parsing in TypeScript needs a library or custom parser.

#### Method 2: Novel EPUB Text Mining (Secondary)

Search `corpus/novel/LordofMysteriesCuttlefishTha1.EPUB` for:

- Character name frequency (names appearing >10 times = noteworthy)
- Chapter ranges (first/last appearance)
- Context analysis (protagonist vs. mentioned-in-passing)

**Implementation:**

```bash
# Unzip EPUB and search for name patterns
unzip -p corpus/novel/*.epub *.xhtml | grep -o '[A-Z][a-z]\+ [A-Z][a-z]\+' | sort | uniq -c | sort -rn
```

**Confidence: 70%** — EPUB is XML-based (XHTML), parsing is feasible but name disambiguation is hard (e.g., "Klein" could be Klein Moretti or other Kleins).

#### Method 3: Cross-Reference with Existing Entries (Validation)

Compare extracted names against:

- `src/lib/lore/npcs.ts` existing entries
- `src/lib/lore/history.ts` historical figures
- `src/lib/lore/canon-characters.ts` playable characters

**Confidence: 95%** — Straightforward set comparison.

---

### Corpus Verification Workflow

For each discovered character:

1. **Extract from Wiki:**
   - Pathway and sequence (from infobox)
   - Affiliations (organizations, families)
   - First appearance chapter
   - Status (alive/dead/unknown)
   - Relationships (family, mentors, enemies)
2. **Verify from Novel:**
   - Confirm pathway/sequence at introduction point
   - Identify starting location
   - Note key relationships visible at introduction
   - Determine if they're "more than a mention" (>5 appearances in first 50 chapters after introduction)
3. **Create Entry:**
   - Slug: `npc-{character-name-lowercase-hyphenated}`
   - Title: `{Name} — {Brief descriptor}`
   - Content: Corpus-grounded, spoiler-bounded to introduction
   - Tags: Pathway, affiliations, location, role
   - Token count: 200-250 (consistent with existing entries)

**Confidence: 90%** — This workflow ensures corpus verification as required by issue #213.

---

## Part C: Character Priority List

### Tier 1: Issue #213 Explicit Gaps (Must-Have)

| Priority | Character             | Pathway                  | Est. Seq    | Location               | Why Critical                                                      |
| -------- | --------------------- | ------------------------ | ----------- | ---------------------- | ----------------------------------------------------------------- |
| 1        | **Roselle Gustav**    | Black Emperor → Multiple | 0           | Trier (Intis)          | First transmigrator, Diary drives half the plot, Phase 3 exemplar |
| 2        | **Hidden Sage**       | Hermit                   | Quasi-0     | Moses Ascetic Order    | Seq-0 Hermit antagonist, whispers to pathway members              |
| 3        | **Zaratul**           | Fool                     | 1 (botched) | Intis/Secret Order     | Prophet whose predictions drive arcs, Secret Order founder        |
| 4        | **Bethel Abraham**    | Door                     | 1           | Abraham Family         | Seq 1 Door, founder of modeled Abraham Family                     |
| 5        | **Bernadette Gustav** | Hermit                   | 2           | At sea / Mystic Island | Roselle's daughter, major Hermit pathway figure                   |
| 6        | **Mr. K**             | Unknown                  | Unknown     | Aurora Order           | Aurora Order Oracle, major sequel hook                            |
| 7        | **Anderson Hood**     | Unknown                  | High        | Fog Sea                | Strongest Fog Sea hunter, Edwina's friend                         |
| 8        | **Colin Iliad**       | Twilight Giant           | 4-5         | City of Silver         | City of Silver council chief, Derrick's mentor                    |
| 9        | **Lovia Tiffany**     | Shepherd                 | 4-5         | City of Silver         | City of Silver council elder                                      |

**Confidence: 95%** — These are explicitly listed in issue #213 as "genuine gaps."

### Tier 2: High-Frequency Characters (Corpus Sweep Results)

_To be populated after running the corpus extraction scripts._

Expected candidates based on preliminary review:

- **Cattleya** (already has entry — verify completeness)
- **Alger Wilson** (already has entry — verify completeness)
- **Trissy** (mentioned in canon-characters test — check if has NPC entry)
- **Xio Derecha** (mentioned in canon-characters test — check if has NPC entry)
- **Reinette Tinekerr** (mentioned in Sharron's entry — may need own entry)
- **Pallez Zoroast** (mentioned in Leonard's entry — Angel-level Error pathway)
- **Arianna** (already has entry — verify completeness)

**Action Required:** Run full corpus sweep to generate complete Tier 2 list.

---

## Part D: Implementation Steps

### Step 1: Extend Type Definitions

**File:** `src/lib/lore/types.ts`

- Add `encounterConfig` field to `LoreEntry` interface
- Create `EncounterConfig` interface for better type organization

**Estimated effort:** 30 minutes  
**Confidence:** 95%

### Step 2: Update Selection Logic

**File:** `src/lib/lore/selection.ts`

- Modify `selectCuratedLore()` to consider `encounterConfig`
- Add encounter-specific filtering (chapter gates, faction gates, sequence gates)
- Ensure epoch gate logic works with `activeEpochs` field

**Estimated effort:** 2-3 hours  
**Confidence:** 80% — May need iteration based on testing

### Step 3: Create Corpus Extraction Scripts

**Files:** `scripts/corpus/extract-wiki-characters.ts`, `scripts/corpus/extract-novel-names.ts`, `scripts/corpus/generate-character-report.ts`

- Parse wiki XML for character pages
- Extract infobox data (pathway, sequence, affiliations)
- Count name occurrences in novel EPUB
- Generate CSV/report of characters without entries

**Estimated effort:** 4-6 hours  
**Confidence:** 70% — XML/EPUB parsing may have edge cases

### Step 4: Populate Tier 1 Character Entries

**File:** `src/lib/lore/npcs.ts`

- ✅ Added 9 entries for Tier 1 characters (slugs `npc-roselle-gustav`, `npc-hidden-sage`, `npc-zaratul`, `npc-bethel-abraham`, `npc-bernadette-gustav`, `npc-mr-k`, `npc-anderson-hood`, `npc-colin-iliad`, `npc-lovia-tiffany`)
- Each entry carries an inline `// CORPUS:` citation comment
- Each entry includes `encounterConfig` with appropriate gates

**Estimated effort:** 6-8 hours (including corpus verification)  
**Confidence:** 90%

### Step 5: Populate Tier 2 Character Entries

**File:** `src/lib/lore/npcs.ts`

- Run `pnpm corpus:wiki-characters` and `pnpm corpus:novel-names` to populate `scripts/.cache/`
- Run `pnpm corpus:character-report` to generate the ranked Tier 2 candidate list
- Add entries for high-frequency characters from the report
- Prioritize by appearance count and plot importance

**Estimated effort:** TBD (depends on Tier 2 list size)  
**Confidence:** TBD

### Step 6: Update Tests

**Files:**

- `src/lib/lore/selection.test.ts` — added `passesActiveEpochGate` and `passesEncounterGate` unit tests
- `src/lib/lore/encounters.test.ts` — new file covering Tier 1 existence and `encounterConfig` integrity
- `src/lib/lore/lore.test.ts` — existing data-integrity tests cover new entries (slugs, token counts, categories)

**Test cases to add:**

1. Every Tier 1 character has an NPC entry
2. Every NPC entry with `encounterConfig` has valid gates
3. `earliestChapter` values match corpus data
4. No duplicate slugs (existing test — ensure it covers new entries)
5. Token counts within range (existing test — ensure it covers new entries)
6. Encounter weight distribution is reasonable
7. Faction gates reference valid factions

**Estimated effort:** 3-4 hours  
**Confidence:** 90%

### Step 7: Documentation Updates

**Files:**

- `.github/ISSUE_TEMPLATE/` (if encounter config warrants template updates)
- `CLAUDE.md` or relevant docs (corpus verification process)
- Code comments in `types.ts` and `selection.ts`

**Estimated effort:** 1 hour  
**Confidence:** 95%

### Step 8: Pre-Commit Checklist

Per issue requirements:

- [x] Run `/code-review --fix` before PR (or manual review)
- [x] Lore tests pass (`src/lib/lore/selection.test.ts`, `src/lib/lore/encounters.test.ts`, `src/lib/lore/lore.test.ts`)
- [x] Typecheck passes for changed files (`src/lib/lore/*`, `scripts/corpus/*`)
- [x] Lint passes
- [x] Format:check passes
- [ ] E2E tests for user-facing flows (no user-facing UI changes in this phase)
- [ ] DB migrations (none — `encounterConfig` is a TypeScript-only prompt flag, like `narratorOnly`)

> **Note:** `pnpm typecheck` still reports one pre-existing error in
> `src/components/game/game-sidebar.tsx` (Next.js typed-routes `LinkProps`
> mismatch). That file was not modified by this phase; the error is unrelated to
> the encounter registry work.

**Estimated effort:** 1-2 hours  
**Confidence:** 95%

---

## Part E: Risks & Mitigations

### Risk 1: Corpus Parsing Complexity

**Problem:** Wiki XML and EPUB formats may be harder to parse than expected.  
**Mitigation:** Start with simple grep-based extraction, escalate to proper parsers only if needed. Use existing tools (`xmllint`, `pandoc`) if available.  
**Confidence in mitigation:** 85%

### Risk 2: Spoiler Gating Bugs

**Problem:** Incorrect chapter gates could leak future-arc spoilers.  
**Mitigation:**

- Double-verify all `earliestChapter` values against corpus
- Add tests that verify no entry with chapter > N appears for players at position < N
- Manual review of all gates before merge  
  **Confidence in mitigation:** 90%

### Risk 3: Performance Impact

**Problem:** Adding many entries + encounter filtering could slow lore selection.  
**Mitigation:**

- Benchmark before/after with realistic token budgets
- Optimize filtering logic if needed (early exits, indexed lookups)
- Consider lazy-loading encounter configs  
  **Confidence in mitigation:** 80%

### Risk 4: Scope Creep

**Problem:** Full corpus sweep could identify 50+ characters, making this phase too large.  
**Mitigation:**

- Set a cap for Phase 5 (e.g., Tier 1 + top 20 from Tier 2)
- Defer remainder to Phase 6 (Follow-up consolidation)
- Document deferred characters with priority rankings  
  **Confidence in mitigation:** 95%

---

## Part F: Questions Remaining — With Recommendations

Below are the planning decisions requested, plus my recommendations and where I am least confident about each.

### 1. Scope Cap: "Attempt more"

**Interpretation:** Phase 5 should not be artificially capped at Tier 1 + top 20 if the corpus sweep surfaces more than a handful of additional worthwhile characters. We should attempt a broader population than the conservative cap, while still using sensible thresholds to avoid drowning in one-off mentions.

**Recommendation:**

- Include all **Tier 1 characters (9 entries)** unconditionally.
- After the corpus sweep, include any Tier 2 character who meets **both** of these thresholds:
  - Novel name frequency ≥ **20 mentions**, **and**
  - Wiki page exists in the character category (or is cross-referenced from a main character's wiki page).
- Additionally, include any character listed in `canon-characters.ts` who does not yet have a dedicated NPC entry, regardless of corpus frequency.
- Soft target: **Tier 1 + roughly 25–40 Tier 2 entries** for this phase. Defer anyone below the threshold to Phase 6.

**Why:**

- The user explicitly wants to "attempt more," so a hard top-20 cap is too conservative.
- The combination of ≥20 novel mentions + wiki presence filters out passing mentions while capturing most characters that are actually encounterable.
- Pulling in missing `canon-characters.ts` entries keeps the test suite and the lore registry consistent.

**Least confident about:**

- The ≥20 mention threshold. Without running the extraction first, I cannot tell whether this yields 15 characters or 80. If it produces too many, we may need to raise the threshold or add a plot-importance override.
- "Attempt more" could be read as "include everyone who isn't a one-off." I am choosing a middle interpretation rather than a truly exhaustive sweep.

---

### 2. Corpus Script Location: "Whatever you deem most appropriate"

**Recommendation:** Place extraction scripts under **`scripts/`** (e.g., `scripts/extract-wiki-characters.ts` and `scripts/extract-novel-names.ts`), and make them runnable with `npx tsx` or as package scripts in `package.json`. Keep any temporary corpus-derived artifacts (CSVs, reports) in `scripts/.cache/` or a dedicated `corpus-analysis/` directory that is `.gitignore`d.

**Why:**

- `scripts/` is already the conventional location for repo tooling in this project (per the planning doc assumptions).
- TypeScript scripts can reuse existing repo types and utilities, and `tsx` keeps the runtime simple without compiling.
- Storing generated artifacts outside `src/` avoids polluting the application bundle.

**Least confident about:**

- I have not yet verified whether `scripts/` already exists or whether the project uses `tsx`. If it uses a different runner (e.g., `ts-node`, `bun`, or compiled scripts), the recommendation should be adjusted to match existing conventions.
- If the corpus files are very large, a Node/TypeScript parser may be slow; a Python script might be more pragmatic. I would only switch to Python if performance becomes a blocker.

---

### 3. Encounter Config Complexity: Provide recommendations with reasons

**Recommendation:** Implement the **full proposed schema immediately**, but treat most fields as optional. Default any missing numeric values in selection logic (`encounterWeight` → 1.0, `activeEpochs` → `[entry.epoch]`, etc.). Do not add a separate minimal phase.

**Why:**

- The full schema is already well-scoped and maps directly to the gates described in issue #213 (chapter, faction, sequence, location, relationship, weight, type, epoch). Implementing it now prevents a second refactor of `selection.ts` later.
- Because every field is optional, Tier 1 entries can start simple (e.g., only `earliestChapter`, `encounterWeight`, `encounterType`) without breaking the type contract.
- The schema is additive: callers who do not use a field are unaffected.

**Least confident about:**

- Whether `encounterType: 'story-critical'` will interact cleanly with the existing lore token budget. "Always inject if conditions met" can starve other lore if too many entries are marked story-critical. I recommend starting with very few story-critical entries and validating with tests.
- The `requiresPriorEncounter` relationship graph could become tricky to validate (cycles, missing slugs). I am confident the type is useful, but less confident that the validation logic will be trivial.

---

### 4. Tier 2 Prioritization: Name frequency first, subjective plot importance, wiki page size

**Recommendation:** Use a **scored combination** in the exact order requested:

1. **Name frequency in novel** (primary sort, normalized by total mentions).
2. **Subjective plot importance** (manual override tier: e.g., 3 = story driver, 2 = faction leader or recurring ally, 1 = notable but minor).
3. **Wiki page size / infobox completeness** (tiebreaker — larger, more complete pages indicate more canonical detail to draw from).

Formula for ranking:

```
score = normalized_novel_frequency * 0.5 + plot_importance_score * 0.35 + normalized_wiki_size * 0.15
```

Then filter by the thresholds in §1 and sort descending.

**Why:**

- Novel frequency is objective and directly reflects how likely a player is to meet or hear about the character.
- Subjective plot importance prevents over-weighting background characters who are mentioned often but never matter (e.g., servants, recurring city guards).
- Wiki page size is a useful sanity check / tiebreaker because it correlates with how much verifiable detail we can put into the entry.

**Least confident about:**

- The exact weights. 50/35/15 is a reasonable starting point, but the right balance depends on the actual distribution of frequencies and wiki sizes. I would run the sweep first, inspect the rankings, and tune weights before locking them in.
- Subjective plot importance is inherently biased. To reduce bias, I recommend defining rubric tiers (e.g., "appears in a Tarot Club meeting," "named in a prophecy," "has a POV chapter") rather than gut-feel ratings.

---

### 5. Verification Standard: Provide recommendations with reasons

**Recommendation:** Adopt a **tiered verification standard** rather than an all-or-nothing one:

- **Hard requirement:** Every fact that gates an encounter (`earliestChapter`, `minPlayerSequence`, `factionGates`, `city`, `pathway`, `epoch`) must be traceable to the corpus and have an inline citation comment.
- **Recommended:** Major biographical claims in the `content` field should also cite a source, but a single reliable source (wiki or novel) is acceptable.
- **Acceptable:** Flavor text, brief descriptors, and "public knowledge" framing may use "reasonable confidence" without a per-sentence citation, as long as they are spoiler-bounded to the character's introduction.

Use inline comments like:

```typescript
// CORPUS: wiki "Roselle Gustav", novel Vol. 1 ch. 15-20
```

**Why:**

- Encounter gates are the pieces most likely to cause spoilers or broken logic if wrong, so they deserve the strictest standard.
- Requiring citations for every sentence of prose would make the file noisy and slow to write without much practical benefit.
- A concise citation comment is easy to audit during code review and can be checked by a future test.

**Least confident about:**

- Whether we can reliably map novel references to chapter numbers. EPUB chapter numbering may not match fan/wiki chapter numbers. I recommend normalizing to the wiki chapter scheme and documenting the mapping.
- Whether citation comments will be kept up to date over time. They add value only if enforced in review; without enforcement they will drift. I suggest a lightweight test that fails if `encounterConfig` is present but lacks a `// CORPUS:` comment.

---

## Summary & Next Steps

### Recommended Path Forward:

1. ✅ **Approve Option 1** (extend `npcs.ts` with `encounterConfig`)
2. ✅ **Authorize full corpus sweep** using multi-method approach
3. ⏳ **Decide on scope cap** for Phase 5
4. ⏳ **Decide on verification standard** strictness
5. 📝 **Create corpus extraction scripts** once approach is approved
6. 📝 **Populate Tier 1 entries** with corpus-verified data
7. 📝 **Run corpus sweep** to generate Tier 2 list
8. 📝 **Update tests** and documentation
9. ✅ **Run `/code-review --fix`** before PR

**Total Estimated Effort:** 20-30 hours (excluding Tier 2 population, which depends on scope decision)
