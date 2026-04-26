/**
 * Shared animation utilities.
 *
 * These wrap Remotion's interpolate() and spring() with opinionated defaults
 * that match the channel's visual style — smooth, deliberate, not bouncy.
 */

import { interpolate, spring, Easing } from "remotion";
import { layout, durations } from "../design/theme";

// ── Fade helpers ────────────────────────────────────────────────────────────

/** Fade in over a given number of frames, starting at `startFrame`. */
export const fadeIn = (
  frame: number,
  startFrame: number = 0,
  duration: number = durations.fadeIn
): number =>
  interpolate(frame, [startFrame, startFrame + duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

/** Fade out over a given number of frames, ending at `endFrame`. */
export const fadeOut = (
  frame: number,
  endFrame: number,
  duration: number = durations.fadeOut
): number =>
  interpolate(frame, [endFrame - duration, endFrame], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

/** Fade in then out. Good for elements that appear briefly. */
export const fadeInOut = (
  frame: number,
  startFrame: number,
  visibleDuration: number,
  fadeDuration: number = durations.fadeIn
): number => {
  const endFrame = startFrame + visibleDuration;
  const inVal = fadeIn(frame, startFrame, fadeDuration);
  const outVal = fadeOut(frame, endFrame, fadeDuration);
  return Math.min(inVal, outVal);
};

// ── Motion helpers ──────────────────────────────────────────────────────────

/** Smooth slide-in from a direction. Returns a translateX or translateY value. */
export const slideIn = (
  frame: number,
  startFrame: number,
  distance: number = 40,
  duration: number = durations.fadeIn
): number =>
  interpolate(frame, [startFrame, startFrame + duration], [distance, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

/** Scale up from 0 to 1. Good for data points appearing on a chart. */
export const scaleIn = (
  frame: number,
  startFrame: number,
  duration: number = durations.fadeIn
): number =>
  interpolate(frame, [startFrame, startFrame + duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

/** Gentle spring — less bouncy than Remotion default. Suitable for UI. */
export const gentleSpring = (
  frame: number,
  fps: number = layout.fps,
  config?: Partial<Parameters<typeof spring>[0]>
): number =>
  spring({
    frame,
    fps,
    config: {
      damping: 15,
      stiffness: 80,
      mass: 0.8,
      ...config,
    },
  });

// ── Value interpolation ─────────────────────────────────────────────────────

/** Interpolate between two colors over time. */
export const lerpColor = (
  frame: number,
  startFrame: number,
  endFrame: number,
  fromColor: string,
  toColor: string
): string => {
  const t = interpolate(frame, [startFrame, endFrame], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  // Simple hex lerp — for complex color spaces, use d3-interpolate
  return t < 0.5 ? fromColor : toColor;
};

// ── Stagger helper ──────────────────────────────────────────────────────────

/**
 * Given an index and a stagger delay (in frames), returns the start frame
 * for that item. Use to make a list of items appear one by one.
 *
 * Example: 5 countries highlighting one after another, 10 frames apart.
 */
export const stagger = (
  index: number,
  delayPerItem: number = 8,
  baseDelay: number = 0
): number => baseDelay + index * delayPerItem;

// ── Spring-based hero entrances ────────────────────────────────────────────

/**
 * Spring entrance for hero elements (titles, key stats).
 * Higher overshoot than gentleSpring — feels more "cinematic."
 * Per POLISH.md A2: damping 12-15, mass 0.8-1.2.
 */
export const heroSpring = (
  frame: number,
  fps: number = layout.fps,
  delay: number = 0
): number =>
  spring({
    frame: frame - delay,
    fps,
    config: {
      damping: 12,
      stiffness: 100,
      mass: 1.0,
    },
  });

/**
 * Micro-settle spring — high damping, very subtle overshoot.
 * Used after bar growth or counter finish per POLISH.md A5.
 */
export const microSettle = (
  frame: number,
  fps: number = layout.fps,
  delay: number = 0
): number =>
  spring({
    frame: frame - delay,
    fps,
    config: {
      damping: 25,
      stiffness: 200,
      mass: 0.5,
    },
  });

// ── Layered reveal sequence ────────────────────────────────────────────────

/**
 * Returns the start frame for a given reveal layer.
 * Per POLISH.md A4: structure → data → labels.
 *
 * layer 0 = structure (axes, grids, background) — starts at baseDelay
 * layer 1 = data (bars, fills, lines) — starts after structure settles
 * layer 2 = labels (value labels, annotations) — starts after data settles
 *
 * Each layer gets `layerGap` frames of breathing room before the next starts.
 */
export const layerDelay = (
  layer: 0 | 1 | 2,
  baseDelay: number = 0,
  layerGap: number = 12
): number => baseDelay + layer * layerGap;

// ── Ken Burns drift ────────────────────────────────────────────────────────

/**
 * Subtle scale drift for static compositions held >3s.
 * Per POLISH.md A6: 1.00 → 1.02 over full duration.
 * Returns a scale value to apply via CSS transform.
 */
export const kenBurnsDrift = (
  frame: number,
  totalFrames: number,
  maxScale: number = 1.02
): number =>
  interpolate(frame, [0, totalFrames], [1.0, maxScale], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.quad),
  });

/**
 * Subtle pan drift — slow horizontal or vertical translation.
 * Returns pixels of offset.
 */
export const panDrift = (
  frame: number,
  totalFrames: number,
  maxOffset: number = 8
): number =>
  interpolate(frame, [0, totalFrames], [0, maxOffset], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.quad),
  });

// ── Exit animations ────────────────────────────────────────────────────────

/**
 * Exit fade for the last N frames of a composition.
 * Per POLISH.md A7: last 15-20 frames should fade out.
 * Returns opacity (1 → 0). Apply to key elements, not background.
 */
export const exitFade = (
  frame: number,
  totalFrames: number,
  exitDuration: number = 15
): number =>
  interpolate(
    frame,
    [totalFrames - exitDuration, totalFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.in(Easing.cubic) }
  );

// ── Pulse helper ───────────────────────────────────────────────────────────

/**
 * Scale pulse: 1.0 → peakScale → 1.0 over pulseDuration frames.
 * Per POLISH.md A5: subtle pulse on statistic after count-up.
 */
export const pulse = (
  frame: number,
  startFrame: number,
  pulseDuration: number = 9,
  peakScale: number = 1.02
): number => {
  const mid = startFrame + pulseDuration / 2;
  if (frame < startFrame || frame > startFrame + pulseDuration) return 1.0;
  return interpolate(
    frame,
    [startFrame, mid, startFrame + pulseDuration],
    [1.0, peakScale, 1.0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
};
