/**
 * SourceAttribution — POLISH.md L6 enforcer.
 *
 * Always renders at bottom-right of safe area in muted text. Use this
 * across templates instead of ad-hoc <div style={{position: "absolute"...}}/>
 * for sources. Coexists with FooterStrip (Source sits inside the right
 * column of the footer when both are present).
 *
 * Usage:
 *   <SourceAttribution source={data.source} mode={data.backgroundVariant} />
 *   <SourceAttribution source="World Bank, 2024" startSec={2} mode="dark" />
 */

import React from "react";
import { useCurrentFrame } from "remotion";
import { fonts, fontSizes, layout, sec, shadows } from "../design/theme";
import { useThemeMode } from "../hooks/useThemeMode";
import { fadeIn, slideIn } from "../utils/animation";

export interface SourceAttributionProps {
  /** Source string. If empty/undefined, renders nothing. */
  source?: string;
  /** Mode for color resolution. Default "light". */
  mode?: "light" | "dark";
  /** Frame to start the fade-in, in seconds. Default 0.5. */
  startSec?: number;
  /** Vertical offset above the safe-area bottom (px). Use to lift above FooterStrip. */
  bottomOffset?: number;
  /** Optional prefix label, e.g. "Source: " or "Data: ". */
  prefix?: string;
  /** Safe-area tier for right/bottom inset. Defaults to "generous" (L69 channel standard). */
  safeAreaTier?: keyof typeof layout.safeAreaTier;
}

export const SourceAttribution: React.FC<SourceAttributionProps> = React.memo(
  ({ source, mode = "light", startSec = 0.5, bottomOffset = 0, prefix, safeAreaTier = "generous" }) => {
    const frame = useCurrentFrame();
    const theme = useThemeMode(mode);
    const startFrame = sec(startSec);
    const safe = layout.safeAreaTier[safeAreaTier];

    if (!source) return null;

    const opacity = fadeIn(frame, startFrame, sec(0.5));
    const slideY = slideIn(frame, startFrame, -4, sec(0.5));

    return (
      <div
        style={{
          position: "absolute",
          bottom: safe.bottom + bottomOffset,
          right: safe.right,
          fontFamily: fonts.mono,
          fontSize: fontSizes.meta,
          fontWeight: 400,
          color: theme.text.muted,
          letterSpacing: 0.5,
          opacity,
          transform: `translateY(${slideY}px)`,
          textShadow: shadows.textLift,
          pointerEvents: "none",
          zIndex: 19,
        }}
      >
        {prefix}
        {source}
      </div>
    );
  }
);

SourceAttribution.displayName = "SourceAttribution";
