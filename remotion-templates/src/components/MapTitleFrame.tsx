/**
 * MapTitleFrame — floating-text title placement for full-bleed map templates.
 *
 * Solves the title-overlapping-map problem for the 7 full-bleed map templates
 * (ChoroplethMap, AtlasPlate, RouteAnimation, ProportionalSymbolMap,
 * CartogramMap, DensityMap, TilegramUSMap).
 *
 * ## Design (May 14, 2026 redesign)
 *
 * Original v1 used a paper-fill horizontal band at the top + bottom of the
 * canvas. Visual review of catalog renders found the bands ugly: they read as
 * UI chrome bolted onto editorial maps. FT/Economist/NYT-Upshot conventions
 * for editorial maps don't use bands — they place the title ON the map, in a
 * region with no data.
 *
 * v2 (this file): title is just bold ink text floating in a corner of the
 * canvas, sitting directly on the bone/paper basemap. No fill rectangle, no
 * box. A soft paper-tone text-shadow lifts the text off the basemap when
 * data-fills creep close.
 *
 * Smart placement: when `placement === "auto"`, the parent template computes
 * which corner has the maximum clearance from highlighted features (countries
 * with data, symbols, route waypoints) and passes it as `resolvedCorner`.
 * Phase labels (`footerTitle`/`footerSubtitle`) stack inside the same block
 * (below the title) so they get the same clearance — opposite-corner
 * placement put the phase label on top of highlighted features in 3 of 4
 * catalog test renders (May 14 2026 review).
 *
 * Source captions are NOT handled here — they're already routed through
 * `FooterStrip.scale` and `SourceAttribution` in the brand chrome layer.
 */

import React, { useMemo } from "react";
import { measureText } from "@remotion/layout-utils";
import {
  durations,
  fonts,
  fontSizes,
  fontWeights,
  letterSpacing,
  layout,
  palette,
  textMaxWidth,
  type Mode,
} from "../design/theme";
import { useThemeMode } from "../hooks/useThemeMode";
import { useEpisodeColorEmphasis } from "../hooks/useEpisodeColorEmphasis";
import type { DirectionSyncPoint } from "../hooks/useDirection";
import { FadeIn } from "./FadeIn";
import { anticipatoryStartFrame } from "../utils/animation";

// ── Public types ────────────────────────────────────────────────────────────

export type CartoucheCorner =
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right";

export type CartouchePlacement = CartoucheCorner | "auto";

/**
 * Map-title placement configuration. Attach to a map template's data as
 * `mapTitle?: MapTitleConfig`. Omit entirely to accept the default
 * `{ placement: "auto" }`.
 */
export interface MapTitleConfig {
  /**
   * Which corner the title anchors to. "auto" picks the corner with the
   * maximum clearance from highlighted features (data-bearing countries /
   * symbols / waypoints). Parent template computes the resolved corner via
   * `resolveCartoucheCorner()` and passes it as `resolvedCorner`. Mapbox
   * templates without projection access fall back to "top-left".
   * Default: "auto".
   */
  placement?: CartouchePlacement;
}

// ── Layout constants ────────────────────────────────────────────────────────

/**
 * Approximate footprint of the title block when measuring clearance against
 * highlighted features. Wider than the text itself so the smart-placement
 * algorithm scores corners with reasonable breathing room around the text.
 */
export const MAP_TITLE_FOOTPRINT_WIDTH = 640;
export const MAP_TITLE_FOOTPRINT_HEIGHT = 140;

// ── Props ───────────────────────────────────────────────────────────────────

