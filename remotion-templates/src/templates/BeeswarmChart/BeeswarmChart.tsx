/**
 * BeeswarmChart — 1D scatter with collision-resolved vertical offsets.
 *
 * Each item gets an x-position derived from its `value` on a linear scale
 * across the content area. To avoid overlap, items are sorted by x and
 * then "packed" upward (alternating directions) whenever a candidate
 * slot collides with a previously placed neighbor within ±2r in x.
 *
 * Highlighted items render with a larger disc, full opacity, amber fill
 * (unless overridden), and a leader-line label callout. Optional dashed
 * reference line marks a benchmark value (mean, target, etc.).
 *
 * Animation sequence:
 *   1. Title fades in (TitleBlock)
 *   2. Axis line + tick marks draw in
 *   3. Items appear left-to-right with tight stagger (perItem = sec(0.04))
 *   4. Reference line + highlight callouts fade in last
 *   5. Ken Burns drift + exit fade (via useCompositionAnimation)
 *
 * Collision algorithm (canonical beeswarm packing with lateral pre-jitter):
 *   - Sort items by x.
 *   - For each item, start at y = baseline. If no collision at baseline,
 *     place it there.
 *   - On collision: BEFORE escalating to vertical stacking, try a small
 *     lateral x-jitter at baseline (±0.6r, ±1.2r, ±1.8r — 3 levels each
 *     direction, alternating). This approximates the d3-force beeswarm
 *     spread: dense clusters fan out laterally before piling vertically,
 *     turning a tall TOWER into a balanced SWARM. Jitter cap (≈1.8r) keeps
 *     items visually anchored to their true x — viewers can still read
 *     approximate value from horizontal position.
 *   - Only if lateral jitter is exhausted, fall back to the vertical
 *     stacking search (step = 2r + pad, alternating up/down per cluster).
 *   - Highlighted items are forced ABOVE the baseline (preferredSign = -1)
 *     so leader-line + label layout stays consistent; lateral jitter still
 *     applies to them at baseline first.
 */

