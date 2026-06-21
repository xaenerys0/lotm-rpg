"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Mobile bottom navigation (issue #27): thumb-reach access to the four
// most-used screens on small viewports; the full route list stays in the
// collapsible sidebar. Hidden at md+ where the sidebar is persistent.

const items = [
  { href: "/play", label: "Play", glyph: "✦" },
  { href: "/character", label: "Character", glyph: "♟" },
  { href: "/journal", label: "Journal", glyph: "✎" },
  { href: "/map", label: "Map", glyph: "✧" },
] as const;

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Quick navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 backdrop-blur-sm md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div
        aria-hidden="true"
        className="h-px w-full bg-gradient-to-r from-transparent via-amber/30 to-transparent"
      />
      <ul className="flex">
        {items.map(({ href, label, glyph }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={`relative flex min-h-[48px] flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium transition-colors ${
                  isActive ? "text-amber" : "text-muted hover:text-foreground"
                }`}
              >
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-5 top-0 h-px bg-gold shadow-[0_0_8px_var(--color-gold)]"
                  />
                )}
                <span aria-hidden="true" className="text-base leading-none">
                  {glyph}
                </span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
