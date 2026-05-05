/**
 * Legend — shared legend/key component for data visualization templates.
 *
 * Renders color swatches + labels in horizontal or vertical layout.
 * Mode-aware via useThemeMode. Supports animated entrance.
 *
 * Used by: DataChart, RadarChart, EscalationLadder, TimeSeriesChart (optional).
 *
 * Design contract:
 *   - BRAND.md: Uses fontSizes.caption/label, fonts.body for labels
 *   - POLISH.md L14: Mode-aware colors via ThemeTokens
 *   - POLISH.md L12: Uses shadows.textLift for readability
 */

import React from "react";
import { fonts, fontSizes, fontWeights } from "../design/theme";
import { fadeIn, slideIn } from "../utils/animation";
import type { ThemeTokens } from "../hooks/useThemeMode";

// ── Types ────────────────────────────────────────────────────────────────────

export interface LegendItem {
  /** Display label */
  label: string;
  /** Swatch color (hex or palette token) */
  color: string;
}

export type LegendLayout = "horizontal" | "vertical";
export type SwatchShape = "square" | "circle" | "rounded" | "line" | "dot";

export interface LegendProps {
  /** Legend entries */
  items: LegendItem[];
  /** Current frame for animation */
  frame: number;
  /** Exit opacity multiplier (from composition animation) */
  exit: number;
  /** Theme tokens from useThemeMode */
  theme: ThemeTokens;
  /** Layout direction. Default: "horizontal" */
  layout?: LegendLayout;
  /** Swatch shape. Default: "rounded" (square with border-radius) */
  swatchShape?: SwatchShape;
  /** Swatch size in px. Default: 14 */
  swatchSize?: number;
  /** Gap between items in px. Default: layout.spacing.md (24) */
  gap?: number;
  /** Frame at which legend starts fading in. Default: 0 */
  startFrame?: number;
  /** Fade-in duration in frames. Default: 15 (~0.5s) */
  fadeInDuration?: number;
  /** Whether to stagger item entrances. Default: false */
  stagger?: boolean;
  /** Stagger delay between items in frames. Default: 4 */
  staggerDelay?: number;
  /** Font size key. Default: "caption" */
  fontSize?: "caption" | "label" | "body" | "meta";
  /** Override text color. Default: theme.text.muted */
  textColor?: string;
  /** Override label font weight. Default: fontWeights.medium */
  fontWeight?: number;
  /** Additional inline style for the container */
  style?: React.CSSProperties;
}

// ── Swatch rendering ─────────────────────────────────────────────────────────

const getSwatchStyle = (
  color: string,
  size: number,
  shape: SwatchShape
): React.CSSProperties => {
  // Line variant: thin horizontal stroke (for line-chart legends)
  if (shape === "line") {
    return {
      width: size * 1.6,
      height: 2,
      backgroundColor: color,
      borderRadius: 1,
      flexShrink: 0,
      boxShadow: `0 0 6px ${color}50`,
    };
  }
  // Dot variant: small accent dot with halo
  if (shape === "dot") {
    return {
      width: size * 0.6,
      height: size * 0.6,
      backgroundColor: color,
      borderRadius: "50%",
      flexShrink: 0,
      boxShadow: `0 0 6px ${color}70, 0 0 1px ${color}`,
    };
  }
  // Filled swatches with subtle drop shadow + gradient overlay for cinematic feel
  return {
    width: size,
    height: size,
    background: `linear-gradient(180deg, ${color}E8 0%, ${color} 100%)`,
    borderRadius: shape === "circle" ? size / 2 : shape === "rounded" ? 3 : 0,
    flexShrink: 0,
    boxShadow: `0 1px 2px rgba(0,0,0,0.18), inset 0 -1px 1px rgba(0,0,0,0.15), 0 0 6px ${color}40`,
  };
};

// ── Component ────────────────────────────────────────────────────────────────

export const Legend: React.FC<LegendProps> = ({
  items,
  frame,
  exit,
  theme,
  layout: legendLayout = "horizontal",
  swatchShape = "rounded",
  swatchSize = 14,
  gap,
  startFrame = 0,
  fadeInDuration = 15,
  stagger = false,
  staggerDelay = 4,
  fontSize = "caption",
  textColor,
  fontWeight = fontWeights.medium,
  style,
}) => {
  const resolvedGap =
    gap ?? (legendLayout === "horizontal" ? 20 : 12);
  const resolvedTextColor = textColor ?? theme.text.muted;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: legendLayout === "horizontal" ? "row" : "column",
        gap: resolvedGap,
        alignItems:
          legendLayout === "horizontal" ? "center" : "flex-start",
        ...style,
      }}
    >
      {items.map((item, i) => {
        const itemStart = stagger ? startFrame + i * staggerDelay : startFrame;
        const itemOpacity = fadeIn(frame, itemStart, fadeInDuration) * exit;
        const itemY = stagger ? slideIn(frame, itemStart, 8, fadeInDuration) : 0;

        return (
          <div
            key={i}
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              opacity: itemOpacity,
              transform: stagger ? `translateY(${itemY}px)` : undefined,
            }}
          >
            <div style={getSwatchStyle(item.color, swatchSize, swatchShape)} />
            <span
              style={{
                fontSize: fontSizes[fontSize],
                fontFamily: fonts.body,
                fontWeight,
                color: resolvedTextColor,
                whiteSpace: "nowrap",
                textShadow: theme.textShadow,
              }}
            >
              {item.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};

/**
 * Catalog metadata for Legend component.
 * Used by visual-spec and documentation tools.
 */
export const LEGEND_CATALOG = {
  name: "Legend",
  description: "Shared legend/key for data visualization templates",
  layouts: ["horizontal", "vertical"] as const,
  swatchShapes: ["square", "circle", "rounded"] as const,
  fontSizes: ["caption", "label", "body", "meta"] as const,
} as const;
