# Scene Art (Image Generation) — Admin Testing Notes

Everything you need to test AI scene illustrations end-to-end, written for someone
who has never touched this project. Covers what changed, how to turn it on, and how
to exercise **every** point where an image can be generated.

---

## 1. Background: how scene art works

- AI **text** (the narrator) and AI **images** (scene art) are configured
  **separately**. You can run text on one provider and images on another (or no
  images at all).
- Image generation is **BYOK** (bring your own key) and **browser-direct**: your
  key lives only in this browser's `localStorage` and is sent only to the image
  provider, never to our servers.
- An illustration is generated at certain "trigger moments" (combat, advancement,
  death, etc.), cached in the browser's **IndexedDB**, and replayed from cache
  forever after — so a given moment is only ever generated once.
- Failures are intentionally **silent to the player** but are now **logged to the
  browser console** (`[scene-art] image generation failed` with provider/model/
  reason — never your key), so a misconfiguration is diagnosable.

### What changed in this work

- **Ollama Cloud was removed as an image provider.** ollama.com only hosts
  chat/vision models; its image models (z-image / flux2-klein) run **locally**
  only, so a cloud key had no image endpoint to call (it failed silently). The
  working image providers are now **OpenAI**, **Ollama (local)**, and **local
  Stable Diffusion**. (Ollama Cloud is unaffected as a _text_ provider.)
- **Combat, death, advancement, apotheosis, pillar ascension, and identity
  exposure now illustrate reliably** (previously several never did).
- **Dev tools** were added for fast testing: a standalone art testbench and a
  premade test character — both gated behind an env flag.

---

## 2. Prerequisites

1. Install dependencies and run the app:
   ```bash
   pnpm install
   pnpm dev
   ```
   App runs at `http://localhost:3000` (sign in / create an account to reach the
   game — the game pages are behind auth).
2. Have an **image provider** ready (pick one):
   - **OpenAI** — an API key with image access (`gpt-image-1` or `dall-e-3`).
     Easiest; works anywhere. ~US$0.04/image.
   - **Ollama (local)** — Ollama running locally on **macOS** with an image model
     pulled: `ollama pull x/z-image-turbo`. Base URL `http://localhost:11434/v1`.
     No key. (Windows/Linux image-gen support was not yet available at time of
     writing.)
   - **Local Stable Diffusion** — Automatic1111/Forge WebUI with its API enabled
     (default `http://localhost:7860`). No key.

> Ollama **Cloud** is intentionally **not** an option for images — if you don't
> see it in the provider list, that's correct.

---

## 3. One-time setup (do this first)

### 3a. Enable developer tools

Set the env flag in `.env.local` (copy from `.env.example` if needed):

```bash
NEXT_PUBLIC_DEV_TOOLS=1
```

Restart `pnpm dev` after changing env. With this set you get the `/dev/scene-art`
testbench and a **"Seed test character"** button on the Play dashboard. With it
unset (or `0`/`false`/`off`), both disappear — nothing leaks into normal play.

### 3b. Configure the image provider

In the app: **Settings → Scene art**.

1. Pick the provider (OpenAI / Ollama (local) / Stable Diffusion (local)).
2. Enter the API key (OpenAI only) and/or base URL (Ollama / SD).
3. Pick the image **model**:
   - OpenAI: `dall-e-3` or `gpt-image-1`.
   - Ollama local: `z-image-turbo` (or `x/flux2-klein:9b`).
   - Stable Diffusion: leave blank to use the WebUI's loaded checkpoint.
4. Click **Save image settings**.

### 3c. Turn on scene illustrations

In the app: **Settings → Preferences → "Scene illustrations"** → toggle **on**.
(Off by default, because images cost money.) This is **separate** from the image
provider config in 3b — you need **both**.

> The in-game illustrations (combat/advancement/death/etc.) require **3b + 3c**.
> The `/dev/scene-art` testbench (below) only needs **3b** — it ignores the
> preference toggle and the cache.

---

## 4. Fastest test — the standalone testbench

Use this to verify your provider/key/model actually produce images, for all four
prompt types, with **zero gameplay**.

