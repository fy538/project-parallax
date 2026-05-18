/**
 * PopulationPyramid — back-to-back horizontal bar chart by age cohort.
 *
 * Left half = male bars (growing left from center axis).
 * Right half = female bars (growing right from center axis).
 * Center = age group labels.
 *
 * Supports three variants:
 *   "single"     — one pyramid, animated entrance + optional hold
 *   "morph"      — pyramid A builds in, then morphs to pyramid B values
 *   "comparison" — two pyramids side-by-side (e.g. China vs India)
 *
 * Design rationale:
 *   Standard demographic form: UN Population Division, PRB, Our World in Data,
 *   FT, Economist all use this idiom for youth-bulge / aging arguments.
 *   Bars grow from center axis outward (not from left edge) to make the
 *   bilateral symmetry legible at video scrubbing speed.
 */

import React, { useMemo } from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
} from "remotion";
import {
  palette,
  semantic,
  fonts,
  fontSizes,
  layout,
  sec,
  shadows,
  contentArea,
} from "../../design/theme";
import { TitleBlock } from "../../components/TitleBlock";
import { SourceAttribution } from "../../components/SourceAttribution";
import { HeaderStrip } from "../../components/HeaderStrip";
import { FooterStrip } from "../../components/FooterStrip";
import { Background } from "../../components/Background";
import { useCompositionAnimation } from "../../hooks/useCompositionAnimation";
import { useDirection } from "../../hooks/useDirection";
import { useThemeMode } from "../../hooks/useThemeMode";
import { fadeIn, stagger, anticipatoryStartFrame, CLAMP_SINE, CLAMP_CUBIC } from "../../utils/animation";
import { warnIf } from "../../utils/dataWarnings";
import type { PopulationPyramidData, PyramidCohort } from "./types";

// ── Color assignments ────────────────────────────────────────────────────────
// Male: muted blue (semantic.us — cool, recessed)
// Female: muted rust (semantic.china — warm, prominent)
// Highlighted: amber/gold (editorial accent)
const MALE_COLOR = semantic.us;
const FEMALE_COLOR = semantic.china;
const HIGHLIGHT_COLOR = palette.gold;

// ── Single pyramid (one side) ─────────────────────────────────────────────────

interface SinglePyramidProps {
  cohorts: PyramidCohort[];
  maxVal: number;
  /** Width available for the entire pyramid (both sides + center axis) */
  totalWidth: number;
  totalHeight: number;
  frame: number;
  highlightAgeGroups: Set<string>;
  /** Offset in frames for this pyramid's entrance (0 = start immediately) */
  entranceOffset: number;
  /** Override colors for male/female bars (comparison variant) */
  maleColor?: string;
  femaleColor?: string;
  /** Show the gender legend labels (only needed once per canvas) */
  showLegend?: boolean;
  /** Morph target values — when provided, bars animate from current to morph values */
  morphCohorts?: PyramidCohort[];
  /** Progress for the morph animation (0 = initial, 1 = fully morphed) */
  morphProgress?: number;
  /** Theme mode for mode-aware colors */
  mode?: "light" | "dark";
}

