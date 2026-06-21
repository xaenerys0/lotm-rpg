"use client";

import type { ReactNode } from "react";

/** Tiny class joiner — keeps the JSX below readable without a dependency. */
function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

interface StepHeaderProps {
  /** Small uppercase eyebrow above the step's heading area. */
  eyebrow?: string;
  /** When provided, renders a consistent "← Back" control on the left. */
  onBack?: () => void;
  backLabel?: string;
  /** When provided, renders the step progress (dots + "Step X / Y") on the right. */
  progress?: { number: number; total: number };
}

/**
 * One consistent header for every character-creation step: a single back
 * affordance, the step eyebrow, and (for the numbered path steps) one shared
 * progress model — replacing the per-step ad-hoc back buttons and the two
 * competing progress indicators the flow grew over time.
 */
export function StepHeader({
  eyebrow,
  onBack,
  backLabel = "Back",
  progress,
}: StepHeaderProps) {
  return (
    <div className="mb-6">
      {(onBack || progress) && (
        <div className="mb-5 flex items-center justify-between gap-3">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="min-h-[24px] rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted transition-colors hover:border-amber/40 hover:text-amber"
            >
              <span aria-hidden="true">&larr;</span> {backLabel}
            </button>
          ) : (
            <span />
          )}
          {progress && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2" aria-hidden="true">
                {Array.from({ length: progress.total }, (_, i) => i + 1).map((n) => (
                  <div
                    key={n}
                    className={cx(
                      "rounded-full transition-all duration-300",
                      n < progress.number
                        ? "h-1.5 w-1.5 bg-amber"
                        : n === progress.number
                          ? "h-1.5 w-3 bg-amber/70"
                          : "h-1.5 w-1.5 bg-border",
                    )}
                  />
                ))}
              </div>
              <span className="ml-1 text-xs text-muted">
                Step {progress.number}&thinsp;/&thinsp;{progress.total}
              </span>
            </div>
          )}
        </div>
      )}
      {eyebrow && (
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber">
          {eyebrow}
        </p>
      )}
    </div>
  );
}

interface ChoiceCardProps {
  title: ReactNode;
  description?: ReactNode;
  /** Top-right pill — e.g. a pathway group, or "suits the Fool". */
  badge?: ReactNode;
  /** Footer line under the description — e.g. "Begins as Sequence 9 — Seer". */
  meta?: ReactNode;
  /**
   * Selection state. When defined the card is a toggle (`aria-pressed`) and
   * shows a selected ring; when omitted the card is a one-shot navigation
   * button (path / pathway / prologue choice / finale potion).
   */
  selected?: boolean;
  onClick: () => void;
  disabled?: boolean;
  /** "occult" tints the card for the sealed-origin / advanced choices. */
  tone?: "default" | "occult";
  /** Optional left-edge accent (e.g. the finale vial glyph). */
  accent?: ReactNode;
  className?: string;
}

/**
 * The single "pick one of these" primitive used across the whole creation
 * flow — path select, era select, pathway select, prologue choices, finale
 * potions, and the start-opening chooser. One visual language for every
 * choice, replacing the old mix of bespoke cards, plain buttons, and native
 * `<select>` dropdowns whose options couldn't show their own descriptions.
 */
export function ChoiceCard({
  title,
  description,
  badge,
  meta,
  selected,
  onClick,
  disabled,
  tone = "default",
  accent,
  className,
}: ChoiceCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={cx(
        "group flex w-full items-stretch gap-3.5 rounded-xl border bg-surface px-5 py-4 text-left transition-all duration-200",
        selected
          ? tone === "occult"
            ? "border-occult-bright bg-occult/10"
            : "border-amber bg-amber/10"
          : "border-border hover:-translate-y-0.5 hover:border-amber/40",
        disabled &&
          "cursor-not-allowed opacity-50 hover:translate-y-0 hover:border-border",
        className,
      )}
    >
      {accent}
      <span className="min-w-0 flex-1">
        <span className="flex items-start justify-between gap-3">
          <span
            className={cx(
              "font-serif text-base font-semibold transition-colors",
              tone === "occult" ? "text-occult-bright" : "text-foreground",
              !selected && "group-hover:text-amber",
            )}
          >
            {title}
          </span>
          {badge && (
            <span className="shrink-0 rounded-md border border-border bg-surface-raised px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-amber">
              {badge}
            </span>
          )}
        </span>
        {description && (
          <span className="mt-1.5 block text-sm leading-relaxed text-muted">
            {description}
          </span>
        )}
        {meta && (
          <span className="mt-2 block border-t border-border pt-2 text-xs text-muted">
            {meta}
          </span>
        )}
      </span>
    </button>
  );
}
