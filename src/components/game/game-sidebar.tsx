"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  saveActiveSessionId,
  useActiveSessionId,
  useSessionSummaries,
} from "@/lib/react/session-store";

// Each destination carries a small decorative glyph (aria-hidden) — the label
// always carries the meaning.
const navItems = [
  { href: "/play", label: "Dashboard", glyph: "✦" },
  { href: "/character", label: "Character", glyph: "◉" },
  { href: "/journal", label: "Journal", glyph: "✒" },
  { href: "/map", label: "Map", glyph: "✧" },
  { href: "/glossary", label: "Glossary", glyph: "❧" },
  { href: "/market", label: "Market", glyph: "⚖" },
  { href: "/profile", label: "Profile", glyph: "❖" },
  { href: "/leaderboard", label: "Leaderboard", glyph: "⚜" },
  { href: "/society", label: "Society", glyph: "☽" },
  { href: "/guide", label: "Guide", glyph: "❡" },
  { href: "/settings", label: "Settings", glyph: "⚙" },
] as const;

/**
 * The global active-character switcher (active-character sync): one control,
 * visible on every page, that sets the single pointer the Map/Journal/Character/
 * Glossary/Market/Society/Profile all read. Renders nothing with no saves; a
 * static name with one save; a `<select>` to switch between several.
 */
function CharacterSwitcher() {
  const summaries = useSessionSummaries();
  const activeId = useActiveSessionId();

  if (summaries.length === 0) return null;

  const label = (id: string | null) =>
    summaries.find((s) => s.id === id)?.characterName ?? "Unnamed Beyonder";

  return (
    <div className="border-b border-border px-5 py-4">
      <p className="text-[10px] tracking-[0.25em] text-amber uppercase">
        Active character
      </p>
      {summaries.length === 1 ? (
        <p className="mt-1.5 truncate font-serif text-base font-medium text-foreground">
          {label(activeId)}
        </p>
      ) : (
        <>
          <label htmlFor="active-character" className="sr-only">
            Active character
          </label>
          <select
            id="active-character"
            value={activeId ?? ""}
            onChange={(e) => saveActiveSessionId(e.target.value)}
            className="mt-1.5 w-full truncate rounded-sm border border-border bg-background px-2.5 py-1.5 font-serif text-sm text-foreground focus:border-amber/60 focus:outline-none focus:ring-1 focus:ring-amber/30"
          >
            {summaries.map((s) => (
              <option key={s.id} value={s.id}>
                {s.characterName ?? "Unnamed Beyonder"} — Seq {s.sequenceLevel}
              </option>
            ))}
          </select>
        </>
      )}
    </div>
  );
}

export function GameSidebar({ userEmail }: { userEmail: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setMobileOpen(false);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/login");
    } catch {
      setSigningOut(false);
    }
  }

  return (
    <>
      {/* Mobile top bar */}
      <header className="fixed inset-x-0 top-0 z-50 flex h-14 items-center justify-between border-b border-border bg-surface/95 px-4 backdrop-blur-sm md:hidden">
        <span className="font-serif text-lg font-semibold text-amber">
          Lord of the Mysteries
        </span>
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex h-10 w-10 items-center justify-center rounded text-foreground transition-colors hover:bg-amber/10 hover:text-amber"
          aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
          aria-expanded={mobileOpen}
          aria-controls="game-sidebar"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            aria-hidden="true"
          >
            {mobileOpen ? (
              <>
                <line x1="4" y1="4" x2="16" y2="16" />
                <line x1="16" y1="4" x2="4" y2="16" />
              </>
            ) : (
              <>
                <line x1="3" y1="5" x2="17" y2="5" />
                <line x1="3" y1="10" x2="17" y2="10" />
                <line x1="3" y1="15" x2="17" y2="15" />
              </>
            )}
          </svg>
        </button>
      </header>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar — a gilt-railed grimoire spine. */}
      <aside
        id="game-sidebar"
        aria-label="Game sidebar"
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-surface transition-[transform,visibility] duration-200 ease-in-out md:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full max-md:invisible"
        }`}
      >
        {/* Gilt spine accent down the inner edge. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-amber/30 to-transparent"
        />

        <div className="relative border-b border-border px-6 py-5">
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-b from-amber/[0.05] to-transparent"
            aria-hidden="true"
          />
          {/* Branding, not a document heading — keeping it a non-heading avoids
              an h2 landing before each page's h1 (heading order, WCAG 1.3.1). */}
          <p className="relative font-serif text-xl font-semibold tracking-tight text-foreground">
            Lord of the{" "}
            <span className="bg-gradient-to-r from-gold to-amber bg-clip-text text-transparent">
              Mysteries
            </span>
          </p>
          <p className="relative mt-1 text-[10px] tracking-[0.3em] text-muted uppercase">
            ✦ Fifth Epoch ✦
          </p>
        </div>

        <CharacterSwitcher />

        {/* The nav list owns the overflow: it flexes to fill the space between
            the pinned header/switcher above and the sign-out footer below, and
            scrolls internally when the items exceed the viewport height. */}
        <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Game navigation">
          <ul className="space-y-0.5" role="list">
            {navItems.map(({ href, label, glyph }) => {
              const isActive = pathname === href || pathname.startsWith(href + "/");
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className={`group relative flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-[color,background-color,box-shadow] duration-150 ${
                      isActive
                        ? "bg-gradient-to-r from-amber/15 to-transparent font-medium text-amber shadow-[inset_2px_0_0_var(--color-amber)]"
                        : "text-foreground/75 hover:bg-foreground/[0.04] hover:text-foreground"
                    }`}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <span
                      aria-hidden="true"
                      className={`inline-flex h-5 w-5 items-center justify-center text-sm transition-colors ${
                        isActive ? "text-gold" : "text-muted group-hover:text-amber"
                      }`}
                    >
                      {glyph}
                    </span>
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="mx-6 flex items-center gap-3" aria-hidden="true">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber/30 to-transparent" />
          <span className="text-[10px] text-amber/60">&#10070;</span>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber/30 to-transparent" />
        </div>

        <div className="px-5 py-4">
          <p className="truncate text-sm text-foreground/75">
            {userEmail || "Unknown user"}
          </p>
          <button
            type="button"
            onClick={handleSignOut}
            disabled={signingOut}
            className="mt-2 inline-flex min-h-[24px] items-center text-xs tracking-wide text-muted transition-colors hover:text-amber disabled:opacity-50"
          >
            {signingOut ? "Signing out…" : "Sign out"}
          </button>
        </div>
      </aside>
    </>
  );
}
