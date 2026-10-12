/**
 * resolveSoundscape — per-segment Soundscape cascade resolver.
 *
 * Given a segment's optional override, its backdrop's recommended register,
 * its template component name, and the episode-level default, produce a
 * fully-resolved `{ ambient, transitionIn?, transitionOut?, textures? }`
 * record ready to pass to the audio primitives.
 *
 * Cascade priority (most-specific wins, per-field independently):
 *
 *   1. Segment override        — `segment.template.soundscape.ambient` etc.
 *   2. Backdrop hint           — `backdrop.recommendedSoundscape` (ambient only)
 *   3. Template-derived        — `TEMPLATE_SOUNDSCAPE_DEFAULTS[componentName]`
 *                                (ambient only)
 *   4. Episode default         — `manifest.soundscape.<field>`
 *   5. Channel default         — `DEFAULT_REGISTER` ("editorial-print")
 *
 * Transition SFX (`transitionIn`, `transitionOut`) and texture hits (`textures`)
 * only have layers 1 and 4 — they're authored explicitly per-segment or
 * episode-wide; no template-derived defaults (the transition-grammar already
 * resolves transition type per-segment, and the audio cue follows from the
 * transition type via a separate map in `transitionAudio.ts` if needed).
 *
 * Mirrors the FilmOverlay resolver pattern exactly so cascade semantics are
 * consistent across the visual + audio register systems.
 *
 * Doctrine: project/SOUNDSCAPE_REGISTER.md
 */

import {
  DEFAULT_REGISTER,
  TEMPLATE_SOUNDSCAPE_DEFAULTS,
  isSoundscapeRegister,
  type SoundscapeRegister,
} from "../design/soundscape";

// ── Config shapes ──────────────────────────────────────────────────────────

/**
 * Soundscape config payload — same shape at episode and segment levels.
 *
 * SINGLE TS SOURCE OF TRUTH for the soundscape shape across the codebase.
 * Consumers should import this interface from here rather than redeclaring.
 *
 * DATA-SIDE SIBLING: `$defs/soundscapeConfig` in
 * `data/assembly-manifest.schema.json` (referenced by both
 * `manifest.soundscape` and `segment.template.soundscape` via `$ref`).
 * The two definitions agree by hand — when adding a field here, mirror it
 * there.
 */
export interface SoundscapeConfig {
  /** The ambient bed register — the load-bearing field. */
  ambient?: SoundscapeRegister;
  /**
   * Transition SFX cue name played AT the start of this segment.
   * Names come from AUDIO_DESIGN.md "Transition SFX" palette
   * (e.g., "beat-transition", "section-open", "quote-bell").
   * Optional — most segments use the default beat-transition or no SFX
   * (cut transitions are silent).
   */
  transitionIn?: string;
  /**
   * Transition SFX cue name played at the END of this segment. Rare —
   * usually transitionIn on the next segment carries the boundary.
   */
  transitionOut?: string;
  /**
   * One-shot texture hits scheduled within this segment. Each entry:
   *   • `type` — name from AUDIO_DESIGN.md "Texture palette"
   *              (e.g., "typewriter-clack", "page-turn", "stamp-impact")
   *   • `atSec` — frame time within the segment when the hit fires
   */
  textures?: ReadonlyArray<{ type: string; atSec: number }>;
}

/** Backdrop fields the resolver needs (looser than full BackdropEntry). */
export interface BackdropSoundscapeHint {
  recommendedSoundscape?: SoundscapeRegister;
}

/** Fully-resolved soundscape parameters ready to drive audio components. */
export interface ResolvedSoundscape {
  ambient: SoundscapeRegister;
  transitionIn?: string;
  transitionOut?: string;
  textures: ReadonlyArray<{ type: string; atSec: number }>;
}

// ── Resolver ───────────────────────────────────────────────────────────────

/**
 * Resolve the effective soundscape parameters for a single segment.
 *
 * @param segment        Segment-level config (`segment.template.soundscape`).
 *                       Pass `null`/`undefined` if the segment has no override.
 * @param backdrop       Backdrop entry whose `recommendedSoundscape` may
 *                       drive level 2, or `null` if no backdrop.
 * @param componentName  Remotion template component name (e.g. "DataChart")
 *                       for level-3 fallback via TEMPLATE_SOUNDSCAPE_DEFAULTS.
 *                       Pass `null` to skip — used by background segments
 *                       without a template component.
 * @param episode        Episode-level config (`manifest.soundscape`). The
 *                       caller is responsible for the gating decision —
 *                       when this is null/undefined, the caller may choose
 *                       to skip invoking the resolver entirely (so the
 *                       cascade stays dormant for episodes that opt out of
 *                       soundscape entirely). Passed here only for level-4
 *                       fallback of individual fields.
 */
export function resolveSoundscape(
  segment: SoundscapeConfig | null | undefined,
  backdrop: BackdropSoundscapeHint | null | undefined,
  componentName: string | null | undefined,
  episode: SoundscapeConfig | null | undefined,
): ResolvedSoundscape {
  // ── ambient resolves through all 5 levels ───────────────────────────────
  let ambient: SoundscapeRegister | undefined;
  if (segment?.ambient && isSoundscapeRegister(segment.ambient)) {
    ambient = segment.ambient;
  } else if (
    backdrop?.recommendedSoundscape &&
    isSoundscapeRegister(backdrop.recommendedSoundscape)
  ) {
    ambient = backdrop.recommendedSoundscape;
  } else if (
    componentName &&
    isSoundscapeRegister(TEMPLATE_SOUNDSCAPE_DEFAULTS[componentName])
  ) {
    ambient = TEMPLATE_SOUNDSCAPE_DEFAULTS[componentName] as SoundscapeRegister;
  } else if (episode?.ambient && isSoundscapeRegister(episode.ambient)) {
    ambient = episode.ambient;
  } else {
    ambient = DEFAULT_REGISTER;
  }

  // ── transitionIn: segment → episode (no derived defaults) ───────────────
  const transitionIn = segment?.transitionIn ?? episode?.transitionIn;
  // ── transitionOut: segment → episode (no derived defaults) ──────────────
  const transitionOut = segment?.transitionOut ?? episode?.transitionOut;
  // ── textures: segment textures OVERRIDE episode textures (no merge —
  // textures are precise per-segment placements and merging would surface
  // duplicate cues at wrong frames). ──────────────────────────────────────
  const textures = segment?.textures ?? episode?.textures ?? [];

  return {
    ambient,
    transitionIn,
    transitionOut,
    textures,
  };
}
