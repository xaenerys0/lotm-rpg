# Cloud Migration & Storage Research

_Research note — the concern is **browser-local state**: game data that lives
only in the player's browser (localStorage / IndexedDB) with no cloud copy.
This documents exactly what is local, what is at risk, what it takes to move it
to Supabase, and the storage/free-tier picture. Storage keys and the "source of
truth?" column are read directly from the code, not estimated._

## TL;DR

**A player's entire game progress lives only in their browser.** `persistSession()`
writes the full `GameSession` (character, sequence level, inventory, quests,
identity, anchors, sanity/digestion, everything) to `localStorage` and nowhere
else (`src/lib/react/session-store.ts:129–136`). There is **no `game_sessions`
table** in Supabase — the schema has `profiles`, `journal_entries`,
`market_listings`, `player_showcases`, `world_messages`, and the RAG tables, but
**nothing that stores a character save**. If a player clears their browser,
switches devices, or loses their machine, **their characters are gone with no
recovery path.**

**Some things are already in the cloud.** Journal, marketplace, showcases, and
world messages already sync to Supabase tables — those are safe. The gap is the
core save data and a handful of smaller local-only items.

**Moving it to the cloud is a contained piece of work**, not a rebuild: add a
`game_sessions` table (+ small metadata), write a thin sync layer that mirrors
the existing localStorage calls, and keep localStorage as an offline cache. The
data is tiny — a few hundred KB per player — so it fits Supabase's free tier
with enormous headroom. **API keys must stay browser-only** (BYOK security
boundary) and are the one thing that should _not_ move.

---

## 1. What's actually in browser storage (verified inventory)

Read/write sites confirmed in code. "Source of truth?" = is the browser the
**only** copy, or a mirror of a Supabase table?

| State                                         | Mechanism    | Key                                    | Only copy?                 | Cloud table today                           | Where                     |
| --------------------------------------------- | ------------ | -------------------------------------- | -------------------------- | ------------------------------------------- | ------------------------- |
| **Full character save** (`GameSession`)       | localStorage | `lotm-rpg-session-{id}`                | 🔴 **Browser-only**        | ❌ none                                     | `session-store.ts:129`    |
| **Session index** (list of saves)             | localStorage | `lotm-rpg-session-index`               | 🔴 Browser-only            | ❌ none                                     | `session-store.ts:68`     |
| **Active character pointer**                  | localStorage | `lotm-rpg-active-session`              | 🔴 Browser-only            | ❌ none                                     | `session-store.ts:112`    |
| **Legacies / Echoes** (cross-timeline memory) | localStorage | `lotm-rpg-legacies`, `lotm-rpg-echoes` | 🔴 Browser-only            | ❌ none                                     | `lib/game/constants.ts`   |
| **Prologue draft** (creation in progress)     | localStorage | `lotm-rpg-prologue-draft`              | 🟡 Browser-only, transient | ❌ none                                     | `prologue-draft.ts:53`    |
| **In-progress combat**                        | localStorage | `lotm:combat:{id}`                     | 🟡 Browser-only, ephemeral | ❌ none                                     | `game-loop.tsx:197`       |
| **Preferences** (UI toggles)                  | localStorage | `lotm-rpg-preferences`                 | 🟡 Browser-only            | ❌ none                                     | `preferences-store.ts:15` |
| **First-time hint dismissals**                | localStorage | `lotm-rpg-hint-{id}`                   | 🟡 Browser-only            | ❌ none                                     | `first-time-hint.tsx`     |
| **Journal entries + annotations**             | localStorage | `lotm-rpg-journal-{id}`                | 🟢 **Mirror**              | ✅ `journal_entries`, `journal_annotations` | `journal-sync.ts:94`      |
| Marketplace / showcases / world messages      | (fetched)    | —                                      | 🟢 Cloud-authoritative     | ✅ respective tables                        | `*-sync.ts`               |
| **Token-usage estimate**                      | localStorage | `lotm:usage:{id}`                      | ⚪ Informational           | ❌ (not needed)                             | `game-loop.tsx:228`       |
| **Provider config + API key**                 | localStorage | `lotm-rpg-provider-config`             | 🔒 **Must stay local**     | ❌ (by design)                              | `provider-config.tsx:186` |
| **Model catalog cache**                       | localStorage | `lotm-rpg-models-cache:*`              | ⚪ Cache (24h TTL)         | ❌ (not needed)                             | `provider-config.tsx:113` |
| **Scene-art images**                          | IndexedDB    | `lotm-rpg-scene-art` / `images`        | ⚪ Cache (regenerable)     | ❌ (optional)                               | `scene-art-cache.ts:7`    |

Legend: 🔴 at-risk, no backup · 🟡 local-only but low-stakes · 🟢 already safe ·
🔒 must stay local · ⚪ cache, fine to lose.

---

## 2. The three buckets

### 🔴 At-risk — browser-only, must move to the cloud

- **Character saves** + **session index** + **active pointer** — the whole game.
  Losing the browser loses every character. This is _the_ problem.
- **Legacies / Echoes** — cross-timeline world memory; meant to outlive a single
  character, so losing them is a real (if smaller) regression.

### 🟡 Browser-only but low-stakes — move opportunistically

- **Preferences** and **hint dismissals** — worth syncing so settings follow the
  player across devices, but not data-loss-critical.
- **Prologue draft** and **in-progress combat** — transient/ephemeral; nice-to-
  have resumability, not required for durability.

### 🟢 / 🔒 / ⚪ Already safe, or intentionally local

- **Journal, marketplace, showcases, world messages** — already Supabase-backed;
  localStorage is just a mirror. Nothing to do.
- **Provider API keys** — BYOK boundary: keys go browser → provider directly and
  must **never** touch our servers. Do not move. (You _could_ sync the non-secret
  provider/model _choice_ without the key.)