const SinglePyramid: React.FC<SinglePyramidProps> = React.memo(({
  cohorts,
  maxVal,
  totalWidth,
  totalHeight,
  frame,
  highlightAgeGroups,
  entranceOffset,
  maleColor = MALE_COLOR,
  femaleColor = FEMALE_COLOR,
  showLegend = false,
  morphCohorts,
  morphProgress = 0,
  mode = "light",
}) => {
  const theme = useThemeMode(mode);

  const AXIS_WIDTH = 88;                        // center label column
  const HALF_WIDTH = (totalWidth - AXIS_WIDTH) / 2; // each bar side
  const numCohorts = cohorts.length;
  const rowHeight = totalHeight / Math.max(numCohorts, 1);
  const BAR_HEIGHT_FRACTION = 0.72;             // bars occupy 72% of row height

  return (
    <div style={{ position: "relative", width: totalWidth, height: totalHeight }}>
      {cohorts.map((cohort, rowIdx) => {
        const isHighlighted = highlightAgeGroups.has(cohort.ageGroup);

        // Morph-interpolated values
        const morphCohort = morphCohorts?.[rowIdx];
        const maleTarget = morphCohort
          ? cohort.male + (morphCohort.male - cohort.male) * morphProgress
          : cohort.male;
        const femaleTarget = morphCohort
          ? cohort.female + (morphCohort.female - cohort.female) * morphProgress
          : cohort.female;

        // Stagger: youngest cohort first (index 0), oldest last
        const startFrame = stagger(rowIdx, sec(0.04)) + entranceOffset;

        const growProgress = interpolate(
          frame,
          [startFrame, startFrame + sec(0.5)],
          [0, 1],
          CLAMP_CUBIC
        );

        const maleBarWidth = (maleTarget / Math.max(maxVal, 1)) * HALF_WIDTH * growProgress;
        const femaleBarWidth = (femaleTarget / Math.max(maxVal, 1)) * HALF_WIDTH * growProgress;

        const rowOpacity = fadeIn(frame, startFrame, sec(0.3));
        const rowTop = rowIdx * rowHeight;
        const barTop = rowTop + rowHeight * (1 - BAR_HEIGHT_FRACTION) / 2;
        const barH = rowHeight * BAR_HEIGHT_FRACTION;

        const maleBarColor = isHighlighted ? HIGHLIGHT_COLOR : maleColor;
        const femaleBarColor = isHighlighted ? HIGHLIGHT_COLOR : femaleColor;

        return (
          <div
            key={cohort.ageGroup}
            style={{
              position: "absolute",
              top: rowTop,
              left: 0,
              width: totalWidth,
              height: rowHeight,
              opacity: rowOpacity,
            }}
          >
            {/* Subtle row separator (alternating stripe for readability) */}
            {rowIdx % 2 === 1 && (
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: totalWidth,
                  height: rowHeight,
                  background: `${palette.ink}06`,
                  pointerEvents: "none",
                }}
              />
            )}

            {/* Male bar — grows LEFT from the axis (right-aligned in left half) */}
            <div
              style={{
                position: "absolute",
                top: barTop - rowTop,
                right: HALF_WIDTH + AXIS_WIDTH,
                width: maleBarWidth,
                height: barH,
                background: isHighlighted
                  ? `linear-gradient(90deg, ${maleBarColor}CC 0%, ${maleBarColor} 100%)`
                  : `linear-gradient(90deg, ${maleBarColor}99 0%, ${maleBarColor}CC 100%)`,
                borderRadius: `${2}px 0 0 ${2}px`,
                boxShadow: isHighlighted ? shadows.accentGlowSm(maleBarColor) : "none",
              }}
            />

            {/* Age label — fixed center column */}
            <div
              style={{
                position: "absolute",
                top: barTop - rowTop + (barH - fontSizes.meta) / 2,
                left: HALF_WIDTH,
                width: AXIS_WIDTH,
                textAlign: "center",
                fontSize: fontSizes.meta,
                fontFamily: fonts.data,
                color: isHighlighted ? HIGHLIGHT_COLOR : theme.text.muted,
                fontWeight: isHighlighted ? 700 : 500,
                whiteSpace: "nowrap",
                letterSpacing: 0.3,
                lineHeight: 1,
              }}
            >
              {cohort.ageGroup}
            </div>

            {/* Female bar — grows RIGHT from the axis */}
            <div
              style={{
                position: "absolute",
                top: barTop - rowTop,
                left: HALF_WIDTH + AXIS_WIDTH,
                width: femaleBarWidth,
                height: barH,
                background: isHighlighted
                  ? `linear-gradient(90deg, ${femaleBarColor} 0%, ${femaleBarColor}CC 100%)`
                  : `linear-gradient(90deg, ${femaleBarColor}CC 0%, ${femaleBarColor}99 100%)`,
                borderRadius: `0 ${2}px ${2}px 0`,
                boxShadow: isHighlighted ? shadows.accentGlowSm(femaleBarColor) : "none",
              }}
            />
          </div>
        );
      })}

      {/* Gender legend (rendered once on the single/morph layout) */}
      {showLegend && (
        <div
          style={{
            position: "absolute",
            top: -28,
            left: 0,
            width: totalWidth,
            display: "flex",
            justifyContent: "space-between",
            opacity: fadeIn(frame, sec(0.3), sec(0.4)),
          }}
        >
          {/* Male label — right-aligned in left half */}
          <div
            style={{
              width: HALF_WIDTH,
              textAlign: "right",
              paddingRight: layout.spacing.sm,
              fontSize: fontSizes.caption,
              fontFamily: fonts.metadata,
              fontWeight: 700,
              color: maleColor,
              letterSpacing: 1.5,
              textTransform: "uppercase",
              textShadow: shadows.textLift,
            }}
          >
            MALE
          </div>
          {/* Spacer for axis */}
          <div style={{ width: AXIS_WIDTH }} />
          {/* Female label — left-aligned in right half */}
          <div
            style={{
              width: HALF_WIDTH,
              textAlign: "left",
              paddingLeft: layout.spacing.sm,
              fontSize: fontSizes.caption,
              fontFamily: fonts.metadata,
              fontWeight: 700,
              color: femaleColor,
              letterSpacing: 1.5,
              textTransform: "uppercase",
              textShadow: shadows.textLift,
            }}
          >
            FEMALE
          </div>
        </div>
      )}
    </div>
  );
});

