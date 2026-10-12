/**
 * AnnotationSVGLayer — reusable full-canvas SVG overlay for progressive
 * annotation reveals.
 *
 * Renders callout dots, leader lines, and text labels at percentage-based
 * positions over a 1920×1080 canvas. Used by ScrollyReveal; available as a
 * shared primitive for any future template that needs a progressive
 * annotation reveal over a fixed-size visual.
 *
 * Annotation types:
 *   "callout"   — dot + leader line + label (default; editorial dossier feel)
 *   "highlight" — semi-transparent filled rect indicating a region
 *   "trace"     — an evolvePath ring that DRAWS ITSELF around a feature, then a
 *                 leader draws out to a label. The "look here" gesture made by
 *                 the stroke itself (the AIStillComposite move) — use over AI
 *                 stills / maps / photos where you want the annotation to feel
 *                 hand-drawn onto the image rather than dropped on top.
 *   "bracket"   — fallback to callout in v1
 *
 * Two accumulation modes:
 *   "accumulate" — all annotations with index < activeCount remain visible
 *   "replace"    — only the active annotation is visible; prior ones fade out
 *
 * Wrapped in React.memo — no re-render when props are stable between frames.
 */

import React, { useMemo } from "react";
import { interpolate } from "remotion";
import { evolvePath, translatePath } from "@remotion/paths";
import { makeCircle } from "@remotion/shapes";
import { palette, fonts, fontSizes, fontWeights } from "../design/theme";
import { CLAMP_CUBIC, CLAMP } from "../utils/animation";
import { warnIf } from "../utils/dataWarnings";

// ── Types ────────────────────────────────────────────────────────────────────

export interface AnnotationItem {
  id: string;
  x: number;         // 0–100 percent of canvas width
  y: number;         // 0–100 percent of canvas height
  label: string;
  detail?: string;
  placement?: "top" | "bottom" | "left" | "right";  // default "top"
  color?: string;    // default palette.gold
  type?: "callout" | "highlight" | "trace" | "bracket";  // default "callout"
  /** "trace" only — ring radius in canvas px (default 100). */
  radius?: number;
}

interface AnnotationSVGLayerProps {
  annotations: AnnotationItem[];
  /** How many annotations are currently visible (0 = none). */
  activeCount: number;
  /** Returns 0..1 fade-in progress for annotation at index idx. */
  revealProgress: (idx: number) => number;
  width: number;    // canvas width (1920)
  height: number;   // canvas height (1080)
  mode?: "accumulate" | "replace";  // default "accumulate"
}

// ── Geometry constants ───────────────────────────────────────────────────────

const DOT_RADIUS = 7;
const HALO_RADIUS = DOT_RADIUS + 5;
const LEADER_LENGTH = 60;
const LABEL_GAP = 10;

// ── Geometry helper ──────────────────────────────────────────────────────────

interface CalloutGeometry {
  dotX: number;
  dotY: number;
  lineX2: number;
  lineY2: number;
  labelX: number;
  labelY: number;
  textAnchor: "start" | "end" | "middle";
  textBaseline: "auto" | "text-before-edge" | "text-after-edge" | "central";
}

function computeCalloutGeometry(
  x: number,
  y: number,
  placement: "top" | "bottom" | "left" | "right",
  canvasWidth: number,
  canvasHeight: number,
): CalloutGeometry {
  const dotX = (x / 100) * canvasWidth;
  const dotY = (y / 100) * canvasHeight;

  let dx = 0;
  let dy = 0;
  let textAnchor: CalloutGeometry["textAnchor"] = "middle";
  let textBaseline: CalloutGeometry["textBaseline"] = "central";

  switch (placement) {
    case "right":
      dx = LEADER_LENGTH;
      dy = 0;
      textAnchor = "start";
      textBaseline = "central";
      break;
    case "left":
      dx = -LEADER_LENGTH;
      dy = 0;
      textAnchor = "end";
      textBaseline = "central";
      break;
    case "bottom":
      dx = 0;
      dy = LEADER_LENGTH;
      textAnchor = "middle";
      textBaseline = "text-before-edge";
      break;
    case "top":
    default:
      dx = 0;
      dy = -LEADER_LENGTH;
      textAnchor = "middle";
      textBaseline = "text-after-edge";
      break;
  }

  const lineX2 = dotX + dx;
  const lineY2 = dotY + dy;

  // Label sits just beyond the line endpoint, in the leader direction.
  const labelX = lineX2 + (dx > 0 ? LABEL_GAP : dx < 0 ? -LABEL_GAP : 0);
  const labelY = lineY2 + (dy > 0 ? LABEL_GAP : dy < 0 ? -LABEL_GAP : 0);

  return { dotX, dotY, lineX2, lineY2, labelX, labelY, textAnchor, textBaseline };
}

