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

import React, { useMemo } from "react";
import { Audio, Sequence, useVideoConfig, interpolate } from "remotion";
import { staticFile } from "remotion";

// ── Types (re-exported from FullEpisode for component isolation) ─────────────

/**
 * Segment timing entry used to build per-frame ducking curves.
 * Passed down from FullEpisode, which extracts it from assembly-manifest segments.
 */
export interface SegmentTimeline {
  startSec: number;
  endSec: number;
  type: "FOOTAGE" | "IMAGE" | "TEMPLATE" | "TRANSITION" | "HOLD";
}

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
  /**
   * Full segment timeline from the assembly manifest — used to build per-frame
   * ducking curves so music rises during narrator-free moments (FOOTAGE, HOLD)
   * and stays low under narration (TEMPLATE). Optional: without it the volume
   * envelope is flat within each bed section (pre-ducking behaviour).
   */
  segmentTimeline?: SegmentTimeline[];
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

// ── Music Bed ducking ────────────────────────────────────────────────────────

/**
 * Volume multiplier per segment type, relative to the bed's base volume.
 *
 * Rationale (see AUDIO_DESIGN.md § "Volume Hierarchy"):
 *   TEMPLATE   — narrator is speaking; hold music at base level (-18 to -24 dB)
 *   FOOTAGE    — narrator silent; music rises ~4 dB to fill the space
 *   IMAGE      — archival still; narrator often still speaking, smaller lift
 *   TRANSITION — brief seam; small lift so the cut doesn't feel dead
 *   HOLD       — deliberate pause; music fills the silence like FOOTAGE
 */
const DUCKING_MULT: Record<SegmentTimeline["type"], number> = {
  TEMPLATE:   1.00,
  IMAGE:      1.35,
  TRANSITION: 1.20,
  FOOTAGE:    1.65,
  HOLD:       1.65,
};

/**
 * EMA smoothing constant (seconds). Transitions between ducking levels take
 * roughly 2× this long to complete, which sounds natural for music automation.
 */
const DUCK_SMOOTH_SEC = 0.8;

/**
 * Build a per-frame Float32Array of ducking multipliers for one music bed
 * section. Frame 0 = bedStartSec in absolute episode time.
 *
 * Algorithm:
 *   1. Fill raw[] with the DUCKING_MULT value for whichever segment is active
 *      at each frame (default TEMPLATE = 1.0 where no segment covers the bed).
 *   2. Apply a causal exponential moving average so level transitions are smooth
 *      rather than stepped (avoids audible volume snaps at segment boundaries).
 */
/** @internal — exported for unit tests only */
export function buildDuckingArray(
  timeline: SegmentTimeline[],
  bedStartSec: number,
  bedEndSec: number,
  fps: number,
): Float32Array {
  const n = Math.round((bedEndSec - bedStartSec) * fps);
  if (n <= 0) return new Float32Array(0);

  // Default to TEMPLATE (safest assumption — assume narration is present)
  const raw = new Float32Array(n).fill(DUCKING_MULT.TEMPLATE);

  for (const seg of timeline) {
    const lo = Math.max(0, Math.round((seg.startSec - bedStartSec) * fps));
    const hi = Math.min(n,  Math.round((seg.endSec   - bedStartSec) * fps));
    if (hi <= lo) continue;
    raw.fill(DUCKING_MULT[seg.type] ?? 1.0, lo, hi);
  }

  // Causal EMA: α controls how quickly the volume tracks segment changes
  const alpha    = Math.exp(-1 / (DUCK_SMOOTH_SEC * fps));
  const smoothed = new Float32Array(n);
  smoothed[0] = raw[0];
  for (let i = 1; i < n; i++) {
    smoothed[i] = alpha * smoothed[i - 1] + (1 - alpha) * raw[i];
  }
  return smoothed;
}

// ── Music Bed Layer ──────────────────────────────────────────────────────────

/**
 * Renders all music bed tracks as overlapping Audio sequences.
 *
 * Each track fades in/out independently; overlapping fade regions create
 * natural crossfade transitions between mood sections.
 *
 * When segmentTimeline is provided, the volume callback applies per-frame
 * ducking so the bed rises during narrator-free moments (FOOTAGE, HOLD) and
 * sits quietly under spoken sections (TEMPLATE). The ducking array is computed
 * once in useMemo so the per-frame callback is a cheap array lookup.
 */
