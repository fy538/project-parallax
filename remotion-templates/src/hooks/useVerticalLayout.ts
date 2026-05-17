/**
 * useVerticalLayout — layout tokens for 9:16 vertical (Shorts) compositions.
 *
 * Returns adapted spacing, font sizes, and content area dimensions
 * that map from 1920×1080 landscape to 1080×1920 vertical. Templates
 * that consume this hook can render in either orientation without
 * separate component files.
 *
 * The hook scales values proportionally: landscape safe area (80px on
 * 1920-wide) maps to 48px on 1080-wide, with larger vertical padding
 * to avoid mobile UI overlap (status bar, swipe zones).
 *
 * Usage:
 *   const vl = useVerticalLayout();
 *   <div style={{ top: vl.safeArea.top, fontSize: vl.fontSizes.h2 }}>
 *
 * Or conditionally:
 *   const isVertical = useVideoConfig().width < useVideoConfig().height;
 *   const vl = isVertical ? useVerticalLayout() : null;
 *   const fontSize = vl?.fontSizes.h2 ?? fontSizes.h2;
 */

// useMemo removed — VERTICAL_TOKENS is a module-level constant; no memoization needed.

export interface VerticalLayoutTokens {
  /** Canvas dimensions */
  width: 1080;
  height: 1920;
  fps: 30;

  /** Safe area — tighter horizontally, larger vertically for mobile UI */
  safeArea: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };

  /** Scaled font sizes — generally 10-20% larger for mobile readability */
  fontSizes: {
    display: number;
    h1: number;
    h2: number;
    h3: number;
    body: number;
    label: number;
    caption: number;
    meta: number;
  };

  /** Content area after safe area */
  contentArea: {
    top: number;
    left: number;
    width: number;
    height: number;
  };

  /** Title area — positioned to avoid status bar */
  titleTop: number;

  /** Content starts after title */
  contentTop: number;

  /** Spacing scale — 75% of landscape */
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };

  /** Max width for text blocks */
  textMaxWidth: {
    h1: number;
    h2: number;
    body: number;
    label: number;
  };
}

const VERTICAL_TOKENS: VerticalLayoutTokens = {
  width: 1080,
  height: 1920,
  fps: 30,

  safeArea: {
    top: 100,
    right: 48,
    bottom: 120,
    left: 48,
  },

  fontSizes: {
    display: 80, // 96 * 0.83
    h1: 56, // 64 * 0.875
    h2: 44, // 48 * 0.92
    h3: 32, // 36 * 0.89
    body: 24, // 22 * 1.09 — slightly larger for mobile
    label: 20, // 18 * 1.11
    caption: 16, // 14 * 1.14
    meta: 12, // 11 * 1.09
  },

  contentArea: {
    top: 320,
    left: 48,
    width: 1080 - 48 - 48, // 984
    height: 1920 - 320 - 120, // 1480
  },

  titleTop: 160,
  contentTop: 320,

  spacing: {
    xs: 8,
    sm: 12,
    md: 20,
    lg: 24,
    xl: 36,
    xxl: 48,
  },

  textMaxWidth: {
    h1: 900,
    h2: 800,
    body: 900,
    label: 500,
  },
};

/**
 * Returns vertical layout tokens for 9:16 Shorts compositions.
 * Values are memoized — safe to call every frame.
 */
export const useVerticalLayout = (): VerticalLayoutTokens => {
  return VERTICAL_TOKENS;
};
