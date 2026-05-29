// Shared PWA palette — mirrors the theme tokens in `globals.css`. These literal
// hex values are needed in the places CSS custom properties can't reach:
// `ImageResponse` (Satori) icon rendering, inline SVG fills, and the web app
// manifest. Keep in sync with `--color-background/-amber/-gaslight`.
export const PWA_COLORS = {
  background: "#0c0a09", // --color-background
  amber: "#d97706", // --color-amber
  gaslight: "#fbbf24", // --color-gaslight
} as const;
