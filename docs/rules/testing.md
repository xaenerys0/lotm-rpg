# Testing Rules

- Test framework: **Vitest 4.x** (not Jest). Config in `vitest.config.mts`.
- Tests live alongside source code as `*.test.ts` files.
- Path alias `@/*` resolves to `src/*` in both Vitest and TypeScript.
- Run tests: `pnpm test` (single run), `pnpm test:watch` (watch mode).
- Run coverage: `pnpm vitest run --coverage`.
- **Coverage minimum: 95%** on statements, branches, functions, and lines. Thresholds are enforced in `vitest.config.mts` — the coverage command fails if any metric drops below 95%.
- When adding new logic in `src/lib/`, always add or update colocated `*.test.ts` files to maintain coverage.
- Prefer pure-function unit tests. The rules engine tests in `src/lib/rules/rules.test.ts` and the lore data integrity tests in `src/lib/lore/lore.test.ts` are the reference patterns.

## Accessibility tests

- An axe-core suite renders key components/pages and asserts no WCAG A/AA
  violations: `src/test/a11y.test.tsx`, using the `expectNoAxeViolations` helper
  in `src/test/axe.ts`. Add a case when introducing a new screen or significant
  interactive component (see `docs/rules/accessibility.md`).
- These are `.test.tsx` files (React + JSX) and opt into the jsdom environment
  with a `// @vitest-environment jsdom` docblock; the default environment stays
  node for the pure `src/lib` tests. The glob in `vitest.config.mts` includes
  both `*.test.ts` and `*.test.tsx`.
- jsdom has no layout/colour engine, so axe's `color-contrast` rule is disabled
  there — structural checks (names, roles, labels, ARIA, ids) are covered;
  verify contrast against the design tokens and a real-browser tool.