const MusicBedLayer: React.FC<{
  tracks: MusicBedTrack[];
  episode: string;
  segmentTimeline?: SegmentTimeline[];
}> = ({ tracks, episode, segmentTimeline }) => {
  const { fps } = useVideoConfig();

  // Pre-compute one ducking array per bed track. Must be in useMemo (not inside
  // the map below) — Rules of Hooks, and this is the hot path at 30fps.
  const duckingArrays = useMemo<Map<string, Float32Array>>(() => {
    const map = new Map<string, Float32Array>();
    if (!segmentTimeline || segmentTimeline.length === 0) return map;
    for (const track of tracks) {
      map.set(
        track.id,
        buildDuckingArray(segmentTimeline, track.startSec, track.endSec, fps),
      );
    }
    return map;
  }, [tracks, segmentTimeline, fps]);

  return (
    <>
      {tracks.map((track) => {
        const startFrame     = Math.round(track.startSec * fps);
        const durationFrames = Math.round((track.endSec - track.startSec) * fps);
        // Clamp fade frames to half the section so they never overlap even if
        // the manifest specifies a fadeOutSec longer than the track duration.
        const halfDur        = Math.floor(durationFrames / 2);
        const fadeInFrames   = Math.min(Math.round((track.fadeInSec  ?? 2) * fps), halfDur);
        const fadeOutFrames  = Math.min(Math.round((track.fadeOutSec ?? 3) * fps), halfDur);
        const baseVolume     = track.volume;
        const duckArr        = duckingArrays.get(track.id);

        if (durationFrames <= 0) return null;

        /**
         * Volume callback — called per frame by Remotion's audio engine.
         * `frame` is 0-indexed from the start of this Sequence (= track.startSec).
         *
         * Two envelopes multiplied together:
         *   1. Fade-in / fade-out at section boundaries (always active)
         *   2. Segment-type ducking (active only when segmentTimeline provided)
         */
        const volumeFn = (frame: number): number => {
          const f = Math.max(0, Math.min(frame, durationFrames - 1));

          // ① Section-boundary envelope: 0 → baseVolume → 0
          const fadeInVol = interpolate(
            f,
            [0, Math.min(fadeInFrames, durationFrames)],
            [0, baseVolume],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
          );
          const fadeOutStart = durationFrames - fadeOutFrames;
          const fadeOutVol = interpolate(
            f,
            [Math.max(0, fadeOutStart), durationFrames],
            [baseVolume, 0],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
          );
          const envelope = Math.min(fadeInVol, fadeOutVol);

          // ② Ducking multiplier: 1.0 (narration) → 1.65 (footage/silence)
          const duck = duckArr != null && f < duckArr.length
            ? duckArr[f]
            : 1.0;

          // Clamp to [0, 1]: duck can push envelope above 1.0 when baseVolume
          // is high (e.g. 0.65 × 1.65 = 1.07). Remotion also clamps internally
          // but explicit clamping here preserves editorial intent.
          return Math.min(1, envelope * duck);
        };

        return (
          <Sequence
            key={`music-${track.id}`}
            from={startFrame}
            durationInFrames={durationFrames}
            name={`music-bed-${track.id}`}
          >
            {/* loop ensures the track repeats if it's shorter than the bed
                section (e.g. a 3-min licensed track covering a 4-min beat).
                The volume envelope is keyed to durationFrames, not the audio
                file length, so fade-in / fade-out and ducking fire correctly. */}
            <Audio
              src={staticFile(`episodes/${episode}/${track.file}`)}
              volume={volumeFn}
              loop
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

      // File naming: {type}-{intensity}.wav for cues with explicit intensity,
      // {type}.wav for intensity-less cues (e.g. end-stinger — used once per
      // episode, no intensity variants). Must match public/audio/sfx/transitions/.
      const file = cue.intensity
        ? `audio/sfx/transitions/${cue.type}-${cue.intensity}.wav`
        : `audio/sfx/transitions/${cue.type}.wav`;

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
  segmentTimeline,
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
        <MusicBedLayer
          tracks={musicBedTracks}
          episode={episode}
          segmentTimeline={segmentTimeline}
        />
      )}

      {/* Layer 2: Transition SFX (event-driven) */}
      {hasSFX && <TransitionSFXLayer segmentAudio={segmentAudio} />}

      {/* Layer 3: Texture Hits (micro-SFX) */}
      {hasTextures && <TextureHitsLayer segmentAudio={segmentAudio} />}
    </>
  );
};
