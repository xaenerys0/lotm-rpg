"use client";

import { useCallback, useRef, useState, useSyncExternalStore } from "react";
import { DEFAULT_PREFERENCES, type GamePreferences } from "@/lib/game";
import { noopSubscribe } from "@/lib/react";
import { loadPreferences, savePreferences } from "./preferences-store";

export function SanityPreferences() {
  const cacheRef = useRef<GamePreferences | null>(null);
  const initial = useSyncExternalStore(
    noopSubscribe,
    () => {
      if (cacheRef.current === null) {
        cacheRef.current = loadPreferences();
      }
      return cacheRef.current;
    },
    () => DEFAULT_PREFERENCES,
  );

  const [visible, setVisible] = useState(initial.sanityMeterVisible);

  const handleToggle = useCallback(() => {
    setVisible((prev) => {
      const next = !prev;
      savePreferences({ sanityMeterVisible: next });
      return next;
    });
  }, []);

  return (
    <div className="mt-4 flex items-start justify-between gap-4 rounded border border-border/60 bg-background/40 p-4">
      <div>
        <p className="text-sm font-medium text-foreground/90">Show sanity meter</p>
        <p className="mt-1 text-xs leading-relaxed text-muted/70">
          By default your sanity is hidden — you read your state from the world itself, as
          it distorts around you. Reveal the numeric meter for strategic management.
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={visible}
        aria-label="Show sanity meter"
        onClick={handleToggle}
        className={`relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors duration-200 ${
          visible
            ? "border-amber/60 bg-amber/30"
            : "border-border bg-surface hover:border-amber/30"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 rounded-full transition-transform duration-200 ${
            visible ? "translate-x-5 bg-amber" : "translate-x-1 bg-muted"
          }`}
        />
      </button>
    </div>
  );
}
