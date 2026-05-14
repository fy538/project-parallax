/**
 * MapVignette — paper-darken overlay that bleeds a Mapbox canvas into the
 * editorial chrome.
 *
 * A Mapbox canvas is a hard rectangle. Editorial cartography hides that
 * rectangle so the map reads as integrated into the page rather than as
 * a screenshot pasted on top. Two devices accomplish this:
 *
 *   1. A radial-gradient that darkens the corners (period-atlas
 *      photographic-print falloff feel) — used in `vintage` mode at
 *      slightly higher opacity for the warm-brown tea-stained look.
 *
 *   2. A linear darken on top + bottom only — lets the HeaderStrip /
 *      FooterStrip read against a soft darken rather than against a hard
 *      pixel break. Default for the analytical register.
 *
 * Compositionally cheap (single absolutely-positioned div with a CSS
 * gradient — no per-frame work). Mode-aware: light mode warms the
 * shadow toward bone/paper; dark mode deepens it toward ink.
 *
 * References:
 *   - AtlasPlate vintage vignette pattern (templates/AtlasPlate/AtlasPlate.tsx)
 *   - Period atlases — Bartholomew Times Atlas, mid-century Fortune plates
 */

import React from "react";
import { AbsoluteFill } from "remotion";
import { palette } from "../design/theme";

export interface MapVignetteProps {
  /**
   * Vignette register:
   *   - `editorial` (default) — soft darken at top + bottom, very mild.
   *     The "let the chrome breathe" version, for analytical-register
   *     maps. Doesn't change the overall feel; just softens edges.
   *   - `atlas` — full corner radial darken, ~12% paper darkening. Used
   *     when the map is the focal element and should feel like a
   *     printed plate. Stronger than `editorial`.
   *   - `vintage` — warm-toned radial darken (~22% corner), brown tones,
   *     matches AtlasPlate vintage mode. For period episodes.
   */
  variant?: "editorial" | "atlas" | "vintage";
  /** Use dark-mode shadow tones instead of light. */
  dark?: boolean;
}

export const MapVignette: React.FC<MapVignetteProps> = ({
  variant = "editorial",
  dark = false,
}) => {
  if (variant === "editorial") {
    // Top + bottom soft darken only — lets HeaderStrip / FooterStrip sit
    // against a gentle gradient rather than a hard horizon line. ~8% at
    // edge, 0% at 18% inset on each side.
    const shadow = dark ? palette.ink : "#3A3530";
    return (
      <AbsoluteFill
        style={{
          background: `linear-gradient(to bottom,
            ${shadow}14 0%,
            transparent 18%,
            transparent 82%,
            ${shadow}14 100%)`,
          pointerEvents: "none",
        }}
      />
    );
  }

  if (variant === "atlas") {
    const shadow = dark ? "#000000" : "#3A3530";
    return (
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at center,
            transparent 0%,
            transparent 55%,
            ${shadow}1F 95%,
            ${shadow}38 100%)`,
          pointerEvents: "none",
        }}
      />
    );
  }

  // vintage
  return (
    <AbsoluteFill
      style={{
        // Warm brown vignette — matches AtlasPlate vintage canon (Burtin /
        // Bayer Fortune atlas plates) where the corners darken due to
        // photographic-print falloff in mid-century reproductions.
        background: `radial-gradient(ellipse at center,
          transparent 0%,
          transparent 50%,
          #3A251010 75%,
          #3A251038 100%)`,
        pointerEvents: "none",
      }}
    />
  );
};
