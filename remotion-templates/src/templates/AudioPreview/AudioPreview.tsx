/**
 * AudioPreview — render the audio layer of an episode without the visuals.
 *
 * Goal: close the iteration loop on audio. AudioLayer (3-layer mix: music bed
 * + transition SFX + texture hits) is wired into FullEpisode only. Iterating
 * on audio timing previously meant rendering the full 18-min episode.
 *
 * This composition takes a manifest, mounts AudioLayer with its data, and
 * renders a minimal visual timeline overlay — segment markers, current time,
 * cue tick marks. You can scrub the Remotion Studio timeline and hear the
 * actual mix at any point in the episode.
 *
 * Use:
 *   1. Open Remotion Studio (`npm start`)
 *   2. Pick the AudioPreview composition
 *   3. Scrub or play to hear the music bed crossfades + SFX hits
 *
 * To preview a different episode, override `defaultProps.manifestPath` in
 * `index.tsx`, or pass `--props='{"manifestPath": "..."}'` from the CLI.
 */

import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { fonts, fontSizes, layout, palette } from "../../design/theme";
import { AudioLayer, type AudioLayerProps } from "../../components/AudioLayer";
import { useCompositionAnimation } from "../../hooks/useCompositionAnimation";

export interface AudioPreviewData {
  /** Episode slug used for music-bed file path resolution. */
  episode: string;
  /** Total duration in seconds (mirrors the manifest `totalDurationSec`). */
  totalDurationSec: number;
  /** Music bed tracks (Layer 1). */
  musicBedTracks?: AudioLayerProps["musicBedTracks"];
  /** Per-segment audio (Layer 2 + 3). */
  segmentAudio: AudioLayerProps["segmentAudio"];
  /** Beat boundaries for visual timeline reference. */
  beats?: { id: string; title: string; startSec: number; endSec: number }[];
}

const formatTime = (sec: number): string => {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
};

export const AudioPreview: React.FC<{ data: AudioPreviewData }> = ({ data }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentSec = frame / fps;
  // Audio-only composition. We satisfy the L44 convention by calling the hook
  // but disable both drift and exit fade — the visible content is just a
  // scrubber UI that should not animate.
  useCompositionAnimation({ noDrift: true, noExit: true });

  return (
    <AbsoluteFill style={{ backgroundColor: palette.ink, color: palette.bone, fontFamily: fonts.mono }}>
      {/* Audio is the actual content — visual is just a scrubber + indicators */}
      <AudioLayer
        episode={data.episode}
        musicBedTracks={data.musicBedTracks}
        segmentAudio={data.segmentAudio}
      />

      {/* ── Header: AUDIO PREVIEW MODE ─────────────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          top: layout.safeAreaTier.tight.top,
          left: layout.safeAreaTier.tight.left,
          right: layout.safeAreaTier.tight.right,
          fontSize: fontSizes.label,
          letterSpacing: 4,
          textTransform: "uppercase",
          color: palette.gold,
        }}
      >
        ∴ AUDIO PREVIEW · {data.episode} · {formatTime(data.totalDurationSec)} total
      </div>

      {/* ── Big current-time readout ─────────────────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          top: "40%",
          left: 0,
          right: 0,
          textAlign: "center",
          fontSize: 120,
          fontFamily: fonts.mono,
          fontVariantNumeric: "tabular-nums",
          color: palette.gold,
          letterSpacing: -2,
        }}
      >
        {formatTime(currentSec)}
      </div>
      <div
        style={{
          position: "absolute",
          top: "55%",
          left: 0,
          right: 0,
          textAlign: "center",
          fontSize: fontSizes.label,
          color: palette.taupe,
          letterSpacing: 3,
          textTransform: "uppercase",
        }}
      >
        {currentSec.toFixed(2)}s · frame {frame}
      </div>

      {/* ── Beat markers along the bottom edge ────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          bottom: layout.safeAreaTier.standard.bottom + layout.spacing.xxxl,
          left: layout.safeAreaTier.standard.left,
          right: layout.safeAreaTier.standard.right,
          height: layout.spacing.md,
        }}
      >
        {(data.beats ?? []).map((beat) => {
          const leftPct = (beat.startSec / data.totalDurationSec) * 100;
          const widthPct = ((beat.endSec - beat.startSec) / data.totalDurationSec) * 100;
          const isActive = currentSec >= beat.startSec && currentSec < beat.endSec;
          return (
            <div
              key={beat.id}
              style={{
                position: "absolute",
                left: `${leftPct}%`,
                width: `${widthPct}%`,
                top: 0,
                height: "100%",
                borderLeft: `1px solid ${palette.taupe}`,
                paddingLeft: 6,
                fontSize: fontSizes.caption,
                color: isActive ? palette.gold : palette.taupe,
                opacity: isActive ? 1 : 0.6,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {beat.title}
            </div>
          );
        })}
      </div>

      {/* ── Music bed track strip ─────────────────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          bottom: layout.safeAreaTier.standard.bottom + layout.spacing.lg + layout.spacing.xs,
          left: layout.safeAreaTier.standard.left,
          right: layout.safeAreaTier.standard.right,
          height: 18,
        }}
      >
        {(data.musicBedTracks ?? []).map((track) => {
          const leftPct = (track.startSec / data.totalDurationSec) * 100;
          const widthPct = ((track.endSec - track.startSec) / data.totalDurationSec) * 100;
          const moodColor =
            track.mood === "tension"
              ? palette.gold
              : track.mood === "resolution"
                ? palette.taupe
                : track.mood === "contemplative"
                  ? palette.umber
                  : palette.walnut;
          return (
            <div
              key={track.id}
              style={{
                position: "absolute",
                left: `${leftPct}%`,
                width: `${widthPct}%`,
                top: 0,
                height: "100%",
                backgroundColor: moodColor,
                opacity: 0.6,
                borderRadius: 2,
                fontSize: fontSizes.caption,
                color: palette.ink,
                paddingLeft: 6,
                lineHeight: "18px",
                whiteSpace: "nowrap",
                overflow: "hidden",
              }}
            >
              {track.mood ?? track.id}
            </div>
          );
        })}
      </div>

      {/* ── Playhead ─────────────────────────────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          bottom: layout.safeAreaTier.standard.bottom + layout.spacing.md,
          left: `calc(${layout.safeAreaTier.standard.left}px + ${(currentSec / data.totalDurationSec) * (layout.width - layout.safeAreaTier.standard.left - layout.safeAreaTier.standard.right)}px)`,
          width: 2,
          height: 80,
          backgroundColor: palette.gold,
          boxShadow: `0 0 8px ${palette.gold}`, // shadows.accentGlowSm (full-opacity variant)
        }}
      />

      {/* ── Footer: legend ────────────────────────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          bottom: layout.safeAreaTier.tight.bottom,
          left: layout.safeAreaTier.tight.left,
          right: layout.safeAreaTier.tight.right,
          fontSize: fontSizes.caption,
          color: palette.taupe,
          letterSpacing: 2,
          textTransform: "uppercase",
          textAlign: "center",
        }}
      >
        Bands: music bed · Lines: beat boundaries · Vertical: playhead
      </div>
    </AbsoluteFill>
  );
};
