import { ImageResponse } from "next/og";
import { PWA_COLORS } from "@/app/_pwa/palette";

// Shared, font-free LOTM-themed emblem used for every PWA icon size.
// Rendered to PNG via `ImageResponse` (Satori) so no binary assets or image
// rasterizer are needed.

/**
 * Renders the app emblem at the given square size as a PNG `ImageResponse`.
 *
 * @param size  Output width/height in pixels.
 * @param opts.maskable  When true, insets the art into the central ~80% safe
 *   zone on a full-bleed background so Android's icon masking never clips it.
 */
export function renderIcon(
  size: number,
  opts: { maskable?: boolean } = {},
): ImageResponse {
  const { maskable = false } = opts;
  const pad = maskable ? size * 0.1 : 0;
  const art = size - pad * 2;
  const moon = art * 0.56;

  return new ImageResponse(
    <div
      style={{
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: PWA_COLORS.background,
      }}
    >
      <div
        style={{
          position: "relative",
          width: art,
          height: art,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Outer occult ring */}
        <div
          style={{
            position: "absolute",
            width: art * 0.86,
            height: art * 0.86,
            borderRadius: art,
            border: `${Math.max(2, art * 0.028)}px solid rgba(217, 119, 6, 0.35)`,
          }}
        />
        {/* Crescent moon — amber disc with glow */}
        <div
          style={{
            position: "absolute",
            width: moon,
            height: moon,
            borderRadius: moon,
            background: PWA_COLORS.amber,
            boxShadow: `0 0 ${art * 0.12}px rgba(217, 119, 6, 0.65)`,
          }}
        />
        {/* Crescent cut — matches background for a clean sliver */}
        <div
          style={{
            position: "absolute",
            width: moon,
            height: moon,
            borderRadius: moon,
            background: PWA_COLORS.background,
            transform: `translate(${moon * 0.28}px, ${-moon * 0.18}px)`,
          }}
        />
        {/* Guiding star */}
        <div
          style={{
            position: "absolute",
            width: art * 0.1,
            height: art * 0.1,
            background: PWA_COLORS.gaslight,
            borderRadius: art * 0.012,
            transform: `translate(${art * 0.26}px, ${art * 0.24}px) rotate(45deg)`,
          }}
        />
      </div>
    </div>,
    { width: size, height: size },
  );
}
