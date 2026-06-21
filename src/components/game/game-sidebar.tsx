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

// Numbered like the contents page of a field manual.
const navItems = [
  { href: "/play", label: "Dashboard" },
  { href: "/character", label: "Character" },
  { href: "/journal", label: "Journal" },
  { href: "/map", label: "Map" },
  { href: "/glossary", label: "Glossary" },
  { href: "/market", label: "Market" },
  { href: "/profile", label: "Profile" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/society", label: "Society" },
  { href: "/guide", label: "Guide" },
  { href: "/settings", label: "Settings" },
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
    <div className="border-b-2 border-border px-5 py-4">
      <p className="font-mono text-[10px] font-semibold tracking-[0.2em] text-amber uppercase">
        Active character
      </p>
      {summaries.length === 1 ? (
        <p className="mt-1.5 truncate font-serif text-xl font-bold tracking-tight text-foreground uppercase">
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
            className="mt-1.5 w-full truncate border-2 border-border bg-surface-raised px-2.5 py-1.5 font-sans text-sm text-foreground focus:border-amber focus:outline-none"
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
      <header className="fixed inset-x-0 top-0 z-50 flex h-14 items-center justify-between border-b-2 border-border bg-surface px-4 md:hidden">
        <span className="font-serif text-xl font-black tracking-tight text-foreground uppercase">
          Lord of the Mysteries
        </span>
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex h-10 w-10 items-center justify-center border-2 border-border text-foreground transition-colors hover:bg-foreground hover:text-surface"
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
            strokeWidth="2"
            strokeLinecap="square"
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
          className="fixed inset-0 z-40 bg-foreground/30 md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar — the manual's contents page. */}
      <aside
        id="game-sidebar"
        aria-label="Game sidebar"
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r-2 border-border bg-surface transition-[transform,visibility] duration-200 ease-in-out md:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full max-md:invisible"
        }`}
      >
        <div className="border-b-2 border-border px-5 py-5">
          {/* Branding, not a document heading — keeping it a non-heading avoids
              an h2 landing before each page's h1 (heading order, WCAG 1.3.1). */}
          <p className="font-mono text-[10px] tracking-[0.25em] text-amber uppercase">
            No. V · Field Manual
          </p>
          <p className="mt-1 font-serif text-2xl leading-[0.9] font-black tracking-tight text-foreground uppercase">
            Lord of the Mysteries
          </p>
        </div>

        <CharacterSwitcher />

        {/* The nav list owns the overflow: it flexes to fill the space between
            the pinned header/switcher above and the sign-out footer below, and
            scrolls internally when the items exceed the viewport height. */}
        <nav className="flex-1 overflow-y-auto py-2" aria-label="Game navigation">
          <ul role="list">
            {navItems.map(({ href, label }, i) => {
              const isActive = pathname === href || pathname.startsWith(href + "/");
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className={`group flex items-baseline gap-3 border-l-4 px-5 py-2.5 font-mono text-sm tracking-wide uppercase transition-colors ${
                      isActive
                        ? "border-amber bg-amber/10 font-bold text-amber"
                        : "border-transparent text-foreground/80 hover:bg-foreground/[0.05] hover:text-foreground"
                    }`}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <span
                      aria-hidden="true"
                      className={`text-xs ${isActive ? "text-amber" : "text-muted"}`}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t-2 border-border px-5 py-4">
          <p className="truncate font-sans text-sm text-foreground/80">
            {userEmail || "Unknown user"}
          </p>
          <button
            type="button"
            onClick={handleSignOut}
            disabled={signingOut}
            className="mt-2 inline-flex min-h-[24px] items-center font-mono text-xs tracking-wide text-muted uppercase transition-colors hover:text-amber disabled:opacity-50"
          >
            {signingOut ? "Signing out…" : "Sign out"}
          </button>
        </div>
      </aside>
    </>
  );
}
