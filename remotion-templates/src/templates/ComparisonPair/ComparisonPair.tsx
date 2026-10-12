/**
 * ComparisonPair — two registered templates side-by-side at 50/50 with
 * synchronized timing. The structural-comparison form for "1914 vs 2024",
 * "Athens ↔ Sparta", "Theory ↔ Reality" moments.
 *
 * Architecture:
 *   • Each pane is 960×1080 (half-canvas-width × full-canvas-height)
 *   • The template inside each pane renders at its NATIVE 1920×1080
 *     resolution, then CSS-scaled uniformly to fit 960×540 in the upper
 *     portion of the pane (preserving aspect ratio — no horizontal squish)
 *   • The remaining ~540px of vertical space carries the pane label
 *     (top) + caption (bottom) — editorial framing of the comparison
 *   • Both panes share the composition's frame counter, so "synchronized"
 *     reveals are automatic. "left-first" / "right-first" reveals are
 *     implemented via Remotion `<Sequence>` to delay the right pane's
 *     template-internal time.
 *
 * @composition-animation: useCompositionAnimation
 */

import React from "react";
import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
} from "remotion";
import { Background } from "../../components/Background";
import { TitleBlock } from "../../components/TitleBlock";
import { SourceAttribution } from "../../components/SourceAttribution";
import { HeaderStrip } from "../../components/HeaderStrip";
import { FooterStrip } from "../../components/FooterStrip";
import { useCompositionAnimation } from "../../hooks/useCompositionAnimation";
import { useDirection } from "../../hooks/useDirection";
import { useEpisodeColorEmphasis } from "../../hooks/useEpisodeColorEmphasis";
import { useThemeMode } from "../../hooks/useThemeMode";
import {
  fontSizes,
  fontWeights,
  fonts,
  layout,
  palette,
  sec,
} from "../../design/theme";
import { fadeIn } from "../../utils/animation";

// ── Splittable template imports ────────────────────────────────────────────
//
// The 10 templates ComparisonPair can embed. Each imported directly (no
// circular dependency via templateRegistry's TEMPLATE_COMPONENTS registry).
import { DataChart } from "../DataChart/DataChart";
import { TimeSeriesChart } from "../TimeSeriesChart/TimeSeriesChart";
import { StatReveal } from "../StatReveal/StatReveal";
import { KPICard } from "../KPICard/KPICard";
import { BumpChart } from "../BumpChart/BumpChart";
import { BulletChart } from "../BulletChart/BulletChart";
import { ProbabilityGauge } from "../ProbabilityGauge/ProbabilityGauge";
import { AnnotatedImage } from "../AnnotatedImage/AnnotatedImage";
import { FrameworkDiagram } from "../FrameworkDiagram/FrameworkDiagram";
import { KineticTypography } from "../KineticTypography/KineticTypography";

import type { ComparisonPairData, ComparisonPane } from "./types";

// Dispatch table — template name → component. Type-safe via the
// SplittableTemplateName union from types.ts.
//
// Using a Record<string, React.ComponentType<any>> intentionally — the
// `any` is unavoidable here because each component has a different data
// shape; the Zod-discriminated union in schema.ts is what enforces the
// type at the boundary. The runtime call site casts to the appropriate
// type per discriminator.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SPLITTABLE_TEMPLATES: Record<ComparisonPane["template"], React.ComponentType<{ data: any }>> = {
  DataChart,
  TimeSeriesChart,
  StatReveal,
  KPICard,
  BumpChart,
  BulletChart,
  ProbabilityGauge,
  AnnotatedImage,
  FrameworkDiagram,
  KineticTypography,
};

// ── Component ──────────────────────────────────────────────────────────────

export const ComparisonPair: React.FC<{ data: ComparisonPairData }> = ({
  data,
}) => {
  const frame = useCurrentFrame();
  const direction = useDirection(data._direction);
  const { style: compStyle } = useCompositionAnimation(direction.driftOptions);
  const mode = data.backgroundVariant ?? "light";
  const theme = useThemeMode(mode);
  const emphasis = useEpisodeColorEmphasis();

  const divider = data.divider ?? "rule";
  const revealOrder = data.revealOrder ?? "sync";
  const staggerSec = data.revealStaggerSec ?? 1.5;

  // Title block at top reserves the top ~180px. Source attribution at
  // bottom reserves the bottom ~80px. Panes fill the middle.
  const titleReserved = data.title ? 180 : 60;
  const sourceReserved = 80;
  const paneAreaTop = titleReserved;
  const paneAreaHeight = layout.height - titleReserved - sourceReserved;
  const paneWidth = layout.width / 2;

  // Stagger frames for left-first / right-first reveal modes.
  const rightStartFrame = revealOrder === "left-first" ? sec(staggerSec) : 0;
  const leftStartFrame = revealOrder === "right-first" ? sec(staggerSec) : 0;

  return (
    <Background variant={mode}>
      <AbsoluteFill style={compStyle}>
        <HeaderStrip metadata={data.episode} mode={mode} />
        {data.title && (
          <TitleBlock
            title={data.title}
            subtitle={data.subtitle}
            mode={mode}
            syncPoints={direction.syncPoints}
          />
        )}

        {/* Left pane. */}
        <Sequence from={leftStartFrame} layout="none">
          <PaneWrapper
            pane={data.left}
            x={0}
            y={paneAreaTop}
            width={paneWidth}
            height={paneAreaHeight}
            accentColor={emphasis.primaryAccent ?? palette.gold}
            textColor={theme.text.primary}
            secondaryTextColor={theme.text.secondary}
            mode={mode}
            paneIndex={0}
            frame={frame - leftStartFrame}
          />
        </Sequence>

        {/* Right pane. */}
        <Sequence from={rightStartFrame} layout="none">
          <PaneWrapper
            pane={data.right}
            x={paneWidth}
            y={paneAreaTop}
            width={paneWidth}
            height={paneAreaHeight}
            accentColor={emphasis.primaryAccent ?? palette.gold}
            textColor={theme.text.primary}
            secondaryTextColor={theme.text.secondary}
            mode={mode}
            paneIndex={1}
            frame={frame - rightStartFrame}
          />
        </Sequence>

        {/* Divider — drawn after panes so it sits on top of any pane bleed. */}
        {divider !== "none" && (
          <DividerLine
            divider={divider}
            x={paneWidth}
            top={paneAreaTop}
            height={paneAreaHeight}
            color={theme.text.muted}
            frame={frame}
          />
        )}

        <SourceAttribution
          source={data.source}
          mode={mode}
          prefix="Source · "
        />
        <FooterStrip mode={mode} />
      </AbsoluteFill>
    </Background>
  );
};

