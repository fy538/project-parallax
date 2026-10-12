/**
 * ConditionalArgument — IF/THEN binary branching.
 *
 *                    [ IF <condition> ]
 *                           ↓
 *                       (pivot)
 *                      ↙        ↘
 *               [ TRUE ]      [ FALSE ]
 *               consequence    consequence
 *
 * Reveal sequence:
 *   t=0.4s  Condition statement
 *   t=2.0s  Pivot point (brand mark ∴) scales in
 *   t=2.8s  Both branch arrows draw simultaneously
 *   t=3.6s  Both branch panels fade in
 *   t=5.5s  Determinant footnote (when present)
 *
 * @composition-animation: useCompositionAnimation
 */

import { textAccent } from "../../utils/colorUtils";
import React from "react";
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
  brandMark,
  fontSizes,
  fontWeights,
  fonts,
  layout,
  palette,
  sec,
  semantic,
} from "../../design/theme";
import { areSeamsOwnedByEpisode, fadeIn } from "../../utils/animation";
import type {
  ConditionalArgumentData,
  ConditionalBranch,
} from "./types";

// ── Reveal timing ──────────────────────────────────────────────────────────

const T_CONDITION = 0.4;
const T_PIVOT = 2.0;
const T_ARROWS = 2.8;
const T_BRANCHES = 3.6;
const T_DETERMINANT = 5.5;

// ── Severity → color map ───────────────────────────────────────────────────

function severityColor(
  sev: ConditionalBranch["severity"] | undefined,
  accent: string,
): string {
  switch (sev) {
    case "low":
      return palette.dustblue;
    case "high":
      return semantic.china;
    case "critical":
      return semantic.china;
    case "medium":
    default:
      return accent;
  }
}

// ── Component ──────────────────────────────────────────────────────────────

