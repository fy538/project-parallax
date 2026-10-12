/**
 * ConceptEvolutionTimeline — Foucauldian genealogy diagram.
 *
 * A single concept that mutates its meaning across historical moments, shown
 * as a horizontal spine with equally-spaced labeled nodes. Each node has a
 * definition panel below it. Drift labels on the connecting arrows describe
 * how the concept shifted between moments.
 *
 * Editorial use: "Sovereignty 1648 → 1919 → 1945 → 2005" — the concept word
 * stays constant; the political content evolves.
 *
 * Animation sequence:
 *   1. Concept label fades in (frames 0–20)
 *   2. Title/subtitle (frames 10–30, via TitleBlock)
 *   3. Spine line draws left-to-right stroke-dash reveal (frames 20–45)
 *   4. Nodes appear left-to-right with stagger (frames 35–65)
 *   5. Year labels fade in with their nodes (same timing)
 *   6. Drift labels appear on connections (frames 55–75)
 *   7. Definition panels reveal: border draws in then text fades (frames 60–90)
 *   8. Key passages in panels fade last (frames 80–100)
 *   9. Source attribution fades in last 3s
 *
 * Layout: noDrift — the spine IS the spatial story.
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
import { fadeIn, exitFade, stagger, CLAMP_CUBIC, CLAMP } from "../../utils/animation";
import { Background } from "../../components/Background";
import { TitleBlock } from "../../components/TitleBlock";
import { SourceAttribution } from "../../components/SourceAttribution";
import { HeaderStrip } from "../../components/HeaderStrip";
import { FooterStrip } from "../../components/FooterStrip";
import { useCompositionAnimation } from "../../hooks/useCompositionAnimation";
import { useThemeMode } from "../../hooks/useThemeMode";
import { warnIf } from "../../utils/dataWarnings";
import type {
  ConceptEvolutionTimelineData,
  ConceptEvolutionEvent,
  ConceptEvolutionDrift,
} from "./types";

// ── Layout constants ──────────────────────────────────────────────────────────
const NODE_DOT_R = 6;
const NODE_RING_R = 11;
const NODE_RING_OPACITY = 0.3;
const NODE_DOT_OPACITY = 0.92;
const PANEL_GAP = 20;
const PANEL_PADDING = 12;
const PANEL_HEIGHT = 190;
const KEY_PASSAGE_BORDER_W = 2;

// ── Color resolver for drift emphasis ────────────────────────────────────────
function resolveDriftColor(
  emphasis: ConceptEvolutionDrift["emphasis"],
): { stroke: string; strokeWidth: number; dashed: boolean } {
  switch (emphasis) {
    case "rupture":
      return { stroke: semantic.china, strokeWidth: 2, dashed: true };
    case "continuity":
      return { stroke: palette.taupe, strokeWidth: 1.0, dashed: false };
    case "shift":
    default:
      return { stroke: palette.umber, strokeWidth: 1.5, dashed: false };
  }
}

// ── NodeMarker sub-component ──────────────────────────────────────────────────
interface NodeMarkerProps {
  cx: number;
  cy: number;
  color: string;
  bgBase: string;
  opacity: number;
}
const NodeMarker: React.FC<NodeMarkerProps> = React.memo(
  ({ cx, cy, color, bgBase, opacity }) => (
    <g opacity={opacity}>
      {/* Outer ring — halo communicates node importance */}
      <circle
        cx={cx}
        cy={cy}
        r={NODE_RING_R}
        fill="none"
        stroke={color}
        strokeWidth={0.8}
        opacity={NODE_RING_OPACITY}
      />
      {/* Knockout backing so dot reads cleanly atop the spine line */}
      <circle cx={cx} cy={cy} r={NODE_DOT_R + 2} fill={bgBase} />
      {/* Precision dot */}
      <circle
        cx={cx}
        cy={cy}
        r={NODE_DOT_R}
        fill={color}
        opacity={NODE_DOT_OPACITY}
      />
    </g>
  ),
);

