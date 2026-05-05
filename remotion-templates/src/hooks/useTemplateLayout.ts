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
 */

import { useMemo } from "react";
import { layout, titleHeight } from "../design/theme";

// ── Types ──────────────────────────────────────────────────────────────────

type TitleVariant = keyof typeof titleHeight | "none" | "custom";
type SafeAreaTier = keyof typeof layout.safeAreaTier;

interface TemplateLayoutOptions {
  /** Title variant — determines how much vertical space the title zone takes.
   *  "content" (default) = h2 + subtitle (92px).
   *  "minimal" = single-line h3 (56px).
   *  "episode" = full episode title block (220px).
   *  "section" = section title (160px).
   *  "none" = no title zone, content starts at safe area top.
   *  "custom" = use customTitleHeight. */
  title?: TitleVariant;

  /** Custom title height in px. Only used when title="custom".
   *  Compute from your actual title: Math.ceil(fontSize * lineHeight). */
  customTitleHeight?: number;

  /** Safe area tier. Default: "standard" (80px). */
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

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
  /** Pixel distance from bottom edge of canvas to bottom edge of rect */
  bottom: number;
  /** Pixel distance from right edge of canvas to right edge of rect */
  right: number;
}

interface Zone {
  /** Ready-to-spread CSS: position absolute + top/left/width/height */
  style: React.CSSProperties;
  /** Raw numbers for when you need math (e.g., SVG coordinates) */
  rect: Rect;
}

interface TemplateLayoutResult {
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

// ── Helper: build a Zone from a Rect ──────────────────────────────────────

const makeZone = (rect: Rect): Zone => ({
  style: {
    position: "absolute" as const,
    top: rect.top,
    left: rect.left,
    width: rect.width,
    height: rect.height,
  },
  rect,
});

// ── Hook ──────────────────────────────────────────────────────────────────

export const useTemplateLayout = (
  options: TemplateLayoutOptions = {}
): TemplateLayoutResult => {
  const {
    title: titleVariant = "content",
    customTitleHeight,
    safeArea: safeAreaTier = "standard",
    split = false,
    splitGap = layout.spacing.xl,
    footerHeight = 40,
    titleContentGap = layout.spacing.xl,
    contentFooterGap = layout.spacing.md,
  } = options;

  return useMemo(() => {
    const safe = layout.safeAreaTier[safeAreaTier];
    const W = layout.width;
    const H = layout.height;

    // ── Title zone height ──────────────────────────────────────────────
    const titleH =
      titleVariant === "none"
        ? 0
        : titleVariant === "custom"
          ? (customTitleHeight ?? 92)
          : titleHeight[titleVariant];

    // ── Vertical zones ─────────────────────────────────────────────────
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

    // Content height: fills between content top and footer (with gap)
    const contentBottom = footerHeight > 0
      ? H - footerTop + contentFooterGap
      : safe.bottom;
    const contentHeight = H - contentTop - contentBottom;
    const contentWidth = W - safe.left - safe.right;

    // ── Build zones ────────────────────────────────────────────────────
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

    // ── Split zones (subdivide content horizontally) ───────────────────
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
        title: makeZone(titleRect),
        content: makeZone(contentRect),
        footer: makeZone(footerRect),
        left: makeZone(leftRect),
        right: makeZone(rightRect),
      },
      safe,
      canvas: { width: W, height: H },
    };
  }, [
    titleVariant,
    customTitleHeight,
    safeAreaTier,
    split,
    splitGap,
    footerHeight,
    titleContentGap,
    contentFooterGap,
  ]);
};
