/**
 * DialecticFlow — thesis → antithesis → synthesis.
 *
 * Visual layout: triangle.
 *   Thesis (top-left)  ←—tension marker—→  Antithesis (top-right)
 *                          ↓                       ↓
 *                       Synthesis (bottom-center)
 *
 * Reveal sequence:
 *   t=0.5s  Thesis panel fades in (left)
 *   t=2.0s  Antithesis panel fades in (right)
 *   t=3.2s  Tension marker draws between them
 *   t=4.5s  Convergence arrows draw down to synthesis position
 *   t=5.0s  Synthesis panel fades in
 *
 * @composition-animation: useCompositionAnimation
 */

import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
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
  semantic,
} from "../../design/theme";
import { fadeIn } from "../../utils/animation";
import type { DialecticFlowData, DialecticPanel } from "./types";

// ── Reveal timing ──────────────────────────────────────────────────────────

const T_THESIS = 0.5;
const T_ANTITHESIS = 2.0;
const T_TENSION = 3.2;
const T_ARROWS = 4.5;
const T_SYNTHESIS = 5.0;

// ── Component ──────────────────────────────────────────────────────────────

export const DialecticFlow: React.FC<{ data: DialecticFlowData }> = ({
  data,
}) => {
  const frame = useCurrentFrame();
  const direction = useDirection(data._direction);
  const { style: compStyle } = useCompositionAnimation(direction.driftOptions);
  const mode = data.backgroundVariant ?? "light";
  const theme = useThemeMode(mode);
  const emphasis = useEpisodeColorEmphasis();

  const accentColor = emphasis.primaryAccent ?? palette.gold;
  const tensionColor = semantic.china;
  const thesisColor = palette.dustblue;
  const antithesisColor = semantic.china;

  // Layout — triangle.
  const topPad = data.title ? 240 : 140;
  const panelWidth = 480;
  const panelHeight = 240;
  const panelGap = 80;
  const topRowY = topPad;
  const leftPanelX = (layout.width - panelWidth * 2 - panelGap) / 2;
  const rightPanelX = leftPanelX + panelWidth + panelGap;
  const bottomPanelY = topRowY + panelHeight + 160;
  const bottomPanelX = (layout.width - panelWidth) / 2;
  const synthesisHeight = 260;

  // Reveal envelopes.
  const thesisOpacity = fadeIn(frame, sec(T_THESIS), sec(0.6));
  const antithesisOpacity = fadeIn(frame, sec(T_ANTITHESIS), sec(0.6));
  const tensionOpacity = fadeIn(frame, sec(T_TENSION), sec(0.6));
  const synthesisOpacity = fadeIn(frame, sec(T_SYNTHESIS), sec(0.6));

  // Arrow draw progress.
  const arrowProgress = interpolate(
    frame,
    [sec(T_ARROWS), sec(T_ARROWS + 0.8)],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

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

        {/* Thesis panel (top-left) */}
        <DialecticPanelView
          panel={data.thesis}
          tier="thesis"
          x={leftPanelX}
          y={topRowY}
          width={panelWidth}
          height={panelHeight}
          opacity={thesisOpacity}
          theme={theme}
          accentColor={thesisColor}
        />

        {/* Antithesis panel (top-right) */}
        <DialecticPanelView
          panel={data.antithesis}
          tier="antithesis"
          x={rightPanelX}
          y={topRowY}
          width={panelWidth}
          height={panelHeight}
          opacity={antithesisOpacity}
          theme={theme}
          accentColor={antithesisColor}
        />

        {/* Tension marker between thesis + antithesis. */}
        <div
          style={{
            position: "absolute",
            top: topRowY + panelHeight / 2 - 24,
            left: leftPanelX + panelWidth,
            width: panelGap,
            textAlign: "center",
            opacity: tensionOpacity,
          }}
        >
          {/* Horizontal opposition arrows (← →) */}
          <svg width={panelGap} height={48}>
            <line
              x1={6}
              y1={24}
              x2={panelGap - 6}
              y2={24}
              stroke={tensionColor}
              strokeWidth={1.5}
              strokeDasharray="4 3"
            />
            <path
              d={`M 8 18 L 1 24 L 8 30`}
              fill="none"
              stroke={tensionColor}
              strokeWidth={2}
              strokeLinejoin="round"
            />
            <path
              d={`M ${panelGap - 8} 18 L ${panelGap - 1} 24 L ${panelGap - 8} 30`}
              fill="none"
              stroke={tensionColor}
              strokeWidth={2}
              strokeLinejoin="round"
            />
          </svg>
          <div
            style={{
              fontFamily: fonts.mono,
              fontSize: fontSizes.caption,
              color: tensionColor,
              letterSpacing: 2,
              textTransform: "uppercase",
              marginTop: 6,
            }}
          >
            {data.tensionLabel ?? "Contradiction"}
          </div>
        </div>

        {/* Convergence arrows down to synthesis. */}
        <svg
          width={layout.width}
          height={160}
          style={{
            position: "absolute",
            top: topRowY + panelHeight + 4,
            left: 0,
            pointerEvents: "none",
          }}
        >
          {/* Left arrow: thesis-bottom → synthesis-top */}
          <line
            x1={leftPanelX + panelWidth / 2}
            y1={0}
            x2={leftPanelX + panelWidth / 2 + (bottomPanelX + panelWidth / 2 - (leftPanelX + panelWidth / 2)) * arrowProgress}
            y2={0 + 156 * arrowProgress}
            stroke={thesisColor}
            strokeWidth={1.5}
            opacity={0.65}
          />
          {/* Right arrow: antithesis-bottom → synthesis-top */}
          <line
            x1={rightPanelX + panelWidth / 2}
            y1={0}
            x2={rightPanelX + panelWidth / 2 - ((rightPanelX + panelWidth / 2) - (bottomPanelX + panelWidth / 2)) * arrowProgress}
            y2={0 + 156 * arrowProgress}
            stroke={antithesisColor}
            strokeWidth={1.5}
            opacity={0.65}
          />
        </svg>

        {/* Synthesis panel (bottom-center) */}
        <DialecticPanelView
          panel={data.synthesis}
          tier="synthesis"
          x={bottomPanelX}
          y={bottomPanelY}
          width={panelWidth}
          height={synthesisHeight}
          opacity={synthesisOpacity}
          theme={theme}
          accentColor={accentColor}
        />

        <SourceAttribution source={data.source} mode={mode} prefix="Source · " />
        <FooterStrip mode={mode} />
      </AbsoluteFill>
    </Background>
  );
};

