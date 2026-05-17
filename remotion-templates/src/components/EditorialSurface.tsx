/**
 * EditorialSurface — Paper-texture background + film grain for Remotion compositions.
 *
 * Unifies all Remotion analytical content with the AI-generated pillar's
 * post-video grain treatment (treat_video.py), making a chart feel like it
 * belongs to the same editorial-magazine register as the channel's
 * constructivist illustrations (Registers 2 and 3).
 *
 * Usage (standalone template):
 *   <EditorialSurface intensity={0.6}>
 *     <DataChart data={data} />
 *   </EditorialSurface>
 *
 * FullEpisode.tsx wraps its entire visual tree in this component at the
 * default intensity (0.6) so all templates inherit the paper texture without
 * per-template changes.
 *
 * Intensity guidelines (matches treat_video.py semantics):
 *   0.0 — clean digital surface (no grain)
 *   0.6 — "felt, not seen" (default — warmth before texture)
 *   0.8 — noticeably grainy (archival/aged treatment)
 *   1.0 — maximum presence (period-film or deliberate texture effect)
 */

import React, { type ReactNode } from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import backdropManifest from "../../data/backdrop-manifest.json";
import type { BackdropChartFit } from "../utils/backdropChartFit";
import type { EditorialMode } from "../design/editorialModes";
import { palette } from "../design/theme";

export interface EditorialSurfaceProps {
  children: ReactNode;
  /** Grain intensity 0-1. Default 0.6 — "felt, not seen." */
  intensity?: number;
  /** Override the default paper background color. Default: palette.paper. */
  paperColor?: string;
  /** Disable the subtle corner vignette. Default false. */
  noVignette?: boolean;
  /**
   * Optional atmospheric backdrop image. When set, the image is rendered as
   * the bottom layer (under children, grain, and vignette) and replaces the
   * solid paperColor as the visual ground. Pass a staticFile() path, e.g.
   * `staticFile("assets/backdrops/cartographic.png")`. Use sparingly — see
   * VISUAL_LANGUAGE.md → Register 2 (atmospheric backdrop) for the editorial
   * pairing rules (per-scene/per-composition, not channel-wide default).
   */
  backdrop?: string;
}

// Module-level constant: decompose palette.ink to RGB once so VignetteLayer
// can build the gradient without hardcoding hex (POL-07 compliance).
const INK_R = parseInt(palette.ink.slice(1, 3), 16);
const INK_G = parseInt(palette.ink.slice(3, 5), 16);
const INK_B = parseInt(palette.ink.slice(5, 7), 16);

// ── Grain layer ───────────────────────────────────────────────────────────────

// EditorialSurface wraps the entire episode, so the grain layer renders for
// every frame of every episode. Previously we keyed the filter id off the
// seed (`editorial-grain-${seed}`), which forced Chrome to recompile a new
// SVG filter graph 15 times per second × ~13 min = ~12,000 fresh filter
// elements per episode. Keeping the id constant and only mutating the
// `seed=` attribute on <feTurbulence> lets React patch the attribute in
// place; Chrome updates the noise without rebuilding the filter graph.
const GRAIN_FILTER_ID = "editorial-grain";

const GrainLayer = React.memo(({ intensity }: { intensity: number }) => {
  const frame = useCurrentFrame();
  // Update seed every 2 frames (15fps flicker) to simulate film "gate weave" —
  // prevents grain from looking frozen across adjacent frames.
  const seed = Math.floor(frame / 2);
  const opacity = Math.min(intensity * 0.12, 0.15);
  if (opacity === 0) return null;

  // 16mm film grain: baseFrequency 0.45 → coarser, warmer texture than
  // FilmOverlay's digital noise (0.65). numOctaves: 3 → softer, less fractal.
  return (
    <AbsoluteFill style={{ pointerEvents: "none", zIndex: 2 }}>
      <svg
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          opacity,
          // multiply on paper (light bg) darkens grain spots → paper texture
          mixBlendMode: "multiply",
          pointerEvents: "none",
        }}
      >
        <defs>
          <filter id={GRAIN_FILTER_ID} x="0%" y="0%" width="100%" height="100%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.45"
              numOctaves={3}
              seed={seed}
              result="noise"
            />
            <feColorMatrix type="saturate" values="0" in="noise" />
          </filter>
        </defs>
        <rect width="100%" height="100%" filter={`url(#${GRAIN_FILTER_ID})`} />
      </svg>
    </AbsoluteFill>
  );
});
GrainLayer.displayName = "GrainLayer";