// ── PaneWrapper — frames a single pane ─────────────────────────────────────

const PaneWrapper: React.FC<{
  pane: ComparisonPane;
  x: number;
  y: number;
  width: number;
  height: number;
  accentColor: string;
  textColor: string;
  secondaryTextColor: string;
  mode: "light" | "dark";
  paneIndex: number;
  frame: number;
}> = ({
  pane,
  x,
  y,
  width,
  height,
  accentColor,
  textColor,
  secondaryTextColor,
  paneIndex,
  frame,
}) => {
  // Pane internal layout: label strip on top (~52px), template area (~540px
  // scaled from 1920×1080 native), caption below the template.
  const labelStripHeight = pane.label ? 56 : 0;
  const captionStripHeight = pane.caption ? 96 : 0;

  // The template renders at native 1920×1080 then scales uniformly.
  // Scale = paneWidth / nativeCanvasWidth = 960 / 1920 = 0.5.
  // Scaled height = 1080 × 0.5 = 540px.
  const scale = width / layout.width;
  const scaledTemplateHeight = layout.height * scale;

  // Vertically center the template + caption block within the pane content area.
  const innerContentHeight = scaledTemplateHeight + captionStripHeight;
  const remainingVertical = height - labelStripHeight - innerContentHeight;
  const templateOffsetY =
    labelStripHeight + Math.max(0, remainingVertical / 2);

  const Component = SPLITTABLE_TEMPLATES[pane.template];

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width,
        height,
        overflow: "hidden",
      }}
    >
      {/* Label strip (top). */}
      {pane.label && (
        <div
          style={{
            position: "absolute",
            top: 8,
            left: 0,
            right: 0,
            textAlign: "center",
            fontFamily: fonts.mono,
            fontSize: fontSizes.body,
            fontWeight: fontWeights.semibold,
            color: accentColor,
            letterSpacing: 6,
            textTransform: "uppercase",
            opacity: fadeIn(frame, 0, sec(0.5)),
          }}
        >
          {pane.label}
        </div>
      )}

      {/* Scaled template render. */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: templateOffsetY,
          width: layout.width,
          height: layout.height,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          // Hide chrome from the embedded template's HeaderStrip/FooterStrip
          // bleeding into adjacent panes — pane container has overflow:hidden.
        }}
      >
        <Component data={pane.data} />
      </div>

      {/* Caption strip (below scaled template). */}
      {pane.caption && (
        <div
          style={{
            position: "absolute",
            top: templateOffsetY + scaledTemplateHeight + 16,
            left: 32,
            right: 32,
            textAlign: "center",
            fontFamily: fonts.serifBody,
            fontStyle: "italic",
            fontSize: fontSizes.body,
            lineHeight: 1.35,
            color: secondaryTextColor,
            opacity: fadeIn(frame, sec(0.7 + paneIndex * 0.2), sec(0.6)),
          }}
        >
          {pane.caption}
        </div>
      )}
      {/* Silence unused-warning for textColor; reserved for future per-pane
          theme overrides. */}
      {false && <span style={{ color: textColor }} />}
    </div>
  );
};

// ── Divider line ───────────────────────────────────────────────────────────

const DividerLine: React.FC<{
  divider: "rule" | "gap" | "stitch";
  x: number;
  top: number;
  height: number;
  color: string;
  frame: number;
}> = ({ divider, x, top, height, color, frame }) => {
  // Gap = no visible line; the pane separation IS the divider.
  if (divider === "gap") return null;

  const opacity = fadeIn(frame, 0, sec(0.8));
  const stroke = divider === "stitch" ? "1.5" : "1";
  const dashArray = divider === "stitch" ? "6 8" : undefined;

  return (
    <svg
      width={4}
      height={height}
      style={{
        position: "absolute",
        left: x - 2,
        top,
        pointerEvents: "none",
        opacity,
      }}
    >
      <line
        x1={2}
        y1={0}
        x2={2}
        y2={height}
        stroke={color}
        strokeWidth={stroke}
        strokeDasharray={dashArray}
        opacity={0.55}
      />
    </svg>
  );
};
