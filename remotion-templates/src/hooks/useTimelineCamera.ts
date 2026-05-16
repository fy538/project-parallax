/**
 * useTimelineCamera — horizontal camera tracking for timeline visualizations.
 *
 * Simpler than useTreeCamera (1D movement along x-axis only), but with the same
 * cinematic principles: eased camera moves, zoom-before-pan offset, focus isolation
 * via dimming + blur, and scale hierarchy for importance.
 *
 * The camera tracks horizontally through a wide canvas where events are distributed
 * along the x-axis. Each camera step focuses on an event index (or "pullback" for
 * full-timeline view). Non-focused events are dimmed and optionally blurred.
 *
 * Usage:
 *   const camera = useTimelineCamera({
 *     eventPositions: [200, 500, 800, 1100, 1400],
 *     cameraPath: [
 *       { focus: 0, zoom: 1.4, duration: 2 },
 *       { focus: 1, zoom: 1.4, duration: 2.5 },
 *       { focus: "pullback", zoom: 0.7, duration: 3 },
 *     ],
 *     canvasWidth: 1920,
 *     canvasHeight: 1080,
 *     totalTimelineWidth: 3000,
 *   });
 *
 *   <div style={camera.viewportStyle}>
 *     <div style={camera.contentStyle}>
 *       {events along x-axis...}
 *     </div>
 *   </div>
 */

import { useMemo } from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { sec } from "../design/theme";
import { motionEasings } from "../utils/stepFramework";
import { useStepFramework } from "./useStepFramework";
import type { TimelineCameraStep } from "../templates/HorizontalTimeline/types";

// Destructure at file top so call sites read as `track` / `snap` / `zoom`.
const { track, snap, zoom } = motionEasings;

// ── Types ──────────────────────────────────────────────────────────────────

export interface UseTimelineCameraOptions {
  /** X-positions (center) of each event on the canvas */
  eventPositions: number[];
  /** Camera keyframe sequence */
  cameraPath: TimelineCameraStep[];
  /** Canvas dimensions (Remotion composition size) */
  canvasWidth: number;
  canvasHeight: number;
  /** Total width of the timeline content canvas */
  totalTimelineWidth: number;
  /** Y-center of the timeline spine (for vertical centering) */
  spineY?: number;
  /** Transition duration between steps in seconds (default: 0.8) */
  transitionSec?: number;
}

export interface TimelineCameraState {
  /** Style for the outer viewport (overflow:hidden, full canvas) */
  viewportStyle: React.CSSProperties;
  /** Style for the inner content container (animated transform) */
  contentStyle: React.CSSProperties;
  /** Current focus event index (or -1 for pullback) */
  focusIndex: number;
  /** Current camera step index */
  stepIndex: number;
  /** Progress within current step (0–1) */
  stepProgress: number;
  /** Get dimming factor for an event (0 = fully visible, 1 = fully dimmed) */
  getEventDim: (eventIndex: number) => number;
  /** Get scale multiplier for an event (focused = 1.0+, unfocused = 0.85-0.95) */
  getEventScale: (eventIndex: number) => number;
  /** Get blur amount for an event in px (focused = 0, unfocused = 1-2px) */
  getEventBlur: (eventIndex: number) => number;
  /** Current camera zoom level */
  currentZoom: number;
  /** Current step's label (if any) */
  currentLabel: string | undefined;
  /** Whether camera is currently in transition between steps */
  isTransitioning: boolean;
}

// ── Easing presets — imported from stepFramework ────────────────────────────
// `track` / `snap` / `zoom` destructured from `motionEasings` above —
// defined once in stepFramework.ts so calibration changes propagate.

const CLAMP_OPTS = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

// ── Default camera path generator ──────────────────────────────────────────

/**
 * Auto-generate a camera path that visits each event in sequence
 * with a final pullback to show the full timeline.
 */
export function generateDefaultTimelineCameraPath(
  eventCount: number,
  options?: {
    secondsPerEvent?: number;
    pullbackDuration?: number;
    zoomLevel?: number;
    pullbackZoom?: number;
  }
): TimelineCameraStep[] {
  const perEvent = options?.secondsPerEvent ?? 2.5;
  const pullbackDur = options?.pullbackDuration ?? 2;
  const zoom = options?.zoomLevel ?? 1.4;
  const pullbackZoom = options?.pullbackZoom ?? 0.7;

  const steps: TimelineCameraStep[] = [];

  for (let i = 0; i < eventCount; i++) {
    steps.push({
      focus: i,
      zoom,
      duration: perEvent,
      behavior: "track",
      dimOthers: true,
    });
  }

  // Final pullback
  steps.push({
    focus: "pullback",
    zoom: pullbackZoom,
    duration: pullbackDur,
    behavior: "track",
    dimOthers: false,
  });

  return steps;
}

// ── Hook ───────────────────────────────────────────────────────────────────

