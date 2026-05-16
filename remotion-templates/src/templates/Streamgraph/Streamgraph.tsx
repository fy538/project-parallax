/**
 * Streamgraph — stacked area chart with a CENTERED baseline.
 *
 * Renders the canonical NYT/Pudding streamgraph: each series is a smooth
 * filled band, stacked atop the previous one with the total composition
 * either symmetric around the midline (silhouette), wiggle-minimized
 * (classic), or stacked from a zero baseline. Labels sit directly on the
 * widest point of each band — no legend.
 *
 * Geometry pipeline:
 *   1. Resample series onto a shared x-grid (we trust the data files to
 *      already share x-positions — see `xColumns` memo).
 *   2. Compute per-column baseline offset (`y0[i]`) based on the chosen
 *      offset mode. Each series contributes its `value` upward from `y0`.
 *   3. Convert (x, y0+stack) values to SVG pixel space using the inner
 *      chart rect (chartLayout-style inset).
 *   4. Build top + bottom polyline points per series → run them through
 *      a tiny monotone-cubic interpolator to produce smooth bezier paths.
 *
 * Animation sequence:
 *   1. Title + axis fade in
 *   2. Bands rise vertically from y=midline (squish-up reveal), stagger
 *      lowest series first
 *   3. Labels fade in once each band has settled
 *   4. Ken Burns drift + exit fade (via useCompositionAnimation)
 *
 * The squish-up reveal is implemented via an SVG `transform` on each
 * band group — `transform: translateY(...) scaleY(...)` around the
 * midline. This avoids reflowing every path point per frame.
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
  fontWeights,
  letterSpacing,
  layout,
  sec,
  timing,
  contentArea,
  getCategoricalColor,
} from "../../design/theme";
import {
  fadeIn,
  stagger,
  exitFade,
  anticipatoryStartFrame,
  CLAMP,
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
  StreamgraphData,
  StreamSeries,
  StreamOffset,
} from "./types";

// ── Color resolution ────────────────────────────────────────────────────
const resolveSeriesColor = (
  raw: string | undefined,
  fallback: string,
  accent: string,
): string => {
  if (!raw) return fallback;
  if (raw === "accent") return accent;
  return raw;
};

// ── Monotone-cubic spline ───────────────────────────────────────────────
//
// Tiny inline implementation of Fritsch-Carlson monotone cubic Hermite
// interpolation. Produces a smooth curve through all input points that
// never overshoots — exactly what a streamgraph needs (overshooting a
// band edge below another band breaks the stack illusion).
//
// Returns a list of cubic Bezier control points compatible with an SVG
// path 'C' command. For N input points we emit N-1 cubic segments.
function monotoneCubic(
  pts: { x: number; y: number }[],
): string {
  if (pts.length === 0) return "";
  if (pts.length === 1) return `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`;

  const n = pts.length;
  // Slopes of secant lines
  const dx: number[] = new Array(n - 1);
  const dy: number[] = new Array(n - 1);
  const m: number[] = new Array(n - 1);
  for (let i = 0; i < n - 1; i++) {
    dx[i] = pts[i + 1].x - pts[i].x;
    dy[i] = pts[i + 1].y - pts[i].y;
    m[i] = dx[i] === 0 ? 0 : dy[i] / dx[i];
  }

  // Tangents at each knot
  const t: number[] = new Array(n);
  t[0] = m[0];
  t[n - 1] = m[n - 2];
  for (let i = 1; i < n - 1; i++) {
    if (m[i - 1] * m[i] <= 0) {
      t[i] = 0;
    } else {
      t[i] = (m[i - 1] + m[i]) / 2;
    }
  }

  // Fritsch-Carlson monotonicity correction
  for (let i = 0; i < n - 1; i++) {
    if (m[i] === 0) {
      t[i] = 0;
      t[i + 1] = 0;
    } else {
      const a = t[i] / m[i];
      const b = t[i + 1] / m[i];
      const h = Math.hypot(a, b);
      if (h > 3) {
        const factor = 3 / h;
        t[i] = factor * a * m[i];
        t[i + 1] = factor * b * m[i];
      }
    }
  }

  // Build path as cubic Bezier segments
  let path = `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`;
  for (let i = 0; i < n - 1; i++) {
    const x0 = pts[i].x;
    const y0 = pts[i].y;
    const x1 = pts[i + 1].x;
    const y1 = pts[i + 1].y;
    const h = dx[i];
    const c1x = x0 + h / 3;
    const c1y = y0 + (t[i] * h) / 3;
    const c2x = x1 - h / 3;
    const c2y = y1 - (t[i + 1] * h) / 3;
    path +=
      ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)},` +
      ` ${c2x.toFixed(2)} ${c2y.toFixed(2)},` +
      ` ${x1.toFixed(2)} ${y1.toFixed(2)}`;
  }
  return path;
}

// Reverse a polyline for the bottom edge of a closed band path.
function reversePoints(pts: { x: number; y: number }[]): { x: number; y: number }[] {
  const out = new Array<{ x: number; y: number }>(pts.length);
  for (let i = 0; i < pts.length; i++) out[i] = pts[pts.length - 1 - i];
  return out;
}

// ── Offset (baseline) computation ───────────────────────────────────────
//
// Returns y0[columnIndex] — the BOTTOM of the stack at each x-column,
// in DATA SPACE (positive = up). Each series then stacks upward by its
// value at that column.
function computeBaseline(
  matrix: number[][], // matrix[seriesIdx][colIdx]
  offset: StreamOffset,
): number[] {
  const nSeries = matrix.length;
  if (nSeries === 0) return [];
  const nCols = matrix[0].length;
  const totals: number[] = new Array(nCols).fill(0);
  for (let s = 0; s < nSeries; s++) {
    for (let c = 0; c < nCols; c++) totals[c] += matrix[s][c];
  }

  if (offset === "zero") {
    return new Array(nCols).fill(0);
  }
  if (offset === "silhouette") {
    return totals.map((t) => -t / 2);
  }

  // "wiggle" — Byron & Wattenberg 2008 minimum slope-sum baseline.
  //   g0(0) = 0
  //   g0(i) = g0(i-1) − sum over series of ((n-s) * (f[s][i] − f[s][i-1])) / (n+1)
  // Here "n" is the series count and f[s][i] is the layer thickness.
  const y0: number[] = new Array(nCols).fill(0);
  for (let i = 1; i < nCols; i++) {
    let delta = 0;
    for (let s = 0; s < nSeries; s++) {
      const layerDelta = matrix[s][i] - matrix[s][i - 1];
      delta += ((nSeries - s) * layerDelta) / (nSeries + 1);
    }
    y0[i] = y0[i - 1] - delta;
  }
  // Re-center around the y-midline so the result fills the band similarly
  // to silhouette. Without this, wiggle drifts upward over time.
  const avg = y0.reduce((a, b) => a + b, 0) / y0.length;
  const avgTotal = totals.reduce((a, b) => a + b, 0) / totals.length;
  // Shift so the centroid of (y0 + total/2) sits at 0
  const shift = avg + avgTotal / 2;
  return y0.map((v) => v - shift);
}

export const Streamgraph: React.FC<{ data: StreamgraphData }> = ({ data }) => {
  checkChartDataCommon("Streamgraph", data);
  warnIf(
    data.series.length > 8 && !data.aggregateOther,
    "Streamgraph",
    `${data.series.length} series — Streamgraph reads cleanest at 4–7 bands. ` +
      `Above 8, color differentiation breaks down and labels collide. ` +
      `Consider bucketing the smallest into an "Other" series ` +
      `(set \`aggregateOther: { maxSeries: 6 }\` for automatic rollup).`,
  );
  warnIf(
    data.series.length >= 2 &&
      !data.series.every((s) => s.values.length === data.series[0].values.length),
    "Streamgraph",
    `Series have mismatched value counts — Streamgraph assumes a shared ` +
      `x-grid across series. Resample upstream before passing to the template.`,
  );

  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const direction = useDirection(data._direction);
  const { style: compStyle } = useCompositionAnimation(direction.driftOptions);
  const bgVariant = data.backgroundVariant ?? "light";
  const theme = useThemeMode(bgVariant);
  const accent = palette.gold;

  const offsetMode: StreamOffset = data.offset ?? "silhouette";

  // ── Series aggregation (optional "Other" bucket) ─────────────────────
  // When `aggregateOther` is set and the input has more series than
  // `maxSeries`, we rank ALL input series by their total area
  // (sum of `value` across every x-column — a stable, time-invariant
  // ranking) and keep the top `maxSeries - 1`. The remaining series are
  // summed column-by-column into ONE rolled-up "Other" series.
  //
  // Edge note: ranking by total area (not per-column rank) means a series
  // that spikes briefly in one year but is small overall gets rolled into
  // Other — the band still SHOWS that spike (it contributes to Other's
  // column sum), it just isn't named. This is the right tradeoff for a
  // streamgraph: the editorial point is composition-shift readability,
  // not per-year top-N. A small series that becomes large for one year
  // then shrinks again would correctly land in Other (its total area is
  // small); a series that's small early and dominant late would correctly
  // be kept as named (its total area is large).
  //
  // "Other" is appended LAST in the series list. Because Streamgraph
  // stacks bottom-up in array order, last-in-array sits at the TOP of
  // the visual stack — to put Other at the BOTTOM we prepend it. We
  // also normalize x-grid by intersecting on the first series' columns
  // (matches the existing matrix-builder assumption).
  const effectiveSeries = useMemo<StreamSeries[]>(() => {
    const agg = data.aggregateOther;
    if (!agg) return data.series;
    const maxSeries = agg.maxSeries ?? 6;
    if (data.series.length <= maxSeries) return data.series;

    const otherLabel = agg.otherLabel ?? "Other";
    const otherColor = agg.otherColor ?? palette.bone;

    // 1. Rank series by total area (sum of values across all columns).
    const ranked = data.series
      .map((s, originalIdx) => ({
        s,
        originalIdx,
        total: s.values.reduce((acc, p) => acc + p.value, 0),
      }))
      .sort((a, b) => b.total - a.total);

    const keepCount = Math.max(1, maxSeries - 1);
    const kept = ranked.slice(0, keepCount);
    const rolled = ranked.slice(keepCount);

    // 2. Preserve the kept series in their ORIGINAL array order, so the
    //    author's intended stacking (e.g., chronological / geographic
    //    grouping) is respected within the kept set.
    const keptInOrder = kept
      .slice()
      .sort((a, b) => a.originalIdx - b.originalIdx)
      .map((r) => r.s);

    // 3. Sum the rolled-out series column-by-column. We anchor on the
    //    x-grid of the FIRST rolled series and gather values by x-key,
    //    which is robust to series that share x-positions but differ
    //    in length (warned about separately).
    const xGrid = rolled[0]?.s.values.map((p) => p.x) ?? [];
    const otherValues = xGrid.map((x) => {
      let sum = 0;
      for (const r of rolled) {
        const point = r.s.values.find((p) => p.x === x);
        if (point) sum += point.value;
      }
      return { x, value: sum };
    });
    const otherSeries: StreamSeries = {
      id: "__aggregated_other__",
      label: otherLabel,
      color: otherColor,
      values: otherValues,
    };

    // 4. Place "Other" FIRST (bottom of stack — array index 0 stacks
    //    upward from the baseline first).
    return [otherSeries, ...keptInOrder];
  }, [data.series, data.aggregateOther]);

  // ── Chart rect ────────────────────────────────────────────────────────
  // Reserve room under the title for the chart, and a small strip at
  // the bottom for the x-axis ticks.
  const area = useMemo(() => contentArea("content", "generous"), []);
  const axisStripH = 44;
  const chartLeft = area.left;
  const chartRight = area.left + area.width;
  const chartTop = area.top + 16;
  const chartBottom = area.top + area.height - axisStripH;
  const chartWidth = chartRight - chartLeft;
  const chartHeight = chartBottom - chartTop;
  const midlineY = chartTop + chartHeight / 2;

  // ── Build the value matrix ────────────────────────────────────────────
  // matrix[seriesIdx][colIdx] = value. xColumns are pulled from the FIRST
  // series; we trust that all series share the same x-grid (warned above
  // if not).
  const { matrix, xColumns, xMin, xMax } = useMemo(() => {
    const cols = effectiveSeries[0]?.values.map((p) => p.x) ?? [];
    const mat = effectiveSeries.map((s) => {
      const byX: Record<number, number> = {};
      for (const p of s.values) byX[p.x] = p.value;
      return cols.map((x) => byX[x] ?? 0);
    });
    const nums = cols;
    const lo = nums.length > 0 ? Math.min(...nums) : 0;
    const hi = nums.length > 0 ? Math.max(...nums) : 1;
    return { matrix: mat, xColumns: cols, xMin: lo, xMax: hi };
  }, [effectiveSeries]);

  // ── Compute y0 baseline + stacked top per series in DATA space ──────
  const stack = useMemo(() => {
    const y0 = computeBaseline(matrix, offsetMode);
    // y top per series per column
    const tops: number[][] = [];
    const bottoms: number[][] = [];
    let running = y0.slice();
    for (let s = 0; s < matrix.length; s++) {
      const bottom = running.slice();
      const top = running.map((b, c) => b + matrix[s][c]);
      bottoms.push(bottom);
      tops.push(top);
      running = top;
    }
    // Compute the data-space y extent so we can scale to pixels.
    let dMin = Infinity;
    let dMax = -Infinity;
    for (const row of bottoms) {
      for (const v of row) {
        if (v < dMin) dMin = v;
      }
    }
    for (const row of tops) {
      for (const v of row) {
        if (v > dMax) dMax = v;
      }
    }
    if (!Number.isFinite(dMin)) dMin = 0;
    if (!Number.isFinite(dMax)) dMax = 1;
    // Symmetric pad so the river doesn't kiss the chart edges.
    const pad = (dMax - dMin) * 0.08 || 1;
    return { tops, bottoms, dMin: dMin - pad, dMax: dMax + pad };
  }, [matrix, offsetMode]);

  // ── Scales ────────────────────────────────────────────────────────────
  const xToPx = (x: number): number => {
    if (xMax === xMin) return chartLeft + chartWidth / 2;
    return chartLeft + ((x - xMin) / (xMax - xMin)) * chartWidth;
  };
  // Data y grows UP; SVG y grows DOWN. We anchor data y=0 to the chart
  // midline so silhouette streamgraphs read symmetric out of the box.
  const yScale = chartHeight / (stack.dMax - stack.dMin);
  const yToPx = (y: number): number => {
    // Map data-y so that 0 → midline (roughly; exact mapping depends on
    // dMin/dMax — for silhouette these are symmetric, so 0 lands at the
    // midline naturally).
    const centerOffset = (stack.dMax + stack.dMin) / 2;
    return midlineY - (y - centerOffset) * yScale;
  };

  // ── Build per-series path strings + label placement ──────────────────
  const seriesGeom = useMemo(() => {
    return effectiveSeries.map((s, sIdx) => {
      const topY = stack.tops[sIdx];
      const botY = stack.bottoms[sIdx];
      const topPx = xColumns.map((x, c) => ({ x: xToPx(x), y: yToPx(topY[c]) }));
      const botPx = xColumns.map((x, c) => ({ x: xToPx(x), y: yToPx(botY[c]) }));

      const topPath = monotoneCubic(topPx);
      const botReversed = reversePoints(botPx);
      // Strip the leading "M x y " from the bottom-edge bezier so it can
      // continue from the explicit "L botReversed[0]" we insert below.
      // Previously this regex replaced "M x y" with just "L" (no coords),
      // which produced a malformed `"L  C ..."` segment with no L target;
      // browsers either dropped the L or rendered an off-by-one stitch.
      const botPathTail = monotoneCubic(botReversed).replace(
        /^M [^ ]+ [^ ]+\s*/,
        "",
      );
      const closedPath = `${topPath} L ${botReversed[0].x.toFixed(2)} ${botReversed[0].y.toFixed(2)} ${botPathTail} Z`;

      // Label placement: x-column where THIS band is widest (largest
      // matrix[sIdx][c]). Vertical center between top and bottom there.
      let widestCol = 0;
      let widestVal = -Infinity;
      for (let c = 0; c < xColumns.length; c++) {
        const v = matrix[sIdx][c];
        if (v > widestVal) {
          widestVal = v;
          widestCol = c;
        }
      }
      const labelX = xToPx(xColumns[widestCol]);
      const labelY = (yToPx(topY[widestCol]) + yToPx(botY[widestCol])) / 2;
      const bandThicknessPx = Math.abs(
        yToPx(botY[widestCol]) - yToPx(topY[widestCol]),
      );

      return {
        series: s,
        path: closedPath,
        labelX,
        labelY,
        bandThicknessPx,
      };
    });
    // xToPx / yToPx are pure functions of memoised inputs; ESLint can't see that.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveSeries, stack, xColumns, matrix, chartLeft, chartWidth, midlineY, yScale]);

  // ── X-axis ticks ─────────────────────────────────────────────────────
  // Show first, last, and ~3 evenly-spaced intermediate ticks if there
  // are enough columns. We pull from xColumns so the ticks always land
  // on real data positions.
  const xTicks = useMemo(() => {
    if (xColumns.length === 0) return [] as number[];
    if (xColumns.length <= 6) return xColumns;
    const targetCount = 6;
    const step = (xColumns.length - 1) / (targetCount - 1);
    const ticks: number[] = [];
    for (let i = 0; i < targetCount; i++) {
      ticks.push(xColumns[Math.round(i * step)]);
    }
    return ticks;
  }, [xColumns]);

  // ── Timing ───────────────────────────────────────────────────────────
  const structureStart = timing.entrance.snap;     //  6 — axis fade
  // D17 anticipatory reveal: first band settled when narrator names it.
  const firstSyncFrame = direction.syncPoints?.[0]?.frame;
  const entranceBase = firstSyncFrame != null
    ? anticipatoryStartFrame(firstSyncFrame, sec(0.4))
    : sec(0.6); // existing default
  const bandsStart = entranceBase;
  const bandStagger = sec(0.18);
  const bandGrow = sec(0.9);
  const exitOp = exitFade(frame, durationInFrames, 15);

  // ── Render ───────────────────────────────────────────────────────────
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
          {/* ── Faint midline / baseline (suppressed y-axis) ───────────
              Streamgraph y is relative — we render only a barely-there
              horizontal rule at the midline as a visual anchor. */}
          <line
            x1={chartLeft}
            y1={midlineY}
            x2={chartRight}
            y2={midlineY}
            stroke={theme.text.muted}
            strokeWidth={0.5}
            opacity={0.18 * fadeIn(frame, structureStart, sec(0.4)) * exitOp}
            strokeDasharray="2 4"
          />

          {/* ── Y-axis label (optional, top-left, small caps) ──────── */}
          {data.yAxisLabel && (
            <text
              x={chartLeft}
              y={chartTop - 8}
              fill={theme.text.muted}
              fontSize={fontSizes.meta}
              fontFamily={fonts.mono}
              fontWeight={fontWeights.regular}
              letterSpacing={letterSpacing.meta}
              opacity={fadeIn(frame, structureStart, sec(0.4)) * exitOp}
              style={{ textTransform: "uppercase" }}
            >
              {data.yAxisLabel}
            </text>
          )}

          {/* ── Bands ─────────────────────────────────────────────────
              Each series is a filled closed path. The reveal is a
              vertical scale around the midline: scaleY(0)→scaleY(1).
              We apply it via SVG transform with the midline as the
              origin so the band "blooms" from the river axis. */}
          {seriesGeom.map((g, sIdx) => {
            const fallback = getCategoricalColor(sIdx);
            const fill = resolveSeriesColor(g.series.color, fallback, accent);

            const start = bandsStart + stagger(sIdx, bandStagger);
            const progress = interpolate(
              frame,
              [start, start + bandGrow],
              [0, 1],
              CLAMP_CUBIC,
            );

            // scaleY around midline. Using SVG transform-origin via
            // matrix(): translateY(midline*(1-s)) scaleY(s) gives a
            // scale anchored at y=midline.
            const s = progress;
            const transform = `matrix(1, 0, 0, ${s}, 0, ${midlineY * (1 - s)})`;

            // Band opacity easing — fade in slightly behind the scale.
            const op =
              interpolate(
                frame,
                [start, start + bandGrow * 0.5],
                [0, 1],
                CLAMP,
              ) * exitOp;

            return (
              <g key={`band-${g.series.id}`} transform={transform} opacity={op}>
                <path
                  d={g.path}
                  fill={fill}
                  stroke={fill}
                  strokeWidth={0.5}
                  // Soft contour so adjacent bands don't seam-stripe in the render.
                  strokeOpacity={0.6}
                  fillOpacity={0.92}
                />
              </g>
            );
          })}

          {/* ── In-band labels ───────────────────────────────────────
              Each label sits at the band's widest x and the vertical
              center of the band there. Labels fade in once the band
              has settled. Suppressed if the band is too thin to host
              a label legibly (< 22px). */}
          {seriesGeom.map((g, sIdx) => {
            const start = bandsStart + stagger(sIdx, bandStagger) + bandGrow;
            const labelOp =
              fadeIn(frame, start, timing.entrance.medium) * exitOp;
            if (g.bandThicknessPx < 22) return null;
            return (
              <g key={`label-${g.series.id}`} opacity={labelOp}>
                <text
                  x={g.labelX}
                  y={g.labelY + 5}
                  textAnchor="middle"
                  fill={theme.text.primary}
                  fontSize={fontSizes.label}
                  fontFamily={fonts.heading}
                  fontWeight={fontWeights.semibold}
                  letterSpacing={0.4}
                  style={{
                    paintOrder: "stroke",
                    stroke: theme.bg.base,
                    strokeWidth: 4,
                    strokeLinejoin: "round",
                  }}
                >
                  {g.series.label}
                </text>
              </g>
            );
          })}

          {/* ── X-axis ticks ──────────────────────────────────────── */}
          {xTicks.map((tickX, i) => {
            const px = xToPx(tickX);
            const op =
              fadeIn(frame, structureStart + stagger(i, 2), sec(0.4)) * exitOp;
            return (
              <g key={`xtick-${tickX}-${i}`} opacity={op}>
                <line
                  x1={px}
                  y1={chartBottom}
                  x2={px}
                  y2={chartBottom + 4}
                  stroke={theme.text.muted}
                  strokeWidth={0.5}
                  opacity={0.5}
                />
                <text
                  x={px}
                  y={chartBottom + 22}
                  textAnchor="middle"
                  fill={theme.text.muted}
                  fontSize={fontSizes.caption}
                  fontFamily={fonts.mono}
                  fontWeight={fontWeights.regular}
                  letterSpacing={letterSpacing.caption}
                >
                  {Math.round(tickX)}
                </text>
              </g>
            );
          })}

          {/* ── X-axis label ─────────────────────────────────────── */}
          {data.xAxisLabel && (
            <text
              x={chartLeft + chartWidth}
              y={chartBottom + 38}
              textAnchor="end"
              fill={theme.text.muted}
              fontSize={fontSizes.meta}
              fontFamily={fonts.mono}
              fontWeight={fontWeights.regular}
              letterSpacing={letterSpacing.meta}
              opacity={fadeIn(frame, structureStart, sec(0.4)) * exitOp}
              style={{ textTransform: "uppercase" }}
            >
              {data.xAxisLabel}
            </text>
          )}
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
