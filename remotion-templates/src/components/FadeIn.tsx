/**
 * FadeIn — wraps children in a fade + motion entrance animation.
 *
 * Three motion modes (cinematic overhaul):
 *   - "ease" (default): smooth CSS easing via interpolate()
 *   - "spring": spring physics with organic overshoot (POLISH.md A2)
 *   - "cinematic": scale from 115% → 100% + slide — bold, authoritative arrival
 *
 * Usage:
 *   <FadeIn startFrame={30} direction="up">
 *     <h1>Title</h1>
 *   </FadeIn>
 *
 *   <FadeIn startFrame={0} direction="up" spring>
 *     <h1>Hero Title</h1>
 *   </FadeIn>
 *
 *   <FadeIn startFrame={0} direction="up" cinematic>
 *     <h1>Big Reveal Title</h1>
 *   </FadeIn>
 */

import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";
import { fadeIn, slideIn, heroSpring, exitFade } from "../utils/animation";
import { durations } from "../design/theme";

type Direction = "up" | "down" | "left" | "right" | "none";

interface FadeInProps {
  children: React.ReactNode;
  startFrame?: number;
  duration?: number;
  direction?: Direction;
  distance?: number;
  /** Use spring physics instead of eased interpolation (POLISH.md A2) */
  spring?: boolean;
  /**
   * Cinematic scale-reveal: element arrives at 115% scale and eases down to 100%.
   * Combined with the directional slide, this creates the bold "arriving with authority"
   * feel that separates video graphics from slide decks.
   */
  cinematic?: boolean;
  /** Initial scale for cinematic mode. Default: 1.15 */
  cinematicScale?: number;
  /** Enable exit fade in the last N frames (POLISH.md A7). 0 = no exit. */
  exitFrames?: number;
  style?: React.CSSProperties;
}

export const FadeIn: React.FC<FadeInProps> = ({
  children,
  startFrame = 0,
  duration = durations.fadeIn,
  direction = "up",
  distance = 30,
  spring: useSpring = false,
  cinematic = false,
  cinematicScale = 1.15,
  exitFrames = 0,
  style = {},
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Entrance opacity
  const entranceOpacity = fadeIn(frame, startFrame, duration);

  // Exit fade (POLISH.md A7)
  const exitOpacity = exitFrames > 0
    ? exitFade(frame, durationInFrames, exitFrames)
    : 1;

  const opacity = Math.min(entranceOpacity, exitOpacity);

  // Motion — cinematic, spring, or eased
  let offset: number;
  if (cinematic && direction !== "none") {
    // Cinematic mode: more distance + eased cubic for dramatic feel
    offset = slideIn(frame, startFrame, distance * 1.5, Math.round(duration * 1.3));
  } else if (useSpring && direction !== "none") {
    const springProgress = heroSpring(frame, fps, startFrame);
    offset = distance * (1 - springProgress);
  } else if (direction !== "none") {
    offset = slideIn(frame, startFrame, distance, duration);
  } else {
    offset = 0;
  }

  // Scale component — cinematic mode zooms from cinematicScale → 1.0
  const scale = cinematic
    ? interpolate(
        frame,
        [startFrame, startFrame + Math.round(duration * 1.3)],
        [cinematicScale, 1.0],
        {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.out(Easing.cubic),
        }
      )
    : 1;

  const translatePart = {
    up: `translateY(${offset}px)`,
    down: `translateY(${-offset}px)`,
    left: `translateX(${offset}px)`,
    right: `translateX(${-offset}px)`,
    none: "",
  }[direction];

  const transform = scale !== 1
    ? `scale(${scale}) ${translatePart}`.trim()
    : translatePart || "none";

  return (
    <div style={{ opacity, transform, transformOrigin: "center center", ...style }}>
      {children}
    </div>
  );
};
