/**
 * useTemplateLayout — zone-based layout system for templates.
 *
 * Replaces hand-computed absolute positioning with pre-computed zone rects.
 * Templates spread zone styles instead of writing `top: safeArea.top + spacing.xl`.
 *
 * WHY THIS EXISTS (L63):
 * Every template that manually computed element positions eventually had overlap
 * bugs — elements didn't account for preceding elements' rendered height.
 * This hook eliminates the entire class of bugs by computing zones from the
 * title variant and safe area tier, returning ready-to-spread style objects.
 *
 * FIVE ZONES:
 *   title    — top of frame, inside safe area. For TitleBlock or manual titles.
 *   content  — main content area below title. Largest zone.
 *   footer   — bottom strip for source attribution, context notes.
 *   left     — left half of content zone (for split layouts).
 *   right    — right half of content zone (for split layouts).
 *
 * USAGE (simple):
 *   const { zones } = useTemplateLayout({ title: "content" });
 *   return (
 *     <Background>
 *       <AbsoluteFill style={compStyle}>
 *         <TitleBlock title="..." style={zones.title.style} />
 *         <div style={zones.content.style}>
 *           {main content here}
 *         </div>
 *         <div style={zones.footer.style}>
 *           <SourceAttribution ... />
 *         </div>
 *       </AbsoluteFill>
 *     </Background>
 *   );
 *
 * USAGE (split):
 *   const { zones } = useTemplateLayout({ title: "content", split: true });
 *   return (
 *     <div style={zones.left.style}>{panel A}</div>
 *     <div style={zones.right.style}>{panel B}</div>
 *   );
 *
 * USAGE (custom title height — for h1 titles that aren't TitleBlock):
 *   const { zones } = useTemplateLayout({
 *     title: "custom",
 *     customTitleHeight: Math.ceil(fontSizes.h1 * lineHeight.h1),
 *   });
 *
 * Each zone exposes:
 *   - style: CSSProperties with position/top/left/width/height (spread directly)
 *   - rect: { top, left, width, height, bottom, right } raw numbers for math
 *
 * TESTABILITY:
 *   The geometry is also exported as `computeTemplateLayout()` — a pure function
 *   with no React dependency. Use it in unit tests to assert zone integrity
 *   without mounting a component or rendering a frame.
 *   See src/__tests__/template-zone-integrity.test.ts.
 */

import { useMemo } from "react";
import { layout, titleHeight } from "../design/theme";

// ── Types (exported for consumers and tests) ──────────────────────────────────

export type TitleVariant = keyof typeof titleHeight | "none" | "custom";
export type SafeAreaTier = keyof typeof layout.safeAreaTier;

export interface TemplateLayoutOptions {
  /** Title variant — determines how much vertical space the title zone takes.
   *  "content" (default) = h2 + subtitle, safe for 2-line titles (150px).
   *  "minimal" = single-line h3 (56px).
   *  "episode" = full episode title block (220px).
   *  "section" = section title (160px).
   *  "none" = no title zone, content starts at safe area top.
   *  "custom" = use customTitleHeight. */
  title?: TitleVariant;

  /** Custom title height in px. Only used when title="custom".
   *  Compute from your actual title: Math.ceil(fontSize * lineHeight). */
  customTitleHeight?: number;

  /** Safe area tier. Default: "generous" (120px). */
  safeArea?: SafeAreaTier;

  /** Enable split layout — adds left/right zones within content area.
   *  Default gap is layout.spacing.xl (48px). */
  split?: boolean;

  /** Gap between left/right split panels in px. Default: layout.spacing.xl (48). */
  splitGap?: number;

  /** Footer height in px. Reserves space at bottom for source/metadata.
   *  Default: 40 (enough for one line of caption text + breathing room).
   *  Set to 0 to give all bottom space to content. */
  footerHeight?: number;

  /** Gap between title zone bottom and content zone top.
   *  Default: layout.spacing.xl (48px). */
  titleContentGap?: number;

  /** Gap between content zone bottom and footer zone top.
   *  Default: layout.spacing.md (24px). */
  contentFooterGap?: number;
}

export interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
  /** Pixel distance from bottom edge of canvas to bottom edge of rect */
  bottom: number;
  /** Pixel distance from right edge of canvas to right edge of rect */
  right: number;
}

export interface Zone {
  /** Ready-to-spread CSS: position absolute + top/left/width/height */
  style: React.CSSProperties;
  /**
   * Like `style`, but also enables flex centering (both axes) + overflow:hidden.
   * Use this when you want your content centered inside the zone with no overflow.
   * Example: <div style={zones.content.centeredStyle}> centers chart/matrix/etc.
   */
  centeredStyle: React.CSSProperties;
  /** Raw numbers for when you need math (e.g., SVG coordinates) */
  rect: Rect;
}

export interface TemplateLayoutResult {
  zones: {
    /** Title zone — top of frame, full width within safe area */
    title: Zone;
    /** Content zone — main area below title, above footer */
    content: Zone;
    /** Footer zone — bottom strip for source attribution */
    footer: Zone;
    /** Left half of content zone (only meaningful if split=true) */
    left: Zone;
    /** Right half of content zone (only meaningful if split=true) */
    right: Zone;
  };
  /** The safe area insets used (for manual positioning that needs them) */
  safe: { top: number; right: number; bottom: number; left: number };
  /** Canvas dimensions (convenience) */
  canvas: { width: number; height: number };
}

