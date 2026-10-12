/**
 * ToulminMap — Toulmin argument structure visualization.
 *
 * Six-element layout:
 *
 *  ┌────────────┐         ┌──────────────────┐         ┌────────────┐
 *  │   DATA     │ ──────► │    WARRANT        │ ──────► │   CLAIM    │
 *  │ (grounds)  │         │ (logical bridge)  │         │            │
 *  └────────────┘         └──────────────────┘         └────────────┘
 *                                │                           │
 *                           ┌────┴────┐               ┌─────┴──────┐
 *                           │ BACKING │               │ QUALIFIER  │
 *                           └─────────┘               └────────────┘
 *
 *                                            ┌──────────────────────┐
 *                                     ──────►│ UNLESS…  (REBUTTAL) │
 *                                            └──────────────────────┘
 *
 * The WARRANT is the editorial focal point — making the unstated logical bridge
 * explicit is ToulminMap's core contribution over a plain evidence-to-claim slide.
 *
 * Reveal sequence (sequential mode):
 *   t=0.5s   DATA fades in
 *   t=1.8s   WARRANT fades in + DATA→WARRANT arrow draws
 *   t=3.2s   CLAIM fades in + WARRANT→CLAIM arrow draws
 *   t=4.5s   BACKING fades in + vertical dashed connection (if present)
 *   t=5.5s   QUALIFIER fades in + vertical dashed connection (if present)
 *   t=6.5s   REBUTTAL fades in + dashed branching arrow (if present)
 *
 * @composition-animation: useCompositionAnimation
 */

import React, { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, Easing } from "remotion";
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
import { warnIf } from "../../utils/dataWarnings";
import type { ToulminMapData } from "./types";

// ── Canvas constants ────────────────────────────────────────────────────────
// 1920×1080 coordinates as specified in the design brief.

const BOX_DATA_CX = 320;
const BOX_WARRANT_CX = 960;
const BOX_CLAIM_CX = 1600;

const BOX_MAIN_Y = 490; // center-y of the main row (data / warrant / claim)

const BOX_BACKING_CX = 960;
const BOX_BACKING_CY = 760;

const BOX_QUALIFIER_CX = 1600;
const BOX_QUALIFIER_CY = 720;

const BOX_REBUTTAL_X = 1480; // left edge (not center — see below)
const BOX_REBUTTAL_Y = 880;

const BOX_DATA_W = 400;
const BOX_WARRANT_W = 460;
const BOX_CLAIM_W = 400;
const BOX_BACKING_W = 400;
const BOX_QUALIFIER_W = 340;
const BOX_REBUTTAL_W = 380;

// ── Reveal timing ──────────────────────────────────────────────────────────

const T_DATA = 0.5;
const T_WARRANT = 1.8;
const T_CLAIM = 3.2;
const T_BACKING = 4.5;
const T_QUALIFIER = 5.5;
const T_REBUTTAL = 6.5;
const FADE_DUR = 0.55;

// ── Component ──────────────────────────────────────────────────────────────

