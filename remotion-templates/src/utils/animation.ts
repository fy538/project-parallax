/**
 * Shared animation utilities.
 *
 * These wrap Remotion's interpolate() and spring() with opinionated defaults
 * that match the channel's visual style — smooth, deliberate, not bouncy.
 */

import { interpolate, interpolateColors, spring, Easing, random } from "remotion";
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
  interpolate(frame, [0, totalFrames], [1.0, maxScale], CLAMP_QUAD_INOUT);

/**
 * Subtle pan drift — slow horizontal or vertical translation.
 * Returns pixels of offset.
 */
export const panDrift = (
  frame: number,
  totalFrames: number,
  maxOffset: number = 8
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
  exitDuration: number = 15
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

// ── Camera shake ──────────────────────────────────────────────────────────

/**
 * Camera shake for dramatic emphasis (market shocks, military events, stat reveals).
 * Returns { x, y, rotation } offsets to apply via CSS transform.
 *
 * Uses Remotion's deterministic random() — identical across renders.
 * Intensity decays exponentially so the shake naturally settles.
 *
 * Usage:
 *   const shake = cameraShake(frame, shockFrame, 6, 20);
 *   transform: `translate(${shake.x}px, ${shake.y}px) rotate(${shake.rotation}deg)`
 *
 * @param frame - Current frame
 * @param startFrame - When the shake begins
 * @param intensity - Max pixel displacement (default 6)
 * @param duration - Shake duration in frames (default 20, ~0.67s at 30fps)
 * @param frequency - How many shakes per duration (default 4)
 */
export const cameraShake = (
  frame: number,
  startFrame: number,
  intensity: number = 6,
  duration: number = 20,
  frequency: number = 4
): { x: number; y: number; rotation: number } => {
  if (frame < startFrame || frame > startFrame + duration) {
    return { x: 0, y: 0, rotation: 0 };
  }

  const progress = (frame - startFrame) / duration;
  // Exponential decay — settles naturally
  const decay = Math.exp(-progress * 4);
  const amp = intensity * decay;

  // Deterministic per-frame offsets using Remotion's random()
  const xOffset = (random(`shake-x-${frame}`) * 2 - 1) * amp;
  const yOffset = (random(`shake-y-${frame}`) * 2 - 1) * amp;
  const rotOffset = (random(`shake-r-${frame}`) * 2 - 1) * amp * 0.15; // subtle rotation

  return { x: xOffset, y: yOffset, rotation: rotOffset };
};

// ── SVG path draw ─────────────────────────────────────────────────────────

/**
 * Animate an SVG path via stroke-dasharray/dashoffset.
 * Returns { dashArray, dashOffset } to spread onto a <path> or <line>.
 *
 * Usage:
 *   const draw = pathDraw(frame, sec(0.5), sec(0.8), pathLength);
 *   <path d={...} strokeDasharray={draw.dashArray} strokeDashoffset={draw.dashOffset} />
 *
 * @param frame - Current frame
 * @param startFrame - When drawing begins
 * @param duration - How long the draw takes
 * @param pathLength - Total path length (use SVGPathElement.getTotalLength() or estimate)
 */
export const pathDraw = (
  frame: number,
  startFrame: number,
  duration: number,
  pathLength: number
): { dashArray: number; dashOffset: number } => {
  const progress = interpolate(
    frame,
    [startFrame, startFrame + duration],
    [0, 1],
    CLAMP_CUBIC
  );
  return {
    dashArray: pathLength,
    dashOffset: pathLength * (1 - progress),
  };
};

// ── SVG path morphing ───────────────────────────────────────────────────

/**
 * Parse an SVG path d-string into an array of [x, y] points.
 * Handles M, L, C, Q, Z commands. Curves are sampled at `samplesPerCurve` points.
 *
 * This is a lightweight parser for morph interpolation — not a full SVG spec parser.
 */
const parsePath = (d: string, samplesPerCurve: number = 8): [number, number][] => {
  const points: [number, number][] = [];
  const commands = d.match(/[MLCQZ][^MLCQZ]*/gi) || [];
  let cx = 0;
  let cy = 0;

  for (const cmd of commands) {
    const type = cmd[0].toUpperCase();
    const nums = (cmd.slice(1).match(/-?\d+\.?\d*/g) || []).map(Number);

    switch (type) {
      case "M":
      case "L":
        for (let i = 0; i < nums.length; i += 2) {
          cx = nums[i];
          cy = nums[i + 1];
          points.push([cx, cy]);
        }
        break;
      case "C":
        // Cubic bezier: sample along curve
        for (let i = 0; i < nums.length; i += 6) {
          const x0 = cx, y0 = cy;
          const x1 = nums[i], y1 = nums[i + 1];
          const x2 = nums[i + 2], y2 = nums[i + 3];
          const x3 = nums[i + 4], y3 = nums[i + 5];
          for (let s = 1; s <= samplesPerCurve; s++) {
            const t = s / samplesPerCurve;
            const mt = 1 - t;
            cx = mt * mt * mt * x0 + 3 * mt * mt * t * x1 + 3 * mt * t * t * x2 + t * t * t * x3;
            cy = mt * mt * mt * y0 + 3 * mt * mt * t * y1 + 3 * mt * t * t * y2 + t * t * t * y3;
            points.push([cx, cy]);
          }
        }
        break;
      case "Q":
        // Quadratic bezier: sample along curve
        for (let i = 0; i < nums.length; i += 4) {
          const x0 = cx, y0 = cy;
          const x1 = nums[i], y1 = nums[i + 1];
          const x2 = nums[i + 2], y2 = nums[i + 3];
          for (let s = 1; s <= samplesPerCurve; s++) {
            const t = s / samplesPerCurve;
            const mt = 1 - t;
            cx = mt * mt * x0 + 2 * mt * t * x1 + t * t * x2;
            cy = mt * mt * y0 + 2 * mt * t * y1 + t * t * y2;
            points.push([cx, cy]);
          }
        }
        break;
      case "Z":
        if (points.length > 0) {
          points.push([...points[0]]);
          cx = points[0][0];
          cy = points[0][1];
        }
        break;
    }
  }

  return points;
};

/**
 * Resample a point array to exactly N evenly-spaced points along its polyline.
 * Ensures two paths have the same number of points for interpolation.
 */
const resamplePoints = (
  points: [number, number][],
  targetCount: number
): [number, number][] => {
  if (points.length === 0) return Array.from({ length: targetCount }, () => [0, 0] as [number, number]);
  if (points.length === 1 || targetCount <= 1) {
    return Array.from({ length: targetCount }, () => [...points[0]] as [number, number]);
  }

  // Compute cumulative arc lengths
  const lengths: number[] = [0];
  for (let i = 1; i < points.length; i++) {
    const dx = points[i][0] - points[i - 1][0];
    const dy = points[i][1] - points[i - 1][1];
    lengths.push(lengths[i - 1] + Math.sqrt(dx * dx + dy * dy));
  }
  const totalLength = lengths[lengths.length - 1];
  if (totalLength === 0) {
    return Array.from({ length: targetCount }, () => [...points[0]] as [number, number]);
  }

  const result: [number, number][] = [];
  for (let i = 0; i < targetCount; i++) {
    const targetDist = (i / (targetCount - 1)) * totalLength;
    // Find the segment containing this distance
    let segIdx = 0;
    while (segIdx < lengths.length - 2 && lengths[segIdx + 1] < targetDist) {
      segIdx++;
    }
    const segLen = lengths[segIdx + 1] - lengths[segIdx];
    const t = segLen > 0 ? (targetDist - lengths[segIdx]) / segLen : 0;
    result.push([
      points[segIdx][0] + t * (points[segIdx + 1][0] - points[segIdx][0]),
      points[segIdx][1] + t * (points[segIdx + 1][1] - points[segIdx][1]),
    ]);
  }

  return result;
};

/**
 * Interpolate between two SVG path d-strings.
 * Parses both paths, resamples to equal point counts, linearly interpolates.
 * Returns a new d-string (M + L segments) at the given progress (0-1).
 *
 * Usage:
 *   const progress = interpolate(frame, [startFrame, endFrame], [0, 1], CLAMP);
 *   const d = morphPath(pathA, pathB, progress);
 *   <path d={d} />
 *
 * For best results, paths should have similar complexity and topology.
 * More complex paths will be sampled at higher resolution automatically.
 *
 * @param pathA - Start path d-string
 * @param pathB - End path d-string
 * @param progress - Interpolation progress (0 = pathA, 1 = pathB)
 * @param resolution - Number of interpolation points (default: 64)
 */
export const morphPath = (
  pathA: string,
  pathB: string,
  progress: number,
  resolution: number = 64
): string => {
  // Clamp progress to [0, 1]
  const p = Math.max(0, Math.min(1, progress));

  // Always resample both paths to avoid a visual snap between the original
  // curved d-string and the linearized M+L approximation at boundaries.
  const pointsA = resamplePoints(parsePath(pathA), resolution);
  const pointsB = resamplePoints(parsePath(pathB), resolution);

  const morphed = pointsA.map((pA, i) => {
    const pB = pointsB[i];
    return [
      pA[0] + (pB[0] - pA[0]) * p,
      pA[1] + (pB[1] - pA[1]) * p,
    ];
  });

  return (
    `M ${morphed[0][0].toFixed(2)} ${morphed[0][1].toFixed(2)} ` +
    morphed
      .slice(1)
      .map((p) => `L ${p[0].toFixed(2)} ${p[1].toFixed(2)}`)
      .join(" ")
  );
};

/**
 * Frame-driven path morph — wraps morphPath with Remotion's interpolate.
 * Returns the interpolated d-string for the current frame.
 *
 * Usage:
 *   const d = morphPathAnimated(frame, sec(1), sec(2), circleD, starD);
 *   <path d={d} />
 */
export const morphPathAnimated = (
  frame: number,
  startFrame: number,
  endFrame: number,
  pathA: string,
  pathB: string,
  resolution: number = 64
): string => {
  const progress = interpolate(
    frame,
    [startFrame, endFrame],
    [0, 1],
    CLAMP_CUBIC
  );
  return morphPath(pathA, pathB, progress, resolution);
};
