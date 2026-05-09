/**
 * Shared animation utilities.
 *
 * These wrap Remotion's interpolate() and spring() with opinionated defaults
 * that match the channel's visual style — smooth, deliberate, not bouncy.
 */

import { interpolate, interpolateColors, spring, Easing } from "remotion";
import { layout, durations } from "../design/theme";

// ── Reusable interpolation configs (hoisted to avoid per-frame allocation) ─
// These are the most common interpolation option shapes. Import and pass directly
// to interpolate() instead of creating inline objects every frame.

/** Clamp both ends, no easing. The most common config. */
export const CLAMP: { extrapolateLeft: "clamp"; extrapolateRight: "clamp" } = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
};

/** Clamp + cubic ease-out (default motion). */
export const CLAMP_CUBIC = { ...CLAMP, easing: Easing.out(Easing.cubic) };

/** Clamp + quartic ease-out (bar growth, color fills). */
export const CLAMP_QUARTIC = { ...CLAMP, easing: Easing.out(Easing.poly(4)) };

/** Clamp + quintic ease-out (hero elements). */
export const CLAMP_QUINTIC = { ...CLAMP, easing: Easing.out(Easing.poly(5)) };

/** Clamp + quad ease-out (structure, gridlines, dividers). */
export const CLAMP_QUAD = { ...CLAMP, easing: Easing.out(Easing.quad) };

/** Clamp + sine ease-out (labels, annotations). */
export const CLAMP_SINE = { ...CLAMP, easing: Easing.out(Easing.sin) };

/** Clamp + cubic ease-in (exit animations). */
export const CLAMP_CUBIC_IN = { ...CLAMP, easing: Easing.in(Easing.cubic) };

/** Clamp + cubic ease-in-out (sweeps, symmetric motion). */
export const CLAMP_CUBIC_INOUT = { ...CLAMP, easing: Easing.inOut(Easing.cubic) };

/** Clamp + quad ease-in-out (Ken Burns drift). */
export const CLAMP_QUAD_INOUT = { ...CLAMP, easing: Easing.inOut(Easing.quad) };

// ── Fade helpers ────────────────────────────────────────────────────────────

/** Fade in over a given number of frames, starting at `startFrame`. */
export const fadeIn = (
  frame: number,
  startFrame: number = 0,
  duration: number = durations.fadeIn
): number =>
  interpolate(frame, [startFrame, startFrame + duration], [0, 1], CLAMP);

/** Fade out over a given number of frames, ending at `endFrame`. */
export const fadeOut = (
  frame: number,
  endFrame: number,
  duration: number = durations.fadeOut
): number =>
  interpolate(frame, [endFrame - duration, endFrame], [1, 0], CLAMP);

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
  interpolate(frame, [startFrame, startFrame + duration], [distance, 0], CLAMP_CUBIC);

/** Scale up from 0 to 1. Good for data points appearing on a chart. */
export const scaleIn = (
  frame: number,
  startFrame: number,
  duration: number = durations.fadeIn
): number =>
  interpolate(frame, [startFrame, startFrame + duration], [0, 1], CLAMP_CUBIC);

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

/**
 * Interpolate between two hex colors over time using Remotion's
 * perceptual color interpolation (sRGB). Properly handles
 * intermediate hues instead of snapping at t=0.5.
 *
 * Supports multi-stop color ramps: pass arrays for a gradient through
 * multiple colors (e.g., blue → neutral → red for geopolitical shifts).
 */
export const lerpColor = (
  frame: number,
  startFrame: number,
  endFrame: number,
  fromColor: string,
  toColor: string
): string =>
  interpolateColors(
    frame,
    [startFrame, endFrame],
    [fromColor, toColor]
  );

/**
 * Multi-stop color ramp — interpolate through N colors evenly spaced
 * between startFrame and endFrame. Useful for geopolitical color shifts
 * (US blue → neutral gray → China rust) or severity ramps.
 */