export const ToulminMap: React.FC<{ data: ToulminMapData }> = ({ data }) => {
  const frame = useCurrentFrame();
  const direction = useDirection(data._direction);
  const { style: compStyle } = useCompositionAnimation(direction.driftOptions);
  const mode = data.backgroundVariant ?? "light";
  const theme = useThemeMode(mode);
  const emphasis = useEpisodeColorEmphasis();
  const accentColor = emphasis.primaryAccent ?? palette.gold;

  const isSimultaneous = data.revealMode === "simultaneous";

  // Semantic warnings (fire once per session in Studio).
  warnIf(
    data.data.length === 0,
    "ToulminMap",
    "No data items provided — the DATA box will render empty."
  );
  warnIf(
    data.data.length > 4,
    "ToulminMap",
    `${data.data.length} data items — box may overflow. Prefer ≤4 items.`
  );

  // ── Reveal envelopes ──────────────────────────────────────────────────────
  // In simultaneous mode all elements appear together at T_DATA.

  const tData = isSimultaneous ? T_DATA : T_DATA;
  const tWarrant = isSimultaneous ? T_DATA : T_WARRANT;
  const tClaim = isSimultaneous ? T_DATA : T_CLAIM;
  const tBacking = isSimultaneous ? T_DATA : T_BACKING;
  const tQualifier = isSimultaneous ? T_DATA : T_QUALIFIER;
  const tRebuttal = isSimultaneous ? T_DATA : T_REBUTTAL;

  const dataOpacity = fadeIn(frame, sec(tData), sec(FADE_DUR));
  const warrantOpacity = fadeIn(frame, sec(tWarrant), sec(FADE_DUR));
  const claimOpacity = fadeIn(frame, sec(tClaim), sec(FADE_DUR));
  const backingOpacity = data.backing
    ? fadeIn(frame, sec(tBacking), sec(FADE_DUR))
    : 0;
  const qualifierOpacity = data.qualifier
    ? fadeIn(frame, sec(tQualifier), sec(FADE_DUR))
    : 0;
  const rebuttalOpacity = data.rebuttal
    ? fadeIn(frame, sec(tRebuttal), sec(FADE_DUR))
    : 0;

  // Arrow draw-on progress (strokeDashoffset approach).
  // DATA→WARRANT arrow draws as warrant appears.
  const arrowDW = interpolate(
    frame,
    [sec(tWarrant), sec(tWarrant + 0.6)],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) }
  );
  // WARRANT→CLAIM arrow draws as claim appears.
  const arrowWC = interpolate(
    frame,
    [sec(tClaim), sec(tClaim + 0.6)],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) }
  );
  // WARRANT↓BACKING vertical dashed connection.
  const arrowWB = data.backing
    ? interpolate(
        frame,
        [sec(tBacking), sec(tBacking + 0.5)],
        [0, 1],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) }
      )
    : 0;
  // CLAIM↓QUALIFIER vertical dashed connection.
  const arrowCQ = data.qualifier
    ? interpolate(
        frame,
        [sec(tQualifier), sec(tQualifier + 0.5)],
        [0, 1],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) }
      )
    : 0;
  // CLAIM→REBUTTAL branching dashed arrow.
  const arrowCR = data.rebuttal
    ? interpolate(
        frame,
        [sec(tRebuttal), sec(tRebuttal + 0.7)],
        [0, 1],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) }
      )
    : 0;

  // ── Box height estimates (memoized) ──────────────────────────────────────

  const dataBoxHeight = useMemo(() => {
    const baseH = 120;
    const itemH = data.data.length > 2 ? 44 : 52;
    return Math.max(baseH, 40 + data.data.length * itemH);
  }, [data.data.length]);

  const warrantBoxHeight = 140;
  const claimBoxHeight = 120;
  const backingBoxHeight = 110;
  const qualifierBoxHeight = 100;
  const rebuttalBoxHeight = 100;

  // ── Derived box positions (top-left from center-x, center-y) ─────────────

  const dataBox = {
    left: BOX_DATA_CX - BOX_DATA_W / 2,
    top: BOX_MAIN_Y - dataBoxHeight / 2,
    width: BOX_DATA_W,
    height: dataBoxHeight,
  };
  const warrantBox = {
    left: BOX_WARRANT_CX - BOX_WARRANT_W / 2,
    top: BOX_MAIN_Y - warrantBoxHeight / 2,
    width: BOX_WARRANT_W,
    height: warrantBoxHeight,
  };
  const claimBox = {
    left: BOX_CLAIM_CX - BOX_CLAIM_W / 2,
    top: BOX_MAIN_Y - claimBoxHeight / 2,
    width: BOX_CLAIM_W,
    height: claimBoxHeight,
  };
  const backingBox = {
    left: BOX_BACKING_CX - BOX_BACKING_W / 2,
    top: BOX_BACKING_CY - backingBoxHeight / 2,
    width: BOX_BACKING_W,
    height: backingBoxHeight,
  };
  const qualifierBox = {
    left: BOX_QUALIFIER_CX - BOX_QUALIFIER_W / 2,
    top: BOX_QUALIFIER_CY - qualifierBoxHeight / 2,
    width: BOX_QUALIFIER_W,
    height: qualifierBoxHeight,
  };
  const rebuttalBox = {
    left: BOX_REBUTTAL_X,
    top: BOX_REBUTTAL_Y,
    width: BOX_REBUTTAL_W,
    height: rebuttalBoxHeight,
  };

  // ── Arrow geometry ────────────────────────────────────────────────────────
  // DATA→WARRANT: horizontal right edge of data → left edge of warrant.

  const dwStartX = dataBox.left + dataBox.width;
  const dwEndX = warrantBox.left;
  const dwMidY = BOX_MAIN_Y;

  // WARRANT→CLAIM: horizontal right edge of warrant → left edge of claim.
  const wcStartX = warrantBox.left + warrantBox.width;
  const wcEndX = claimBox.left;
  const wcMidY = BOX_MAIN_Y;

  // WARRANT↓BACKING: vertical bottom of warrant → top of backing.
  const wbX = BOX_WARRANT_CX;
  const wbStartY = warrantBox.top + warrantBox.height;
  const wbEndY = backingBox.top;

  // CLAIM↓QUALIFIER: vertical bottom of claim → top of qualifier.
  const cqX = BOX_CLAIM_CX;
  const cqStartY = claimBox.top + claimBox.height;
  const cqEndY = qualifierBox.top;

  // CLAIM→REBUTTAL: diagonal dashed from bottom-right of claim to rebuttal top-left.
  const crStartX = claimBox.left + claimBox.width;
  const crStartY = claimBox.top + claimBox.height;
  const crEndX = rebuttalBox.left + 40;
  const crEndY = rebuttalBox.top;

  // Arrow total lengths for strokeDashoffset animation.
  const arrowDWLength = dwEndX - dwStartX;
  const arrowWCLength = wcEndX - wcStartX;
  const arrowWBLength = wbEndY - wbStartY;
  const arrowCQLength = cqEndY - cqStartY;
  const arrowCRLength = Math.sqrt(
    Math.pow(crEndX - crStartX, 2) + Math.pow(crEndY - crStartY, 2)
  );

  // Arrowhead marker IDs (unique per instance to avoid cross-composition collision).
  const markerIdSolid = "tm-arrow-solid";
  const markerIdDashed = "tm-arrow-dashed";

  const topPad = data.title ? 220 : 140;
  // Offset all boxes from the computed Y so title doesn't overlap.
  const yOffset = data.title ? topPad - 140 : 0;

  const arrowColor = palette.umber;
  const dashedColor = `${palette.umber}99`; // 60% opacity

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

        {/* ── SVG arrow layer ─────────────────────────────────────────── */}
        <svg
          width={layout.width}
          height={layout.height}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            pointerEvents: "none",
          }}
        >
          <defs>
            {/* Solid arrowhead for main horizontal arrows. */}
            <marker
              id={markerIdSolid}
              markerWidth={8}
              markerHeight={6}
              refX={7}
              refY={3}
              orient="auto"
            >
              <path d="M 0 0 L 8 3 L 0 6 Z" fill={arrowColor} />
            </marker>
            {/* Dashed arrowhead for subordinate connections. */}
            <marker
              id={markerIdDashed}
              markerWidth={8}
              markerHeight={6}
              refX={7}
              refY={3}
              orient="auto"
            >
              <path d="M 0 0 L 8 3 L 0 6 Z" fill={dashedColor} />
            </marker>
          </defs>

          {/* DATA → WARRANT horizontal arrow */}
          <line
            x1={dwStartX}
            y1={dwMidY + yOffset}
            x2={dwStartX + arrowDWLength * arrowDW}
            y2={dwMidY + yOffset}
            stroke={arrowColor}
            strokeWidth={1.5}
            markerEnd={arrowDW >= 0.95 ? `url(#${markerIdSolid})` : undefined}
            opacity={warrantOpacity}
          />

          {/* WARRANT → CLAIM horizontal arrow */}
          <line
            x1={wcStartX}
            y1={wcMidY + yOffset}
            x2={wcStartX + arrowWCLength * arrowWC}
            y2={wcMidY + yOffset}
            stroke={arrowColor}
            strokeWidth={1.5}
            markerEnd={arrowWC >= 0.95 ? `url(#${markerIdSolid})` : undefined}
            opacity={claimOpacity}
          />

          {/* WARRANT ↓ BACKING vertical dashed connection */}
          {data.backing && (
            <line
              x1={wbX}
              y1={wbStartY + yOffset}
              x2={wbX}
              y2={wbStartY + yOffset + arrowWBLength * arrowWB}
              stroke={dashedColor}
              strokeWidth={1.5}
              strokeDasharray="5 4"
              markerEnd={arrowWB >= 0.95 ? `url(#${markerIdDashed})` : undefined}
              opacity={backingOpacity}
            />
          )}

          {/* CLAIM ↓ QUALIFIER vertical dashed connection */}
          {data.qualifier && (
            <line
              x1={cqX}
              y1={cqStartY + yOffset}
              x2={cqX}
              y2={cqStartY + yOffset + arrowCQLength * arrowCQ}
              stroke={dashedColor}
              strokeWidth={1.5}
              strokeDasharray="5 4"
              markerEnd={arrowCQ >= 0.95 ? `url(#${markerIdDashed})` : undefined}
              opacity={qualifierOpacity}
            />
          )}

          {/* CLAIM → REBUTTAL diagonal dashed branching arrow */}
          {data.rebuttal && (
            <line
              x1={crStartX}
              y1={crStartY + yOffset}
              x2={crStartX + (crEndX - crStartX) * arrowCR}
              y2={crStartY + yOffset + (crEndY - crStartY) * arrowCR}
              stroke={`${semantic.china}72`}
              strokeWidth={1.5}
              strokeDasharray="8 5"
              markerEnd={arrowCR >= 0.95 ? `url(#${markerIdDashed})` : undefined}
              opacity={rebuttalOpacity}
            />
          )}
        </svg>

        {/* ── DATA box ───────────────────────────────────────────────────── */}
        <ArgumentBox
          left={dataBox.left}
          top={dataBox.top + yOffset}
          width={dataBox.width}
          height={dataBox.height}
          opacity={dataOpacity}
          borderStyle="data"
          accentColor={palette.dustblue}
          theme={theme}
        >
          <BoxLabel label="DATA" color={palette.umber} />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: data.data.length > 2 ? 6 : 10,
            }}
          >
            {data.data.map((item, i) => (
              <DataItem
                key={i}
                text={item.text}
                attribution={item.attribution}
                compact={data.data.length > 2}
                theme={theme}
              />
            ))}
          </div>
        </ArgumentBox>

        {/* ── WARRANT box ─────────────────────────────────────────────────── */}
        <ArgumentBox
          left={warrantBox.left}
          top={warrantBox.top + yOffset}
          width={warrantBox.width}
          height={warrantBox.height}
          opacity={warrantOpacity}
          borderStyle="warrant"
          accentColor={accentColor}
          theme={theme}
        >
          <BoxLabel
            label={data.warrant.label ?? "WARRANT"}
            color={palette.gold}
          />
          <div
            style={{
              fontFamily: fonts.serifBody,
              fontSize: fontSizes.body,
              fontStyle: "italic",
              fontWeight: fontWeights.medium,
              color: theme.text.primary,
              lineHeight: 1.35,
              letterSpacing: "-0.005em",
            }}
          >
            {data.warrant.text}
          </div>
        </ArgumentBox>

        {/* ── CLAIM box ───────────────────────────────────────────────────── */}
        <ArgumentBox
          left={claimBox.left}
          top={claimBox.top + yOffset}
          width={claimBox.width}
          height={claimBox.height}
          opacity={claimOpacity}
          borderStyle="claim"
          accentColor={accentColor}
          claimEmphasis={data.claim.emphasis}
          theme={theme}
        >
          <BoxLabel label="CLAIM" color={palette.umber} />
          <div
            style={{
              fontFamily: fonts.serifBody,
              fontSize: fontSizes.body,
              fontWeight: data.claim.emphasis
                ? fontWeights.semibold
                : fontWeights.regular,
              color: theme.text.primary,
              lineHeight: 1.3,
              letterSpacing: "-0.005em",
            }}
          >
            {data.claim.text}
          </div>
        </ArgumentBox>

        {/* ── BACKING box (optional) ─────────────────────────────────────── */}
        {data.backing && (
          <ArgumentBox
            left={backingBox.left}
            top={backingBox.top + yOffset}
            width={backingBox.width}
            height={backingBox.height}
            opacity={backingOpacity}
            borderStyle="backing"
            accentColor={palette.umber}
            theme={theme}
          >
            <BoxLabel
              label={data.backing.label ?? "BACKING"}
              color={palette.umber}
            />
            <div
              style={{
                fontFamily: fonts.serifBody,
                fontSize: fontSizes.caption + 1,
                fontStyle: "italic",
                color: theme.text.secondary,
                lineHeight: 1.35,
              }}
            >
              {data.backing.text}
            </div>
          </ArgumentBox>
        )}

        {/* ── QUALIFIER box (optional) ───────────────────────────────────── */}
        {data.qualifier && (
          <ArgumentBox
            left={qualifierBox.left}
            top={qualifierBox.top + yOffset}
            width={qualifierBox.width}
            height={qualifierBox.height}
            opacity={qualifierOpacity}
            borderStyle="qualifier"
            accentColor={palette.umber}
            theme={theme}
          >
            <BoxLabel
              label={data.qualifier.label ?? "QUALIFIER"}
              color={palette.umber}
            />
            <div
              style={{
                fontFamily: fonts.serifBody,
                fontSize: fontSizes.caption + 1,
                fontStyle: "italic",
                color: theme.text.muted,
                lineHeight: 1.35,
              }}
            >
              {data.qualifier.text}
            </div>
          </ArgumentBox>
        )}

        {/* ── REBUTTAL box (optional) ────────────────────────────────────── */}
        {data.rebuttal && (
          <ArgumentBox
            left={rebuttalBox.left}
            top={rebuttalBox.top + yOffset}
            width={rebuttalBox.width}
            height={rebuttalBox.height}
            opacity={rebuttalOpacity}
            borderStyle="rebuttal"
            accentColor={semantic.china}
            theme={theme}
          >
            {/* UNLESS prefix in semantic.china */}
            <div
              style={{
                fontFamily: fonts.mono,
                fontSize: fontSizes.meta,
                color: semantic.china,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                marginBottom: 6,
              }}
            >
              {data.rebuttal.prefix ?? "UNLESS"}
            </div>
            <div
              style={{
                fontFamily: fonts.serifBody,
                fontSize: fontSizes.caption + 1,
                fontStyle: "italic",
                color: theme.text.secondary,
                lineHeight: 1.35,
              }}
            >
              {data.rebuttal.text}
            </div>
          </ArgumentBox>
        )}

        <SourceAttribution source={data.source} mode={mode} prefix="Source · " />
        <FooterStrip mode={mode} />
      </AbsoluteFill>
    </Background>
  );
};

