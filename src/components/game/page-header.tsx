import type { ReactNode } from "react";

/**
 * The standard page header for every game route — a cohesive Lucid header:
 * a small amber eyebrow kicker, a serif title, an optional description, an
 * optional actions slot, and a hairline rule that anchors the page.
 *
 * Server-component friendly (no client hooks). Each route still owns its
 * single `<h1>` here, preserving heading order (WCAG 1.3.1).
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  /** Optional actions rendered at the end of the title row (e.g. buttons). */
  children?: ReactNode;
}) {
  return (
    <header className="mb-8 sm:mb-10">
      {eyebrow ? (
        <p className="mb-2 text-xs font-semibold tracking-[0.18em] text-amber uppercase">
          {eyebrow}
        </p>
      ) : null}
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <h1 className="font-serif text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-2 max-w-2xl leading-relaxed text-muted">{description}</p>
          ) : null}
        </div>
        {children ? (
          <div className="flex shrink-0 items-center gap-2">{children}</div>
        ) : null}
      </div>
      <div aria-hidden="true" className="gilt-rule mt-6" />
    </header>
  );
}