// ── Callout annotation ───────────────────────────────────────────────────────

interface CalloutAnnotationProps {
  annotation: AnnotationItem;
  progress: number;  // 0..1 combined reveal progress
  canvasWidth: number;
  canvasHeight: number;
}

const CalloutAnnotation = React.memo<CalloutAnnotationProps>(({
  annotation,
  progress,
  canvasWidth,
  canvasHeight,
}) => {
  const placement = annotation.placement ?? "top";
  const color = annotation.color ?? palette.gold;

  const geo = useMemo(
    () => computeCalloutGeometry(annotation.x, annotation.y, placement, canvasWidth, canvasHeight),
    [annotation.x, annotation.y, placement, canvasWidth, canvasHeight],
  );

  // Staged reveal: dot (0→0.3), leader (0.3→0.6), label (0.6→1.0)
  const dotOpacity = interpolate(progress, [0, 0.3], [0, 1], CLAMP_CUBIC);
  const lineProgress = interpolate(progress, [0.3, 0.6], [0, 1], CLAMP_CUBIC);
  const labelOpacity = interpolate(progress, [0.6, 1.0], [0, 1], CLAMP_CUBIC);

  const currentLineX2 = geo.dotX + (geo.lineX2 - geo.dotX) * lineProgress;
  const currentLineY2 = geo.dotY + (geo.lineY2 - geo.dotY) * lineProgress;

  if (progress <= 0) return null;

  return (
    <g>
      {/* Halo ring */}
      <circle
        cx={geo.dotX}
        cy={geo.dotY}
        r={HALO_RADIUS}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        opacity={dotOpacity * 0.4}
      />

      {/* Filled dot */}
      <circle
        cx={geo.dotX}
        cy={geo.dotY}
        r={DOT_RADIUS * Math.min(dotOpacity, 1)}
        fill={color}
        opacity={dotOpacity}
      />

      {/* Leader line */}
      {lineProgress > 0 && (
        <line
          x1={geo.dotX}
          y1={geo.dotY}
          x2={currentLineX2}
          y2={currentLineY2}
          stroke={color}
          strokeWidth={1.5}
          opacity={dotOpacity * 0.8}
          strokeLinecap="round"
        />
      )}

      {/* Label */}
      {labelOpacity > 0 && (
        <>
          <text
            x={geo.labelX}
            y={geo.labelY}
            textAnchor={geo.textAnchor}
            dominantBaseline={geo.textBaseline}
            fill={color}
            fontSize={fontSizes.label}
            fontFamily={fonts.display}
            fontWeight={fontWeights.semibold}
            opacity={labelOpacity}
          >
            {annotation.label}
          </text>
          {annotation.detail && (
            <text
              x={geo.labelX}
              y={
                geo.labelY +
                (geo.textBaseline === "text-before-edge"
                  ? fontSizes.label + 4
                  : geo.textBaseline === "text-after-edge"
                    ? -(fontSizes.label + 4)
                    : fontSizes.label + 4)
              }
              textAnchor={geo.textAnchor}
              dominantBaseline={geo.textBaseline}
              fill={color}
              fontSize={fontSizes.caption}
              fontFamily={fonts.body}
              fontWeight={fontWeights.regular}
              opacity={labelOpacity * 0.65}
            >
              {annotation.detail}
            </text>
          )}
        </>
      )}
    </g>
  );
});

CalloutAnnotation.displayName = "CalloutAnnotation";

// ── Highlight annotation ─────────────────────────────────────────────────────

interface HighlightAnnotationProps {
  annotation: AnnotationItem;
  progress: number;  // 0..1
  canvasWidth: number;
  canvasHeight: number;
}

