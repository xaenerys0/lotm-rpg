import type { Metadata, Viewport } from "next";
import { Big_Shoulders, Newsreader, IBM_Plex_Mono } from "next/font/google";
import { PWA_COLORS } from "@/app/_pwa/palette";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { ServiceWorkerRegistrar } from "@/components/pwa/service-worker-registrar";
import "./globals.css";

// Display: Big Shoulders Display — a tall, dramatic condensed grotesque used
// for headings (via `font-serif`), the editorial backbone of the Codex look.
const display = Big_Shoulders({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800", "900"],
});

// Body: Newsreader — an editorial serif for readable long-form prose (the
// app's default body via `font-sans`).
const body = Newsreader({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

// Mono: IBM Plex Mono for labels and technical chrome.
const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: {
    default: "Lord of the Mysteries RPG",
    template: "%s · Lord of the Mysteries RPG",
  },
  description:
    "A single-player, AI-narrated browser RPG set in the Lord of the Mysteries universe.",
  applicationName: "LOTM RPG",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "LOTM RPG",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: PWA_COLORS.background,
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <a
          href="#main-content"
          className="sr-only rounded bg-surface px-4 py-2 text-sm font-medium text-foreground focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:ring-2 focus:ring-gaslight"
        >
          Skip to main content
        </a>
        {children}
        <ServiceWorkerRegistrar />
        <InstallPrompt />
      </body>
    </html>
  );
}
