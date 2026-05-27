export default function JournalPage() {
  return (
    <div className="mx-auto max-w-[var(--container-game)] px-6 py-10">
      <header className="mb-10">
        <h1 className="font-serif text-3xl font-bold tracking-tight text-amber">
          Journal
        </h1>
        <p className="mt-2 text-muted">
          A chronicle of your journey through the Fifth Epoch.
        </p>
      </header>

      <div className="rounded-lg border border-dashed border-border bg-surface/50 p-12 text-center">
        <p className="font-serif text-lg text-foreground/60">The pages are blank</p>
        <p className="mt-3 text-sm text-muted">
          Your story journal will record every choice, encounter, and discovery as your
          narrative unfolds.
        </p>
      </div>
    </div>
  );
}
