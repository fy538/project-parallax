/**
 * EditorialFrame — shared composition wrapper for chart templates.
 *
 * Provides kicker + title + dek + heroStat + annotations + reference lines +
 * era bands + legend + chrome around a chart content slot. Chart templates
 * opt in via a `frame?: EditorialFrameProps` schema field; when set, the
 * chart renders inside the frame's content slot with publication-grade
 * composition (NYT Upshot / FT / Economist register).
 *
 * Architecture doc: remotion-templates/EDITORIAL_FRAME_ARCHITECTURE.md
 *
 * The component exposes a chart-area Rect to its children via a render-prop
 * pattern: children is `(chartRect, helpers) => ReactNode` so the chart can
 * size itself to the layout's content slot, and overlays (annotations,
 * reference lines, era bands) can position relative to that rect using the
 * helpers (`xToPx`, `yToPx`, `dataPointToPx`).
 */

import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import {
  palette,
  fonts,
  fontSizes,
  fontWeights,
  letterSpacing,
  layout,
  sec,
} from "../../design/theme";
import { fadeIn, exitFade } from "../../utils/animation";
import { Background } from "../Background";
import { HeaderStrip } from "../HeaderStrip";
import { FooterStrip } from "../FooterStrip";
import { SourceAttribution } from "../SourceAttribution";
import { useThemeMode } from "../../hooks/useThemeMode";
import type {
  EditorialFrameProps,
  Annotation,
  ReferenceLine,
  HeroStat,
  LegendItem,
} from "./schema";

// ── Layout math ──────────────────────────────────────────────────────────────

/** Bounding rectangle of a layout zone, in screen pixels. */
export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Helpers for positioning overlays inside the chart rect. */
export interface ChartHelpers {
  /** Convert an x-axis value (0..1 normalized) to a pixel x within chartRect. */
  normalizedToPxX: (n: number) => number;
  /** Convert a y-axis value (0..1 normalized) to a pixel y within chartRect. */
  normalizedToPxY: (n: number) => number;
  /** chartRect for convenience (overlay components position relative to this). */
  chartRect: Rect;
}

/** Compute chart-area rect based on layout choice + frame zone heights. */
export function computeChartRect(
  frameWidth: number,
  frameHeight: number,
  frame: EditorialFrameProps,
): Rect {
  const safe = layout.safeArea;
  const headerH = computeHeaderHeight(frame);
  const footerH = computeFooterHeight(frame);
  const captionH = frame.caption ? 50 : 0;

  if (frame.layout === "hero-split") {
    const [leftPct] = frame.splitRatio ?? [35, 65];
    const splitX = safe.left + ((frameWidth - safe.left - safe.right) * leftPct) / 100;
    // Reserve top room for inline value labels above bars (60px) and
    // bottom room for x-axis labels + caption + footer.
    return {
      x: splitX + 60, // gutter between rails
      y: safe.top + 80, // headroom for inline bar value labels
      width: frameWidth - splitX - 60 - safe.right,
      height: frameHeight - safe.top - 80 - footerH - captionH - safe.bottom - 30,
    };
  }
  if (frame.layout === "full-bleed") {
    return {
      x: safe.left,
      y: safe.top + headerH,
      width: frameWidth - safe.left - safe.right,
      height: frameHeight - safe.top - headerH - footerH - captionH - safe.bottom,
    };
  }
  // centered / stacked share the same rect; both vertical-stack
  return {
    x: safe.left + 100,
    y: safe.top + headerH,
    width: frameWidth - safe.left - safe.right - 200,
    height: frameHeight - safe.top - headerH - footerH - captionH - safe.bottom,
  };
}

function computeHeaderHeight(frame: EditorialFrameProps): number {
  // header height varies by layout. hero-split has small top header (legend bar).
  // centered/stacked have full title block.
  if (frame.layout === "hero-split") return 60;
  // centered/stacked/full-bleed: kicker + title + optional dek
  let h = 40; // top breathing room
  if (frame.kicker) h += 36;
  h += 90; // title (allow wrap to 2 lines at h1)
  if (frame.dek) h += 60;
  return h;
}