export const colorRamp = (
  frame: number,
  startFrame: number,
  endFrame: number,
  colors: string[]
): string => {
  if (colors.length < 2) return colors[0] || "#000000";
  const stops = colors.map((_, i) =>
    startFrame + (i / (colors.length - 1)) * (endFrame - startFrame)
  );
  return interpolateColors(frame, stops, colors);
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

/** Per POLISH.md A6: max scale drift for held compositions (1.00 → KEN_BURNS_MAX_SCALE). */
export const KEN_BURNS_MAX_SCALE = 1.02;
/** Per POLISH.md A6: max pan drift in pixels for held compositions. */
export const PAN_DRIFT_MAX_OFFSET = 8;
/** Per POLISH.md A7: exit fade duration in frames at 30fps (last 15 frames fade out). */
export const EXIT_FADE_DURATION = 15;

/**
 * Subtle scale drift for static compositions held >3s.
 * Per POLISH.md A6: 1.00 → 1.02 over full duration.
 * Returns a scale value to apply via CSS transform.
 */
export const kenBurnsDrift = (
  frame: number,
  totalFrames: number,
  maxScale: number = KEN_BURNS_MAX_SCALE
): number =>
  interpolate(frame, [0, totalFrames], [1.0, maxScale], CLAMP_QUAD_INOUT);

/**
 * Subtle pan drift — slow horizontal or vertical translation.
 * Returns pixels of offset.
 */
export const panDrift = (
  frame: number,
  totalFrames: number,
  maxOffset: number = PAN_DRIFT_MAX_OFFSET
): number =>
  interpolate(frame, [0, totalFrames], [0, maxOffset], CLAMP_QUAD_INOUT);

// ── Cinematic entrance helpers ────────────────────────────────────────────

/**
 * Scale reveal — element arrives at a larger scale and eases down.
 * Use for hero stats, titles, key reveals. Returns scale value.
 * The "arriving with authority" feel vs. timid slide-in.
 */
export const scaleReveal = (
  frame: number,
  startFrame: number,
  duration: number = 20,
  fromScale: number = 1.2,
  toScale: number = 1.0
): number =>
  interpolate(frame, [startFrame, startFrame + duration], [fromScale, toScale], CLAMP_CUBIC);

/**
 * Bloom intensity — grows from 0 to 1 and then slowly fades to a sustained level.
 * Use for the light bloom behind accent elements. Returns opacity 0-1.
 *
 * Pattern: 0 → 1.0 (flash) → 0.6 (sustain)
 * The initial flash mimics a light source "turning on" then settling.
 */
export const bloomIntensity = (
  frame: number,
  startFrame: number,
  flashDuration: number = 8,
  sustainLevel: number = 0.6
): number => {
  if (frame < startFrame) return 0;

  const flashEnd = startFrame + flashDuration;
  const settleEnd = flashEnd + flashDuration * 2;

  if (frame <= flashEnd) {
    // Flash in
    return interpolate(frame, [startFrame, flashEnd], [0, 1], CLAMP_CUBIC);
  }

  if (frame <= settleEnd) {
    // Settle down to sustain
    return interpolate(frame, [flashEnd, settleEnd], [1, sustainLevel], CLAMP_QUAD_INOUT);
  }

  return sustainLevel;
};

// ── Easing presets by role ─────────────────────────────────────────────────
// Per POLISH.md A1: differentiate motion by visual hierarchy.
// Hero elements overshoot and settle. Structure fades in linearly. Labels are soft.

export const easings = {
  /** Hero/highlight bars: fast start, long deceleration tail. */
  heroBar: Easing.out(Easing.poly(5)), // quintic ease-out
  /** Normal bars: standard deceleration, slightly snappier than cubic. */
  bar: Easing.out(Easing.poly(4)), // quartic ease-out
  /** Labels, source text, annotations: gentle sine curve. */
  label: Easing.out(Easing.sin),
  /** Structure elements (gridlines, axes): steady linear-ish reveal. */
  structure: Easing.out(Easing.quad),
  /** Reference lines scanning across: ease-in-out for "sweep" feel. */
  sweep: Easing.inOut(Easing.cubic),
} as const;

// ── Gridline draw ─────────────────────────────────────────────────────────

/**
 * Returns a 0→1 progress value for drawing a gridline via stroke-dashoffset.
 * Lines draw in from left to right with a staggered start per line.
 */
export const gridlineDraw = (
  frame: number,
  startFrame: number,
  drawDuration: number = 18,
  lineIndex: number = 0,
  staggerPerLine: number = 3
): number => {
  const lineStart = startFrame + lineIndex * staggerPerLine;
  return interpolate(frame, [lineStart, lineStart + drawDuration], [0, 1], CLAMP_QUAD);
};

// ── Focus pull (camera energy) ────────────────────────────────────────────

/**
 * Three-phase scale animation simulating a camera focus pull:
 *   Phase 1: start slightly wide (0.95×) — establishes context
 *   Phase 2: zoom to highlight (1.08×) — draws attention
 *   Phase 3: ease back to neutral (1.0×) — settles
 *
 * Returns a scale value. Apply via CSS transform on the chart area.
 * `highlightFrame` is when the hero bar finishes growing.
 */
export const focusPull = (
  frame: number,
  totalFrames: number,
  highlightFrame: number,
  zoomScale: number = 1.08,
  wideScale: number = 0.96
): number => {
  const settleFrame = highlightFrame + 30; // ~1s to hold zoom, then settle

  if (frame <= highlightFrame) {
    // Phase 1→2: wide → zoom to highlight
    return interpolate(frame, [0, highlightFrame], [wideScale, zoomScale], CLAMP_CUBIC);
  }

  // Phase 3: zoom → neutral
  return interpolate(frame, [highlightFrame, settleFrame + 30], [zoomScale, 1.0], CLAMP_QUAD_INOUT);
};

// ── Exit animations ────────────────────────────────────────────────────────

/**
 * Exit fade for the last N frames of a composition.
 * Per POLISH.md A7: last 15-20 frames should fade out.
 * Returns opacity (1 → 0). Apply to key elements, not background.
 */
export const exitFade = (
  frame: number,
  totalFrames: number,
  exitDuration: number = EXIT_FADE_DURATION
): number =>
  interpolate(
    frame,
    [totalFrames - exitDuration, totalFrames],
    [1, 0],
    CLAMP_CUBIC_IN
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
    CLAMP
  );
};

