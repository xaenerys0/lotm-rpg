// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { useState } from "react";

import {
  createDefaultGameState,
  createSession,
  serializeSession,
  DEFAULT_PREFERENCES,
  PREFERENCES_KEY,
  SESSION_INDEX_KEY,
  SESSION_KEY_PREFIX,
  serializePreferences,
} from "@/lib/game";
import { useStoredValue } from "@/lib/react/session-store";
import { renderThenHydrate } from "@/test/hydration";

import { PlayDashboard } from "./play-dashboard";
import { SanityPreferences } from "./sanity-preferences";
import { JournalPanel } from "./journal-panel";

// These guard the frozen-snapshot hydration bug (issue #84 audit / #86): an
// SSR'd screen that seeds state with `useState(useStoredValue(...))` renders the
// server fallback and never picks up the real localStorage value after a full
// page load. The fix is the reactive-snapshot + local-override pattern.

beforeEach(() => localStorage.clear());
afterEach(() => localStorage.clear());

describe("screen hydration — frozen-snapshot regression", () => {
  it("harness self-check: it actually catches a frozen useState(useStoredValue()) snapshot", async () => {
    localStorage.setItem("hydration-probe", "live");
    const load = () => localStorage.getItem("hydration-probe") ?? "fallback";

    // The BUG: seeding useState from the store snapshot freezes on the SSR
    // fallback even after hydration. Asserting it proves the harness detects the
    // freeze, so the real-component tests below pass for the right reason.
    function Frozen() {
      const [value] = useState(useStoredValue(load, "fallback"));
      return <span data-testid="v">{value}</span>;
    }
    const frozen = await renderThenHydrate(<Frozen />);
    expect(frozen.container.querySelector('[data-testid="v"]')?.textContent).toBe(
      "fallback",
    );
    await frozen.cleanup();

    // The FIX: read the snapshot reactively, layer edits via an override. It
    // corrects to the live value after hydration.
    function Fixed() {
      const live = useStoredValue(load, "fallback");
      const [override] = useState<string | null>(null);
      return <span data-testid="v">{override ?? live}</span>;
    }
    const fixed = await renderThenHydrate(<Fixed />);
    expect(fixed.container.querySelector('[data-testid="v"]')?.textContent).toBe("live");
    await fixed.cleanup();
  });

  it("SanityPreferences reflects stored prefs after hydration, not the SSR default", async () => {
    // Stored value is the opposite of the DEFAULT fallback (meter hidden).
    localStorage.setItem(
      PREFERENCES_KEY,
      serializePreferences({ ...DEFAULT_PREFERENCES, sanityMeterVisible: true }),
    );

    const { ssrHtml, container, cleanup } = await renderThenHydrate(
      <SanityPreferences />,
    );

    // SSR renders the server fallback (meter hidden) — the server never sees
    // localStorage, exactly like a real full page load.
    expect(ssrHtml).toContain('aria-checked="false"');

    // After hydration the real stored value wins. A frozen snapshot would stay
    // "false" here (see the self-check above).
    const toggle = container.querySelector(
      '[role="switch"][aria-label="Show sanity meter"]',
    );
    expect(toggle?.getAttribute("aria-checked")).toBe("true");

    await cleanup();
  });

  it("PlayDashboard lists existing characters after hydration, not a blank list", async () => {
    const session = createSession(
      createDefaultGameState(1, "char-x", "Test Hero"),
      "sess-x",
    );
    localStorage.setItem(SESSION_KEY_PREFIX + session.id, serializeSession(session));
    localStorage.setItem(SESSION_INDEX_KEY, JSON.stringify([session.id]));

    const { ssrHtml, container, cleanup } = await renderThenHydrate(<PlayDashboard />);

    // SSR has no localStorage, so the character summary is absent from the
    // server HTML (the list renders blank)…
    expect(ssrHtml).not.toContain("Fool pathway");
    // …but the saved character's summary appears once the client snapshot is read.
    expect(container.textContent).toContain("Fool pathway");

    await cleanup();
  });

  it("JournalPanel shows a loading line pre-hydration, not the empty state, when saves exist", async () => {
    const session = createSession(
      createDefaultGameState(1, "char-j", "Diarist"),
      "sess-j",
    );
    localStorage.setItem(SESSION_KEY_PREFIX + session.id, serializeSession(session));
    localStorage.setItem(SESSION_INDEX_KEY, JSON.stringify([session.id]));

    const { ssrHtml, container, cleanup } = await renderThenHydrate(<JournalPanel />);

    // SSR has no localStorage: a `useHydrated` guard shows a neutral loading line
    // rather than flashing the "no chronicles" empty state to a player who has saves.
    expect(ssrHtml).toContain("Loading journal…");
    expect(ssrHtml).not.toContain("The pages are blank");

    // After hydration the real chronicle appears and the loading line is gone.
    expect(container.textContent).not.toContain("Loading journal…");
    expect(container.textContent).toContain("Diarist");

    await cleanup();
  });
});
