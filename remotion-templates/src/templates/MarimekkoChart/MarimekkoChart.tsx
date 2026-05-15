/**
 * MarimekkoChart — variable-width stacked columns where BOTH axes encode
 * magnitude.
 *
 * Width of each column = first dimension (e.g., country's share of total).
 * Height-stack within column = second dimension breakdown (e.g., energy mix).
 * Every cell's area encodes column.width × segment.value, so the eye reads
 * "fossil fuel's share of total G7 energy" as a single visual fact.
 *
 * Layout pass:
 *   1. Normalize column widths so they sum to chart width (percent mode)
 *      or scale by max-width (absolute mode).
 *   2. Per column, normalize segments to sum to chart height (percent mode)
 *      or to the column's own total (absolute mode).
 *   3. Render as a wall of tiles: thin paper-color gaps between columns
 *      and between segments give the Mondrian / Marimekko feel.
 *
 * Animation: columns appear left-to-right with stagger; within each
 * column, segments grow from baseline upward and fade in. Column labels
 * settle after the column's segments. Width-percent labels at the bottom
 * fade in last.
 */

import React, { useMemo } from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
} from "remotion";
import {
  palette,
  fonts,
  fontSizes,
  letterSpacing,
  layout,
  sec,
  contentArea,
  textMaxWidth,
} from "../../design/theme";
import {
  fadeIn,
  stagger,
  exitFade,
  CLAMP_CUBIC,
} from "../../utils/animation";
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
import type { MarimekkoChartData } from "./types";

// ── Color ramp for auto-assigned segment fills ───────────────────────────
// Order matters: first segment in any column maps to ramp[0], second to
// ramp[1], etc. This keeps "first/dominant slice" consistent across columns
// even when `segmentColorMap` isn't provided.
const FALLBACK_SEGMENT_RAMP: readonly string[] = [
  palette.rust,
  palette.gold,
  palette.umber,
  palette.walnut,
  palette.taupe,
  palette.sand,
];

// Minimum cell area (in CSS px²) below which the in-cell label is omitted.
// Empirically chosen so labels stay legible on a 1920×1080 canvas — a
// 60×80 = 4800 px² cell can comfortably hold a short label; below that
// the text either truncates or overlaps the divider.
const LABEL_AREA_THRESHOLD = 6500;

// Minimum cell dimensions for the label to attempt rendering — even when
// area passes, a sliver-shaped cell can't host horizontal text.
const LABEL_MIN_WIDTH = 70;
const LABEL_MIN_HEIGHT = 36;

/**
 * Format the width-percent stamp and any numeric value labels using
 * `valueFormat`. Returns the formatted string.
 *   - `"percent"` / `"%"`: confirm percent mode (default behavior).
 *   - anything else: treat as a unit suffix appended to the number.
 */
function applyValueFormat(numericValue: number, valueFormat?: string): string {
  if (!valueFormat || valueFormat === "percent" || valueFormat === "%") {
    return `${numericValue}% of total`;
  }
  return `${numericValue} ${valueFormat}`;
}

// When `emphasisKey` is set, non-emphasized segments multiply their base
// cell opacity by this factor. 0.45 lands in the dossier-recommended
// 0.4–0.6 muted register — readable as context, clearly demoted against
// the full-saturation accent band. Chosen over a color remap (to
// palette.bone / palette.taupe) because opacity multiplication preserves
// the `segmentColorMap` intent: cross-column color identity still tracks,
// just at a lower visual weight.
const MUTED_OPACITY_FACTOR = 0.45;

