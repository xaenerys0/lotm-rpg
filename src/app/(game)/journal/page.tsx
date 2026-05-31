import type { Metadata } from "next";

export const metadata: Metadata = { title: "Journal" };

export default function JournalPage() {
  return (
    <div className="mx-auto max-w-[var(--container-game)] px-6 py-10 animate-fade-in-up">
      <header className="mb-10">
        <h1 className="font-serif text-3xl font-bold tracking-tight text-amber md:text-4xl">
          Journal
        </h1>
        <p className="mt-2 text-muted">
          A chronicle of your journey through the Fifth Epoch.
        </p>
      </header>

      <div className="rounded-lg border border-dashed border-border/60 p-12 text-center">
        <p className="font-serif text-lg italic text-foreground/70">
          &ldquo;The pages are blank&rdquo;
        </p>
        <div
          className="mx-auto my-4 flex items-center justify-center gap-3"
          aria-hidden="true"
        >
          <div className="h-px w-12 bg-gradient-to-r from-transparent to-border" />
          <span className="text-[10px] text-muted/25">&#9670;</span>
          <div className="h-px w-12 bg-gradient-to-l from-transparent to-border" />
        </div>
        <p className="mx-auto max-w-md text-sm leading-relaxed text-muted">
          Your story journal will record every choice, encounter, and discovery as your
          narrative unfolds.
        </p>
      </div>
    </div>
  );
}