// ── Internal helper: build a Zone from a Rect ─────────────────────────────────

const makeZone = (rect: Rect): Zone => ({
  style: {
    position: "absolute" as const,
    top: rect.top,
    left: rect.left,
    width: rect.width,
    height: rect.height,
  },
  centeredStyle: {
    position: "absolute" as const,
    top: rect.top,
    left: rect.left,
    width: rect.width,
    height: rect.height,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  rect,
});

// ── Pure computation (exported — testable without React) ──────────────────────

/**
 * Compute template layout zones from options. Pure function — no React, no hooks.
 *
 * This is the testable core behind `useTemplateLayout`. Call it directly in unit
 * tests to assert zone integrity (no overlaps, in bounds, usable height) without
 * mounting a component or launching a browser.
 *
 * See src/__tests__/template-zone-integrity.test.ts for the zone integrity suite.
 */
export function computeTemplateLayout(
  options: TemplateLayoutOptions = {}
): TemplateLayoutResult {
  const {
    title: titleVariant = "content",
    customTitleHeight,
    safeArea: safeAreaTier = "generous",
    split = false,
    splitGap = layout.spacing.xl,
    footerHeight = 40,
    titleContentGap = layout.spacing.xl,
    contentFooterGap = layout.spacing.md,
  } = options;

  const safe = layout.safeAreaTier[safeAreaTier];
  const W = layout.width;
  const H = layout.height;

  // ── Title zone height ─────────────────────────────────────────────────────
  const titleH =
    titleVariant === "none"
      ? 0
      : titleVariant === "custom"
        ? (customTitleHeight ?? 92)
        : titleHeight[titleVariant];

  // ── Vertical zones ────────────────────────────────────────────────────────
  // Title: starts at safe.top, height = titleH
  const titleTop = safe.top;
  const titleWidth = W - safe.left - safe.right;

  // Content: starts after title + gap
  const contentTop =
    titleVariant === "none"
      ? safe.top
      : titleTop + titleH + titleContentGap;

  // Footer: anchored to bottom safe area
  const footerBottom = safe.bottom;
  const footerTop = H - footerBottom - footerHeight;

  // Content height: fills between content top and footer (with gap).
  // contentBottom here is the distance from canvas bottom to content bottom edge.
  const contentBottom = footerHeight > 0
    ? H - footerTop + contentFooterGap
    : safe.bottom;
  const contentHeight = H - contentTop - contentBottom;
  const contentWidth = W - safe.left - safe.right;

  // ── Build zones ───────────────────────────────────────────────────────────
  const titleRect: Rect = {
    top: titleTop,
    left: safe.left,
    width: titleWidth,
    height: titleH,
    bottom: H - titleTop - titleH,
    right: safe.right,
  };

  const contentRect: Rect = {
    top: contentTop,
    left: safe.left,
    width: contentWidth,
    height: contentHeight,
    bottom: contentBottom,
    right: safe.right,
  };

  const footerRect: Rect = {
    top: footerTop,
    left: safe.left,
    width: contentWidth,
    height: footerHeight,
    bottom: footerBottom,
    right: safe.right,
  };

  // ── Split zones (subdivide content horizontally) ──────────────────────────
  const halfWidth = split
    ? Math.floor((contentWidth - splitGap) / 2)
    : contentWidth;

  const leftRect: Rect = {
    top: contentRect.top,
    left: safe.left,
    width: halfWidth,
    height: contentHeight,
    bottom: contentBottom,
    right: W - safe.left - halfWidth,
  };

  const rightRect: Rect = {
    top: contentRect.top,
    left: safe.left + halfWidth + splitGap,
    width: halfWidth,
    height: contentHeight,
    bottom: contentBottom,
    right: safe.right,
  };

  return {
    zones: {
      title:   makeZone(titleRect),
      content: makeZone(contentRect),
      footer:  makeZone(footerRect),
      left:    makeZone(leftRect),
      right:   makeZone(rightRect),
    },
    safe,
    canvas: { width: W, height: H },
  };
}

// ── Hook (thin wrapper over computeTemplateLayout) ────────────────────────────

export const useTemplateLayout = (
  options: TemplateLayoutOptions = {}
): TemplateLayoutResult => {
  const {
    title: titleVariant = "content",
    customTitleHeight,
    safeArea: safeAreaTier = "generous",
    split = false,
    splitGap = layout.spacing.xl,
    footerHeight = 40,
    titleContentGap = layout.spacing.xl,
    contentFooterGap = layout.spacing.md,
  } = options;

  return useMemo(
    () =>
      computeTemplateLayout({
        title: titleVariant,
        customTitleHeight,
        safeArea: safeAreaTier,
        split,
        splitGap,
        footerHeight,
        titleContentGap,
        contentFooterGap,
      }),
    [
      titleVariant,
      customTitleHeight,
      safeAreaTier,
      split,
      splitGap,
      footerHeight,
      titleContentGap,
      contentFooterGap,
    ]
  );
};