// ── Max tick mark at the ends of the scale ───────────────────────────────────

interface ScaleTickProps {
  maxVal: number;
  halfWidth: number;
  unit: string;
  frame: number;
  mode: "light" | "dark";
}

const ScaleTick: React.FC<ScaleTickProps> = React.memo(({ maxVal, halfWidth, unit, frame, mode }) => {
  const theme = useThemeMode(mode);
  const opacity = interpolate(frame, [sec(0.8), sec(1.4)], [0, 0.6], CLAMP_SINE);
  const label = maxVal >= 1000
    ? `${(maxVal / 1000).toFixed(0)}k`
    : `${maxVal}`;

  return (
    <div
      style={{
        position: "absolute",
        bottom: -20,
        left: 0,
        width: halfWidth * 2 + 88,
        display: "flex",
        justifyContent: "space-between",
        opacity,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          fontSize: fontSizes.meta,
          fontFamily: fonts.data,
          color: theme.text.muted,
          width: halfWidth,
          textAlign: "left",
        }}
      >
        ← {label}{unit && ` ${unit}`}
      </div>
      <div style={{ width: 88 }} />
      <div
        style={{
          fontSize: fontSizes.meta,
          fontFamily: fonts.data,
          color: theme.text.muted,
          width: halfWidth,
          textAlign: "right",
        }}
      >
        {label}{unit && ` ${unit}`} →
      </div>
    </div>
  );
});

// ── Year label (morph variant) ────────────────────────────────────────────────

interface YearLabelProps {
  labelA?: string;
  labelB?: string;
  morphProgress: number;
  frame: number;
  morphStartFrame: number;
  mode: "light" | "dark";
}

