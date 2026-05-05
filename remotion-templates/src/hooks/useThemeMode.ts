/**
 * useThemeMode — mode-aware color tokens.
 *
 * Takes a background variant ("dark" | "light") and returns the correct
 * text, accent, shadow, and background tokens for that mode. Templates
 * never reference `light.text.*` or `dark.text.*` directly — they get
 * mode-correct colors automatically.
 *
 * This prevents the #1 contrast bug: using light-mode text colors on a
 * dark background (or vice versa).
 *
 * Usage:
 *   const { text, accent, bg, shadow } = useThemeMode(data.backgroundVariant);
 *   <div style={{ color: text.primary }}>Always readable</div>
 *
 * POLISH.md L14: Use useThemeMode, never reference light.text.* or
 * dark.text.* directly in template code.
 */

import { useMemo } from "react";
import { light, dark, shadows, type Mode } from "../design/theme";

export interface ThemeTokens {
  /** Mode being used */
  mode: Mode;
  /** Whether current mode is dark */
  isDark: boolean;
  /** Text colors — primary, secondary, muted, accent */
  text: {
    primary: string;
    secondary: string;
    muted: string;
    accent: string;
  };
  /** Accent color (amber for dark, oxblood for light) */
  accent: string;
  /** Background surfaces — base, surface, elevated */
  bg: {
    base: string;
    surface: string;
    elevated: string;
  };
  /** Box shadow preset for content cards */
  shadow: string;
  /** Text shadow for readability on complex backgrounds */
  textShadow: string;
  /** Brand mark color (∴) */
  mark: string;
}

/**
 * Returns mode-aware design tokens.
 *
 * @param variant - "dark" or "light". Defaults to "light" (primary mode).
 */
export const useThemeMode = (variant?: Mode | string): ThemeTokens => {
  const mode: Mode = variant === "dark" ? "dark" : "light";

  return useMemo((): ThemeTokens => {
    const tokens = mode === "dark" ? dark : light;
    return {
      mode,
      isDark: mode === "dark",
      text: {
        primary: tokens.text.primary,
        secondary: tokens.text.secondary,
        muted: tokens.text.muted,
        accent: tokens.text.accent,
      },
      accent: tokens.accent,
      bg: {
        base: tokens.bg.base,
        surface: tokens.bg.surface,
        elevated: tokens.bg.elevated,
      },
      shadow: tokens.shadow,
      textShadow: shadows.textLift,
      mark: tokens.mark,
    };
  }, [mode]);
};
