/**
 * MapTitleFrame — title placement system for full-bleed map templates.
 *
 * Solves the title-overlapping-map problem for the 7 full-bleed map
 * templates (ChoroplethMap, AtlasPlate, RouteAnimation, ProportionalSymbolMap,
 * CartogramMap, DensityMap, TilegramUSMap). The generic <TitleBlock> assumes
 * content lives BELOW the title — but map content fills the canvas BEHIND
 * the title, producing the overlap diagnosed on May 13, 2026.
 *
 * Three placement modes:
 *
 *   "banner"     — Horizontal paper-color band at top (+ optional matching
 *                  bottom band for phase label / source). Map gets the
 *                  middle ~880px of the canvas. DEFAULT.
 *
 *   "cartouche"  — Inset paper-color rectangle ~600x100px in a corner.
 *                  Map fills the entire canvas behind it. Smart placement
 *                  picks the lowest-density corner for SVG maps.
 *
 *   "inline"     — Title sits where TitleBlock puts it today, with a heavy
 *                  paper-color text-stroke punching through map content.
 *                  Back-compat option for episodes already rendering OK.
 *
 * Banner-mode treatments:
 *
 *   "minimalist" — palette.paper fill, thin amber bottom rule. Default.
 *   "atlas"      — Slightly darker fill, amber rule + 0.5px ink hairline
 *                  below it (atlas-plate neatline convention).
 *   "masthead"   — Minimalist + right-aligned date/scope/note in mono.
 *
 * Brand-chrome integration:
 *   HeaderStrip lives INSIDE the top band; FooterStrip lives INSIDE the
 *   bottom band. The bands DON'T double-paint over HeaderStrip — the
 *   strip sits at safeArea.top (80px) inside a 100px-tall band.
 *
 * See diagnostic + design rationale: project-parallax conversation
 * history (May 13, 2026 visual diagnostic) + remotion-templates/LESSONS.md.
 */

import React, { useMemo } from "react";
import { useCurrentFrame, interpolate, Easing } from "remotion";
import { measureText } from "@remotion/layout-utils";
import {
  durations,
  fonts,
  fontSizes,
  fontWeights,
  letterSpacing,
  layout,
  palette,
  sec,
  textMaxWidth,
  shadows,
  type Mode,
} from "../design/theme";
import { useThemeMode } from "../hooks/useThemeMode";
import { useEpisodeColorEmphasis } from "../hooks/useEpisodeColorEmphasis";
import type { DirectionSyncPoint } from "../hooks/useDirection";
import { FadeIn } from "./FadeIn";
import { CLAMP, anticipatoryStartFrame } from "../utils/animation";

// ── Public types ────────────────────────────────────────────────────────────

export type MapTitleMode = "banner" | "cartouche" | "inline";
export type MapTitleTreatment = "minimalist" | "atlas" | "masthead";
export type CartouchePlacement =
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right"
  | "auto";

export interface MapTitleMasthead {
  /** Date or year range, e.g. "1949-1994". Rendered first in mono caps. */
  date?: string;
  /** Scope/extent, e.g. "17 NATIONS". Rendered as the dominant metadata cell. */
  scope?: string;
  /** Editorial note, e.g. "EXPORT CONTROLS". Rendered last. */
  note?: string;
}

/**
 * Map-title placement configuration. Attach to a map template's data as
 * `mapTitle?: MapTitleConfig`. Default `{ mode: "banner", treatment: "minimalist" }`
 * — solves the basic top-bar / bottom-bar overlap without authoring.
 */
export interface MapTitleConfig {
  /** Placement mode for the title block. Default: "banner". */
  mode?: MapTitleMode;
  /** banner: visual treatment. Default: "minimalist". */
  treatment?: MapTitleTreatment;
  /**
   * banner: render a matching bottom band for phase label / source caption.
   * Default: "auto" — present when the template feeds a footerCaption or
   * masthead.note. Pass `true`/`false` to force.
   */
  bottomBand?: boolean | "auto";
  /**
   * cartouche: which corner. "auto" = smart placement using country-centroid
   * density (SVG-based templates only). Mapbox-based templates fall back to
   * "top-left" + a warnIf when "auto" is requested.
   * Default: "top-left".
   */
  placement?: CartouchePlacement;
  /** masthead treatment metadata, right-aligned in the band. */
  masthead?: MapTitleMasthead;
}