// ── Vignette layer ────────────────────────────────────────────────────────────

const VignetteLayer = React.memo(({ intensity }: { intensity: number }) => {
  // Very subtle bound-edge tonality: ~5% darkening at corners, 0% at center.
  // Reads as "printed page" (paper edge shadow), not "film-school vignette."
  const edge = Math.min(intensity * 0.08, 0.08);
  if (edge === 0) return null;

  const bg = `radial-gradient(ellipse at center,
    transparent 0%,
    transparent 50%,
    rgba(${INK_R}, ${INK_G}, ${INK_B}, ${(edge * 0.5).toFixed(3)}) 80%,
    rgba(${INK_R}, ${INK_G}, ${INK_B}, ${edge.toFixed(3)}) 100%)`;

  return (
    <AbsoluteFill
      style={{ background: bg, pointerEvents: "none", zIndex: 2 }}
    />
  );
});
VignetteLayer.displayName = "VignetteLayer";

// ── Main component ────────────────────────────────────────────────────────────

/**
 * Wraps any composition in a paper-texture surface with animated film grain
 * and a subtle corner vignette. Provides the shared tactile foundation that
 * bridges Remotion analytical content with the channel's constructivist
 * illustration register.
 */
export const EditorialSurface = React.memo(
  ({
    children,
    intensity = 0.6,
    paperColor,
    noVignette = false,
    backdrop,
  }: EditorialSurfaceProps) => {
    const clampedIntensity = Math.min(Math.max(intensity, 0), 1);
    const bg = paperColor ?? palette.paper;

    return (
      <AbsoluteFill style={{ backgroundColor: bg }}>
        {backdrop && (
          <AbsoluteFill style={{ zIndex: 0, pointerEvents: "none" }}>
            <Img
              src={backdrop}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
              }}
            />
          </AbsoluteFill>
        )}
        {children}
        <GrainLayer intensity={clampedIntensity} />
        {!noVignette && <VignetteLayer intensity={clampedIntensity} />}
      </AbsoluteFill>
    );
  },
);
EditorialSurface.displayName = "EditorialSurface";

// ── Backdrop manifest ─────────────────────────────────────────────────────────
//
// Canonical data: ../../data/backdrop-manifest.json (ids, anchors, selectionBrief
// for agents/tools). One PNG per id in public/assets/backdrops/{id}.png.
//
// Anchor → recommended frame variant:
//   right    → "hero-flipped"  (hero right, chart left over the quiet)
//   left     → "hero"           (hero left, chart right; body may need lift)
//   centered → "hero"           (centered subject sits between hero and chart)
//   bottom   → either           (sky/quiet zone fills the upper two-thirds)

export type BackdropAnchor = "right" | "left" | "centered" | "bottom";

/** Visual weight of the PNG — pairs with chart density and safe zones. */
export type BackdropDensity = "quiet" | "medium" | "busy";

/** Color/spatial mood for auto-pick metadata (not VISUAL_LANGUAGE Registers 1–3). */
export type BackdropTone =
  | "neutral"
  | "warm-archival"
  | "cool-urban"
  | "industrial"
  | "dark-neutral"
  | "dark-warm"
  | "dark-cool"
  | "dark-industrial";

