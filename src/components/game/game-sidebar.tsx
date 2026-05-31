"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const navItems = [
  { href: "/play", label: "Dashboard" },
  { href: "/character", label: "Character" },
  { href: "/journal", label: "Journal" },
  { href: "/settings", label: "Settings" },
] as const;

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
        <span className="font-serif text-lg font-bold text-amber">
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

      {/* Sidebar */}
      <aside
        id="game-sidebar"
        aria-label="Game sidebar"
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-surface transition-[transform,visibility] duration-200 ease-in-out md:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full max-md:invisible"
        }`}
      >
        <div className="relative border-b border-border px-6 py-5">
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-b from-amber/[0.03] to-transparent"
            aria-hidden="true"
          />
          {/* Branding, not a document heading — keeping it a non-heading avoids
              an h2 landing before each page's h1 (heading order, WCAG 1.3.1). */}
          <p className="relative font-serif text-xl font-bold tracking-tight text-amber">
            Lord of the Mysteries
          </p>
          <p className="relative mt-1 text-xs tracking-widest text-muted uppercase">
            Fifth Epoch
          </p>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Game navigation">
          <ul className="space-y-0.5" role="list">
            {navItems.map(({ href, label }) => {
              const isActive = pathname === href || pathname.startsWith(href + "/");
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className={`group flex items-center rounded-md px-3 py-2.5 text-sm transition-[color,background-color,box-shadow] duration-150 ${
                      isActive
                        ? "bg-amber/10 font-medium text-amber shadow-[inset_2px_0_0_var(--color-amber)]"
                        : "text-foreground/70 hover:bg-foreground/[0.04] hover:text-foreground"
                    }`}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <span
                      className={`mr-3 inline-block h-1 w-1 rounded-full transition-all duration-150 ${
                        isActive
                          ? "h-1.5 w-1.5 bg-amber shadow-[0_0_6px_var(--color-amber)]"
                          : "bg-muted/30 group-hover:bg-muted/60"
                      }`}
                      aria-hidden="true"
                    />
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="mx-6 flex items-center gap-3" aria-hidden="true">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
          <span className="text-[10px] text-muted/30">&#9670;</span>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
        </div>

        <div className="px-4 py-4">
          <p className="truncate text-sm text-foreground/70">
            {userEmail || "Unknown user"}
          </p>
          <button
            type="button"
            onClick={handleSignOut}
            disabled={signingOut}
            className="mt-2 inline-flex min-h-[24px] items-center text-xs text-muted transition-colors hover:text-amber disabled:opacity-50"
          >
            {signingOut ? "Signing out…" : "Sign out"}
          </button>
        </div>
      </aside>
    </>
  );
}