// ── Layout constants ────────────────────────────────────────────────────────

/** Top/bottom band height in px. Map content gets canvas minus 2 × this. */
export const MAP_TITLE_BAND_HEIGHT = 100;
/** Cartouche box dimensions when inset from a corner. */
export const MAP_TITLE_CARTOUCHE_WIDTH = 600;
export const MAP_TITLE_CARTOUCHE_HEIGHT = 140;
/** Inset distance from the canvas edge for cartouche placement. */
export const MAP_TITLE_CARTOUCHE_INSET = 32;

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Linearly darken a hex color by `amt` (0..1) toward black. */
const darkenHex = (hex: string, amt = 0.05): string => {
  const m = hex.replace("#", "");
  const num = parseInt(m, 16);
  if (Number.isNaN(num)) return hex;
  const r = Math.max(0, Math.min(255, Math.round(((num >> 16) & 255) * (1 - amt))));
  const g = Math.max(0, Math.min(255, Math.round(((num >> 8) & 255) * (1 - amt))));
  const b = Math.max(0, Math.min(255, Math.round((num & 255) * (1 - amt))));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
};

/** Resolve the band's fill — minimalist matches canvas, atlas darkens distinctly. */
const bandFill = (treatment: MapTitleTreatment, mode: Mode): string => {
  const base = mode === "dark" ? palette.ink : palette.paper;
  if (treatment === "atlas" && mode === "light") {
    // Initially used palette.bone (the "slightly darker than paper" token),
    // but visual review (May 2026) showed the bone→paper delta was too
    // subtle when high-saturation country fills (USA blue, USSR red)
    // approached the band edge — the seam disappeared. Darken paper by
    // 8% so the band reads cleanly as a distinct strip against any map
    // substrate. Still well below taupe so the band doesn't feel like UI.
    return darkenHex(palette.paper, 0.08);
  }
  if (treatment === "atlas" && mode === "dark") {
    return darkenHex(palette.ink, 0.18);
  }
  return base;
};

/** Resolve the bottomBand "auto" choice. */
const resolveBottomBand = (
  setting: boolean | "auto" | undefined,
  hints: { hasSubtitle: boolean; hasFooterCaption: boolean; hasMastheadNote: boolean }
): boolean => {
  if (setting === true) return true;
  if (setting === false) return false;
  // "auto" — present when there's footer content to surface.
  return hints.hasSubtitle || hints.hasFooterCaption || hints.hasMastheadNote;
};

// ── Props ───────────────────────────────────────────────────────────────────

export interface MapTitleFrameProps {
  /** Main title text. */
  title: string;
  /** Optional subtitle below the title (banner: under title; cartouche: same). */
  subtitle?: string;
  /** Configuration. Defaults `{ mode: "banner", treatment: "minimalist" }`. */
  config?: MapTitleConfig;
  /** Map mode — drives band fill and text color. Default "light". */
  mode?: Mode | string;
  /** Override accent for the band's bottom-edge rule. Default amber. */
  accentColor?: string;
  /**
   * Title rendered LEFT of the bottom band (large, h3-style). Use for the
   * map's PHASE-VARYING label (e.g. "Group of Seven" / "Western signatories"
   * in AtlasPlate's multi-phase reveals). When set, also forces the bottom
   * band on (overrides `bottomBand: "auto"`).
   */
  footerTitle?: string;
  /**
   * Mono-caption supporting line under `footerTitle` (e.g. scope: "17 NATIONS,
   * NATO + JAPAN"). Renders in the same left block. Ignored when
   * `footerTitle` is empty.
   */
  footerSubtitle?: string;
  /** Caption to render in the bottom band, right side (e.g. source/scale). */
  footerCaption?: string;
  /**
   * Narration sync points (same semantics as TitleBlock.syncPoints). When
   * present, the entrance fires ~150ms before the narrator says the title.
   */
  syncPoints?: DirectionSyncPoint[];
  /** Skip the cinematic entrance animation. */
  noAnimation?: boolean;
  /**
   * Optional rendered cartouche corner. When `mapTitle.placement === "auto"`,
   * the parent template computes the corner via `resolveCartoucheCorner()`
   * and passes the result here so smart placement actually takes effect.
   * When omitted, falls back to `config.placement` or "top-left".
   */
  resolvedCartoucheCorner?: Exclude<CartouchePlacement, "auto">;
  /** Children placed in the top band, alongside the title (rare). */
  children?: React.ReactNode;
}

