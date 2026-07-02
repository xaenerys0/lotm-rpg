---
name: write-github-issue
description: Write up a clear, reproducible GitHub issue (bug report or feature/task) for the lotm-rpg repo. Use when the user wants to file, report, draft, open, or write up an issue or bug, describe something that is broken or behaving unexpectedly, or request a feature or task to be built. Produces issue content that matches the repo's issue templates and files it through the bundled scripts.
---

This skill guides writing up a GitHub issue for the **lotm-rpg** repository so that anyone —
a maintainer, a future agent, or a first-time contributor — can act on it without asking
follow-up questions. It produces content that matches the repo's issue templates and files
the issue through the scripts in this skill's `scripts/` subdirectory.

This is the **Codex-native** copy of the skill (discovered under `.agents/skills/`). Claude
loads an equivalent copy from `.claude/skills/write-github-issue/`; keep the two in sync.

## When to use this skill — and which template

Pick the template first; the whole write-up follows from it.

- **Bug report** (`.github/ISSUE_TEMPLATE/bug_report.md`) — something in the app is broken,
  errors, or behaves differently than expected. The user describes an experience that went
  wrong.
- **Feature / task request** (`.github/ISSUE_TEMPLATE/feature_request.md`) — something should
  be built, changed, or improved. The user describes a desired capability or a piece of work.

If it is unclear, ask the user which one fits before writing.

## The golden rule: write for someone who has never opened the app

Assume the reader has **never used this app and knows nothing about it**. You are walking a
newcomer through exactly what happened, step by step. Concretely:

- **Name the screen or route** you were on — e.g. the play screen (`/play`), the character
  sheet (`/character`), the journal (`/journal`), the map (`/map`), the market (`/market`),
  login (`/login`). Don't say "the page"; say which page.
- **Name controls by their visible label** — "click the **Advance** button", "open the
  **Settings** menu", "type into the **message** field". Don't say "click the button".
- **Never assume prior context.** If a step depends on a state (logged in, a character
  created, a pathway chosen, an item held), say so explicitly.
- Prefer plain, literal description of what you saw and did over interpretation.

A good issue reads like turning-by-turn directions: someone can follow it and land in the same
place you did.

## Bug reports — required content

Derived directly from the shape of a good bug report. Fill every section of
`bug_report.md`:

1. **What you were trying to do** — your goal or intent, in one or two sentences. ("I was
   trying to advance my character from Sequence 9 to Sequence 8.")
2. **Steps to reproduce** — a **numbered list of concrete UI actions**, one interaction per
   step, phrased for a first-time user (see the golden rule). Detail _what you actually did_:
   which screen, which control, what you clicked, what you typed, where you navigated. Start
   from a known state (e.g. "Logged in, on `/play` with an active character").
3. **Expected result** — what you expected to happen after the last step.
4. **Actual result** — what actually happened instead. Be specific: error text, a frozen
   screen, wrong number, nothing at all.
5. **Environment** — browser + OS, the route/screen, and relevant auth/character state
   (logged in? which character? which pathway/sequence?).
6. **Console / network errors** — any messages from the browser console or failed network
   requests (status codes, error bodies), if available.
7. **Screenshots / recordings** and **additional context** — anything else that helps.

## Feature / task requests — required content

Fill every section of `feature_request.md`:

- **Problem / motivation** — the need or pain this addresses. Why does this matter?
- **Proposed solution / behavior** — what should happen, described concretely.
- **Scope & acceptance criteria** — what "done" looks like; a checklist the implementer can
  verify against.
- **Canon / lore notes** — if the change touches LOTM lore (NPCs, pathways, organizations,
  events, relationships), note the relevant canon. Per the repo's canon rule, factual claims
  must be verified against `corpus/` — flag anything that needs checking rather than asserting
  it from memory.
- **Alternatives considered** and **additional context** — optional but helpful.

## Process

1. **Check for duplicates first.** Search existing issues before writing anything:

   ```bash
   .agents/skills/write-github-issue/scripts/find-similar-issues.sh "<keywords>"
   ```

   If a matching open issue exists, add to it instead of filing a new one.

2. **Draft the body by filling the matching template.** Copy the relevant template file and
   fill in every section following the guidance above. Keep the section headings intact so the
   filed issue matches the template shape. Write the filled body to a file (e.g. a scratch
   file) to pass to the create script.

3. **Create the issue** through the script:

   ```bash
   .agents/skills/write-github-issue/scripts/create-issue.sh \
     --title "<concise, specific title>" \
     --body-file <path-to-filled-body.md> \
     --label bug            # or: --label enhancement
   ```

   The script prints the new issue's URL.

4. **Report the URL** back to the user.

### Titles

Write a specific, scannable title: the symptom or the ask, not a vague label. Prefer
"Advance button does nothing on `/play` at Sequence 9" over "advancement bug".

## Scripts reference

All GitHub interaction goes through this skill's `scripts/` subdirectory (see
`scripts/README.md`). These wrap the `gh` CLI:

- **`scripts/find-similar-issues.sh "<query>"`** — searches this repo's issues for duplicates
  and prints matching number / title / URL.
- **`scripts/create-issue.sh --title <t> --body-file <f> [--label <l> ...]`**
  — creates the issue and prints its URL.

Run either with `--help` for full usage.

**Fallback when `gh` is unavailable.** The scripts are the default path. In an environment
that has no `gh` CLI but does have GitHub access another way (for example, an agent session
with GitHub MCP tools), file the **same filled template body** through that access instead —
search for duplicates, then create the issue with the identical title, body, and labels. The
content and process are unchanged; only the transport differs.

## Templates this skill matches

- `.github/ISSUE_TEMPLATE/bug_report.md`
- `.github/ISSUE_TEMPLATE/feature_request.md`

Keep the issue body aligned with these files. If a template changes, update this skill so the
two stay in sync.
