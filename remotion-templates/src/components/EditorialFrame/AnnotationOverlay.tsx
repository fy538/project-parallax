/**
 * AnnotationOverlay — multi-callout overlay with leader lines.
 *
 * NYT-Upshot signature: a callout headline + italic dek + leader line pointing
 * to a specific data point. The chart template provides the data-point → pixel
 * mapping (since it knows its own geometry); this component handles the
 * rendering and positioning of the annotation text blocks + leader lines.
 *
 * Usage from a chart template:
 *
 *   const annotationPositions = data.frame?.annotations?.map((ann) => ({
 *     annotation: ann,
 *     targetPx: { x: barCenterX(ann.targetDataPoint), y: barTopY(ann.targetDataPoint) },
 *   }));
 *   <AnnotationOverlay positions={annotationPositions} chartRect={chartRect} frameNum={frame} />
 */

import React from "react";
import {
  fonts,
  fontSizes,
  fontWeights,
  layout,
  sec,
} from "../../design/theme";
import { fadeIn } from "../../utils/animation";
import { useThemeMode } from "../../hooks/useThemeMode";
import type { Annotation } from "./schema";
import type { Rect } from "./EditorialFrame";

interface AnnotationPosition {
  annotation: Annotation;
  /** Pixel position of the annotation's target data point. */
  targetPx: { x: number; y: number };
}

interface AnnotationOverlayProps {
  positions: AnnotationPosition[];
  chartRect: Rect;
  /** Current frame for animation timing. */
  frameNum: number;
  /** Frame at which annotations should begin appearing (after data settles).
   *  Defaults to sec(1.5) — reactive register: data settles first, THEN
   *  annotations name what's happening. */
  startFrame?: number;
  /** Delay (in frames) between successive annotations appearing. */
  stagger?: number;
}

export const AnnotationOverlay: React.FC<AnnotationOverlayProps> = ({
  positions,
  chartRect,
  frameNum,
  startFrame = sec(1.5),
  stagger = sec(0.4),
}) => {
  return (
    <>
      {positions.map((p, i) => (
        <SingleAnnotation
          key={i}
          annotation={p.annotation}
          targetPx={p.targetPx}
          chartRect={chartRect}
          frameNum={frameNum}
          startFrame={startFrame + i * stagger}
        />
      ))}
    </>
  );
};

// ── Single annotation render ─────────────────────────────────────────────────

const SingleAnnotation: React.FC<{
  annotation: Annotation;
  targetPx: { x: number; y: number };
  chartRect: Rect;
  frameNum: number;
  startFrame: number;
}> = ({ annotation, targetPx, chartRect, frameNum, startFrame }) => {
  const theme = useThemeMode("light");
  const opacity = fadeIn(frameNum, startFrame, sec(0.5));

  if (annotation.style === "event-flag") {
    return <EventFlag annotation={annotation} targetPx={targetPx} chartRect={chartRect} opacity={opacity} />;
  }

  // Default: callout with optional leader line
  const TEXT_W = 280;
  const GAP = 56;
  // Position text block relative to target. Annotations sit ABOVE the
  // data they describe so the leader line angles down to the target —
  // editorial convention (NYT Upshot, FT JBM). For "right" position,
  // anchor the block ~90px above the target so it clears neighboring
  // bar value labels and reads as commentary on the column.
  let textX = targetPx.x;
  let textY = targetPx.y;
  const position = annotation.position ?? "right";
  if (position === "right") {
    textX = targetPx.x + GAP;
    textY = targetPx.y - 90;
  } else if (position === "left") {
    textX = targetPx.x - GAP - TEXT_W;
    textY = targetPx.y - 90;
  } else if (position === "top") {
    textX = targetPx.x - TEXT_W / 2;
    textY = targetPx.y - GAP - 80;
  } else {
    textX = targetPx.x - TEXT_W / 2;
    textY = targetPx.y + GAP;
  }

  // Clamp to chartRect bounds (with small margin)
  const margin = 16;
  textX = Math.max(chartRect.x - 100, Math.min(textX, chartRect.x + chartRect.width - TEXT_W + 100));
  textY = Math.max(chartRect.y - 60, Math.min(textY, chartRect.y + chartRect.height + 40));

  const color = annotation.color ?? theme.text.primary;
  const showLeader = annotation.leaderLine !== false && annotation.style !== "inline";

  return (
    <>
      {showLeader && (
        <svg
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            opacity,
          }}
        >
          <line
            x1={targetPx.x}
            y1={targetPx.y}
            x2={position === "right" ? textX : textX + TEXT_W}
            y2={textY + 14}
            stroke={color}
            strokeWidth={1}
            strokeDasharray="2 3"
            opacity={0.7}
          />
          <circle cx={targetPx.x} cy={targetPx.y} r={3} fill={color} opacity={0.85} />
        </svg>
      )}
      <div
        style={{
          position: "absolute",
          left: textX,
          top: textY,
          width: TEXT_W,
          opacity,
        }}
      >
        <div
          style={{
            fontFamily: fonts.heading,
            fontSize: fontSizes.h3 - 6,
            fontWeight: fontWeights.bold,
            color: color,
            lineHeight: 1.2,
            marginBottom: annotation.dek ? 6 : 0,
          }}
        >
          {annotation.headline}
        </div>
        {annotation.dek && (
          <div
            style={{
              fontFamily: fonts.serifBody,
              fontStyle: "italic",
              fontSize: fontSizes.label - 1,
              color: theme.text.secondary,
              lineHeight: 1.35,
            }}
          >
            {annotation.dek}
          </div>
        )}
      </div>
    </>
  );
};

// ── Event flag (vertical line + small label) ─────────────────────────────────

const EventFlag: React.FC<{
  annotation: Annotation;
  targetPx: { x: number; y: number };
  chartRect: Rect;
  opacity: number;
}> = ({ annotation, targetPx, chartRect, opacity }) => {
  const theme = useThemeMode("light");
  const color = annotation.color ?? theme.text.muted;
  return (
    <>
      <svg
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          opacity,
        }}
      >
        <line
          x1={targetPx.x}
          y1={chartRect.y}
          x2={targetPx.x}
          y2={chartRect.y + chartRect.height}
          stroke={color}
          strokeWidth={1}
          strokeDasharray="3 4"
          opacity={0.45}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          left: targetPx.x + 8,
          top: chartRect.y + 8,
          fontFamily: fonts.mono,
          fontSize: fontSizes.meta,
          color,
          letterSpacing: 1.5,
          textTransform: "uppercase",
          opacity,
          maxWidth: 200,
        }}
      >
        {annotation.headline}
      </div>
    </>
  );
};