// ── Component ───────────────────────────────────────────────────────────────

export const MapTitleFrame: React.FC<MapTitleFrameProps> = ({
  title,
  subtitle,
  config,
  mode,
  accentColor,
  footerTitle,
  footerSubtitle,
  footerCaption,
  syncPoints,
  noAnimation = false,
  resolvedCartoucheCorner,
}) => {
  const theme = useThemeMode(mode);
  const frame = useCurrentFrame();
  const cfg: MapTitleConfig = config ?? {};
  const resolvedMode: Mode = mode === "dark" ? "dark" : "light";
  const resolvedTreatment: MapTitleTreatment = cfg.treatment ?? "minimalist";
  const resolvedModeName: MapTitleMode = cfg.mode ?? "banner";
  const accent =
    accentColor ?? (resolvedMode === "dark" ? palette.gold : palette.gold);
  const emphasis = useEpisodeColorEmphasis();
  const titleFontFamily = emphasis.displayFont ?? fonts.heading;

  // ── Effective start frame (anticipatory if syncPoints present) ────────────
  const effectiveStartFrame =
    syncPoints?.[0]?.frame !== undefined
      ? anticipatoryStartFrame(syncPoints[0].frame, durations.fadeIn)
      : 0;

  // ── Title font-size scaling (mirrors TitleBlock) ──────────────────────────
  const titleFontSize = useMemo(() => {
    // Different available width per mode: banner has the full canvas width
    // minus safe-area; cartouche is constrained to its inset box.
    const availableWidth =
      resolvedModeName === "cartouche"
        ? MAP_TITLE_CARTOUCHE_WIDTH - layout.spacing.lg * 2
        : Math.min(
            textMaxWidth.h2,
            layout.width - layout.safeArea.left - layout.safeArea.right
          );
    // banner & cartouche both use h3 (36px) as the target — bands are 100px
    // tall and need to fit title + optional subtitle. h2 (48px) would
    // overflow vertically.
    const targetSize =
      resolvedModeName === "inline" ? fontSizes.h2 : fontSizes.h3;
    const { width: measuredWidth } = measureText({
      text: title,
      fontFamily: titleFontFamily,
      fontSize: targetSize,
      fontWeight: fontWeights.semibold,
      letterSpacing: `${letterSpacing.h2}px`,
    });
    const scale = Math.min(1, availableWidth / Math.max(1, measuredWidth));
    const floor = resolvedModeName === "inline" ? fontSizes.h3 : 28;
    return Math.max(floor, targetSize * scale);
  }, [title, titleFontFamily, resolvedModeName]);

  const hasMastheadNote = Boolean(
    cfg.masthead?.note || cfg.masthead?.date || cfg.masthead?.scope
  );
  const bottomBand = resolveBottomBand(cfg.bottomBand, {
    hasSubtitle: Boolean(subtitle),
    hasFooterCaption:
      Boolean(footerCaption) ||
      Boolean(footerTitle) ||
      Boolean(footerSubtitle),
    hasMastheadNote: hasMastheadNote && resolvedTreatment === "masthead",
  });

  // ── Render: inline mode ───────────────────────────────────────────────────
  if (resolvedModeName === "inline") {
    return renderInline({
      title,
      subtitle,
      mode: resolvedMode,
      accent,
      theme,
      effectiveStartFrame,
      noAnimation,
      titleFontFamily,
    });
  }

  // ── Render: cartouche mode ────────────────────────────────────────────────
  if (resolvedModeName === "cartouche") {
    const corner: Exclude<CartouchePlacement, "auto"> =
      resolvedCartoucheCorner ??
      (cfg.placement && cfg.placement !== "auto" ? cfg.placement : "top-left");
    return renderCartouche({
      title,
      subtitle,
      mode: resolvedMode,
      accent,
      theme,
      effectiveStartFrame,
      noAnimation,
      titleFontFamily,
      titleFontSize,
      corner,
    });
  }

  // ── Render: banner mode (default) ─────────────────────────────────────────
  const fill = bandFill(resolvedTreatment, resolvedMode);
  const textColor = theme.text.primary;
  const subtitleColor = theme.text.muted;

  const topBand = (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: MAP_TITLE_BAND_HEIGHT,
        background: fill,
        // Amber rule along the bottom edge, then optional ink hairline for
        // the atlas treatment 4px below it (mimics atlas neatline).
        borderBottom: `1px solid ${accent}`,
        boxShadow:
          resolvedTreatment === "atlas"
            ? `0 4px 0 -3.5px ${palette.ink}` // 0.5px hairline 4px below the amber rule
            : "none",
        zIndex: 10,
      }}
    />
  );

  const bottomBandEl = bottomBand ? (
    <div
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: MAP_TITLE_BAND_HEIGHT,
        background: fill,
        borderTop: `1px solid ${accent}`,
        boxShadow:
          resolvedTreatment === "atlas"
            ? `0 -4px 0 -3.5px ${palette.ink}`
            : "none",
        zIndex: 10,
      }}
    />
  ) : null;

  // Title content sits INSIDE the top band, below the HeaderStrip baseline.
  // HeaderStrip lives at safeArea.top (80px), so we drop the title down by
  // ~30px from the safe-area top to clear it visually.
  const titleContent = (
    <div
      style={{
        position: "absolute",
        top: 28,
        left: layout.safeArea.left,
        right: layout.safeArea.right,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: layout.spacing.lg,
        zIndex: 11,
      }}
    >
      {/* Left: title + subtitle */}
      <div style={{ minWidth: 0, flex: 1 }}>
        <div
          style={{
            fontSize: titleFontSize,
            fontWeight: fontWeights.semibold,
            color: textColor,
            fontFamily: titleFontFamily,
            letterSpacing: letterSpacing.h2,
            lineHeight: 1.1,
            maxWidth: textMaxWidth.h2,
          }}
        >
          {title}
        </div>
        {subtitle && (
          <div
            style={{
              fontSize: fontSizes.label,
              color: subtitleColor,
              marginTop: 6,
              fontFamily: fonts.body,
              maxWidth: textMaxWidth.body,
            }}
          >
            {subtitle}
          </div>
        )}
      </div>

      {/* Right: masthead block (only for masthead treatment) */}
      {resolvedTreatment === "masthead" && hasMastheadNote && (
        <MastheadCell masthead={cfg.masthead!} mode={resolvedMode} />
      )}
    </div>
  );

  const hasBottomContent =
    bottomBand &&
    (Boolean(footerTitle) ||
      Boolean(footerSubtitle) ||
      Boolean(footerCaption));

  const bottomCaption = hasBottomContent ? (
    <div
      style={{
        position: "absolute",
        bottom: 28,
        left: layout.safeArea.left,
        right: layout.safeArea.right,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "space-between",
        gap: layout.spacing.lg,
        zIndex: 11,
        color: subtitleColor,
      }}
    >
      {/* LEFT: phase title (large) + scope subtitle (mono caption). When
          both are absent, render empty span to preserve the right-aligned
          caption's anchor via justify-content: space-between. */}
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {footerTitle && (
          <div
            style={{
              fontFamily: titleFontFamily,
              fontSize: fontSizes.h3,
              fontWeight: fontWeights.semibold,
              letterSpacing: `${letterSpacing.h3}px`,
              color: textColor,
              lineHeight: 1,
            }}
          >
            {footerTitle}
          </div>
        )}
        {footerSubtitle && (
          <div
            style={{
              fontFamily: fonts.metadata,
              fontSize: fontSizes.meta,
              letterSpacing: letterSpacing.meta,
              textTransform: "uppercase",
              color: subtitleColor,
            }}
          >
            {footerSubtitle}
          </div>
        )}
      </div>
      {/* RIGHT: source/scale caption — small, muted. */}
      {footerCaption && (
        <div
          style={{
            fontFamily: fonts.metadata,
            fontSize: fontSizes.meta,
            letterSpacing: letterSpacing.meta,
            textTransform: "uppercase",
            color: subtitleColor,
            textAlign: "right",
          }}
        >
          {footerCaption}
        </div>
      )}
    </div>
  ) : null;

  const bannerContent = (
    <>
      {topBand}
      {titleContent}
      {bottomBandEl}
      {bottomCaption}
    </>
  );

  if (noAnimation) return <>{bannerContent}</>;

  return (
    <FadeIn startFrame={effectiveStartFrame} direction="down" distance={16} cinematic>
      {bannerContent}
    </FadeIn>
  );
};

