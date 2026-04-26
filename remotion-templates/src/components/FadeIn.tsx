/**
 * FadeIn — wraps children in a fade + optional slide animation.
 *
 * Usage:
 *   <FadeIn startFrame={30} direction="up">
 *     <h1>Title</h1>
 *   </FadeIn>
 */

import React from "react";
import { useCurrentFrame } from "remotion";
import { fadeIn, slideIn } from "../utils/animation";
import { durations } from "../design/theme";

type Direction = "up" | "down" | "left" | "right" | "none";

interface FadeInProps {
  children: React.ReactNode;
  startFrame?: number;
  duration?: number;
  direction?: Direction;
  distance?: number;
  style?: React.CSSProperties;
}

export const FadeIn: React.FC<FadeInProps> = ({
  children,
  startFrame = 0,
  duration = durations.fadeIn,
  direction = "up",
  distance = 30,
  style = {},
}) => {
  const frame = useCurrentFrame();
  const opacity = fadeIn(frame, startFrame, duration);
  const offset = direction !== "none" ? slideIn(frame, startFrame, distance, duration) : 0;

  const transform = {
    up: `translateY(${offset}px)`,
    down: `translateY(${-offset}px)`,
    left: `translateX(${offset}px)`,
    right: `translateX(${-offset}px)`,
    none: "none",
  }[direction];

  return (
    <div style={{ opacity, transform, ...style }}>
      {children}
    </div>
  );
};
