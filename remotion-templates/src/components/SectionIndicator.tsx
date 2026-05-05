/**
 * SectionIndicator — persistent beat/section label overlay for full episodes.
 *
 * Shows the current section name in the bottom-left corner, fading in when
 * the beat changes and persisting until the next beat. Gives viewers a
 * structural anchor — they always know where they are in the argument.
 *
 * Positioned in the safe area alongside the episode label. Uses the same
 * IBM Plex Mono metadata typography as MetadataStrip for visual consistency.
 *
 * Usage (inside FullEpisode.tsx):
 *   <SectionIndicator
 *     beats={manifest.beats}
 *     currentTimeSec={frame / fps}
 *   />
 */

import React, { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";
import { fonts, fontSizes, fontWeights, letterSpacing, dark, palette, layout, sec } from "../design/theme";
import { fadeIn, exitFade } from "../utils/animation";

interface Beat {
  id: string;
  title: string;
  startSec: number;
  endSec?: number;
}

interface SectionIndicatorProps {
  beats?: Beat[];
  /** Position: bottom-left (default) or top-left */
  position?: "bottom-left" | "top-left";
}

export const SectionIndicator: React.FC<SectionIndicatorProps> = ({
  beats,
  position = "bottom-left",
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const currentSec = frame / fps;

  // Find current beat
  const currentBeat = useMemo(() => {
    if (!beats || beats.length === 0) return null;
    // Walk backwards to find the beat whose startSec <= currentSec
    for (let i = beats.length - 1; i >= 0; i--) {
      if (currentSec >= beats[i].startSec) {
        return beats[i];
      }
    }
    return null;
  }, [beats, currentSec]);

  if (!currentBeat || !beats || beats.length === 0) return null;

  // Fade in when beat starts, with a brief delay so it doesn't compete with
  // the section title card that typically opens each beat
  const beatStartFrame = Math.round(currentBeat.startSec * fps);
  const entryDelay = sec(2); // appear 2s after beat starts (title card is finishing)
  const opacity = fadeIn(frame, beatStartFrame + entryDelay, sec(0.6));

  // Fade out at the very end of the episode
  const exitOpacity = exitFade(frame, durationInFrames, 15);

  // Animated underline that draws in from left
  const underlineProgress = interpolate(
    frame,
    [beatStartFrame + entryDelay, beatStartFrame + entryDelay + sec(0.8)],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) }
  );

  const isTop = position === "top-left";

  // Title letter-spacing: tightens slightly on entrance ("focus pull")
  const titleTracking = interpolate(
    frame,
    [beatStartFrame + entryDelay, beatStartFrame + entryDelay + sec(0.6)],
    [3, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) }
  );

  // Lift bottom indicator above FooterStrip (~40px) so they don't collide
  const bottomLift = isTop ? 0 : 40;

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          [isTop ? "top" : "bottom"]: layout.safeArea[isTop ? "top" : "bottom"] + bottomLift,
          left: layout.safeArea.left,
          opacity: Math.min(opacity, exitOpacity),
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
      >
        {/* Beat number */}
        <div
          style={{
            fontFamily: fonts.body, // IBM Plex Mono
            fontSize: fontSizes.small,
            fontWeight: fontWeights.regular,
            letterSpacing: letterSpacing.meta,
            color: dark.text.muted,
            textTransform: "uppercase",
          }}
        >
          {currentBeat.id.replace(/beat/i, "SECTION ")}
        </div>

        {/* Beat title — letter-spacing focus pull on entrance */}
        <div
          style={{
            fontFamily: fonts.heading,
            fontSize: fontSizes.label,
            fontWeight: 600,
            color: dark.text.secondary,
            textShadow: "0 1px 3px rgba(0,0,0,0.5)",
            letterSpacing: titleTracking,
            textTransform: "uppercase",
          }}
        >
          {currentBeat.title}
        </div>

        {/* Animated underline accent — gradient + glow */}
        <div
          style={{
            height: 2,
            width: `${underlineProgress * 100}%`,
            maxWidth: 120,
            background: `linear-gradient(90deg, ${palette.amber} 0%, ${palette.amber}40 80%, transparent 100%)`,
            borderRadius: 1,
            marginTop: 2,
            boxShadow: `0 0 6px ${palette.amber}50`,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
