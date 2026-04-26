/**
 * SplitShort — vertical 9:16 split comparison for Shorts.
 *
 * Optimized for "Both Sides Are Wrong" series.
 * Horizontal split (top vs bottom) instead of vertical split.
 * Same data schema as SplitComposition.
 */

import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  Easing,
} from "remotion";
import {
  palette,
  dark,
  semantic,
  fonts,
  fontSizes,
  fontWeights,
  letterSpacing,
  layout,
  sec,
  durations,
} from "../../design/theme";
import { fadeIn, slideIn, stagger } from "../../utils/animation";
import { Background } from "../../components/Background";
import { useCompositionAnimation } from "../../hooks/useCompositionAnimation";
import type { SplitCompositionData, SplitSide } from "../SplitComposition/types";
import { shortsLayout } from "./types";

// ── Helper: detect Chinese characters ─────────────────────────────────────

const hasChinese = (text: string): boolean => /[一-鿿]/.test(text);

// ── Side renderer ─────────────────────────────────────────────────────────

const SideContent: React.FC<{
  side: SplitSide;
  frame: number;
  baseDelay: number;
  position: "top" | "bottom";
}> = ({ side, frame, baseDelay, position }) => {
  const accent = side.accentColor || palette.amber;

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: `32px ${shortsLayout.safeArea.left}px`,
        position: "relative",
      }}
    >
      {/* Tint overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: accent,
          opacity: 0.05,
          pointerEvents: "none",
        }}
      />

      {/* Tag */}
      {side.tag && (
        <div
          style={{
            fontSize: 14,
            fontFamily: fonts.body,
            fontWeight: fontWeights.medium,
            color: accent,
            letterSpacing: 3,
            textTransform: "uppercase",
            marginBottom: 12,
            opacity: fadeIn(frame, baseDelay, 6),
          }}
        >
          {side.tag}
        </div>
      )}

      {/* Title */}
      <div
        style={{
          fontSize: 32,
          fontFamily: hasChinese(side.title) ? fonts.chinese : fonts.display,
          fontWeight: fontWeights.bold,
          color: dark.text.primary,
          lineHeight: 1.2,
          opacity: fadeIn(frame, baseDelay + 4, 8),
          transform: `translateY(${slideIn(frame, baseDelay + 4, 15, 8)}px)`,
        }}
      >
        {side.title}
      </div>

      {/* Items */}
      {side.items.map((item, i) => (
        <div
          key={i}
          style={{
            fontSize: 20,
            fontFamily: hasChinese(item) ? fonts.chinese : fonts.body,
            color: dark.text.secondary,
            marginTop: i === 0 ? 16 : 10,
            opacity: fadeIn(frame, baseDelay + 12 + i * 5, 6),
            lineHeight: 1.4,
          }}
        >
          {item}
        </div>
      ))}
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────

export const SplitShort: React.FC<{ data: SplitCompositionData }> = ({
  data,
}) => {
  const frame = useCurrentFrame();
  const { style: compStyle } = useCompositionAnimation({ noDrift: true });

  const dividerLabel = data.dividerLabel || "vs";

  return (
    <Background variant={data.backgroundVariant || "dark"}>
      <AbsoluteFill style={compStyle}>
        {/* Title */}
        {data.title && (
          <div
            style={{
              position: "absolute",
              top: shortsLayout.safeArea.top,
              left: shortsLayout.safeArea.left,
              right: shortsLayout.safeArea.right,
              textAlign: "center",
              fontSize: 28,
              fontFamily: fonts.display,
              fontWeight: fontWeights.bold,
              color: dark.text.primary,
              letterSpacing: letterSpacing.h3,
              opacity: fadeIn(frame, 0, 8),
            }}
          >
            {data.title}
          </div>
        )}

        {/* Split content area */}
        <div
          style={{
            position: "absolute",
            top: shortsLayout.contentTop - 40,
            left: 0,
            right: 0,
            bottom: shortsLayout.safeArea.bottom + 20,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Top side */}
          <SideContent
            side={data.left}
            frame={frame}
            baseDelay={8}
            position="top"
          />

          {/* Horizontal divider */}
          {!data.noDivider && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "8px 48px",
                position: "relative",
              }}
            >
              {/* Left line */}
              <div
                style={{
                  flex: 1,
                  height: 1,
                  background: `linear-gradient(to right, transparent, ${dark.text.muted}60)`,
                  opacity: fadeIn(frame, 25, 8),
                }}
              />

              {/* Label circle */}
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  border: `1px solid ${dark.text.muted}40`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 16px",
                  opacity: fadeIn(frame, 28, 6),
                }}
              >
                <span
                  style={{
                    fontSize: 14,
                    fontFamily: fonts.body,
                    fontWeight: fontWeights.medium,
                    color: dark.text.accent,
                    letterSpacing: 1,
                    textTransform: "uppercase",
                  }}
                >
                  {dividerLabel}
                </span>
              </div>

              {/* Right line */}
              <div
                style={{
                  flex: 1,
                  height: 1,
                  background: `linear-gradient(to left, transparent, ${dark.text.muted}60)`,
                  opacity: fadeIn(frame, 25, 8),
                }}
              />
            </div>
          )}

          {/* Bottom side */}
          <SideContent
            side={data.right}
            frame={frame}
            baseDelay={32}
            position="bottom"
          />
        </div>

        {/* Source */}
        {data.source && (
          <div
            style={{
              position: "absolute",
              bottom: shortsLayout.safeArea.bottom - 20,
              left: shortsLayout.safeArea.left,
              right: shortsLayout.safeArea.right,
              textAlign: "center",
              fontSize: 13,
              fontFamily: fonts.body,
              color: dark.text.muted,
              opacity: fadeIn(frame, 40, 8),
            }}
          >
            {data.source}
          </div>
        )}
      </AbsoluteFill>
    </Background>
  );
};
