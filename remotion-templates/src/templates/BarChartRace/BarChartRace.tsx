/**
 * BarChartRace — kinetic ranking chart.
 *
 * The form popularised by John Burn-Murdoch's FT "great-power GDP race":
 * horizontal bars whose widths AND vertical positions change continuously
 * across time periods. The viewer feels rank changes, not just reads them.
 *
 * Animation engine:
 *  • Frame-independent data (colorMap, globalMax, allEntityIds, periodFps)
 *    is pre-computed in useMemo.
 *  • Per-frame computation (value interpolation, sort, rank, y-positions,
 *    bar widths) runs in the render body — O(n log n) per frame.
 *  • BarRow sub-component is wrapped in React.memo.
 *  • warnIf() guards data-quality issues (fires once per session, not 30×/s).
 */

import React, { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";
import {
  palette,
  fonts,
  fontSizes,
  fontWeights,
  fontFeatureSettings,
  getCategoricalColor,
} from "../../design/theme";
import { Background } from "../../components/Background";
import { HeaderStrip } from "../../components/HeaderStrip";
import { FooterStrip } from "../../components/FooterStrip";
import { useCompositionAnimation } from "../../hooks/useCompositionAnimation";
import { useDirection } from "../../hooks/useDirection";
import { warnIf } from "../../utils/dataWarnings";
import { CLAMP } from "../../utils/animation";
import type { BarChartRaceData } from "./types";

// ── Layout constants ─────────────────────────────────────────────────────────

const SAFE_TOP = 100;        // px from top for title area
const SAFE_BOTTOM = 80;      // px from bottom for source / axis
const SAFE_LEFT = 80;        // outer left padding
const SAFE_RIGHT = 80;       // outer right padding

const LABEL_WIDTH = 160;     // px — entity label column (right-aligned)
const LABEL_GAP = 12;        // px — gap between label column and bar
const VALUE_LABEL_WIDTH = 120; // px — value text at bar end
const TITLE_HEIGHT = 72;     // px — space reserved for title
const SUBTITLE_HEIGHT = 32;  // px — space for subtitle below title

const CANVAS_WIDTH = 1920;
const CANVAS_HEIGHT = 1080;

// ── Value formatting ─────────────────────────────────────────────────────────

/**
 * Format a number using a printf-style format string.
 *
 * Supported patterns:
 *   %[flag][width][.precision]f  — floating point
 *
 * Prefix/suffix strings surrounding the format directive are preserved:
 *   "$%.1fT" → "$28.8T"
 *   "%.0f"   → "29"
 *   "$%.0fB" → "$916B"
 */
function formatValue(value: number, fmt: string | undefined): string {
  if (!fmt) return String(Math.round(value));

  // Match the printf directive: optional $, %, optional width, optional .prec, f
  // We support the common case: any literal prefix + %[.N]f + any literal suffix
  const match = fmt.match(/^(.*?)%(\d*)(?:\.(\d+))?f(.*)$/);
  if (!match) return String(Math.round(value));

  const prefix = match[1] ?? "";
  const precision = match[3] != null ? parseInt(match[3], 10) : 0;
  const suffix = match[4] ?? "";

  return `${prefix}${value.toFixed(precision)}${suffix}`;
}

// ── BarRow sub-component (React.memo) ────────────────────────────────────────

interface BarRowProps {
  x: number;           // left edge of bar (after label column)
  y: number;           // top edge of bar row
  width: number;       // bar width in px
  height: number;      // bar height in px
  color: string;
  opacity: number;
  label: string;
  sublabel?: string;
  valueText: string;
  labelX: number;      // right edge of label column (bars start here)
  labelWidth: number;
  isTop: boolean;      // rank 0 — slight hero treatment
}

const BarRow: React.FC<BarRowProps> = React.memo(({
  x,
  y,
  width,
  height,
  color,
  opacity,
  label,
  sublabel,
  valueText,
  labelX,
  labelWidth,
  isTop,
}) => {
  const barOpacity = opacity;
  const labelOpacity = Math.min(1, opacity * 1.5); // label fades in faster

  return (
    <div
      style={{
        position: "absolute",
        left: labelX - labelWidth,
        top: y,
        width: labelWidth + LABEL_GAP + width + VALUE_LABEL_WIDTH,
        height,
        opacity: barOpacity,
        pointerEvents: "none",
      }}
    >
      {/* Entity label — right-aligned in label column */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: labelWidth,
          height,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          justifyContent: "center",
          opacity: labelOpacity,
          paddingRight: 8,
        }}
      >
        <span
          style={{
            fontFamily: fonts.display,
            fontSize: isTop ? 18 : 16,
            fontWeight: isTop ? fontWeights.semibold : fontWeights.medium,
            color: palette.ink,
            letterSpacing: 0.3,
            lineHeight: 1.1,
            textAlign: "right",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            maxWidth: labelWidth - 8,
          }}
        >
          {label}
        </span>
        {sublabel && (
          <span
            style={{
              fontFamily: fonts.metadata,
              fontSize: 12,
              fontWeight: fontWeights.regular,
              color: palette.umber,
              marginTop: 1,
            }}
          >
            {sublabel}
          </span>
        )}
      </div>

      {/* Horizontal bar */}
      <div
        style={{
          position: "absolute",
          left: labelWidth + LABEL_GAP,
          top: isTop ? 4 : 6,
          width: Math.max(0, width),
          height: height - (isTop ? 8 : 12),
          backgroundColor: color,
          borderRadius: 2,
          // Subtle right-edge glow for hero bar
          boxShadow: isTop ? `2px 0 8px ${color}66` : "none",
        }}
      />

      {/* Value label — at bar end */}
      <div
        style={{
          position: "absolute",
          left: labelWidth + LABEL_GAP + Math.max(0, width) + 8,
          top: 0,
          width: VALUE_LABEL_WIDTH - 8,
          height,
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-start",
        }}
      >
        <span
          style={{
            fontFamily: fonts.data,
            fontSize: isTop ? 16 : 14,
            fontWeight: isTop ? fontWeights.semibold : fontWeights.regular,
            color: isTop ? palette.walnut : palette.umber,
            fontFeatureSettings: fontFeatureSettings.tabular,
            whiteSpace: "nowrap",
          }}
        >
          {valueText}
        </span>
      </div>
    </div>
  );
});

