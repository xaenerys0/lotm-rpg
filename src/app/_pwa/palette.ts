// Shared PWA palette — mirrors the theme tokens in `globals.css`. These literal
// hex values are needed in the places CSS custom properties can't reach:
// `ImageResponse` (Satori) icon rendering, inline SVG fills, and the web app
// manifest. Keep in sync with `--color-background/-amber/-gaslight`.
export const PWA_COLORS = {
  background: "#0e1116", // --color-background
  amber: "#e0a73c", // --color-amber
  gaslight: "#f1c66b", // --color-gaslight
} as const;