// ── Sub-renderers ───────────────────────────────────────────────────────────

interface InlineRenderArgs {
  title: string;
  subtitle?: string;
  mode: Mode;
  accent: string;
  theme: ReturnType<typeof useThemeMode>;
  effectiveStartFrame: number;
  noAnimation: boolean;
  titleFontFamily: string;
}

/**
 * Inline mode — back-compat. Title sits at TitleBlock's standard position
 * (generous safe area, top-left) with a heavy paper-colored text-stroke so
 * it punches through whatever map content is beneath it.
 */
function renderInline(args: InlineRenderArgs): React.ReactElement {
  const { title, subtitle, mode, theme, effectiveStartFrame, noAnimation, titleFontFamily } = args;
  const safe = layout.safeAreaTier.generous;
  const strokeColor = mode === "dark" ? palette.ink : palette.paper;
  const textColor = theme.text.primary;

  const content = (
    <div
      style={{
        position: "absolute",
        top: safe.top,
        left: safe.left,
        right: safe.right,
        zIndex: 11,
      }}
    >
      <div
        style={{
          fontSize: fontSizes.h2,
          fontWeight: fontWeights.semibold,
          color: textColor,
          fontFamily: titleFontFamily,
          letterSpacing: letterSpacing.h2,
          lineHeight: 1.1,
          maxWidth: textMaxWidth.h2,
          // Heavy paper-colored stroke ~6px + drop shadow so the title
          // "punches through" map content underneath.
          WebkitTextStroke: `6px ${strokeColor}`,
          paintOrder: "stroke fill",
          textShadow: `0 2px 6px ${strokeColor}`,
        }}
      >
        {title}
      </div>
      {subtitle && (
        <div
          style={{
            fontSize: fontSizes.body,
            color: theme.text.muted,
            marginTop: layout.spacing.xs,
            fontFamily: fonts.body,
            maxWidth: textMaxWidth.body,
            WebkitTextStroke: `3px ${strokeColor}`,
            paintOrder: "stroke fill",
            textShadow: `0 1px 4px ${strokeColor}`,
          }}
        >
          {subtitle}
        </div>
      )}
    </div>
  );

  if (noAnimation) return content;
  return (
    <FadeIn startFrame={effectiveStartFrame} direction="up" distance={20} cinematic>
      {content}
    </FadeIn>
  );
}

