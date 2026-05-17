/**
 * KPICard — hero stat + change indicator + inline sparkline.
 *
 * The "number that matters" composition. Renders inside EditorialFrame's
 * centered (or hero-split) layout: the hero value at display weight, a
 * small change indicator to its right, italic context beneath, optional
 * inline sparkline for trend.
 */

import React, { useMemo } from "react";
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
import { Sparkline } from "../../components/Sparkline";
import { useThemeMode } from "../../hooks/useThemeMode";
import type { KPICardData } from "./types";

export const KPICard: React.FC<{ data: KPICardData }> = ({ data }) => {
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
        <KPIContent
          data={data}
          chartRect={chartRect}
          frame={frame}
        />
      )}
    </EditorialFrame>
  );
};

// ── Chart content ────────────────────────────────────────────────────────────

const KPIContent: React.FC<{
  data: KPICardData;
  chartRect: Rect;
  frame: number;
}> = ({ data, chartRect, frame }) => {
  const theme = useThemeMode("light");

  // Auto-derive change color when changeColor isn't set.
  const changeColor = useMemo(() => {
    if (data.changeColor) return data.changeColor;
    if (!data.change) return theme.text.muted;
    const trimmed = data.change.trim();
    if (trimmed.startsWith("-") || trimmed.startsWith("↓")) return palette.umber;
    return palette.gold;
  }, [data.change, data.changeColor, theme.text.muted]);

  const valueOpacity = fadeIn(frame, sec(0.4), sec(0.5));
  const changeOpacity = fadeIn(frame, sec(0.9), sec(0.4));
  const contextOpacity = fadeIn(frame, sec(1.2), sec(0.5));
  const trendDraw = interpolate(
    frame,
    [sec(1.4), sec(1.4) + sec(1.0)],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: easings.bar,
    },
  );

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: chartRect.width,
        height: chartRect.height,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Hero value + change row */}
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 28,
        }}
      >
        <div
          style={{
            fontFamily: fonts.heading,
            fontSize: fontSizes.display * 1.4,
            fontWeight: fontWeights.bold,
            color: theme.text.primary,
            lineHeight: 1.0,
            letterSpacing: letterSpacing.display,
            opacity: valueOpacity,
          }}
        >
          {data.value}
          {data.unit && (
            <span
              style={{
                fontSize: fontSizes.h1,
                fontWeight: fontWeights.regular,
                color: theme.text.secondary,
                marginLeft: 8,
              }}
            >
              {data.unit}
            </span>
          )}
        </div>
        {data.change && (
          <div
            style={{
              fontFamily: fonts.mono,
              fontSize: fontSizes.h3,
              fontWeight: fontWeights.bold,
              color: changeColor,
              letterSpacing: 0.5,
              opacity: changeOpacity,
            }}
          >
            {data.change}
          </div>
        )}
      </div>

      {/* Italic context dek */}
      {data.context && (
        <div
          style={{
            marginTop: 24,
            fontFamily: fonts.serifBody,
            fontStyle: "italic",
            fontSize: fontSizes.body,
            color: theme.text.secondary,
            maxWidth: chartRect.width * 0.7,
            textAlign: "center",
            opacity: contextOpacity,
            lineHeight: 1.45,
          }}
        >
          {data.context}
        </div>
      )}

      {/* Inline sparkline */}
      {data.trend && data.trend.length > 1 && (
        <div style={{ marginTop: 36, opacity: trendDraw }}>
          <Sparkline
            values={data.trend}
            width={Math.min(360, chartRect.width * 0.45)}
            height={56}
            color={data.trendColor ?? palette.umber}
            strokeWidth={2}
            areaOpacity={0.08}
            endpointDot
            drawProgress={trendDraw}
          />
        </div>
      )}
    </div>
  );
};
