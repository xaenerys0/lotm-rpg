"use client";

import type { ReactNode } from "react";
import { sanityEffects } from "@/lib/game";

/**
 * Wraps the game surface and applies escalating CSS distortion based on the
 * (hidden) sanity meter. This is the primary channel through which sanity
 * state is communicated when the numeric meter is hidden — clean at high
 * sanity, subtly off at medium, distorted at low, fully corrupted at critical.
 */
export function SanityEffects({
  sanity,
  maxSanity,
  children,
}: {
  sanity: number;
  maxSanity: number;
  children: ReactNode;
}) {
  const effects = sanityEffects(sanity, maxSanity);

  return (
    <div className={`sanity-fx ${effects.className}`}>
      {children}
      {effects.distortion > 0 && (
        <div
          aria-hidden="true"
          className={`sanity-overlay ${
            effects.tier === "critical" ? "sanity-overlay-critical" : ""
          }`}
          style={
            {
              opacity: effects.distortion,
              "--sanity-overlay-opacity": effects.distortion,
            } as React.CSSProperties
          }
        />
      )}
    </div>
  );
}