export const MarimekkoChart: React.FC<{ data: MarimekkoChartData }> = ({
  data,
}) => {
  warnIf(
    data.columns.length > 10,
    "MarimekkoChart",
    `${data.columns.length} columns — chart reads cleanest at 4–8 columns. ` +
      `Above 10, label collisions and tile fragmentation overwhelm the ` +
      `two-dimensional reading. Consider grouping smaller columns into "Other".`,
  );
  const segCounts = data.columns.map((c) => c.segments.length);
  const maxSegs = Math.max(...segCounts);
  warnIf(
    maxSegs > 6,
    "MarimekkoChart",
    `${maxSegs} segments per column — Marimekko works best at 3–5 segments. ` +
      `More than 6 segments creates tile fragmentation that destroys the ` +
      `two-dimensional reading. Group small segments into "Other".`,
  );

  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const direction = useDirection(data._direction);
  const { style: compStyle } = useCompositionAnimation(direction.driftOptions);
  const bgVariant = data.backgroundVariant ?? "light";
  const theme = useThemeMode(bgVariant);

  const widthMode = data.widthMode ?? "percent";

  // ── Layout rectangle ───────────────────────────────────────────────────
  const area = useMemo(() => contentArea("content", "generous"), []);
  // Reserve vertical strips for column labels above and width-percent
  // labels below the tile wall.
  const columnLabelBlock = 64; // label + sublabel above each column
  const widthLabelBlock = 36; // "32% of total" stamp under each column
  const wallTop = area.top + columnLabelBlock;
  const wallBottom = area.top + area.height - widthLabelBlock;
  const wallHeight = wallBottom - wallTop;
  const wallLeft = area.left;
  const wallWidth = area.width;

  // ── Column width pass ──────────────────────────────────────────────────
  // Percent mode: normalize widths so they sum to wallWidth.
  // Absolute mode: scale so the largest column hits a target fraction of
  // wallWidth (we still need a horizontal scale; "absolute" preserves
  // proportions but anchors to the widest column).
  const widthMax = useMemo(
    () => Math.max(...data.columns.map((c) => c.width), 0),
    [data.columns],
  );
  const columnLayouts = useMemo(() => {
    const widthSum = data.columns.reduce((s, c) => s + c.width, 0);
    // Reserve 2px gutter between adjacent columns (n-1 gaps).
    const gutterX = 2;
    const totalGutter = gutterX * Math.max(0, data.columns.length - 1);
    const usableWidth = wallWidth - totalGutter;

    let cursorX = wallLeft;
    return data.columns.map((column) => {
      const widthFrac =
        widthMode === "percent"
          ? column.width / Math.max(widthSum, 1)
          : column.width / Math.max(widthMax, 1);
      // In absolute mode, the chart may not fill horizontally — that's
      // intentional ("the smaller economies don't stretch to fill the slot").
      const cellWidth =
        widthMode === "percent"
          ? widthFrac * usableWidth
          : widthFrac * usableWidth;

      // Segment-height normalization for this column.
      const segValueSum = column.segments.reduce((s, seg) => s + seg.value, 0);
      const denominator =
        widthMode === "percent"
          ? segValueSum // each column → 100%
          : segValueSum; // both modes normalize per-column vertically; the
      // width axis is the only one that varies between modes for this template
      // (per-column composition is always read as 100%).

      // Reserve 2px gutter between segments within a column.
      const gutterY = 2;
      const segGutter = gutterY * Math.max(0, column.segments.length - 1);
      const usableHeight = wallHeight - segGutter;

      let cursorY = wallTop;
      const segments = column.segments.map((seg) => {
        const heightFrac = seg.value / Math.max(denominator, 1);
        const cellHeight = heightFrac * usableHeight;
        const layoutSeg = {
          ...seg,
          x: cursorX,
          y: cursorY,
          width: cellWidth,
          height: cellHeight,
          shareWidth: widthFrac, // for the "32% of total" stamp
        };
        cursorY += cellHeight + gutterY;
        return layoutSeg;
      });

      const layoutCol = {
        ...column,
        x: cursorX,
        cellWidth,
        shareWidth: widthFrac,
        segments,
      };
      cursorX += cellWidth + gutterX;
      return layoutCol;
    });
  }, [data.columns, widthMode, wallLeft, wallWidth, wallTop, wallHeight]);

  // ── Color resolution ───────────────────────────────────────────────────
  // Build a stable key → color map. Explicit segmentColorMap wins; then
  // segment.color; then the fallback ramp keyed by the segment's first
  // appearance order across columns.
  const segmentColorByKey = useMemo(() => {
    const map: Record<string, string> = {};
    const orderedKeys: string[] = [];
    data.columns.forEach((col) => {
      col.segments.forEach((seg) => {
        if (!orderedKeys.includes(seg.key)) orderedKeys.push(seg.key);
      });
    });
    orderedKeys.forEach((key, idx) => {
      // Priority: explicit map → first non-empty segment.color encountered
      //           → fallback ramp.
      const explicit = data.segmentColorMap?.[key];
      if (explicit) {
        map[key] = explicit;
        return;
      }
      let fromSegment: string | undefined;
      for (const col of data.columns) {
        const hit = col.segments.find((s) => s.key === key && s.color);
        if (hit?.color) {
          fromSegment = hit.color;
          break;
        }
      }
      map[key] =
        fromSegment ??
        FALLBACK_SEGMENT_RAMP[idx % FALLBACK_SEGMENT_RAMP.length];
    });
    return map;
  }, [data.columns, data.segmentColorMap]);

  // Legend: ordered list of unique keys with their label + color.
  const legendItems = useMemo(() => {
    const seen = new Set<string>();
    const items: { key: string; label: string; color: string }[] = [];
    data.columns.forEach((col) => {
      col.segments.forEach((seg) => {
        if (!seen.has(seg.key)) {
          seen.add(seg.key);
          items.push({
            key: seg.key,
            label: seg.label,
            color: segmentColorByKey[seg.key],
          });
        }
      });
    });
    return items;
  }, [data.columns, segmentColorByKey]);

  // ── Timing ─────────────────────────────────────────────────────────────
  const columnStart = sec(0.6);
  const perColumn = sec(0.15);
  const segmentReveal = sec(0.5);
  const labelReveal = sec(0.35);
  const legendStart = sec(1.4);
  const exitOp = exitFade(frame, durationInFrames, 15);

  return (
    <Background
      variant={resolveAnalyticalBackgroundVariant(
        analyticalBackgroundBase(data.backgroundVariant),
        transparentBackdropRequested(data),
      )}
      tint={direction.backgroundTint ?? data.backgroundTint}
      atmosphere={direction.atmosphere}
      atmosphereIntensity={direction.atmosphereIntensity}
    >
      <AbsoluteFill style={compStyle}>
        <HeaderStrip mode={bgVariant} metadata={data.episode} />
        <FooterStrip mode={bgVariant} />

        <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          <TitleBlock
            title={data.title}
            subtitle={data.subtitle}
            mode={bgVariant}
            safeAreaTier="generous"
            syncPoints={direction.syncPoints}
          />
        </div>

        {/* ── Tile wall ──────────────────────────────────────────────────
            One <div> per cell. SVG would work too but using DOM elements
            keeps the in-cell <text> labels styled with the same CSS as
            the rest of the template (proper font fallbacks, ellipsis,
            line-height) without re-implementing it in SVG. */}
        {columnLayouts.map((col, colIdx) => {
          // stagger's third arg is `baseDelay` (added to every item), NOT
          // a max cap. We already offset by `columnStart` separately, so
          // passing sec(0.6) here would double the offset — first column
          // would start at 1.2s instead of 0.6s.
          const colStart = columnStart + stagger(colIdx, perColumn);
          const segProgress = interpolate(
            frame,
            [colStart, colStart + segmentReveal],
            [0, 1],
            CLAMP_CUBIC,
          );

          return (
            <div key={`col-${col.id}`}>
              {/* Column label (top).
                  Font size adapts to label length AND column width so
                  labels like "United Kingdom" don't truncate to
                  "United Kin..." in a 7%-width column. Estimate the
                  pixel width at heading size (~9.5px per char in
                  fonts.heading + 16px padding) and shrink to caption
                  size when the column is narrower than that estimate. */}
              {(() => {
                const estimatedLabelWidth = col.label.length * 9.5 + 16;
                const narrow = col.cellWidth < estimatedLabelWidth;
                const labelFontSize = narrow
                  ? fontSizes.caption
                  : fontSizes.label;
                return (
              <div
                style={{
                  position: "absolute",
                  top: area.top,
                  left: col.x,
                  width: col.cellWidth,
                  textAlign: "center",
                  opacity:
                    fadeIn(frame, colStart + segmentReveal, labelReveal) *
                    exitOp,
                  pointerEvents: "none",
                }}
              >
                <div
                  style={{
                    fontFamily: fonts.heading,
                    fontSize: labelFontSize,
                    fontWeight: 700,
                    color: theme.text.primary,
                    lineHeight: 1.1,
                    maxWidth: textMaxWidth.label,
                    margin: "0 auto",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {col.label}
                </div>
                {col.sublabel && (
                  <div
                    style={{
                      fontFamily: fonts.mono,
                      fontSize: fontSizes.meta,
                      letterSpacing: letterSpacing.meta,
                      textTransform: "uppercase",
                      color: theme.text.muted,
                      marginTop: 2,
                      lineHeight: 1,
                    }}
                  >
                    {col.sublabel}
                  </div>
                )}
              </div>
                );
              })()}

              {/* Cells (segments) */}
              {col.segments.map((seg, segIdx) => {
                const cellColor = segmentColorByKey[seg.key];
                // Each segment grows upward from its baseline: animate
                // height from 0 → seg.height, anchored at the segment's
                // bottom edge.
                const animatedHeight = seg.height * segProgress;
                const animatedY = seg.y + (seg.height - animatedHeight);
                const cellArea = seg.width * seg.height;
                const showLabel =
                  cellArea >= LABEL_AREA_THRESHOLD &&
                  seg.width >= LABEL_MIN_WIDTH &&
                  seg.height >= LABEL_MIN_HEIGHT;

                // Emphasis pass — when `emphasisKey` is set, this segment
                // is either the accent (full saturation) or a muted
                // sibling (opacity × MUTED_OPACITY_FACTOR). When the
                // field is omitted, both flags collapse to the
                // pre-existing full-saturation behavior.
                const emphasisActive =
                  data.emphasisKey != null && data.emphasisKey !== "";
                const isEmphasized =
                  emphasisActive && seg.key === data.emphasisKey;
                const isMuted = emphasisActive && !isEmphasized;
                const opacityMultiplier = isMuted ? MUTED_OPACITY_FACTOR : 1;

                return (
                  <div
                    key={`cell-${col.id}-${seg.key}-${segIdx}`}
                    style={{
                      position: "absolute",
                      top: animatedY,
                      left: seg.x,
                      width: seg.width,
                      height: animatedHeight,
                      background: cellColor,
                      opacity: 0.92 * exitOp * opacityMultiplier,
                      // Subtle interior bevel — slight inset shadow makes
                      // the tile read as a flat editorial swatch rather
                      // than a 3D button.
                      boxShadow: `inset 0 0 0 1px ${theme.bg.base}40`,
                      overflow: "hidden",
                      pointerEvents: "none",
                    }}
                  >
                    {showLabel && (
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          padding: layout.spacing.xs,
                          opacity:
                            fadeIn(
                              frame,
                              colStart + segmentReveal - sec(0.1),
                              labelReveal,
                            ) * exitOp,
                        }}
                      >
                        <div
                          style={{
                            fontFamily: fonts.heading,
                            // Emphasized segments get a one-step bump on
                            // the label-size ladder (caption → label,
                            // label → body) when the cell can host it.
                            // The check against the cell's height keeps
                            // the bump opt-in for genuinely large tiles —
                            // a 60px-tall sliver shouldn't try to host
                            // body-sized text.
                            fontSize: isEmphasized
                              ? seg.height >= 120
                                ? fontSizes.body
                                : fontSizes.label
                              : seg.height >= 90
                                ? fontSizes.label
                                : fontSizes.caption,
                            fontWeight: isEmphasized ? 700 : 600,
                            // Bone-on-tile reads cleanly across all ramp
                            // colors (rust/gold/umber/walnut/taupe are
                            // all dark or mid). Skip per-color contrast
                            // gymnastics — the palette is curated.
                            color: palette.bone,
                            textAlign: "center",
                            lineHeight: 1.15,
                            letterSpacing: 0.3,
                            maxWidth: "100%",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            // Subtle drop shadow lifts text off colored tiles
                            textShadow: "0 1px 2px rgba(0,0,0,0.25)",
                          }}
                        >
                          {seg.label}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Width stamp (bottom of column).
                  Percent mode: "N% of total" using shareWidth × 100.
                  Absolute mode: raw column.width value with valueFormat unit
                  suffix (shareWidth is a ratio of widthMax, not % of total,
                  so showing it as "N%" would be factually wrong). */}
              <div
                style={{
                  position: "absolute",
                  top: wallBottom + 6,
                  left: col.x,
                  width: col.cellWidth,
                  textAlign: "center",
                  opacity:
                    fadeIn(frame, colStart + segmentReveal, labelReveal) *
                    exitOp,
                  pointerEvents: "none",
                }}
              >
                <div
                  style={{
                    fontFamily: fonts.data,
                    fontSize: fontSizes.meta,
                    letterSpacing: letterSpacing.meta,
                    textTransform: "uppercase",
                    color: theme.text.muted,
                    lineHeight: 1,
                  }}
                >
                  {widthMode === "percent"
                    ? applyValueFormat(Math.round(col.shareWidth * 100), data.valueFormat)
                    : (() => {
                        const rawVal = Math.round(col.width);
                        const fmt = data.valueFormat;
                        if (!fmt || fmt === "percent" || fmt === "%") return String(rawVal);
                        return `${rawVal} ${fmt}`;
                      })()}
                </div>
              </div>
            </div>
          );
        })}

        {/* ── Legend ─────────────────────────────────────────────────────
            Floats below the chart, single horizontal row of swatch+label
            pairs. Stays inside the generous safe area so the footer
            strip doesn't collide. */}
        <div
          style={{
            position: "absolute",
            left: area.left,
            top: layout.height - layout.safeAreaTier.generous.bottom - 36,
            width: area.width,
            display: "flex",
            flexWrap: "wrap",
            gap: layout.spacing.lg,
            justifyContent: "center",
            opacity: fadeIn(frame, legendStart, sec(0.5)) * exitOp,
            pointerEvents: "none",
          }}
        >
          {legendItems.map((item) => (
            <div
              key={`legend-${item.key}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: layout.spacing.xs,
              }}
            >
              <div
                style={{
                  width: 14,
                  height: 14,
                  background: item.color,
                  borderRadius: 2,
                }}
              />
              <div
                style={{
                  fontFamily: fonts.mono,
                  fontSize: fontSizes.caption,
                  letterSpacing: letterSpacing.caption,
                  textTransform: "uppercase",
                  color: theme.text.secondary,
                }}
              >
                {item.label}
              </div>
            </div>
          ))}
        </div>

        <SourceAttribution
          source={data.source}
          mode={bgVariant}
          prefix="Source: "
          startSec={1.8}
        />
      </AbsoluteFill>
    </Background>
  );
};
