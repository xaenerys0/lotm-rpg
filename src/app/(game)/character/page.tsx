export default function CharacterPage() {
  return (
    <div className="mx-auto max-w-[var(--container-game)] px-6 py-10">
      <header className="mb-10">
        <h1 className="font-serif text-3xl font-bold tracking-tight text-amber">
          Character
        </h1>
        <p className="mt-2 text-muted">Your Beyonder identity and progression.</p>
      </header>

      <div className="rounded-lg border border-dashed border-border bg-surface/50 p-12 text-center">
        <p className="font-serif text-lg text-foreground/60">
          The pathways await your choice
        </p>
        <p className="mt-3 text-sm text-muted">
          Character creation will be available once the core game loop is ready. Choose
          your Beyonder pathway, track your Sequence progression, and manage your
          abilities.
        </p>
      </div>
    </div>
  );
}
