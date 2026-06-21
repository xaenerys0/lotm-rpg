import type { Metadata } from "next";

import { MarketPanel } from "@/components/game/market-panel";
import { PageHeader } from "@/components/game/page-header";

export const metadata: Metadata = { title: "Market" };

export default function MarketPage() {
  return (
    <div className="animate-fade-in-up mx-auto max-w-[var(--container-game)] px-4 py-8 sm:px-6 sm:py-10">
      <PageHeader
        eyebrow="Trade"
        title="The Night Market"
        description="Goods traded between Beyonders, across timelines."
      />

      <MarketPanel />
    </div>
  );
}