// ── DialecticPanelView ─────────────────────────────────────────────────────

const DialecticPanelView: React.FC<{
  panel: DialecticPanel;
  tier: "thesis" | "antithesis" | "synthesis";
  x: number;
  y: number;
  width: number;
  height: number;
  opacity: number;
  theme: ReturnType<typeof useThemeMode>;
  accentColor: string;
}> = ({ panel, tier, x, y, width, height, opacity, theme, accentColor }) => {
  const tierLabel =
    tier === "thesis" ? "Thesis" : tier === "antithesis" ? "Antithesis" : "Synthesis";
  const isSynthesis = tier === "synthesis";
  return (
    <div
      style={{
        position: "absolute",
        top: y,
        left: x,
        width,
        height,
        opacity,
        padding: 24,
        boxSizing: "border-box",
        borderTop: `3px solid ${accentColor}`,
      }}
    >
      {/* Tier label (top, small caps). */}
      <div
        style={{
          fontFamily: fonts.mono,
          fontSize: fontSizes.caption,
          color: accentColor,
          letterSpacing: 2,
          textTransform: "uppercase",
          marginBottom: 8,
        }}
      >
        {tierLabel}
      </div>
      {/* Panel label. */}
      <div
        style={{
          fontFamily: fonts.display,
          fontSize: isSynthesis ? fontSizes.h3 : fontSizes.h3 - 4,
          fontWeight: fontWeights.semibold,
          color: theme.text.primary,
          marginBottom: 10,
          letterSpacing: "-0.01em",
          lineHeight: 1.1,
        }}
      >
        {panel.label}
      </div>
      {/* Panel body. */}
      <div
        style={{
          fontFamily: fonts.serifBody,
          fontSize: fontSizes.body,
          fontStyle: "italic",
          color: theme.text.secondary,
          lineHeight: 1.4,
        }}
      >
        {panel.body}
      </div>
      {/* Attribution (bottom-right). */}
      {panel.attribution && (
        <div
          style={{
            position: "absolute",
            bottom: 12,
            right: 16,
            fontFamily: fonts.mono,
            fontSize: fontSizes.meta,
            color: theme.text.muted,
            letterSpacing: 1.5,
            textTransform: "uppercase",
          }}
        >
          {panel.attribution}
        </div>
      )}
    </div>
  );
};
