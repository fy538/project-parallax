/**
 * useCompositionAnimation — automatic composition lifecycle animation.
 *
 * Every template calls this once. It returns:
 *   - exitOpacity: fades content out over last 15 frames (POLISH.md A7)
 *   - driftScale: subtle Ken Burns zoom 1.0 → 1.02 (POLISH.md A6)
 *   - driftX: subtle horizontal pan drift (POLISH.md A6)
 *   - enterOpacity: fades in over first few frames
 *
 * Usage:
 *   const { style, exitOpacity, driftScale } = useCompositionAnimation();
 *   return (
 *     <Background variant="dark">
 *       <AbsoluteFill style={style}>
 *         {children}
 *       </AbsoluteFill>
 *     </Background>
 *   );
 *
 * The `style` object combines exit opacity + Ken Burns drift into a single
 * CSSProperties object you can spread onto your content container.
 * For templates that need the values separately (e.g., maps where drift
 * shouldn't apply to annotations), destructure the individual values.
 */

import { useCurrentFrame, useVideoConfig } from "remotion";
import { interpolate, Easing } from "remotion";

interface CompositionAnimationOptions {
  /** Exit fade duration in frames. Default: 15 (POLISH.md A7) */
  exitFrames?: number;
  /** Enter fade duration in frames. Default: 8 */
  enterFrames?: number;
  /** Max scale for Ken Burns drift. 0 to disable. Default: 1.02 */
  maxScale?: number;
  /** Max horizontal pan drift in px. 0 to disable. Default: 6 */
  maxPanX?: number;
  /** Disable Ken Burns entirely (for maps, interactive compositions) */
  noDrift?: boolean;
  /** Disable exit fade (for compositions that handle their own exit) */
  noExit?: boolean;
}

interface CompositionAnimationResult {
  /** Current frame */
  frame: number;
  /** Total frames in composition */
  totalFrames: number;
  /** FPS */
  fps: number;
  /** Exit opacity (1 → 0 over last N frames). Always 1 if noExit. */
  exitOpacity: number;
  /** Enter opacity (0 → 1 over first N frames) */
  enterOpacity: number;
  /** Ken Burns scale (1.0 → maxScale). Always 1 if noDrift. */
  driftScale: number;
  /** Horizontal pan drift in px. Always 0 if noDrift. */
  driftX: number;
  /** Combined style: opacity (enter × exit) + transform (scale + translateX) */
  style: React.CSSProperties;
}

export const useCompositionAnimation = (
  options: CompositionAnimationOptions = {}
): CompositionAnimationResult => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames: totalFrames } = useVideoConfig();

  const {
    exitFrames = 15,
    enterFrames = 8,
    maxScale = 1.02,
    maxPanX = 6,
    noDrift = false,
    noExit = false,
  } = options;

  // ── Enter fade ──────────────────────────────────────────────────────────
  const enterOpacity = interpolate(frame, [0, enterFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // ── Exit fade (POLISH.md A7) ────────────────────────────────────────────
  const exitOpacity = noExit
    ? 1
    : interpolate(
        frame,
        [totalFrames - exitFrames, totalFrames],
        [1, 0],
        {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.in(Easing.cubic),
        }
      );

  // ── Ken Burns drift (POLISH.md A6) ──────────────────────────────────────
  const driftScale = noDrift
    ? 1
    : interpolate(frame, [0, totalFrames], [1.0, maxScale], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.inOut(Easing.quad),
      });

  const driftX = noDrift
    ? 0
    : interpolate(frame, [0, totalFrames], [0, maxPanX], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.inOut(Easing.quad),
      });

  // ── Combined style ──────────────────────────────────────────────────────
  const opacity = enterOpacity * exitOpacity;
  const transform =
    noDrift
      ? undefined
      : `scale(${driftScale}) translateX(${driftX}px)`;

  const style: React.CSSProperties = {
    opacity,
    ...(transform ? { transform } : {}),
  };

  return {
    frame,
    totalFrames,
    fps,
    exitOpacity,
    enterOpacity,
    driftScale,
    driftX,
    style,
  };
};