BarRow.displayName = "BarRow";

// ── Main component ───────────────────────────────────────────────────────────

export const BarChartRace: React.FC<{ data: BarChartRaceData }> = ({ data }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const direction = useDirection(data._direction);
  // noDrift: true — bars animate width+vertical position; Ken Burns drift would fight the motion.
  const { style: compStyle } = useCompositionAnimation({ noDrift: true });

  const backgroundVariant = data.backgroundVariant ?? "light";
  const mode = backgroundVariant;
  const topN = data.topN ?? 10;
  const barH = data.barHeight ?? 52;
  const barGap = data.barGap ?? 8;
  const periodDurSec = data.durationPerPeriod ?? 1.5;
  const showAxis = data.showValueAxis !== false;
  const periodLabelPos = data.periodLabelPosition ?? "bottom-right";

  // ── warnIf guards (in useMemo — only re-fires when data changes, not every frame) ──
  useMemo(() => {
    warnIf(data.periods.length < 2, "BarChartRace", "periods.length < 2 — need at least two periods to animate.");
    warnIf(topN > 15, "BarChartRace", "topN > 15 — bar chart race is difficult to read at >15 rows.");
    data.periods.forEach((p, i) => {
      warnIf(p.values.length === 0, "BarChartRace", `Period[${i}] ("${p.label}") has 0 values — will render blank.`);
    });
  }, [data.periods, topN]);

  // ── Frame-independent pre-computation (useMemo) ──────────────────────────

  // All entity ids across all periods
  const allEntityIds = useMemo<string[]>(() => {
    const ids = new Set<string>();
    data.periods.forEach(p => p.values.forEach(v => ids.add(v.id)));
    return Array.from(ids);
  }, [data.periods]);

  // Per-entity color assignment: use entity.color if set, else cycle defaultPalette,
  // else fall back to getCategoricalColor
  const entityColors = useMemo<Map<string, string>>(() => {
    const palette_ = data.defaultPalette;
    const colorMap = new Map<string, string>();
    let autoIndex = 0;
    // First pass: assign explicit colors
    data.periods.forEach(p =>
      p.values.forEach(v => {
        if (v.color && !colorMap.has(v.id)) {
          colorMap.set(v.id, v.color);
        }
      })
    );
    // Second pass: assign palette-cycled colors for remaining ids
    allEntityIds.forEach(id => {
      if (!colorMap.has(id)) {
        if (palette_ && palette_.length > 0) {
          colorMap.set(id, palette_[autoIndex % palette_.length]);
        } else {
          colorMap.set(id, getCategoricalColor(autoIndex));
        }
        autoIndex++;
      }
    });
    return colorMap;
  }, [data.periods, allEntityIds, data.defaultPalette]);

  // Global maximum across ALL periods — stable x-axis so bars don't stretch as max changes
  const globalMax = useMemo<number>(() => {
    let max = 0;
    data.periods.forEach(p => p.values.forEach(v => { if (v.value > max) max = v.value; }));
    return max || 1; // guard divide-by-zero
  }, [data.periods]);

  // Seconds-per-period → frames-per-period
  const periodFps = useMemo(() => Math.round(fps * periodDurSec), [fps, periodDurSec]);

  // Label lookup maps for each period — avoid .find() in hot path
  const periodValueMaps = useMemo<Array<Map<string, { value: number; label: string; sublabel?: string }>>>(() =>
    data.periods.map(p => {
      const m = new Map<string, { value: number; label: string; sublabel?: string }>();
      p.values.forEach(v => m.set(v.id, { value: v.value, label: v.label, sublabel: v.sublabel }));
      return m;
    }),
    [data.periods]
  );

  // ── Per-frame computation (runs in render — NOT useMemo) ─────────────────

  // Layout geometry
  const plotLeft = SAFE_LEFT + LABEL_WIDTH + LABEL_GAP;
  const plotRight = CANVAS_WIDTH - SAFE_RIGHT - VALUE_LABEL_WIDTH;
  const plotWidth = plotRight - plotLeft;
  const barMaxWidth = plotWidth;

  const titleAreaHeight = (data.title ? TITLE_HEIGHT : 0) + (data.subtitle ? SUBTITLE_HEIGHT : 0);
  const axisHeight = showAxis ? 24 : 0;
  const plotTop = SAFE_TOP + titleAreaHeight + 16;
  const plotBottom = CANVAS_HEIGHT - SAFE_BOTTOM - axisHeight;
  const plotHeight = plotBottom - plotTop;

  // Total animation frames: each period pair gets periodFps, last period is held
  const numPairs = data.periods.length - 1;
  const totalFrames = numPairs * periodFps;
  const clampedFrame = Math.min(frame, totalFrames - 1);

  // Which period pair are we in?
  const periodIndex = Math.min(
    Math.floor(clampedFrame / periodFps),
    numPairs - 1
  );
  const rawProgress = periodFps > 0 ? (clampedFrame % periodFps) / periodFps : 0;

  // Apply easing
  const progress = (data.periodEasing ?? "ease-in-out") === "linear"
    ? rawProgress
    : interpolate(rawProgress, [0, 1], [0, 1], { easing: Easing.inOut(Easing.quad), ...CLAMP });

  // Maps for current pair
  const mapA = periodValueMaps[periodIndex];
  const mapB = periodValueMaps[Math.min(periodIndex + 1, data.periods.length - 1)];

  // Interpolate values for all entities
  const currentValues = allEntityIds.map(id => {
    const entA = mapA.get(id);
    const entB = mapB.get(id);
    const valA = entA?.value ?? 0;
    const valB = entB?.value ?? 0;
    const value = valA + (valB - valA) * progress;
    // Prefer periodB label for display (the label that will be current at end of transition)
    const label = entB?.label ?? entA?.label ?? id;
    const sublabel = entB?.sublabel ?? entA?.sublabel;
    return { id, value, label, sublabel };
  });

  // Sort descending by current value → ranks
  currentValues.sort((a, b) => b.value - a.value);

  // Slice to visible topN (the sorted array is now in rank order)
  const visible = currentValues.slice(0, topN);

  // Bar width scale
  const xWidth = (value: number) => (value / globalMax) * barMaxWidth;

  // Y positions: rank 0 = top of plot area
  const yForRank = (rank: number) => plotTop + rank * (barH + barGap);

  // Check total height fits in available space
  const requiredHeight = topN * (barH + barGap) - barGap;
  const availableHeight = plotHeight;
  // (If it doesn't fit, bars will overflow — author should reduce topN or barHeight)
  warnIf(
    requiredHeight > availableHeight,
    "BarChartRace",
    `topN=${topN} bars at height=${barH}px + gap=${barGap}px = ${requiredHeight}px, exceeds available ${Math.round(availableHeight)}px. Reduce topN or barHeight.`
  );

  // Per-entity opacity: fade in/out as entities enter/leave topN
  // An entity fades in over ~15 frames when its value > 0 and rank < topN
  // An entity that just entered (i.e., was at rank > topN previously) has low initial value
  // We approximate: opacity proportional to how long entity has been visible
  // Simple heuristic: if value > 0, fade in based on value/globalMax clamped; full opacity above 5%
  const entityOpacity = (id: string, value: number) => {
    if (value <= 0) return 0;
    // Gentle fade-in for very small values (entities entering from zero)
    return interpolate(value / globalMax, [0, 0.03], [0, 1], CLAMP);
  };

  // ── Period label (the "race clock") ─────────────────────────────────────

  const periodA = data.periods[periodIndex];
  const periodB = data.periods[Math.min(periodIndex + 1, data.periods.length - 1)];

  // Crossfade period labels in last 20% of each period
  const CROSSFADE_START = 0.8;
  const periodAOpacity = interpolate(progress, [CROSSFADE_START, 1], [1, 0], CLAMP);
  const periodBOpacity = interpolate(progress, [CROSSFADE_START, 1], [0, 1], CLAMP);

  // Title fade-in
  const titleOpacity = interpolate(frame, [0, 12], [0, 1], CLAMP);

  // Value axis tick positions
  const axisTicks = showAxis ? [0.2, 0.4, 0.6, 0.8, 1.0] : [];

  return (
    <Background
      variant={backgroundVariant}
      atmosphere={direction.atmosphere}
      atmosphereIntensity={direction.atmosphereIntensity}
      tint={direction.backgroundTint}
    >
      <AbsoluteFill style={compStyle}>
        <HeaderStrip metadata={data.episode} mode={mode} />

        {/* ── Title block ──────────────────────────────────────────────────── */}
        {(data.title || data.subtitle) && (
          <div
            style={{
              position: "absolute",
              left: SAFE_LEFT,
              top: SAFE_TOP,
              right: SAFE_RIGHT,
              opacity: titleOpacity,
              pointerEvents: "none",
            }}
          >
            {data.title && (
              <div
                style={{
                  fontFamily: fonts.display,
                  fontSize: fontSizes.h2,
                  fontWeight: fontWeights.bold,
                  color: palette.ink,
                  letterSpacing: 2,
                  lineHeight: 1.1,
                  textTransform: "uppercase" as const,
                  marginBottom: data.subtitle ? 6 : 0,
                }}
              >
                {data.title}
              </div>
            )}
            {data.subtitle && (
              <div
                style={{
                  fontFamily: fonts.metadata,
                  fontSize: fontSizes.caption,
                  fontWeight: fontWeights.regular,
                  color: palette.umber,
                  letterSpacing: 1,
                }}
              >
                {data.subtitle}
              </div>
            )}
          </div>
        )}

        {/* ── Bars ─────────────────────────────────────────────────────────── */}
        {visible.map((entity, rank) => {
          const barWidth = xWidth(entity.value);
          const y = yForRank(rank);
          const color = entityColors.get(entity.id) ?? getCategoricalColor(rank);
          const opacity = entityOpacity(entity.id, entity.value);
          const valueText = formatValue(entity.value, data.valueFormat);

          return (
            <BarRow
              key={entity.id}
              x={plotLeft}
              y={y}
              width={barWidth}
              height={barH}
              color={color}
              opacity={opacity}
              label={entity.label}
              sublabel={entity.sublabel}
              valueText={valueText}
              labelX={SAFE_LEFT + LABEL_WIDTH}
              labelWidth={LABEL_WIDTH}
              isTop={rank === 0}
            />
          );
        })}

        {/* ── Value axis ───────────────────────────────────────────────────── */}
        {showAxis && (
          <div
            style={{
              position: "absolute",
              left: plotLeft,
              top: plotBottom,
              width: barMaxWidth,
              height: 1,
              backgroundColor: palette.sand,
              opacity: 0.6,
              pointerEvents: "none",
            }}
          >
            {/* Tick marks + labels */}
            {axisTicks.map(t => {
              const tickX = t * barMaxWidth;
              const tickValue = t * globalMax;
              return (
                <div
                  key={t}
                  style={{
                    position: "absolute",
                    left: tickX,
                    top: 0,
                    transform: "translateX(-50%)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    pointerEvents: "none",
                  }}
                >
                  <div
                    style={{
                      width: 1,
                      height: 6,
                      backgroundColor: palette.umber,
                      opacity: 0.5,
                    }}
                  />
                  <span
                    style={{
                      fontFamily: fonts.data,
                      fontSize: 11,
                      color: palette.umber,
                      marginTop: 3,
                      fontFeatureSettings: fontFeatureSettings.tabular,
                      whiteSpace: "nowrap",
                      opacity: 0.7,
                    }}
                  >
                    {formatValue(tickValue, data.valueFormat)}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Period label (race clock) ─────────────────────────────────────── */}
        <div
          style={{
            position: "absolute",
            right: SAFE_RIGHT,
            ...(periodLabelPos === "bottom-right"
              ? { bottom: SAFE_BOTTOM + (showAxis ? 40 : 8) }
              : { top: SAFE_TOP }),
            pointerEvents: "none",
            textAlign: "right" as const,
          }}
        >
          {/* Period A label — fades out as transition progresses */}
          <div
            style={{
              position: "absolute",
              right: 0,
              bottom: 0,
              opacity: periodAOpacity,
              pointerEvents: "none",
            }}
          >
            <span
              style={{
                fontFamily: fonts.data,
                fontSize: 88,
                fontWeight: fontWeights.bold,
                color: palette.taupe,
                opacity: 0.4,
                lineHeight: 1,
                letterSpacing: -2,
                fontFeatureSettings: fontFeatureSettings.tabular,
                whiteSpace: "nowrap",
              }}
            >
              {periodA.label}
            </span>
          </div>
          {/* Period B label — fades in as transition progresses */}
          <div
            style={{
              opacity: periodBOpacity,
              pointerEvents: "none",
            }}
          >
            <span
              style={{
                fontFamily: fonts.data,
                fontSize: 88,
                fontWeight: fontWeights.bold,
                color: palette.taupe,
                opacity: 0.4,
                lineHeight: 1,
                letterSpacing: -2,
                fontFeatureSettings: fontFeatureSettings.tabular,
                whiteSpace: "nowrap",
              }}
            >
              {periodB.label}
            </span>
          </div>
        </div>

        {/* ── Source attribution ───────────────────────────────────────────── */}
        {data.source && (
          <div
            style={{
              position: "absolute",
              left: SAFE_LEFT,
              bottom: 28,
              opacity: titleOpacity * 0.7,
              pointerEvents: "none",
            }}
          >
            <span
              style={{
                fontFamily: fonts.metadata,
                fontSize: 11,
                color: palette.umber,
                letterSpacing: 1.5,
                textTransform: "uppercase" as const,
              }}
            >
              Source: {data.source}
            </span>
          </div>
        )}

        <FooterStrip mode={mode} />
      </AbsoluteFill>
    </Background>
  );
};
