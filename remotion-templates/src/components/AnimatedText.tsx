/**
 * AnimatedText — text that appears word-by-word or character-by-character.
 *
 * Cinematic overhaul v2:
 * - Weighted stagger: longer words/chars settle slower (more visual inertia)
 * - Eased stagger for Chinese: first chars arrive fast, last chars slow (logarithmic)
 * - Per-unit easing: configurable via easingPreset prop
 * - Increased vertical travel (24px), slight scale entrance (1.08 → 1.0)
 *
 * Usage:
 *   <AnimatedText text="Globalization is almost dead." startFrame={0} />
 *   <AnimatedText text="卡脖子" mode="character" startFrame={30} easedStagger />
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
  /** Enable eased (logarithmic) stagger spacing — fast start, slow finish. Best for Chinese terms. */
  easedStagger?: boolean;
  /** Easing curve for unit entrance. Defaults to cubic ease-out. */
  easingPreset?: "cubic" | "quintic" | "sine";
}

// Easing presets keyed by name
const easingMap = {
  cubic: Easing.out(Easing.cubic),
  quintic: Easing.out(Easing.poly(5)),
  sine: Easing.out(Easing.sin),
} as const;

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
  easedStagger = false,
  easingPreset = "cubic",
}) => {
  const frame = useCurrentFrame();
  const units = mode === "word" ? text.split(" ") : text.split("");
  const separator = mode === "word" ? " " : "";
  const easing = easingMap[easingPreset] || easingMap.cubic;

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
        // ── Eased stagger: logarithmic spacing (fast→slow) ──
        // For Chinese characters, early chars arrive quickly, later chars decelerate.
        // Creates a "discovering the word" feel vs uniform typewriter.
        let unitStart: number;
        if (easedStagger && units.length > 1) {
          // Logarithmic curve: more time between later characters
          const normalizedIndex = i / (units.length - 1); // 0→1
          const easedIndex = Math.pow(normalizedIndex, 0.6); // <1 power = front-loaded
          const totalStaggerFrames = (units.length - 1) * framesPerUnit;
          unitStart = startFrame + easedIndex * totalStaggerFrames;
        } else {
          unitStart = startFrame + i * framesPerUnit;
        }

        // ── Weighted settle: longer units take more time to "land" ──
        // A 10-char word has ~50% more settle time than a 2-char word.
        // This creates visual inertia — heavier words feel heavier.
        const unitLength = unit.length;
        const weightFactor = mode === "word"
          ? 1 + unitLength * 0.04   // word mode: 4% per character
          : 1 + i * 0.03;           // char mode: 3% per position (later chars settle longer)
        const settleDuration = Math.max(framesPerUnit * 1.5 * weightFactor, 6);

        // ── Vertical travel scales with settle ──
        // Longer settle = slightly more travel distance (proportional feel)
        const travelDistance = 20 + (settleDuration / 12) * 4; // 20-28px range

        const opacity = interpolate(
          frame,
          [unitStart, unitStart + settleDuration],
          [0, 1],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        );

        const translateY = interpolate(
          frame,
          [unitStart, unitStart + settleDuration],
          [travelDistance, 0],
          {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing,
          }
        );

        // Scale entrance — words arrive slightly oversized and settle
        const scale = interpolate(
          frame,
          [unitStart, unitStart + settleDuration],
          [1.08, 1.0],
          {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing,
          }
        );

        return (
          <span
            key={i}
            style={{
              opacity,
              transform: `translateY(${translateY}px) scale(${scale})`,
              display: "inline-block",
              marginRight: separator ? "0.3em" : 0,
              transformOrigin: "center bottom",
            }}
          >
            {unit}
          </span>
        );
      })}
    </div>
  );
};
