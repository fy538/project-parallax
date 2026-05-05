/**
 * GradientDivider — Animated gradient line with center-out draw animation.
 *
 * The line fades from transparent at edges to full opacity at center.
 * Draws from center outward using scaleX/scaleY from 0 → 1 with CLAMP_CUBIC easing.
 *
 * Usage:
 *   <GradientDivider
 *     color={palette.amber}
 *     frame={frame}
 *     startFrame={30}
 *     width="60%"
 *     thickness={2}
 *   />
 */

import React from "react";
import { interpolate, AbsoluteFill } from "remotion";
import { palette, gradients } from "../design/theme";
import { CLAMP_CUBIC } from "../utils/animation";

interface GradientDividerProps {
  /** Color of the divider (default: palette.amber) */
  color?: string;
  /** Current frame number */
  frame: number;
  /** Frame when animation starts (default: 0) */
  startFrame?: number;
  /** Width of the divider (default: "70%") */
  width?: string;
  /** Thickness in pixels (default: 2) */
  thickness?: number;
  /** Orientation (default: "horizontal") */
  orientation?: "horizontal" | "vertical";
  /** Opacity multiplier (default: 1) */
  opacity?: number;
  /** Additional inline styles */
  style?: React.CSSProperties;
}

export const GradientDivider = React.memo<GradientDividerProps>(({
  color = palette.amber,
  frame,
  startFrame = 0,
  width = "70%",
  thickness = 2,
  orientation = "horizontal",
  opacity = 1,
  style,
}) => {
  // Draw animation: scale from 0 → 1 over ~20 frames
  const drawDuration = 20;
  const drawProgress = interpolate(
    frame,
    [startFrame, startFrame + drawDuration],
    [0, 1],
    CLAMP_CUBIC
  );

  // Gradient: full opacity center, transparent edges
  const gradient = gradients.dividerFade(color);

  const isHorizontal = orientation === "horizontal";

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        ...style,
      }}
    >
      <div
        style={{
          width: isHorizontal ? width : thickness,
          height: isHorizontal ? thickness : width,
          background: gradient,
          opacity: drawProgress * opacity,
          transform: isHorizontal
            ? `scaleX(${drawProgress})`
            : `scaleY(${drawProgress})`,
          transformOrigin: "center",
        }}
      />
    </AbsoluteFill>
  );
});

GradientDivider.displayName = "GradientDivider";
