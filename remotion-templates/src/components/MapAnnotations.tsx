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
import { Marker } from "react-map-gl/mapbox";
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
}) => {
  const color = resolveColor(annotation.hierarchy, annotation.emphasis, dark);
  const align = resolveAlign(annotation);
  const dotR = DOT_RADIUS[annotation.hierarchy];
  const dx = annotation.leader?.dx ?? 0;
  const dy = annotation.leader?.dy ?? DEFAULT_OFFSET_Y[annotation.hierarchy];
  const hasLeader = !!annotation.leader;

  const labelStyle: React.CSSProperties =
    annotation.hierarchy === "primary"
      ? {
          fontFamily: fonts.display,
          fontSize: fontSizes.h3,
          fontWeight: fontWeights.semibold,
          letterSpacing: `${letterSpacing.h3}px`,
          textTransform: "uppercase",
        }
      : annotation.hierarchy === "secondary"
      ? {
          fontFamily: fonts.heading,
          fontSize: fontSizes.body,
          fontWeight: fontWeights.medium,
          letterSpacing: `${letterSpacing.label}px`,
        }
      : {
          fontFamily: fonts.metadata,
          fontSize: fontSizes.caption,
          fontWeight: fontWeights.regular,
          letterSpacing: `${letterSpacing.caption}px`,
        };

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
        {/* Anchor dot at (0, 0) — the lon/lat point. */}
        <div
          style={{
            position: "absolute",
            width: dotR * 2,
            height: dotR * 2,
            borderRadius: "50%",
            backgroundColor: color,
            transform: "translate(-50%, -50%)",
            boxShadow: dark ? shadows.textLift : shadows.textLiftLight,
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
            textShadow: dark ? shadows.textLift : shadows.textLiftLight,
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

  // Stable resolved-timing array — recomputed only when inputs change.
  const resolved = useMemo(
    () =>
      annotations.map((ann) => ({
        ann,
        ...resolveTiming(ann, phaseWindows, compositionDurationSec),
      })),
    [annotations, phaseWindows, compositionDurationSec],
  );

  return (
    <>
      {resolved.map(({ ann, startSec, endSec }) => {
        // Content-derived key — array index would cause stale-Marker reuse
        // when authors reorder annotations during preview iteration.
        const key = `ann-${ann.at[0].toFixed(3)},${ann.at[1].toFixed(3)}-${ann.label}`;
        const startFrame = Math.round(startSec * fps);
        const endFrame = Math.round(endSec * fps);

        const opacity = Math.min(
          fadeIn(frame, startFrame, ENTRANCE_FRAMES),
          fadeOut(frame, endFrame, EXIT_FRAMES),
        );

        // Skip rendering entirely when fully invisible. Big perf win when
        // many annotations are spread across phases — only the visible ones
        // are mounted at any given frame.
        if (opacity <= 0) return null;

        return (
          <MapAnnotationMarker
            key={key}
            annotation={ann}
            opacity={opacity}
            dark={dark}
          />
        );
      })}
    </>
  );
};
