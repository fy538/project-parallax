/**
 * defineEpisode — declarative builder for per-episode master compositions.
 *
 * Replaces the hand-rolled ClipMetadata array + duration helper boilerplate
 * that was repeated per episode. With this builder, an episode master file
 * is essentially the clip list — duration auto-derives from the data's
 * `durationSec`, and known phase-based templates use shared duration helpers.
 *
 * Usage in `src/templates/Episodes/<Slug>.tsx`:
 *
 *   import { defineEpisode, clip, sumPhases } from "../../utils/defineEpisode";
 *   import { TitleTransition } from "../TitleTransition/TitleTransition";
 *   import { ChoroplethMap } from "../ChoroplethMap/ChoroplethMap";
 *   import titleEpisode from "../../../data/episodes/<slug>/title-episode.json";
 *   import choroplethCocom from "../../../data/episodes/<slug>/choropleth-cocom.json";
 *
 *   export const MyEpisode = defineEpisode({
 *     slug: "my-episode",
 *     clips: [
 *       clip({ component: TitleTransition, data: titleEpisode }),                       // uses data.durationSec
 *       clip({ component: ChoroplethMap, data: choroplethCocom, durationOf: sumPhases }) // phase-based
 *     ],
 *   });
 *
 * Crossfade overlap defaults to 15 frames (matches EXIT_FADE_DURATION) per L52.
 * Override per-episode via the `crossfadeFrames` config option if needed.
 */

import React from "react";
import { sec } from "../design/theme";
import { EpisodeSeries, type EpisodeClip } from "../components/EpisodeSeries";

/** Default per-clip duration when nothing else applies. Templates without explicit
 * durationSec or phases will fall back to this — surfaces as a 5-second placeholder. */
const FALLBACK_CLIP_SEC = 5;

/** Minimal shape every template's data is expected to expose for duration inference. */
export interface DurationLike {
  durationSec?: number;
  phases?: { durationSec: number }[];
}

/** A single clip in an episode sequence. Pure data; no component logic here. */
export interface ClipSpec<TData = unknown> {
  /** Remotion template component. */
  component: React.ComponentType<{ data: TData }>;
  /** JSON-imported data. */
  data: TData;
  /**
   * Stable React key. Defaults to "<slug>-clip-<index>".
   * Override when you reorder clips and want render output filenames to stay stable.
   */
  key?: string;
  /** Force a specific duration in frames. Bypasses `durationOf` and the data-based defaults. */
  durationFrames?: number;
  /** Compute duration from data (e.g. sumPhases for phase-based templates). */
  durationOf?: (data: TData) => number;
}

/**
 * Helper for adding clips to the episode list. Constrains `component` and
 * `durationOf` to the same data shape T while leaving `data` typed as
 * unknown — JSON imports widen string literals (e.g. `"variant": "section"`
 * comes in as `string` not `"section"`), so a strict equality check at this
 * boundary would force casts on every data prop. Runtime Zod schema
 * validation in each composition's `<Composition schema={...}>` registration
 * is the real enforcement; this function provides the structural contract
 * (component + duration) and gets out of TypeScript's way for `data`.
 *
 *   clips: [
 *     clip({ component: TitleTransition, data: titleEpisode }),
 *     clip({ component: ChoroplethMap, data: choroplethData, durationOf: sumPhases }),
 *   ]
 */
export function clip<T>(spec: {
  component: React.ComponentType<{ data: T }>;
  data: unknown;
  key?: string;
  durationFrames?: number;
  durationOf?: (data: T) => number;
}): ClipSpec<unknown> {
  return spec as unknown as ClipSpec<unknown>;
}

export interface EpisodeConfig {
  /** Episode slug (used for default clip keys + display name). */
  slug: string;
  /** Ordered list of clips. Use the `clip()` helper for per-element type checking. */
  clips: ClipSpec<unknown>[];
  /** Frames of crossfade overlap between clips. Default: 15 (matches EXIT_FADE_DURATION). */
  crossfadeFrames?: number;
}

// ── Duration helpers ──────────────────────────────────────────────────────────

/** Frames = sum of `data.phases[].durationSec`. Use for ChoroplethMap, GameBoard. */
export const sumPhases = <T extends DurationLike>(data: T): number => {
  if (!data.phases || data.phases.length === 0) return sec(FALLBACK_CLIP_SEC);
  return data.phases.reduce((acc, p) => acc + sec(p.durationSec), 0);
};

/** Frames = sum of phases + N seconds (e.g. RouteAnimation has a 1-second intro delay). */
export const sumPhasesPlus = (extraSec: number) => <T extends DurationLike>(data: T): number => {
  const phaseFrames = data.phases
    ? data.phases.reduce((acc, p) => acc + p.durationSec, 0)
    : FALLBACK_CLIP_SEC;
  return sec(phaseFrames + extraSec);
};

/** Default duration resolver: durationFrames > durationOf > sec(data.durationSec) > FALLBACK. */
function resolveDuration(spec: ClipSpec<unknown>): number {
  if (typeof spec.durationFrames === "number") return spec.durationFrames;
  if (typeof spec.durationOf === "function") return spec.durationOf(spec.data);
  const ds = (spec.data as DurationLike | undefined)?.durationSec;
  if (typeof ds === "number") return sec(ds);
  return sec(FALLBACK_CLIP_SEC);
}

// ── Builder ───────────────────────────────────────────────────────────────────

/**
 * Build an episode master component from a clip list.
 * Returns a parameter-less React.FC; register it in Root.tsx with `<Composition id="<slug>" />`.
 */
export function defineEpisode(config: EpisodeConfig): React.FC {
  const clips: EpisodeClip[] = config.clips.map((spec, i) => ({
    key: spec.key ?? `${config.slug}-clip-${i}`,
    // Type cast is safe — EpisodeClip is intentionally `unknown`-typed at the
    // wrapper boundary; each component receives its own shape internally.
    component: spec.component as React.ComponentType<{ data: unknown }>,
    data: spec.data,
    durationFrames: resolveDuration(spec),
  }));

  const Episode: React.FC = () => (
    <EpisodeSeries clips={clips} crossfadeFrames={config.crossfadeFrames} />
  );
  Episode.displayName = `Episode(${config.slug})`;
  return Episode;
}
