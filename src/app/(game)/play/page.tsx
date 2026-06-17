import type { Metadata } from "next";
import Link from "next/link";

import { PlayDashboard } from "@/components/game/play-dashboard";
import { FirstTimeHint } from "@/components/game/first-time-hint";

export const metadata: Metadata = { title: "Dashboard" };

export default function PlayPage() {
  return (
    <>
      <div className="mx-auto max-w-[var(--container-game)] px-4 pt-8 empty:hidden sm:px-6 sm:pt-10">
        <FirstTimeHint id="guide-pointer">
          New to the Mysteries? The{" "}
          <Link href="/guide" className="font-medium text-gaslight underline">
            Guide
          </Link>{" "}
          in the sidebar explains every screen and how a turn works.
        </FirstTimeHint>
      </div>
      <PlayDashboard />
    </>
  );
}
