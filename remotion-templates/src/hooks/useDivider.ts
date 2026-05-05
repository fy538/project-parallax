/**
 * useDivider — shared gradient divider animation.
 *
 * The "gradient line that fades at edges" pattern is repeated in:
 *   - TitleTransition (3×: episode, section, endcard)
 *   - KineticTypography (2×: quote, definition)
 *   - SplitComposition (1×: center divider)
 *
 * This hook standardizes the animation and returns style props.
 *
 * Usage:
 *   const divider = useDivider(startFrame);
 *   return <div style={divider.lineStyle} />;
 *
 * Or for more control:
 *   const { progress, opacity } = useDivider(startFrame);
 */

import { useCurrentFrame } from "remotion";
import { interpolate, Easing } from "remotion";
import { palette, durations } from "../design/theme";

interface DividerOptions {
  /** Color of the divider line. Default: palette.amber */
  color?: string;
  /** Width as CSS value. Default: "60%" */
  width?: string;
  /** Height in px. Default: 2 */
  height?: number;
  /** Animation duration in frames. Default: durations.textReveal (~24 frames) */
  duration?: number;
  /** Orientation. Default: "horizontal" */
  orientation?: "horizontal" | "vertical";
}

interface DividerResult {
  /** Animation progress (0 → 1) */
  progress: number;
  /** Opacity (fades in alongside the draw) */
  opacity: number;
  /** Complete line style — apply to a <div> */
  lineStyle: React.CSSProperties;
  /** Just the animated width/height (for custom layouts) */
  animatedSize: string;
}

export const useDivider = (
  startFrame: number = 0,
  options: DividerOptions = {}
): DividerResult => {
  const frame = useCurrentFrame();

  const {
    color = palette.amber,
    width = "60%",
    height = 2,
    duration = durations.textReveal,
    orientation = "horizontal",
  } = options;

  const t = frame - startFrame;

  const progress = interpolate(t, [0, duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const opacity = interpolate(t, [0, duration * 0.4], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const isHorizontal = orientation === "horizontal";

  // Gradient fade at edges — per POLISH.md V5
  const gradient = isHorizontal
    ? `linear-gradient(to right, transparent, ${color}, transparent)`
    : `linear-gradient(to bottom, transparent, ${color}, transparent)`;

  const animatedSize = isHorizontal
    ? `${progress * 100}%`
    : `${progress * 100}%`;

  const lineStyle: React.CSSProperties = isHorizontal
    ? {
        width: animatedSize,
        maxWidth: width,
        height,
        background: gradient,
        margin: "0 auto",
        opacity,
        borderRadius: height / 2,
      }
    : {
        width: height,
        height: animatedSize,
        maxHeight: width,
        background: gradient,
        margin: "auto 0",
        opacity,
        borderRadius: height / 2,
      };

  return { progress, opacity, lineStyle, animatedSize };
};
