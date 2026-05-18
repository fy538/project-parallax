/**
 * IsotypeChart — unit / icon chart.
 *
 * Quantities expressed as N repeated icons instead of bars, so abstract
 * numbers feel human-scale. "92 of 100 advanced chips come from one company"
 * expressed as 92 chip icons in amber and 8 in muted ink.
 *
 * Two variants:
 *   proportion  — single row showing highlighted/total ratio
 *   comparison  — multiple rows for side-by-side entity comparison
 *
 * References:
 *   - Otto Neurath's ISOTYPE (International System of Typographic Picture Education)
 *   - FT / Economist unit charts for human-scale quantities
 *   - NYT vaccine coverage charts (individual-unit format)
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
  fonts,
  fontSizes,
  fontWeights,
  layout,
  sec,
  shadows,
  contentArea,
  textMaxWidth,
} from "../../design/theme";
import { TitleBlock } from "../../components/TitleBlock";
import { SourceAttribution } from "../../components/SourceAttribution";
import { HeaderStrip } from "../../components/HeaderStrip";
import { FooterStrip } from "../../components/FooterStrip";
import { Background } from "../../components/Background";
import { useCompositionAnimation } from "../../hooks/useCompositionAnimation";
import { useDirection } from "../../hooks/useDirection";
import { useThemeMode } from "../../hooks/useThemeMode";
import { useEpisodeColorEmphasis } from "../../hooks/useEpisodeColorEmphasis";
import { fadeIn, exitFade, CLAMP_SINE } from "../../utils/animation";
import { warnIf } from "../../utils/dataWarnings";
import { ICON_PATHS, ICON_VIEWBOX } from "./icons";
import type { IsotypeChartData, IsotypeIconType } from "./types";

// ── IsotypeIcon sub-component ─────────────────────────────────────────────────

interface IsotypeIconProps {
  iconType: IsotypeIconType;
  size: number;
  color: string;
  opacity: number;
  scale: number; // for pop-in animation
}

const IsotypeIcon: React.FC<IsotypeIconProps> = React.memo(
  ({ iconType, size, color, opacity, scale }) => {
    const path = ICON_PATHS[iconType] ?? ICON_PATHS.circle;
    return (
      <svg
        width={size}
        height={size}
        viewBox={ICON_VIEWBOX}
        style={{
          display: "block",
          opacity,
          transform: `scale(${scale})`,
          transformOrigin: "center",
          transition: "none",
        }}
      >
        <path d={path} fill={color} />
      </svg>
    );
  }
);
IsotypeIcon.displayName = "IsotypeIcon";

// ── Partial icon (fractional clip-path) ──────────────────────────────────────
// Renders a single icon clipped to `fraction` of its width (e.g. 0.7 = 70%).
// Used when a value like 3.7 requires 3 full icons + one 70%-clipped partial.

interface PartialIsotypeIconProps {
  iconType: IsotypeIconType;
  size: number;
  color: string;
  opacity: number;
  scale: number;
  /** Fraction of the icon to show (0–1). e.g. 0.7 clips to 70% width. */
  fraction: number;
  /** Unique id used for the SVG clipPath element. */
  clipId: string;
}

const PartialIsotypeIcon: React.FC<PartialIsotypeIconProps> = React.memo(
  ({ iconType, size, color, opacity, scale, fraction, clipId }) => {
    const path = ICON_PATHS[iconType] ?? ICON_PATHS.circle;
    const VBOX = ICON_VIEWBOX; // e.g. "0 0 24 24"
    const vbParts = VBOX.split(" ").map(Number);
    const vbW = vbParts[2] ?? 24;
    const vbH = vbParts[3] ?? 24;
    return (
      <svg
        width={size}
        height={size}
        viewBox={VBOX}
        style={{
          display: "block",
          opacity,
          transform: `scale(${scale})`,
          transformOrigin: "center",
          transition: "none",
        }}
      >
        <defs>
          <clipPath id={clipId}>
            <rect x={0} y={0} width={vbW * fraction} height={vbH} />
          </clipPath>
        </defs>
        <path d={path} fill={color} clipPath={`url(#${clipId})`} />
      </svg>
    );
  }
);
PartialIsotypeIcon.displayName = "PartialIsotypeIcon";

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Compute icons-per-row for proportion variant. */
function computeIconsPerRow(total: number, override?: number): number {
  if (override !== undefined && override > 0) return override;
  return Math.min(total, Math.min(20, Math.ceil(Math.sqrt(total * 1.5))));
}

