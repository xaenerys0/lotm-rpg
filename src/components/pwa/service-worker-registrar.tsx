"use client";

import { useEffect } from "react";

/**
 * Registers the minimal service worker (`/sw.js`) once the page has loaded.
 * Renders nothing. Registration failures are non-fatal — the app still works,
 * it just won't surface the Android install prompt.
 */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    const register = () => {
      void navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
        // Ignore — service worker is best-effort for installability only.
      });
    };

    if (document.readyState === "complete") {
      register();
      return;
    }

    window.addEventListener("load", register, { once: true });
    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}
