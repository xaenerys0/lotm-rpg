import { resolve } from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    // Give jsdom-environment tests a real (non-opaque) origin instead of the
    // default about:blank, so origin-gated web APIs behave.
    environmentOptions: {
      jsdom: {
        url: "http://localhost/",
      },
    },
    // Node 26's built-in global localStorage (undefined without
    // --localstorage-file) shadows jsdom's; install a working polyfill.
    setupFiles: ["src/test/setup-storage.ts"],
    coverage: {
      include: [
        "src/lib/rules/**/*.ts",
        "src/lib/lore/**/*.ts",
        "src/lib/ai/**/*.ts",
        "src/lib/game/**/*.ts",
        "src/lib/rag/**/*.ts",
        // Security-sensitive server code: the CSP/auth middleware, the Supabase
        // client factories, and the API proxy route handlers (auth gate, rate
        // limiting, model allowlist). Previously outside the gate — a bug here
        // ships unseen, so they are held to the same bar as the game core.
        "src/proxy.ts",
        "src/lib/supabase/**/*.ts",
        "src/app/api/**/route.ts",
        "src/app/auth/callback/route.ts",
        // Browser-side logic modules in the component layer (storage glue, the
        // cloud-sync shell, the RAG retrieval client). The pure decisions live
        // in src/lib/**; these thin shells were the untested remainder.
        "src/components/game/preferences-store.ts",
        "src/components/game/scene-art-cache.ts",
        "src/components/game/character-actions.ts",
        "src/components/game/lore-retrieval-client.ts",
        "src/components/game/cloud-sync.ts",
      ],
      exclude: ["src/**/*.test.ts", "src/**/*.test.tsx", "src/lib/**/index.ts"],
      thresholds: {
        statements: 95,
        branches: 95,
        functions: 95,
        lines: 95,
      },
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
});
