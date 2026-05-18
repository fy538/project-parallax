/**
 * HeaderStrip — top intelligence-briefing strip per BRAND.md.
 *
 * Layout:
 *   ∴ PARALLAX  (left)              EP XX · COORDINATES  (right)
 *   IBM Plex Mono, 11px, letter-spacing 2-3px, muted color.
 *
 * Renders inside the safe area top edge. The wordmark uses ∴ + uppercase
 * channel name; the right side carries metadata that varies per template
 * (episode label, file number, coordinates, classification).
 *
 * Variants by Meridian episode-type (BRAND.md):
 *   meridian (default)  →  EP XX · {coordinates}
 *   antipode            →  ROUNDUP · BRIEFING №{n}
 *   stratum             →  SURVEY {n}
 */

import React from "react";
import { useCurrentFrame } from "remotion";
import { brandMark, fonts, fontSizes, layout, palette, sec, shadows } from "../design/theme";
import { useThemeMode } from "../hooks/useThemeMode";
import { fadeIn, slideIn } from "../utils/animation";

export interface HeaderStripProps {
  /** Channel wordmark — defaults to "∴ PARALLAX" */
  wordmark?: string;
  /** Right-side metadata. Often `EP01 · 25.0°N 121.5°E` or similar. */
  metadata?: string;
  /** Variant selects the strip style. */
  variant?: "meridian" | "antipode" | "stratum";
  /** Mode for color resolution. Defaults to "light" (primary register). */
  mode?: "light" | "dark";
  /** When the strip should appear, in seconds from comp start. Default 0. */
  startSec?: number;
  /** Override the strip's accent color (otherwise uses brand mode default). */
  accentColor?: string;
}

const DEFAULT_WORDMARK = `${brandMark.glyph} PARALLAX`;

export const HeaderStrip: React.FC<HeaderStripProps> = React.memo(
  ({
    wordmark = DEFAULT_WORDMARK,
    metadata,
    variant = "meridian",
    mode = "light",
    startSec = 0,
    accentColor,
  }) => {
    const frame = useCurrentFrame();
    const theme = useThemeMode(mode);
    const startFrame = sec(startSec);
    const opacity = fadeIn(frame, startFrame, sec(0.6));
    const slideY = slideIn(frame, startFrame, 6, sec(0.5));

    const accent =
      accentColor || (mode === "dark" ? palette.amber : palette.oxblood);

    // Variant-specific separator/prefix
    let metaPrefix = "";
    if (variant === "antipode") metaPrefix = "BRIEFING ";
    else if (variant === "stratum") metaPrefix = "SURVEY ";

    return (
      <div
        style={{
          position: "absolute",
          top: layout.safeArea.top,
          left: layout.safeArea.left,
          right: layout.safeArea.right,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          opacity,
          transform: `translateY(${slideY}px)`,
          pointerEvents: "none",
          zIndex: 20,
        }}
      >
        {/* Wordmark — left */}
        <div
          style={{
            fontFamily: fonts.mono,
            fontSize: fontSizes.meta,
            fontWeight: 600,
            color: accent,
            letterSpacing: 2.5,
            textTransform: "uppercase",
            textShadow: shadows.textLift,
          }}
        >
          {wordmark}
        </div>
        {/* Metadata — right */}
        {metadata && (
          <div
            style={{
              fontFamily: fonts.mono,
              fontSize: fontSizes.meta,
              fontWeight: 400,
              color: theme.text.muted,
              letterSpacing: 2.5,
              textTransform: "uppercase",
              textShadow: shadows.textLift,
            }}
          >
            {metaPrefix}
            {metadata}
          </div>
        )}
      </div>
    );
  }
);

HeaderStrip.displayName = "HeaderStrip";
