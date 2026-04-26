/**
 * AnimatedText — text that appears word-by-word or character-by-character.
 *
 * Usage:
 *   <AnimatedText text="Globalization is almost dead." startFrame={0} />
 *   <AnimatedText text="卡脖子" mode="character" startFrame={30} />
 */

import React from "react";
import { useCurrentFrame } from "remotion";
import { interpolate, Easing } from "remotion";
import { fonts, fontSizes, dark } from "../design/theme";

interface AnimatedTextProps {
  text: string;
  startFrame?: number;
  framesPerUnit?: number; // frames between each word/character appearing
  mode?: "word" | "character";
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  fontWeight?: number;
  style?: React.CSSProperties;
}

export const AnimatedText: React.FC<AnimatedTextProps> = ({
  text,
  startFrame = 0,
  framesPerUnit = 4,
  mode = "word",
  fontSize = fontSizes.h2,
  fontFamily = fonts.heading,
  color = dark.text.primary,
  fontWeight = 600,
  style = {},
}) => {
  const frame = useCurrentFrame();
  const units = mode === "word" ? text.split(" ") : text.split("");
  const separator = mode === "word" ? " " : "";

  return (
    <div
      style={{
        fontSize,
        fontFamily,
        color,
        fontWeight,
        lineHeight: 1.3,
        ...style,
      }}
    >
      {units.map((unit, i) => {
        const unitStart = startFrame + i * framesPerUnit;
        const opacity = interpolate(
          frame,
          [unitStart, unitStart + framesPerUnit],
          [0, 1],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        );
        const translateY = interpolate(
          frame,
          [unitStart, unitStart + framesPerUnit],
          [8, 0],
          {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.out(Easing.cubic),
          }
        );

        return (
          <span
            key={i}
            style={{
              opacity,
              transform: `translateY(${translateY}px)`,
              display: "inline-block",
              marginRight: separator ? "0.3em" : 0,
            }}
          >
            {unit}
          </span>
        );
      })}
    </div>
  );
};
