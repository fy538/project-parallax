/**
 * LayeredComposition — composites background + foreground visual layers.
 *
 * Implements the [LAYERED:] visual mode from SCRIPT_FORMAT.md: footage
 * or an image as the background with a motion graphic (stat, label,
 * typography card) composited on top. Used when FullEpisode encounters
 * overlapping background + foreground segments, and available to any
 * composition that needs to combine two visual layers.
 *
 * Features:
 *   - Foreground blend modes (normal, multiply, screen, overlay, soft-light)
 *   - Foreground opacity control with animated fade-in
 *   - Spatial positioning (full, lower-third, upper-third, center-inset)
 *   - Background dim control (darken footage so foreground text pops)
 *   - Optional vignette overlay for depth
 *
 * Usage:
 *   <LayeredComposition
 *     position="lower-third"
 *     foregroundOpacity={0.95}
 *     backgroundDim={0.3}
 *     vignette
 *   >
 *     {{
 *       background: <BrandImage src="..." />,
 *       foreground: <KineticTypography data={...} />,
 *     }}
 *   </LayeredComposition>
 */

import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
} from "remotion";
import { sec } from "../design/theme";
import { CLAMP } from "../utils/animation";

// ── Types ────────────────────────────────────────────────────────────────────

export type BlendMode =
  | "normal"
  | "multiply"
  | "screen"
  | "overlay"
  | "soft-light";

export type ForegroundPosition =
  | "full"            // foreground covers entire frame
  | "lower-third"     // bottom 33% — classic broadcast lower-third
  | "upper-third"     // top 33% — title safe area
  | "center-inset"    // centered 70% width, 50% height — stat reveal zone
  | "bottom-bar";     // bottom 20% — ticker/label strip

interface LayeredCompositionProps {
  children: {
    background: React.ReactNode;
    foreground: React.ReactNode;
  };
  /** Blend mode for the foreground layer (default: "normal") */
  blendMode?: BlendMode;
  /** Foreground opacity 0-1 (default: 0.95) */
  foregroundOpacity?: number;
  /** Background dim amount 0-1, 0 = no dim, 0.5 = half brightness (default: 0.2) */
  backgroundDim?: number;
  /** Spatial positioning of the foreground (default: "full") */
  position?: ForegroundPosition;
  /** Fade-in duration for the foreground in seconds (default: 0.3) */
  foregroundFadeInSec?: number;
  /** Show a subtle vignette overlay for depth (default: false) */
  vignette?: boolean;
}

// ── Position presets ────────────────────────────────────────────────────────

const POSITION_STYLES: Record<ForegroundPosition, React.CSSProperties> = {
  full: {
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  "lower-third": {
    top: "67%",
    left: 0,
    right: 0,
    bottom: 0,
  },
  "upper-third": {
    top: 0,
    left: 0,
    right: 0,
    bottom: "67%",
  },
  "center-inset": {
    top: "25%",
    left: "15%",
    right: "15%",
    bottom: "25%",
  },
  "bottom-bar": {
    top: "80%",
    left: 0,
    right: 0,
    bottom: 0,
  },
};

// ── Component ────────────────────────────────────────────────────────────────

export const LayeredComposition: React.FC<LayeredCompositionProps> = ({
  children,
  blendMode = "normal",
  foregroundOpacity = 0.95,
  backgroundDim = 0.2,
  position = "full",
  foregroundFadeInSec = 0.3,
  vignette = false,
}) => {
  const frame = useCurrentFrame();
  const fadeFrames = sec(foregroundFadeInSec);

  const fgFadeIn = interpolate(
    frame,
    [0, fadeFrames],
    [0, 1],
    CLAMP
  );

  const positionStyle = POSITION_STYLES[position];

  return (
    <AbsoluteFill>
      {/* Layer 0: Background (footage / image / template) */}
      <AbsoluteFill>
        {children.background}
      </AbsoluteFill>

      {/* Layer 1: Background dim overlay */}
      {backgroundDim > 0 && (
        <AbsoluteFill
          style={{
            backgroundColor: `rgba(0, 0, 0, ${backgroundDim})`,
            pointerEvents: "none",
          }}
        />
      )}

      {/* Layer 2: Vignette (optional) */}
      {vignette && (
        <AbsoluteFill
          style={{
            background:
              "radial-gradient(ellipse at center, transparent 50%, rgba(0, 0, 0, 0.4) 100%)",
            pointerEvents: "none",
          }}
        />
      )}

      {/* Layer 3: Foreground (motion graphic / text / stat) */}
      <div
        style={{
          position: "absolute",
          ...positionStyle,
          opacity: foregroundOpacity * fgFadeIn,
          mixBlendMode: blendMode,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        {children.foreground}
      </div>
    </AbsoluteFill>
  );
};

/**
 * Layered composition metadata for assembly manifests and visual-spec.
 * Describes available positions and blend modes.
 */
export const LAYERED_CATALOG = {
  positions: {
    full: "Foreground covers entire frame — for transparent overlays",
    "lower-third": "Bottom 33% — classic broadcast stat/label placement",
    "upper-third": "Top 33% — title or context label",
    "center-inset": "Centered 70% × 50% — hero stat or key visual",
    "bottom-bar": "Bottom 20% — ticker strip or source citation",
  },
  blendModes: {
    normal: "Standard compositing — foreground on top",
    multiply: "Darken blend — foreground darkens background (maps, overlays)",
    screen: "Lighten blend — foreground lightens background (glows, highlights)",
    overlay: "Contrast blend — preserves highlights and shadows",
    "soft-light": "Subtle blend — gentle tonal influence",
  },
  defaults: {
    blendMode: "normal",
    foregroundOpacity: 0.95,
    backgroundDim: 0.2,
    position: "full",
    foregroundFadeInSec: 0.3,
  },
} as const;
