# Testing Rules

- Test framework: **Vitest 4.x** (not Jest). Config in `vitest.config.mts`.
- Tests live alongside source code as `*.test.ts` files.
- Path alias `@/*` resolves to `src/*` in both Vitest and TypeScript.
- Run tests: `pnpm test` (single run), `pnpm test:watch` (watch mode).
- Run coverage: `pnpm vitest run --coverage`.
- **Coverage minimum: 95%** on statements, branches, functions, and lines. Thresholds are enforced in `vitest.config.mts` — the coverage command fails if any metric drops below 95%.
- When adding new logic in `src/lib/`, always add or update colocated `*.test.ts` files to maintain coverage.
- Prefer pure-function unit tests. The rules engine tests in `src/lib/rules/rules.test.ts` and the lore data integrity tests in `src/lib/lore/lore.test.ts` are the reference patterns.
