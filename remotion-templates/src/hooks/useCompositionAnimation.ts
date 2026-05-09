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
import { motionBudget } from "../design/theme";

export interface CompositionAnimationOptions {
  /** Exit fade duration in frames. Default: 15 (POLISH.md A7) */
  exitFrames?: number;
  /** Enter fade duration in frames. Default: 8 */
  enterFrames?: number;
  /**
   * Max scale for Ken Burns drift. 0 to disable.
   * Default: motionBudget.scale (1.06). The 6% zoom is subtle enough to not
   * distort text but visible enough to make the composition feel filmed with
   * a slowly moving camera. contentArea() is sized to absorb this movement.
   */
  maxScale?: number;
  /**
   * Max horizontal pan drift in px. 0 to disable.
   * Default: motionBudget.panX (18). contentArea() subtracts this from
   * left/right margins so layout content never drifts toward the viewport edge.
   */
  maxPanX?: number;
  /**
   * Max vertical pan drift in px. 0 to disable.
   * Default: motionBudget.panY (8). contentArea() subtracts this from bottom.
   */
  maxPanY?: number;
  /**
   * Max rotation drift in degrees. 0 to disable.
   * Default: motionBudget.rotation (0.3°). Barely perceptible organic tilt.
   */
  maxRotation?: number;
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
  /** Vertical pan drift in px. Always 0 if noDrift. */
  driftY: number;
  /** Rotation drift in degrees. Always 0 if noDrift. */
  driftRotation: number;
  /** Combined style: opacity (enter × exit) + transform (scale + translate + rotate) */
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
    maxScale = motionBudget.scale,
    maxPanX = motionBudget.panX,
    maxPanY = motionBudget.panY,
    maxRotation = motionBudget.rotation,
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

  // ── Cinematic camera drift ─────────────────────────────────────────────
  // Scale: slow zoom in over the full composition
  const driftScale = noDrift
    ? 1
    : interpolate(frame, [0, totalFrames], [1.0, maxScale], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.inOut(Easing.quad),
      });

  // Horizontal pan: slow crawl right (or left for negative maxPanX)
  const driftX = noDrift
    ? 0
    : interpolate(frame, [0, totalFrames], [0, maxPanX], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.inOut(Easing.quad),
      });

  // Vertical pan: gentle diagonal feel
  const driftY = noDrift
    ? 0
    : interpolate(frame, [0, totalFrames], [0, maxPanY], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.inOut(Easing.quad),
      });

  // Rotation: barely perceptible tilt — organic handheld quality
  const driftRotation = noDrift
    ? 0
    : interpolate(frame, [0, totalFrames], [0, maxRotation], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.inOut(Easing.quad),
      });

  // ── Combined style ──────────────────────────────────────────────────────
  const opacity = enterOpacity * exitOpacity;
  const transform =
    noDrift
      ? undefined
      : `scale(${driftScale}) translate(${driftX}px, ${driftY}px) rotate(${driftRotation}deg)`;

  const style: React.CSSProperties = {
    opacity,
    ...(transform ? { transform, transformOrigin: "center center" } : {}),
  };

  return {
    frame,
    totalFrames,
    fps,
    exitOpacity,
    enterOpacity,
    driftScale,
    driftX,
    driftY,
    driftRotation,
    style,
  };
};
