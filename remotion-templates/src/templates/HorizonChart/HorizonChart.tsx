/**
 * HorizonChart — Tufte's compressed multi-series time-series form.
 *
 * Each series occupies a thin horizontal strip. Its value range is
 * sliced into N equal sub-bands; bands stack as filled areas in
 * increasing color intensity. Negative values are folded back above
 * the baseline using a contrasting hue, so a series that swings ±range
 * still fits inside a fixed-height strip. The eye reads color
 * intensity (and hue) instead of absolute y — trading per-point
 * precision for an N-times denser parallel comparison.
 *
 * Animation sequence:
 *   1. Title fades in (handled by TitleBlock)
 *   2. Strip baselines draw in left-to-right with stagger
 *   3. Per-strip band areas sweep in left-to-right via SVG clipPath
 *   4. Strip labels fade in
 *   5. X-axis ticks reveal under the bottom strip
 *   6. Ken Burns drift + exit fade (via useCompositionAnimation)
 *
 * Banding algorithm (per series, executed in render-time useMemo):
 *   range = max(|value − baseline|) across all observations
 *   bandHeight = range / bands
 *   For each band k ∈ [1..bands]:
 *     threshold_k = k * bandHeight
 *     For each observation:
 *       residual = clamp(|value − baseline| − (k − 1) * bandHeight,
 *                        0, bandHeight)
 *       y = residual / bandHeight  ∈ [0, 1]   (band-local height)
 *     Each band becomes one filled SVG <path> at stripHeight × y, with
 *     opacity = k / bands. Positive observations use `positiveColor`,
 *     negative observations use `negativeColor`. We render the two
 *     hues as TWO separate path stacks per band — the negative one
 *     drawn first so the positive sits on top where they collide.
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
  semantic,
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
import { useThemeMode } from "../../hooks/useThemeMode";
import { warnIf, checkChartDataCommon } from "../../utils/dataWarnings";
import type {
  HorizonChartData,
  HorizonSeries,
  HorizonValueFormat,
} from "./types";

// ── Constants ─────────────────────────────────────────────────────────────

const MIN_STRIP_HEIGHT = 28;
const MAX_STRIP_HEIGHT = 48;
const STRIP_GAP = 6;
const LABEL_GUTTER = 200; // px reserved on the left for series labels
const X_AXIS_HEIGHT = 32;

// ── Helpers ────────────────────────────────────────────────────────────────

type ValueFormat = NonNullable<HorizonChartData["valueFormat"]>;

function formatValue(v: number, fmt: ValueFormat | undefined): string {
  const format = fmt ?? "number";
  const decimals = Math.abs(v) >= 100 ? 0 : Math.abs(v) >= 10 ? 1 : 1;
  const rounded = v.toFixed(decimals);
  if (format === "percent") return `${rounded}%`;
  if (format === "currency") return `$${rounded}`;
  return rounded;
}

/**
 * Build the SVG path for a single band of a single series. The path is
 * a closed polygon: baseline → top contour → baseline. `top` returns
 * the band-local height (0..1) of the value at each observation; we
 * scale that by `stripHeight` and flip into SVG coordinates so a higher
 * value sits closer to the strip's top.
 */
function bandPath(
  values: { x: number; value: number }[],
  baseline: number,
  side: "positive" | "negative",
  bandIndex: number, // 0-based
  bandHeight: number,
  xToPx: (x: number) => number,
  baselineY: number,
  stripHeight: number,
): string {
  if (values.length === 0) return "";
  const lower = bandIndex * bandHeight;
  const upper = (bandIndex + 1) * bandHeight;

  const verts: string[] = [];
  for (let i = 0; i < values.length; i++) {
    const v = values[i].value - baseline;
    const magnitude =
      side === "positive" ? Math.max(0, v) : Math.max(0, -v);
    // Residual within this band: [0, bandHeight]
    const residual = Math.min(Math.max(magnitude - lower, 0), upper - lower);
    // Normalised band-local height ∈ [0, 1]
    const norm = bandHeight > 0 ? residual / bandHeight : 0;
    const px = xToPx(values[i].x);
    // Flip: band fills upward from baselineY. Strip-height contribution
    // is the full strip; each band represents one segment of that
    // height, but we stack bands by alpha not by y — so each band's
    // polygon spans baselineY → baselineY − norm * stripHeight.
    const py = baselineY - norm * stripHeight;
    verts.push(`${px.toFixed(2)},${py.toFixed(2)}`);
  }
  const firstX = xToPx(values[0].x);
  const lastX = xToPx(values[values.length - 1].x);
  // Closed polygon: start at baseline, walk top contour, return along baseline.
  return (
    `M ${firstX.toFixed(2)} ${baselineY.toFixed(2)} ` +
    `L ${verts.join(" L ")} ` +
    `L ${lastX.toFixed(2)} ${baselineY.toFixed(2)} Z`
  );
}

