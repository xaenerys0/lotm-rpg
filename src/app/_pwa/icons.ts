// Single source of truth for the app's PWA icon set. Consumed by both the icon
// route handler (`icons/[icon]/route.tsx`, which renders the PNGs) and the web
// app manifest (`manifest.ts`, which references them) so the two cannot drift.
export interface PwaIcon {
  /** URL filename segment under `/icons/`, e.g. `192.png`. */
  file: string;
  /** Square dimension in pixels. */
  size: number;
  /** Whether the art is inset for Android's maskable safe zone. */
  maskable?: boolean;
}

export const PWA_ICONS: readonly PwaIcon[] = [
  { file: "192.png", size: 192 },
  { file: "512.png", size: 512 },
  { file: "512-maskable.png", size: 512, maskable: true },
];
