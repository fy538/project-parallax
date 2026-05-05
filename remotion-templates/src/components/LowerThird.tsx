/**
 * LowerThird — persistent lower-third graphics for episode segments.
 *
 * Displays episode label + beat title in the lower portion of the frame.
 * Animates in/out cleanly with a cinematic accent line and staggered text reveal.
 * High-end documentary/news graphics aesthetic — minimal, sophisticated, understated.
 *
 * Design:
 * - Accent line (2px, gold by default) draws top→bottom on entry
 * - Label row (optional, mono uppercase meta size)
 * - Title (display heading, uppercase, letter-spaced)
 * - Subtitle (optional, mono captions, normal case)
 * - Thin horizontal separator (draws via scaleX)
 *
 * Animation:
 * Entry: Accent line scaleY, label + title + subtitle staggered slideIn + fade
 * Exit: All elements fade + slideLeft simultaneously, accent line scaleY from bottom
 *
 * Usage:
 *   <LowerThird
 *     label="∴ PARALLAX · EP.01"
 *     title="THE STRATEGIC PARADOX"
 *     subtitle="Why Dominant Strategies Fail"
 *     enterFrame={sec(2)}
 *     exitFrame={sec(10)}
 *     mode="dark"
 *   />
 */

import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";
import {
  palette,
  fonts,
  fontSizes,
  fontWeights,
  letterSpacing,
  layout,
  sec,
  dark,
  light,
  dividerStyle,
} from "../design/theme";
import { CLAMP, fadeIn, fadeOut } from "../utils/animation";

export interface LowerThirdProps {
  /** Episode label, e.g. "∴ PARALLAX · EP.01" or just "PARALLAX" */
  label?: string;

  /** Beat or section title, e.g. "THE STRATEGIC PARADOX" */
  title: string;

  /** Optional subtitle or context line, e.g. "Why Dominant Strategies Fail" */
  subtitle?: string;

  /** Dark or light mode (default: "dark") */
  mode?: "dark" | "light";

  /** Frame at which the lower-third enters (default: 0) */
  enterFrame?: number;

  /** Frame at which the lower-third exits. If omitted, stays visible. */
  exitFrame?: number;

  /** Entry animation duration in seconds (default: 0.8) */
  enterDurationSec?: number;

  /** Exit animation duration in seconds (default: 0.5) */
  exitDurationSec?: number;

  /** Position: "bottom-left" (default) or "bottom-right" */
  position?: "bottom-left" | "bottom-right";

  /** Accent color for the thin left border line (default: palette.gold) */
  accentColor?: string;
}

/**
 * LowerThird component
 *
 * A persistent lower-third overlay for episode segments and beats.
 * Features cinematic entrance/exit animations, configurable dark/light modes,
 * and flexible positioning. Designed to complement the Parallax visual language.
 */