export const ConditionalArgument: React.FC<{ data: ConditionalArgumentData }> = ({
  data,
}) => {
  const frame = useCurrentFrame();
  const direction = useDirection(data._direction);
  const { style: compStyle } = useCompositionAnimation(direction.driftOptions);
  const mode = data.backgroundVariant ?? "light";
  const theme = useThemeMode(mode);
  const emphasis = useEpisodeColorEmphasis();
  const accentColor = emphasis.primaryAccent ?? palette.gold;

  // Layout. The IF → branches block is centred in the space under the title;
  // it used to hang from a fixed top, leaving the lower third of a long hold
  // empty.
  const conditionWidth = layout.width * 0.6;
  const conditionLeft = (layout.width - conditionWidth) / 2;
  const conditionHeight = 130;
  const arrowsHeight = 90;
  const branchWidth = 480;
  const branchGap = 80;
  const leftBranchX = (layout.width - branchWidth * 2 - branchGap) / 2;
  const rightBranchX = leftBranchX + branchWidth + branchGap;
  const branchHeight = 280;
  // What the branch row actually occupies: the full slot when a determinant
  // line hangs below it, otherwise just label + (figure) + consequence.
  const hasStat = Boolean(data.ifTrue.stat || data.ifFalse.stat);
  const branchRowH = data.determinant
    ? branchHeight + 72
    : hasStat
      ? 210
      : 140;
  const blockH = conditionHeight + 32 + 70 + arrowsHeight + 8 + branchRowH;
  const areaTop = data.title ? 200 : layout.safeArea.top + 56;
  const areaBottom = layout.height - layout.safeArea.bottom - 60;
  const conditionTop = Math.round(
    areaTop + Math.max(0, (areaBottom - areaTop - blockH) / 2),
  );
  const pivotY = conditionTop + conditionHeight + 32;
  const arrowsTop = pivotY + 70;
  const branchTop = arrowsTop + arrowsHeight + 8;

  // Reveal envelopes.
  // Reveal times. Defaults keep the original fixed choreography; a data file
  // can move the IF line, the branches and each branch's figure so they land
  // with the narration.
  const tCondition = data.conditionAtSec ?? T_CONDITION;
  const tBranches = data.branchesAtSec ?? T_BRANCHES;
  const tPivot = Math.max(0, tBranches - (T_BRANCHES - T_PIVOT));
  const tArrows = Math.max(0, tBranches - (T_BRANCHES - T_ARROWS));
  const tDeterminant = tBranches + (T_DETERMINANT - T_BRANCHES);
  // Inside an episode a cut lands on the premise already set, unless the data
  // times it to the narration (utils/animation.ts, "Seam ownership").
  const condOpacity =
    areSeamsOwnedByEpisode() && data.conditionAtSec === undefined
      ? 1
      : fadeIn(frame, sec(tCondition), sec(0.6));
  const pivotOpacity = fadeIn(frame, sec(tPivot), sec(0.5));
  const pivotScale = interpolate(
    frame,
    [sec(tPivot), sec(tPivot + 0.5)],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.back(1.5)),
    },
  );
  const arrowProgress = interpolate(
    frame,
    [sec(tArrows), sec(tArrows + 0.7)],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const branchOpacity = fadeIn(frame, sec(tBranches), sec(0.6));
  const statOpacityFor = (b: ConditionalBranch) =>
    b.statAtSec === undefined ? 1 : fadeIn(frame, sec(b.statAtSec), sec(0.6));
  const determinantOpacity = data.determinant
    ? fadeIn(frame, sec(tDeterminant), sec(0.6))
    : 0;

  const leftColor = severityColor(data.ifTrue.severity, accentColor);
  const rightColor = severityColor(data.ifFalse.severity, accentColor);

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

        {/* Condition statement (top). */}
        <div
          style={{
            position: "absolute",
            top: conditionTop,
            left: conditionLeft,
            width: conditionWidth,
            height: conditionHeight,
            textAlign: "center",
            opacity: condOpacity,
          }}
        >
          <div
            style={{
              fontFamily: fonts.mono,
              fontSize: fontSizes.readable, // was body (22)
              fontWeight: fontWeights.semibold,
              color: theme.text.muted,
              letterSpacing: 4,
              textTransform: "uppercase",
              marginBottom: 12,
            }}
          >
            IF
          </div>
          <div
            style={{
              fontFamily: fonts.serifBody,
              fontStyle: "italic",
              fontSize: fontSizes.h3,
              color: theme.text.primary,
              lineHeight: 1.25,
              letterSpacing: "-0.005em",
            }}
          >
            {data.condition}
          </div>
        </div>

        {/* Pivot — brand mark ∴ */}
        <div
          style={{
            position: "absolute",
            top: pivotY,
            left: 0,
            right: 0,
            textAlign: "center",
            fontFamily: fonts.display,
            fontSize: fontSizes.h2,
            color: accentColor,
            opacity: pivotOpacity,
            transform: `scale(${pivotScale})`,
            transformOrigin: "center",
            lineHeight: 1,
          }}
        >
          {brandMark.glyph}
        </div>

        {/* Branch arrows (left ↙ and right ↘). */}
        <svg
          width={layout.width}
          height={arrowsHeight}
          style={{
            position: "absolute",
            top: arrowsTop,
            left: 0,
            pointerEvents: "none",
          }}
        >
          {/* Left arrow */}
          <line
            x1={layout.width / 2}
            y1={0}
            x2={layout.width / 2 - ((layout.width / 2) - (leftBranchX + branchWidth / 2)) * arrowProgress}
            y2={0 + (arrowsHeight - 6) * arrowProgress}
            stroke={leftColor}
            strokeWidth={2}
            opacity={0.7}
          />
          {/* Right arrow */}
          <line
            x1={layout.width / 2}
            y1={0}
            x2={layout.width / 2 + ((rightBranchX + branchWidth / 2) - layout.width / 2) * arrowProgress}
            y2={0 + (arrowsHeight - 6) * arrowProgress}
            stroke={rightColor}
            strokeWidth={2}
            opacity={0.7}
          />
        </svg>

        {/* Left branch (IF TRUE). */}
        <BranchPanel
          branch={data.ifTrue}
          marker="✓"
          markerLabel="True"
          x={leftBranchX}
          y={branchTop}
          width={branchWidth}
          height={branchHeight}
          accentColor={leftColor}
          theme={theme}
          opacity={branchOpacity}
          statOpacity={statOpacityFor(data.ifTrue)}
        />

        {/* Right branch (IF FALSE). */}
        <BranchPanel
          branch={data.ifFalse}
          marker="✗"
          markerLabel="False"
          x={rightBranchX}
          y={branchTop}
          width={branchWidth}
          height={branchHeight}
          accentColor={rightColor}
          theme={theme}
          opacity={branchOpacity}
          statOpacity={statOpacityFor(data.ifFalse)}
        />

        {/* Determinant footnote (centred, below branches). */}
        {data.determinant && (
          <div
            style={{
              position: "absolute",
              top: branchTop + branchHeight + 32,
              left: leftBranchX,
              width: branchWidth * 2 + branchGap,
              textAlign: "center",
              fontFamily: fonts.serifBody,
              fontStyle: "italic",
              fontSize: fontSizes.readable, // was body (22)
              color: theme.text.muted,
              lineHeight: 1.35,
              opacity: determinantOpacity,
            }}
          >
            <span style={{ fontFamily: fonts.mono, fontSize: fontSizes.caption, letterSpacing: 2, textTransform: "uppercase", marginRight: 8 }}>
              Determinant:
            </span>
            {data.determinant}
          </div>
        )}

        <SourceAttribution source={data.source} mode={mode} prefix="Source · " />
        <FooterStrip mode={mode} />
      </AbsoluteFill>
    </Background>
  );
};

