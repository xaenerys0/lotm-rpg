export default function PlayPage() {
  return (
    <div className="mx-auto max-w-[var(--container-game)] px-6 py-10">
      <header className="mb-10">
        <h1 className="font-serif text-3xl font-bold tracking-tight text-amber">
          Welcome, Beyonder
        </h1>
        <p className="mt-2 text-muted">
          The Fifth Epoch stirs. Your journey through the world of mysteries awaits.
        </p>
      </header>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="rounded-lg border border-border bg-surface p-6">
          <h2 className="font-serif text-xl font-semibold text-foreground">
            Start New Game
          </h2>
          <p className="mt-2 text-sm text-muted">
            Choose your Beyonder pathway and begin your chronicle in Tingen City.
          </p>
          <button
            disabled
            className="mt-4 cursor-not-allowed rounded bg-amber/20 px-4 py-2 text-sm font-medium text-amber/50"
          >
            Begin Journey
          </button>
          <p className="mt-2 text-xs text-muted/60">
            Requires character creation &mdash; coming soon
          </p>
        </div>

        <div className="rounded-lg border border-border bg-surface p-6">
          <h2 className="font-serif text-xl font-semibold text-foreground">Continue</h2>
          <p className="mt-2 text-sm text-muted">
            Resume your journey where you left off.
          </p>
          <button
            disabled
            className="mt-4 cursor-not-allowed rounded border border-border px-4 py-2 text-sm font-medium text-foreground/40"
          >
            Resume
          </button>
          <p className="mt-2 text-xs text-muted/60">No active game found</p>
        </div>
      </div>

      <section className="mt-10">
        <h2 className="font-serif text-lg font-semibold text-foreground/80">
          Character Summary
        </h2>
        <div className="mt-3 rounded-lg border border-dashed border-border bg-surface/50 p-8 text-center">
          <p className="text-sm text-muted">
            No character created yet. Start a new game to forge your Beyonder identity.
          </p>
        </div>
      </section>
    </div>
  );
}