1. Make sure `NEXT_PUBLIC_DEV_TOOLS=1` and you configured an image provider (3b).
2. Navigate to **`http://localhost:3000/dev/scene-art`** (type the URL — there is
   no menu link; it's dev-only).
3. You'll see a status line naming your provider/model, and four cards:
   **advancement, combat, death, major-event**.
4. Click **Generate** on each card.
   - Success → the image renders inline under the card.
   - Failure → a red error message shows the provider's reason (e.g. "model not
     found", "invalid key", "model requires a subscription").
5. Each click **re-generates** (it calls the provider directly and bypasses the
   IndexedDB cache), so you can iterate on provider/model settings and retry
   immediately.

If all four generate here, your image pipeline (provider → transport → parse →
render) works. The rest of the tests confirm the **in-game wiring** at each
trigger moment.

---

## 5. In-game testing — the premade test character

This exercises the real game path: a trigger moment mounts the art component,
which generates and caches. Requires **3a + 3b + 3c**.

1. Go to **Play**. With dev tools on, the "Start New Game" card shows a
   **"Seed test character"** button. Click it.
   - This creates **Test Subject** — a Sequence 9 Beyonder with a fully-digested
     potion and the next potion's ingredients already in inventory, a deep wallet,
     and the Acting Method known. It has a **fixed id** (re-clicking overwrites it,
     never duplicates) and **cannot be deleted** from the UI (the Manage view shows
     "Protected"; the character sheet's delete zone is hidden for it).
2. The game opens. Click to begin / generate the first scene (this needs a working
   **text** provider too — Settings → AI Provider).

You can now reach the trigger moments below.

### 5a. Combat (combat-resolution illustration)

1. In the choices phase, find the **combat launcher** and start an encounter.
2. Play through preparation → exchanges → **resolution**.
3. On the resolution screen, the illustration generates and fades in beneath the
   outcome narrative. ✅ This is the "only text in combat" case that was fixed.

### 5b. Advancement (consequences illustration)

1. The seeded character stands at Sequence 9 with everything needed to advance to
   Sequence 8, so the **Advancement** panel appears in the choices phase.
2. Arm, then confirm the advancement.
3. The advancement plays out as a normal **consequences** turn, with the
   illustration under the narrative. ✅

> **Apotheosis (Seq 1 → 0)** and **Pillar ascension (Seq 0 → Pillar)** use the
> **identical** code path as advancement (the engine attaches the same illustrate
> flag), so testing advancement validates all three. To see those specific scenes
> you'd need a character seeded at Seq 1 / Seq 0 (the test character is Seq 9 by
> design — see "Extending the test character" below).

### 5c. Death (end-screen illustration)

Death triggers when sanity bottoms out and the character loses control
(permadeath). This is hard to force on demand in normal play. Two options:

- **Practical:** verify the **death prompt** via the testbench (Section 4, "death"
  card).
- **In-game:** play until sanity reaches zero and a loss-of-control verdict ends
  the chronicle; the **Death screen** shows the illustration beneath the final
  scene. ✅ (Previously death never illustrated.)

### 5d. Identity exposure (major-event illustration)

Exposure is a rare engine event: while wearing a prepared **persona**, repeated
public use eventually lets a shared witness connect two of your faces. When it
fires, an **"An identity unravels…"** illustrated card appears in the **next**
scene. Hard to force quickly; the testbench's "major-event" card covers the
prompt. ✅ (Previously exposure never illustrated.)

---

## 6. How to tell it worked (and where to look)

- **Visible image** under the relevant narrative / on the testbench card = success.
- **A pulsing "An illustration takes shape in the fog…"** line = generating.
- **Nothing appears in-game** = check the browser **console** for
  `[scene-art] image generation failed` (it logs provider, model, and the reason).
  The testbench shows the same reason inline in red.
- **Cached images** live in IndexedDB DB **`lotm-rpg-scene-art`** (DevTools →
  Application → IndexedDB). Cache keys:
  - per turn: `<sessionId>:<turnNumber>`
  - combat: `<sessionId>:combat:<encounterId>`
  - death: `<sessionId>:death`
  - exposure: `<sessionId>:exposure:<turn>`

To **force an in-game moment to regenerate** (it's cached after the first time),
delete the matching key (or clear the whole `lotm-rpg-scene-art` DB) in DevTools,
then revisit. The **testbench never caches**, so it always regenerates.

---

## 7. Troubleshooting — "no image appears"

Walk this checklist in order:

1. **Provider configured?** Settings → Scene art shows your provider/key/model and
   says "Image settings saved". (Testbench status line confirms it too.)
2. **Illustrations enabled?** Settings → Preferences → "Scene illustrations" is on.
   (Not needed for the testbench, required for in-game.)
3. **Right model?** OpenAI: `gpt-image-1`/`dall-e-3`. Ollama local:
   `z-image-turbo`. A **chat/vision model** (e.g. a `gemini-*` or `gpt-4*` id) is
   **not** an image model and will fail.
4. **Check the console** for `[scene-art] image generation failed` → read the
   reason (bad key = 401, model not found/unavailable = 400/404, gated model =
   403). The testbench shows this inline.
5. **Ollama local:** is Ollama running, on macOS, with the image model pulled?
   Base URL `http://localhost:11434/v1`.
6. **Already cached?** If you changed providers but an old/blank image shows for a
   moment you already visited, clear the `lotm-rpg-scene-art` IndexedDB and revisit
   (or just use the testbench, which bypasses cache).

---

## 8. Cleanup / turning it off

- **Disable dev tools:** remove `NEXT_PUBLIC_DEV_TOOLS` (or set `=0`) and restart.
  The testbench route shows a disabled notice and the Seed button disappears.
- **Remove the test character:** it's deliberately undeletable from the UI.
  Re-seeding overwrites it. To remove it entirely, clear the site's localStorage
  (DevTools → Application → Local Storage) — that also clears other local saves, so
  use a throwaway browser profile for testing if you want isolation.
- **Disable in-game art:** Settings → Preferences → toggle "Scene illustrations"
  off. Existing cached images remain in IndexedDB until cleared.

---

## 9. Extending the test character (optional)

The seeded character targets the **simplest** reachable trigger (Seq 9 → 8
advancement + combat) because apotheosis/pillar/death share code paths already
covered by advancement and the testbench. If you want a one-click apotheosis or
pillar test, the pure builder lives in `src/lib/game/dev-tools.ts`
(`createTestCharacter`); seeding a Seq 1 character with the pathway's Uniqueness
item + anchors (apotheosis) or a Seq 0 character with the family's sibling
Uniquenesses (pillar) would make those panels appear immediately. Ask an engineer
to parameterize it if needed.

---

## Quick reference

| Generation point       | Configured? | Fastest test                                       |
| ---------------------- | ----------- | -------------------------------------------------- |
| Any provider/prompt    | 3b only     | `/dev/scene-art` testbench                         |
| Combat                 | 3b + 3c     | Seed char → launch & finish a fight                |
| Advancement            | 3b + 3c     | Seed char → arm & confirm advancement              |
| Apotheosis/Pillar      | 3b + 3c     | Same path as advancement; or testbench prompt      |
| Death                  | 3b + 3c     | Testbench "death"; in-game on permadeath           |
| Major-event (exposure) | 3b + 3c     | Testbench "major-event"; in-game on exposure       |
| Journal entries        | —           | Display-only (replays cached art; never generates) |
