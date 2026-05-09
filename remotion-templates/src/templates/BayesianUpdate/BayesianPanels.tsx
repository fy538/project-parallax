/**
 * Display sub-components for BayesianUpdate:
 *   EvidenceCard, AxisLabels, MarketPriceLine, HypothesisBar
 */

import React from "react";
import {
  palette,
  semantic,
  fonts,
  fontSizes,
  layout,
  shadows,
  radii,
} from "../../design/theme";
import { useThemeMode } from "../../hooks/useThemeMode";
import {
  fadeIn,
  heroSpring,
} from "../../utils/animation";
import { sec } from "../../design/theme";
import type { EvidenceItem } from "./types";

// ── Evidence card component ────────────────────────────────────────────────

export const EvidenceCard: React.FC<{
  item: EvidenceItem;
  index: number;
  frame: number;
  startFrame: number;
  theme: ReturnType<typeof useThemeMode>;
}> = React.memo(({ item, index, frame, startFrame, theme }) => {
  const opacity = fadeIn(frame, startFrame, sec(0.4));
  // Spring entrance instead of basic cubic slide
  const springVal = heroSpring(frame, layout.fps, startFrame);
  const offsetX = 60 * (1 - springVal);
  const cardScale = 0.85 + 0.15 * springVal;

  const isUp = item.direction === "up";
  const arrow = isUp ? "↑" : "↓";
  const cardColor = item.color || (isUp ? semantic.success : semantic.danger);

  return (
    <div
      style={{
        opacity,
        transform: `translateX(${offsetX}px) scale(${cardScale})`,
        transformOrigin: "left center",
        display: "flex",
        alignItems: "center",
        gap: layout.spacing.sm,
        marginBottom: layout.spacing.sm,
      }}
    >
      {/* Direction indicator */}
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          backgroundColor: `${cardColor}25`,
          border: `2px solid ${cardColor}60`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: fontSizes.body,
          color: cardColor,
          fontWeight: 700,
          flexShrink: 0,
          boxShadow: shadows.accentGlow(cardColor),
        }}
      >
        {arrow}
      </div>

      {/* Label */}
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontSize: fontSizes.caption,
            color: theme.text.primary,
            fontWeight: 500,
            lineHeight: 1.3,
            textShadow: shadows.textLift,
          }}
        >
          {item.label}
        </div>
        {item.source && (
          <div
            style={{
              fontSize: fontSizes.meta,
              color: theme.text.muted,
              marginTop: 2,
              fontFamily: fonts.mono,
              textShadow: shadows.textLift,
            }}
          >
            {item.source}
          </div>
        )}
      </div>

      {/* Magnitude dots */}
      <div style={{ display: "flex", gap: 3, flexShrink: 0 }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              backgroundColor:
                i < item.magnitude ? cardColor : `${theme.text.muted}30`,
            }}
          />
        ))}
      </div>
    </div>
  );
});

// ── Probability axis labels ────────────────────────────────────────────────

export const AxisLabels: React.FC<{
  width: number;
  theme: ReturnType<typeof useThemeMode>;
}> = React.memo(({ width, theme }) => {
  const ticks = [0, 25, 50, 75, 100];
  return (
    <div
      style={{
        position: "relative",
        width,
        height: fontSizes.label,
        marginTop: layout.spacing.xs,
      }}
    >
      {ticks.map((tick) => (
        <div
          key={tick}
          style={{
            position: "absolute",
            left: (tick / 100) * width - 16,
            width: 32,
            textAlign: "center",
            fontSize: fontSizes.meta,
            color: theme.text.muted,
            fontFamily: fonts.data,
            textShadow: shadows.textLift,
          }}
        >
          {tick}%
        </div>
      ))}
    </div>
  );
});

// ── Market price reference line ────────────────────────────────────────────

export const MarketPriceLine: React.FC<{
  price: number;
  label: string;
  width: number;
  height: number;
  frame: number;
  theme: ReturnType<typeof useThemeMode>;
}> = React.memo(({ price, label, width, height, frame, theme }) => {
  const x = (price / 100) * width;
  const lineOpacity = fadeIn(frame, sec(0.5), sec(0.6));

  return (
    <g opacity={lineOpacity}>
      <line
        x1={x}
        y1={0}
        x2={x}
        y2={height}
        stroke={palette.amber}
        strokeWidth={2}
        strokeDasharray="6 4"
        opacity={0.7}
      />
      <text
        x={x}
        y={-8}
        textAnchor="middle"
        fill={palette.amber}
        fontSize={fontSizes.meta}
        fontFamily={fonts.data}
      >
        {label} {price}%
      </text>
    </g>
  );
});

// ── Multi-hypothesis bar component ────────────────────────────────────────

export interface HypothesisBarProps {
  label: string;
  probability: number;
  color: string;
  theme: ReturnType<typeof useThemeMode>;
}

export const HypothesisBar: React.FC<HypothesisBarProps & { isLeading?: boolean }> = React.memo(
  ({ label, probability, color, theme, isLeading = false }) => {
    const barWidth = `${probability}%`;

    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: layout.spacing.md,
          marginBottom: layout.spacing.md,
        }}
      >
        {/* Label */}
        <div
          style={{
            width: 160,
            flexShrink: 0,
            fontSize: fontSizes.caption,
            color: isLeading ? theme.text.primary : theme.text.secondary,
            fontFamily: fonts.mono,
            fontWeight: isLeading ? 600 : 400,
            textShadow: shadows.textLift,
          }}
        >
          {label}
        </div>

        {/* Bar container and bar */}
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            position: "relative",
            height: 28,
            backgroundColor: `${theme.text.muted}25`,
            borderRadius: `${radii.sm}px ${radii.sm}px 0 0`,
            overflow: "hidden",
            border: `1px solid ${theme.text.muted}30`,
            boxShadow: `inset 0 1px 2px rgba(0,0,0,0.08)`, // pol-10-ok: inset groove — no token equivalent
          }}
        >
          {/* Bar fill — vertical gradient + transition */}
          <div
            style={{
              width: barWidth,
              height: "100%",
              background: `linear-gradient(180deg, ${color}E0 0%, ${color} 100%)`,
              borderRadius: `${radii.sm}px ${radii.sm}px 0 0`,
              transition: "width 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)",
              boxShadow: isLeading
                ? `0 0 14px ${color}70, inset 0 -1px 2px rgba(0,0,0,0.18)`
                : `0 0 8px ${color}40, inset 0 -1px 2px rgba(0,0,0,0.18)`,
            }}
          />
          {/* Specular highlight on top edge */}
          {probability > 1 && (
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 1,
                height: 1.5,
                width: barWidth,
                background: `linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.55) 30%, rgba(255,255,255,0.7) 50%, rgba(255,255,255,0.55) 70%, transparent 100%)`,
                pointerEvents: "none",
                transition: "width 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)",
              }}
            />
          )}
        </div>

        {/* Percentage */}
        <div
          style={{
            width: 50,
            flexShrink: 0,
            textAlign: "right",
            fontSize: fontSizes.caption,
            color: color,
            fontWeight: 600,
            fontFamily: fonts.data,
            textShadow: isLeading
              ? `0 0 8px ${color}60, ${shadows.textLift}`
              : shadows.textLift,
          }}
        >
          {Math.round(probability)}%
        </div>
      </div>
    );
  }
);