const YearLabel: React.FC<YearLabelProps> = React.memo(({
  labelA,
  labelB,
  morphProgress,
  frame,
  morphStartFrame,
  mode,
}) => {
  const theme = useThemeMode(mode);
  if (!labelA && !labelB) return null;

  // Show labelA fully until morph starts, then cross-fade to labelB
  // linear-ok: opacity crossfade between year labels — eased curve reads as sluggish.
  const labelAOpacity = interpolate(morphProgress, [0, 0.3], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  // linear-ok: opacity crossfade between year labels — eased curve reads as sluggish.
  const labelBOpacity = interpolate(morphProgress, [0.3, 0.7], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const labelEnter = fadeIn(frame, 0, sec(0.5));

  return (
    <div
      style={{
        position: "relative",
        height: 56,
        opacity: labelEnter,
      }}
    >
      {labelA && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            textAlign: "center",
            fontSize: fontSizes.h3,
            fontFamily: fonts.display,
            fontWeight: 700,
            color: theme.text.primary,
            letterSpacing: 2,
            opacity: labelAOpacity,
            textShadow: shadows.textLift,
          }}
        >
          {labelA}
        </div>
      )}
      {labelB && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            textAlign: "center",
            fontSize: fontSizes.h3,
            fontFamily: fonts.display,
            fontWeight: 700,
            color: palette.gold,
            letterSpacing: 2,
            opacity: labelBOpacity,
            textShadow: shadows.textLift,
          }}
        >
          {labelB}
        </div>
      )}
    </div>
  );
});

// ── Main component ────────────────────────────────────────────────────────────

