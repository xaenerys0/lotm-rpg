"use client";

import { useCallback, useRef, useSyncExternalStore, useState } from "react";

import { HINT_KEY_PREFIX } from "@/lib/game";
import { noopSubscribe } from "@/lib/react";

import { pushPreferencesToCloud } from "./cloud-sync";

// First-time hints (issue #14): a one-shot, dismissible pointer shown the
// first time a player opens a screen. Dismissal persists per hint id.

export function FirstTimeHint({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  const seenCacheRef = useRef<boolean | undefined>(undefined);
  const initiallySeen = useSyncExternalStore(
    noopSubscribe,
    () => {
      if (seenCacheRef.current === undefined) {
        try {
          seenCacheRef.current = localStorage.getItem(HINT_KEY_PREFIX + id) === "1";
        } catch {
          seenCacheRef.current = true;
        }
      }
      return seenCacheRef.current;
    },
    // Server snapshot: render nothing until the client knows.
    () => true,
  );

  const [dismissed, setDismissed] = useState(false);

  const dismiss = useCallback(() => {
    setDismissed(true);
    try {
      localStorage.setItem(HINT_KEY_PREFIX + id, "1");
    } catch {
      // Storage unavailable — the hint will simply show again next visit.
    }
    // Best-effort cloud mirror so the dismissal follows the player across
    // devices (cross-device sync); never blocks the local dismissal.
    pushPreferencesToCloud();
  }, [id]);

  if (initiallySeen || dismissed) return null;

  return (
    <div
      role="note"
      className="mb-6 flex items-start justify-between gap-4 rounded-xl border border-amber/30 bg-amber/[0.06] p-5 animate-fade-in"
    >
      <p className="text-sm leading-relaxed text-foreground">{children}</p>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss hint"
        className="min-h-[24px] shrink-0 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:border-amber/40 hover:text-amber"
      >
        Got it
      </button>
    </div>
  );
}
