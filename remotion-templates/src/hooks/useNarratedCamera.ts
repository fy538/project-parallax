/**
 * useNarratedCamera — generalized 2D virtual camera for data visualizations.
 *
 * Unlike useTimelineCamera (1D horizontal) or useTreeCamera (tree-specific),
 * this hook provides a general-purpose camera that can pan to any (x, y) coordinate,
 * zoom to arbitrary levels, and apply cinematic focus isolation (dim + blur + scale)
 * to specific elements by index.
 *
 * Designed for: NetworkDiagram, EscalationLadder, DataChart, RadarChart, SankeyFlow,
 * or any template that needs narrated camera movement over a 2D canvas.
 *
 * Features:
 *   - Pan to arbitrary (x, y) coordinates with eased motion
 *   - Zoom levels with zoom-leads-pan offset (natural feel)
 *   - Focus isolation: dim, blur, and scale non-focused elements
 *   - Multi-element focus (highlight a group, not just one)
 *   - Shake/vibration at configurable intensity (for tension)
 *   - Label overlay per step (for narration context)
 *   - Auto-path generation from element positions
 *
 * Usage:
 *   const camera = useNarratedCamera({
 *     elements: [
 *       { id: "node-a", x: 300, y: 200 },
 *       { id: "node-b", x: 800, y: 400 },
 *     ],
 *     cameraPath: [
 *       { target: { x: 300, y: 200 }, zoom: 1.4, duration: 3, focus: [0] },
 *       { target: "element:1", zoom: 1.6, duration: 2, focus: [1], shake: 0.3 },
 *       { target: "overview", zoom: 0.8, duration: 2 },
 *     ],
 *     canvasWidth: 1920,
 *     canvasHeight: 1080,
 *   });
 */

import { useMemo } from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { sec } from "../design/theme";
import {
  computeStepBoundaries,
  motionEasings,
} from "../utils/stepFramework";
import { computeStepFrameworkState } from "./useStepFramework";

// Destructure at file top so call sites read as `track` / `snap` / `zoom`
// — keeps diffs small vs the legacy TRACK_EASE / SNAP_EASE / ZOOM_EASE names.
const { track, snap, zoom } = motionEasings;

// ── Types ──────────────────────────────────────────────────────────────────

export interface CameraElement {
  /** Unique identifier for this element */
  id: string;
  /** Center X position on the canvas */
  x: number;
  /** Center Y position on the canvas */
  y: number;
  /** Optional group tag for multi-element focus */
  group?: string;
}

export interface NarratedCameraStep {
  /**
   * Camera target:
   * - { x, y } — explicit coordinates
   * - "element:N" — center on element at index N
   * - "group:name" — center on centroid of group
   * - "overview" — center of canvas, typically with low zoom
   */
  target: { x: number; y: number } | string;
  /** Zoom level (1.0 = 100%, >1 = zoom in, <1 = zoom out) */
  zoom: number;
  /**
   * Duration of this step.
   * - Absolute: seconds (e.g., 3 = 3 seconds)
   * - Proportional: fraction of total composition time (e.g., 0.4 = 40%)
   *
   * Mode auto-detected: if all step durations sum to ≤1.01, treated as
   * proportional. Set `proportional: true` in options to force.
   */
  duration: number;
  /**
   * Which element indices are "in focus" during this step.
   * Non-focused elements get dimmed/blurred/scaled down.
   * Empty or undefined = all elements in focus (no isolation).
   */
  focus?: number[];
  /** Focus by group name instead of indices */
  focusGroup?: string;
  /** Camera behavior: "track" = smooth pan, "snap" = fast jump */
  behavior?: "track" | "snap";
  /** Shake intensity 0-1 (0 = none, 1 = strong vibration) */
  shake?: number;
  /** Optional label displayed during this step */
  label?: string;
  /** Dim amount for non-focused elements (0-1, default 0.6) */
  dimAmount?: number;
  /** Blur amount for non-focused elements in px (default 1.5) */
  blurAmount?: number;
  /** Scale for non-focused elements (default 0.88) */
  unfocusedScale?: number;
  /**
   * Sync word anchor — when Whisper sync points are available,
   * this step starts when the narrator says this word.
   * Falls back to proportional/absolute timing when no sync points exist.
   */
  syncStart?: string;
}

