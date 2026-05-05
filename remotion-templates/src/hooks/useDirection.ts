/**
 * useDirection — reads the `_direction` block from template data JSON
 * and returns resolved values for Background, useCompositionAnimation,
 * and other consumers.
 *
 * This is the bridge between the directing language (DIRECTING_LANGUAGE.md)
 * and the Remotion rendering system. Templates call this hook to get
 * atmosphere, drift, and hold overrides without knowing about _direction.
 *
 * Usage:
 *   const direction = useDirection(data._direction);
 *   <Background atmosphere={direction.atmosphere} atmosphereIntensity={direction.atmosphereIntensity}>
 *   const { style } = useCompositionAnimation(direction.driftOptions);
 *
 * If no _direction block exists, all values fall back to undefined
 * (letting existing defaults take over). Fully backward compatible.
 */

import type { CompositionAnimationOptions } from "./useCompositionAnimation";

// ── Types ──────────────────────────────────────────────────────────────

type AtmosphereDensity = "none" | "subtle" | "normal" | "dense";
type DriftPreset = "none" | "slow" | "normal";

/** Resolved sync point from Whisper alignment */
export interface DirectionSyncPoint {
  word: string;
  timeSec: number;
  frame: number;
  confidence?: number;
}

export interface DirectionBlock {
  // Camera (handled by individual templates, not this hook)
  cameraPath?: unknown[];
  cameraNote?: string;
  /** Force proportional camera path mode */
  proportional?: boolean;
  /** Resolved sync points (populated by Whisper mode in generate_manifest.py) */
  syncPoints?: DirectionSyncPoint[];

  // Reveal (handled by individual templates)
  revealMode?: string;
  staggerMs?: number;
  revealEasing?: string;
  highlightIndex?: number;
  spotlightSequence?: unknown[];
  progressive?: boolean;

  // Hold
  holdAfter?: number;
  holdBehavior?: "breathe" | "land" | "linger";
  preDelay?: number;
  narrationGate?: { word: string };

  // Cut (handled by assembly manifest / FullEpisode)
  transitionOut?: string;
  washColor?: string;
  transitionDuration?: number;

  // Mood
  atmosphere?: AtmosphereDensity;
  ambientParticles?: number;
  driftPreset?: DriftPreset;
  globalDim?: number;
  backgroundTint?: string;

  // Pace (from PACE: annotations — controls animation speed)
  paceProfile?: PaceProfile;
}

type PaceProfile = "urgent" | "analytical" | "breathing";

export interface DirectionResult {
  /** Atmosphere density for Background component */
  atmosphere: AtmosphereDensity | undefined;
  /** Atmosphere intensity multiplier (derived from ambientParticles) */
  atmosphereIntensity: number | undefined;
  /** Background tint color */
  backgroundTint: string | undefined;
  /** Global dim amount (0-1) for non-focus elements */
  globalDim: number | undefined;
  /** Options to spread into useCompositionAnimation */
  driftOptions: Partial<CompositionAnimationOptions>;
  /** Hold duration in seconds (extra time after narration) */
  holdAfter: number | undefined;
  /** Pre-delay in seconds (delay before reveal animation starts) */
  preDelay: number | undefined;
  /** Whether proportional camera paths are requested */
  proportional: boolean | undefined;
  /** Resolved sync points for camera/reveal anchoring */
  syncPoints: DirectionSyncPoint[] | undefined;
  /** Pace profile for this composition */
  paceProfile: PaceProfile | undefined;
  /**
   * Timing scale for entrance/reveal animations.
   * urgent=0.7 (faster animations), analytical=1.0, breathing=1.4 (slower, more deliberate).
   * Templates can multiply their animation durations by this value.
   */
  paceTimingScale: number;
  /**
   * Stagger scale for sequential element reveals.
   * urgent=0.6 (tighter stagger), analytical=1.0, breathing=1.5 (more spread out).
   */
  paceStaggerScale: number;
  /** Whether any direction was specified */
  hasDirection: boolean;
}

// ── Drift preset → useCompositionAnimation options ──────────────────

const DRIFT_PRESETS: Record<DriftPreset, Partial<CompositionAnimationOptions>> = {
  none: { noDrift: true },
  slow: { maxScale: 1.03, maxPanX: 8, maxPanY: 4, maxRotation: 0.15 },
  normal: { maxScale: 1.06, maxPanX: 18, maxPanY: 8, maxRotation: 0.3 },
};

// ── Pace → timing scale factors ────────────────────────────────────
// These control how fast/slow entrance animations and staggers play.
// Templates multiply their animation durations by timingScale and
// their stagger delays by staggerScale.

const PACE_TIMING: Record<PaceProfile, { timing: number; stagger: number }> = {
  urgent: { timing: 0.7, stagger: 0.6 },      // faster reveals, tighter staggers
  analytical: { timing: 1.0, stagger: 1.0 },  // default
  breathing: { timing: 1.4, stagger: 1.5 },   // slower, more deliberate
};

// ── Hook ────────────────────────────────────────────────────────────

export const useDirection = (
  direction?: DirectionBlock | null
): DirectionResult => {
  if (!direction) {
    return {
      atmosphere: undefined,
      atmosphereIntensity: undefined,
      backgroundTint: undefined,
      globalDim: undefined,
      driftOptions: {},
      holdAfter: undefined,
      preDelay: undefined,
      proportional: undefined,
      syncPoints: undefined,
      paceProfile: undefined,
      paceTimingScale: 1.0,
      paceStaggerScale: 1.0,
      hasDirection: false,
    };
  }

  // Convert ambientParticles count to intensity multiplier
  // Default particle count at normal density is ~30 (from Background ATMOSPHERE_CONFIG)
  // so ambientParticles:15 → 0.5 intensity, 45 → 1.5 intensity
  const atmosphereIntensity = direction.ambientParticles
    ? direction.ambientParticles / 30
    : undefined;

  // Resolve drift preset to animation options
  const driftOptions = direction.driftPreset
    ? DRIFT_PRESETS[direction.driftPreset] || {}
    : {};

  // Resolve pace profile to timing scales
  const pace = direction.paceProfile || "analytical";
  const paceScales = PACE_TIMING[pace] || PACE_TIMING.analytical;

  return {
    atmosphere: direction.atmosphere,
    atmosphereIntensity,
    backgroundTint: direction.backgroundTint ?? undefined,
    globalDim: direction.globalDim,
    driftOptions,
    holdAfter: direction.holdAfter,
    preDelay: direction.preDelay,
    proportional: direction.proportional,
    syncPoints: direction.syncPoints,
    paceProfile: direction.paceProfile,
    paceTimingScale: paceScales.timing,
    paceStaggerScale: paceScales.stagger,
    hasDirection: true,
  };
};
