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
import type { TextAnimationTechnique } from "./directionBlock.schema";

// ── Types ──────────────────────────────────────────────────────────────

type AtmosphereDensity = "none" | "subtle" | "normal" | "dense";
/**
 * Drift presets — named motion registers. Each maps to a set of
 * `CompositionAnimationOptions` (mode + max envelope).
 *
 * Default register (when `driftPreset` is omitted): `motionBudget` from
 * theme.ts, which since May 2026 is the editorial conservative setting
 * (scale 1.02, no pan, no rotation). Templates that want explicit life or
 * documentary-cinematic motion opt in below.
 *
 *   - `none`         No drift. For maps, interactive comps, catalog/showreel.
 *   - `editorial`    Explicit editorial register. Same values as the default.
 *   - `slow`         Restrained directional drift. Kept for back-compat.
 *   - `normal`       Mid-strength directional drift. Kept for back-compat.
 *   - `documentary`  Full Ken Burns: scale 1.06, pan 18/8, rotation 0.3°.
 *                    Use for atmospheric / photo-driven segments, NOT charts.
 *   - `breathing`    Sinusoidal scale oscillation 1.0 ↔ 1.008 on an 8s cycle.
 *                    Frame feels alive without slipping. For held stats /
 *                    quiet panels with long durations.
 *   - `settle`       One-time scale settle during entrance (1.0 → 1.025),
 *                    then HOLD. Camera lands and stops. For frames that
 *                    establish then hold their composition.
 *   - `sway`         Bidirectional sinusoidal pan (±3px X, ±2px Y) on slow
 *                    cycles. Net displacement zero — atmospheric life
 *                    without directional slip.
 */
export type DriftPreset =
  | "none"
  | "editorial"
  | "slow"
  | "normal"
  | "documentary"
  | "breathing"
  | "settle"
  | "sway";

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
  /**
   * Injected by FullEpisode from manifest musicBed mood — not authored in data JSON.
   * Scales resolved atmosphere intensity together with ambientParticles.
   */
  musicBedAtmosphereMultiplier?: number;
  driftPreset?: DriftPreset;
  globalDim?: number;
  backgroundTint?: string;

  // Pace (from PACE: annotations — controls animation speed)
  paceProfile?: PaceProfile;

  /**
   * Text-animation register for text-bearing templates (Phase 1
   * integration, May 2026). See `project/TEXT_ANIMATION_REGISTER.md` for
   * the technique catalog and editorial decision rules. When set,
   * templates dispatch to the matching atomic or composite component.
   * When unset, templates use their existing default animations.
   */
  textAnimation?: TextAnimationTechnique;
  /**
   * Cross-episode concept callback flag. When true and the template
   * renders a known concept term, the term receives a ConceptCallback
   * pulse on arrival. Visual-spec sets this based on
   * `data/concepts.json` appearances[] lookup.
   */
  isCallback?: boolean;

  /**
   * Forward-compat escape hatch. The corresponding Zod schema
   * (`DirectionBlockSchema` in `./directionBlock.schema`) uses
   * `.passthrough()` so experimental direction fields not yet typed here
   * round-trip cleanly through validation. The index signature keeps the
   * TS shape compatible with `z.output<typeof DirectionBlockSchema>`.
   */
  [k: string]: unknown;
}

/** Re-export so consumers don't need to import from two locations. */
export type { TextAnimationTechnique };

type PaceProfile = "urgent" | "analytical" | "breathing";

export interface DirectionResult {
  /** Atmosphere density for Background component */
  atmosphere: AtmosphereDensity | undefined;
  /** Atmosphere intensity multiplier (ambientParticles / 30 × musicBed multiplier) */
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
  // ── Off ─────────────────────────────────────────────────────────────
  none: { noDrift: true },

  // ── Editorial register (the new conservative default) ──────────────
  // Same envelope as motionBudget — explicit opt-in for readability in
  // data files that want to declare their motion intent.
  editorial: {
    mode: "linear",
    maxScale: 1.02,
    maxPanX: 0,
    maxPanY: 0,
    maxRotation: 0,
  },

  // ── Back-compat presets — values locked by useDirection.test.ts ────
  // These predate the editorial-register revision and stay at their
  // original envelopes so existing episodes render identically. Note
  // rotation is preserved here for back-compat; new authors should
  // prefer `editorial` (no rotation) for charts.
  slow: { mode: "linear", maxScale: 1.03, maxPanX: 8, maxPanY: 4, maxRotation: 0.15 },
  normal: { mode: "linear", maxScale: 1.06, maxPanX: 18, maxPanY: 8, maxRotation: 0.3 },

  // ── Documentary (the full Ken Burns, explicit) ─────────────────────
  // For atmospheric segments, archival photo plates, paper-textured
  // title cards. NOT for charts — the rotation tilts axis baselines.
  documentary: {
    mode: "linear",
    maxScale: 1.06,
    maxPanX: 18,
    maxPanY: 8,
    maxRotation: 0.3,
  },

