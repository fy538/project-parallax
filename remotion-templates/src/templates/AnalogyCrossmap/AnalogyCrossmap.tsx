/**
 * AnalogyCrossmap — structural mapping between two analogy domains.
 *
 * Layout: two columns connected by curved SVG paths across the center.
 *   Left column  — source domain elements (stacked cards)
 *   Center SVG   — cubic Bezier connection paths per mapping
 *   Right column — target domain elements (stacked cards)
 *
 * Connection visual register (COUNTERFACTUAL REGISTER compliance):
 *   "strong" — solid palette.gold 2.5px, full opacity
 *   "weak"   — palette.umber 1.5px, 65% opacity, dashed 8/4
 *   "break"  — palette.taupe 1.5px, 45% opacity, dashed 12/6
 *              (matches COUNTERFACTUAL_REGISTER.md exactly)
 *
 * Reveal sequence:
 *   t=0.4s   Domain labels fade in (both simultaneously)
 *   t=1.0s   Source elements stagger in (150ms apart)
 *   t=1.8s   Target elements stagger in (150ms apart)
 *   t=2.8s   Strong/weak mappings draw in (auto-stagger 300ms, or revealAtSec)
 *   t=4.5s   Break mappings draw in (editorial revelation moment)
 *   t=6.0s   breakNote fades in (if present)
 *
 * @composition-animation: useCompositionAnimation (no drift — diagram template)
 */

import React, { useMemo } from "react";
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
} from "../../design/theme";
import { fadeIn, CLAMP_SINE } from "../../utils/animation";
import { warnIf } from "../../utils/dataWarnings";
import type { AnalogyCrossmapData } from "./types";

// ── Reveal timing ──────────────────────────────────────────────────────────

const T_DOMAIN_LABELS = 0.4;
const T_SOURCE_START = 1.0;
const T_TARGET_START = 1.8;
const T_STRONG_START = 2.8;
const T_BREAK_START = 4.5;
const T_BREAK_NOTE = 6.0;

const ELEMENT_STAGGER_SEC = 0.15;
const MAPPING_STAGGER_SEC = 0.3;

// Approximate cubic Bezier path length for strokeDashoffset animation.
// The actual path length varies; 820px is a close approximation for the
// control point geometry used here. Per-path refs would be more accurate
// but incur a DOM measurement per frame — this approximation is fine for
// the editorial draw-on effect.
const APPROX_PATH_LENGTH = 820;
const PATH_DRAW_DURATION = 0.5; // seconds per path

// ── Layout constants ───────────────────────────────────────────────────────

// Source column center x, target column center x (spec: 430 / 1490).
const SOURCE_CENTER_X = 430;
const TARGET_CENTER_X = 1490;
const COLUMN_WIDTH = 300;
const ELEMENT_MIN_HEIGHT = 80;
const ELEMENT_PADDING = 24;
const ELEMENT_GAP = 16;
const DOMAIN_LABEL_HEIGHT = 56; // height of domain header block
const DOMAIN_RULE_HEIGHT = 1;
const DOMAIN_HEADER_TOTAL = DOMAIN_LABEL_HEIGHT + DOMAIN_RULE_HEIGHT + 16;

// ── Helpers ────────────────────────────────────────────────────────────────

/** Estimate element card height from content. */
function estimateElementHeight(hasDescription: boolean): number {
  // label mono 13px + optional description 14px serif italic
  const labelH = 32;
  const descH = hasDescription ? 38 : 0;
  return Math.max(ELEMENT_MIN_HEIGHT, labelH + descH + ELEMENT_PADDING * 2);
}

/** SVG cubic Bezier path string from source anchor to target anchor. */
function bezierPath(
  sx: number,
  sy: number,
  tx: number,
  ty: number,
): string {
  const cx1 = sx + 200;
  const cy1 = sy;
  const cx2 = tx - 200;
  const cy2 = ty;
  return `M ${sx} ${sy} C ${cx1} ${cy1} ${cx2} ${cy2} ${tx} ${ty}`;
}

// ── Component ──────────────────────────────────────────────────────────────

