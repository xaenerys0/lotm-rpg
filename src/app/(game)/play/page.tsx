import type { Metadata } from "next";
import { PlayDashboard } from "@/components/game/play-dashboard";

export const metadata: Metadata = { title: "Dashboard" };

export default function PlayPage() {
  return <PlayDashboard />;
}