export interface BackdropEntry {
  /** Stem of the file in public/assets/backdrops/ (no extension). */
  id: string;
  /** Where the backdrop's visual weight sits. Drives variant pairing. */
  anchor: BackdropAnchor;
  /** Recommended EditorialFrame variant. */
  variant: "hero" | "hero-flipped";
  /**
   * Editorial mode this backdrop demands for foreground typography.
   * Drives the EditorialFrame mode cascade in FullEpisode — `light` keeps
   * ink-on-paper, `dark` flips to bone-on-near-black. Required for all
   * entries since May 11, 2026; older callers that read manifest data
   * directly must treat `undefined` as `"light"`.
   */
  register: EditorialMode;
  /** Short editorial description — what this backdrop says, when to use it. */
  notes: string;
  /** Agent-oriented: when to pick this id vs others (scripts, LLM tooling). */
  selectionBrief: string;
  /** Controlled vocabulary for future auto-selection (Remotion segment backdrops only). */
  tags?: readonly string[];
  /** Visual weight of the PNG — default driver for chartFit when chartFit omitted. */
  density?: BackdropDensity;
  tone?: BackdropTone;
  /**
   * Max recommended foreground chart / label density. If omitted: quiet→high,
   * medium→medium, busy→low. See design-references/backdrops/BACKDROP_CHART_PAIRING.md.
   */
  chartFit?: BackdropChartFit;
  /**
   * FilmOverlay preset this backdrop pairs naturally with. Drives the
   * filmOverlay-cascade resolver in `src/utils/resolveFilmOverlay.ts` —
   * a segment that lands on a cinematic dark backdrop picks up the
   * `cinematic` preset automatically (grain + leak + flicker), while a
   * segment on `cartographic` paper gets the `clean` preset (no texture).
   * Omitted → cascade falls through to TEMPLATE_PRESET_MAP for the
   * segment's template component. See FilmOverlayPresets.ts for the 5
   * preset definitions.
   */
  recommendedPreset?: FilmOverlayPresetName;
}

/** The five canonical FilmOverlay preset names. Sourced from FilmOverlayPresets.ts. */
export type FilmOverlayPresetName =
  | "clean"
  | "documentary"
  | "cinematic"
  | "dramatic"
  | "archival";

export const BACKDROP_MANIFEST: readonly BackdropEntry[] =
  backdropManifest.backdrops as readonly BackdropEntry[];

const BACKDROP_INDEX: Record<string, BackdropEntry> = Object.fromEntries(
  BACKDROP_MANIFEST.map((b) => [b.id, b]),
);

/**
 * Resolve a backdrop id to a staticFile() URL, or null if unknown.
 * Prefer this for per-segment layers where invalid ids should not throw at render.
 */
export const backdropStaticFile = (id: string): string | null => {
  if (!BACKDROP_INDEX[id]) {
    return null;
  }
  return staticFile(`assets/backdrops/${id}.png`);
};

/**
 * Bottom layer for a foreground template segment — atmospheric PNG under charts only.
 * Parent should apply episode-level paper + grain (e.g. FullEpisode's EditorialSurface).
 */
export const SegmentBackdrop = React.memo(({ backdropId }: { backdropId: string }) => {
  const src = backdropStaticFile(backdropId);
  if (!src) {
    return null;
  }
  return (
    <AbsoluteFill style={{ zIndex: 0, pointerEvents: "none" }}>
      <Img
        src={src}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
        }}
      />
    </AbsoluteFill>
  );
});
SegmentBackdrop.displayName = "SegmentBackdrop";

/**
 * Resolve a backdrop id (e.g. "reading-room") to a staticFile() path ready to
 * pass to `<EditorialSurface backdrop={...} />`. Throws on unknown id so a
 * typo surfaces at composition mount rather than as a silent blank backdrop.
 */
export const pickBackdrop = (id: string): string => {
  const path = backdropStaticFile(id);
  if (!path) {
    throw new Error(
      `[EditorialSurface] Unknown backdrop "${id}". Available: ${BACKDROP_MANIFEST.map((b) => b.id).join(", ")}`,
    );
  }
  return path;
};

/**
 * Look up the manifest entry — useful for picking the right EditorialFrame
 * variant given a backdrop id at composition time. Returns null on unknown id.
 */
export const backdropMeta = (id: string): BackdropEntry | null =>
  BACKDROP_INDEX[id] ?? null;