export const AnalogyCrossmap: React.FC<{ data: AnalogyCrossmapData }> = ({
  data,
}) => {
  const frame = useCurrentFrame();
  const direction = useDirection(data._direction);
  // Diagram template — no drift (noDrift: true).
  const { style: compStyle } = useCompositionAnimation({
    ...direction.driftOptions,
    noDrift: true,
  });
  const mode = data.backgroundVariant ?? "light";
  const theme = useThemeMode(mode);
  const emphasis = useEpisodeColorEmphasis();
  const accentColor = emphasis.primaryAccent ?? palette.gold;

  // ── Data validation (warnIf — fires once in Studio, not every frame) ───
  const sourceIds = useMemo(
    () => new Set(data.sourceElements.map((e) => e.id)),
    [data.sourceElements],
  );
  const targetIds = useMemo(
    () => new Set(data.targetElements.map((e) => e.id)),
    [data.targetElements],
  );

  data.mappings.forEach((m) => {
    warnIf(
      !sourceIds.has(m.sourceId),
      "AnalogyCrossmap",
      `Mapping sourceId "${m.sourceId}" does not match any sourceElement id.`,
    );
    warnIf(
      !targetIds.has(m.targetId),
      "AnalogyCrossmap",
      `Mapping targetId "${m.targetId}" does not match any targetElement id.`,
    );
  });

  // ── Element layout geometry (memoized — pure function of data) ──────────
  const { sourceLayout, targetLayout } = useMemo(() => {
    const topPad = data.title ? 240 : 140;
    const contentTop = topPad + DOMAIN_HEADER_TOTAL;

    let srcY = contentTop;
    const srcLayouts: { id: string; y: number; height: number; centerY: number }[] = [];
    for (const el of data.sourceElements) {
      const h = estimateElementHeight(!!el.description);
      srcLayouts.push({ id: el.id, y: srcY, height: h, centerY: srcY + h / 2 });
      srcY += h + ELEMENT_GAP;
    }

    let tgtY = contentTop;
    const tgtLayouts: { id: string; y: number; height: number; centerY: number }[] = [];
    for (const el of data.targetElements) {
      const h = estimateElementHeight(!!el.description);
      tgtLayouts.push({ id: el.id, y: tgtY, height: h, centerY: tgtY + h / 2 });
      tgtY += h + ELEMENT_GAP;
    }

    return {
      sourceLayout: srcLayouts,
      targetLayout: tgtLayouts,
    };
  }, [data.sourceElements, data.targetElements, data.title]);

  const topPad = data.title ? 240 : 140;

  // ── Domain label opacity ───────────────────────────────────────────────
  const domainLabelOpacity = fadeIn(frame, sec(T_DOMAIN_LABELS), sec(0.6));

  // ── Source element opacity envelopes ──────────────────────────────────
  const sourceOpacities = useMemo(
    () =>
      data.sourceElements.map((_, i) =>
        fadeIn(
          frame,
          sec(T_SOURCE_START + i * ELEMENT_STAGGER_SEC),
          sec(0.5),
        ),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [frame, data.sourceElements.length],
  );

  // ── Target element opacity envelopes ──────────────────────────────────
  const targetOpacities = useMemo(
    () =>
      data.targetElements.map((_, i) =>
        fadeIn(
          frame,
          sec(T_TARGET_START + i * ELEMENT_STAGGER_SEC),
          sec(0.5),
        ),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [frame, data.targetElements.length],
  );

  // ── Mapping progress values ────────────────────────────────────────────
  // Separate strong/weak from break — break reveals after the others (the
  // editorial revelation moment of the bounded analogy form).
  const mappingProgresses = useMemo(() => {
    const strongWeak = data.mappings.filter(
      (m) => (m.strength ?? "strong") !== "break",
    );
    const breaks = data.mappings.filter(
      (m) => (m.strength ?? "strong") === "break",
    );

    return data.mappings.map((m) => {
      const strength = m.strength ?? "strong";
      const isBreak = strength === "break";

      let revealStart: number;
      if (m.revealAtSec !== undefined) {
        revealStart = m.revealAtSec;
      } else if (isBreak) {
        const idx = breaks.indexOf(m);
        revealStart = T_BREAK_START + idx * MAPPING_STAGGER_SEC;
      } else {
        const idx = strongWeak.indexOf(m);
        revealStart = T_STRONG_START + idx * MAPPING_STAGGER_SEC;
      }

      // Draw progress: strokeDashoffset goes from APPROX_PATH_LENGTH → 0
      const drawProgress = interpolate(
        frame,
        [sec(revealStart), sec(revealStart + PATH_DRAW_DURATION)],
        [0, 1],
        CLAMP_SINE,
      );

      // Line label opacity trails the draw by 0.2s
      const labelOpacity = fadeIn(
        frame,
        sec(revealStart + PATH_DRAW_DURATION * 0.6),
        sec(0.4),
      );

      return { drawProgress, labelOpacity };
    });
  }, [frame, data.mappings]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── breakNote opacity ──────────────────────────────────────────────────
  const breakNoteOpacity = data.breakNote
    ? fadeIn(frame, sec(T_BREAK_NOTE), sec(0.7))
    : 0;

  // ── Element center lookup maps ─────────────────────────────────────────
  const sourceCenterMap = useMemo(
    () =>
      new Map(sourceLayout.map((l) => [l.id, l.centerY])),
    [sourceLayout],
  );
  const targetCenterMap = useMemo(
    () =>
      new Map(targetLayout.map((l) => [l.id, l.centerY])),
    [targetLayout],
  );

  // Source column anchor: right edge of source column
  const sourceAnchorX = SOURCE_CENTER_X + COLUMN_WIDTH / 2;
  // Target column anchor: left edge of target column
  const targetAnchorX = TARGET_CENTER_X - COLUMN_WIDTH / 2;

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

        {/* ── Domain label: Source ── */}
        <DomainHeader
          label={data.sourceDomain.label}
          subtitle={data.sourceDomain.subtitle}
          x={SOURCE_CENTER_X - COLUMN_WIDTH / 2}
          y={topPad}
          width={COLUMN_WIDTH}
          opacity={domainLabelOpacity}
          theme={theme}
          borderColor={accentColor}
        />

        {/* ── Domain label: Target ── */}
        <DomainHeader
          label={data.targetDomain.label}
          subtitle={data.targetDomain.subtitle}
          x={TARGET_CENTER_X - COLUMN_WIDTH / 2}
          y={topPad}
          width={COLUMN_WIDTH}
          opacity={domainLabelOpacity}
          theme={theme}
          borderColor={palette.dustblue}
        />

        {/* ── Source elements ── */}
        {data.sourceElements.map((el, i) => {
          const lay = sourceLayout[i];
          if (!lay) return null;
          return (
            <ElementCard
              key={el.id}
              label={el.label}
              description={el.description}
              x={SOURCE_CENTER_X - COLUMN_WIDTH / 2}
              y={lay.y}
              width={COLUMN_WIDTH}
              height={lay.height}
              opacity={sourceOpacities[i] ?? 0}
              theme={theme}
              accentColor={accentColor}
              side="source"
            />
          );
        })}

        {/* ── Target elements ── */}
        {data.targetElements.map((el, i) => {
          const lay = targetLayout[i];
          if (!lay) return null;
          return (
            <ElementCard
              key={el.id}
              label={el.label}
              description={el.description}
              x={TARGET_CENTER_X - COLUMN_WIDTH / 2}
              y={lay.y}
              width={COLUMN_WIDTH}
              height={lay.height}
              opacity={targetOpacities[i] ?? 0}
              theme={theme}
              accentColor={palette.dustblue}
              side="target"
            />
          );
        })}

        {/* ── Connection paths (SVG absolute fill) ── */}
        <svg
          width={layout.width}
          height={layout.height}
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
          }}
        >
          {data.mappings.map((m, i) => {
            const strength = m.strength ?? "strong";
            const sourceCY = sourceCenterMap.get(m.sourceId);
            const targetCY = targetCenterMap.get(m.targetId);

            // Skip mappings with missing element ids (already warned above).
            if (sourceCY === undefined || targetCY === undefined) return null;

            const { drawProgress, labelOpacity } = mappingProgresses[i] ?? {
              drawProgress: 0,
              labelOpacity: 0,
            };

            // Animated dashoffset: full path hidden → 0 (fully drawn).
            const dashOffset = APPROX_PATH_LENGTH * (1 - drawProgress);

            // Visual style per strength register.
            let strokeColor: string;
            let strokeWidth: number;
            let strokeOpacity: number;
            let dashArray: string;

            switch (strength) {
              case "strong":
                strokeColor = accentColor;
                strokeWidth = 2.5;
                strokeOpacity = 1;
                dashArray = "none";
                break;
              case "weak":
                strokeColor = palette.umber;
                strokeWidth = 1.5;
                strokeOpacity = 0.65;
                dashArray = "8 4";
                break;
              case "break":
              default:
                // COUNTERFACTUAL REGISTER — must match project/COUNTERFACTUAL_REGISTER.md:
                // dashed "12 6", opacity 0.45, palette.taupe.
                strokeColor = palette.taupe;
                strokeWidth = 1.5;
                strokeOpacity = 0.45;
                dashArray = "12 6";
                break;
            }

            const pathD = bezierPath(
              sourceAnchorX,
              sourceCY,
              targetAnchorX,
              targetCY,
            );

            // Path midpoint for label badge (approximate Bezier t=0.5).
            const midX = (sourceAnchorX + targetAnchorX) / 2;
            const midY = (sourceCY + targetCY) / 2;

            return (
              <g key={`mapping-${i}`}>
                <path
                  d={pathD}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  strokeOpacity={strokeOpacity}
                  strokeDasharray={dashArray === "none" ? undefined : dashArray}
                  strokeDashoffset={dashOffset}
                  strokeLinecap="round"
                />
                {/* Path label badge at approximate midpoint */}
                {m.label && drawProgress > 0.5 && (
                  <text
                    x={midX}
                    y={midY - 8}
                    textAnchor="middle"
                    fontFamily={fonts.mono}
                    fontSize={10}
                    fill={strokeColor}
                    opacity={labelOpacity * strokeOpacity}
                    letterSpacing={1.5}
                    style={{ textTransform: "uppercase" }}
                  >
                    {m.label.toUpperCase()}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* ── Break note callout ── */}
        {data.breakNote && (
          <BreakNoteBox
            text={data.breakNote}
            opacity={breakNoteOpacity}
            theme={theme}
          />
        )}

        <SourceAttribution source={data.source} mode={mode} prefix="Source · " />
        <FooterStrip mode={mode} />
      </AbsoluteFill>
    </Background>
  );
};

// ── DomainHeader ────────────────────────────────────────────────────────────

const DomainHeader: React.FC<{
  label: string;
  subtitle?: string;
  x: number;
  y: number;
  width: number;
  opacity: number;
  theme: ReturnType<typeof useThemeMode>;
  borderColor: string;
}> = ({ label, subtitle, x, y, width, opacity, theme, borderColor }) => (
  <div
    style={{
      position: "absolute",
      top: y,
      left: x,
      width,
      opacity,
    }}
  >
    {/* Domain label — IBM Plex Mono 11px uppercase, widest tracking */}
    <div
      style={{
        fontFamily: fonts.mono,
        fontSize: fontSizes.meta,
        fontWeight: fontWeights.semibold,
        color: palette.walnut,
        letterSpacing: 3,
        textTransform: "uppercase",
        lineHeight: 1.2,
        marginBottom: subtitle ? 4 : 8,
      }}
    >
      {label}
    </div>
    {subtitle && (
      <div
        style={{
          fontFamily: fonts.mono,
          fontSize: fontSizes.meta,
          color: theme.text.muted,
          letterSpacing: 1.5,
          textTransform: "uppercase",
          marginBottom: 8,
          opacity: 0.75,
        }}
      >
        {subtitle}
      </div>
    )}
    {/* Horizontal rule under domain label */}
    <div
      style={{
        height: 1,
        background: borderColor,
        opacity: 0.5,
        width: "100%",
      }}
    />
  </div>
);

// ── ElementCard ─────────────────────────────────────────────────────────────

const ElementCard = React.memo<{
  label: string;
  description?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  opacity: number;
  theme: ReturnType<typeof useThemeMode>;
  accentColor: string;
  side: "source" | "target";
}>(({ label, description, x, y, width, height, opacity, theme, accentColor, side }) => (
  <div
    style={{
      position: "absolute",
      top: y,
      left: x,
      width,
      height,
      opacity,
      boxSizing: "border-box",
      padding: `${ELEMENT_PADDING}px 16px`,
      // Border-left accent — gold for source, dustblue for target
      borderLeft: `4px solid ${accentColor}`,
    }}
  >
    {/* Element label — IBM Plex Mono 13px uppercase tracking-wide */}
    <div
      style={{
        fontFamily: fonts.mono,
        fontSize: 13,
        fontWeight: fontWeights.medium,
        color: palette.umber,
        textTransform: "uppercase",
        letterSpacing: 1.5,
        lineHeight: 1.3,
        marginBottom: description ? 8 : 0,
      }}
    >
      {label}
    </div>
    {/* Element description — IBM Plex Serif italic 14px, 80% opacity */}
    {description && (
      <div
        style={{
          fontFamily: fonts.serifBody,
          fontStyle: "italic",
          fontSize: 14,
          color: theme.text.secondary,
          lineHeight: 1.4,
          opacity: 0.8,
        }}
      >
        {description}
      </div>
    )}
  </div>
));

ElementCard.displayName = "ElementCard";

// ── BreakNoteBox ────────────────────────────────────────────────────────────

const BreakNoteBox: React.FC<{
  text: string;
  opacity: number;
  theme: ReturnType<typeof useThemeMode>;
}> = ({ text, opacity, theme }) => {
  // Position at bottom of diagram, centered.
  const boxWidth = layout.width * 0.62;
  const boxLeft = (layout.width - boxWidth) / 2;

  return (
    <div
      style={{
        position: "absolute",
        bottom: 148,
        left: boxLeft,
        width: boxWidth,
        opacity,
        padding: "16px 24px",
        boxSizing: "border-box",
        borderLeft: `3px solid ${palette.taupe}`,
      }}
    >
      {/* "ANALOGY BREAKS" kicker */}
      <div
        style={{
          fontFamily: fonts.mono,
          fontSize: fontSizes.meta,
          color: palette.taupe,
          letterSpacing: 2,
          textTransform: "uppercase",
          marginBottom: 6,
          fontWeight: fontWeights.semibold,
        }}
      >
        Analogy Breaks
      </div>
      {/* Break note body */}
      <div
        style={{
          fontFamily: fonts.serifBody,
          fontStyle: "italic",
          fontSize: fontSizes.body,
          color: theme.text.secondary,
          lineHeight: 1.45,
          opacity: 0.85,
        }}
      >
        {text}
      </div>
    </div>
  );
};
