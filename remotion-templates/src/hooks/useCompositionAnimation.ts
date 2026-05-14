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

/**
 * Drift interpolation mode. Each mode produces a different motion character:
 *
 *   - `"linear"` (default): one-way ease-in-out drift from 0 → max over the
 *     full composition. Reads as a slow camera move in one direction. Default
 *     for episode segments.
 *
 *   - `"breathing"`: scale oscillates sinusoidally between 1.0 and maxScale
 *     on a slow cycle (~8s period). No pan, no rotation. The chart looks
 *     "alive" without moving anywhere — useful for held stat reveals where
 *     you want presence without slip.
 *
 *   - `"settle"`: scale settles from 1.0 → maxScale during the first ~0.6s
 *     as part of the entrance, then HOLDS at maxScale for the rest of the
 *     composition. No continuous drift. The camera lands and stops.
 *
 *   - `"sway"`: bidirectional sinusoidal pan around the origin (±maxPanX/2,
 *     ±maxPanY/2) on a slow cycle. Net displacement zero. Useful for
 *     atmospheric segments where you want subtle life without directional
 *     slip toward the edge.
 */
export type DriftMode = "linear" | "breathing" | "settle" | "sway";

export interface CompositionAnimationOptions {
  /** Exit fade duration in frames. Default: 15 (POLISH.md A7) */
  exitFrames?: number;
  /** Enter fade duration in frames. Default: 8 */
  enterFrames?: number;
  /**
   * Drift interpolation mode. Default: "linear" (back-compat with old
   * Ken Burns drift behavior). See `DriftMode` type docs for alternatives.
   */
  mode?: DriftMode;
  /**
   * Max scale ceiling. 0 to disable scale drift.
   * Default: motionBudget.scale (1.02 — editorial). For "breathing" mode,
   * this is the peak of the oscillation. For "settle" mode, the held
   * value after entrance.
   */
  maxScale?: number;
  /**
   * Max horizontal pan drift in px. 0 to disable.
   * Default: motionBudget.panX (0 — editorial). For "sway" mode, the
   * amplitude of horizontal oscillation.
   */
  maxPanX?: number;
  /**
   * Max vertical pan drift in px. 0 to disable.
   * Default: motionBudget.panY (0 — editorial).
   */
  maxPanY?: number;
  /**
   * Max rotation drift in degrees. 0 to disable.
   * Default: motionBudget.rotation (0 — editorial; charts stay level).
   * Non-zero only for the "documentary" preset.
   */
  maxRotation?: number;
  /** Disable drift entirely (for maps, interactive compositions) */
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
    mode = "linear",
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

  // ── Camera drift ──────────────────────────────────────────────────────
  // Each mode produces a different motion character. See the DriftMode
  // type docs at the top of this file for editorial guidance on when to
  // use each. Rotation is mode-agnostic — it always rides the linear ramp
  // when present (only documentary preset uses non-zero rotation).

  let driftScale = 1;
  let driftX = 0;
  let driftY = 0;
  let driftRotation = 0;

  if (!noDrift) {
    if (mode === "breathing") {
      // Sinusoidal scale oscillation around 1.0 ↔ maxScale.
      // Period = 8 seconds (≈ a slow human breath cycle).
      // y = 1.0 + (maxScale - 1) * (1 - cos(t)) / 2   gives y(0) = 1.0,
      // y(period/2) = maxScale, y(period) = 1.0. Starts at rest, gentle
      // wave from there.
      const periodFrames = fps * 8;
      const t = (frame / periodFrames) * Math.PI * 2;
      driftScale = 1 + (maxScale - 1) * (1 - Math.cos(t)) / 2;
      // No pan, no rotation in breathing mode (independent of maxPan/Rotation).
    } else if (mode === "settle") {
      // One-time scale settle during the first 0.6s, then HOLD.
      const settleEnd = Math.max(1, Math.round(fps * 0.6));
      driftScale = interpolate(frame, [0, settleEnd], [1.0, maxScale], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.out(Easing.cubic),
      });
      // No continuous pan/rotation in settle mode.
    } else if (mode === "sway") {
      // Bidirectional sinusoidal pan. Amplitude = maxPan{X,Y} / 2, so the
      // pan reaches ±maxPan{X,Y}/2 at the peaks. Period = 6 seconds for X,
      // 9 seconds for Y (slightly offset so the motion isn't a perfect
      // ellipse — feels less robotic).
      const tX = (frame / (fps * 6)) * Math.PI * 2;
      const tY = (frame / (fps * 9)) * Math.PI * 2;
      driftX = Math.sin(tX) * (maxPanX / 2);
      driftY = Math.sin(tY) * (maxPanY / 2);
      // Scale stays at maxScale (held, not animated) — sway is purely pan.
      driftScale = maxScale;
    } else {
      // "linear" mode (default) — the classic Ken Burns one-way drift.
      // Scale: slow zoom in over the full composition.
      driftScale = interpolate(frame, [0, totalFrames], [1.0, maxScale], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.inOut(Easing.quad),
      });
      driftX = interpolate(frame, [0, totalFrames], [0, maxPanX], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.inOut(Easing.quad),
      });
      driftY = interpolate(frame, [0, totalFrames], [0, maxPanY], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.inOut(Easing.quad),
      });
      driftRotation = interpolate(frame, [0, totalFrames], [0, maxRotation], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.inOut(Easing.quad),
      });
    }
  }

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
