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
