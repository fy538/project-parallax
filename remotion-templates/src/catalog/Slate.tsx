/**
 * Slate — a 2-second mini title card shown before each catalog demo
 * inside the Showreel. Displays template name + variant slug.
 */

import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Easing,
} from "remotion";
import {
  fonts,
  fontSizes,
  fontWeights,
  letterSpacing,
} from "../design/theme";
import { useThemeMode } from "../hooks/useThemeMode";
import { Background } from "../components/Background";
import { BrandLockup } from "../components/BrandLockup";

interface SlateProps {
  category?: string;
  template: string;
  variant?: string;
}

export const Slate: React.FC<SlateProps> = ({ category, template, variant }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = useThemeMode();

  // Fade in across first 12 frames, hold, fade out across last 12
  const opacity = interpolate(
    frame,
    [0, fps * 0.4, fps * 1.6, fps * 2],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) }
  );

  const lineY = interpolate(
    frame,
    [0, fps * 0.5],
    [40, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) }
  );

  return (
    <AbsoluteFill>
      <Background />
      <AbsoluteFill
        style={{
          opacity,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: 80,
          gap: 24,
          transform: `translateY(${lineY}px)`,
        }}
      >
        {category && (
          <div
            style={{
              fontFamily: fonts.body,
              fontSize: fontSizes.meta,
              fontWeight: fontWeights.medium,
              color: t.text.muted,
              letterSpacing: letterSpacing.meta,
              textTransform: "uppercase",
            }}
          >
            {category}
          </div>
        )}
        <div
          style={{
            fontFamily: fonts.display,
            fontSize: fontSizes.h1,
            fontWeight: fontWeights.semibold,
            color: t.text.primary,
            letterSpacing: letterSpacing.h1,
            textAlign: "center",
          }}
        >
          {template}
        </div>
        {variant && (
          <div
            style={{
              fontFamily: fonts.data,
              fontSize: fontSizes.body,
              fontWeight: fontWeights.regular,
              color: t.text.accent,
              letterSpacing: letterSpacing.body,
            }}
          >
            {variant}
          </div>
        )}
        <div
          style={{
            marginTop: 32,
            width: 80,
            height: 1,
            background: t.text.muted,
            opacity: 0.5,
          }}
        />
        <div
          style={{
            fontFamily: fonts.body,
            fontSize: fontSizes.caption,
            color: t.text.muted,
            letterSpacing: letterSpacing.caption,
          }}
        >
          <BrandLockup>Parallax · catalog</BrandLockup>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

interface SectionDividerProps {
  category: string;
  description?: string;
}

export const SectionDivider: React.FC<SectionDividerProps> = ({
  category,
  description,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const t = useThemeMode();

  const opacity = interpolate(
    frame,
    [0, fps * 0.5, durationInFrames - fps * 0.5, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) }
  );

  const lineGrowth = interpolate(
    frame,
    [fps * 0.2, fps * 1.2],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) }
  );

  return (
    <AbsoluteFill>
      <Background />
      <AbsoluteFill
        style={{
          opacity,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: 80,
          gap: 32,
        }}
      >
        <div
          style={{
            fontFamily: fonts.display,
            fontSize: fontSizes.display,
            fontWeight: fontWeights.bold,
            color: t.text.primary,
            letterSpacing: letterSpacing.display,
            textTransform: "uppercase",
          }}
        >
          {category}
        </div>
        <div
          style={{
            width: 200 * lineGrowth,
            height: 2,
            background: t.text.accent,
          }}
        />
        {description && (
          <div
            style={{
              fontFamily: fonts.body,
              fontSize: fontSizes.body,
              color: t.text.secondary,
              letterSpacing: letterSpacing.body,
              textAlign: "center",
              maxWidth: 700,
            }}
          >
            {description}
          </div>
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
