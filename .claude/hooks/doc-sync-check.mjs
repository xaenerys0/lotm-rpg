#!/usr/bin/env node
// PostToolUse(Edit|Write|MultiEdit) hook: doc-sync check.
//
// After a file is edited or created, this analyzes whether the change likely
// warrants a documentation update (a scoped CLAUDE.md "Structure" list, the
// root architecture tree / Commands table, database.ts, or a docs/rules file),
// and — when it finds something — reports back to the model WHAT to check and
// WHY, plus a one-line note to the user. When nothing is warranted it stays
// silent (no noise on routine edits).
//
// It never blocks: any failure exits 0 with no output. Pure Node built-ins.

import { execFileSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { dirname, join, relative, basename, extname, sep } from "node:path";

function readStdin() {
  try {
    return readFileSync(0, "utf8");
  } catch {
    return "";
  }
}

function gitRoot(startDir) {
  try {
    return execFileSync("git", ["rev-parse", "--show-toplevel"], {
      cwd: startDir,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return null;
  }
}

// Is the path tracked in the git index/HEAD? Untracked => newly created.
function isTracked(root, relPath) {
  try {
    execFileSync("git", ["ls-files", "--error-unmatch", "--", relPath], {
      cwd: root,
      stdio: ["ignore", "ignore", "ignore"],
    });
    return true;
  } catch {
    return false;
  }
}

// Walk up from the file's directory to the repo root, returning the first
// CLAUDE.md found (the scoped doc that governs this file).
function nearestClaudeMd(root, fileAbs) {
  let dir = dirname(fileAbs);
  while (dir.startsWith(root)) {
    const candidate = join(dir, "CLAUDE.md");
    if (existsSync(candidate)) return candidate;
    if (dir === root) break;
    dir = dirname(dir);
  }
  return null;
}

function referencesName(docAbs, name) {
  try {
    return readFileSync(docAbs, "utf8").includes(name);
  } catch {
    return false;
  }
}

// Config files whose content is mirrored in documentation. Keyed by a matcher
// over the repo-relative path; value explains which doc(s) to reconcile.
function configCoupling(rel) {
  if (rel === "package.json")
    return "the Commands table in `CLAUDE.md` — confirm any added/removed/renamed `pnpm` script is listed.";
  if (rel === "vitest.config.mts" || rel === "vitest.config.ts")
    return "the coverage `include` list described in `CLAUDE.md` (Key Conventions → Tests) and the Pre-Commit Checklist — keep the documented set in sync.";
  if (rel.startsWith("supabase/migrations/"))
    return "`src/lib/types/database.ts` (keep the schema types in sync) and `supabase/CLAUDE.md` (migration list / table descriptions).";
  if (rel === "next.config.ts" || rel === "next.config.js")
    return "`CLAUDE.md` Key Conventions and `docs/rules/nextjs.md` — reflect any config change (typedRoutes, headers, etc.).";
  if (rel === "playwright.config.ts")
    return "the `PUBLIC_SPECS` matcher / e2e notes referenced in `CLAUDE.md` and `e2e/README.md`.";
  if (
    rel === "eslint.config.mjs" ||
    rel === "postcss.config.mjs" ||
    rel === "tsconfig.json"
  )
    return "`CLAUDE.md` Key Conventions — confirm the documented tooling conventions still match.";
  return null;
}

const DOCUMENTABLE_EXT = new Set([
  ".ts",
  ".tsx",
  ".mts",
  ".cts",
  ".js",
  ".mjs",
  ".sql",
  ".css",
  ".toml",
]);

function isDocFile(rel) {
  const b = basename(rel).toLowerCase();
  return (
    b === "claude.md" || b === "agents.md" || b === "readme.md" || extname(rel) === ".md"
  );
}

function isSkippable(rel) {
  if (rel.includes("node_modules" + sep) || rel.startsWith("node_modules/")) return true;
  if (rel.includes(".next" + sep) || rel.includes("dist" + sep)) return true;
  if (rel.startsWith(".claude/")) return true; // don't analyze hook/settings edits
  return false;
}

function isTestFile(rel) {
  return /\.test\.(ts|tsx)$/.test(rel);
}

function main() {
  const raw = readStdin();
  let input;
  try {
    input = JSON.parse(raw);
  } catch {
    return;
  }

  const fileAbs = input?.tool_input?.file_path || input?.tool_response?.filePath || "";
  if (!fileAbs) return;

  const root = gitRoot(dirname(fileAbs));
  if (!root) return;

  const rel = relative(root, fileAbs).split(sep).join("/");
  if (!rel || rel.startsWith("..")) return;
  if (isDocFile(rel) || isSkippable(rel)) return;

  const reasons = [];

  // 1) Config files with a documented coupling — always worth a reconcile.
  const coupling = configCoupling(rel);
  if (coupling)
    reasons.push(`\`${rel}\` is a config file mirrored in docs: check ${coupling}`);

  // 2) Newly-created source file in a directory governed by a scoped CLAUDE.md.
  const tracked = isTracked(root, rel);
  const docAbs = nearestClaudeMd(root, fileAbs);
  const name = basename(rel);
  const documentable =
    DOCUMENTABLE_EXT.has(extname(rel)) && !isTestFile(rel) && name !== "index.ts";

  if (!tracked && documentable && docAbs) {
    const docRel = relative(root, docAbs).split(sep).join("/");
    if (!referencesName(docAbs, name)) {
      reasons.push(
        `\`${rel}\` looks newly added and is not yet referenced in \`${docRel}\` — add it to that doc's Structure list (and the root \`CLAUDE.md\` architecture tree if it introduces a new area).`,
      );
    }
  }

  if (reasons.length === 0) {
    // Nothing warranted — stay silent to avoid noise on routine edits.
    process.stdout.write(JSON.stringify({ suppressOutput: true }));
    return;
  }

  const body =
    "Doc-sync check — this edit may warrant a documentation update:\n" +
    reasons.map((r) => `• ${r}`).join("\n") +
    "\nUpdate the relevant doc(s) if the change is real, per the Pre-Commit Checklist item 6.";

  process.stdout.write(
    JSON.stringify({
      systemMessage: `📝 doc-sync: ${reasons.length} doc-impact signal(s) on ${rel}`,
      hookSpecificOutput: {
        hookEventName: "PostToolUse",
        additionalContext: body,
      },
    }),
  );
}

try {
  main();
} catch {
  // Never block on hook failure.
}
