import type { Metadata } from "next";
import { ProviderConfig } from "@/components/game/provider-config";
import { ImageProviderConfig } from "@/components/game/image-provider-config";
import { SanityPreferences } from "@/components/game/sanity-preferences";
import { PageHeader } from "@/components/game/page-header";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <div className="animate-fade-in-up mx-auto max-w-[var(--container-game)] px-4 py-8 sm:px-6 sm:py-10">
      <PageHeader
        eyebrow="Configuration"
        title="Settings"
        description="Configure your game experience."
      />

      <div className="space-y-5">
        <section className="rounded-xl border border-border bg-surface p-6 transition-colors duration-200 hover:border-amber/30">
          <h2 className="font-serif text-lg font-semibold text-foreground">
            AI Provider
          </h2>
          <p className="mt-2 mb-6 text-sm leading-relaxed text-muted">
            Configure your AI provider for narrative generation. Your API key is stored
            locally in this browser and never sent to our servers.
          </p>
          <ProviderConfig />
        </section>

        <section className="rounded-xl border border-border bg-surface p-6 transition-colors duration-200 hover:border-amber/30">
          <h2 className="font-serif text-lg font-semibold text-foreground">Scene art</h2>
          <p className="mt-2 mb-6 text-sm leading-relaxed text-muted">
            Optional AI illustrations for key moments use their own provider and model,
            chosen independently of your narrator. Enable &ldquo;Scene
            illustrations&rdquo; in Preferences below, then configure the image provider
            here. Your key is stored locally in this browser and never sent to our
            servers.
          </p>
          <ImageProviderConfig />
        </section>

        <section className="rounded-xl border border-border bg-surface p-6 transition-colors duration-200 hover:border-amber/30">
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