interface CartoucheRenderArgs {
  title: string;
  subtitle?: string;
  mode: Mode;
  accent: string;
  theme: ReturnType<typeof useThemeMode>;
  effectiveStartFrame: number;
  noAnimation: boolean;
  titleFontFamily: string;
  titleFontSize: number;
  corner: Exclude<CartouchePlacement, "auto">;
}

/**
 * Cartouche mode — inset paper-color rectangle in a corner; map fills the
 * canvas behind it. The cartouche has a subtle ink stroke and a thin amber
 * top rule (mirrors the banner-mode brand signature in miniature).
 */
function renderCartouche(args: CartoucheRenderArgs): React.ReactElement {
  const {
    title,
    subtitle,
    mode,
    accent,
    theme,
    effectiveStartFrame,
    noAnimation,
    titleFontFamily,
    titleFontSize,
    corner,
  } = args;
  const fill = mode === "dark" ? palette.ink : palette.paper;
  const borderColor = mode === "dark" ? palette.bone : palette.ink;
  const w = MAP_TITLE_CARTOUCHE_WIDTH;
  const h = MAP_TITLE_CARTOUCHE_HEIGHT;
  const inset = MAP_TITLE_CARTOUCHE_INSET;

  // Account for safeArea + brand-strip presence — the cartouche should sit
  // INSIDE the safe area so HeaderStrip / FooterStrip aren't covered.
  const top = corner.startsWith("top") ? inset + layout.safeArea.top - inset : undefined;
  const bottom = corner.startsWith("bottom") ? inset + layout.safeArea.bottom - inset : undefined;
  const left = corner.endsWith("left") ? inset + layout.safeArea.left - inset : undefined;
  const right = corner.endsWith("right") ? inset + layout.safeArea.right - inset : undefined;

  const content = (
    <div
      style={{
        position: "absolute",
        top,
        bottom,
        left,
        right,
        width: w,
        height: h,
        background: fill,
        border: `1px solid ${borderColor}33`, // subtle ~20% ink stroke
        borderTop: `1px solid ${accent}`, // amber accent rule along the top
        padding: `${layout.spacing.md}px ${layout.spacing.lg}px`,
        boxShadow: shadows.subtleLight,
        zIndex: 11,
      }}
    >
      <div
        style={{
          fontSize: titleFontSize,
          fontWeight: fontWeights.semibold,
          color: theme.text.primary,
          fontFamily: titleFontFamily,
          letterSpacing: letterSpacing.h2,
          lineHeight: 1.1,
          maxWidth: w - layout.spacing.lg * 2,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: subtitle ? "nowrap" : undefined,
        }}
      >
        {title}
      </div>
      {subtitle && (
        <div
          style={{
            marginTop: 6,
            fontSize: fontSizes.label,
            color: theme.text.muted,
            fontFamily: fonts.body,
            maxWidth: w - layout.spacing.lg * 2,
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {subtitle}
        </div>
      )}
    </div>
  );

  if (noAnimation) return content;
  // Cartouche enters from the corner it occupies — feels grounded.
  const direction = corner.startsWith("top") ? "down" : "up";
  return (
    <FadeIn startFrame={effectiveStartFrame} direction={direction} distance={12} cinematic>
      {content}
    </FadeIn>
  );
}

// ── Masthead metadata cell ──────────────────────────────────────────────────

interface MastheadCellProps {
  masthead: MapTitleMasthead;
  mode: Mode;
}

const MastheadCell: React.FC<MastheadCellProps> = ({ masthead, mode }) => {
  const theme = useThemeMode(mode);
  const color = theme.text.muted;
  const lines: { label: string; value: string }[] = [];
  if (masthead.date) lines.push({ label: "DATE", value: masthead.date });
  if (masthead.scope) lines.push({ label: "SCOPE", value: masthead.scope });
  if (masthead.note) lines.push({ label: "NOTE", value: masthead.note });
  if (lines.length === 0) return null;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "flex-start",
        gap: layout.spacing.lg,
        flexShrink: 0,
        fontFamily: fonts.metadata,
        fontSize: fontSizes.meta,
        letterSpacing: letterSpacing.meta,
        textTransform: "uppercase",
        color,
      }}
    >
      {lines.map((l) => (
        <div key={l.label} style={{ textAlign: "right" }}>
          <div style={{ opacity: 0.7, marginBottom: 2 }}>{l.label}</div>
          <div style={{ color: theme.text.primary, fontWeight: fontWeights.medium }}>
            {l.value}
          </div>
        </div>
      ))}
    </div>
  );
};