/** Count-up display from 0 → target, given a 0–1 progress. */
function countUp(target: number, progress: number): number {
  return Math.round(target * progress);
}

// ── Proportion variant ────────────────────────────────────────────────────────

interface ProportionGridProps {
  data: IsotypeChartData;
  frame: number;
  accentColor: string;
  theme: ReturnType<typeof useThemeMode>;
  exit: number;
}

const ProportionGrid: React.FC<ProportionGridProps> = ({
  data,
  frame,
  accentColor,
  theme,
  exit,
}) => {
  const total = data.total ?? 0;
  const highlighted = data.highlighted ?? 0;
  // L1: support fractional highlighted (e.g. 3.7 → 3 full + 1 partial at 70%)
  const fullHighlighted = Math.floor(highlighted);
  const partialFraction = highlighted % 1; // 0 = no partial icon
  const iconSize = data.iconSize ?? 36;
  const iconType = data.icon ?? "circle";
  const iconsPerRow = computeIconsPerRow(total, data.iconsPerRow);

  // Total duration for icon pop-in sequence
  // Each icon gets ~1 frame; give ~1.5 frames per icon so it doesn't
  // feel rushed, but cap total entrance at 4s
  const iconPopDuration = Math.min(sec(4), total * Math.max(1, Math.floor(sec(0.05))));
  const entranceEnd = sec(0.5) + iconPopDuration;

  // Muted ink color for non-highlighted icons — ink at 25% opacity
  const mutedColor = palette.ink + "40"; // 40hex = 25%

  // Icon gap
  const gap = 4;

  // Build icon list (full icons only — partial handled separately below)
  const icons = useMemo(
    () =>
      Array.from({ length: total }, (_, i) => {
        const isHighlighted = i < fullHighlighted;
        const popFrame = sec(0.5) + i * Math.max(1, Math.floor(sec(0.05)));
        const color = isHighlighted ? accentColor : mutedColor;
        return { i, isHighlighted, popFrame, color };
      }),
    [total, fullHighlighted, accentColor, mutedColor]
  );

  // Count-up progress — runs from sec(0.3) for annotation below grid
  const countProgress = interpolate(
    frame,
    [sec(0.3), sec(0.3) + sec(2)],
    [0, 1],
    CLAMP_SINE
  );

  // Unit label fades in after all icons have appeared
  const unitLabelOpacity = fadeIn(frame, entranceEnd + sec(0.2), sec(0.4)) * exit;

  // Annotation opacity (count label)
  const annotationOpacity = fadeIn(frame, sec(0.3), sec(0.5)) * exit;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: layout.spacing.lg,
      }}
    >
      {/* Icon grid */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap,
          maxWidth: iconsPerRow * (iconSize + gap) - gap,
          justifyContent: "flex-start",
        }}
      >
        {icons.map(({ i, popFrame, color }) => {
          const scale = interpolate(
            frame,
            [popFrame, popFrame + sec(0.15)],
            [0, 1],
            CLAMP_SINE
          );
          const opacity =
            interpolate(frame, [popFrame, popFrame + sec(0.2)], [0, 1], CLAMP_SINE) *
            exit;
          return (
            <IsotypeIcon
              key={i}
              iconType={iconType}
              size={iconSize}
              color={color}
              opacity={opacity}
              scale={scale}
            />
          );
        })}
        {/* L1: partial icon — clipped to `partialFraction` of width */}
        {partialFraction > 0 && (() => {
          const partialIdx = fullHighlighted;
          const popFrame = sec(0.5) + partialIdx * Math.max(1, Math.floor(sec(0.05)));
          const scale = interpolate(frame, [popFrame, popFrame + sec(0.15)], [0, 1], CLAMP_SINE);
          const opacity = interpolate(frame, [popFrame, popFrame + sec(0.2)], [0, 1], CLAMP_SINE) * exit;
          return (
            <PartialIsotypeIcon
              key="partial"
              iconType={iconType}
              size={iconSize}
              color={accentColor}
              opacity={opacity}
              scale={scale}
              fraction={partialFraction}
              clipId="proportion-partial-icon"
            />
          );
        })()}
      </div>

      {/* Proportion annotation: "92 of 100 — TSMC" */}
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: layout.spacing.sm,
          opacity: annotationOpacity,
        }}
      >
        {/* Highlighted count — bold accent */}
        <span
          style={{
            fontFamily: fonts.data,
            fontSize: fontSizes.h2,
            fontWeight: fontWeights.bold,
            color: accentColor,
            textShadow: shadows.textLift,
            lineHeight: 1,
            maxWidth: textMaxWidth.label,
          }}
        >
          {countUp(highlighted, countProgress)}
        </span>

        {/* "of" connector */}
        <span
          style={{
            fontFamily: fonts.body,
            fontSize: fontSizes.body,
            color: theme.text.secondary,
            lineHeight: 1,
            maxWidth: textMaxWidth.label,
          }}
        >
          of
        </span>

        {/* Total */}
        <span
          style={{
            fontFamily: fonts.data,
            fontSize: fontSizes.h3,
            fontWeight: fontWeights.medium,
            color: theme.text.secondary,
            textShadow: shadows.textLift,
            lineHeight: 1,
            maxWidth: textMaxWidth.label,
          }}
        >
          {total}
        </span>

        {/* Optional highlight label */}
        {data.highlightLabel && (
          <span
            style={{
              fontFamily: fonts.metadata,
              fontSize: fontSizes.label,
              fontWeight: fontWeights.semibold,
              color: accentColor,
              letterSpacing: 1,
              lineHeight: 1,
              textTransform: "uppercase" as const,
            }}
          >
            {data.highlightLabel}
          </span>
        )}

        {/* Optional total label */}
        {data.totalLabel && (
          <span
            style={{
              fontFamily: fonts.body,
              fontSize: fontSizes.label,
              color: theme.text.muted,
              lineHeight: 1,
            }}
          >
            {data.totalLabel}
          </span>
        )}
      </div>

      {/* Unit label */}
      {data.unitLabel && (
        <div
          style={{
            fontFamily: fonts.metadata,
            fontSize: fontSizes.caption,
            color: theme.text.muted,
            letterSpacing: 0.5,
            opacity: unitLabelOpacity,
            textAlign: "center",
          }}
        >
          {data.unitLabel}
        </div>
      )}
    </div>
  );
};

