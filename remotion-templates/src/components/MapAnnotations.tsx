/**
 * MapAnnotations — editorial overlay labels for MapGL-based templates.
 *
 * What this is for: the FT/Reuters/NYT signature of an authored atlas plate.
 * A small filled dot pinned to a lon/lat coordinate, an optional leader line,
 * and brand-typed text. Three hierarchies — primary (uppercase, country
 * scale), secondary (sentence case, feature scale), tertiary (Plex Mono,
 * source notes).
 *
 * Why a separate component (vs. inline point labels in RouteAnimation): point
 * labels are tied to *route nodes* and inherit point geometry. Annotations
 * are an editorial layer that may land on any coordinate, including ones
 * that have no route point — e.g., labeling the Strait of Malacca, naming
 * a region of the South China Sea, dropping a source-note in the corner.
 *
 * Usage:
 *   <MapGL ...>
 *     <MapAnnotations
 *       annotations={data.annotations}
 *       compositionDurationSec={data.durationSec ?? 12}
 *       phaseWindows={[{ startSec: 0, endSec: 4 }, { startSec: 4, endSec: 12 }]}
 *       dark={data.backgroundVariant === "dark"}
 *     />
 *   </MapGL>
 *
 * Dossier: references/template-research/map-annotations.md
 */

import React, { useMemo } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { Marker, useMap } from "react-map-gl/mapbox";
import { placeLabels, type Placement } from "./labelPlacement";
import {
  fonts,
  fontSizes,
  fontWeights,
  letterSpacing,
  palette,
  sec,
  shadows,
} from "../design/theme";
import { fadeIn, fadeOut } from "../utils/animation";
import type { MapAnnotation } from "./MapAnnotations.types";

// ── Visual constants ──────────────────────────────────────────────────────

/** Anchor-dot radius in pixels, per hierarchy. */
const DOT_RADIUS = { primary: 4, secondary: 3.5, tertiary: 2.5 } as const;

/** Default vertical offset when no `leader` is given — label sits above. */
const DEFAULT_OFFSET_Y = { primary: -28, secondary: -22, tertiary: -16 } as const;

/** Leader line stroke width per hierarchy. */
const LEADER_STROKE = { primary: 1.25, secondary: 1, tertiary: 0.75 } as const;

/** Entrance / exit fade durations (frames). */
const ENTRANCE_FRAMES = sec(0.5);
const EXIT_FRAMES = sec(0.35);

/**
 * Paint a multi-directional halo around label text so editorial
 * annotations unambiguously win against any Mapbox auto-label they collide
 * with. The 8-direction `text-shadow` stack is the canonical CSS halo
 * trick — paints the halo color at ±r offset in every direction, giving
 * crisp readable text on any background.
 *
 * Halo color matches the editorial surface (paper / ink-dark in dark mode)
 * — so the effect reads as "the annotation is cut out of the page above
 * the map" rather than "the annotation has a colored outline." NYT /
 * FT / Bloomberg editorial convention.
 *
 * Memoized via a `(haloColor, radius) -> string` cache because
 * annotations render every frame at 30 FPS — recomputing the 9-element
 * shadow string per render is wasteful. With only ~4 distinct (color,
 * radius) pairs in flight (paper/ink × primary/secondary/tertiary),
 * cache size is bounded.
 *
 * Exported for unit testing.
 *
 * @param haloColor base color of the halo (paper or ink). Hex string.
 * @param radius halo thickness in pixels. 2 for primary, 1.5 secondary, 1.25 tertiary.
 */
const HALO_CACHE = new Map<string, string>();
export const haloShadow = (haloColor: string, radius: number): string => {
  const cacheKey = `${haloColor}@${radius}`;
  const cached = HALO_CACHE.get(cacheKey);
  if (cached !== undefined) return cached;

  // 8 cardinal + diagonal offsets so the halo is uniform around glyphs.
  const r = radius;
  const built = [
    `${-r}px ${-r}px 0 ${haloColor}`,
    `${r}px ${-r}px 0 ${haloColor}`,
    `${-r}px ${r}px 0 ${haloColor}`,
    `${r}px ${r}px 0 ${haloColor}`,
    `${-r}px 0 0 ${haloColor}`,
    `${r}px 0 0 ${haloColor}`,
    `0 ${-r}px 0 ${haloColor}`,
    `0 ${r}px 0 ${haloColor}`,
    // One soft outer drop for lift — keeps it from looking like a sticker.
    `0 1px 3px rgba(0,0,0,0.18)`,
  ].join(", ");
  HALO_CACHE.set(cacheKey, built);
  return built;
};