// ── Public helper: banner-mode content inset ────────────────────────────────

/**
 * When `mapTitle.mode === "banner"`, map content should render in the
 * middle band of the canvas. This helper returns the y offset and usable
 * height. Templates use it to translate their SVG / Mapbox area inward.
 *
 * Usage:
 *   const inset = mapTitleContentInset(data.mapTitle);
 *   // inset.top  = 100 (or 0 if not banner)
 *   // inset.bottom = 100 (or 0 if not banner / no bottom band)
 *   // inset.height = layout.height - inset.top - inset.bottom
 */
export function mapTitleContentInset(
  config: MapTitleConfig | undefined,
  hints: { hasSubtitle: boolean; hasFooterCaption: boolean } = {
    hasSubtitle: false,
    hasFooterCaption: false,
  }
): { top: number; bottom: number; height: number } {
  if (!config || (config.mode ?? "banner") !== "banner") {
    return { top: 0, bottom: 0, height: layout.height };
  }
  const hasMastheadNote = Boolean(
    config.masthead?.note || config.masthead?.date || config.masthead?.scope
  );
  const bottom =
    resolveBottomBand(config.bottomBand, {
      hasSubtitle: hints.hasSubtitle,
      hasFooterCaption: hints.hasFooterCaption,
      hasMastheadNote: hasMastheadNote && (config.treatment ?? "minimalist") === "masthead",
    })
      ? MAP_TITLE_BAND_HEIGHT
      : 0;
  return {
    top: MAP_TITLE_BAND_HEIGHT,
    bottom,
    height: layout.height - MAP_TITLE_BAND_HEIGHT - bottom,
  };
}