export const PopulationPyramid: React.FC<{ data: PopulationPyramidData }> = ({ data }) => {
  const frame = useCurrentFrame();
  const variant = data.backgroundVariant ?? "light";
  const theme = useThemeMode(variant);
  const direction = useDirection(data._direction);
  const { style: compStyle } = useCompositionAnimation(direction.driftOptions);

  // K3: per-data color overrides for male/female bars
  const maleBarColor = data.maleColor ?? MALE_COLOR;
  const femaleBarColor = data.femaleColor ?? FEMALE_COLOR;

  // ── Validation guards ──────────────────────────────────────────────────────
  warnIf(
    data.cohorts.length > 22,
    "PopulationPyramid",
    "PopulationPyramid: more than 22 age cohorts will compress row height below readability; standard is 5-year groups up to 80+"
  );
  warnIf(
    data.variant === "morph" && !data.cohortsB,
    "PopulationPyramid",
    "PopulationPyramid: morph variant requires cohortsB"
  );
  warnIf(
    data.variant === "comparison" && (!data.left || !data.right),
    "PopulationPyramid",
    "PopulationPyramid: comparison variant requires left and right"
  );

  // ── Memoized layout computations ───────────────────────────────────────────
  const area = useMemo(() => contentArea("content", "generous"), []);

  const highlightSet = useMemo(
    () => new Set<string>(data.highlightAgeGroups ?? []),
    [data.highlightAgeGroups]
  );

  const allCohorts = useMemo(() => {
    const sets: PyramidCohort[][] = [data.cohorts];
    if (data.cohortsB) sets.push(data.cohortsB);
    if (data.left?.cohorts) sets.push(data.left.cohorts);
    if (data.right?.cohorts) sets.push(data.right.cohorts);
    return sets.flat();
  }, [data.cohorts, data.cohortsB, data.left, data.right]);

  const computedMax = useMemo(() => {
    if (data.maxValue) return data.maxValue;
    const maxMale = Math.max(...allCohorts.map((c) => c.male));
    const maxFemale = Math.max(...allCohorts.map((c) => c.female));
    const raw = Math.max(maxMale, maxFemale);
    // Nice round ceiling: round up to nearest "nice" value
    const mag = Math.pow(10, Math.floor(Math.log10(raw)));
    return Math.ceil(raw / mag) * mag;
  }, [allCohorts, data.maxValue]);

  const unit = data.unit ?? "";

  // ── Timing ────────────────────────────────────────────────────────────────
  const holdAfterRevealSec = data.holdAfterRevealSec ?? 1;
  const numCohorts = data.cohorts.length;
  // Entrance finishes when last cohort's bar is done growing
  const entranceEndFrame = stagger(numCohorts - 1, sec(0.04)) + sec(0.5) + sec(0.3);
  const holdEndFrame = entranceEndFrame + sec(holdAfterRevealSec);

  // Morph phase (only for "morph" variant)
  const morphStartFrame = holdEndFrame;
  const morphDuration = sec(0.8);
  const morphProgress = data.variant === "morph"
    ? interpolate(
        frame,
        [morphStartFrame, morphStartFrame + morphDuration],
        [0, 1],
        CLAMP_CUBIC
      )
    : 0;

  // ── Pyramid dimensions ────────────────────────────────────────────────────
  const pyramidHeight = area.height - 56 - 20; // subtract legend header + scale tick footer

  // Single / morph: use most of chart width
  const singlePyramidWidth = area.width;

  // Comparison: two pyramids with gap
  const compGap = layout.spacing.xl;
  const compPyramidWidth = (area.width - compGap) / 2;

  // J10: use first syncPoint frame (if any) to anchor bar reveal onset
  // D17 anticipatory reveal: first bar settled when narrator names it.
  const firstSyncFrame = direction.syncPoints?.[0]?.frame;
  const entranceBase = firstSyncFrame != null
    ? anticipatoryStartFrame(firstSyncFrame, sec(0.4))
    : 0; // existing default


  return (
    <Background
      variant={variant}
      tint={direction.backgroundTint}
      atmosphere={direction.atmosphere}
      atmosphereIntensity={direction.atmosphereIntensity}
    >
      <AbsoluteFill style={compStyle}>
        <HeaderStrip metadata={data.episode} mode={variant} />
        <FooterStrip scale={unit ? `UNIT · ${unit}` : undefined} mode={variant} />

        <TitleBlock
          title={data.title}
          subtitle={data.subtitle}
          safeAreaTier="generous"
        />

        {/* ── Single / Morph variant ──────────────────────────────────────── */}
        {(data.variant === "single" || data.variant === "morph") && (
          <div
            style={{
              position: "absolute",
              top: area.top + 28,   // 28px for legend above pyramid
              left: area.left,
              width: singlePyramidWidth,
            }}
          >
            {/* Year label (morph only) */}
            {data.variant === "morph" && (
              <YearLabel
                labelA={data.labelA}
                labelB={data.labelB}
                morphProgress={morphProgress}
                frame={frame}
                morphStartFrame={morphStartFrame}
                mode={variant}
              />
            )}

            <SinglePyramid
              cohorts={data.cohorts}
              maxVal={computedMax}
              totalWidth={singlePyramidWidth}
              totalHeight={pyramidHeight}
              frame={frame}
              highlightAgeGroups={highlightSet}
              entranceOffset={entranceBase}
              showLegend
              maleColor={maleBarColor}
              femaleColor={femaleBarColor}
              morphCohorts={data.variant === "morph" ? data.cohortsB : undefined}
              morphProgress={morphProgress}
              mode={variant}
            />

            <ScaleTick
              maxVal={computedMax}
              halfWidth={(singlePyramidWidth - 88) / 2}
              unit={unit}
              frame={frame}
              mode={variant}
            />

            {/* L3: Median age dashed indicator line */}
            {data.medianAge !== undefined && (() => {
              // Map medianAge to Y position within pyramidHeight.
              // cohorts are ordered youngest→oldest; estimate age from ageGroup index.
              const numC = data.cohorts.length;
              const rowH = pyramidHeight / Math.max(numC, 1);
              // Find the cohort whose index best represents the medianAge.
              // Use linear interpolation across [0, numC-1] assuming standard 5-yr groups.
              // Parse the start age of each cohort from ageGroup text (e.g. "20–24" → 20).
              const parseStartAge = (g: string): number => {
                const m = /^(\d+)/.exec(g);
                return m ? parseInt(m[1], 10) : 0;
              };
              const ages = data.cohorts.map((c) => parseStartAge(c.ageGroup));
              const ageMin = ages[0] ?? 0;
              const ageMax = (ages[ages.length - 1] ?? (numC - 1) * 5) + 5;
              // Clamp medianAge to [ageMin, ageMax]
              const clamped = Math.max(ageMin, Math.min(data.medianAge, ageMax));
              // Y from top: fraction of height
              const fracFromTop = (clamped - ageMin) / Math.max(ageMax - ageMin, 1);
              const medianY = fracFromTop * pyramidHeight + rowH * 0.5;
              // Fade in after bars finish, then hold
              const medianOpacity = fadeIn(frame, entranceEndFrame + sec(0.3), sec(0.5));

              return (
                <div
                  style={{
                    position: "absolute",
                    top: medianY,
                    left: 0,
                    width: singlePyramidWidth,
                    pointerEvents: "none",
                    opacity: medianOpacity,
                  }}
                >
                  {/* Dashed line spanning full pyramid width */}
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: singlePyramidWidth,
                      height: 0,
                      borderTop: `1px dashed ${palette.amber}99`,
                    }}
                  />
                  {/* Label at right end */}
                  <div
                    style={{
                      position: "absolute",
                      top: 3,
                      right: 0,
                      fontSize: fontSizes.meta,
                      fontFamily: fonts.mono,
                      color: palette.amber,
                      letterSpacing: 0.5,
                      whiteSpace: "nowrap",
                      lineHeight: 1,
                    }}
                  >
                    {`Median age: ${data.medianAge}`}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* ── Comparison variant ──────────────────────────────────────────── */}
        {data.variant === "comparison" && data.left && data.right && (
          <div
            style={{
              position: "absolute",
              top: area.top + 28,
              left: area.left,
              width: area.width,
            }}
          >
            {/* Left pyramid */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: compPyramidWidth,
              }}
            >
              {/* Left country label */}
              <div
                style={{
                  textAlign: "center",
                  fontSize: fontSizes.label,
                  fontFamily: fonts.metadata,
                  fontWeight: 700,
                  color: data.left.color ?? MALE_COLOR,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                  marginBottom: layout.spacing.xs,
                  opacity: fadeIn(frame, 0, sec(0.5)),
                  textShadow: shadows.textLift,
                }}
              >
                {data.left.label}
              </div>
              <SinglePyramid
                cohorts={data.left.cohorts}
                maxVal={computedMax}
                totalWidth={compPyramidWidth}
                totalHeight={pyramidHeight}
                frame={frame}
                highlightAgeGroups={highlightSet}
                entranceOffset={entranceBase}
                maleColor={data.left.color ?? maleBarColor}
                femaleColor={data.left.color ?? femaleBarColor}
                showLegend
                mode={variant}
              />
            </div>

            {/* Center divider */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: compPyramidWidth + compGap / 2 - 0.5,
                width: 1,
                height: pyramidHeight,
                background: `linear-gradient(180deg, transparent 0%, ${palette.umber}30 20%, ${palette.umber}30 80%, transparent 100%)`,
                opacity: interpolate(frame, [sec(0.5), sec(0.9)], [0, 1], CLAMP_SINE),
              }}
            />

            {/* Right pyramid */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: compPyramidWidth + compGap,
                width: compPyramidWidth,
              }}
            >
              {/* Right country label */}
              <div
                style={{
                  textAlign: "center",
                  fontSize: fontSizes.label,
                  fontFamily: fonts.metadata,
                  fontWeight: 700,
                  color: data.right.color ?? FEMALE_COLOR,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                  marginBottom: layout.spacing.xs,
                  opacity: fadeIn(frame, sec(0.2), sec(0.5)),
                  textShadow: shadows.textLift,
                }}
              >
                {data.right.label}
              </div>
              <SinglePyramid
                cohorts={data.right.cohorts}
                maxVal={computedMax}
                totalWidth={compPyramidWidth}
                totalHeight={pyramidHeight}
                frame={frame}
                highlightAgeGroups={highlightSet}
                entranceOffset={entranceBase + sec(0.2)}
                maleColor={data.right.color ?? maleBarColor}
                femaleColor={data.right.color ?? femaleBarColor}
                showLegend={false}
                mode={variant}
              />
            </div>
          </div>
        )}

        <SourceAttribution
          source={data.source}
          mode={variant}
          prefix="Source: "
          startSec={2}
        />
      </AbsoluteFill>
    </Background>
  );
};
