/**
 * CountUpDisplay — animated counter with spring snap and locale-aware formatting.
 *
 * Combines countUpValue() animation with DataLabel display into a single
 * component. Handles the full lifecycle: delay → count up → overshoot → settle.
 *
 * Usage:
 *   <CountUpDisplay to={92} unit="%" startFrame={sec(1)} duration={sec(1.2)} theme={theme} />
 *   <CountUpDisplay to={165e9} prefix="$" compact startFrame={sec(0.8)} duration={sec(1)} theme={theme} emphasis />
 */

import React from "react";
import { useCurrentFrame } from "remotion";
import { fonts, fontSizes, fontWeights, shadows as themeShadows } from "../design/theme";
import { countUpValue, formatValue } from "../utils/countUp";
import { fadeIn, pulse } from "../utils/animation";
import type { ThemeTokens } from "../hooks/useThemeMode";

interface CountUpDisplayProps {
  /** Target value */
  to: number;
  /** Start value (default: 0) */
  from?: number;
  /** Frame when counting starts */
  startFrame: number;
  /** Count-up duration in frames */
  duration: number;
  /** Unit suffix */
  unit?: string;
  /** Prefix string (e.g., "$") */
  prefix?: string;
  /** Use compact notation */
  compact?: boolean;
  /** Multiply by 100 and add % */
  asPercent?: boolean;
  /** Decimal places */
  decimals?: number;
  /** Add thousands separators */
  commas?: boolean;
  /** Overshoot amount (0-0.1). Default: 0 for normal, 0.04 for emphasis */
  overshoot?: number;
  /** Theme tokens */
  theme: ThemeTokens;
  /** Hero styling */
  emphasis?: boolean;
  /** Color override */
  color?: string;
  /** Add subtle scale pulse after count-up finishes */
  pulseOnComplete?: boolean;
  /** Additional inline styles */
  style?: React.CSSProperties;
}

export const CountUpDisplay: React.FC<CountUpDisplayProps> = React.memo(({
  to,
  from = 0,
  startFrame,
  duration,
  unit,
  prefix,
  compact = false,
  asPercent = false,
  decimals = 0,
  commas = false,
  overshoot,
  theme,
  emphasis = false,
  color,
  pulseOnComplete = false,
  style,
}) => {
  const frame = useCurrentFrame();

  // Compute the animated value
  const currentValue = countUpValue({
    from,
    to,
    startFrame,
    duration,
    frame,
    overshoot: overshoot ?? (emphasis ? 0.04 : 0),
  });

  // Format for display
  const formatted = formatValue(currentValue, {
    decimals,
    prefix,
    suffix: "",
    compact,
    asPercent,
    commas,
  });

  // Fade in
  const opacity = fadeIn(frame, startFrame, Math.min(duration, 10));

  // Optional pulse after count-up completes
  const completionPulse = pulseOnComplete
    ? pulse(frame, startFrame + duration, 9, emphasis ? 1.05 : 1.02)
    : 1.0;

  const effectiveColor = color || theme.text.primary;
  const effectiveShadow = emphasis
    ? `0 0 12px ${effectiveColor}60, ${themeShadows.textLift}`
    : themeShadows.textLift;

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
        transform: `scale(${completionPulse})`,
        transformOrigin: "center",
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
