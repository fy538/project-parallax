/**
 * resolveFilmOverlay — per-segment FilmOverlay cascade resolver.
 *
 * Given a segment's optional override, its backdrop's recommended preset,
 * its template component name, and the episode-level default, produce a
 * fully-resolved `{ preset, effects, intensity }` triple ready to pass
 * to `<FilmOverlay>`.
 *
 * Cascade priority (most-specific wins, per-field independently):
 *
 *   1. Segment override       — `segment.template.filmOverlay.<field>`
 *   2. Backdrop preset        — `backdrop.recommendedPreset` (applies to `preset` only)
 *   3. Template-derived       — `TEMPLATE_PRESET_MAP[componentName]` (applies to `preset` only)
 *   4. Episode default        — `manifest.filmOverlay.<field>`
 *   5. Component default      — `"documentary"`
 *
 * `effects` and `intensity` only have layers 1, 4, and (via preset) the
 * derived defaults from FILM_OVERLAY_PRESETS[resolvedPreset]. Backdrop and
 * template-preset map only influence the `preset` field — they don't carry
 * effects or intensity opinions.
 *
 * The whole resolver is GATED by the caller: if `episodeFilmOverlay` is
 * null/undefined, the cascade is never invoked (per FullEpisode.tsx wiring).
 *
 * Reference: design spec for "per-segment filmOverlay with backdrop-derived
 * preset cascade." See remotion-templates/CLAUDE.md → FilmOverlay cascade.
 */

import {
  FILM_OVERLAY_PRESETS,
  TEMPLATE_PRESET_MAP,
  type FilmOverlayPreset,
} from "../components/FilmOverlayPresets";
import type { FilmOverlayPresetName } from "../components/EditorialSurface";

/**
 * A film-overlay config payload — same shape at episode and segment levels.
 *
 * SINGLE TS SOURCE OF TRUTH for the FilmOverlay shape across the codebase.
 * Consumers: `AssemblyManifest.filmOverlay` and `TemplateInfo.filmOverlay`
 * in `src/templates/Episodes/FullEpisode.tsx` both import this interface
 * (no inline duplication).
 *
 * DATA-SIDE SIBLING: `$defs/filmOverlayConfig` in
 * `data/assembly-manifest.schema.json` (referenced by both `manifest.filmOverlay`
 * and `segment.template.filmOverlay` via `$ref`). The two definitions agree
 * by hand — when adding a field here, mirror it there. A future improvement
 * is to generate the JSON Schema from a Zod schema (see resolver header
 * "Reference" link for the design spec); out of scope for the current sync.
 */
export interface FilmOverlayConfig {
  preset?: FilmOverlayPresetName;
  effects?: FilmOverlayPreset["effects"];
  intensity?: number;
}

/** Fully-resolved film-overlay parameters ready to pass to `<FilmOverlay>`. */
export interface ResolvedFilmOverlay {
  preset: FilmOverlayPresetName;
  effects: FilmOverlayPreset["effects"];
  intensity: number;
}

/** Backdrop fields the resolver needs. Looser than full BackdropEntry. */
export interface BackdropPresetHint {
  recommendedPreset?: FilmOverlayPresetName;
}

const DEFAULT_PRESET: FilmOverlayPresetName = "documentary";

function isPresetName(value: unknown): value is FilmOverlayPresetName {
  return (
    typeof value === "string" &&
    Object.prototype.hasOwnProperty.call(FILM_OVERLAY_PRESETS, value)
  );
}

/**
 * Resolve the effective FilmOverlay parameters for a single segment.
 *
 * @param segment        Segment-level config (`segment.template.filmOverlay`). Pass
 *                       `null`/`undefined` if the segment has no override.
 * @param backdrop       Backdrop entry whose `recommendedPreset` may drive level 2,
 *                       or `null` if the segment has no backdrop.
 * @param componentName  Remotion template component name (e.g. "DataChart") for
 *                       level-3 fallback via TEMPLATE_PRESET_MAP. Pass `null`
 *                       (or undefined) to skip this level — used by background
 *                       segments that don't have a template component.
 * @param episode        Episode-level config (`manifest.filmOverlay`). The CALLER
 *                       is responsible for the gating decision: when this is
 *                       null/undefined, the caller should not invoke this resolver
 *                       at all (cascade is dormant). Passed here only for level-4
 *                       fallback of individual fields.
 */
export function resolveFilmOverlay(
  segment: FilmOverlayConfig | null | undefined,
  backdrop: BackdropPresetHint | null | undefined,
  componentName: string | null | undefined,
  episode: FilmOverlayConfig | null | undefined,
): ResolvedFilmOverlay {
  // ── preset resolves through all 5 levels ────────────────────────────────
  let preset: FilmOverlayPresetName | undefined;
  if (segment?.preset && isPresetName(segment.preset)) {
    preset = segment.preset;
  } else if (backdrop?.recommendedPreset && isPresetName(backdrop.recommendedPreset)) {
    preset = backdrop.recommendedPreset;
  } else if (componentName && isPresetName(TEMPLATE_PRESET_MAP[componentName])) {
    preset = TEMPLATE_PRESET_MAP[componentName] as FilmOverlayPresetName;
  } else if (episode?.preset && isPresetName(episode.preset)) {
    preset = episode.preset;
  } else {
    preset = DEFAULT_PRESET;
  }

  // The cascade-resolved preset supplies the baseline effects + intensity.
  const baseline = FILM_OVERLAY_PRESETS[preset];

  // ── effects: segment override → episode override → preset baseline ──────
  const effects = segment?.effects ?? episode?.effects ?? baseline.effects;

  // ── intensity: segment override → episode override → preset baseline ────
  const intensity = segment?.intensity ?? episode?.intensity ?? baseline.intensity;

  return { preset, effects, intensity };
}
