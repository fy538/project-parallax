/**
 * DataLabel — consistent data value display with theme tokens.
 *
 * Extracts the common pattern of rendering a formatted number with
 * an optional unit suffix, styled according to the template's theme.
 * Handles emphasis (hero values), animation (fade-in), and formatting
 * (compact notation, prefix/suffix, percentages).
 *
 * Usage:
 *   <DataLabel value={92} unit="%" theme={theme} />
 *   <DataLabel value={165e9} unit="$" prefix compact theme={theme} emphasis />
 *   <DataLabel value={0.67} asPercent theme={theme} />
 */

import React from "react";
import { fonts, fontSizes, fontWeights, shadows as themeShadows } from "../design/theme";
import { formatValue } from "../utils/countUp";
import type { ThemeTokens } from "../hooks/useThemeMode";

interface DataLabelProps {
  /** The numeric value to display */
  value: number;
  /** Unit suffix (e.g., "%", "nm", "passes") */
  unit?: string;
  /** Prefix string (e.g., "$", "¥") */
  prefix?: string;
  /** Use compact notation (K, M, B, T) */
  compact?: boolean;
  /** Multiply by 100 and add % */
  asPercent?: boolean;
  /** Decimal places (default: 0) */
  decimals?: number;
  /** Add thousands separators */
  commas?: boolean;
  /** Theme tokens for color resolution */
  theme: ThemeTokens;
  /** Emphasis styling — larger text, optional glow */
  emphasis?: boolean;
  /** Override color (default: theme.text.primary, or color when emphasis) */
  color?: string;
  /** Opacity (default: 1) — wire to fadeIn for animated reveal */
  opacity?: number;
  /** Text shadow override */
  textShadow?: string;
  /** Additional inline styles */
  style?: React.CSSProperties;
}

export const DataLabel: React.FC<DataLabelProps> = React.memo(({
  value,
  unit,
  prefix,
  compact = false,
  asPercent = false,
  decimals = 0,
  commas = false,
  theme,
  emphasis = false,
  color,
  opacity = 1,
  textShadow,
  style,
}) => {
  const formatted = formatValue(value, {
    decimals,
    prefix,
    suffix: "", // unit rendered separately for styling
    compact,
    asPercent,
    commas,
  });

  const effectiveColor = color || (emphasis ? theme.text.primary : theme.text.primary);
  const effectiveShadow = textShadow || (emphasis
    ? `0 0 12px ${color || theme.text.primary}60, ${themeShadows.textLift}`
    : themeShadows.textLift);

  return (
    <div
      style={{
        fontSize: emphasis ? fontSizes.h2 : fontSizes.h3,
        fontWeight: emphasis ? fontWeights.bold : fontWeights.semibold,
        color: effectiveColor,
        fontFamily: fonts.mono,
        textAlign: "center",
        opacity,
        textShadow: effectiveShadow,
        lineHeight: 1,
        ...style,
      }}
    >
      {formatted}
      {unit && (
        <span
          style={{
            fontSize: fontSizes.caption,
            color: theme.text.muted,
            fontWeight: fontWeights.medium,
          }}
        >
          {unit}
        </span>
      )}
    </div>
  );
});