// Brand-token resolver — accepts "accent" / "muted" / hex / palette key.
function resolveColor(
  raw: string | undefined,
  fallback: string,
  accent: string,
): string {
  if (!raw) return fallback;
  if (raw === "accent") return accent;
  return raw;
}

// ── Component ─────────────────────────────────────────────────────────────

export const HorizonChart: React.FC<{ data: HorizonChartData }> = ({
  data,
}) => {
  checkChartDataCommon("HorizonChart", data);
  warnIf(
    data.series.length > 16,
    "HorizonChart",
    `${data.series.length} series — strips compress below readable height. ` +
      `HorizonChart reads cleanest at 6–14 series; above 16 the per-strip ` +
      `height drops below 24px and color discrimination breaks down. ` +
      `Consider splitting into two segments.`,
  );
  warnIf(
    data.series.some((s) => s.values.length < 6),
    "HorizonChart",
    `One or more series has < 6 observations — horizon banding needs ` +
      `enough samples for the eye to see a contour. Below ~6 points, the ` +
      `chart degrades to a smear of color blocks. Use a bar chart instead.`,
  );

  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const direction = useDirection(data._direction);
  const { style: compStyle } = useCompositionAnimation(direction.driftOptions);
  const bgVariant = data.backgroundVariant ?? "light";
  const theme = useThemeMode(bgVariant);

  const bands = Math.min(5, Math.max(1, Math.round(data.bands ?? 3)));
  const baseline = data.baseline ?? 0;
  const valueFormat: HorizonValueFormat = data.valueFormat ?? "number";

  const accent = palette.gold;
  const positiveColor = resolveColor(
    data.positiveColor,
    palette.gold, // amber — channel "above baseline" warm hue
    accent,
  );
  const negativeColor = resolveColor(
    data.negativeColor,
    semantic.china, // rust — channel "below baseline" contrast
    accent,
  );

  // ── Layout ────────────────────────────────────────────────────────────
  const area = useMemo(() => contentArea("content", "generous"), []);

  // Reserve a strip for the x-axis at the bottom of the content area.
  // The remaining height is split equally among the series strips.
  const stripsRegionTop = area.top;
  const stripsRegionHeight = area.height - X_AXIS_HEIGHT;
  const seriesCount = data.series.length;
  // Strip height is bounded by both MIN/MAX and the available height.
  const computedStripHeight = useMemo(() => {
    if (seriesCount === 0) return MAX_STRIP_HEIGHT;
    const perSeries = stripsRegionHeight / seriesCount;
    const withoutGaps = perSeries - STRIP_GAP;
    return Math.max(
      MIN_STRIP_HEIGHT,
      Math.min(MAX_STRIP_HEIGHT, withoutGaps),
    );
  }, [seriesCount, stripsRegionHeight]);

  // Total stack height (strips + gaps); center it within stripsRegion.
  const stackHeight = useMemo(
    () =>
      seriesCount * computedStripHeight + (seriesCount - 1) * STRIP_GAP,
    [seriesCount, computedStripHeight],
  );
  const stackTop = stripsRegionTop + (stripsRegionHeight - stackHeight) / 2;

  // X domain — union of all series' x ranges so all strips share an axis.
  const xDomain = useMemo(() => {
    let xMin = Infinity;
    let xMax = -Infinity;
    for (const s of data.series) {
      for (const v of s.values) {
        if (v.x < xMin) xMin = v.x;
        if (v.x > xMax) xMax = v.x;
      }
    }
    if (!isFinite(xMin) || !isFinite(xMax) || xMin === xMax) {
      // Defensive fallback — empty or constant x; render still works.
      return { min: 0, max: 1 };
    }
    return { min: xMin, max: xMax };
  }, [data.series]);

  const chartLeft = area.left + LABEL_GUTTER;
  const chartRight = area.left + area.width;
  const xToPx = useMemo(() => {
    const span = xDomain.max - xDomain.min;
    return (x: number): number =>
      chartLeft + ((x - xDomain.min) / span) * (chartRight - chartLeft);
  }, [chartLeft, chartRight, xDomain]);

  const scaleMode = data.scaleMode ?? "per-series";

  // Per-series geometry — range, bandHeight, prebuilt band paths.
  //
  // - `"per-series"` (Tufte canon): each strip's range is its OWN
  //   `max(|value − baseline|)`. Every strip uses its full height; the
  //   eye reads coincidence (vertical columns of intensity) across rows.
  // - `"shared"`: a single global `max(|value − baseline|)` is computed
  //   across ALL series and used as every strip's range. Series with
  //   smaller swings render as smaller waves inside their strip; series
  //   with larger swings fill more of it. Use when the magnitude
  //   difference IS the argument (Few & Heer 2009 § comparing across
  //   series; Bloomberg FX-volatility dashboards).
  const seriesGeometry = useMemo(() => {
    if (scaleMode === "shared") {
      let globalRange = 0;
      for (const s of data.series) {
        for (const v of s.values) {
          const d = Math.abs(v.value - baseline);
          if (d > globalRange) globalRange = d;
        }
      }
      // Avoid divide-by-zero if every series sits exactly on the baseline.
      const safeRange = globalRange === 0 ? 1 : globalRange;
      const bandHeight = safeRange / bands;
      return data.series.map((s) => ({
        series: s,
        range: safeRange,
        bandHeight,
      }));
    }

    return data.series.map((s) => {
      let range = 0;
      for (const v of s.values) {
        const d = Math.abs(v.value - baseline);
        if (d > range) range = d;
      }
      // Avoid divide-by-zero for a flat series (every value equals baseline).
      const safeRange = range === 0 ? 1 : range;
      const bandHeight = safeRange / bands;
      return { series: s, range: safeRange, bandHeight };
    });
  }, [data.series, baseline, bands, scaleMode]);

  // ── Timing ────────────────────────────────────────────────────────────
  const baselineStart = sec(0.4);
  const stripSweepStart = sec(0.7);
  const stripStaggerPerItem = sec(0.12);
  const stripSweepDuration = sec(0.9);
  const labelStart = sec(0.5);
  const axisStart = sec(1.2);
  const exitOp = exitFade(frame, durationInFrames, 15);

  // Stable clip-id prefix — composition-local; React's keying handles
  // duplication if multiple HorizonCharts are nested.
  const clipPrefix = "horizon-clip";

  // X-axis tick selection — at most 6 evenly-spaced ticks across the
  // observed domain. Ticks use the integer x values present in the data
  // when possible (most callers pass week/day indices).
  const xTicks = useMemo(() => {
    const desired = 6;
    const span = xDomain.max - xDomain.min;
    const step = span / (desired - 1);
    return Array.from({ length: desired }, (_, i) => xDomain.min + i * step);
  }, [xDomain]);

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
          {/* ── Clip paths for left-to-right sweep ─────────────────────
              Each strip gets its own clipPath. The clipRect's width
              animates from 0 → full chart width, sweeping the bands in. */}
          <defs>
            {data.series.map((s, i) => {
              const start = stripSweepStart + stagger(i, stripStaggerPerItem);
              const progress = interpolate(
                frame,
                [start, start + stripSweepDuration],
                [0, 1],
                CLAMP_CUBIC,
              );
              const stripTop = stackTop + i * (computedStripHeight + STRIP_GAP);
              return (
                <clipPath key={`${clipPrefix}-${s.id}`} id={`${clipPrefix}-${s.id}`}>
                  <rect
                    x={chartLeft}
                    y={stripTop}
                    width={(chartRight - chartLeft) * progress}
                    height={computedStripHeight}
                  />
                </clipPath>
              );
            })}
          </defs>

          {/* ── Per-strip rendering ───────────────────────────────────── */}
          {seriesGeometry.map(({ series: s, bandHeight }, i) => {
            const stripTop = stackTop + i * (computedStripHeight + STRIP_GAP);
            const baselineY = stripTop + computedStripHeight; // bottom of strip
            const labelStartFrame = labelStart + stagger(i, stripStaggerPerItem);
            const labelOp = fadeIn(frame, labelStartFrame, sec(0.4)) * exitOp;
            const baselineProgress = interpolate(
              frame,
              [
                baselineStart + stagger(i, sec(0.04)),
                baselineStart + stagger(i, sec(0.04)) + sec(0.5),
              ],
              [0, 1],
              CLAMP_CUBIC,
            );

            // Per-series color overrides — if `series.color` is set, it
            // tints BOTH positive and negative bands. Keeps single-strip
            // emphasis simple without sacrificing the bi-hue baseline form.
            const seriesPositive = s.color
              ? resolveColor(s.color, positiveColor, accent)
              : positiveColor;
            const seriesNegative = s.color
              ? resolveColor(s.color, negativeColor, accent)
              : negativeColor;

            return (
              <g key={`strip-${s.id}`}>
                {/* ── Strip baseline (thin rule at the bottom) ─────── */}
                <line
                  x1={chartLeft}
                  y1={baselineY}
                  x2={chartLeft + (chartRight - chartLeft) * baselineProgress}
                  y2={baselineY}
                  stroke={theme.text.muted}
                  strokeWidth={0.75}
                  opacity={0.4 * exitOp}
                />

                {/* ── Series label (left of the strip) ─────────────── */}
                <g opacity={labelOp}>
                  <text
                    x={chartLeft - 16}
                    y={
                      baselineY -
                      computedStripHeight / 2 +
                      (s.sublabel ? -2 : 4)
                    }
                    textAnchor="end"
                    fill={theme.text.primary}
                    fontSize={fontSizes.label}
                    fontFamily={fonts.heading}
                    fontWeight={600}
                    letterSpacing={0.4}
                  >
                    {s.label}
                  </text>
                  {s.sublabel && (
                    <text
                      x={chartLeft - 16}
                      y={
                        baselineY - computedStripHeight / 2 + 14
                      }
                      textAnchor="end"
                      fill={theme.text.muted}
                      fontSize={fontSizes.caption}
                      fontFamily={fonts.mono}
                      fontWeight={400}
                      letterSpacing={letterSpacing.caption}
                    >
                      {s.sublabel}
                    </text>
                  )}
                </g>

                {/* ── Banded areas, clipped to the sweep ────────────── */}
                <g clipPath={`url(#${clipPrefix}-${s.id})`}>
                  {/* Negative bands first (drawn below positive at overlap).
                      Each band k uses opacity = (k+1)/bands so band 0
                      is faintest and the topmost band is darkest. The
                      bands are POSITIONAL, not stacked — band k's
                      polygon covers the area where |value − baseline|
                      falls within its [k, k+1) sub-range. Visually they
                      union into the canonical horizon "stepped intensity"
                      because higher bands sit on top of lower bands when
                      they're both filled (a series exceeding band k+1
                      necessarily fills bands 0..k+1). */}
                  {Array.from({ length: bands }, (_, k) => {
                    const opacity = ((k + 1) / bands) * 0.85;
                    const d = bandPath(
                      s.values,
                      baseline,
                      "negative",
                      k,
                      bandHeight,
                      xToPx,
                      baselineY,
                      computedStripHeight,
                    );
                    if (!d) return null;
                    return (
                      <path
                        key={`neg-${s.id}-${k}`}
                        d={d}
                        fill={seriesNegative}
                        opacity={opacity * exitOp}
                      />
                    );
                  })}
                  {Array.from({ length: bands }, (_, k) => {
                    const opacity = ((k + 1) / bands) * 0.85;
                    const d = bandPath(
                      s.values,
                      baseline,
                      "positive",
                      k,
                      bandHeight,
                      xToPx,
                      baselineY,
                      computedStripHeight,
                    );
                    if (!d) return null;
                    return (
                      <path
                        key={`pos-${s.id}-${k}`}
                        d={d}
                        fill={seriesPositive}
                        opacity={opacity * exitOp}
                      />
                    );
                  })}
                </g>
              </g>
            );
          })}

          {/* ── X-axis ─────────────────────────────────────────────────
              Single shared axis at the bottom of the strip stack.
              Reveals after the strips have swept in. */}
          {(() => {
            const axisY = stackTop + stackHeight + X_AXIS_HEIGHT / 2;
            const axisProgress = interpolate(
              frame,
              [axisStart, axisStart + sec(0.5)],
              [0, 1],
              CLAMP_CUBIC,
            );
            const axisOp = fadeIn(frame, axisStart, sec(0.4)) * exitOp;
            return (
              <g opacity={axisOp}>
                <line
                  x1={chartLeft}
                  y1={axisY - 10}
                  x2={
                    chartLeft + (chartRight - chartLeft) * axisProgress
                  }
                  y2={axisY - 10}
                  stroke={theme.text.muted}
                  strokeWidth={0.75}
                  opacity={0.6}
                />
                {xTicks.map((t, i) => {
                  const px = xToPx(t);
                  return (
                    <g key={`tick-${i}`}>
                      <line
                        x1={px}
                        y1={axisY - 10}
                        x2={px}
                        y2={axisY - 5}
                        stroke={theme.text.muted}
                        strokeWidth={0.75}
                        opacity={0.6}
                      />
                      <text
                        x={px}
                        y={axisY + 8}
                        textAnchor="middle"
                        fill={theme.text.muted}
                        fontSize={fontSizes.meta}
                        fontFamily={fonts.mono}
                        fontWeight={400}
                        letterSpacing={letterSpacing.meta}
                        style={{ textTransform: "uppercase" }}
                      >
                        {formatValue(t, valueFormat)}
                      </text>
                    </g>
                  );
                })}
                {data.xAxisLabel && (
                  <text
                    x={(chartLeft + chartRight) / 2}
                    y={axisY + 26}
                    textAnchor="middle"
                    fill={theme.text.muted}
                    fontSize={fontSizes.caption}
                    fontFamily={fonts.mono}
                    fontWeight={500}
                    letterSpacing={letterSpacing.caption}
                    style={{ textTransform: "uppercase" }}
                  >
                    {data.xAxisLabel}
                  </text>
                )}
              </g>
            );
          })()}
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
