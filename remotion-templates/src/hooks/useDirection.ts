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

export interface DirectionBlock {
  // Camera (handled by individual templates, not this hook)
  cameraPath?: unknown[];
  cameraNote?: string;

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
}

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
  /** Whether any direction was specified */
  hasDirection: boolean;
}

// ── Drift preset → useCompositionAnimation options ──────────────────

const DRIFT_PRESETS: Record<DriftPreset, Partial<CompositionAnimationOptions>> = {
  none: { noDrift: true },
  slow: { maxScale: 1.03, maxPanX: 8, maxPanY: 4, maxRotation: 0.15 },
  normal: { maxScale: 1.06, maxPanX: 18, maxPanY: 8, maxRotation: 0.3 },
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

  return {
    atmosphere: direction.atmosphere,
    atmosphereIntensity,
    backgroundTint: direction.backgroundTint ?? undefined,
    globalDim: direction.globalDim,
    driftOptions,
    holdAfter: direction.holdAfter,
    preDelay: direction.preDelay,
    hasDirection: true,
  };
};