/**
 * Equivalent halo for the dot anchor — a `boxShadow` (vs `textShadow` for
 * labels). Without it, the dot is the one part of the annotation that
 * can be visually muddied by a Mapbox label landing at the same pixel.
 */
export const haloBoxShadow = (haloColor: string, radius: number): string => {
  const r = radius;
  return [
    `0 0 0 ${r}px ${haloColor}`,
    `0 1px 3px rgba(0,0,0,0.22)`,
  ].join(", ");
};

/** Halo radius (px) per hierarchy. Primary is largest so the country-scale
 *  label remains crisp even at full saturation. */
const HALO_RADIUS = { primary: 2, secondary: 1.5, tertiary: 1.25 } as const;

/** Dot-halo radius (px) per hierarchy. Narrower than label halo so the
 *  dot doesn't appear ringed; just enough to cut through a Mapbox label
 *  at the same coordinate. */
const DOT_HALO_RADIUS = { primary: 1.5, secondary: 1.25, tertiary: 1 } as const;

// ── Helpers ───────────────────────────────────────────────────────────────

/** Resolve appearAtSec / exitAtSec from explicit fields or phase shorthand. */
export const resolveTiming = (
  ann: MapAnnotation,
  phaseWindows: { startSec: number; endSec: number }[] | undefined,
  compositionDurationSec: number,
): { startSec: number; endSec: number } => {
  // Explicit timings win.
  if (ann.appearAtSec !== undefined || ann.exitAtSec !== undefined) {
    return {
      startSec: ann.appearAtSec ?? 0,
      endSec: ann.exitAtSec ?? compositionDurationSec,
    };
  }
  // Phase shorthand — only honored when the parent provides windows.
  if (ann.phase !== undefined && phaseWindows && phaseWindows[ann.phase]) {
    return phaseWindows[ann.phase];
  }
  return { startSec: 0, endSec: compositionDurationSec };
};

/** Pick the text color for a given hierarchy + emphasis + theme. */
export const resolveColor = (
  hierarchy: MapAnnotation["hierarchy"],
  emphasis: MapAnnotation["emphasis"],
  dark: boolean,
): string => {
  if (emphasis === "accent") return palette.rust;
  if (emphasis === "mute") return palette.taupe;
  // Default: ink in light mode, bone in dark. Tertiary is always slightly muted.
  if (hierarchy === "tertiary") return palette.taupe;
  return dark ? palette.bone : palette.ink;
};

/** Resolve text alignment: explicit > inferred from leader direction > center. */
export const resolveAlign = (
  ann: MapAnnotation,
): "left" | "right" | "center" => {
  if (ann.align) return ann.align;
  if (!ann.leader) return "center";
  if (ann.leader.dx > 4) return "right"; // leader points right → label sits right of endpoint
  if (ann.leader.dx < -4) return "left";
  return "center";
};

// ── Component ─────────────────────────────────────────────────────────────

interface MapAnnotationsProps {
  annotations: MapAnnotation[];
  /** Total composition duration in seconds — used as default exit time. */
  compositionDurationSec: number;
  /**
   * Phase windows in seconds, indexed by phase. When provided, annotations
   * with a `phase` field appear during that window only. Optional — when
   * omitted, `phase` fields are ignored and annotations persist for the
   * whole composition unless they have explicit appear/exit times.
   */
  phaseWindows?: { startSec: number; endSec: number }[];
  /** Dark mode — text inverts to bone on ink. */
  dark?: boolean;
}

// ── Memoized marker sub-component ─────────────────────────────────────────

interface MapAnnotationMarkerProps {
  /** Stable annotation reference from the data file. */
  annotation: MapAnnotation;
  /** Pre-computed opacity (parent does the per-frame fade math). */
  opacity: number;
  dark: boolean;
  /** Auto-placement output from the parent's greedy placer. When the
   *  annotation has a manual `leader.dx/dy`, this is ignored (manual
   *  override wins). When unset and no manual leader, falls back to the
   *  hierarchy-default dy. */
  placement?: Placement;
}

/**
 * One marker per annotation. Wrapped in React.memo: the parent
 * MapAnnotations does the per-frame opacity computation and only renders
 * markers that are actually visible (opacity > 0). When opacity is
 * constant between frames (most of the time), this sub-component skips
 * re-render entirely.
 */
