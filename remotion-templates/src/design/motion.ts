/**
 * Motion Identity — substrate-motion presets for Background.
 *
 * Three substrate-motion interventions can be applied to any composition:
 *   - grain      : animated film-grain noise re-seeded per frame
 *   - atmosphere : slow-drifting low-opacity warm-gradient clouds (sfumato)
 *   - wobble     : sub-pixel "organic camera" jitter on substrate layers only
 *
 * Each motion identity is a preset combining these three at calibrated
 * intensities. Per the research synthesis (Lasseter → Apple HIG → IBM
 * Design → Atlantic style guide): substrate motion is allowed because it
 * signals "photographic frame, not slide." Element motion (chart bars
 * pulsing, particles inside ribbons) is the YouTube-essayist trap and
 * is explicitly excluded from this system.
 *
 * Wobble applies to substrate layers ONLY — never to type or chart-internal
 * elements. Eye reads jitter on numbers as data instability.
 *
 * Codified in VISUAL_LANGUAGE.md → Motion Identity (substrate-vs-element).
 */

export type MotionIdentity = "still" | "briefing" | "documentary";

export interface MotionIdentityConfig {
  /** Animated film-grain noise. Always re-seeded per frame when enabled. */
  grain: {
    enabled: boolean;
    /** Light-mode opacity (multiply blend). Recommended 0.04–0.10. */
    opacityLight: number;
    /** Dark-mode opacity (overlay blend). Recommended 0.08–0.14. */
    opacityDark: number;
  };
  /** Slow-drifting low-opacity warm-gradient clouds behind content. */
  atmosphere: {
    enabled: boolean;
    /** Intensity scalar — multiplies cloud opacity. 0.5 = restrained, 1.0 = standard, 1.5 = heavy. */
    intensityScale: number;
  };
  /** Sub-pixel substrate jitter — Westbrook's "breathing the frame." */
  wobble: {
    enabled: boolean;
    /** Peak amplitude in pixels. 0.3–0.5 is the editorial sweet spot.
     *  Above ~1.0 reads as Bourne-knockoff handheld; below ~0.2 imperceptible. */
    amplitude: number;
  };
}

/**
 * The three named identities.
 *
 * `briefing` is the channel default — substrate is alive but restrained.
 * `still` opts out of substrate motion entirely (technical diagrams, archive
 * frames, or moments that need to feel paused).
 * `documentary` leans into a heavier "found footage" register — more grain,
 * more wobble, slightly muted atmosphere so the documentary feel doesn't
 * fight with the grain.
 */
export const motionIdentities: Record<MotionIdentity, MotionIdentityConfig> = {
  briefing: {
    grain: { enabled: true, opacityLight: 0.06, opacityDark: 0.10 },
    atmosphere: { enabled: true, intensityScale: 1.0 },
    wobble: { enabled: true, amplitude: 0.4 },
  },
  still: {
    grain: { enabled: false, opacityLight: 0, opacityDark: 0 },
    atmosphere: { enabled: false, intensityScale: 0 },
    wobble: { enabled: false, amplitude: 0 },
  },
  documentary: {
    grain: { enabled: true, opacityLight: 0.10, opacityDark: 0.14 },
    atmosphere: { enabled: true, intensityScale: 0.7 },
    wobble: { enabled: true, amplitude: 0.6 },
  },
};

/** The channel-wide default. Episodes and templates can override per Background. */
export const DEFAULT_MOTION_IDENTITY: MotionIdentity = "briefing";

/**
 * Compute substrate wobble offset for the current frame.
 *
 * Two sine waves at different frequencies create smooth pseudo-Perlin
 * motion that doesn't repeat visibly within a typical composition.
 * Returns sub-pixel `{ x, y }` offset to apply as translate on substrate
 * layers (NOT content).
 */
export const computeWobble = (
  frame: number,
  amplitude: number
): { x: number; y: number } => {
  if (amplitude <= 0) return { x: 0, y: 0 };
  // Frequencies chosen so the visible cycle is ~12-15s; coprime so the
  // X and Y components don't visibly sync.
  const x =
    Math.sin(frame * 0.071) * amplitude * 0.7 +
    Math.sin(frame * 0.137) * amplitude * 0.3;
  const y =
    Math.cos(frame * 0.083) * amplitude * 0.7 +
    Math.cos(frame * 0.119) * amplitude * 0.3;
  return { x, y };
};