const HighlightAnnotation = React.memo<HighlightAnnotationProps>(({
  annotation,
  progress,
  canvasWidth,
  canvasHeight,
}) => {
  const color = annotation.color ?? palette.gold;
  const opacity = interpolate(progress, [0, 0.5], [0, 1], CLAMP);

  const rectX = ((annotation.x - 5) / 100) * canvasWidth;
  const rectY = ((annotation.y - 3) / 100) * canvasHeight;
  const rectW = (10 / 100) * canvasWidth;
  const rectH = (6 / 100) * canvasHeight;

  if (progress <= 0) return null;

  return (
    <g>
      {/* Semi-transparent fill */}
      <rect
        x={rectX}
        y={rectY}
        width={rectW}
        height={rectH}
        fill={color}
        fillOpacity={0.25 * opacity}
        stroke={color}
        strokeWidth={2}
        strokeOpacity={0.6 * opacity}
        rx={3}
      />
      {/* Label */}
      {annotation.label && opacity > 0.1 && (
        <>
          <text
            x={(annotation.x / 100) * canvasWidth}
            y={rectY - 8}
            textAnchor="middle"
            dominantBaseline="text-after-edge"
            fill={color}
            fontSize={fontSizes.label}
            fontFamily={fonts.display}
            fontWeight={fontWeights.semibold}
            opacity={opacity}
          >
            {annotation.label}
          </text>
          {annotation.detail && (
            <text
              x={(annotation.x / 100) * canvasWidth}
              y={rectY - 8 - fontSizes.label - 4}
              textAnchor="middle"
              dominantBaseline="text-after-edge"
              fill={color}
              fontSize={fontSizes.caption}
              fontFamily={fonts.body}
              fontWeight={fontWeights.regular}
              opacity={opacity * 0.65}
            >
              {annotation.detail}
            </text>
          )}
        </>
      )}
    </g>
  );
});

HighlightAnnotation.displayName = "HighlightAnnotation";

// ── Trace annotation (self-drawing evolvePath ring + leader) ──────────────────

interface TraceAnnotationProps {
  annotation: AnnotationItem;
  progress: number;  // 0..1 combined reveal progress
  canvasWidth: number;
  canvasHeight: number;
}

const DEFAULT_TRACE_RADIUS = 100;

const TraceAnnotation = React.memo<TraceAnnotationProps>(({
  annotation,
  progress,
  canvasWidth,
  canvasHeight,
}) => {
  const color = annotation.color ?? palette.gold;
  const placement = annotation.placement ?? "right";
  const radius = annotation.radius ?? DEFAULT_TRACE_RADIUS;

  const cx = (annotation.x / 100) * canvasWidth;
  const cy = (annotation.y / 100) * canvasHeight;

  // Ring path centered on (cx, cy).
  const ringPath = useMemo(
    () => translatePath(makeCircle({ radius }).path, cx - radius, cy - radius),
    [cx, cy, radius],
  );

  // Leader direction by placement (from ring edge outward).
  const { dirX, dirY, textAnchor } = useMemo(() => {
    switch (placement) {
      case "left":
        return { dirX: -1, dirY: 0, textAnchor: "end" as const };
      case "top":
        return { dirX: 0, dirY: -1, textAnchor: "middle" as const };
      case "bottom":
        return { dirX: 0, dirY: 1, textAnchor: "middle" as const };
      case "right":
      default:
        return { dirX: 1, dirY: -0.35, textAnchor: "start" as const };
    }
  }, [placement]);

  // Staged reveal: ring draws (0→0.55), leader (0.5→0.78), label (0.78→1.0).
  const ringProgress = interpolate(progress, [0, 0.55], [0, 1], CLAMP_CUBIC);
  const leaderProgress = interpolate(progress, [0.5, 0.78], [0, 1], CLAMP_CUBIC);
  const labelOpacity = interpolate(progress, [0.78, 1.0], [0, 1], CLAMP_CUBIC);

  const ring = evolvePath(ringProgress, ringPath);

  // Leader runs from the ring edge out by LEADER_LENGTH in the placement dir.
  const edgeX = cx + dirX * radius;
  const edgeY = cy + dirY * radius;
  const leaderX = edgeX + dirX * LEADER_LENGTH;
  const leaderY = edgeY + dirY * LEADER_LENGTH;
  const curLeaderX = edgeX + (leaderX - edgeX) * leaderProgress;
  const curLeaderY = edgeY + (leaderY - edgeY) * leaderProgress;

  const labelX = leaderX + (dirX > 0 ? LABEL_GAP : dirX < 0 ? -LABEL_GAP : 0);
  const labelY = leaderY + (dirY > 0 ? LABEL_GAP : dirY < 0 ? -LABEL_GAP : 0);

  if (progress <= 0) return null;

  return (
    <g>
      {/* Self-drawing ring */}
      <path
        d={ringPath}
        fill="none"
        stroke={color}
        strokeWidth={4}
        strokeLinecap="round"
        strokeDasharray={ring.strokeDasharray}
        strokeDashoffset={ring.strokeDashoffset}
      />

      {/* Leader line (drawn from ring edge) */}
      {annotation.label && leaderProgress > 0 && (
        <line
          x1={edgeX}
          y1={edgeY}
          x2={curLeaderX}
          y2={curLeaderY}
          stroke={color}
          strokeWidth={2.5}
          strokeLinecap="round"
        />
      )}

      {/* Label + detail */}
      {annotation.label && labelOpacity > 0 && (
        <>
          <text
            x={labelX}
            y={labelY}
            textAnchor={textAnchor}
            dominantBaseline={dirY < 0 ? "text-after-edge" : dirY > 0 ? "text-before-edge" : "central"}
            fill={color}
            fontSize={fontSizes.label}
            fontFamily={fonts.display}
            fontWeight={fontWeights.semibold}
            opacity={labelOpacity}
          >
            {annotation.label}
          </text>
          {annotation.detail && (
            <text
              x={labelX}
              y={labelY + (dirY < 0 ? -(fontSizes.label + 4) : fontSizes.label + 4)}
              textAnchor={textAnchor}
              dominantBaseline={dirY < 0 ? "text-after-edge" : dirY > 0 ? "text-before-edge" : "central"}
              fill={color}
              fontSize={fontSizes.caption}
              fontFamily={fonts.body}
              fontWeight={fontWeights.regular}
              opacity={labelOpacity * 0.65}
            >
              {annotation.detail}
            </text>
          )}
        </>
      )}
    </g>
  );
});