// ── DriftArrow sub-component ──────────────────────────────────────────────────
interface DriftArrowProps {
  x1: number;
  x2: number;
  y: number;
  label: string;
  emphasis: ConceptEvolutionDrift["emphasis"];
  bgBase: string;
  opacity: number;
}
const DriftArrow: React.FC<DriftArrowProps> = React.memo(
  ({ x1, x2, y, label, emphasis, bgBase, opacity }) => {
    const { stroke, strokeWidth, dashed } = resolveDriftColor(emphasis);
    const midX = (x1 + x2) / 2;
    const arrowHeadSize = 5;
    // Arrow tip slightly short of the next node center
    const arrowTipX = x2 - NODE_DOT_R - 3;
    const labelBgW = Math.max(label.length * 7, 50);

    return (
      <g opacity={opacity}>
        {/* Spine segment between nodes */}
        <line
          x1={x1 + NODE_DOT_R + 3}
          y1={y}
          x2={arrowTipX - arrowHeadSize}
          y2={y}
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeDasharray={dashed ? "8 4" : undefined}
          strokeLinecap="round"
        />
        {/* Arrowhead ► */}
        <polygon
          points={`${arrowTipX},${y} ${arrowTipX - arrowHeadSize},${y - arrowHeadSize * 0.6} ${arrowTipX - arrowHeadSize},${y + arrowHeadSize * 0.6}`}
          fill={stroke}
        />
        {/* Drift label above midpoint */}
        {label && (
          <g>
            <rect
              x={midX - labelBgW / 2}
              y={y - 24}
              width={labelBgW}
              height={16}
              fill={bgBase}
              opacity={0.85}
              rx={2}
            />
            <text
              x={midX}
              y={y - 12}
              textAnchor="middle"
              fill={stroke}
              fontSize={fontSizes.caption}
              fontFamily={fonts.mono}
              fontWeight={500}
              letterSpacing={letterSpacing.caption}
              style={{ textTransform: "lowercase" } as React.CSSProperties}
            >
              {label}
            </text>
          </g>
        )}
      </g>
    );
  },
);

// ── PlainArrow sub-component (no drift defined) ───────────────────────────────
interface PlainArrowProps {
  x1: number;
  x2: number;
  y: number;
  opacity: number;
}
const PlainArrow: React.FC<PlainArrowProps> = React.memo(
  ({ x1, x2, y, opacity }) => {
    const arrowHeadSize = 4;
    const arrowTipX = x2 - NODE_DOT_R - 3;
    return (
      <g opacity={opacity}>
        <line
          x1={x1 + NODE_DOT_R + 3}
          y1={y}
          x2={arrowTipX - arrowHeadSize}
          y2={y}
          stroke={palette.sand}
          strokeWidth={1}
          strokeLinecap="round"
        />
        <polygon
          points={`${arrowTipX},${y} ${arrowTipX - arrowHeadSize},${y - arrowHeadSize * 0.6} ${arrowTipX - arrowHeadSize},${y + arrowHeadSize * 0.6}`}
          fill={palette.sand}
        />
      </g>
    );
  },
);

// ── DefinitionPanel sub-component ────────────────────────────────────────────
interface DefinitionPanelProps {
  x: number;
  y: number;
  width: number;
  event: ConceptEvolutionEvent;
  textPrimary: string;
  textMuted: string;
  borderColor: string;
  bgBase: string;
  isDark: boolean;
  borderProgress: number; // 0→1 for the border draw-in
  textOpacity: number;
  passageOpacity: number;
}
const DefinitionPanel: React.FC<DefinitionPanelProps> = React.memo(
  ({
    x,
    y,
    width,
    event,
    textPrimary,
    textMuted,
    borderColor,
    bgBase,
    isDark,
    borderProgress,
    textOpacity,
    passageOpacity,
  }) => {
    // Border: draw top edge left-to-right, then left and right edges appear
    const topBorderW = width * borderProgress;
    const sideH = PANEL_HEIGHT * Math.max(0, (borderProgress - 0.5) * 2);

    return (
      <g>
        {/* Panel border — draws in progressively */}
        {/* Top edge */}
        <line
          x1={x}
          y1={y}
          x2={x + topBorderW}
          y2={y}
          stroke={borderColor}
          strokeWidth={0.6}
          opacity={0.6}
        />
        {/* Left edge */}
        <line
          x1={x}
          y1={y}
          x2={x}
          y2={y + sideH}
          stroke={borderColor}
          strokeWidth={0.6}
          opacity={0.6}
        />
        {/* Right edge */}
        <line
          x1={x + width}
          y1={y}
          x2={x + width}
          y2={y + sideH}
          stroke={borderColor}
          strokeWidth={0.6}
          opacity={0.6}
        />
      </g>
    );
    // Definition text and key passage are HTML overlays (positioned below)
    // for proper line wrapping. SVG foreignObject is used below.
  },
);