function computeFooterHeight(frame: EditorialFrameProps): number {
  if (frame.chrome === "none") return 30;
  if (frame.chrome === "intelligence") return 60;
  // publication: source + mode tag
  return 50;
}

// ── EditorialFrame main component ────────────────────────────────────────────

interface EditorialFrameComponentProps {
  /** Frame configuration. */
  frame: EditorialFrameProps;
  /** Episode slug for HeaderStrip. */
  episode: string;
  /** Chart content slot. Receives (chartRect, helpers). */
  children: (chartRect: Rect, helpers: ChartHelpers) => React.ReactNode;
  /** Total duration in frames for exit-fade math. */
  durationInFrames: number;
  /** Optional renderer for annotation overlays (chart templates provide
   *  the targetDataPoint → pixel mapping). When provided, this is called
   *  after the chart renders, with the chartRect + helpers, and should
   *  return the annotation overlay elements. */
  annotationOverlay?: (chartRect: Rect, helpers: ChartHelpers) => React.ReactNode;
}

export const EditorialFrame: React.FC<EditorialFrameComponentProps> = ({
  frame,
  episode,
  children,
  durationInFrames,
  annotationOverlay,
}) => {
  const frameNum = useCurrentFrame();
  const { width: frameWidth, height: frameHeight } = useVideoConfig();
  const theme = useThemeMode("light");

  const chartRect = computeChartRect(frameWidth, frameHeight, frame);
  const helpers: ChartHelpers = {
    normalizedToPxX: (n: number) => chartRect.x + n * chartRect.width,
    normalizedToPxY: (n: number) => chartRect.y + (1 - n) * chartRect.height,
    chartRect,
  };

  const exit = exitFade(frameNum, durationInFrames, sec(0.5));

  return (
    <Background variant="light">
      {/* Brand chrome (HeaderStrip) — keeps brand mark consistent with other templates */}
      <HeaderStrip metadata={episode} mode="light" />

      {/* Footer chrome — publication / intelligence / none */}
      {frame.chrome === "intelligence" && (
        <FooterStrip
          scale={frame.modeTag ? `SCALE · ${frame.modeTag}` : undefined}
          mode="light"
        />
      )}

      <AbsoluteFill style={{ opacity: exit }}>
        {/* Layout-specific header zone */}
        {frame.layout === "hero-split" ? (
          <HeroSplitHeader frame={frame} frameWidth={frameWidth} frameHeight={frameHeight} frameNum={frameNum} />
        ) : (
          <CenteredHeader frame={frame} frameWidth={frameWidth} frameNum={frameNum} />
        )}

        {/* Top-aligned legend (when configured) */}
        {frame.legend === "top-aligned" && frame.legendItems && frame.legendItems.length > 0 && (
          <TopLegend
            items={frame.legendItems}
            chartRect={chartRect}
            frameNum={frameNum}
          />
        )}

        {/* Chart content slot */}
        <div
          style={{
            position: "absolute",
            left: chartRect.x,
            top: chartRect.y,
            width: chartRect.width,
            height: chartRect.height,
          }}
        >
          {children(chartRect, helpers)}
        </div>

        {/* Annotation overlay (chart provides the rendering since it owns
         *  data-point → pixel mapping) */}
        {annotationOverlay && annotationOverlay(chartRect, helpers)}

        {/* Caption beneath chart */}
        {frame.caption && (
          <div
            style={{
              position: "absolute",
              left: chartRect.x,
              top: chartRect.y + chartRect.height + 20,
              width: chartRect.width,
              fontFamily: fonts.serifBody,
              fontStyle: "italic",
              fontSize: fontSizes.label,
              color: theme.text.muted,
              opacity: fadeIn(frameNum, sec(1.5), sec(0.6)),
            }}
          >
            {frame.caption}
          </div>
        )}

        {/* Publication-mode footer: source + mode tag */}
        {frame.chrome === "publication" && (
          <PublicationFooter
            source={frame.source}
            modeTag={frame.modeTag}
            frameWidth={frameWidth}
            frameHeight={frameHeight}
            frameNum={frameNum}
          />
        )}
      </AbsoluteFill>
    </Background>
  );
};

