/**
 * AnimatedArrow — horizontal arrow that draws in over a configurable window,
 * with a slightly later arrowhead reveal and an optional label below.
 *
 * Extracted from FrameworkDiagram FlowVariant. Designed for any "A → B"
 * connection where the line should "draw in" then the arrowhead pops.
 *
 * Default sizing matches FrameworkDiagram (80×24 SVG, 65px line). Override
 * via the `length` and `height` props for taller/wider connections.
 *
 *   <AnimatedArrow
 *     startFrame={arrowStart}
 *     color={accentColor}
 *     label={arrowLabels[i]}
 *     // optional: length, height, drawDuration, headDelay
 *   />
 */

import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { fonts, fontSizes, sec } from "../design/theme";
import { CLAMP_QUAD, fadeIn, slideIn } from "../utils/animation";

export interface AnimatedArrowProps {
  /** Frame at which the line begins drawing in. */
  startFrame: number;
  /** Stroke + fill color for the line and arrowhead. */
  color: string;
  /** Optional caption rendered beneath the arrow with a slide-in. */
  label?: string;
  /** Width of the arrow line in pixels. Default: 65. */
  length?: number;
  /** SVG canvas height. Default: 24 (gives the arrowhead room). */
  height?: number;
  /** Stroke width. Default: 2. */
  strokeWidth?: number;
  /** Seconds for the line to draw in. Default: 0.5. */
  drawSec?: number;
  /** Seconds AFTER startFrame at which the arrowhead fades in. Default: 0.4. */
  headDelaySec?: number;
  /** Color used for the label. Default: same as `color` faded by mute. */
  labelColor?: string;
}

export const AnimatedArrow: React.FC<AnimatedArrowProps> = ({
  startFrame,
  color,
  label,
  length = 65,
  height = 24,
  strokeWidth = 2,
  drawSec = 0.5,
  headDelaySec = 0.4,
  labelColor,
}) => {
  const frame = useCurrentFrame();
  const drawProgress = interpolate(
    frame,
    [startFrame, startFrame + sec(drawSec)],
    [length, 0], // strokeDashoffset: full length → 0 (drawn)
    CLAMP_QUAD,
  );
  const headOpacity = fadeIn(frame, startFrame + sec(headDelaySec), sec(0.2));
  const midY = height / 2;
  // Arrowhead: a small triangle ending at the line tip (length).
  const headBackX = length;
  const headTipX = length + 12;
  const headHalf = 6;

  return (
    <>
      <svg width={headTipX} height={height} viewBox={`0 0 ${headTipX} ${height}`}>
        <line
          x1="0"
          y1={midY}
          x2={length}
          y2={midY}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={length}
          strokeDashoffset={drawProgress}
        />
        <polygon
          points={`${headBackX},${midY - headHalf} ${headTipX},${midY} ${headBackX},${midY + headHalf}`}
          fill={color}
          opacity={headOpacity}
        />
      </svg>
      {label && (
        <div
          style={{
            fontSize: fontSizes.small,
            fontFamily: fonts.body,
            color: labelColor ?? color,
            marginTop: 4,
            whiteSpace: "nowrap",
            opacity: fadeIn(frame, startFrame + sec(0.3), sec(0.3)),
            transform: `translateY(${slideIn(frame, startFrame + sec(0.3), 8, sec(0.3))}px)`,
          }}
        >
          {label}
        </div>
      )}
    </>
  );
};
