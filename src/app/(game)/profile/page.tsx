import type { Metadata } from "next";

import { ShowcasePanel } from "@/components/game/showcase-panel";
import { PageHeader } from "@/components/game/page-header";

export const metadata: Metadata = { title: "Profile" };

export default function ProfilePage() {
  return (
    <div className="animate-fade-in-up mx-auto max-w-[var(--container-game)] px-4 py-8 sm:px-6 sm:py-10">
      <PageHeader
        eyebrow="Showcase"
        title="Profile"
        description="Your deeds, your drift from canon, and what you choose to show the world."
      />

      <ShowcasePanel />
    </div>
  );
}