// ── Lock-on pulse (brand motif) ────────────────────────────────────────────

/**
 * Lock-on pulse — the channel's "I am looking at this" motion language.
 *
 * Per BRAND.md crosshair animation spec: 200ms scale pulse 1.0 → 1.1 → 1.0,
 * spring-eased on the way up. Used on first-appearance moments where the
 * viewer's eye should snap to the element:
 *   - Callout dots in AnnotatedImage
 *   - Point markers in RouteAnimation when newly activated
 *   - Year markers in HorizontalTimeline when newly revealed
 *   - Focused nodes in NetworkDiagram
 *   - Highlighted bars in DataChart (already implemented inline)
 *
 * The peak is at 40% of duration (front-loaded) so it reads as discovery,
 * not breathing. Returns scale value to apply via CSS transform.
 *
 * @param frame Current frame
 * @param startFrame When the lock-on begins (typically the element's reveal frame)
 * @param fps Frames per second (default: 30)
 * @param peakScale Maximum scale at peak (default 1.10 — BRAND.md spec)
 * @param durationMs Total pulse duration in milliseconds (default 200ms — BRAND.md spec)
 */
export const lockOnPulse = (
  frame: number,
  startFrame: number,
  fps: number = 30,
  peakScale: number = 1.1,
  durationMs: number = 200
): number => {
  const totalFrames = Math.max(2, Math.round((durationMs / 1000) * fps));
  if (frame < startFrame || frame > startFrame + totalFrames) return 1.0;
  // Front-loaded peak: 40% of duration to peak, 60% to settle
  const peakFrame = startFrame + Math.round(totalFrames * 0.4);
  return interpolate(
    frame,
    [startFrame, peakFrame, startFrame + totalFrames],
    [1.0, peakScale, 1.0],
    CLAMP_CUBIC
  );
};

