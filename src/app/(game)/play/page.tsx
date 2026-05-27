export default function PlayPage() {
  return (
    <div className="mx-auto max-w-[var(--container-game)] px-6 py-10 animate-fade-in-up">
      <header className="mb-10">
        <h1 className="font-serif text-3xl font-bold tracking-tight text-amber md:text-4xl">
          Welcome, Beyonder
        </h1>
        <p className="mt-2 max-w-xl text-muted">
          The Fifth Epoch stirs. Your journey through the world of mysteries awaits.
        </p>
      </header>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="group rounded-lg border border-border bg-surface p-6 transition-colors duration-200 hover:border-amber/20">
          <h2 className="font-serif text-xl font-semibold text-foreground">
            Start New Game
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Choose your Beyonder pathway and begin your chronicle in Tingen City.
          </p>
          <button
            type="button"
            disabled
            className="mt-5 cursor-not-allowed rounded bg-amber/15 px-4 py-2 text-sm font-medium text-amber/40"
          >
            Begin Journey
          </button>
          <p className="mt-2 text-xs text-muted/50">
            Requires character creation &mdash; coming soon
          </p>
        </div>

        <div className="group rounded-lg border border-border bg-surface p-6 transition-colors duration-200 hover:border-amber/20">
          <h2 className="font-serif text-xl font-semibold text-foreground">Continue</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Resume your journey where you left off.
          </p>
          <button
            type="button"
            disabled
            className="mt-5 cursor-not-allowed rounded border border-border px-4 py-2 text-sm font-medium text-foreground/30"
          >
            Resume
          </button>
          <p className="mt-2 text-xs text-muted/50">No active game found</p>
        </div>
      </div>

      <div className="my-10 flex items-center gap-4" aria-hidden="true">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
        <span className="font-serif text-xs text-muted/25">&#10022;</span>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>

      <section>
        <h2 className="font-serif text-lg font-semibold text-foreground/70">
          Character Summary
        </h2>
        <div className="mt-3 rounded-lg border border-dashed border-border/60 p-8 text-center">
          <p className="font-serif text-sm italic text-muted/60">
            No character created yet. Start a new game to forge your Beyonder identity.
          </p>
        </div>
      </section>
    </div>
  );
}
