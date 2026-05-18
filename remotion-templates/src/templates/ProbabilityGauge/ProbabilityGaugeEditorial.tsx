/**
 * ProbabilityGaugeEditorial — editorial render path for ProbabilityGauge,
 * focused on the `forecast` variant (the 6-layer superforecasting display
 * used by Parallax's Honest Oracle posture).
 *
 * Wraps the forecast composition inside EditorialFrame:
 *   - Hero-split layout with the probability as the hero stat (left rail)
 *     and the verbal tag as the dek
 *   - Right rail: vertical stack of 5 labeled context cards (baseRate,
 *     keyDriver, keyDisconfirmer, benchmark, resolution)
 *
 * Other variants (gauge / strip / shift / scorecard) fall through to the
 * legacy render path even when `data.frame` is set — they don't yet have
 * editorial render paths. See CHART_MIGRATION_GUIDE.md.
 */

import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import {
  palette,
  fonts,
  fontSizes,
  fontWeights,
  letterSpacing,
  sec,
} from "../../design/theme";
import { fadeIn } from "../../utils/animation";
import { useDirection } from "../../hooks/useDirection";
import { useCompositionAnimation } from "../../hooks/useCompositionAnimation";
import { EditorialFrame } from "../../components/EditorialFrame/EditorialFrame";
import type { Rect } from "../../components/EditorialFrame/EditorialFrame";
import { useThemeMode } from "../../hooks/useThemeMode";
import type { ProbabilityGaugeData, ForecastData } from "./types";

interface ProbabilityGaugeEditorialProps {
  data: ProbabilityGaugeData & {
    frame: NonNullable<ProbabilityGaugeData["frame"]>;
    variant: "forecast";
    forecast: ForecastData;
  };
}

export const ProbabilityGaugeEditorial: React.FC<ProbabilityGaugeEditorialProps> = ({
  data,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  useDirection(data._direction, "none");
  useCompositionAnimation();

  // Auto-derive a hero stat from the forecast probability if the frame
  // didn't already specify one. The "30%" is the editorial hero.
  const heroStat = data.frame.heroStat ?? {
    value: `${data.forecast.probability}%`,
    placement: "left-rail" as const,
    weight: "display" as const,
    color: palette.gold,
  };
  // Promote verbalTag into the dek if frame doesn't have one — keeps the
  // forecast-as-argument structure intact.
  const dek = data.frame.dek ?? data.forecast.verbalTag;

  const frameProps = {
    ...data.frame,
    heroStat,
    dek,
    layout: data.frame.layout ?? ("hero-split" as const),
    splitRatio: data.frame.splitRatio ?? ([38, 62] as [number, number]),
  };

  return (
    <EditorialFrame
      frame={frameProps}
      episode={data.episode}
      durationInFrames={durationInFrames}
    >
      {(chartRect) => (
        <ForecastLayers
          forecast={data.forecast}
          chartRect={chartRect}
          frame={frame}
        />
      )}
    </EditorialFrame>
  );
};

// ── 5-layer context stack ────────────────────────────────────────────────────

const ForecastLayers: React.FC<{
  forecast: ForecastData;
  chartRect: Rect;
  frame: number;
}> = ({ forecast, chartRect, frame }) => {
  const theme = useThemeMode("light");

  const layers: { key: string; label: string; text: string }[] = [
    { key: "baseRate", label: "BASE RATE", text: forecast.baseRate },
    { key: "keyDriver", label: "KEY DRIVER", text: forecast.keyDriver },
    {
      key: "keyDisconfirmer",
      label: "KEY DISCONFIRMER",
      text: forecast.keyDisconfirmer,
    },
    { key: "benchmark", label: "MARKET BENCHMARK", text: forecast.benchmark },
    { key: "resolution", label: "RESOLUTION", text: forecast.resolution },
  ];

  // Stack the 5 cards vertically; each gets equal share of chartRect height
  // with a small gap between.
  const CARD_GAP = 14;
  const totalGap = CARD_GAP * (layers.length - 1);
  const cardHeight = (chartRect.height - totalGap) / layers.length;

  return (
    <>
      {layers.map((layer, i) => {
        const cardOpacity = fadeIn(frame, sec(1.0) + i * sec(0.25), sec(0.5));
        const cardTop = i * (cardHeight + CARD_GAP);
        return (
          <div
            key={layer.key}
            style={{
              position: "absolute",
              left: 0,
              top: cardTop,
              width: chartRect.width,
              height: cardHeight,
              opacity: cardOpacity,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              borderLeft: `2px solid ${palette.taupe}`,
              paddingLeft: 24,
            }}
          >
            <div
              style={{
                fontFamily: fonts.mono,
                fontSize: fontSizes.meta,
                color: theme.text.muted,
                letterSpacing: letterSpacing.meta,
                marginBottom: 8,
              }}
            >
              {layer.label}
            </div>
            <div
              style={{
                fontFamily: fonts.body,
                fontSize: fontSizes.label,
                color: theme.text.primary,
                lineHeight: 1.45,
                maxWidth: chartRect.width - 24,
              }}
            >
              {layer.text}
            </div>
          </div>
        );
      })}
    </>
  );
};
