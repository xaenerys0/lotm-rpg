export default function CharacterPage() {
  return (
    <div className="mx-auto max-w-[var(--container-game)] px-6 py-10 animate-fade-in-up">
      <header className="mb-10">
        <h1 className="font-serif text-3xl font-bold tracking-tight text-amber md:text-4xl">
          Character
        </h1>
        <p className="mt-2 text-muted">Your Beyonder identity and progression.</p>
      </header>

      <div className="rounded-lg border border-dashed border-border/60 p-12 text-center">
        <p className="font-serif text-lg italic text-foreground/50">
          &ldquo;The pathways await your choice&rdquo;
        </p>
        <div
          className="mx-auto my-4 flex items-center justify-center gap-3"
          aria-hidden="true"
        >
          <div className="h-px w-12 bg-gradient-to-r from-transparent to-border" />
          <span className="text-[10px] text-muted/25">&#9670;</span>
          <div className="h-px w-12 bg-gradient-to-l from-transparent to-border" />
        </div>
        <p className="mx-auto max-w-md text-sm leading-relaxed text-muted/70">
          Character creation will be available once the core game loop is ready. Choose
          your Beyonder pathway, track your Sequence progression, and manage your
          abilities.
        </p>
      </div>
    </div>
  );
}