const MapAnnotationMarker = React.memo<MapAnnotationMarkerProps>(({
  annotation,
  opacity,
  dark,
  placement,
}) => {
  const color = resolveColor(annotation.hierarchy, annotation.emphasis, dark);
  // Align resolution: explicit annotation.align wins; otherwise the placer's
  // computed align (matches displacement direction — E-displaced labels read
  // better with "left" text-align so text starts near the anchor); otherwise
  // fall back to inferred-from-leader-direction; otherwise center.
  const align: "left" | "right" | "center" =
    annotation.align ?? placement?.align ?? resolveAlign(annotation);
  const dotR = DOT_RADIUS[annotation.hierarchy];

  // Offset resolution priority:
  //   1. Manual annotation.leader.dx/dy (author had a reason — always wins)
  //   2. Auto-placer output (greedy collision avoidance)
  //   3. Hierarchy default (DEFAULT_OFFSET_Y — small gap above anchor)
  const manualDx = annotation.leader?.dx;
  const manualDy = annotation.leader?.dy;
  const dx = manualDx ?? placement?.dx ?? 0;
  const dy =
    manualDy ?? placement?.dy ?? DEFAULT_OFFSET_Y[annotation.hierarchy];
  // Leader-line trigger: explicit manual leader OR the auto-placer
  // displaced this label from its default position.
  const hasLeader = !!annotation.leader || !!placement?.displaced;

  // Primary annotations get bumped to `bold` weight (was semibold) so they
  // unambiguously dominate Mapbox's automatic country labels even when the
  // typographic registers are close. May 13, 2026 polish pass — paired
  // with the new haloShadow below.
  const labelStyle: React.CSSProperties =
    annotation.hierarchy === "primary"
      ? {
          fontFamily: fonts.display,
          fontSize: fontSizes.h3,
          fontWeight: fontWeights.bold,
          letterSpacing: `${letterSpacing.h3}px`,
          textTransform: "uppercase",
        }
      : annotation.hierarchy === "secondary"
      ? {
          fontFamily: fonts.heading,
          fontSize: fontSizes.body,
          fontWeight: fontWeights.semibold,
          letterSpacing: `${letterSpacing.label}px`,
        }
      : {
          fontFamily: fonts.metadata,
          fontSize: fontSizes.caption,
          fontWeight: fontWeights.medium,
          letterSpacing: `${letterSpacing.caption}px`,
        };

  // Paper-color halo in light mode, ink-color halo in dark mode. Halo width
  // scales with hierarchy. This is the move that makes editorial
  // annotations cut out of the map background so they're never visually
  // muddied by Mapbox's auto-labels at the same pixel.
  const haloColor = dark ? palette.ink : palette.paper;
  const labelHalo = haloShadow(haloColor, HALO_RADIUS[annotation.hierarchy]);

  const labelTranslate =
    align === "center"
      ? "translate(-50%, -50%)"
      : align === "left"
      ? "translate(-100%, -50%)"
      : "translate(0, -50%)";

  return (
    <Marker
      longitude={annotation.at[0]}
      latitude={annotation.at[1]}
      anchor="center"
    >
      <div
        style={{
          position: "relative",
          pointerEvents: "none",
          opacity,
        }}
      >
        {/* Anchor dot at (0, 0) — the lon/lat point. Paper-color halo
            mirrors the label halo so the dot doesn't get visually muddied
            when it lands on top of a Mapbox auto-label at the same pixel. */}
        <div
          style={{
            position: "absolute",
            width: dotR * 2,
            height: dotR * 2,
            borderRadius: "50%",
            backgroundColor: color,
            transform: "translate(-50%, -50%)",
            boxShadow: haloBoxShadow(
              haloColor,
              DOT_HALO_RADIUS[annotation.hierarchy],
            ),
          }}
        />

        {/* Leader line — drawn only when leader offset is given. */}
        {hasLeader && (
          <svg
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: 1,
              height: 1,
              overflow: "visible",
              pointerEvents: "none",
            }}
          >
            <line
              x1={0}
              y1={0}
              x2={dx}
              y2={dy}
              stroke={color}
              strokeOpacity={0.55}
              strokeWidth={LEADER_STROKE[annotation.hierarchy]}
              strokeLinecap="round"
            />
          </svg>
        )}

        {/* Label — positioned at (dx, dy) with alignment-aware translate. */}
        <div
          style={{
            position: "absolute",
            left: dx,
            top: dy,
            transform: labelTranslate,
            whiteSpace: "nowrap",
            textAlign:
              align === "left"
                ? "right"
                : align === "right"
                ? "left"
                : "center",
            color,
            // Paper-color halo so the editorial annotation cuts out of the
            // map and unambiguously wins against Mapbox auto-labels at the
            // same pixel. Replaces the prior `shadows.textLift` drop, which
            // was atmospheric (drop shadow for "depth") rather than
            // collision-resistant (halo for "win over other typography").
            textShadow: labelHalo,
            ...labelStyle,
          }}
        >
          <div>{annotation.label}</div>
          {annotation.sublabel && (
            <div
              style={{
                marginTop: 2,
                fontFamily: fonts.metadata,
                fontSize: fontSizes.meta,
                fontWeight: fontWeights.regular,
                letterSpacing: `${letterSpacing.meta}px`,
                textTransform: "uppercase",
                color: palette.taupe,
                textShadow: haloShadow(haloColor, 1),
              }}
            >
              {annotation.sublabel}
            </div>
          )}
        </div>
      </div>
    </Marker>
  );
});
MapAnnotationMarker.displayName = "MapAnnotationMarker";