// ── ArgumentBox ────────────────────────────────────────────────────────────

type BorderStyle = "data" | "warrant" | "claim" | "backing" | "qualifier" | "rebuttal";

const ArgumentBox: React.FC<{
  left: number;
  top: number;
  width: number;
  height: number;
  opacity: number;
  borderStyle: BorderStyle;
  accentColor: string;
  claimEmphasis?: boolean;
  theme: ReturnType<typeof useThemeMode>;
  children: React.ReactNode;
}> = ({
  left,
  top,
  width,
  height,
  opacity,
  borderStyle,
  accentColor,
  claimEmphasis,
  theme,
  children,
}) => {
  const boxStyle = useMemo((): React.CSSProperties => {
    const base: React.CSSProperties = {
      position: "absolute",
      top,
      left,
      width,
      height,
      opacity,
      padding: 20,
      boxSizing: "border-box",
    };

    switch (borderStyle) {
      case "data":
        return {
          ...base,
          borderLeft: `4px solid ${palette.dustblue}`,
        };
      case "warrant":
        return {
          ...base,
          border: `1.5px solid ${palette.gold}`,
          borderLeft: `4px solid ${palette.gold}`,
        };
      case "claim":
        return {
          ...base,
          borderLeft: `4px solid ${accentColor}`,
        };
      case "backing":
        return {
          ...base,
          border: `1px dashed ${palette.umber}99`,
        };
      case "qualifier":
        return {
          ...base,
          border: `1px dashed ${palette.umber}99`,
        };
      case "rebuttal":
        return {
          ...base,
          border: `1px dashed ${semantic.china}72`,
        };
      default:
        return base;
    }
  }, [
    left,
    top,
    width,
    height,
    opacity,
    borderStyle,
    accentColor,
  ]);

  return <div style={boxStyle}>{children}</div>;
};

