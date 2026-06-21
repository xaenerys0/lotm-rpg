"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Mobile bottom navigation (issue #27): thumb-reach access to the four
// most-used screens on small viewports; the full route list stays in the
// collapsible sidebar. Hidden at md+ where the sidebar is persistent.

function Glyph({ name }: { name: string }) {
  const common = {
    width: 20,
    height: 20,
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
  };
  return <svg {...common}>{paths[name]}</svg>;
}

const items = [
  { href: "/play", label: "Play" },
  { href: "/character", label: "Character" },
  { href: "/journal", label: "Journal" },
  { href: "/map", label: "Map" },
] as const;

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Quick navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/90 backdrop-blur-md md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="flex">
        {items.map(({ href, label }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={`flex min-h-[48px] flex-col items-center justify-center gap-1 py-2 text-[11px] font-medium transition-colors ${
                  isActive ? "text-amber" : "text-muted hover:text-foreground"
                }`}
              >
                <Glyph name={href} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
