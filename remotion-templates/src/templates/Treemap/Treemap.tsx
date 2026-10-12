/**
 * Treemap — part-to-whole area chart using the squarified layout algorithm.
 *
 * Squarify (Bruls, Huizing, van Wijk 2000) produces rectangles with aspect
 * ratios as close to 1:1 as possible, making the chart scannable at video
 * scrubbing speed. Items are sorted by value descending before layout.
 *
 * Each rectangle is a positioned <div> (not SVG) inside an AbsoluteFill
 * container. CSS absolute positioning gives us proper font rendering,
 * overflow: hidden clipping, and full access to the type system without
 * re-implementing text metrics in SVG.
 *
 * Animation: rectangles reveal staggered via opacity, starting after the
 * TitleBlock lands. Gold border on highlighted items.
 */

import React, { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import {
  palette,
  fonts,
  fontSizes,
  fontWeights,
  letterSpacing,
  layout,
  sec,
  radii,
} from "../../design/theme";
import { fadeIn, exitFade, stagger } from "../../utils/animation";
import { Background } from "../../components/Background";
import {
  analyticalBackgroundBase,
  resolveAnalyticalBackgroundVariant,
  transparentBackdropRequested,
} from "../../utils/segmentBackdrop";
import { TitleBlock } from "../../components/TitleBlock";
import { SourceAttribution } from "../../components/SourceAttribution";
import { HeaderStrip } from "../../components/HeaderStrip";
import { FooterStrip } from "../../components/FooterStrip";
import { useCompositionAnimation } from "../../hooks/useCompositionAnimation";
import { useDirection } from "../../hooks/useDirection";
import { useThemeMode } from "../../hooks/useThemeMode";
import { warnIf } from "../../utils/dataWarnings";
import type { TreemapData, TreemapRect } from "./types";

// ── Default color cycle ──────────────────────────────────────────────────────
// When item.color is not provided, cycle through these palette tokens.
// Order chosen for discriminability on both light and dark backgrounds.
const DEFAULT_COLORS: readonly string[] = [
  palette.dustblue,
  palette.gold,
  palette.umber,
  palette.walnut,
  palette.taupe,
  palette.midnight,
];

// ── Squarify layout algorithm ────────────────────────────────────────────────
// Based on Bruls, Huizing, van Wijk (2000) "Squarified Treemaps".
// This recursive split-based implementation is a close approximation: at each
// level it finds the split point that minimizes the worst-case aspect ratio
// for the first group, then recursively lays out the remainder. The result is
// near-square cells for typical data without requiring an external library.

interface LayoutRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface LayoutItem {
  label: string;
  value: number;
  color?: string;
  sublabel?: string;
  highlight?: boolean;
  originalIndex: number;
}

function squarify(
  items: Array<{ value: number; label: string; color?: string; sublabel?: string; highlight?: boolean }>,
  containerRect: LayoutRect
): TreemapRect[] {
  if (items.length === 0) return [];

  const totalValue = items.reduce((s, i) => s + i.value, 0);
  if (totalValue <= 0) return [];

  // Sort by value descending — squarify converges faster on sorted input.
  const sorted: LayoutItem[] = [...items]
    .map((item, idx) => ({ ...item, originalIndex: idx }))
    .sort((a, b) => b.value - a.value);

  const result: TreemapRect[] = [];

  function layout(items: LayoutItem[], rect: LayoutRect): void {
    if (items.length === 0) return;

    if (items.length === 1) {
      result.push({
        label: items[0].label,
        value: items[0].value,
        color: items[0].color,
        sublabel: items[0].sublabel,
        highlight: items[0].highlight,
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
      });
      return;
    }

    const localTotal = items.reduce((s, i) => s + i.value, 0);
    const isHorizontal = rect.width >= rect.height;

    // Find the split index that minimises the worst aspect ratio of the
    // first group. We scan from i=0 upward and stop when adding the next
    // item would worsen (or not improve) the ratio — a greedy one-pass
    // approach that is O(n) and produces results indistinguishable from
    // the full optimisation for the editorial use-case.
    let bestSplit = 1;
    let bestRatio = Infinity;
    let cumValue = 0;

    for (let i = 0; i < items.length - 1; i++) {
      cumValue += items[i].value;
      const fraction1 = cumValue / localTotal;
      const fraction2 = 1 - fraction1;
      if (fraction2 <= 0) break;

      // The "row" dimension perpendicular to the split direction.
      const groupDim = isHorizontal ? rect.width * fraction1 : rect.height * fraction1;
      const crossDim = isHorizontal ? rect.height : rect.width;

      // Worst aspect ratio of items in the first group.
      let maxRatio = 0;
      let groupCum = 0;
      for (let j = 0; j <= i; j++) {
        groupCum += items[j].value;
        const itemFrac = items[j].value / cumValue;
        const w = isHorizontal ? groupDim : crossDim * itemFrac;
        const h = isHorizontal ? crossDim * itemFrac : groupDim;
        if (w > 0 && h > 0) {
          const ratio = Math.max(w / h, h / w);
          if (ratio > maxRatio) maxRatio = ratio;
        }
      }

      if (maxRatio < bestRatio) {
        bestRatio = maxRatio;
        bestSplit = i + 1;
      }
    }

    // Split into two groups.
    const group1 = items.slice(0, bestSplit);
    const group2 = items.slice(bestSplit);
    const group1Value = group1.reduce((s, i) => s + i.value, 0);
    const fraction1 = group1Value / localTotal;

    // Lay out group1 items inside their strip.
    const groupDim1 = isHorizontal ? rect.width * fraction1 : rect.height * fraction1;
    const crossDim = isHorizontal ? rect.height : rect.width;

    let pos = isHorizontal ? rect.y : rect.x;
    for (const item of group1) {
      const frac = item.value / group1Value;
      const w = isHorizontal ? groupDim1 : crossDim * frac;
      const h = isHorizontal ? crossDim * frac : groupDim1;
      const x = isHorizontal ? rect.x : pos;
      const y = isHorizontal ? pos : rect.y;
      result.push({
        label: item.label,
        value: item.value,
        color: item.color,
        sublabel: item.sublabel,
        highlight: item.highlight,
        x,
        y,
        width: w,
        height: h,
      });
      pos += isHorizontal ? h : w;
    }

    // Recurse on group2.
    if (group2.length > 0) {
      const rect2: LayoutRect = isHorizontal
        ? { x: rect.x + groupDim1, y: rect.y, width: rect.width - groupDim1, height: rect.height }
        : { x: rect.x, y: rect.y + groupDim1, width: rect.width, height: rect.height - groupDim1 };
      layout(group2, rect2);
    }
  }

  layout(sorted, containerRect);
  return result;
}

// ── Adaptive label sizing ────────────────────────────────────────────────────
// Returns CSS fontSize for a given cell area + dimensions.
function adaptiveFontSize(width: number, height: number): number {
  if (width > 200 && height > 100) return fontSizes.h2;
  if (width > 120 && height > 60) return fontSizes.body;
  return fontSizes.meta;
}

// ── Format value string ──────────────────────────────────────────────────────
function formatValue(value: number, prefix?: string, suffix?: string): string {
  const formatted = value.toLocaleString();
  return `${prefix ?? ""}${formatted}${suffix ?? ""}`;
}

// ── Component ────────────────────────────────────────────────────────────────

export const Treemap: React.FC<{ data: TreemapData }> = ({ data }) => {
  warnIf(
    data.items.length > 40,
    "Treemap",
    `${data.items.length} items — treemap reads cleanest at 5–20 items. ` +
      `Above 40, cells fragment to illegible slivers. Group small items into "Other".`
  );
  warnIf(
    data.items.length < 2,
    "Treemap",
    "Treemap requires at least 2 items. A single item is just a colored rectangle."
  );

  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const direction = useDirection(data._direction, "none");
  const { style: compStyle } = useCompositionAnimation(direction.driftOptions);
  const bgVariant = data.backgroundVariant ?? "light";
  const theme = useThemeMode(bgVariant);

  // ── Layout rectangle ───────────────────────────────────────────────────────
  // TitleBlock + HeaderStrip occupy the top ~180px; SourceAttribution + FooterStrip
  // take ~72px at the bottom. Leave 24px padding on all sides of the treemap itself.
  const TREEMAP_TOP = 180;
  const TREEMAP_BOTTOM_RESERVE = 72; // SourceAttribution + FooterStrip clearance
  const TREEMAP_PAD = 24;

  const tmX = TREEMAP_PAD;
  const tmY = TREEMAP_TOP;
  const tmW = layout.width - TREEMAP_PAD * 2;
  const tmH = layout.height - TREEMAP_TOP - TREEMAP_BOTTOM_RESERVE;

  // ── Color assignment ───────────────────────────────────────────────────────
  // Sort items by value descending (same order squarify uses) so that the
  // color cycle index is stable and the largest item always maps to color[0].
  const sortedForColor = useMemo(
    () => [...data.items].sort((a, b) => b.value - a.value),
    [data.items]
  );

  const colorByLabel = useMemo(() => {
    const map: Record<string, string> = {};
    sortedForColor.forEach((item, idx) => {
      map[item.label] =
        item.color ?? DEFAULT_COLORS[idx % DEFAULT_COLORS.length];
    });
    return map;
  }, [sortedForColor]);

  // ── Squarify layout ────────────────────────────────────────────────────────
  const rects = useMemo(() => {
    if (data.items.length === 0) return [];
    return squarify(
      data.items,
      { x: tmX, y: tmY, width: tmW, height: tmH }
    );
  }, [data.items, tmX, tmY, tmW, tmH]);

  // ── Timing ─────────────────────────────────────────────────────────────────
  // TitleBlock lands at ~sec(0.5); cells stagger from there.
  const cellEntranceBase = sec(0.5);
  const cellStagger = sec(0.04);
  const cellFadeDuration = sec(0.4);

  // Shared exit opacity — each cell multiplies by this to fade out cleanly.
  const exitOp = exitFade(frame, durationInFrames);

  const showValues = data.showValues !== false;

  return (
    <Background
      variant={resolveAnalyticalBackgroundVariant(
        analyticalBackgroundBase(data.backgroundVariant),
        transparentBackdropRequested(data)
      )}
      atmosphere={direction.atmosphere}
      atmosphereIntensity={direction.atmosphereIntensity}
    >
      <AbsoluteFill style={compStyle}>
        <HeaderStrip mode={bgVariant} metadata={data.episode} />
        <FooterStrip mode={bgVariant} />

        {/* Title block */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          <TitleBlock
            title={data.title}
            subtitle={data.subtitle}
            mode={bgVariant}
            safeAreaTier="generous"
            syncPoints={direction.syncPoints}
          />
        </div>

        {/* Treemap container — position: relative so cells can be absolute */}
        <div
          style={{
            position: "absolute",
            left: tmX,
            top: tmY,
            width: tmW,
            height: tmH,
            overflow: "hidden",
          }}
        >
          {rects.map((rect, idx) => {
            const isHighlighted =
              rect.highlight === true || rect.label === data.highlightLabel;
            const fillColor = colorByLabel[rect.label] ?? DEFAULT_COLORS[idx % DEFAULT_COLORS.length];
            const cellStart = cellEntranceBase + stagger(idx, cellStagger);
            const cellOpacity =
              fadeIn(frame, cellStart, cellFadeDuration) * exitOp;

            const fontSize = adaptiveFontSize(rect.width, rect.height);
            const showLabel = rect.width > 40 && rect.height > 28;
            const showSublabel = rect.width > 80 && rect.height > 56 && !!rect.sublabel;
            const showValue = showValues && rect.width > 60 && rect.height > 44;

            // Cell is offset relative to treemap container origin.
            const cellX = rect.x - tmX;
            const cellY = rect.y - tmY;

            return (
              <div
                key={`treemap-cell-${rect.label}-${idx}`}
                style={{
                  position: "absolute",
                  left: cellX,
                  top: cellY,
                  width: rect.width,
                  height: rect.height,
                  background: `${fillColor}D9`, // 85% opacity
                  opacity: cellOpacity,
                  border: isHighlighted
                    ? `2px solid ${palette.gold}`
                    : `1px solid rgba(0,0,0,0.12)`,
                  borderRadius: radii.xs,
                  overflow: "hidden",
                  boxSizing: "border-box",
                  pointerEvents: "none",
                }}
              >
                {showLabel && (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-start",
                      justifyContent: "flex-end",
                      padding: Math.min(10, rect.width * 0.05, rect.height * 0.05),
                      gap: 2,
                    }}
                  >
                    {/* Main label */}
                    <div
                      style={{
                        fontFamily: fonts.display,
                        fontSize,
                        fontWeight: fontWeights.bold,
                        color: palette.bone,
                        lineHeight: 1.15,
                        letterSpacing: fontSize >= fontSizes.h2
                          ? letterSpacing.h2
                          : fontSize >= fontSizes.body
                          ? letterSpacing.body
                          : letterSpacing.meta,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: fontSize <= fontSizes.meta ? "nowrap" : "normal",
                        maxWidth: "100%",
                        textShadow: "0 1px 3px rgba(0,0,0,0.4)",
                      }}
                    >
                      {rect.label}
                    </div>

                    {/* Sublabel */}
                    {showSublabel && (
                      <div
                        style={{
                          fontFamily: fonts.mono,
                          fontSize: fontSizes.caption,
                          fontWeight: fontWeights.regular,
                          color: palette.sand,
                          letterSpacing: letterSpacing.caption,
                          lineHeight: 1,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          maxWidth: "100%",
                          opacity: 0.85,
                        }}
                      >
                        {rect.sublabel}
                      </div>
                    )}

                    {/* Value */}
                    {showValue && (
                      <div
                        style={{
                          fontFamily: fonts.data,
                          fontSize: fontSizes.caption,
                          fontWeight: fontWeights.semibold,
                          color: palette.bone,
                          letterSpacing: letterSpacing.meta,
                          lineHeight: 1,
                          opacity: 0.9,
                        }}
                      >
                        {formatValue(rect.value, data.valuePrefix, data.valueSuffix)}
                      </div>
                    )}
                  </div>
                )}

                {/* Gold accent overlay for highlighted cells */}
                {isHighlighted && (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: `${palette.gold}15`,
                      pointerEvents: "none",
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>

        <SourceAttribution
          source={data.source}
          mode={bgVariant}
          prefix="Source: "
          startSec={1.5}
        />
      </AbsoluteFill>
    </Background>
  );
};
