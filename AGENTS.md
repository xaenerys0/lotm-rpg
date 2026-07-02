# Next.js Version Warning

This project uses **Next.js 16** — APIs, conventions, and file structure may differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

# Writing GitHub Issues

When filing or writing up a GitHub issue (bug report or feature/task request), follow the `write-github-issue` skill. Codex loads it natively from `.agents/skills/write-github-issue/SKILL.md` (Claude uses the equivalent copy under `.claude/skills/`). It defines the required content, the matching issue templates in `.github/ISSUE_TEMPLATE/`, and the scripts in the skill's `scripts/` subdirectory that handle all GitHub interaction (duplicate search + issue creation via `gh`).
