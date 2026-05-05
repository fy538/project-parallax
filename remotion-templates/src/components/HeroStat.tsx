/**
 * HeroStat — atomic component for "the big number" that anchors a chart.
 *
 * Used by StatReveal (main hero), TimeSeriesChart (corner stat),
 * BayesianUpdate (probability display), DataChart (highlighted bar value),
 * and ProbabilityGauge (gauge readout). Each currently renders this
 * pattern inline with slightly different choices — same shape, varying
 * decisions on type scale, count-up animation, color treatment.
 *
 * This component locks down the conventions:
 *   - Display-size number, mono family, semibold weight
 *   - Color from accent or override
 *   - Optional count-up animation tied to a startFrame
 *   - Subtle text-shadow halo so the number reads on busy backgrounds
 *   - Optional prefix ("$") and suffix ("%", "B") at smaller scale
 *   - Optional context label below in caption type
 *
 * Adopt incrementally — find inline `<div>{count}<span>%</span></div>`
 * patterns in templates and replace.
 */

import React from "react";
import { useCurrentFrame } from "remotion";
import {
  fonts,
  fontSizes,
  fontWeights,
  letterSpacing,
  sec,
  shadows,
  type Mode,
} from "../design/theme";
import { useThemeMode } from "../hooks/useThemeMode";
import { countUpValue } from "../utils/countUp";
import { formatNumber } from "../utils/numberFormat";

interface HeroStatProps {
  /** The numeric value to display */
  value: number;
  /** Prefix rendered at smaller scale before the number, e.g. "$", "+" */
  prefix?: string;
  /** Suffix rendered at smaller scale after the number, e.g. "%", "B", " mph" */
  suffix?: string;
  /** Decimal places (default: 0) */
  decimals?: number;
  /** Optional context label rendered below the number */
  label?: string;
  /** Frame to start the count-up animation. Set to false to skip count-up. */
  countUpFrom?: number | false;
  /** Duration of count-up animation in seconds. Default 0.6. */
  countUpDuration?: number;
  /** Color of the number. Defaults to the theme's accent color. */
  color?: string;
  /** Background variant — for label color. Default "light". */
  mode?: Mode;
  /**
   * Number style. "abbreviated" turns 1500000 into "1.5M". Default "decimal".
   */
  style?: "decimal" | "abbreviated" | "percent";
  /** Override the number's font size. Default fontSizes.display (96px). */
  fontSize?: number;
  /**
   * Skip the text-shadow halo. Use when the stat sits on a clean
   * paper background and the halo competes visually.
   */
  noHalo?: boolean;
}

export const HeroStat: React.FC<HeroStatProps> = ({
  value,
  prefix,
  suffix,
  decimals = 0,
  label,
  countUpFrom = 0,
  countUpDuration = 0.6,
  color,
  mode = "light",
  style = "decimal",
  fontSize,
  noHalo = false,
}) => {
  const frame = useCurrentFrame();
  const theme = useThemeMode(mode);
  const accent = color ?? theme.accent;

  const displayValue =
    countUpFrom === false
      ? value
      : countUpValue({
          to: value,
          startFrame: countUpFrom,
          duration: sec(countUpDuration),
          frame,
        });

  const numberSize = fontSize ?? fontSizes.display;
  const affixSize = numberSize * 0.42;

  const formatted = formatNumber(displayValue, { decimals, style });

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: 8,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 4,
          fontFamily: fonts.data,
          fontWeight: fontWeights.bold,
          color: accent,
          lineHeight: 1,
          textShadow: noHalo ? "none" : `0 0 24px ${accent}40, ${shadows.textLift}`,
        }}
      >
        {prefix && (
          <span style={{ fontSize: affixSize, fontWeight: fontWeights.semibold }}>
            {prefix}
          </span>
        )}
        <span style={{ fontSize: numberSize }}>{formatted}</span>
        {suffix && (
          <span style={{ fontSize: affixSize, fontWeight: fontWeights.semibold }}>
            {suffix}
          </span>
        )}
      </div>
      {label && (
        <div
          style={{
            fontSize: fontSizes.caption,
            fontFamily: fonts.body,
            color: theme.text.muted,
            letterSpacing: letterSpacing.caption,
            textShadow: noHalo ? "none" : shadows.textLift,
            textTransform: "uppercase",
            fontWeight: fontWeights.medium,
          }}
        >
          {label}
        </div>
      )}
    </div>
  );
};
