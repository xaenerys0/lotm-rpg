"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Mobile bottom navigation (issue #27): thumb-reach access to the four
// most-used screens on small viewports; the full route list stays in the
// collapsible sidebar. Hidden at md+ where the sidebar is persistent.

const items = [
  { href: "/play", label: "Play" },
  { href: "/character", label: "Self" },
  { href: "/journal", label: "Log" },
  { href: "/map", label: "Map" },
] as const;

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Quick navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-border bg-surface md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="flex divide-x-2 divide-border">
        {items.map(({ href, label }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={`flex min-h-[48px] items-center justify-center py-2 font-mono text-xs font-bold tracking-[0.15em] uppercase transition-colors ${
                  isActive
                    ? "bg-amber text-surface"
                    : "text-foreground/80 hover:bg-foreground/[0.05] hover:text-foreground"
                }`}
              >
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