// ── Comparison variant ────────────────────────────────────────────────────────

interface ComparisonRowProps {
  row: NonNullable<IsotypeChartData["rows"]>[number];
  defaultIcon: IsotypeIconType;
  defaultAccentColor: string;
  iconSize: number;
  rowIndex: number;
  frame: number;
  exit: number;
  theme: ReturnType<typeof useThemeMode>;
}

const ComparisonRow: React.FC<ComparisonRowProps> = React.memo(({
  row,
  defaultIcon,
  defaultAccentColor,
  iconSize,
  rowIndex,
  frame,
  exit,
  theme,
}) => {
  const rowStartFrame = sec(0.3) + rowIndex * sec(0.3);
  const iconType = row.icon ?? defaultIcon;
  const accentColor = row.color ?? defaultAccentColor;
  const mutedColor = row.mutedColor ?? palette.ink + "40";
  const gap = 3;

  const icons = useMemo(
    () =>
      Array.from({ length: row.total }, (_, i) => {
        const isHighlighted = i < row.highlighted;
        const popFrame = rowStartFrame + i * Math.max(1, Math.floor(sec(0.04)));
        const color = isHighlighted ? accentColor : mutedColor;
        return { i, isHighlighted, popFrame, color };
      }),
    [row.total, row.highlighted, accentColor, mutedColor, rowStartFrame]
  );

  const rowOpacity = fadeIn(frame, rowStartFrame, sec(0.3)) * exit;
  const countOpacity = fadeIn(frame, rowStartFrame + sec(0.2), sec(0.3)) * exit;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: layout.spacing.lg,
        opacity: rowOpacity,
      }}
    >
      {/* Row label */}
      <div
        style={{
          width: 200,
          flexShrink: 0,
          fontFamily: fonts.body,
          fontSize: fontSizes.label,
          color: theme.text.secondary,
          textAlign: "right",
        }}
      >
        {row.label}
      </div>

      {/* Icon strip */}
      <div
        style={{
          display: "flex",
          flexWrap: "nowrap",
          gap,
          flex: 1,
          overflow: "hidden",
        }}
      >
        {icons.map(({ i, popFrame, color }) => {
          const scale = interpolate(
            frame,
            [popFrame, popFrame + sec(0.12)],
            [0, 1],
            CLAMP_SINE
          );
          const iconOpacity =
            interpolate(
              frame,
              [popFrame, popFrame + sec(0.15)],
              [0, 1],
              CLAMP_SINE
            ) * exit;
          return (
            <IsotypeIcon
              key={i}
              iconType={iconType}
              size={iconSize}
              color={color}
              opacity={iconOpacity}
              scale={scale}
            />
          );
        })}
      </div>

      {/* Count label */}
      <div
        style={{
          flexShrink: 0,
          fontFamily: fonts.data,
          fontSize: fontSizes.label,
          fontWeight: fontWeights.semibold,
          color: accentColor,
          opacity: countOpacity,
          minWidth: 60,
          textAlign: "right",
        }}
      >
        {row.highlighted}/{row.total}
      </div>
    </div>
  );
});
ComparisonRow.displayName = "ComparisonRow";

