/**
 * EditorialSurface — Paper-texture background + film grain for Remotion compositions.
 *
 * Unifies all Remotion analytical content with the AI-generated pillar's
 * post-video grain treatment (treat_video.py), making a chart feel like it
 * belongs to the same editorial-magazine register as the channel's
 * constructivist illustrations (Registers 2 and 3).
 *
 * Usage (standalone template):
 *   <EditorialSurface intensity={0.6}>
 *     <DataChart data={data} />
 *   </EditorialSurface>
 *
 * FullEpisode.tsx wraps its entire visual tree in this component at the
 * default intensity (0.6) so all templates inherit the paper texture without
 * per-template changes.
 *
 * Intensity guidelines (matches treat_video.py semantics):
 *   0.0 — clean digital surface (no grain)
 *   0.6 — "felt, not seen" (default — warmth before texture)
 *   0.8 — noticeably grainy (archival/aged treatment)
 *   1.0 — maximum presence (period-film or deliberate texture effect)
 */

import React, { type ReactNode } from "react";
import { AbsoluteFill, Img, useCurrentFrame } from "remotion";
import { palette } from "../design/theme";

export interface EditorialSurfaceProps {
  children: ReactNode;
  /** Grain intensity 0-1. Default 0.6 — "felt, not seen." */
  intensity?: number;
  /** Override the default paper background color. Default: palette.paper. */
  paperColor?: string;
  /** Disable the subtle corner vignette. Default false. */
  noVignette?: boolean;
  /**
   * Optional atmospheric backdrop image. When set, the image is rendered as
   * the bottom layer (under children, grain, and vignette) and replaces the
   * solid paperColor as the visual ground. Pass a staticFile() path, e.g.
   * `staticFile("assets/backdrops/cartographic.png")`. Use sparingly — see
   * VISUAL_LANGUAGE.md → Register 2 (atmospheric backdrop) for the editorial
   * pairing rules (per-scene/per-composition, not channel-wide default).
   */
  backdrop?: string;
}

// Module-level constant: decompose palette.ink to RGB once so VignetteLayer
// can build the gradient without hardcoding hex (POL-07 compliance).
const INK_R = parseInt(palette.ink.slice(1, 3), 16);
const INK_G = parseInt(palette.ink.slice(3, 5), 16);
const INK_B = parseInt(palette.ink.slice(5, 7), 16);

// ── Grain layer ───────────────────────────────────────────────────────────────

const GrainLayer = React.memo(({ intensity }: { intensity: number }) => {
  const frame = useCurrentFrame();
  // Update seed every 2 frames (15fps flicker) to simulate film "gate weave" —
  // prevents grain from looking frozen across adjacent frames.
  const seed = Math.floor(frame / 2);
  const opacity = Math.min(intensity * 0.12, 0.15);
  if (opacity === 0) return null;

  // 16mm film grain: baseFrequency 0.45 → coarser, warmer texture than
  // FilmOverlay's digital noise (0.65). numOctaves: 3 → softer, less fractal.
  return (
    <AbsoluteFill style={{ pointerEvents: "none", zIndex: 2 }}>
      <svg
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          opacity,
          // multiply on paper (light bg) darkens grain spots → paper texture
          mixBlendMode: "multiply",
          pointerEvents: "none",
        }}
      >
        <defs>
          <filter
            id={`editorial-grain-${seed}`}
            x="0%"
            y="0%"
            width="100%"
            height="100%"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.45"
              numOctaves={3}
              seed={seed}
              result="noise"
            />
            <feColorMatrix type="saturate" values="0" in="noise" />
          </filter>
        </defs>
        <rect
          width="100%"
          height="100%"
          filter={`url(#editorial-grain-${seed})`}
        />
      </svg>
    </AbsoluteFill>
  );
});
GrainLayer.displayName = "GrainLayer";

// ── Vignette layer ────────────────────────────────────────────────────────────

const VignetteLayer = React.memo(({ intensity }: { intensity: number }) => {
  // Very subtle bound-edge tonality: ~5% darkening at corners, 0% at center.
  // Reads as "printed page" (paper edge shadow), not "film-school vignette."
  const edge = Math.min(intensity * 0.08, 0.08);
  if (edge === 0) return null;

  const bg = `radial-gradient(ellipse at center,
    transparent 0%,
    transparent 50%,
    rgba(${INK_R}, ${INK_G}, ${INK_B}, ${(edge * 0.5).toFixed(3)}) 80%,
    rgba(${INK_R}, ${INK_G}, ${INK_B}, ${edge.toFixed(3)}) 100%)`;

  return (
    <AbsoluteFill
      style={{ background: bg, pointerEvents: "none", zIndex: 2 }}
    />
  );
});
VignetteLayer.displayName = "VignetteLayer";

// ── Main component ────────────────────────────────────────────────────────────

/**
 * Wraps any composition in a paper-texture surface with animated film grain
 * and a subtle corner vignette. Provides the shared tactile foundation that
 * bridges Remotion analytical content with the channel's constructivist
 * illustration register.
 */
export const EditorialSurface = React.memo(
  ({
    children,
    intensity = 0.6,
    paperColor,
    noVignette = false,
    backdrop,
  }: EditorialSurfaceProps) => {
    const clampedIntensity = Math.min(Math.max(intensity, 0), 1);
    const bg = paperColor ?? palette.paper;

    return (
      <AbsoluteFill style={{ backgroundColor: bg }}>
        {backdrop && (
          <AbsoluteFill style={{ zIndex: 0, pointerEvents: "none" }}>
            <Img
              src={backdrop}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
              }}
            />
          </AbsoluteFill>
        )}
        {children}
        <GrainLayer intensity={clampedIntensity} />
        {!noVignette && <VignetteLayer intensity={clampedIntensity} />}
      </AbsoluteFill>
    );
  },
);
EditorialSurface.displayName = "EditorialSurface";
