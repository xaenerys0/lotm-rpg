import { act } from "react";
import type { ReactElement } from "react";
import { hydrateRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";

/**
 * SSR-then-hydrate harness for catching "frozen snapshot" hydration bugs.
 *
 * A client component that seeds local state from a localStorage snapshot the
 * wrong way — `useState(useStoredValue(...))` — renders the SERVER fallback
 * during SSR and the first hydration render, then freezes on it. So on a FULL
 * page load the screen shows empty/stale data even though localStorage holds the
 * real value (in-app navigation mounts fresh and reads the real value, which is
 * why the bug only bites on a hard reload — see issue #84 / #86).
 *
 * This helper reproduces that exact lifecycle: render to HTML with the server
 * fallback, mount that HTML, then hydrate (where the client snapshot is read and
 * `useSyncExternalStore` forces the post-hydration correction). It returns the
 * SSR HTML and the hydrated container so a test can assert both the pre-hydration
 * (fallback) and post-hydration (live) states.
 *
 * Tests using this helper must opt into the jsdom environment with a docblock:
 *
 *   // @vitest-environment jsdom
 *
 * The caller is responsible for seeding localStorage before calling.
 */
export interface HydrationResult {
  /** The HTML produced by server rendering (the fallback snapshot). */
  ssrHtml: string;
  /** The hydrated DOM container, reflecting the post-hydration (live) state. */
  container: HTMLElement;
  /** Tear down the React root and detach the container. Await it. */
  cleanup: () => Promise<void>;
}

export async function renderThenHydrate(ui: ReactElement): Promise<HydrationResult> {
  (
    globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
  ).IS_REACT_ACT_ENVIRONMENT = true;

  const ssrHtml = renderToString(ui);
  const container = document.createElement("div");
  container.innerHTML = ssrHtml;
  document.body.appendChild(container);

  let root: Root | undefined;
  await act(async () => {
    root = hydrateRoot(container, ui);
  });

  return {
    ssrHtml,
    container,
    cleanup: async () => {
      await act(async () => {
        root?.unmount();
      });
      container.remove();
    },
  };
}
