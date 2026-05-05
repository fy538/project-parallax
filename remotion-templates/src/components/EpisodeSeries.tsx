/**
 * EpisodeSeries — codifies the master-composition pattern for episodes (L52).
 *
 * Wraps a list of clips in <Series> with an automatic cross-fade overlap on
 * every clip after the first. Replaces hand-wired Series.Sequence boilerplate
 * in per-episode master files (silicon-trap, prisoners-dilemma, ...).
 *
 * Usage in an episode master composition:
 *   import { EpisodeSeries, type EpisodeClip } from "../../components/EpisodeSeries";
 *   const clips: EpisodeClip[] = [
 *     { component: TitleTransition, data: titleEpisode, durationFrames: sec(3) },
 *     { component: KineticTypography, data: kinetic92, durationFrames: sec(5) },
 *     ...
 *   ];
 *   export const SiliconTrap: React.FC = () => <EpisodeSeries clips={clips} />;
 *
 * The default 15-frame overlap matches POLISH.md A7's exit-fade duration so
 * outgoing exit fades cleanly into the incoming entrance. Override with
 * `crossfadeFrames` when a specific episode wants a different feel.
 */

import React from "react";
import { AbsoluteFill, Series } from "remotion";

/** Default cross-fade overlap in frames at 30fps — matches EXIT_FADE_DURATION. */
export const DEFAULT_CROSSFADE_FRAMES = 15;

export interface EpisodeClip<TData = unknown> {
  /** A unique key (filename, segment id) — used for React reconciliation. */
  key?: string;
  /** Remotion template component to render this clip. */
  component: React.ComponentType<{ data: TData }>;
  /** Pre-typed JSON data passed as the component's only prop. */
  data: TData;
  /** Length of this clip in frames (NOT seconds). Use sec() to convert. */
  durationFrames: number;
}

export interface EpisodeSeriesProps {
  clips: EpisodeClip[];
  /** Frames of overlap between consecutive clips. Default: 15 (matches EXIT_FADE_DURATION). */
  crossfadeFrames?: number;
}

export const EpisodeSeries: React.FC<EpisodeSeriesProps> = ({
  clips,
  crossfadeFrames = DEFAULT_CROSSFADE_FRAMES,
}) => {
  return (
    <AbsoluteFill>
      <Series>
        {clips.map((clip, index) => {
          const Comp = clip.component;
          return (
            <Series.Sequence
              key={clip.key ?? `clip-${index}`}
              durationInFrames={clip.durationFrames}
              offset={index > 0 ? -crossfadeFrames : 0}
            >
              <Comp data={clip.data} />
            </Series.Sequence>
          );
        })}
      </Series>
    </AbsoluteFill>
  );
};
