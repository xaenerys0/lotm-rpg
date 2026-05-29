"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { PWA_COLORS } from "@/app/_pwa/palette";
import { noopSubscribe } from "@/lib/react";

// The `beforeinstallprompt` event is non-standard (Chromium only) and not yet
// in the DOM lib, so we type the bits we use.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/** True when the app is already running as an installed standalone PWA. */
function useIsStandalone(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () =>
      window.matchMedia("(display-mode: standalone)").matches ||
      // iOS Safari exposes its own flag.
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true,
    () => false,
  );
}

/** True on iOS/iPadOS, where installs happen via the Share menu (no prompt). */
function useIsIOS(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase()),
    () => false,
  );
}

/** The app's crescent emblem, inline so the panel carries no extra requests. */
function Emblem() {
  return (
    <svg
      viewBox="0 0 48 48"
      aria-hidden
      className="h-12 w-12 shrink-0 rounded-lg ring-1 ring-amber/25"
    >
      <rect width="48" height="48" rx="10" fill={PWA_COLORS.background} />
      <circle
        cx="24"
        cy="24"
        r="17"
        fill="none"
        stroke={PWA_COLORS.amber}
        strokeOpacity="0.35"
        strokeWidth="1.4"
      />
      <circle cx="22" cy="25" r="10" fill={PWA_COLORS.amber} />
      <circle cx="27" cy="22" r="10" fill={PWA_COLORS.background} />
      <rect
        x="30"
        y="29"
        width="5"
        height="5"
        rx="1"
        fill={PWA_COLORS.gaslight}
        transform="rotate(45 32.5 31.5)"
      />
    </svg>
  );
}

/** The iOS share glyph (box with an upward arrow), drawn to match the copy. */
function ShareGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className="inline-block h-3.5 w-3.5 align-[-0.15em]"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3v12M8 7l4-4 4 4" />
      <path d="M6 11v8a2 2 0 002 2h8a2 2 0 002-2v-8" />
    </svg>
  );
}

/** Shared "summons" panel chrome: brass rule, gaslight glow, emblem, dismiss. */
function Summons({
  onDismiss,
  children,
}: {
  onDismiss: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
      <div className="animate-fade-in-up pointer-events-auto relative w-full max-w-md overflow-hidden rounded-xl border border-amber/20 bg-surface/95 shadow-[0_16px_50px_-18px_rgba(217,119,6,0.55)] backdrop-blur-md">
        {/* Brass rule along the top edge */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber to-transparent" />
        {/* Gaslight glow bleeding in from above */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-20 left-1/2 h-40 w-56 -translate-x-1/2 rounded-full bg-amber/15 blur-3xl"
        />
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded text-fog transition-colors hover:text-foreground"
        >
          <span aria-hidden>✕</span>
        </button>
        <div className="relative flex items-start gap-4 p-4 pr-10">
          <Emblem />
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-gaslight/80">
              An invitation
            </p>
            <p className="mt-0.5 font-serif text-base text-foreground">
              Keep the mysteries close
            </p>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Surfaces an install affordance:
 * - Android/Chromium: a button wired to the captured `beforeinstallprompt`.
 * - iOS: dismissible "Add to Home Screen" instructions (no programmatic API).
 *
 * Renders nothing when already installed, dismissed, or unsupported.
 */
export function InstallPrompt() {
  const isStandalone = useIsStandalone();
  const isIOS = useIsIOS();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(
    null,
  );
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const onBeforeInstallPrompt = (event: Event) => {
      // Prevent the mini-infobar so we can present our own button.
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setDeferredPrompt(null);

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  // Android/Chromium offers a programmatic prompt; iOS must be guided through
  // the Share menu. Anything else (already installed, dismissed, or an
  // unsupported browser) shows nothing.
  let body: React.ReactNode;
  if (deferredPrompt) {
    body = (
      <>
        <p className="mt-1 text-sm leading-snug text-muted">
          Add the chronicle to your home screen for a full-screen, distraction-free
          descent.
        </p>
        <button
          type="button"
          onClick={handleInstall}
          className="mt-3 inline-flex items-center rounded-md bg-amber px-4 py-2 text-sm font-medium text-background shadow-[0_0_22px_-6px_rgba(217,119,6,0.7)] transition-colors hover:bg-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber/60"
        >
          Install
        </button>
      </>
    );
  } else if (isIOS) {
    body = (
      <p className="mt-1 text-sm leading-snug text-muted">
        Tap{" "}
        <span className="inline-flex items-center gap-1 rounded border border-amber/30 px-1.5 py-0.5 text-foreground">
          <ShareGlyph />
          Share
        </span>{" "}
        then <span className="text-foreground">Add to Home Screen</span>.
      </p>
    );
  }

  if (isStandalone || dismissed || !body) {
    return null;
  }

  return <Summons onDismiss={() => setDismissed(true)}>{body}</Summons>;
}