// ── Main component ────────────────────────────────────────────────────────────
export const ConceptEvolutionTimeline: React.FC<{
  data: ConceptEvolutionTimelineData;
}> = ({ data }) => {
  // ── Validation warnings ────────────────────────────────────────────────────
  warnIf(
    data.events.length > 7,
    "ConceptEvolutionTimeline",
    `${data.events.length} events detected. ConceptEvolutionTimeline reads best at 3–6 nodes. Above 7, panels overlap.`,
  );
  if (data.drifts) {
    data.drifts.forEach((drift, di) => {
      warnIf(
        drift.fromIndex < 0 || drift.fromIndex >= data.events.length,
        "ConceptEvolutionTimeline",
        `drift[${di}].fromIndex=${drift.fromIndex} is out of range (events.length=${data.events.length}).`,
      );
      warnIf(
        drift.toIndex < 0 || drift.toIndex >= data.events.length,
        "ConceptEvolutionTimeline",
        `drift[${di}].toIndex=${drift.toIndex} is out of range (events.length=${data.events.length}).`,
      );
    });
  }

  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const { style: compStyle } = useCompositionAnimation({ noDrift: true });

  const bgVariant = data.backgroundVariant ?? "light";
  const theme = useThemeMode(bgVariant);
  const isDark = bgVariant === "dark";

  // ── Layout pre-computation (memoized) ──────────────────────────────────────
  const area = useMemo(() => contentArea("content", "generous"), []);

  const nNodes = data.events.length;

  const nodeXs = useMemo<number[]>(() => {
    const inset = area.width * 0.06;
    const usable = area.width - inset * 2;
    return data.events.map((_, i) =>
      nNodes === 1
        ? area.left + area.width / 2
        : area.left + inset + (i / (nNodes - 1)) * usable,
    );
  }, [data.events, area.left, area.width, nNodes]);

  // Spine Y at ~38% of content height
  const spineY = useMemo(
    () => area.top + area.height * 0.38,
    [area.top, area.height],
  );

  // Panel width: distributed equally across content width
  const panelWidth = useMemo(() => {
    const totalGap = PANEL_GAP * (nNodes - 1);
    return Math.floor((area.width - totalGap) / nNodes);
  }, [area.width, nNodes]);

  // Panel left-edge positions — aligned under each node as tightly as possible
  const panelXs = useMemo<number[]>(() => {
    return nodeXs.map((cx) => cx - panelWidth / 2);
  }, [nodeXs, panelWidth]);

  const panelTopY = useMemo(
    () => spineY + NODE_RING_R + 60, // title row + gap
    [spineY],
  );

  // Drift lookup: fromIndex → drift object (only the first drift per pair)
  const driftByFromIndex = useMemo<Map<number, ConceptEvolutionDrift>>(() => {
    const m = new Map<number, ConceptEvolutionDrift>();
    if (data.drifts) {
      for (const d of data.drifts) {
        if (!m.has(d.fromIndex)) {
          m.set(d.fromIndex, d);
        }
      }
    }
    return m;
  }, [data.drifts]);

  // ── Timing ────────────────────────────────────────────────────────────────
  const exitOp = exitFade(frame, durationInFrames, 15);

  const CONCEPT_LABEL_START = 0;
  const CONCEPT_LABEL_DUR = 20;

  const SPINE_START = 20;
  const SPINE_DUR = 25;

  const NODE_START_BASE = 35;
  const NODE_DUR = 12;
  const NODE_STAGGER = 8;

  const DRIFT_START = 55;
  const DRIFT_DUR = 12;
  const DRIFT_STAGGER = 5;

  const PANEL_BORDER_START_BASE = 60;
  const PANEL_BORDER_DUR = 18;
  const PANEL_STAGGER = 10;

  const TEXT_START_BASE = 60;
  const TEXT_DUR = 15;

  const PASSAGE_START_BASE = 80;
  const PASSAGE_DUR = 18;

  // Spine draw progress
  const spineProgress = interpolate(
    frame,
    [SPINE_START, SPINE_START + SPINE_DUR],
    [0, 1],
    CLAMP_CUBIC,
  );

  // Concept label opacity
  const conceptLabelOpacity =
    fadeIn(frame, CONCEPT_LABEL_START, CONCEPT_LABEL_DUR) * exitOp;

  // Node opacities (staggered left to right)
  const nodeOpacities = useMemo<number[]>(() => {
    return data.events.map((_, i) => {
      const start = NODE_START_BASE + stagger(i, NODE_STAGGER);
      return fadeIn(frame, start, NODE_DUR) * exitOp;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frame, data.events, exitOp]);

  // Drift label opacities
  const driftOpacities = useMemo<number[]>(() => {
    return data.events.map((_, i) => {
      const start = DRIFT_START + stagger(i, DRIFT_STAGGER);
      return fadeIn(frame, start, DRIFT_DUR) * exitOp;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frame, data.events, exitOp]);

  // Panel border progress (staggered)
  const panelBorderProgress = useMemo<number[]>(() => {
    return data.events.map((_, i) => {
      const start = PANEL_BORDER_START_BASE + stagger(i, PANEL_STAGGER);
      return interpolate(frame, [start, start + PANEL_BORDER_DUR], [0, 1], CLAMP_CUBIC);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frame, data.events]);

  // Panel text opacity
  const panelTextOpacities = useMemo<number[]>(() => {
    return data.events.map((_, i) => {
      const start = TEXT_START_BASE + stagger(i, PANEL_STAGGER);
      return fadeIn(frame, start, TEXT_DUR) * exitOp;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frame, data.events, exitOp]);

  // Key passage opacity
  const passageOpacities = useMemo<number[]>(() => {
    return data.events.map((_, i) => {
      const start = PASSAGE_START_BASE + stagger(i, PANEL_STAGGER);
      return fadeIn(frame, start, PASSAGE_DUR) * exitOp;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frame, data.events, exitOp]);

  // Spine right edge: draws from left to right
  const spineRight =
    area.left + area.width * 0.06 +
    (area.width * 0.88) * spineProgress;

  // Colors
  const textPrimary = theme.text.primary;
  const textMuted = theme.text.muted;
  const bgBase = theme.bg.base;
  const borderColor = palette.taupe;

  // Event title Y (below dot, above panel)
  const eventTitleY = spineY + NODE_RING_R + 18;
  const yearY = spineY - NODE_RING_R - 14;

  return (
    <Background variant={isDark ? "dark" : "light"}>
      <AbsoluteFill style={compStyle}>
        <HeaderStrip mode={bgVariant} metadata={data.episode} />
        <FooterStrip mode={bgVariant} />

        {/* ── Concept label — large centered gold mono ── */}
        <div
          style={{
            position: "absolute",
            top: area.top - 110,
            left: area.left,
            width: area.width,
            textAlign: "center",
            opacity: conceptLabelOpacity,
            pointerEvents: "none",
          }}
        >
          <span
            style={{
              fontFamily: fonts.mono,
              fontSize: fontSizes.h2,
              fontWeight: 700,
              color: palette.gold,
              letterSpacing: 8,
              textTransform: "uppercase" as const,
            }}
          >
            {data.concept}
          </span>
          {data.subtitle && (
            <div
              style={{
                fontFamily: fonts.body,
                fontSize: fontSizes.label,
                color: textMuted,
                marginTop: 6,
                letterSpacing: 0.5,
                fontWeight: 400,
                maxWidth: 900,
                margin: "6px auto 0",
              }}
            >
              {data.subtitle}
            </div>
          )}
        </div>

        {/* ── Title block (uses TitleBlock for title only if provided) ── */}
        {data.title && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
            }}
          >
            <TitleBlock
              title={data.title}
              mode={bgVariant}
              safeAreaTier="generous"
              startFrame={10}
            />
          </div>
        )}

        {/* ── SVG layer — spine, nodes, arrows, borders ── */}
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
          {/* Spine base line — draws left to right */}
          <line
            x1={area.left + area.width * 0.06}
            y1={spineY}
            x2={spineRight}
            y2={spineY}
            stroke={palette.sand}
            strokeWidth={1}
            opacity={0.4 * exitOp}
          />

          {/* ── Connections (drift arrows or plain arrows) ── */}
          {data.events.map((_, i) => {
            if (i >= nNodes - 1) return null;
            const x1 = nodeXs[i]!;
            const x2 = nodeXs[i + 1]!;
            const drift = driftByFromIndex.get(i);
            const op = driftOpacities[i] ?? 0;

            if (drift && drift.fromIndex === i) {
              return (
                <DriftArrow
                  key={`drift-${i}`}
                  x1={x1}
                  x2={x2}
                  y={spineY}
                  label={drift.label}
                  emphasis={drift.emphasis}
                  bgBase={bgBase}
                  opacity={op}
                />
              );
            }
            return (
              <PlainArrow
                key={`arrow-${i}`}
                x1={x1}
                x2={x2}
                y={spineY}
                opacity={op * 0.5}
              />
            );
          })}

          {/* ── Nodes + year labels + event titles ── */}
          {data.events.map((event, i) => {
            const cx = nodeXs[i]!;
            const nodeColor = event.color ?? palette.gold;
            const op = nodeOpacities[i] ?? 0;

            return (
              <g key={`node-${i}`}>
                {/* Year above spine */}
                <text
                  x={cx}
                  y={yearY}
                  textAnchor="middle"
                  fill={textMuted}
                  fontSize={fontSizes.caption}
                  fontFamily={fonts.mono}
                  fontWeight={400}
                  letterSpacing={letterSpacing.caption}
                  opacity={op}
                  style={{ textTransform: "uppercase" } as React.CSSProperties}
                >
                  {event.year}
                </text>
                {/* Node dot + ring */}
                <NodeMarker
                  cx={cx}
                  cy={spineY}
                  color={nodeColor}
                  bgBase={bgBase}
                  opacity={op}
                />
                {/* Event title below spine */}
                <text
                  x={cx}
                  y={eventTitleY}
                  textAnchor="middle"
                  fill={textPrimary}
                  fontSize={fontSizes.caption}
                  fontFamily={fonts.mono}
                  fontWeight={600}
                  letterSpacing={1}
                  opacity={op}
                  style={{ textTransform: "uppercase" } as React.CSSProperties}
                >
                  {event.title}
                </text>
              </g>
            );
          })}

          {/* ── Panel borders (SVG) ── */}
          {data.events.map((_, i) => {
            const px = panelXs[i]!;
            const borderProg = Math.max(0, Math.min(1, panelBorderProgress[i] ?? 0));

            return (
              <DefinitionPanel
                key={`panel-border-${i}`}
                x={px}
                y={panelTopY}
                width={panelWidth}
                event={data.events[i]!}
                textPrimary={textPrimary}
                textMuted={textMuted}
                borderColor={borderColor}
                bgBase={bgBase}
                isDark={isDark}
                borderProgress={borderProg}
                textOpacity={panelTextOpacities[i] ?? 0}
                passageOpacity={passageOpacities[i] ?? 0}
              />
            );
          })}
        </svg>

        {/* ── Definition panel text (HTML for wrapping) ── */}
        {data.events.map((event, i) => {
          const px = Math.max(0, panelXs[i] ?? 0);
          const textOp = panelTextOpacities[i] ?? 0;
          const passageOp = passageOpacities[i] ?? 0;

          return (
            <div
              key={`panel-text-${i}`}
              style={{
                position: "absolute",
                left: px + PANEL_PADDING,
                top: panelTopY + PANEL_PADDING,
                width: panelWidth - PANEL_PADDING * 2,
                height: PANEL_HEIGHT - PANEL_PADDING * 2,
                overflow: "hidden",
                pointerEvents: "none",
              }}
            >
              {/* Definition text */}
              <div
                style={{
                  opacity: textOp,
                  fontFamily: fonts.body,
                  fontSize: 13,
                  color: textPrimary,
                  lineHeight: 1.5,
                  marginBottom: 8,
                  overflow: "hidden",
                  display: "-webkit-box",
                  WebkitLineClamp: event.keyPassage ? 4 : 7,
                  WebkitBoxOrient: "vertical",
                }}
              >
                {event.definition}
              </div>

              {/* Key passage — italic with gold left border */}
              {event.keyPassage && (
                <div
                  style={{
                    opacity: passageOp,
                    borderLeft: `${KEY_PASSAGE_BORDER_W}px solid ${palette.gold}`,
                    paddingLeft: 8,
                    fontFamily: fonts.serifBody,
                    fontSize: 12,
                    fontStyle: "italic",
                    color: textMuted,
                    lineHeight: 1.5,
                    overflow: "hidden",
                    display: "-webkit-box",
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: "vertical",
                  }}
                >
                  {event.keyPassage}
                </div>
              )}
            </div>
          );
        })}

        {/* ── Source attribution ── */}
        <SourceAttribution
          source={data.source}
          mode={bgVariant}
          prefix="Source: "
          startSec={(data.durationSec ?? 16) - 3}
        />
      </AbsoluteFill>
    </Background>
  );
};