export const useTimelineCamera = (
  opts: UseTimelineCameraOptions
): TimelineCameraState => {
  const {
    eventPositions,
    cameraPath,
    canvasWidth,
    canvasHeight,
    totalTimelineWidth,
    spineY = canvasHeight / 2,
    transitionSec = 0.8,
  } = opts;

  const frame = useCurrentFrame();
  const transitionFrames = sec(transitionSec);

  // ── Step framework: boundaries + active index + progress ───────────
  // useStepFramework owns the boundary computation + clamped index/progress.
  // We still call useCurrentFrame above because downstream `interpolate(frame,
  // [...], [...])` calls operate over absolute frame ranges, not progress.
  const durations = useMemo(
    () => cameraPath.map((s) => sec(s.duration)),
    [cameraPath],
  );
  const {
    boundaries: stepBoundaries,
    index: stepIndex,
    boundary: currentBounds,
    progress: stepProgress,
  } = useStepFramework(durations);

  const currentStep = cameraPath[stepIndex];

  // ── Compute target camera position ─────────────────────────────────
  const getTargetX = (step: TimelineCameraStep): number => {
    if (step.focus === "pullback") {
      return totalTimelineWidth / 2;
    }
    return eventPositions[step.focus] ?? totalTimelineWidth / 2;
  };

  const getTargetY = (): number => spineY;

  // Previous step for interpolation
  const prevStep = stepIndex > 0 ? cameraPath[stepIndex - 1] : currentStep;
  const prevBounds =
    stepIndex > 0 ? stepBoundaries[stepIndex - 1] : currentBounds;

  // ── Interpolate camera position ────────────────────────────────────
  // Transition happens at the START of each new step
  const transitionEnd = Math.min(
    currentBounds.start + transitionFrames,
    currentBounds.end
  );

  const isTransitioning =
    frame >= currentBounds.start && frame < transitionEnd && stepIndex > 0;

  // Choose easing based on behavior
  const ease =
    currentStep.behavior === "snap" ? snap : track;

  // Camera X: interpolate from previous target to current target
  const prevTargetX = getTargetX(prevStep);
  const currTargetX = getTargetX(currentStep);

  const camX =
    stepIndex === 0
      ? currTargetX
      : interpolate(
          frame,
          [currentBounds.start, transitionEnd],
          [prevTargetX, currTargetX],
          { ...CLAMP_OPTS, easing: ease }
        );

  const camY = getTargetY();

  // Camera zoom: interpolate with slight lead (zoom settles before pan)
  const prevZoom = prevStep.zoom;
  const currZoom = currentStep.zoom;

  const zoomTransitionEnd = Math.min(
    currentBounds.start + transitionFrames * 0.75,
    currentBounds.end
  );

  const currentZoom =
    stepIndex === 0
      ? currZoom
      : interpolate(
          frame,
          [currentBounds.start, zoomTransitionEnd],
          [prevZoom, currZoom],
          { ...CLAMP_OPTS, easing: zoom }
        );

  // ── Compute transform ──────────────────────────────────────────────
  // Transform moves the content so camX,camY is at viewport center
  const translateX = canvasWidth / 2 - camX * currentZoom;
  const translateY = canvasHeight / 2 - camY * currentZoom;

  // ── Focus state ────────────────────────────────────────────────────
  const focusIndex =
    currentStep.focus === "pullback" ? -1 : currentStep.focus;
  const shouldDim = currentStep.dimOthers !== false;

  // Precompute dim/scale for transition blending
  const prevFocusIndex =
    prevStep.focus === "pullback" ? -1 : prevStep.focus;
  const prevShouldDim = prevStep.dimOthers !== false;

  // Transition blend factor (0 = fully previous, 1 = fully current)
  const blendFactor =
    stepIndex === 0
      ? 1
      : interpolate(
          frame,
          [currentBounds.start, transitionEnd],
          [0, 1],
          CLAMP_OPTS
        );

  // ── Per-event effects ──────────────────────────────────────────────
  const getEventDim = (eventIndex: number): number => {
    // Dim factor for previous step
    const prevDim = prevShouldDim
      ? prevFocusIndex === eventIndex
        ? 0
        : 0.6
      : 0;

    // Dim factor for current step
    const currDim = shouldDim
      ? focusIndex === eventIndex || focusIndex === -1
        ? 0
        : 0.6
      : 0;

    // Blend between prev and current during transition
    return prevDim + (currDim - prevDim) * blendFactor;
  };

  const getEventScale = (eventIndex: number): number => {
    // Scale based on focus state
    const isFocused = focusIndex === eventIndex || focusIndex === -1;
    const wasFocused = prevFocusIndex === eventIndex || prevFocusIndex === -1;

    const prevScale = wasFocused ? 1.0 : 0.88;
    const currScale = isFocused ? 1.0 : 0.88;

    return prevScale + (currScale - prevScale) * blendFactor;
  };

  const getEventBlur = (eventIndex: number): number => {
    // Blur non-focused events for depth-of-field effect
    const isFocused = focusIndex === eventIndex || focusIndex === -1;
    const wasFocused = prevFocusIndex === eventIndex || prevFocusIndex === -1;

    const prevBlur = wasFocused ? 0 : 1.5;
    const currBlur = isFocused ? 0 : 1.5;

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
    width: totalTimelineWidth,
    height: canvasHeight,
    transform: `translate(${translateX}px, ${translateY}px) scale(${currentZoom})`,
    transformOrigin: "0 0",
    willChange: "transform",
  };

  return {
    viewportStyle,
    contentStyle,
    focusIndex,
    stepIndex,
    stepProgress,
    getEventDim,
    getEventScale,
    getEventBlur,
    currentZoom,
    currentLabel: currentStep.label,
    isTransitioning,
  };
};