export interface MapTitleFrameProps {
  /** Main title text. */
  title: string;
  /** Optional subtitle below the title. */
  subtitle?: string;
  /** Configuration. Defaults `{ placement: "auto" }`. */
  config?: MapTitleConfig;
  /** Map mode — drives text color. Default "light". */
  mode?: Mode | string;
  /**
   * Phase-varying label (e.g. "Group of Seven", "Western signatories" for
   * AtlasPlate's multi-phase reveals). Rendered in the OPPOSITE corner from
   * the title block.
   */
  footerTitle?: string;
  /** Mono-caption supporting line under `footerTitle`. */
  footerSubtitle?: string;
  /**
   * Narration sync points (same semantics as TitleBlock.syncPoints). When
   * present, the entrance fires ~150ms before the narrator says the title.
   */
  syncPoints?: DirectionSyncPoint[];
  /**
   * Resolved corner from the parent template's smart-placement compute.
   * When `placement === "auto"` and this is omitted, falls back to
   * "top-left".
   */
  resolvedCartoucheCorner?: CartoucheCorner;
  /** Skip the cinematic entrance animation. */
  noAnimation?: boolean;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Resolve absolute positioning for a corner. Anchors to the safe-area edge
 * so HeaderStrip / FooterStrip never get covered.
 */
const cornerStyle = (corner: CartoucheCorner): React.CSSProperties => {
  // Extra padding inside the safe area so the title doesn't crowd the brand
  // chrome (HeaderStrip lives at safeArea.top; FooterStrip at safeArea.bottom).
  const pad = 16;
  return {
    position: "absolute",
    top: corner.startsWith("top") ? layout.safeArea.top + pad : undefined,
    bottom: corner.startsWith("bottom")
      ? layout.safeArea.bottom + pad
      : undefined,
    left: corner.endsWith("left") ? layout.safeArea.left : undefined,
    right: corner.endsWith("right") ? layout.safeArea.right : undefined,
    maxWidth: MAP_TITLE_FOOTPRINT_WIDTH,
    textAlign: corner.endsWith("right") ? "right" : "left",
    zIndex: 11,
  };
};

/**
 * Multi-layer paper-tone text shadow that softens the dark-ink title against
 * any underlying basemap fill. Cheap to render at 30fps and gives enough
 * legibility lift that the title reads cleanly even when an amber/blue
 * country fill happens to creep under it.
 *
 * Dark mode flips: ink-tone halo around bone-colored text.
 */
const titleTextShadow = (mode: Mode): string => {
  const halo = mode === "dark" ? "28,24,20" : "245,240,232"; // ink vs paper
  return [
    `0 0 4px rgba(${halo},0.9)`,
    `0 0 8px rgba(${halo},0.7)`,
    `0 0 16px rgba(${halo},0.5)`,
  ].join(", ");
};

// ── Component ───────────────────────────────────────────────────────────────

export const MapTitleFrame: React.FC<MapTitleFrameProps> = ({
  title,
  subtitle,
  config,
  mode,
  footerTitle,
  footerSubtitle,
  syncPoints,
  noAnimation = false,
  resolvedCartoucheCorner,
}) => {
  const theme = useThemeMode(mode);
  const cfg: MapTitleConfig = config ?? {};
  const resolvedMode: Mode = mode === "dark" ? "dark" : "light";
  const emphasis = useEpisodeColorEmphasis();
  const titleFontFamily = emphasis.displayFont ?? fonts.heading;

  // ── Resolve the anchor corner (title + phase label share it) ──────────────
  const anchorCorner: CartoucheCorner = useMemo(() => {
    if (resolvedCartoucheCorner) return resolvedCartoucheCorner;
    if (cfg.placement && cfg.placement !== "auto") return cfg.placement;
    return "top-left";
  }, [resolvedCartoucheCorner, cfg.placement]);

  // ── Effective start frame (anticipatory if syncPoints present) ────────────
  const effectiveStartFrame =
    syncPoints?.[0]?.frame !== undefined
      ? anticipatoryStartFrame(syncPoints[0].frame, durations.fadeIn)
      : 0;

  // ── Title font-size scaling — shrink only if the title overflows the
  // corner footprint. Most titles fit at h2 (48px) comfortably; long titles
  // ("Strategic Outlook for Semiconductors in 2027") shrink toward h3.
  const titleFontSize = useMemo(() => {
    const target = fontSizes.h2;
    const available = MAP_TITLE_FOOTPRINT_WIDTH - 16;
    const { width: measured } = measureText({
      text: title,
      fontFamily: titleFontFamily,
      fontSize: target,
      fontWeight: fontWeights.semibold,
      letterSpacing: `${letterSpacing.h2}px`,
    });
    const scale = Math.min(1, available / Math.max(1, measured));
    return Math.max(fontSizes.h3, target * scale);
  }, [title, titleFontFamily]);

  const textColor = theme.text.primary;
  const subtitleColor = theme.text.muted;
  const shadow = titleTextShadow(resolvedMode);
  const hasFooter = Boolean(footerTitle) || Boolean(footerSubtitle);

  // ── Combined title + phase-label block ────────────────────────────────────
  // Title and phase label stack in the SAME corner so both get the smart
  // placement's clearance from highlighted features. The phase label sits
  // below the title with a `gap` separator. This replaces the opposite-corner
  // footer that v2 (May 14 2026) tried — review found the opposite corner
  // landed on highlighted features in 3 of 4 catalog renders.
  const content = (
    <div style={cornerStyle(anchorCorner)}>
      <div
        style={{
          fontSize: titleFontSize,
          fontWeight: fontWeights.semibold,
          color: textColor,
          fontFamily: titleFontFamily,
          letterSpacing: letterSpacing.h2,
          lineHeight: 1.1,
          maxWidth: textMaxWidth.h2,
          textShadow: shadow,
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
            textShadow: shadow,
          }}
        >
          {subtitle}
        </div>
      )}
      {hasFooter && (
        // Separator gap between editorial-constant header (title/subtitle)
        // and phase-varying label. Roughly 1 line-height so the phase
        // reveals reads as a distinct beat without breaking the block.
        <div style={{ height: 24 }} />
      )}
      {footerTitle && (
        <div
          style={{
            fontFamily: titleFontFamily,
            fontSize: fontSizes.h3,
            fontWeight: fontWeights.semibold,
            letterSpacing: `${letterSpacing.h3}px`,
            color: textColor,
            lineHeight: 1.1,
            textShadow: shadow,
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
            marginTop: 4,
            textShadow: shadow,
          }}
        >
          {footerSubtitle}
        </div>
      )}
    </div>
  );

  if (noAnimation) return content;
  // Title enters from the corner it occupies — feels grounded.
  const direction = anchorCorner.startsWith("top") ? "down" : "up";
  // FadeIn wraps content in an auto-sized div; we override with inset: 0 so
  // absolutely-positioned children (the title + footer blocks) anchor to
  // canvas edges rather than the wrapper's auto-collapsed bottom.
  return (
    <FadeIn
      startFrame={effectiveStartFrame}
      direction={direction}
      distance={12}
      cinematic
      style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
    >
      {content}
    </FadeIn>
  );
};

// ── Public helper: content inset (kept for API back-compat) ─────────────────

/**
 * v1 banner mode shrank the map content area to leave room for top/bottom
 * bands. v2 floats text on the map, so map content always gets the full
 * canvas. This helper now returns zero insets for every input — kept as a
 * function (not removed) so existing imports in map templates don't break.
 */
export function mapTitleContentInset(): {
  top: number;
  bottom: number;
  height: number;
} {
  return { top: 0, bottom: 0, height: layout.height };
}
