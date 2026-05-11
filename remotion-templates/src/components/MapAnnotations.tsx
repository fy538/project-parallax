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
const resolveTiming = (
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
const resolveColor = (
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
const resolveAlign = (
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
      {resolved.map(({ ann, startSec, endSec }, i) => {
        const startFrame = Math.round(startSec * fps);
        const endFrame = Math.round(endSec * fps);

        const opacityIn = fadeIn(frame, startFrame, ENTRANCE_FRAMES);
        const opacityOut = fadeOut(frame, endFrame, EXIT_FRAMES);
        const opacity = Math.min(opacityIn, opacityOut);

        // Skip rendering when fully invisible (small perf win — many
        // annotations may be off-window in long compositions).
        if (opacity <= 0) return null;

        const color = resolveColor(ann.hierarchy, ann.emphasis, dark);
        const align = resolveAlign(ann);
        const dotR = DOT_RADIUS[ann.hierarchy];
        const dx = ann.leader?.dx ?? 0;
        const dy = ann.leader?.dy ?? DEFAULT_OFFSET_Y[ann.hierarchy];
        const hasLeader = !!ann.leader;

        // Typography per hierarchy.
        const labelStyle: React.CSSProperties =
          ann.hierarchy === "primary"
            ? {
                fontFamily: fonts.display,
                fontSize: fontSizes.h3,
                fontWeight: fontWeights.semibold,
                letterSpacing: `${letterSpacing.h3}px`,
                textTransform: "uppercase",
              }
            : ann.hierarchy === "secondary"
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

        // Label horizontal offset — align controls which side of (dx, dy) the
        // text sits on. center: text centered on (dx, dy); left: right edge
        // at (dx, dy); right: left edge at (dx, dy).
        const labelTranslate =
          align === "center"
            ? "translate(-50%, -50%)"
            : align === "left"
            ? "translate(-100%, -50%)"
            : "translate(0, -50%)";

        return (
          <Marker
            key={`ann-${i}`}
            longitude={ann.at[0]}
            latitude={ann.at[1]}
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
                    strokeWidth={LEADER_STROKE[ann.hierarchy]}
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
                  textShadow: shadows.textLift,
                  ...labelStyle,
                }}
              >
                <div>{ann.label}</div>
                {ann.sublabel && (
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
                    {ann.sublabel}
                  </div>
                )}
              </div>
            </div>
          </Marker>
        );
      })}
    </>
  );
};
