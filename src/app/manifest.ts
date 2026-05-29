import type { MetadataRoute } from "next";
import { PWA_COLORS } from "@/app/_pwa/palette";
import { PWA_ICONS } from "@/app/_pwa/icons";

// Web app manifest. Next serves this at `/manifest.webmanifest` and
// auto-injects `<link rel="manifest">` into the document head.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Lord of the Mysteries RPG",
    short_name: "LOTM RPG",
    description:
      "A single-player, AI-narrated browser RPG set in the Lord of the Mysteries universe.",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: PWA_COLORS.background,
    theme_color: PWA_COLORS.background,
    categories: ["games", "entertainment"],
    icons: PWA_ICONS.map(({ file, size, maskable }) => ({
      src: `/icons/${file}`,
      sizes: `${size}x${size}`,
      type: "image/png",
      purpose: maskable ? "maskable" : "any",
    })),
  };
}
