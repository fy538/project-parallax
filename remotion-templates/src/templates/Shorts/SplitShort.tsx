/**
 * SplitShort — vertical 9:16 split comparison for Shorts.
 *
 * Uses ShortsWrapper + useVerticalLayout for systematic vertical
 * adaptation. Horizontal split (top vs bottom) instead of vertical.
 * Same data schema as SplitComposition.
 *
 * Series: "Both Sides Are Wrong"
 */

import React from "react";
import {
  palette,
  fonts,
  fontWeights,
} from "../../design/theme";
import { fadeIn, slideIn } from "../../utils/animation";
import { ShortsWrapper } from "../../components/ShortsWrapper";
import type { SplitCompositionData, SplitSide } from "../SplitComposition/types";

// ── Helper ──────────────────────────────────────────────────────────────

const hasChinese = (text: string): boolean => /[一-鿿]/.test(text);

// ── Side renderer ───────────────────────────────────────────────────────

const SideContent: React.FC<{
  side: SplitSide;
  frame: number;
  exit: number;
  baseDelay: number;
  vl: any;
  theme: any;
}> = ({ side, frame, exit, baseDelay, vl, theme }) => {
  const accent = side.accentColor || palette.amber;

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: `${vl.spacing.xl}px ${vl.safeArea.left}px`,
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
            fontSize: vl.fontSizes.caption,
            fontFamily: fonts.body,
            fontWeight: fontWeights.medium,
            color: accent,
            letterSpacing: 3,
            textTransform: "uppercase",
            marginBottom: vl.spacing.sm,
            opacity: fadeIn(frame, baseDelay, 6) * exit,
            transform: `translateY(${slideIn(frame, baseDelay, 8, 6)}px)`,
          }}
        >
          {side.tag}
        </div>
      )}

      {/* Title */}
      <div
        style={{
          fontSize: vl.fontSizes.h2,
          fontFamily: hasChinese(side.title) ? fonts.chinese : fonts.display,
          fontWeight: fontWeights.bold,
          color: theme.text.primary,
          lineHeight: 1.2,
          opacity: fadeIn(frame, baseDelay + 4, 8) * exit,
          transform: `translateY(${slideIn(frame, baseDelay + 4, 15, 8)}px)`,
          textShadow: theme.textShadow,
        }}
      >
        {side.title}
      </div>

      {/* Items */}
      {side.items.map((item, i) => (
        <div
          key={i}
          style={{
            fontSize: vl.fontSizes.label,
            fontFamily: hasChinese(item) ? fonts.chinese : fonts.body,
            color: theme.text.secondary,
            marginTop: i === 0 ? vl.spacing.md : vl.spacing.sm,
            opacity: fadeIn(frame, baseDelay + 12 + i * 5, 6) * exit,
            transform: `translateY(${slideIn(frame, baseDelay + 12 + i * 5, 10, 6)}px)`,
            lineHeight: 1.4,
            textShadow: theme.textShadow,
          }}
        >
          {item}
        </div>
      ))}
    </div>
  );
};

// ── Main component ──────────────────────────────────────────────────────

export const SplitShort: React.FC<{ data: SplitCompositionData }> = ({
  data,
}) => {
  const dividerLabel = data.dividerLabel || "vs";

  return (
    <ShortsWrapper
      title={data.title}
      mode={data.backgroundVariant}
    >
      {(vl, theme, frame, exit) => (
        <>
          {/* Split content area */}
          <div
            style={{
              position: "absolute",
              top: vl.contentTop - 40,
              left: 0,
              right: 0,
              bottom: vl.safeArea.bottom + 20,
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Top side */}
            <SideContent
              side={data.left}
              frame={frame}
              exit={exit}
              baseDelay={8}
              vl={vl}
              theme={theme}
            />

            {/* Horizontal divider */}
            {!data.noDivider && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: `${vl.spacing.sm}px ${vl.spacing.xxl}px`,
                  position: "relative",
                }}
              >
                <div
                  style={{
                    flex: 1,
                    height: 1,
                    background: `linear-gradient(to right, transparent, ${theme.text.muted}60)`,
                    opacity: fadeIn(frame, 25, 8) * exit,
                  }}
                />
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    border: `1px solid ${theme.text.muted}40`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: `0 ${vl.spacing.md}px`,
                    opacity: fadeIn(frame, 28, 6) * exit,
                  }}
                >
                  <span
                    style={{
                      fontSize: vl.fontSizes.caption,
                      fontFamily: fonts.body,
                      fontWeight: fontWeights.medium,
                      color: theme.text.accent,
                      letterSpacing: 1,
                      textTransform: "uppercase",
                    }}
                  >
                    {dividerLabel}
                  </span>
                </div>
                <div
                  style={{
                    flex: 1,
                    height: 1,
                    background: `linear-gradient(to left, transparent, ${theme.text.muted}60)`,
                    opacity: fadeIn(frame, 25, 8) * exit,
                  }}
                />
              </div>
            )}

            {/* Bottom side */}
            <SideContent
              side={data.right}
              frame={frame}
              exit={exit}
              baseDelay={32}
              vl={vl}
              theme={theme}
            />
          </div>

          {/* Source */}
          {data.source && (
            <div
              style={{
                position: "absolute",
                bottom: vl.safeArea.bottom - 20,
                left: vl.safeArea.left,
                right: vl.safeArea.right,
                textAlign: "center",
                fontSize: vl.fontSizes.caption,
                fontFamily: fonts.body,
                color: theme.text.muted,
                opacity: fadeIn(frame, 40, 8) * exit,
                textShadow: theme.textShadow,
              }}
            >
              {data.source}
            </div>
          )}
        </>
      )}
    </ShortsWrapper>
  );
};