export const LowerThird: React.FC<LowerThirdProps> = ({
  label,
  title,
  subtitle,
  mode = "dark",
  enterFrame = 0,
  exitFrame,
  enterDurationSec = 0.8,
  exitDurationSec = 0.5,
  position = "bottom-left",
  accentColor = palette.gold,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const isDark = mode === "dark";
  const modeTokens = isDark ? dark : light;

  // Convert durations to frames
  const enterDuration = Math.round(enterDurationSec * fps);
  const exitDuration = Math.round(exitDurationSec * fps);

  // ── Opacity: fade in / fade out ────────────────────────────────────────
  let opacity = 1;

  // Fade in from enterFrame
  if (frame < enterFrame + enterDuration) {
    opacity = fadeIn(frame, enterFrame, enterDuration);
  }

  // Fade out if exitFrame is defined
  if (exitFrame !== undefined && frame >= exitFrame - exitDuration) {
    opacity = fadeOut(frame, exitFrame, exitDuration);
  }

  // ── Accent line: scaleY animation (entry top→bottom, exit bottom→0) ────

  // Entry: top to bottom, from enterFrame to enterFrame + enterDuration
  let accentScaleY = 1;
  if (frame < enterFrame + enterDuration) {
    accentScaleY = interpolate(
      frame,
      [enterFrame, enterFrame + enterDuration],
      [0, 1],
      { ...CLAMP, easing: Easing.out(Easing.cubic) }
    );
  }

  // Exit: bottom to 0, from exitFrame - exitDuration to exitFrame
  if (exitFrame !== undefined && frame >= exitFrame - exitDuration) {
    accentScaleY = interpolate(
      frame,
      [exitFrame - exitDuration, exitFrame],
      [1, 0],
      { ...CLAMP, easing: Easing.in(Easing.cubic) }
    );
  }

  // ── Staggered text entry animations ────────────────────────────────────

  // Label: starts immediately at enterFrame
  const labelStartFrame = enterFrame;
  const labelTranslateX = label
    ? interpolate(
        frame,
        [labelStartFrame, labelStartFrame + Math.round(0.3 * fps)],
        [-20, 0],
        { ...CLAMP, easing: Easing.out(Easing.cubic) }
      )
    : 0;

  const labelOpacity = label
    ? fadeIn(frame, labelStartFrame, Math.round(0.3 * fps))
    : 1;

  // Title: staggered 0.1s (3 frames at 30fps) after label
  const titleStartFrame = labelStartFrame + Math.round(0.1 * fps);
  const titleTranslateX = interpolate(
    frame,
    [titleStartFrame, titleStartFrame + Math.round(0.35 * fps)],
    [-30, 0],
    { ...CLAMP, easing: Easing.out(Easing.cubic) }
  );

  const titleOpacity = fadeIn(
    frame,
    titleStartFrame,
    Math.round(0.35 * fps)
  );

  // Subtitle: staggered 0.05s (1-2 frames) after title
  const subtitleStartFrame = titleStartFrame + Math.round(0.05 * fps);
  const subtitleTranslateX = subtitle
    ? interpolate(
        frame,
        [subtitleStartFrame, subtitleStartFrame + Math.round(0.3 * fps)],
        [-25, 0],
        { ...CLAMP, easing: Easing.out(Easing.cubic) }
      )
    : 0;

  const subtitleOpacity = subtitle
    ? fadeIn(frame, subtitleStartFrame, Math.round(0.3 * fps))
    : 1;

  // ── Separator line: scaleX animation (draws left to right, 0.2s delayed) ─
  const separatorStartFrame = enterFrame + Math.round(0.2 * fps);
  const separatorScaleX = interpolate(
    frame,
    [separatorStartFrame, separatorStartFrame + Math.round(0.4 * fps)],
    [0, 1],
    { ...CLAMP, easing: Easing.out(Easing.cubic) }
  );

  // ── Exit animations: all slide left + fade ─────────────────────────────
  let exitTranslateX = 0;
  if (exitFrame !== undefined && frame >= exitFrame - exitDuration) {
    exitTranslateX = interpolate(
      frame,
      [exitFrame - exitDuration, exitFrame],
      [0, -15],
      { ...CLAMP, easing: Easing.in(Easing.cubic) }
    );
  }

  // ── Layout calculations ────────────────────────────────────────────────
  // Position in the lower safe area, raised enough to clear MetadataStrip footer
  const bottomOffset = 120;
  const left = position === "bottom-left" ? layout.safeArea.left : undefined;
  const right = position === "bottom-right" ? layout.safeArea.right : undefined;

  return (
    <div
      style={{
        position: "absolute",
        bottom: layout.safeArea.bottom + bottomOffset,
        left,
        right,
        opacity,
        pointerEvents: "none",
        // Apply exit translation to entire group
        transform: `translateX(${exitTranslateX}px)`,
      }}
    >
      {/* ── Accent Line (left or right edge) — gradient fade ends + glow ────── */}
      <div
        style={{
          position: "absolute",
          [position === "bottom-left" ? "left" : "right"]: 0,
          top: 0,
          width: 2,
          height: 48,
          background: `linear-gradient(180deg, transparent 0%, ${accentColor} 18%, ${accentColor} 82%, transparent 100%)`,
          boxShadow: `0 0 8px ${accentColor}80`,
          transformOrigin: "top center",
          transform: `scaleY(${accentScaleY})`,
          opacity: accentScaleY,
        }}
      />

      {/* ── Text Container (positioned after accent line) ───────────── */}
      <div
        style={{
          paddingLeft: position === "bottom-left" ? 16 : 0,
          paddingRight: position === "bottom-right" ? 16 : 0,
          textAlign: position === "bottom-left" ? "left" : "right",
        }}
      >
        {/* Label Row */}
        {label && (
          <div
            style={{
              fontFamily: fonts.mono,
              fontSize: fontSizes.meta,
              fontWeight: fontWeights.regular,
              letterSpacing: letterSpacing.meta,
              lineHeight: 1.2,
              textTransform: "uppercase" as const,
              color: modeTokens.text.muted,
              opacity: labelOpacity,
              transform: `translateX(${labelTranslateX}px)`,
              marginBottom: 4,
            }}
          >
            {label}
          </div>
        )}

        {/* Separator Line — gradient-fade ends */}
        {label && (
          <div
            style={{
              height: dividerStyle.thickness,
              background: `linear-gradient(${position === "bottom-left" ? "90deg" : "270deg"}, ${modeTokens.text.muted} 0%, ${modeTokens.text.muted}80 70%, transparent 100%)`,
              opacity: separatorScaleX * dividerStyle.opacity,
              marginBottom: 8,
              transformOrigin: position === "bottom-left" ? "left center" : "right center",
              transform: `scaleX(${separatorScaleX})`,
              width: `calc(100% - 40px)`,
            }}
          />
        )}

        {/* Title */}
        <h3
          style={{
            fontFamily: fonts.heading,
            fontSize: fontSizes.label,
            fontWeight: fontWeights.semibold,
            letterSpacing: letterSpacing.label,
            lineHeight: 1.2,
            textTransform: "uppercase" as const,
            color: modeTokens.text.primary,
            margin: 0,
            opacity: titleOpacity,
            transform: `translateX(${titleTranslateX}px)`,
            maxWidth: 600,
          }}
        >
          {title}
        </h3>

        {/* Subtitle */}
        {subtitle && (
          <div
            style={{
              fontFamily: fonts.mono,
              fontSize: fontSizes.caption,
              fontWeight: fontWeights.regular,
              letterSpacing: letterSpacing.caption,
              lineHeight: 1.4,
              color: modeTokens.text.muted,
              marginTop: 6,
              opacity: subtitleOpacity,
              transform: `translateX(${subtitleTranslateX}px)`,
              maxWidth: 600,
            }}
          >
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
};

export default LowerThird;
