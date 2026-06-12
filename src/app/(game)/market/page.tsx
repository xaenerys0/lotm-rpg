import type { Metadata } from "next";

import { MarketPanel } from "@/components/game/market-panel";

export const metadata: Metadata = { title: "Market" };

export default function MarketPage() {
  return (
    <div className="mx-auto max-w-[var(--container-game)] px-6 py-10 animate-fade-in-up">
      <header className="gaslit mb-10">
        <h1 className="font-serif text-3xl font-bold tracking-tight text-amber md:text-4xl">
          The Night Market
        </h1>
        <p className="mt-2 text-muted">
          Goods traded between Beyonders, across timelines.
        </p>
      </header>

      <MarketPanel />
    </div>
  );
}