  // ── Alternative motion modes (back-of-pocket) ──────────────────────
  // Breathing: sinusoidal scale oscillation, no pan, no rotation. The
  // chart feels alive but doesn't move anywhere. For long-held stat
  // reveals and quiet establishing frames.
  breathing: {
    mode: "breathing",
    maxScale: 1.008,
    maxPanX: 0,
    maxPanY: 0,
    maxRotation: 0,
  },

  // Settle: one-time scale settle during the first 0.6s of the segment,
  // then HOLD. Camera lands and stops. For frames that should establish
  // their composition cleanly then sit still.
  settle: {
    mode: "settle",
    maxScale: 1.025,
    maxPanX: 0,
    maxPanY: 0,
    maxRotation: 0,
  },

  // Sway: bidirectional sinusoidal pan on slow cycles (6s X, 9s Y) so
  // the motion doesn't trace a perfect ellipse. Net displacement zero.
  // For atmospheric segments where you want subtle life without slip
  // toward the viewport edge. Use sparingly.
  sway: {
    mode: "sway",
    maxScale: 1.0,
    maxPanX: 6,
    maxPanY: 4,
    maxRotation: 0,
  },
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

// ── Pure resolver (testable without React) ──────────────────────────────────

/**
 * Resolve a DirectionBlock to a DirectionResult. Pure function — no React
 * hook calls, no state, no side effects. The hook below is a thin alias
 * that satisfies the naming convention; templates can import either, but
 * `resolveDirection` is the entry point for tests + non-React consumers
 * (manifest validators, schema migrations, CLI tools).
 *
 * Behavior is fully backward-compatible: when `direction` is undefined or
 * null AND no `templateDefaultDriftPreset` is provided, returns the
 * no-direction defaults (paceTimingScale=1.0, paceStaggerScale=1.0, all
 * other fields undefined). When `direction` is present, derives
 * atmosphereIntensity from ambientParticles (including explicit 0) and
 * optional musicBedAtmosphereMultiplier, resolves driftPreset to animation
 * options, and resolves paceProfile to timing/stagger scales. Unknown
 * preset/profile values fall back to sensible defaults (empty drift options,
 * analytical pace).
 *
 * The optional `templateDefaultDriftPreset` second argument lets each
 * template declare its hold-motion register (HOLD_MOTION_REGISTER.md, D20).
 * Cascade: `direction.driftPreset` → `templateDefaultDriftPreset` → empty.
 * Per-segment script overrides win over template defaults; template defaults
 * win over the global no-preset fallback. See `project/HOLD_MOTION_REGISTER.md`
 * for the per-template assignment table.
 */
export function resolveDirection(
  direction?: DirectionBlock | null,
  templateDefaultDriftPreset?: DriftPreset,
): DirectionResult {
  if (!direction) {
    // Template default still applies even when no direction block is provided —
    // PhotoMontage / ImageComposite / AtlasPlate may render without an
    // explicit _direction in the data, but still want their register's
    // hold-motion treatment.
    const fallbackDriftOptions = templateDefaultDriftPreset
      ? DRIFT_PRESETS[templateDefaultDriftPreset] || {}
      : {};
    return {
      atmosphere: undefined,
      atmosphereIntensity: undefined,
      backgroundTint: undefined,
      globalDim: undefined,
      driftOptions: fallbackDriftOptions,
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

  // Convert ambientParticles count to base intensity; scale by music-bed mood when injected.
  // Use typeof so ambientParticles:0 is explicit "suppress particles" (base 0), not "omit".
  // Default particle count at normal density is ~30 (from Background ATMOSPHERE_CONFIG)
  // so ambientParticles:15 → 0.5 intensity, 45 → 1.5 intensity
  const baseIntensity =
    typeof direction.ambientParticles === "number"
      ? direction.ambientParticles / 30
      : undefined;
  const moodMult = direction.musicBedAtmosphereMultiplier ?? 1;
  const atmosphereIntensity =
    moodMult !== 1 || baseIntensity !== undefined
      ? (baseIntensity ?? 1.0) * moodMult
      : undefined;

  // Resolve drift preset to animation options. Cascade:
  //   1. direction.driftPreset (per-segment data-file or DIR: drift(…) override)
  //   2. templateDefaultDriftPreset (the template's HOLD_MOTION_REGISTER assignment)
  //   3. empty options (falls through to useCompositionAnimation's motionBudget default)
  const effectiveDriftPreset = direction.driftPreset ?? templateDefaultDriftPreset;
  const driftOptions = effectiveDriftPreset
    ? DRIFT_PRESETS[effectiveDriftPreset] || {}
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
}

// ── Hook ────────────────────────────────────────────────────────────────────

/**
 * React-convention alias for `resolveDirection`. Templates call this from
 * their render bodies to consume the `_direction` block from data files.
 * Has no React-specific behavior (no useState, no useMemo, no useEffect)
 * — it's a pure resolver named `use*` for ergonomics inside templates.
 */
export const useDirection = (
  direction?: DirectionBlock | null,
  templateDefaultDriftPreset?: DriftPreset,
): DirectionResult => resolveDirection(direction, templateDefaultDriftPreset);
