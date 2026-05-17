/**
 * BulletChart — target vs actual + qualitative ranges. Stephen Few's
 * dashboard-grade primitive elevated to editorial register.
 *
 * Each row: a horizontal bar with three shaded background bands (qualitative
 * ranges, ascending darkness from "bad" to "good"), the actual value as a
 * solid bar overlay, and the target as a vertical tick mark.
 */

import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import {
  palette,
  fonts,
  fontSizes,
  fontWeights,
  letterSpacing,
  sec,
} from "../../design/theme";
import { fadeIn, easings } from "../../utils/animation";
import { useDirection } from "../../hooks/useDirection";
import { useCompositionAnimation } from "../../hooks/useCompositionAnimation";
import { EditorialFrame } from "../../components/EditorialFrame/EditorialFrame";
import type { Rect } from "../../components/EditorialFrame/EditorialFrame";
import { useThemeMode } from "../../hooks/useThemeMode";
import type { BulletChartData, BulletMeasure } from "./types";

export const BulletChart: React.FC<{ data: BulletChartData }> = ({ data }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  useDirection(data._direction, "none");
  useCompositionAnimation();

  const frameProps = data.frame ?? {
    title: data.title,
    layout: "centered" as const,
    chrome: "publication" as const,
    legend: "suppressed" as const,
    source: data.source,
  };

  return (
    <EditorialFrame
      frame={frameProps}
      episode={data.episode}
      durationInFrames={durationInFrames}
    >
      {(chartRect) => (
        <BulletContent
          measures={data.measures}
          unit={data.unit}
          chartRect={chartRect}
          frame={frame}
        />
      )}
    </EditorialFrame>
  );
};

const BulletContent: React.FC<{
  measures: BulletMeasure[];
  unit?: string;
  chartRect: Rect;
  frame: number;
}> = ({ measures, unit, chartRect, frame }) => {
  const theme = useThemeMode("light");

  const LABEL_W = 180;
  const ROW_GAP = 22;
  const rowHeight = Math.min(64, (chartRect.height - ROW_GAP * (measures.length - 1)) / measures.length);
  const innerWidth = chartRect.width - LABEL_W - 30;

  // Qualitative range tints (progressively darker; "bad" is lightest, "good" darkest).
  const rangeColors = [
    `${palette.taupe}55`,
    `${palette.umber}55`,
    `${palette.walnut}55`,
  ];

  return (
    <>
      {measures.map((m, i) => {
        const rowY = i * (rowHeight + ROW_GAP);
        const maxValue = m.qualitativeRanges[m.qualitativeRanges.length - 1];

        const drawStart = sec(0.4) + i * sec(0.1);
        const grow = interpolate(
          frame,
          [drawStart, drawStart + sec(1.0)],
          [0, 1],
          {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: easings.bar,
          },
        );
        const labelFade = fadeIn(frame, drawStart + sec(0.6), sec(0.4));

        const barH = rowHeight * 0.55;
        const targetH = rowHeight * 0.85;
        const barTopWithinRow = (rowHeight - barH) / 2;
        const targetTopWithinRow = (rowHeight - targetH) / 2;

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 0,
              top: rowY,
              width: chartRect.width,
              height: rowHeight,
              display: "flex",
              alignItems: "center",
            }}
          >
            {/* Measure label */}
            <div
              style={{
                width: LABEL_W,
                fontFamily: fonts.body,
                fontSize: fontSizes.label,
                fontWeight: fontWeights.bold,
                color: theme.text.primary,
                opacity: labelFade,
                paddingRight: 16,
              }}
            >
              {m.label}
            </div>

            {/* Bar wrapper */}
            <div
              style={{
                position: "relative",
                height: rowHeight,
                width: innerWidth,
              }}
            >
              {/* Qualitative range bands */}
              {m.qualitativeRanges.map((upper, j) => {
                const lower = j === 0 ? 0 : m.qualitativeRanges[j - 1];
                const x = (lower / maxValue) * innerWidth;
                const w = ((upper - lower) / maxValue) * innerWidth;
                return (
                  <div
                    key={j}
                    style={{
                      position: "absolute",
                      left: x,
                      top: 0,
                      width: w,
                      height: rowHeight,
                      backgroundColor: rangeColors[j % rangeColors.length],
                      opacity: fadeIn(frame, drawStart - sec(0.1), sec(0.4)),
                    }}
                  />
                );
              })}

              {/* Actual value bar */}
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: barTopWithinRow,
                  width: ((m.actual / maxValue) * innerWidth) * grow,
                  height: barH,
                  backgroundColor: m.color ?? palette.gold,
                }}
              />

              {/* Target tick mark */}
              <div
                style={{
                  position: "absolute",
                  left: (m.target / maxValue) * innerWidth - 2,
                  top: targetTopWithinRow,
                  width: 4,
                  height: targetH,
                  backgroundColor: theme.text.primary,
                  opacity: fadeIn(frame, drawStart + sec(0.8), sec(0.4)),
                }}
              />

              {/* Inline value (actual) at end of bar */}
              <div
                style={{
                  position: "absolute",
                  left: ((m.actual / maxValue) * innerWidth) * grow + 10,
                  top: barTopWithinRow + 4,
                  fontFamily: fonts.mono,
                  fontSize: fontSizes.label,
                  fontWeight: fontWeights.bold,
                  color: theme.text.primary,
                  opacity: labelFade,
                  whiteSpace: "nowrap",
                }}
              >
                {m.actual}
                {unit ?? ""}
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
};