// ── Main component ────────────────────────────────────────────────────────────

export const IsotypeChart: React.FC<{ data: IsotypeChartData }> = ({ data }) => {
  // ── Guards ────────────────────────────────────────────────────────────────
  warnIf(
    (data.total ?? 0) > 200,
    "IsotypeChart",
    "IsotypeChart: >200 icons will be illegible at video resolution; consider iconsPerRow=20 and iconSize=24 for dense grids, or reduce total"
  );
  warnIf(
    data.variant === "proportion" &&
      data.highlighted !== undefined &&
      data.total !== undefined &&
      data.highlighted > data.total,
    "IsotypeChart",
    "IsotypeChart: highlighted count exceeds total"
  );
  warnIf(
    data.variant === "comparison" && (!data.rows || data.rows.length === 0),
    "IsotypeChart",
    "IsotypeChart: comparison variant requires rows array"
  );

  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const theme = useThemeMode();
  const direction = useDirection(data._direction);
  const { style: compStyle } = useCompositionAnimation(direction.driftOptions);
  const episodeEmphasis = useEpisodeColorEmphasis();

  // Accent color — resolved from episode color emphasis (falls back to gold/amber)
  const accentColor = episodeEmphasis.primaryAccent;

  // Exit fade
  const exit = exitFade(frame, durationInFrames, sec(1));

  // Content area
  const area = contentArea("content", "generous");

  // Resolved icon type
  const iconType: IsotypeIconType = data.icon ?? "circle";
  const iconSize = data.iconSize ?? 36;

  return (
    <Background
      variant="light"
      tint={direction.backgroundTint}
      atmosphere={direction.atmosphere}
      atmosphereIntensity={direction.atmosphereIntensity}
    >
      <AbsoluteFill style={compStyle}>
        {/* Brand strips */}
        <HeaderStrip mode="light" />
        <FooterStrip mode="light" />

        {/* Title */}
        <TitleBlock
          title={data.title}
          subtitle={data.subtitle}
          mode="light"
          safeAreaTier="generous"
        />

        {/* Content area */}
        <div
          style={{
            position: "absolute",
            top: area.top,
            left: area.left,
            width: area.width,
            height: area.height,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {data.variant === "proportion" && (
            <ProportionGrid
              data={data}
              frame={frame}
              accentColor={accentColor}
              theme={theme}
              exit={exit}
            />
          )}

          {data.variant === "comparison" && data.rows && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: layout.spacing.lg,
                width: "100%",
              }}
            >
              {data.rows.map((row, i) => (
                <ComparisonRow
                  key={i}
                  row={row}
                  defaultIcon={iconType}
                  defaultAccentColor={accentColor}
                  iconSize={iconSize}
                  rowIndex={i}
                  frame={frame}
                  exit={exit}
                  theme={theme}
                />
              ))}
            </div>
          )}
        </div>

        {/* Source attribution */}
        <SourceAttribution source={data.source} mode="light" />
      </AbsoluteFill>
    </Background>
  );
};
