import type { Metadata } from "next";

import { SocietyPanel } from "@/components/game/society-panel";
import { PageHeader } from "@/components/game/page-header";

export const metadata: Metadata = { title: "Society" };

export default function SocietyPage() {
  return (
    <div className="animate-fade-in-up mx-auto max-w-[var(--container-game)] px-4 py-8 sm:px-6 sm:py-10">
      <PageHeader
        eyebrow="The Fog"
        title="The Gathering"
        description="Code names, careful favors, and a table above the fog."
      />

      <SocietyPanel />
    </div>
  );
}
