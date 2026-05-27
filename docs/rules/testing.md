# Testing Rules

- Test framework: **Vitest 4.x** (not Jest). Config in `vitest.config.mts`.
- Tests live alongside source code as `*.test.ts` files.
- Path alias `@/*` resolves to `src/*` in both Vitest and TypeScript.
- Run tests: `pnpm test` (single run), `pnpm test:watch` (watch mode).
- Prefer pure-function unit tests. The rules engine tests in `src/lib/rules/rules.test.ts` are the reference pattern.