import React, { useMemo } from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
} from "remotion";
import { measureText } from "@remotion/layout-utils";
import {
  palette,
  fonts,
  fontSizes,
  letterSpacing,
  layout,
  sec,
  contentArea,
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
import { useEpisodeColorEmphasis } from "../../hooks/useEpisodeColorEmphasis";
import { useThemeMode } from "../../hooks/useThemeMode";
import { warnIf, checkChartDataCommon } from "../../utils/dataWarnings";
import type { BeeswarmData, BeeswarmItem } from "./types";

// ── Helpers ────────────────────────────────────────────────────────────

/**
 * "Nice numbers" rounding for axis steps. Snaps a raw step to 1, 2, 2.5,
 * 5, or 10 × 10^k so tick labels read as round values. Same heuristic
 * d3-scale uses internally.
 */
function niceStep(rawStep: number): number {
  if (rawStep <= 0 || !Number.isFinite(rawStep)) return 1;
  const exp = Math.floor(Math.log10(rawStep));
  const base = Math.pow(10, exp);
  const norm = rawStep / base;
  let nice: number;
  if (norm < 1.5) nice = 1;
  else if (norm < 3) nice = 2;
  else if (norm < 4) nice = 2.5;
  else if (norm < 7) nice = 5;
  else nice = 10;
  return nice * base;
}

function generateTicks(min: number, max: number, target = 5): number[] {
  if (!Number.isFinite(min) || !Number.isFinite(max) || min === max) {
    return [min];
  }
  const step = niceStep((max - min) / target);
  const niceMin = Math.floor(min / step) * step;
  const niceMax = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  // Use a tolerance to avoid floating-point overshoot
  for (let v = niceMin; v <= niceMax + step * 0.001; v += step) {
    ticks.push(Number(v.toFixed(10)));
  }
  return ticks;
}

type ValueFormat = NonNullable<BeeswarmData["valueFormat"]>;

function formatValue(v: number, fmt: ValueFormat | undefined): string {
  const format = fmt ?? "number";
  const decimals = Math.abs(v) >= 100 ? 0 : Math.abs(v) >= 10 ? 1 : 1;
  const rounded = v.toFixed(decimals);
  if (format === "percent") return `${rounded}%`;
  if (format === "currency") return `$${rounded}`;
  return rounded;
}

interface PlacedItem extends BeeswarmItem {
  /** Original index in data.items (preserved for stagger animation). */
  origIndex: number;
  x: number;
  y: number;
  r: number;
}

/**
 * Canonical beeswarm packing. Iterates items in x-sorted order and lifts
 * each into the lowest non-overlapping y slot, alternating up/down per
 * cluster so the swarm stays visually balanced about the baseline.
 */
function packItems(
  items: BeeswarmItem[],
  scaleX: (v: number) => number,
  baselineY: number,
  baseR: number,
  highlightR: number,
  pad: number,
): PlacedItem[] {
  // Sort by x while preserving original index for animation order.
  const indexed = items.map((it, origIndex) => ({ it, origIndex }));
  indexed.sort((a, b) => a.it.value - b.it.value);

  const placed: PlacedItem[] = [];
  // Direction flag: alternates per local cluster (chain of overlapping
  // neighbors). +1 = push up first, -1 = push down first. Flips whenever
  // we start a new chain with no collision against the previous item.
  let direction = 1;

  for (const { it, origIndex } of indexed) {
    const r = it.highlight ? highlightR : baseR;
    const x = scaleX(it.value);

    // Candidate offsets to try: 0, +step, -step, +2*step, -2*step, ...
    // Where step = 2r + pad. Alternation chooses initial sign per cluster.
    const step = 2 * r + pad;

    // Determine whether we're starting a new cluster (no overlap with
    // any previously placed item at y=baseline within ±2r in x).
    const hasNeighborAtBase = placed.some((p) => {
      const dx = Math.abs(p.x - x);
      const reach = p.r + r + pad;
      return dx < reach && Math.abs(p.y - baselineY) < p.r + r + pad;
    });

    if (!hasNeighborAtBase) {
      // Free slot at baseline. Flip direction so the next cluster opens
      // on the opposite side, keeping the swarm visually balanced.
      placed.push({ ...it, origIndex, x, y: baselineY, r });
      direction = -direction;
      continue;
    }

    // Helper: returns true if a disc of radius r at (cx, cy) overlaps
    // any previously placed item.
    const collidesAt = (cx: number, cy: number): boolean =>
      placed.some((p) => {
        const dx = p.x - cx;
        const dy = p.y - cy;
        const reach = p.r + r + pad;
        return dx * dx + dy * dy < reach * reach;
      });

    // ── Step 1: lateral micro-jitter at baseline ──────────────────────
    // Try small horizontal offsets BEFORE escalating to vertical stack.
    // Amplitude = r * 0.6 per level, 3 levels each direction. Cap of
    // 1.8r keeps the item within ~2r of its true x, so the chart still
    // reads "position encodes value." Order: ±1, ±2, ±3 (closest first)
    // alternating sign so each level fans symmetrically.
    const jitterAmp = r * 0.6;
    const jitterLevels = 3;
    let jittered = false;
    for (let jx = 1; jx <= jitterLevels && !jittered; jx++) {
      for (const dir of [1, -1] as const) {
        const xJ = x + dir * jx * jitterAmp;
        if (!collidesAt(xJ, baselineY)) {
          placed.push({ ...it, origIndex, x: xJ, y: baselineY, r });
          jittered = true;
          break;
        }
      }
    }
    if (jittered) continue;

    // ── Step 2: vertical stacking (existing algorithm) ─────────────────
    // Search for the lowest non-overlapping y by trying ± multiples of
    // step. Highlights are forced UPWARD only (preferredSign = -1) so
    // every editorial-hero dot lands above the baseline regardless of
    // local cluster direction — keeps the leader-line + label layout
    // consistent across all callouts. Non-highlights still alternate.
    //
    // At each vertical level we also re-try a small lateral jitter so
    // upper rows of the swarm spread laterally too, not just the base
    // row. Same jitter budget as Step 1.
    const preferredSigns = it.highlight
      ? ([-1] as const)
      : ([direction, -direction] as const);
    let found = false;
    for (let k = 1; k <= 60 && !found; k++) {
      for (const sign of preferredSigns) {
        const candidateY = baselineY + sign * step * k;
        // Try centered first, then lateral jitter at this row.
        if (!collidesAt(x, candidateY)) {
          placed.push({ ...it, origIndex, x, y: candidateY, r });
          found = true;
          break;
        }
        let rowJittered = false;
        for (let jx = 1; jx <= jitterLevels && !rowJittered; jx++) {
          for (const dir of [1, -1] as const) {
            const xJ = x + dir * jx * jitterAmp;
            if (!collidesAt(xJ, candidateY)) {
              placed.push({ ...it, origIndex, x: xJ, y: candidateY, r });
              rowJittered = true;
              found = true;
              break;
            }
          }
        }
        if (found) break;
      }
    }
    if (!found) {
      // Pathological density — fall back to plotting directly on top
      // rather than dropping the point.
      placed.push({ ...it, origIndex, x, y: baselineY, r });
    }
  }
  return placed;
}

// ── Main component ─────────────────────────────────────────────────────

export const BeeswarmChart: React.FC<{ data: BeeswarmData }> = ({ data }) => {
  checkChartDataCommon("BeeswarmChart", data);
  warnIf(
    data.items.length > 80,
    "BeeswarmChart",
    `${data.items.length} items — packing density above 80 produces walls of dots; consider top-N filtering or grouping.`,
  );
  warnIf(
    data.items.length < 6,
    "BeeswarmChart",
    "Fewer than 6 items reads as sparse on a 1D axis; DataChart or StatReveal may communicate better.",
  );

  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const direction = useDirection(data._direction);
  const { style: compStyle } = useCompositionAnimation(direction.driftOptions);
  const bgVariant = data.backgroundVariant ?? "light";
  const theme = useThemeMode(bgVariant);
  // Per-episode emphasis: highlighted-dot accent follows episode primary
  // palette colour. Multi-category ramp (line 349) keeps its hardcoded
  // set since those are semantic per-category, not single-data-emphasis.
  const emphasis = useEpisodeColorEmphasis();
  const accent = emphasis.primaryAccent;

  // ── Layout ──────────────────────────────────────────────────────────
  const area = useMemo(() => contentArea("content", "generous"), []);
  // Baseline sits low so packed dots have plenty of room to spread up.
  // Leave room below for tick labels + axis title.
  const baselineY = area.top + area.height * 0.78;
  const axisLeft = area.left;
  const axisRight = area.left + area.width;
  const axisWidth = axisRight - axisLeft;

  // ── Value scale ─────────────────────────────────────────────────────
  const { dataMin, dataMax } = useMemo(() => {
    let lo = Infinity;
    let hi = -Infinity;
    for (const it of data.items) {
      if (it.value < lo) lo = it.value;
      if (it.value > hi) hi = it.value;
    }
    if (data.referenceLine) {
      if (data.referenceLine.value < lo) lo = data.referenceLine.value;
      if (data.referenceLine.value > hi) hi = data.referenceLine.value;
    }
    if (!Number.isFinite(lo) || !Number.isFinite(hi)) {
      lo = 0;
      hi = 1;
    }
    return { dataMin: lo, dataMax: hi };
  }, [data.items, data.referenceLine]);

  const ticks = useMemo(
    () => generateTicks(dataMin, dataMax, 5),
    [dataMin, dataMax],
  );
  // Use the tick-rounded extents as the scale domain so the leftmost /
  // rightmost ticks anchor cleanly at the axis ends.
  const scaleMin = ticks.length > 0 ? ticks[0] : dataMin;
  const scaleMax = ticks.length > 0 ? ticks[ticks.length - 1] : dataMax;

  const scaleX = useMemo(() => {
    const span = scaleMax - scaleMin || 1;
    // Inset slightly so leftmost / rightmost dots don't kiss the gutter.
    const inset = 24;
    const usable = axisWidth - inset * 2;
    return (v: number) => axisLeft + inset + ((v - scaleMin) / span) * usable;
  }, [scaleMin, scaleMax, axisLeft, axisWidth]);

  // ── Pack items ─────────────────────────────────────────────────────
  // Dot sizing: small enough that ~25 entities in a 1pp-wide band don't
  // pile into a vertical column. Highlight radius differential is what
  // signals importance, not absolute size. Pad sets the minimum spacing
  // between adjacent dots — too small reads as overlap, too large
  // amplifies the vertical stacking problem.
  const baseR = 5;
  const highlightR = 9;
  const pad = 1.5;
  const placed = useMemo(
    () => packItems(data.items, scaleX, baselineY, baseR, highlightR, pad),
    [data.items, scaleX, baselineY],
  );

  // ── Group color map ─────────────────────────────────────────────────
  const groupColorMap = useMemo((): Record<string, string> => {
    // Collect unique group values in insertion order.
    const seen: string[] = [];
    for (const item of data.items) {
      if (item.group && !seen.includes(item.group)) seen.push(item.group);
    }
    if (seen.length === 0) return {};
    // Cycle through a small editorial ramp derived from palette tokens.
    // Cap at 6 groups — more than 6 categories in a beeswarm is a data problem.
    const ramp = [palette.amber, palette.rust, "#5B8DB8", "#6DB33F", "#9B59B6", "#E67E22"];
    const map: Record<string, string> = {};
    seen.forEach((g, i) => { map[g] = ramp[i % ramp.length]; });
    return map;
  }, [data.items]);
  const hasGroups = Object.keys(groupColorMap).length > 0;

  // ── Timing ─────────────────────────────────────────────────────────
  const axisStart = sec(0.4);
  const itemsStart = sec(0.9);
  const referenceStart = sec(1.5);
  const exitOp = exitFade(frame, durationInFrames, 15);

  const axisProgress = interpolate(
    frame,
    [axisStart, axisStart + sec(0.6)],
    [0, 1],
    CLAMP_CUBIC,
  );
  const tickOpacity = fadeIn(frame, axisStart + sec(0.3), sec(0.4)) * exitOp;

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
        <FooterStrip
          mode={bgVariant}
          scale={data.axisLabel ? `SCALE · ${data.axisLabel}` : undefined}
        />

        <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          <TitleBlock
            title={data.title}
            subtitle={data.subtitle}
            mode={bgVariant}
            safeAreaTier="generous"
            syncPoints={direction.syncPoints}
          />
        </div>

        <svg
          width={layout.width}
          height={layout.height}
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            overflow: "visible",
          }}
        >
          {/* ── Axis line — draws in left → right ───────────────────── */}
          <line
            x1={axisLeft}
            y1={baselineY}
            x2={axisLeft + axisWidth * axisProgress}
            y2={baselineY}
            stroke={theme.text.muted}
            strokeWidth={1}
            opacity={0.5 * exitOp}
          />

          {/* ── Tick marks + labels ────────────────────────────────── */}
          {ticks.map((tick, i) => {
            const x = scaleX(tick);
            return (
              <g key={`tick-${i}`} opacity={tickOpacity}>
                <line
                  x1={x}
                  y1={baselineY}
                  x2={x}
                  y2={baselineY + 6}
                  stroke={theme.text.muted}
                  strokeWidth={1}
                  opacity={0.5}
                />
                <text
                  x={x}
                  y={baselineY + 24}
                  textAnchor="middle"
                  fill={theme.text.muted}
                  fontSize={fontSizes.meta}
                  fontFamily={fonts.data}
                  fontWeight={400}
                  letterSpacing={letterSpacing.meta}
                >
                  {formatValue(tick, data.valueFormat)}
                </text>
              </g>
            );
          })}

          {/* ── Axis title ─────────────────────────────────────────── */}
          {data.axisLabel && (
            <text
              x={axisLeft + axisWidth}
              y={baselineY + 48}
              textAnchor="end"
              fill={theme.text.muted}
              fontSize={fontSizes.meta}
              fontFamily={fonts.mono}
              fontWeight={400}
              letterSpacing={letterSpacing.meta}
              opacity={tickOpacity}
              style={{ textTransform: "uppercase" }}
            >
              {data.axisLabel}
            </text>
          )}

          {/* ── Reference line ──────────────────────────────────────── */}
          {data.referenceLine && (() => {
            const refX = scaleX(data.referenceLine.value);
            const op = fadeIn(frame, referenceStart, sec(0.5)) * exitOp;
            // Reference line stretches above the swarm zone and a touch
            // below the baseline so it reads as a vertical benchmark.
            const topY = area.top + 12;
            const botY = baselineY + 12;
            return (
              <g opacity={op}>
                <line
                  x1={refX}
                  y1={topY}
                  x2={refX}
                  y2={botY}
                  stroke={theme.text.muted}
                  strokeWidth={1}
                  strokeDasharray="4 5"
                  opacity={0.7}
                />
                <text
                  x={refX}
                  y={topY - 6}
                  textAnchor="middle"
                  fill={theme.text.secondary}
                  fontSize={fontSizes.meta}
                  fontFamily={fonts.mono}
                  fontWeight={500}
                  letterSpacing={letterSpacing.meta}
                  style={{ textTransform: "uppercase" }}
                >
                  {data.referenceLine.label}
                </text>
              </g>
            );
          })()}

          {/* ── Items (dots) ────────────────────────────────────────── */}
          {placed.map((p) => {
            const isHighlight = p.highlight === true;
            const item = data.items[p.origIndex];
            const groupColor = item?.group ? groupColorMap[item.group] : undefined;
            const itemStart =
              itemsStart + stagger(p.origIndex, sec(0.04));
            const settleDur = sec(0.35);
            const opProgress = fadeIn(frame, itemStart, settleDur);
            const scaleProgress = interpolate(
              frame,
              [itemStart, itemStart + settleDur],
              [0, 1],
              CLAMP_CUBIC,
            );
            const fill = isHighlight
              ? p.color || groupColor || accent
              : p.color || groupColor || theme.text.muted;
            const stroke = isHighlight
              ? p.color || groupColor || accent
              : theme.text.muted;
            const opacity =
              opProgress * exitOp * (isHighlight ? 1 : 0.55);
            const r = p.r * scaleProgress;
            return (
              <circle
                key={`dot-${p.origIndex}`}
                cx={p.x}
                cy={p.y}
                r={r}
                fill={fill}
                fillOpacity={isHighlight ? 0.9 : 0.5}
                stroke={stroke}
                strokeWidth={isHighlight ? 1.5 : 0.75}
                opacity={opacity}
              />
            );
          })}

          {/* ── Group legend strip ──────────────────────────────────── */}
          {hasGroups && (
            <g transform={`translate(${axisLeft}, ${baselineY + 56})`}>
              {Object.entries(groupColorMap).map(([groupLabel, color], i) => {
                const swatchW = 10;
                const gap = 8;
                // R10: use measureText for accurate label widths (handles CJK
                // characters which are ~14px wide, not 7px like Latin). Fall
                // back to the character-count heuristic in test environments
                // that lack canvas.
                const xOff = Object.entries(groupColorMap)
                  .slice(0, i)
                  .reduce((acc, [gl]) => {
                    let w: number;
                    try {
                      w = measureText({ text: gl, fontFamily: fonts.mono, fontSize: 10, fontWeight: "400" }).width;
                    } catch {
                      w = gl.length * 7; // fallback for test environments without canvas
                    }
                    return acc + swatchW + gap + w + 20;
                  }, 0);
                const legendOp = fadeIn(frame, itemsStart + sec(0.5), sec(0.4)) * exitOp;
                return (
                  <g key={groupLabel} transform={`translate(${xOff}, 0)`} opacity={legendOp}>
                    <rect x={0} y={-8} width={swatchW} height={swatchW} fill={color} rx={2} />
                    <text
                      x={swatchW + gap}
                      y={0}
                      fill={theme.text.secondary}
                      fontSize={fontSizes.caption}
                      fontFamily={fonts.mono}
                    >{groupLabel}</text>
                  </g>
                );
              })}
            </g>
          )}

          {/* ── Highlight callouts: leader line + label ─────────────── */}
          {placed.map((p) => {
            if (!p.highlight) return null;
            const itemStart =
              itemsStart + stagger(p.origIndex, sec(0.04));
            const labelStart = itemStart + sec(0.25);
            const op = fadeIn(frame, labelStart, sec(0.35)) * exitOp;
            const color = p.color || accent;

            // Label sits ABOVE the dot when the dot is above-or-on the
            // baseline (most common), and below otherwise. Leader line
            // bridges the dot edge to the label anchor.
            const aboveBaseline = p.y <= baselineY;
            const labelOffsetY = aboveBaseline ? -28 : 28;
            const labelY = p.y + labelOffsetY;
            const leaderStartY = p.y + (aboveBaseline ? -p.r : p.r);
            const leaderEndY = labelY + (aboveBaseline ? 8 : -8);

            const valueStr = formatValue(p.value, data.valueFormat);
            const labelText = `${p.label} · ${valueStr}`;

            return (
              <g key={`callout-${p.origIndex}`} opacity={op}>
                <line
                  x1={p.x}
                  y1={leaderStartY}
                  x2={p.x}
                  y2={leaderEndY}
                  stroke={color}
                  strokeWidth={1}
                  opacity={0.7}
                />
                <text
                  x={p.x}
                  y={labelY}
                  textAnchor="middle"
                  fill={color}
                  fontSize={fontSizes.caption}
                  fontFamily={fonts.heading}
                  fontWeight={600}
                  letterSpacing={0.3}
                >
                  {labelText}
                </text>
              </g>
            );
          })}
        </svg>

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