TraceAnnotation.displayName = "TraceAnnotation";

// ── Main component ───────────────────────────────────────────────────────────

export const AnnotationSVGLayer = React.memo<AnnotationSVGLayerProps>(({
  annotations,
  activeCount,
  revealProgress,
  width,
  height,
  mode = "accumulate",
}) => {
  warnIf(
    annotations.length > 12,
    "AnnotationSVGLayer",
    `${annotations.length} annotations — beyond 12 the overlay becomes unreadable. ` +
      `Split into multiple ScrollyReveal segments.`,
  );

  // Determine which annotations are visible and at what opacity.
  // In accumulate mode: annotations 0..(activeCount-1) are visible.
  // In replace mode: only the current step's annotations are visible;
  //   the caller controls revealProgress to fade out prior annotations.
  const visibleAnnotations = useMemo(() => {
    return annotations.map((ann, idx) => {
      const progress = revealProgress(idx);
      const isInRange = mode === "accumulate"
        ? idx < activeCount
        : idx < activeCount;

      return {
        ann,
        idx,
        progress: isInRange ? progress : 0,
      };
    });
  }, [annotations, activeCount, revealProgress, mode]);

  return (
    <svg
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width,
        height,
        pointerEvents: "none",
        overflow: "visible",
      }}
      viewBox={`0 0 ${width} ${height}`}
    >
      {visibleAnnotations.map(({ ann, idx, progress }) => {
        if (progress <= 0) return null;

        const type = ann.type ?? "callout";

        if (type === "highlight") {
          return (
            <HighlightAnnotation
              key={ann.id || idx}
              annotation={ann}
              progress={progress}
              canvasWidth={width}
              canvasHeight={height}
            />
          );
        }

        if (type === "trace") {
          return (
            <TraceAnnotation
              key={ann.id || idx}
              annotation={ann}
              progress={progress}
              canvasWidth={width}
              canvasHeight={height}
            />
          );
        }

        // "callout" and "bracket" (bracket falls back to callout in v1)
        return (
          <CalloutAnnotation
            key={ann.id || idx}
            annotation={ann}
            progress={progress}
            canvasWidth={width}
            canvasHeight={height}
          />
        );
      })}
    </svg>
  );
});

AnnotationSVGLayer.displayName = "AnnotationSVGLayer";
