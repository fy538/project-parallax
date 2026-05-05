/**
 * AntipodeDivider — vertical split with ∴ brand mark at center.
 *
 * Meridian "Antipode" episode-type variant (BRAND.md):
 * Vertical split at ∴ divider, with dual dates/labels on either side.
 * Used for comparison-heavy episodes (then vs. now, A vs. B).
 *
 * The divider is a thin vertical line with the ∴ mark centered on it,
 * flanked by optional labels (dates, names, concepts) on each side.
 *
 * Usage:
 *   <Background variant="light">
 *     <AntipodeDivider
 *       leftLabel="1972"
 *       rightLabel="2026"
 *     />
 *     {content}
 *   </Background>
 */

import React from "react";
import { useCurrentFrame } from "remotion";
import { interpolate, Easing } from "remotion";
import { palette, fonts, fontSizes, layout, sec, shadows } from "../design/theme";
import { useThemeMode } from "../hooks/useThemeMode";
import { fadeIn } from "../utils/animation";

interface AntipodeDividerProps {
  /** Label on the left side (e.g., date, entity name) */
  leftLabel?: string;
  /** Label on the right side */
  rightLabel?: string;
  /** Visual mode for color resolution */
  mode?: "light" | "dark";
  /** Start time in seconds (default: 0.3) */
  startSec?: number;
  /** Position of the divider — fraction from left (default: 0.5 = center) */
  position?: number;
}

export const AntipodeDivider: React.FC<AntipodeDividerProps> = ({
  leftLabel,
  rightLabel,
  mode = "light",
  startSec = 0.3,
  position = 0.5,
}) => {
  const frame = useCurrentFrame();
  const theme = useThemeMode(mode);
  const isDark = mode === "dark";
  const startFrame = sec(startSec);

  const dividerX = layout.width * position;
  const accentColor = isDark ? palette.gold : palette.walnut;

  // Line draws from center outward (top and bottom simultaneously)
  const lineProgress = interpolate(
    frame,
    [startFrame, startFrame + sec(0.8)],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    }
  );

  // ∴ mark fades in after line is ~60% drawn
  const markStart = startFrame + sec(0.5);
  const markOpacity = fadeIn(frame, markStart, sec(0.4));

  // ∴ mark scale pulse on appearance
  const markScale = interpolate(
    frame,
    [markStart, markStart + sec(0.2), markStart + sec(0.4)],
    [0.8, 1.1, 1.0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  // Labels slide in from their respective sides
  const labelStart = startFrame + sec(0.7);
  const labelOpacity = fadeIn(frame, labelStart, sec(0.4));
  const leftSlide = interpolate(
    frame,
    [labelStart, labelStart + sec(0.5)],
    [15, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) }
  );
  const rightSlide = interpolate(
    frame,
    [labelStart, labelStart + sec(0.5)],
    [-15, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) }
  );

  const lineHalfHeight = (layout.height / 2) * lineProgress;

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: layout.width,
        height: layout.height,
        zIndex: 5,
        pointerEvents: "none",
      }}
    >
      {/* Vertical divider line — draws from center */}
      <div
        style={{
          position: "absolute",
          left: dividerX,
          top: layout.height / 2 - lineHalfHeight,
          width: 1,
          height: lineHalfHeight * 2,
          background: `linear-gradient(180deg, transparent 0%, ${accentColor}40 15%, ${accentColor}40 85%, transparent 100%)`,
        }}
      />

      {/* ∴ mark at center */}
      <div
        style={{
          position: "absolute",
          left: dividerX,
          top: layout.height / 2,
          transform: `translate(-50%, -50%) scale(${markScale})`,
          fontFamily: fonts.display,
          fontSize: 28,
          fontWeight: 700,
          color: accentColor,
          opacity: markOpacity,
          textShadow: isDark
            ? `0 0 20px ${accentColor}40`
            : "none",
          // Small background circle to give the ∴ breathing room against the line
          background: isDark ? palette.ink : palette.paper,
          width: 44,
          height: 44,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          lineHeight: 1,
        }}
      >
        ∴
      </div>

      {/* Left label */}
      {leftLabel && (
        <div
          style={{
            position: "absolute",
            left: dividerX - 32,
            top: layout.height / 2 - 1,
            transform: `translateX(calc(-100% - ${leftSlide}px))`,
            fontFamily: fonts.mono,
            fontSize: fontSizes.meta,
            fontWeight: 600,
            letterSpacing: 2.5,
            textTransform: "uppercase",
            color: theme.text.muted,
            opacity: labelOpacity,
            textAlign: "right",
            textShadow: isDark ? shadows.textLift : "none",
          }}
        >
          {leftLabel}
        </div>
      )}

      {/* Right label */}
      {rightLabel && (
        <div
          style={{
            position: "absolute",
            left: dividerX + 32,
            top: layout.height / 2 - 1,
            transform: `translateX(${rightSlide}px)`,
            fontFamily: fonts.mono,
            fontSize: fontSizes.meta,
            fontWeight: 600,
            letterSpacing: 2.5,
            textTransform: "uppercase",
            color: theme.text.muted,
            opacity: labelOpacity,
            textShadow: isDark ? shadows.textLift : "none",
          }}
        >
          {rightLabel}
        </div>
      )}
    </div>
  );
};

AntipodeDivider.displayName = "AntipodeDivider";
