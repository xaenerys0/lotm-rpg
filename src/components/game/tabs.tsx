"use client";

import { useRef, type KeyboardEvent } from "react";

// ---------------------------------------------------------------------------
// TabBar — a small, accessible tablist primitive (history-context sheet UI)
// ---------------------------------------------------------------------------
//
// The character sheet grew into a single tall scroll of ~11 sections that pile
// up over a long game. This groups them under tabs without a component library
// (the project uses pure Tailwind). Implements the WAI-ARIA "Tabs with manual
// activation" — wait, we use AUTOMATIC activation (selection follows focus),
// which is the recommended pattern for tab panels that are cheap to show:
//   - `role="tablist"` wraps `role="tab"` buttons; each `aria-selected` +
//     `aria-controls` its panel; a roving `tabIndex` keeps one tab in the tab
//     order; Left/Right/Home/End move selection AND focus.
// The PARENT renders the panels (one per tab id) with the matching ids:
//   id={tabPanelId(idBase, tabId)}  aria-labelledby={tabId(idBase, tabId)}
// so the chrome stays generic and the panel content stays with the sheet.

export interface TabDef {
  id: string;
  label: string;
  /** Optional count chip (e.g. the Codex entity total). */
  badge?: number;
}

/** The DOM id of a tab button — shared by the bar and each panel's labelledby. */
export function tabButtonId(idBase: string, tabId: string): string {
  return `${idBase}-${tabId}-tab`;
}

/** The DOM id of a tab panel — shared by the bar's aria-controls and the panel. */
export function tabPanelId(idBase: string, tabId: string): string {
  return `${idBase}-${tabId}-panel`;
}

export function TabBar({
  tabs,
  activeId,
  onSelect,
  idBase,
  label,
}: {
  tabs: readonly TabDef[];
  activeId: string;
  onSelect: (id: string) => void;
  /** Prefix for the generated tab/panel ids (must match the parent's panels). */
  idBase: string;
  /** Accessible name for the tablist. */
  label: string;
}) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});

  function focusTab(id: string) {
    onSelect(id);
    // Move focus to the newly selected tab (automatic-activation pattern).
    refs.current[id]?.focus();
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const index = tabs.findIndex((t) => t.id === activeId);
    if (index === -1) return;
    let next = index;
    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown":
        next = (index + 1) % tabs.length;
        break;
      case "ArrowLeft":
      case "ArrowUp":
        next = (index - 1 + tabs.length) % tabs.length;
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = tabs.length - 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    focusTab(tabs[next].id);
  }

  return (
    <div
      role="tablist"
      aria-label={label}
      aria-orientation="horizontal"
      onKeyDown={onKeyDown}
      className="-mx-1 flex flex-wrap gap-1 border-b border-border px-1"
    >
      {tabs.map((tab) => {
        const selected = tab.id === activeId;
        return (
          <button
            key={tab.id}
            ref={(el) => {
              refs.current[tab.id] = el;
            }}
            id={tabButtonId(idBase, tab.id)}
            role="tab"
            type="button"
            aria-selected={selected}
            aria-controls={tabPanelId(idBase, tab.id)}
            tabIndex={selected ? 0 : -1}
            onClick={() => onSelect(tab.id)}
            className={`group relative -mb-px inline-flex min-h-[44px] items-center gap-2 rounded-t-lg px-3.5 py-2 text-xs font-semibold tracking-[0.14em] uppercase transition-colors sm:px-4 ${
              selected
                ? "border-b-2 border-amber text-amber"
                : "border-b-2 border-transparent text-muted hover:text-foreground"
            }`}
          >
            <span>{tab.label}</span>
            {tab.badge !== undefined && tab.badge > 0 && (
              <span
                aria-hidden="true"
                className={`inline-flex min-w-[1.25rem] justify-center rounded-full px-1.5 py-0.5 text-[10px] leading-none font-medium normal-case ${
                  selected
                    ? "bg-amber/15 text-amber"
                    : "bg-surface-raised text-muted group-hover:text-foreground"
                }`}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