/** Resolved sync point from Whisper alignment */
export interface SyncPoint {
  word: string;
  /** Absolute time in seconds from start of composition */
  timeSec: number;
  /** Frame number within composition */
  frame: number;
  confidence?: number;
}

export interface UseNarratedCameraOptions {
  /** All trackable elements on the canvas */
  elements: CameraElement[];
  /** Camera keyframe sequence */
  cameraPath: NarratedCameraStep[];
  /** Canvas dimensions */
  canvasWidth: number;
  canvasHeight: number;
  /** Transition duration between steps in seconds (default: 0.8) */
  transitionSec?: number;
  /** Vertical offset for camera center (default: 0) */
  verticalBias?: number;
  /**
   * Force proportional duration mode.
   * If true, step durations are fractions of total composition time.
   * If omitted, auto-detected: proportional when durations sum to ≤1.01.
   */
  proportional?: boolean;
  /**
   * Resolved sync points from Whisper alignment.
   * When provided, camera steps with matching syncStart words
   * snap their start boundary to the sync point's frame.
   */
  syncPoints?: SyncPoint[];
}

export interface NarratedCameraState {
  /** Style for the outer viewport (overflow: hidden, full canvas) */
  viewportStyle: React.CSSProperties;
  /** Style for the inner content container (animated transform) */
  contentStyle: React.CSSProperties;
  /** Current focused element indices (empty = all focused) */
  focusedIndices: number[];
  /** Whether all elements are in focus (overview/no isolation) */
  isOverview: boolean;
  /** Current step index in the camera path */
  stepIndex: number;
  /** Progress within current step (0–1) */
  stepProgress: number;
  /** Get opacity multiplier for an element (1.0 = fully visible) */
  getElementOpacity: (index: number) => number;
  /** Get scale multiplier for an element */
  getElementScale: (index: number) => number;
  /** Get blur amount for an element in px */
  getElementBlur: (index: number) => number;
  /** Current zoom level */
  currentZoom: number;
  /** Current step's label */
  currentLabel: string | undefined;
  /** Whether camera is transitioning between steps */
  isTransitioning: boolean;
  /** Current shake offset { x, y } in pixels (apply to content) */
  shakeOffset: { x: number; y: number };
  /** Current camera position (for external use) */
  cameraPosition: { x: number; y: number };
}

// ── Easing presets — imported from stepFramework ────────────────────────────
// `track` / `snap` / `zoom` destructured from `motionEasings` above —
// defined once in stepFramework.ts so calibration changes propagate to all
// camera hooks automatically.

const CLAMP_OPTS = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

// ── Deterministic shake (no Math.random) ──────────────────────────────────

const deterministicShake = (frame: number, intensity: number): { x: number; y: number } => {
  if (intensity <= 0) return { x: 0, y: 0 };
  // Use sine waves at different frequencies for pseudo-random shake
  const maxOffset = intensity * 8; // max 8px at full intensity
  const x = Math.sin(frame * 0.7) * Math.cos(frame * 1.3) * maxOffset;
  const y = Math.cos(frame * 0.9) * Math.sin(frame * 1.1) * maxOffset;
  return { x, y };
};

// ── Auto-path generator ───────────────────────────────────────────────────

/**
 * Auto-generate a camera path that visits each element sequentially
 * with a final overview pullback.
 */
export function generateNarratedCameraPath(
  elements: CameraElement[],
  options?: {
    secondsPerElement?: number;
    overviewDuration?: number;
    zoomLevel?: number;
    overviewZoom?: number;
    includeOverviewStart?: boolean;
  }
): NarratedCameraStep[] {
  const perElement = options?.secondsPerElement ?? 2.5;
  const overviewDur = options?.overviewDuration ?? 2;
  const zoom = options?.zoomLevel ?? 1.4;
  const overviewZoom = options?.overviewZoom ?? 0.8;
  const includeStart = options?.includeOverviewStart ?? true;

  const steps: NarratedCameraStep[] = [];

  // Optional opening overview
  if (includeStart) {
    steps.push({
      target: "overview",
      zoom: overviewZoom,
      duration: overviewDur,
    });
  }

  // Visit each element
  for (let i = 0; i < elements.length; i++) {
    steps.push({
      target: `element:${i}`,
      zoom,
      duration: perElement,
      focus: [i],
      behavior: "track",
    });
  }

  // Final pullback
  steps.push({
    target: "overview",
    zoom: overviewZoom,
    duration: overviewDur,
  });

  return steps;
}