// ── Header: hero-split (left rail) ───────────────────────────────────────────

const HeroSplitHeader: React.FC<{
  frame: EditorialFrameProps;
  frameWidth: number;
  frameHeight: number;
  frameNum: number;
}> = ({ frame, frameWidth, frameHeight, frameNum }) => {
  const theme = useThemeMode("light");
  const safe = layout.safeArea;
  const [leftPct] = frame.splitRatio ?? [35, 65];
  const leftWidth = ((frameWidth - safe.left - safe.right) * leftPct) / 100;

  const kickerOpacity = fadeIn(frameNum, sec(0.3), sec(0.5));
  const statOpacity = fadeIn(frameNum, sec(0.7), sec(0.7));
  const titleOpacity = fadeIn(frameNum, sec(1.0), sec(0.6));
  const dekOpacity = fadeIn(frameNum, sec(1.4), sec(0.5));
  const bodyOpacity = fadeIn(frameNum, sec(1.8), sec(0.5));

  return (
    <div
      style={{
        position: "absolute",
        left: safe.left,
        top: safe.top + 60,
        width: leftWidth,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {frame.kicker && (
        <div
          style={{
            fontFamily: fonts.mono,
            fontSize: fontSizes.meta,
            color: theme.text.muted,
            letterSpacing: letterSpacing.meta,
            textTransform: "uppercase",
            marginBottom: 32,
            opacity: kickerOpacity,
          }}
        >
          {frame.kicker}
        </div>
      )}
      {frame.heroStat && (
        <HeroStatBlock heroStat={frame.heroStat} opacity={statOpacity} />
      )}
      <div
        style={{
          fontFamily: fonts.heading,
          fontSize: fontSizes.h2,
          fontWeight: fontWeights.bold,
          color: theme.text.primary,
          lineHeight: 1.15,
          letterSpacing: letterSpacing.h2,
          marginTop: frame.heroStat ? 32 : 0,
          marginBottom: 20,
          opacity: titleOpacity,
        }}
      >
        {frame.title}
      </div>
      {frame.dek && (
        <div
          style={{
            fontFamily: fonts.serifBody,
            fontStyle: "italic",
            fontSize: fontSizes.body,
            color: theme.text.secondary,
            lineHeight: 1.4,
            marginBottom: 16,
            opacity: dekOpacity,
          }}
        >
          {frame.dek}
        </div>
      )}
      {frame.body && (
        <div
          style={{
            fontFamily: fonts.body,
            fontSize: fontSizes.label,
            color: theme.text.secondary,
            lineHeight: 1.5,
            opacity: bodyOpacity,
          }}
        >
          {frame.body}
        </div>
      )}
    </div>
  );
};

// ── Header: centered / stacked ───────────────────────────────────────────────

const CenteredHeader: React.FC<{
  frame: EditorialFrameProps;
  frameWidth: number;
  frameNum: number;
}> = ({ frame, frameWidth, frameNum }) => {
  const theme = useThemeMode("light");
  const safe = layout.safeArea;
  const kickerOpacity = fadeIn(frameNum, sec(0.3), sec(0.5));
  const titleOpacity = fadeIn(frameNum, sec(0.7), sec(0.6));
  const dekOpacity = fadeIn(frameNum, sec(1.1), sec(0.5));

  return (
    <div
      style={{
        position: "absolute",
        left: safe.left + 100,
        top: safe.top,
        width: frameWidth - safe.left - safe.right - 200,
        display: "flex",
        flexDirection: "column",
        alignItems: frame.layout === "centered" ? "center" : "flex-start",
        textAlign: frame.layout === "centered" ? "center" : "left",
      }}
    >
      {frame.kicker && (
        <div
          style={{
            fontFamily: fonts.mono,
            fontSize: fontSizes.meta,
            color: theme.text.muted,
            letterSpacing: letterSpacing.meta,
            textTransform: "uppercase",
            marginBottom: 24,
            opacity: kickerOpacity,
          }}
        >
          {frame.kicker}
        </div>
      )}
      <div
        style={{
          fontFamily: fonts.heading,
          fontSize: fontSizes.h1,
          fontWeight: fontWeights.bold,
          color: theme.text.primary,
          lineHeight: 1.1,
          letterSpacing: letterSpacing.h1,
          marginBottom: 16,
          maxWidth: 1400,
          opacity: titleOpacity,
        }}
      >
        {frame.title}
      </div>
      {frame.dek && (
        <div
          style={{
            fontFamily: fonts.serifBody,
            fontStyle: "italic",
            fontSize: fontSizes.body,
            color: theme.text.secondary,
            lineHeight: 1.4,
            maxWidth: 1200,
            opacity: dekOpacity,
          }}
        >
          {frame.dek}
        </div>
      )}
    </div>
  );
};

// ── Hero stat block ──────────────────────────────────────────────────────────

const HeroStatBlock: React.FC<{ heroStat: HeroStat; opacity: number }> = ({
  heroStat,
  opacity,
}) => {
  const theme = useThemeMode("light");
  const sizeMap = {
    display: fontSizes.display, // 96
    h1: fontSizes.h1, // 64
    h2: fontSizes.h2, // 48
  };
  return (
    <div
      style={{
        fontFamily: fonts.heading,
        fontSize: sizeMap[heroStat.weight ?? "display"] * 1.6,
        fontWeight: fontWeights.bold,
        color: heroStat.color ?? theme.text.primary,
        lineHeight: 1.0,
        letterSpacing: letterSpacing.display,
        opacity,
      }}
    >
      {heroStat.value}
    </div>
  );
};

// ── Top legend ───────────────────────────────────────────────────────────────

const TopLegend: React.FC<{
  items: LegendItem[];
  chartRect: Rect;
  frameNum: number;
}> = ({ items, chartRect, frameNum }) => {
  const theme = useThemeMode("light");
  const opacity = fadeIn(frameNum, sec(0.5), sec(0.5));

  return (
    <div
      style={{
        position: "absolute",
        left: chartRect.x,
        top: chartRect.y - 40,
        display: "flex",
        gap: 32,
        alignItems: "center",
        fontFamily: fonts.mono,
        fontSize: fontSizes.meta,
        color: theme.text.secondary,
        letterSpacing: letterSpacing.meta,
        textTransform: "uppercase",
        opacity,
      }}
    >
      {items.map((item, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 16,
              height: 16,
              backgroundColor: item.color,
              borderRadius: item.symbol === "circle" ? "50%" : 0,
            }}
          />
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
};

// ── Publication footer ───────────────────────────────────────────────────────

const PublicationFooter: React.FC<{
  source?: string;
  modeTag?: string;
  frameWidth: number;
  frameHeight: number;
  frameNum: number;
}> = ({ source, modeTag, frameWidth, frameHeight, frameNum }) => {
  const theme = useThemeMode("light");
  const safe = layout.safeArea;
  const opacity = fadeIn(frameNum, sec(2.5), sec(0.5));

  return (
    <>
      {source && (
        <div
          style={{
            position: "absolute",
            right: safe.right,
            bottom: safe.bottom + 30,
            width: Math.min(700, frameWidth * 0.45),
            textAlign: "right",
            fontFamily: fonts.serifBody,
            fontStyle: "italic",
            fontSize: fontSizes.caption,
            color: theme.text.muted,
            lineHeight: 1.4,
            opacity,
          }}
        >
          {source}
        </div>
      )}
      {modeTag && (
        <div
          style={{
            position: "absolute",
            left: safe.left,
            bottom: safe.bottom,
            fontFamily: fonts.mono,
            fontSize: fontSizes.meta,
            color: theme.text.muted,
            letterSpacing: letterSpacing.meta,
            textTransform: "uppercase",
            opacity,
          }}
        >
          ∴ parallax · {modeTag}
        </div>
      )}
    </>
  );
};
