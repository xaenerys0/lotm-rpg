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
      if (e.key === "Escape" && mobileOpen) {
        setMobileOpen(false);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen]);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/login");
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <>
      {/* Mobile top bar */}
      <header className="fixed inset-x-0 top-0 z-50 flex h-14 items-center justify-between border-b border-border bg-surface px-4 md:hidden">
        <span className="font-serif text-lg font-bold text-amber">
          Lord of the Mysteries
        </span>
        <button
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

      {/* Sidebar — max-md:invisible hides from a11y tree and focus order on mobile when closed */}
      <aside
        id="game-sidebar"
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-surface transition-[transform,visibility] duration-200 ease-in-out md:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full max-md:invisible"
        }`}
      >
        <div className="border-b border-border px-6 py-5">
          <h2 className="font-serif text-xl font-bold tracking-tight text-amber">
            Lord of the Mysteries
          </h2>
          <p className="mt-1 text-xs tracking-wide text-muted">Fifth Epoch</p>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Game navigation">
          <ul className="space-y-1" role="list">
            {navItems.map(({ href, label }) => {
              const isActive = pathname === href || pathname.startsWith(href + "/");
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center rounded-md px-3 py-2.5 text-sm transition-colors ${
                      isActive
                        ? "bg-amber/10 font-medium text-amber"
                        : "text-foreground/80 hover:bg-foreground/5 hover:text-foreground"
                    }`}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <span
                      className={`mr-3 inline-block h-1.5 w-1.5 rounded-full ${
                        isActive ? "bg-amber" : "bg-muted/40"
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

        <div className="mx-6 flex items-center gap-3 text-border" aria-hidden="true">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted/50">&#9670;</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <div className="px-4 py-4">
          <p className="truncate text-sm text-foreground/70">{userEmail}</p>
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="mt-2 text-xs text-muted transition-colors hover:text-amber disabled:opacity-50"
          >
            {signingOut ? "Signing out…" : "Sign out"}
          </button>
        </div>
      </aside>
    </>
  );
}