- **Model cache, scene-art cache, token-usage estimate** — regenerable caches;
  leave local.

---

## 3. What it takes to move the at-risk data to Supabase

This is additive and mirrors the existing journal-sync pattern (`journal-sync.ts`)
— not a rewrite.

**a. Schema — one new migration.** A `game_sessions` table:

```
game_sessions
  id           uuid  primary key        -- the existing session id
  user_id      uuid  references auth.users  -- owner
  data         jsonb                     -- the serialized GameSession
  summary      jsonb / generated cols    -- name, pathway, sequence (for the switcher)
  is_active    boolean                   -- replaces lotm-rpg-active-session
  updated_at   timestamptz
-- RLS: owner-only select/insert/update/delete (same pattern as journal_entries)
```

The session index and active pointer collapse into rows of this table
(`where user_id = auth.uid()`, `is_active = true`). Optionally a tiny
`world_memory` table (or per-user column) for legacies/echoes; and
`user_preferences` for the 🟡 items.

**b. Sync layer — thin wrapper around the existing calls.** `persistSession()`
already centralizes every save (`session-store.ts:129`). Add a best-effort
`upsert` to `game_sessions` right beside the localStorage write, and a
load-on-login that pulls the user's rows into localStorage. Keep localStorage as
the **offline cache / fast read** so the engine stays pure and the app still
works offline — Supabase becomes the durable source, localStorage the mirror
(the inverse of today, and exactly how journal already works).

**c. Conflict handling.** Last-write-wins on `updated_at` is enough for a
single-player save (one human, maybe two devices). No CRDT needed.

**d. Keep `database.ts` in sync** (per the repo's pre-commit checklist item 7)
and add RLS tests.

**Net:** one migration, one sync module (~journal-sync sized), wire it into
`persistSession`/`loadActiveSession`, plus the login-time hydrate. No engine
changes — `@/lib/game` stays localStorage-free by design.

---

## 4. Storage footprint & free-tier fit

The save data is **tiny** — this is not a capacity problem.

| Data                                  | Per player           | Notes                  |
| ------------------------------------- | -------------------- | ---------------------- |
| Character save (`GameSession` JSON)   | ~5–200 KB each       | a few saves per player |
| Session metadata (index/active/prefs) | < 1 KB               |                        |
| Legacies / echoes                     | ~1–10 KB             |                        |
| **Per active player total**           | **well under ~1 MB** |                        |

Against **Supabase Free = 500 MB database**, that's room for **hundreds to low
thousands of players** before storage alone matters — and pgvector/RAG is the
larger consumer, not saves. Free-tier facts that actually bite here are
operational, not size:

- **7-day inactivity pause** on Supabase Free — a live game needs Pro (~$25/mo)
  to stay always-on; for a hobby/personal build, Free is fine.
- **5 GB egress/mo** on Free — saves are small, so this is comfortable.
- pgvector and the corpus already fit Free (see the infra section below).

So moving local data to the cloud **does not** push you off the free tier on
size; the only reason to pay is keeping the project warm + backed up.

---

## 5. Recommended path

1. **Ship `game_sessions` + sync first** — this closes the only real data-loss
   hole (character saves). Everything else is gravy.
2. **Fold in `user_preferences`** (preferences + hint dismissals) for cross-
   device consistency — cheap, same migration batch.
3. **Add `world_memory`** for legacies/echoes if you want them durable.
4. **Leave caches and API keys local.** Optionally sync the non-secret provider
   _choice_.
5. **Stay on Supabase Free** for a hobby build; go **Pro (~$25/mo)** only when
   you need to defeat the 7-day pause and get backups.

---

## Appendix — broader "everything in the cloud" infra picture

Beyond browser storage, the rest of the stack is already cloud or serverless:
app on **Vercel**, DB/auth/pgvector/FTS on **Supabase**, narrator LLM + scene
art are browser-direct **BYOK** (player pays), RAG ingestion runs in **GitHub
Actions**. The only non-cloud-native server piece is the **always-on query-
embedding endpoint** (a resident 0.6B model a serverless function can't hold) —
solvable with Hugging Face free Inference (hobby), a flat ~$8–20/mo VPS, or
serverless GPU.

**Static corpus storage:** ~53 MB of Git LFS source files (EPUB 30 MB + wiki XML
24 MB; well under GitHub's free 10 GB) load into ~140–160 MB of pgvector +
text + FTS — inside Supabase's free 500 MB. Note: pgvector is **free on all
Supabase plans**; the corpus fits the free tier, so "Supabase Pro" is an
operational choice (no pause, backups, egress), not a storage requirement.

Production floor for a live, always-warm deployment ≈ **$33–45/mo** (Supabase
Pro + embed box), +$20 if commercial (Vercel Pro is personal-use-only on Hobby).

## Sources

- [Supabase pricing / free tier (2026)](https://uibakery.io/blog/supabase-pricing) · [Database & disk size (docs)](https://supabase.com/docs/guides/platform/database-size)
- [Vercel Hobby plan](https://vercel.com/docs/plans/hobby) · [pricing](https://vercel.com/pricing) · [limits](https://vercel.com/docs/limits)
- [GitHub Git LFS billing (docs)](https://docs.github.com/billing/managing-billing-for-git-large-file-storage/about-billing-for-git-large-file-storage)
- [Hugging Face pricing](https://huggingface.co/pricing) · [Inference Providers pricing](https://huggingface.co/docs/inference-providers/pricing)
- Repo: `src/lib/react/session-store.ts`, `src/lib/game/journal-sync.ts`, `src/components/game/provider-config.tsx`, `src/components/game/scene-art-cache.ts`, `supabase/migrations/`, `src/lib/types/database.ts`.
