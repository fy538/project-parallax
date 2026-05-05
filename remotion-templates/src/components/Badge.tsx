/**
 * Badge — Small bordered text pill for status, severity, categories.
 *
 * Renders a rounded container with:
 * - Color as background at 15% opacity
 * - Color as border at 30% opacity
 * - Color as text
 *
 * Usage:
 *   <Badge label="Crisis" color={palette.rust} theme={theme} />
 *   <Badge label="Stable" color={palette.amber} theme={theme} opacity={0.8} />
 */

import React from "react";
import { fontSizes, fonts, fontWeights, palette } from "../design/theme";
import { type ThemeTokens } from "../hooks/useThemeMode";

interface BadgeProps {
  /** Text content */
  label: string;
  /** Color override (default: palette.amber) */
  color?: string;
  /** Theme tokens for reference */
  theme: ThemeTokens;
  /** Opacity of the entire badge (default: 1) */
  opacity?: number;
  /** Additional inline styles */
  style?: React.CSSProperties;
}

/**
 * Convert hex color to RGB for opacity blending.
 */
const hexToRgba = (hex: string, alpha: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const Badge = React.memo<BadgeProps>(({
  label,
  color = palette.amber,
  theme,
  opacity = 1,
  style,
}) => (
  <div
    style={{
      display: "inline-block",
      paddingLeft: 12,
      paddingRight: 12,
      paddingTop: 6,
      paddingBottom: 6,
      borderRadius: 20,
      backgroundColor: hexToRgba(color, 0.15),
      border: `1px solid ${hexToRgba(color, 0.3)}`,
      color,
      fontFamily: fonts.body,
      fontSize: fontSizes.caption,
      fontWeight: fontWeights.medium,
      whiteSpace: "nowrap",
      opacity,
      lineHeight: 1.2,
      ...style,
    }}
  >
    {label}
  </div>
));

Badge.displayName = "Badge";
