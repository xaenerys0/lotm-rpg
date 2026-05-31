import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Lora } from "next/font/google";
import { PWA_COLORS } from "@/app/_pwa/palette";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { ServiceWorkerRegistrar } from "@/components/pwa/service-worker-registrar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
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
      className={`${geistSans.variable} ${geistMono.variable} ${lora.variable} h-full antialiased`}
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
