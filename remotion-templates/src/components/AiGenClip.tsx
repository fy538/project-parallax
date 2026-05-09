/**
 * AiGenClip — Plays an AI-generated video clip with optional slowdown.
 *
 * AI video generators (Hailuo, Kling, Pika) output clips at fixed durations.
 * This component stretches them to fill the needed screen time via playbackRate.
 *
 * Usage:
 *   <AiGenClip
 *     src={staticFile("episodes/prisoners-dilemma/clips/aigen-01-rand-office.mp4")}
 *     playbackRate={0.75}   // 6s clip fills 8s
 *   />
 *
 * Practical limits:
 *   - 0.75x (6s → 8s): imperceptible on low-motion shots
 *   - 0.60x (6s → 10s): still good for atmospheric/establishing shots
 *   - Below 0.50x (6s → 12s+): motion artifacts become noticeable
 *
 * Helper to calculate rate:  playbackRate = nativeDuration / targetDuration
 *
 * See LESSONS.md L92 for details.
 */

import React from "react";
import { AbsoluteFill, OffthreadVideo } from "remotion";

interface AiGenClipProps {
  /** staticFile() path to the clip */
  src: string;
  /** Playback speed multiplier. <1 = slower. Default 1 (native speed). */
  playbackRate?: number;
  /** CSS object-fit. Default "cover" for full-bleed. */
  objectFit?: React.CSSProperties["objectFit"];
}

export const AiGenClip: React.FC<AiGenClipProps> = ({
  src,
  playbackRate = 1,
  objectFit = "cover",
}) => (
  <AbsoluteFill style={{ backgroundColor: "#1C1814" }}>
    <OffthreadVideo
      src={src}
      playbackRate={playbackRate}
      style={{ width: "100%", height: "100%", objectFit }}
    />
  </AbsoluteFill>
);
