/**
 * AudioLayer — 3-layer sound design for full-episode compositions.
 *
 * Renders the complete audio mix (minus narration, which is handled separately):
 *
 *   Layer 1: Music Bed — continuous ambient tracks with crossfade transitions.
 *            Volume: 0.10-0.15 under narration, 0.20-0.30 during visual-only.
 *            Tracks may overlap by their fade durations for smooth crossfades.
 *
 *   Layer 2: Transition SFX — event-driven cues at segment boundaries.
 *            8 cue types (beat-transition, stat-reveal, tension-rise, etc.)
 *            3 intensity levels → volume mapping.
 *
 *   Layer 3: Texture Hits — micro-SFX timed to template animation events.
 *            7 hit types (dot-click, card-settle, bar-grow, etc.)
 *            Max 0.20 volume, typically 0.06-0.08.
 *
 * Architecture:
 *   Each audio event becomes a Remotion <Audio> or <Sequence> + <Audio> pair.
 *   Volume interpolation uses Remotion's `volume` callback prop, which receives
 *   the current frame and returns 0-1. This enables smooth fade-in/out without
 *   needing a custom gain node.
 *
 * File resolution:
 *   - Music beds: staticFile(`episodes/${episode}/${track.file}`)
 *   - SFX: staticFile(`audio/sfx/transitions/${type}-${intensity}.wav`)
 *   - Textures: staticFile(`audio/sfx/textures/${type}.wav`)
 *
 * See AUDIO_DESIGN.md for the editorial framework behind these choices.
 */

import React from "react";
import { Audio, Sequence, useVideoConfig, interpolate } from "remotion";
import { staticFile } from "remotion";

// ── Types (re-exported from FullEpisode for component isolation) ─────────────

interface MusicBedTrack {
  id: string;
  file: string;
  startSec: number;
  endSec: number;
  fadeInSec?: number;
  fadeOutSec?: number;
  volume: number;
  mood?: string;
  beat?: string;
}

interface SoundCue {
  type:
    | "beat-transition"
    | "stat-reveal"
    | "tension-rise"
    | "tension-resolve"
    | "map-whoosh"
    | "quote-bell"
    | "section-open"
    | "end-stinger";
  offsetSec?: number;
  intensity?: "subtle" | "normal" | "dramatic";
}

interface TextureCue {
  type:
    | "dot-click"
    | "card-settle"
    | "line-draw"
    | "region-glow"
    | "bar-grow"
    | "node-pop"
    | "page-turn";
  offsetSec: number;
  volume?: number;
  label?: string;
}

interface SegmentAudio {
  segmentId: string;
  startSec: number;
  soundCue?: SoundCue;
  soundCueSecondary?: SoundCue;
  textureCues?: TextureCue[];
}

export interface AudioLayerProps {
  /** Episode slug for file path resolution */
  episode: string;
  /** Music bed tracks (Layer 1) */
  musicBedTracks?: MusicBedTrack[];
  /** Segment audio cues (Layer 2 + 3), extracted from manifest segments */
  segmentAudio: SegmentAudio[];
  /** Base path for audio assets (default: "audio") */
  audioBasePath?: string;
}

// ── Volume constants ─────────────────────────────────────────────────────────

/** Intensity → base volume mapping for transition SFX (Layer 2) */
const SFX_INTENSITY_VOLUME: Record<string, number> = {
  subtle: 0.15,
  normal: 0.35,
  dramatic: 0.55,
};

/** Default texture hit volume */
const DEFAULT_TEXTURE_VOLUME = 0.08;

// ── Music Bed Layer ──────────────────────────────────────────────────────────

/**
 * Renders all music bed tracks as overlapping Audio sequences.
 * Each track fades in/out independently; overlapping fade regions create
 * natural crossfade transitions between mood sections.
 */
const MusicBedLayer: React.FC<{
  tracks: MusicBedTrack[];
  episode: string;
}> = ({ tracks, episode }) => {
  const { fps } = useVideoConfig();

  return (
    <>
      {tracks.map((track) => {
        const startFrame = Math.round(track.startSec * fps);
        const durationFrames = Math.round((track.endSec - track.startSec) * fps);
        const fadeInFrames = Math.round((track.fadeInSec ?? 2) * fps);
        const fadeOutFrames = Math.round((track.fadeOutSec ?? 3) * fps);
        const baseVolume = track.volume;

        if (durationFrames <= 0) return null;

        // Volume callback: handles fade-in and fade-out envelope
        const volumeFn = (frame: number): number => {
          // Fade in: 0 → baseVolume over fadeInFrames
          const fadeInVol = interpolate(
            frame,
            [0, Math.min(fadeInFrames, durationFrames)],
            [0, baseVolume],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );

          // Fade out: baseVolume → 0 over fadeOutFrames at the end
          const fadeOutStart = durationFrames - fadeOutFrames;
          const fadeOutVol = interpolate(
            frame,
            [Math.max(0, fadeOutStart), durationFrames],
            [baseVolume, 0],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );

          // Use the minimum of fade-in and fade-out (whichever is more restrictive)
          return Math.min(fadeInVol, fadeOutVol);
        };

        return (
          <Sequence
            key={`music-${track.id}`}
            from={startFrame}
            durationInFrames={durationFrames}
            name={`music-bed-${track.id}`}
          >
            <Audio
              src={staticFile(`episodes/${episode}/${track.file}`)}
              volume={volumeFn}
            />
          </Sequence>
        );
      })}
    </>
  );
};