// ── BoxLabel ───────────────────────────────────────────────────────────────

const BoxLabel: React.FC<{ label: string; color: string }> = React.memo(
  ({ label, color }) => (
    <div
      style={{
        fontFamily: fonts.mono,
        fontSize: fontSizes.meta,
        color,
        letterSpacing: "0.15em",
        textTransform: "uppercase",
        marginBottom: 8,
      }}
    >
      {label}
    </div>
  )
);
BoxLabel.displayName = "BoxLabel";

// ── DataItem ───────────────────────────────────────────────────────────────

const DataItem: React.FC<{
  text: string;
  attribution?: string;
  compact: boolean;
  theme: ReturnType<typeof useThemeMode>;
}> = React.memo(({ text, attribution, compact, theme }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
    <div
      style={{
        fontFamily: fonts.serifBody,
        fontSize: compact ? fontSizes.caption + 1 : fontSizes.body - 2,
        color: theme.text.primary,
        lineHeight: 1.3,
        letterSpacing: "-0.005em",
      }}
    >
      {text}
    </div>
    {attribution && (
      <div
        style={{
          fontFamily: fonts.mono,
          fontSize: fontSizes.meta,
          color: theme.text.muted,
          letterSpacing: "0.08em",
        }}
      >
        {attribution}
      </div>
    )}
  </div>
));
DataItem.displayName = "DataItem";
