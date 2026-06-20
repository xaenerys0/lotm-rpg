import type { Metadata } from "next";

import { DevSceneArtHarness } from "@/components/game/dev-scene-art-harness";
import { devToolsEnabled } from "@/lib/game";

export const metadata: Metadata = { title: "Scene art testbench" };

export default function DevSceneArtPage() {
  return (
    <div className="mx-auto max-w-[var(--container-game)] px-4 py-8 sm:px-6 sm:py-10 animate-fade-in-up">
      <header className="mb-8">
        <h1 className="font-serif text-3xl font-bold tracking-tight text-amber md:text-4xl">
          Scene art testbench
        </h1>
        <p className="mt-2 text-muted">
          Dev-only: generate an illustration for each scene-art trigger directly through
          your configured image provider — no game progression, no AI text turn, and the
          IndexedDB cache is bypassed so every run re-generates.
        </p>
      </header>

      {devToolsEnabled() ? (
        <DevSceneArtHarness />
      ) : (
        <p
          role="status"
          className="rounded-md border border-border bg-surface px-4 py-3 text-sm text-muted"
        >
          Developer tools are disabled. Set{" "}
          <code className="font-mono text-amber">NEXT_PUBLIC_DEV_TOOLS=1</code> and reload
          to enable this testbench.
        </p>
      )}
    </div>
  );
}
