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

// Clean 16px line icons keyed by route. Decorative (aria-hidden) — the label
// always carries the meaning.
function Icon({ name }: { name: string }) {
  const common = {
    width: 16,
    height: 16,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  const paths: Record<string, React.ReactNode> = {
    "/play": <path d="M4 5v14l14-7z" />,
    "/character": (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
      </>
    ),
    "/journal": (
      <>
        <path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z" />
        <path d="M8 8h8M8 12h8" />
      </>
    ),
    "/map": (
      <>
        <path d="M9 4 4 6v14l5-2 6 2 5-2V4l-5 2-6-2z" />
        <path d="M9 4v14M15 6v14" />
      </>
    ),
    "/glossary": (
      <>
        <path d="M6 4h9a3 3 0 0 1 3 3v13H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
        <path d="M9 9h6" />
      </>
    ),
    "/market": (
      <>
        <path d="M4 9h16l-1 11H5z" />
        <path d="M9 9V6a3 3 0 0 1 6 0v3" />
      </>
    ),
    "/profile": (
      <>
        <circle cx="12" cy="12" r="8" />
        <path d="M12 8v8M8 12h8" />
      </>
    ),
    "/leaderboard": (
      <>
        <path d="M6 20V11M12 20V5M18 20v-6" />
      </>
    ),
    "/society": (
      <>
        <circle cx="9" cy="9" r="3" />
        <circle cx="16" cy="11" r="2.5" />
        <path d="M4 20c0-3 2.5-5 5-5s5 2 5 5M14 20c0-2 1.5-3.5 2.5-3.5S20 18 20 20" />
      </>
    ),
    "/guide": (
      <>
        <circle cx="12" cy="12" r="8" />
        <path d="M9.5 9.5a2.5 2.5 0 0 1 4.5 1.5c0 1.5-2 2-2 3.5" />
        <path d="M12 17.5h.01" />
      </>
    ),
    "/settings": (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" />
      </>
    ),
  };
  return <svg {...common}>{paths[name]}</svg>;
}

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
    <div className="px-3 pb-3">
      <div className="rounded-lg border border-border bg-surface-raised/60 px-3 py-2.5">
        <p className="text-[10px] font-medium tracking-wider text-muted uppercase">
          Active character
        </p>
        {summaries.length === 1 ? (
          <p className="mt-1 truncate text-sm font-semibold text-foreground">
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
              className="mt-1 w-full truncate rounded-md border border-border bg-surface px-2.5 py-1.5 text-sm text-foreground focus:border-amber focus:outline-none focus:ring-1 focus:ring-amber/40"
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
      <header className="fixed inset-x-0 top-0 z-50 flex h-14 items-center justify-between border-b border-border bg-surface/90 px-4 backdrop-blur-md md:hidden">
        <span className="font-serif text-lg font-semibold text-foreground">
          Lord of the Mysteries
        </span>
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-surface-raised"
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
          className="fixed inset-0 z-40 bg-background/70 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        id="game-sidebar"
        aria-label="Game sidebar"
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-surface transition-[transform,visibility] duration-200 ease-in-out md:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full max-md:invisible"
        }`}
      >
        <div className="px-5 py-5">
          {/* Branding, not a document heading — keeping it a non-heading avoids
              an h2 landing before each page's h1 (heading order, WCAG 1.3.1). */}
          <p className="font-serif text-lg font-semibold tracking-tight text-foreground">
            Lord of the{" "}
            <span className="bg-gradient-to-r from-gold to-amber bg-clip-text text-transparent">
              Mysteries
            </span>
          </p>
          <p className="mt-0.5 text-[11px] tracking-wider text-muted uppercase">
            Fifth Epoch
          </p>
        </div>

        <CharacterSwitcher />

        {/* The nav list owns the overflow: it flexes to fill the space between
            the pinned header/switcher above and the sign-out footer below, and
            scrolls internally when the items exceed the viewport height. */}
        <nav className="flex-1 overflow-y-auto px-3 py-1" aria-label="Game navigation">
          <ul className="space-y-0.5" role="list">
            {navItems.map(({ href, label }) => {
              const isActive = pathname === href || pathname.startsWith(href + "/");
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors duration-150 ${
                      isActive
                        ? "bg-amber/10 font-medium text-amber"
                        : "text-muted hover:bg-surface-raised hover:text-foreground"
                    }`}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <span
                      className={
                        isActive
                          ? "text-amber"
                          : "text-fog transition-colors group-hover:text-foreground"
                      }
                    >
                      <Icon name={href} />
                    </span>
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-border px-4 py-4">
          <p className="truncate text-sm text-muted">{userEmail || "Unknown user"}</p>
          <button
            type="button"
            onClick={handleSignOut}
            disabled={signingOut}
            className="mt-2 inline-flex min-h-[24px] items-center text-xs font-medium text-muted transition-colors hover:text-amber disabled:opacity-50"
          >
            {signingOut ? "Signing out…" : "Sign out"}
          </button>
        </div>
      </aside>
    </>
  );
}
