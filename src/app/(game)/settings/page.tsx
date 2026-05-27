export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-[var(--container-game)] px-6 py-10">
      <header className="mb-10">
        <h1 className="font-serif text-3xl font-bold tracking-tight text-amber">
          Settings
        </h1>
        <p className="mt-2 text-muted">Configure your game experience.</p>
      </header>

      <div className="space-y-6">
        <section className="rounded-lg border border-border bg-surface p-6">
          <h2 className="font-serif text-lg font-semibold text-foreground">
            AI Provider
          </h2>
          <p className="mt-2 text-sm text-muted">
            Configure your AI provider for narrative generation. Support for multiple
            providers and bring-your-own-key is planned.
          </p>
          <div className="mt-4 rounded border border-dashed border-border bg-background/50 p-4 text-center">
            <p className="text-xs text-muted/60">
              Provider configuration &mdash; coming soon
            </p>
          </div>
        </section>

        <section className="rounded-lg border border-border bg-surface p-6">
          <h2 className="font-serif text-lg font-semibold text-foreground">
            Preferences
          </h2>
          <p className="mt-2 text-sm text-muted">Game preferences and display options.</p>
          <div className="mt-4 rounded border border-dashed border-border bg-background/50 p-4 text-center">
            <p className="text-xs text-muted/60">Preferences &mdash; coming soon</p>
          </div>
        </section>
      </div>
    </div>
  );
}
