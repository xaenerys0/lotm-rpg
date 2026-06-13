import type { Metadata } from "next";
import { ProviderConfig } from "@/components/game/provider-config";
import { SanityPreferences } from "@/components/game/sanity-preferences";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-[var(--container-game)] px-4 py-8 sm:px-6 sm:py-10 animate-fade-in-up">
      <header className="mb-10">
        <h1 className="font-serif text-3xl font-bold tracking-tight text-amber md:text-4xl">
          Settings
        </h1>
        <p className="mt-2 text-muted">Configure your game experience.</p>
      </header>

      <div className="space-y-6">
        <section className="rounded-lg border border-border bg-surface p-6 transition-colors duration-200 hover:border-amber/20">
          <h2 className="font-serif text-lg font-semibold text-foreground">
            AI Provider
          </h2>
          <p className="mt-2 mb-6 text-sm leading-relaxed text-muted">
            Configure your AI provider for narrative generation. Your API key is stored
            locally in this browser and never sent to our servers.
          </p>
          <ProviderConfig />
        </section>

        <section className="rounded-lg border border-border bg-surface p-6 transition-colors duration-200 hover:border-amber/20">
          <h2 className="font-serif text-lg font-semibold text-foreground">
            Preferences
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Game preferences and display options.
          </p>
          <SanityPreferences />
        </section>
      </div>
    </div>
  );
}