// ── Hook ───────────────────────────────────────────────────────────────────

export const useNarratedCamera = (
  opts: UseNarratedCameraOptions
): NarratedCameraState => {
  const {
    elements,
    cameraPath,
    canvasWidth,
    canvasHeight,
    transitionSec = 0.8,
    verticalBias = 0,
    proportional: forceProportional,
    syncPoints,
  } = opts;

  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const transitionFrames = sec(transitionSec);

  // ── Detect proportional mode ───────────────────────────────────────
  // Proportional when: explicitly set, or all step durations sum to ≤1.01
  const isProportional = useMemo(() => {
    if (forceProportional !== undefined) return forceProportional;
    if (cameraPath.length === 0) return false;
    const total = cameraPath.reduce((sum, s) => sum + s.duration, 0);
    return total <= 1.01;
  }, [cameraPath, forceProportional]);

  // ── Build sync point lookup ────────────────────────────────────────
  const syncLookup = useMemo(() => {
    if (!syncPoints || syncPoints.length === 0) return null;
    const lookup = new Map<string, number>();
    for (const sp of syncPoints) {
      lookup.set(sp.word.toLowerCase(), sp.frame);
    }
    return lookup;
  }, [syncPoints]);

  // ── Build cumulative frame boundaries ──────────────────────────────
  const stepBoundaries = useMemo(() => {
    // Convert each step duration to frames, then build boundaries via
    // the shared primitive (stepFramework.ts).
    const frameDurations = cameraPath.map((step) =>
      isProportional
        ? Math.round(step.duration * durationInFrames) // fraction of total
        : sec(step.duration), // absolute seconds
    );
    // Clone each StepBoundary before the auto-fill/sync-anchor passes below.
    // computeStepBoundaries returns fresh objects, but the mutations downstream
    // (last.end = durationInFrames, boundaries[i].start = syncFrame, etc.)
    // would otherwise tie this memo's output identity to mutation order. The
    // shallow clone keeps downstream consumers free to assume boundaries are
    // effectively immutable from their perspective.
    const boundaries = computeStepBoundaries(frameDurations).map((b) => ({ ...b }));

    // Auto-fill: if absolute mode and last step ends before composition,
    // extend the last step to fill remaining time (camera holds final position)
    if (!isProportional && boundaries.length > 0) {
      const last = boundaries[boundaries.length - 1];
      if (last.end < durationInFrames) {
        last.end = durationInFrames;
      }
    }

    // Sync anchor adjustment: if sync points available, snap step starts
    // to the frame where the narrator says the sync word
    if (syncLookup && boundaries.length > 0) {
      for (let i = 0; i < cameraPath.length; i++) {
        const syncWord = cameraPath[i].syncStart;
        if (syncWord) {
          const syncFrame = syncLookup.get(syncWord.toLowerCase());
          if (syncFrame !== undefined) {
            // Snap this step's start to the sync frame
            boundaries[i].start = syncFrame;
            // Adjust previous step's end to match
            if (i > 0) {
              boundaries[i - 1].end = syncFrame;
              // Guard: if previous step was squeezed to zero/negative width,
              // give it a minimum viable duration (0.5s)
              if (boundaries[i - 1].end <= boundaries[i - 1].start) {
                boundaries[i - 1].end = boundaries[i - 1].start + sec(0.5);
                // Push current step start forward to avoid overlap
                boundaries[i].start = boundaries[i - 1].end;
              }
            }
            // If current step's end is now at or before its start, extend it
            if (boundaries[i].end <= boundaries[i].start) {
              boundaries[i].end = Math.min(
                boundaries[i].start + sec(0.5),
                i < boundaries.length - 1 ? boundaries[i + 1].start : durationInFrames
              );
            }
          }
        }
      }
    }

    return boundaries;
  }, [cameraPath, durationInFrames, isProportional, syncLookup]);

  // ── Guard: empty cameraPath ─────────────────────────────────────────
  if (cameraPath.length === 0) {
    return {
      viewportStyle: { position: "absolute", top: 0, left: 0, width: canvasWidth, height: canvasHeight, overflow: "hidden" },
      contentStyle: { position: "absolute", top: 0, left: 0, width: canvasWidth, height: canvasHeight },
      focusedIndices: [],
      isOverview: true,
      stepIndex: 0,
      stepProgress: 0,
      getElementOpacity: () => 1,
      getElementScale: () => 1,
      getElementBlur: () => 0,
      currentZoom: 1,
      currentLabel: undefined,
      isTransitioning: false,
      shakeOffset: { x: 0, y: 0 },
      cameraPosition: { x: canvasWidth / 2, y: canvasHeight / 2 },
    };
  }

  // ── Determine current step ─────────────────────────────────────────
  // useNarratedCamera builds boundaries with custom post-processing (sync-
  // point snapping, auto-fill last step), so the hook form of useStepFramework
  // doesn't fit. The pure compute function reuses the same index/progress
  // semantics over our hand-built boundaries array.
  const {
    index: stepIndex,
    boundary: currentBounds,
    progress: stepProgress,
  } = computeStepFrameworkState(frame, stepBoundaries);

  const currentStep = cameraPath[stepIndex];

  // ── Resolve target coordinates ─────────────────────────────────────
  const resolveTarget = (target: NarratedCameraStep["target"]): { x: number; y: number } => {
    if (typeof target === "object") {
      return target;
    }

    if (target === "overview") {
      // Center of all elements (centroid)
      if (elements.length === 0) return { x: canvasWidth / 2, y: canvasHeight / 2 };
      const avgX = elements.reduce((sum, e) => sum + e.x, 0) / elements.length;
      const avgY = elements.reduce((sum, e) => sum + e.y, 0) / elements.length;
      return { x: avgX, y: avgY };
    }

    if (target.startsWith("element:")) {
      const idx = parseInt(target.split(":")[1], 10);
      const el = elements[idx];
      return el ? { x: el.x, y: el.y } : { x: canvasWidth / 2, y: canvasHeight / 2 };
    }

    if (target.startsWith("group:")) {
      const groupName = target.split(":")[1];
      const groupElements = elements.filter((e) => e.group === groupName);
      if (groupElements.length === 0) return { x: canvasWidth / 2, y: canvasHeight / 2 };
      const avgX = groupElements.reduce((sum, e) => sum + e.x, 0) / groupElements.length;
      const avgY = groupElements.reduce((sum, e) => sum + e.y, 0) / groupElements.length;
      return { x: avgX, y: avgY };
    }

    return { x: canvasWidth / 2, y: canvasHeight / 2 };
  };

  // ── Resolve focus indices ──────────────────────────────────────────
  const resolveFocus = (step: NarratedCameraStep): number[] => {
    if (step.focus && step.focus.length > 0) return step.focus;
    if (step.focusGroup) {
      return elements
        .map((e, i) => (e.group === step.focusGroup ? i : -1))
        .filter((i) => i >= 0);
    }
    return []; // empty = all in focus
  };

  // Previous step for interpolation
  const prevStep = stepIndex > 0 ? cameraPath[stepIndex - 1] : currentStep;

  // ── Interpolate camera position ────────────────────────────────────
  const transitionEnd = Math.min(
    currentBounds.start + transitionFrames,
    currentBounds.end
  );

  const isTransitioning =
    frame >= currentBounds.start && frame < transitionEnd && stepIndex > 0;

  const ease = currentStep.behavior === "snap" ? snap : track;

  const prevTarget = resolveTarget(prevStep.target);
  const currTarget = resolveTarget(currentStep.target);

  const camX =
    stepIndex === 0
      ? currTarget.x
      : interpolate(
          frame,
          [currentBounds.start, transitionEnd],
          [prevTarget.x, currTarget.x],
          { ...CLAMP_OPTS, easing: ease }
        );

  const camY =
    stepIndex === 0
      ? currTarget.y
      : interpolate(
          frame,
          [currentBounds.start, transitionEnd],
          [prevTarget.y, currTarget.y],
          { ...CLAMP_OPTS, easing: ease }
        );

  // Zoom interpolation (leads pan by 25%)
  const zoomTransitionEnd = Math.min(
    currentBounds.start + transitionFrames * 0.75,
    currentBounds.end
  );

  const prevZoom = prevStep.zoom;
  const currZoom = currentStep.zoom;

  const currentZoom =
    stepIndex === 0
      ? currZoom
      : interpolate(
          frame,
          [currentBounds.start, zoomTransitionEnd],
          [prevZoom, currZoom],
          { ...CLAMP_OPTS, easing: zoom }
        );

  // ── Shake ──────────────────────────────────────────────────────────
  const shakeIntensity = currentStep.shake || 0;
  const shakeOffset = deterministicShake(frame, shakeIntensity);

  // ── Transform ──────────────────────────────────────────────────────
  const translateX = canvasWidth / 2 - camX * currentZoom + shakeOffset.x;
  const translateY = canvasHeight / 2 - (camY + verticalBias) * currentZoom + shakeOffset.y;

  // ── Focus state ────────────────────────────────────────────────────
  const currentFocus = resolveFocus(currentStep);
  const prevFocus = resolveFocus(prevStep);
  const isOverview = currentFocus.length === 0;

  // Transition blend factor
  const blendFactor =
    stepIndex === 0
      ? 1
      : interpolate(
          frame,
          [currentBounds.start, transitionEnd],
          [0, 1],
          CLAMP_OPTS
        );

  // ── Per-element effects ────────────────────────────────────────────
  const dimAmount = currentStep.dimAmount ?? 0.6;
  const blurAmount = currentStep.blurAmount ?? 1.5;
  const unfocusedScale = currentStep.unfocusedScale ?? 0.88;

  const prevDimAmount = prevStep.dimAmount ?? 0.6;
  const prevBlurAmount = prevStep.blurAmount ?? 1.5;
  const prevUnfocusedScale = prevStep.unfocusedScale ?? 0.88;

  const getElementOpacity = (index: number): number => {
    const prevIsFocused = prevFocus.length === 0 || prevFocus.includes(index);
    const currIsFocused = currentFocus.length === 0 || currentFocus.includes(index);

    const prevOpacity = prevIsFocused ? 1 : 1 - prevDimAmount;
    const currOpacity = currIsFocused ? 1 : 1 - dimAmount;

    return prevOpacity + (currOpacity - prevOpacity) * blendFactor;
  };

  const getElementScale = (index: number): number => {
    const prevIsFocused = prevFocus.length === 0 || prevFocus.includes(index);
    const currIsFocused = currentFocus.length === 0 || currentFocus.includes(index);

    const prevScale = prevIsFocused ? 1.0 : prevUnfocusedScale;
    const currScale = currIsFocused ? 1.0 : unfocusedScale;

    return prevScale + (currScale - prevScale) * blendFactor;
  };

  const getElementBlur = (index: number): number => {
    const prevIsFocused = prevFocus.length === 0 || prevFocus.includes(index);
    const currIsFocused = currentFocus.length === 0 || currentFocus.includes(index);

    const prevBlur = prevIsFocused ? 0 : prevBlurAmount;
    const currBlur = currIsFocused ? 0 : blurAmount;

    return prevBlur + (currBlur - prevBlur) * blendFactor;
  };

  // ── Styles ─────────────────────────────────────────────────────────
  const viewportStyle: React.CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    width: canvasWidth,
    height: canvasHeight,
    overflow: "hidden",
  };

  const contentStyle: React.CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    width: canvasWidth,
    height: canvasHeight,
    transform: `translate(${translateX}px, ${translateY}px) scale(${currentZoom})`,
    transformOrigin: "0 0",
    willChange: "transform",
  };

  return {
    viewportStyle,
    contentStyle,
    focusedIndices: currentFocus,
    isOverview,
    stepIndex,
    stepProgress,
    getElementOpacity,
    getElementScale,
    getElementBlur,
    currentZoom,
    currentLabel: currentStep.label,
    isTransitioning,
    shakeOffset,
    cameraPosition: { x: camX, y: camY },
  };
};
