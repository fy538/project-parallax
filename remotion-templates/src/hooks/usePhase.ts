/**
 * usePhase — declarative multi-phase animation manager.
 *
 * Replaces boilerplate manual frame math with a declarative phase list.
 * Each phase has a name, duration, and optional easing. The hook returns
 * the current phase name, normalized progress (0-1) within it, and the
 * absolute frame offset from phase start.
 *
 * Usage:
 *   const phases = [
 *     { name: "intro",   duration: sec(1) },
 *     { name: "reveal",  duration: sec(2) },
 *     { name: "hold",    duration: sec(3) },
 *     { name: "exit",    duration: sec(0.5) },
 *   ];
 *   const { phase, progress, frameInPhase, phaseIndex, getPhaseStart } = usePhase(phases);
 *
 *   if (phase === "reveal") {
 *     // progress goes 0 → 1 across this phase
 *   }
 *
 * Phases are laid out sequentially from frame 0.
 * If the current frame exceeds all phases, the last phase is returned with progress = 1.
 *
 * For templates that need to know when a specific phase starts (e.g., to
 * schedule a stagger relative to a phase), use `getPhaseStart("reveal")`.
 */

import { useMemo, useCallback } from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { CLAMP } from "../utils/animation";

export interface PhaseDefinition {
  /** Unique phase name (used as discriminant) */
  name: string;
  /** Duration in frames (use sec() to convert from seconds) */
  duration: number;
  /** Optional easing for the progress value. Default: linear */
  easing?: (t: number) => number;
}

export interface PhaseState {
  /** Name of the current phase */
  phase: string;
  /** Index of the current phase (0-based) */
  phaseIndex: number;
  /** Normalized progress within the current phase (0 → 1, optionally eased) */
  progress: number;
  /** Raw (uneased) progress within the current phase (0 → 1) */
  rawProgress: number;
  /** Absolute frame offset from the start of the current phase */
  frameInPhase: number;
  /** Absolute start frame of the current phase */
  phaseStart: number;
  /** Get the absolute start frame for any named phase */
  getPhaseStart: (name: string) => number;
  /** Get the absolute end frame for any named phase */
  getPhaseEnd: (name: string) => number;
  /** Check if a named phase is currently active */
  isPhase: (name: string) => boolean;
  /** Check if a named phase has completed */
  isPast: (name: string) => boolean;
  /** Total duration of all phases combined */
  totalDuration: number;
}

/**
 * Declarative phase manager for multi-phase template animations.
 *
 * @param phases - Ordered array of phase definitions
 * @param baseDelay - Optional delay before the first phase starts (in frames). Default: 0
 */
export const usePhase = (
  phases: PhaseDefinition[],
  baseDelay: number = 0
): PhaseState => {
  const frame = useCurrentFrame();
  const adjustedFrame = frame - baseDelay;

  // Build cumulative start frames — memoized since phases don't change between frames.
  // Uses JSON key since phases array is typically recreated each render.
  const phasesKey = phases.map((p) => `${p.name}:${p.duration}`).join("|");
  const { starts, totalDuration } = useMemo(() => {
    const s: number[] = [];
    let cumulative = 0;
    for (const p of phases) {
      s.push(cumulative);
      cumulative += p.duration;
    }
    return { starts: s, totalDuration: cumulative };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phasesKey]);

  // Find current phase
  let idx = phases.length - 1; // default to last
  for (let i = 0; i < phases.length; i++) {
    if (adjustedFrame < starts[i] + phases[i].duration) {
      idx = i;
      break;
    }
  }

  const currentPhase = phases[idx];
  const phaseStart = starts[idx] + baseDelay;
  const frameInPhase = Math.max(0, adjustedFrame - starts[idx]);
  const rawProgress = currentPhase.duration > 0
    ? interpolate(adjustedFrame, [starts[idx], starts[idx] + currentPhase.duration], [0, 1], CLAMP)
    : 1;
  const progress = currentPhase.easing ? currentPhase.easing(rawProgress) : rawProgress;

  // Lookup helpers — memoized with stable references
  const getPhaseStart = useCallback((name: string): number => {
    const i = phases.findIndex((p) => p.name === name);
    return i >= 0 ? starts[i] + baseDelay : 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phasesKey, baseDelay]);

  const getPhaseEnd = useCallback((name: string): number => {
    const i = phases.findIndex((p) => p.name === name);
    return i >= 0 ? starts[i] + phases[i].duration + baseDelay : 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phasesKey, baseDelay]);

  // These depend on current frame state, so they can't be memoized further
  const isPhase = (name: string): boolean => currentPhase.name === name;

  const isPast = (name: string): boolean => {
    const i = phases.findIndex((p) => p.name === name);
    return i >= 0 ? idx > i || (idx === i && rawProgress >= 1) : false;
  };

  return {
    phase: currentPhase.name,
    phaseIndex: idx,
    progress,
    rawProgress,
    frameInPhase,
    phaseStart,
    getPhaseStart,
    getPhaseEnd,
    isPhase,
    isPast,
    totalDuration: totalDuration + baseDelay,
  };
};