// ── Top-level component ───────────────────────────────────────────────────

export const MapAnnotations: React.FC<MapAnnotationsProps> = ({
  annotations,
  compositionDurationSec,
  phaseWindows,
  dark = false,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  // useMap() yields the parent <MapGL>'s react-map-gl Map instance. The
  // greedy placer needs map.project([lon, lat]) to convert anchors to pixel
  // coords before checking bbox overlap. May 13, 2026 — Layer A of the
  // label-collision defense (Mapbox-native `text-variable-anchor` idiom
  // adapted to our editorial MapAnnotations).
  const { current: mapRef } = useMap();

  // Stable resolved-timing array — recomputed only when inputs change.
  const resolved = useMemo(
    () =>
      annotations.map((ann) => ({
        ann,
        ...resolveTiming(ann, phaseWindows, compositionDurationSec),
      })),
    [annotations, phaseWindows, compositionDurationSec],
  );

  // Filter to visible annotations BEFORE running the placer — invisible
  // labels shouldn't push visible ones around (they're not actually
  // competing for pixel space at this frame).
  const visible = resolved.flatMap(({ ann, startSec, endSec }) => {
    const startFrame = Math.round(startSec * fps);
    const endFrame = Math.round(endSec * fps);
    const opacity = Math.min(
      fadeIn(frame, startFrame, ENTRANCE_FRAMES),
      fadeOut(frame, endFrame, EXIT_FRAMES),
    );
    if (opacity <= 0) return [];
    return [{ ann, startSec, endSec, opacity }];
  });

  // Run the greedy placer once per frame. Per-frame is correct because the
  // map camera changes per frame (route animations, choropleth phase
  // transitions) — pixel coords of each anchor shift, so collision
  // arbitration must re-run. Cost: O(N²) with N ≤ ~10 typical → sub-ms.
  //
  // No useMemo wrap: `visible` is a fresh array reference every frame
  // (filter result), so any memoization keyed on it would always miss.
  // Just compute inline.
  const placements: Placement[] = (() => {
    const map = mapRef?.getMap?.();
    if (!map || typeof map.project !== "function") {
      return visible.map(
        (): Placement => ({
          dx: 0,
          dy: 0,
          displaced: false,
          offscreen: false,
          align: "center",
        }),
      );
    }
    return placeLabels(
      visible.map(({ ann }) => ({
        ann,
        defaultDy: DEFAULT_OFFSET_Y[ann.hierarchy],
      })),
      (lonLat) => {
        const p = map.project(lonLat);
        if (
          !Number.isFinite(p.x) ||
          !Number.isFinite(p.y) ||
          // Anchors way off-screen don't participate in placement —
          // their labels would never be visible anyway.
          p.x < -200 ||
          p.x > 2200 ||
          p.y < -200 ||
          p.y > 1300
        ) {
          return null;
        }
        // Back-of-globe detection (Issue 5 from May 14 review): in
        // orthographic / globe projection, points on the far hemisphere
        // project to FINITE in-range pixel coords but are visually behind
        // the planet. Round-trip via unproject() — if the unproject
        // result doesn't match the input lon/lat within a small epsilon,
        // we're looking at the back. Skip those anchors so the placer
        // doesn't push visible labels around for invisible competitors.
        try {
          if (typeof map.unproject === "function") {
            const rt = map.unproject([p.x, p.y]);
            const lonDiff = Math.abs(((rt.lng - lonLat[0] + 540) % 360) - 180);
            const latDiff = Math.abs(rt.lat - lonLat[1]);
            if (lonDiff > 1 || latDiff > 1) return null;
          }
        } catch {
          // unproject can throw at extreme camera state; treat as visible.
        }
        return { x: p.x, y: p.y };
      },
    );
  })();

  return (
    <>
      {visible.map(({ ann, opacity }, i) => {
        // Content-derived key — array index would cause stale-Marker reuse
        // when authors reorder annotations during preview iteration.
        const key = `ann-${ann.at[0].toFixed(3)},${ann.at[1].toFixed(3)}-${ann.label}`;
        return (
          <MapAnnotationMarker
            key={key}
            annotation={ann}
            opacity={opacity}
            dark={dark}
            placement={placements[i]}
          />
        );
      })}
    </>
  );
};