// ── BranchPanel ────────────────────────────────────────────────────────────

const BranchPanel: React.FC<{
  branch: ConditionalBranch;
  marker: string;
  markerLabel: string;
  x: number;
  y: number;
  width: number;
  height: number;
  accentColor: string;
  theme: ReturnType<typeof useThemeMode>;
  opacity: number;
  /** Opacity of the figure + consequence (1 unless the branch sets statAtSec). */
  statOpacity: number;
}> = ({ branch, marker, markerLabel, x, y, width, height, accentColor, theme, opacity, statOpacity }) => {
  const isCritical = branch.severity === "critical";
  return (
    <div
      style={{
        position: "absolute",
        top: y,
        left: x,
        width,
        height,
        opacity,
        padding: 28,
        boxSizing: "border-box",
        borderTop: `3px solid ${accentColor}`,
      }}
    >
      {/* Marker (✓ / ✗) with label. */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: accentColor,
            color: palette.paper,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: fonts.display,
            fontSize: 22,
            fontWeight: fontWeights.semibold,
          }}
        >
          {marker}
        </div>
        <div
          style={{
            fontFamily: fonts.mono,
            fontSize: fontSizes.readable, // was label (18)
            color: textAccent(accentColor, theme.isDark),
            letterSpacing: 2,
            textTransform: "uppercase",
          }}
        >
          {markerLabel} · {branch.label}
        </div>
      </div>

      {/* Hero stat (optional). */}
      {branch.stat && (
        <div
          style={{
            fontFamily: fonts.data,
            fontSize: fontSizes.display,
            fontWeight: fontWeights.bold,
            color: textAccent(accentColor, theme.isDark),
            lineHeight: 1,
            marginBottom: 12,
            opacity: statOpacity,
          }}
        >
          {branch.stat}
        </div>
      )}

      {/* Consequence text. */}
      <div
        style={{
          fontFamily: fonts.serifBody,
          fontSize: fontSizes.body + 8, // was 24px: small for the line that carries the branch
          fontWeight: isCritical ? fontWeights.medium : fontWeights.regular,
          color: theme.text.primary,
          lineHeight: 1.4,
          letterSpacing: "-0.005em",
          textDecoration: isCritical ? "underline" : undefined,
          textDecorationColor: accentColor,
          textDecorationThickness: 2,
          textUnderlineOffset: 4,
          opacity: statOpacity,
        }}
      >
        {branch.consequence}
      </div>

      {/* Probability gloss. */}
      {branch.probabilityGloss && (
        <div
          style={{
            position: "absolute",
            bottom: 16,
            left: 28,
            right: 28,
            fontFamily: fonts.mono,
            fontSize: fontSizes.meta,
            color: theme.text.muted,
            letterSpacing: 1.5,
            textTransform: "uppercase",
          }}
        >
          {branch.probabilityGloss}
        </div>
      )}
    </div>
  );
};
