"use client";

import { useCloudSyncStatus } from "./cloud-sync";

/**
 * Load-before-play gate (cross-device sync). Until the first cloud hydrate
 * settles, no game surface should act on a possibly-stale local save — a save
 * resumed or edited mid-hydrate could clobber a newer cloud copy via
 * last-write-wins. Rather than gate each entry point (the dashboard, the
 * sidebar character switcher, /character, /journal, /map …) this wraps the whole
 * authenticated main content once, at the right altitude.
 *
 * It blocks only on the first load / full reload per session: hydrate runs once
 * and `status` then stays "synced" across client navigations. Signed-out or
 * offline players resolve to "synced" almost immediately (no cloud round-trip),
 * so the gate is momentary. SSR and the first client render both see "idle" →
 * the same loading panel, so there is no hydration mismatch.
 */
export function CloudHydrationGate({ children }: { children: React.ReactNode }) {
  const status = useCloudSyncStatus();
  if (status === "synced") return <>{children}</>;
  return (
    <div
      role="status"
      className="flex min-h-[50vh] flex-col items-center justify-center gap-3 px-6 text-center"
    >
      <span
        aria-hidden="true"
        className="h-6 w-6 animate-spin rounded-full border-2 border-amber/30 border-t-amber"
      />
      <p className="font-serif text-lg text-amber">Restoring your chronicles…</p>
      <p className="max-w-sm text-sm text-muted">
        Syncing your characters across the gray fog.
      </p>
    </div>
  );
}