// ── Transition SFX Layer ─────────────────────────────────────────────────────

/**
 * Renders transition SFX cues (Layer 2) as short Audio clips at their
 * computed absolute positions. Each cue resolves to a named audio file
 * based on type + intensity.
 */
const TransitionSFXLayer: React.FC<{
  segmentAudio: SegmentAudio[];
}> = ({ segmentAudio }) => {
  const { fps } = useVideoConfig();

  const cues: Array<{
    key: string;
    startFrame: number;
    file: string;
    volume: number;
  }> = [];

  for (const seg of segmentAudio) {
    const processCue = (cue: SoundCue, suffix: string) => {
      const intensity = cue.intensity || "normal";
      const offsetSec = cue.offsetSec || 0;
      const absoluteStart = seg.startSec + offsetSec;
      const startFrame = Math.round(absoluteStart * fps);
      const volume = SFX_INTENSITY_VOLUME[intensity] ?? 0.35;

      // File naming: {type}-{intensity}.wav
      const file = `audio/sfx/transitions/${cue.type}-${intensity}.wav`;

      cues.push({
        key: `sfx-${seg.segmentId}-${suffix}`,
        startFrame,
        file,
        volume,
      });
    };

    if (seg.soundCue) {
      processCue(seg.soundCue, "primary");
    }
    if (seg.soundCueSecondary) {
      processCue(seg.soundCueSecondary, "secondary");
    }
  }

  return (
    <>
      {cues.map((cue) => (
        <Sequence
          key={cue.key}
          from={cue.startFrame}
          name={cue.key}
        >
          <Audio
            src={staticFile(cue.file)}
            volume={cue.volume}
          />
        </Sequence>
      ))}
    </>
  );
};

// ── Texture Hits Layer ───────────────────────────────────────────────────────

/**
 * Renders texture micro-SFX (Layer 3) at precise offsets from their parent
 * segment's start. These are very short (50-600ms) clips at very low volume.
 */
const TextureHitsLayer: React.FC<{
  segmentAudio: SegmentAudio[];
}> = ({ segmentAudio }) => {
  const { fps } = useVideoConfig();

  const hits: Array<{
    key: string;
    startFrame: number;
    file: string;
    volume: number;
  }> = [];

  for (const seg of segmentAudio) {
    if (!seg.textureCues || seg.textureCues.length === 0) continue;

    for (let i = 0; i < seg.textureCues.length; i++) {
      const cue = seg.textureCues[i];
      const absoluteStart = seg.startSec + cue.offsetSec;
      const startFrame = Math.round(absoluteStart * fps);
      const volume = Math.min(cue.volume ?? DEFAULT_TEXTURE_VOLUME, 0.2);

      // File naming: {type}.wav
      const file = `audio/sfx/textures/${cue.type}.wav`;

      hits.push({
        key: `texture-${seg.segmentId}-${i}-${cue.type}`,
        startFrame,
        file,
        volume,
      });
    }
  }

  return (
    <>
      {hits.map((hit) => (
        <Sequence
          key={hit.key}
          from={hit.startFrame}
          name={hit.key}
        >
          <Audio
            src={staticFile(hit.file)}
            volume={hit.volume}
          />
        </Sequence>
      ))}
    </>
  );
};

// ── Main component ───────────────────────────────────────────────────────────

export const AudioLayer: React.FC<AudioLayerProps> = ({
  episode,
  musicBedTracks,
  segmentAudio,
}) => {
  // Only render layers that have data
  const hasMusicBed = musicBedTracks && musicBedTracks.length > 0;
  const hasSFX = segmentAudio.some(
    (s) => s.soundCue || s.soundCueSecondary
  );
  const hasTextures = segmentAudio.some(
    (s) => s.textureCues && s.textureCues.length > 0
  );

  return (
    <>
      {/* Layer 1: Music Bed (continuous) */}
      {hasMusicBed && (
        <MusicBedLayer tracks={musicBedTracks} episode={episode} />
      )}

      {/* Layer 2: Transition SFX (event-driven) */}
      {hasSFX && <TransitionSFXLayer segmentAudio={segmentAudio} />}

      {/* Layer 3: Texture Hits (micro-SFX) */}
      {hasTextures && <TextureHitsLayer segmentAudio={segmentAudio} />}
    </>
  );
};
