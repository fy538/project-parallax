/**
 * Callout — Animated annotation layer for "Detective" format reveal moments.
 *
 * Renders SVG annotations (arrows, circles, brackets) over compositions with
 * staggered fade-in + draw animations.
 *
 * Usage:
 *   <Callout
 *     annotations={[
 *       { type: "arrow", x: 100, y: 100, x2: 300, y2: 200, label: "Growth" },
 *       { type: "circle", x: 500, y: 300, radius: 80 },
 *     ]}
 *     startFrame={30}
 *     staggerDelay={15}
 *   />
 */

import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { palette, fonts, fontSizes } from "../design/theme";
import { fadeIn } from "../utils/animation";

export interface AnnotationItem {
  type: "arrow" | "circle" | "bracket";
  /** Position (px from top-left of 1920×1080 frame) */
  x: number;
  y: number;
  /** For arrow: endpoint. For circle: radius. For bracket: height */
  x2?: number;
  y2?: number;
  radius?: number;
  height?: number;
  /** Optional text label */
  label?: string;
  /** Color override — defaults to palette.amber */
  color?: string;
}

export interface CalloutProps {
  annotations: AnnotationItem[];
  startFrame?: number;
  /** Stagger delay between annotations (frames) */
  staggerDelay?: number;
}

const STROKE_WIDTH_CIRCLE = 2;
const STROKE_WIDTH_BRACKET = 2;
const STROKE_WIDTH_ARROW = 1.5;
const LABEL_OFFSET = 12;

/**
 * Calculate the length of a path string for strokeDasharray animation.
 * For arrows: line length. For circles: circumference. For brackets: path length.
 */
const estimatePathLength = (annotation: AnnotationItem): number => {
  if (annotation.type === "arrow") {
    const dx = (annotation.x2 ?? 0) - annotation.x;
    const dy = (annotation.y2 ?? 0) - annotation.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
  if (annotation.type === "circle") {
    const radius = annotation.radius ?? 50;
    return 2 * Math.PI * radius;
  }
  if (annotation.type === "bracket") {
    const height = annotation.height ?? 100;
    // Bracket is ~3 segments: horizontal top, vertical side, horizontal bottom
    return (height + 40) * 2;
  }
  return 0;
};

/**
 * Generate SVG path for a bracket "]" shape at (x, y) with given height.
 */
const bracketPath = (x: number, y: number, height: number): string => {
  const cornerWidth = 20;
  const bracketWidth = 20;
  return `
    M ${x + cornerWidth} ${y}
    L ${x} ${y}
    L ${x} ${y + height}
    L ${x + cornerWidth} ${y + height}
  `;
};

/**
 * Arrowhead marker definition (for arrow endpoints).
 */
const ArrowheadMarker: React.FC<{ color: string }> = ({ color }) => (
  <defs>
    <marker
      id="arrowhead"
      markerWidth="10"
      markerHeight="10"
      refX="9"
      refY="3"
      orient="auto"
    >
      <polygon points="0 0, 10 3, 0 6" fill={color} />
    </marker>
  </defs>
);

/**
 * Single annotation renderer with draw animation.
 */
const Annotation: React.FC<{
  annotation: AnnotationItem;
  frame: number;
  startFrame: number;
  duration: number;
}> = ({ annotation, frame, startFrame, duration }) => {
  const color = annotation.color ?? palette.amber;
  const pathLength = estimatePathLength(annotation);

  // Opacity fade-in
  const opacity = fadeIn(frame, startFrame, 10);

  // Draw animation: strokeDasharray from full to 0 over duration
  const drawProgress = interpolate(
    frame,
    [startFrame, startFrame + duration],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const strokeDashoffset = pathLength * drawProgress;

  if (annotation.type === "arrow") {
    const { x, y, x2 = x + 100, y2 = y + 100, label } = annotation;
    const midX = (x + x2) / 2;
    const midY = (y + y2) / 2;

    return (
      <svg
        key={`arrow-${x}-${y}`}
        width="1920"
        height="1080"
        viewBox="0 0 1920 1080"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          pointerEvents: "none",
        }}
      >
        <ArrowheadMarker color={color} />
        <line
          x1={x}
          y1={y}
          x2={x2}
          y2={y2}
          stroke={color}
          strokeWidth={STROKE_WIDTH_ARROW}
          markerEnd="url(#arrowhead)"
          style={{
            opacity,
            strokeDasharray: pathLength,
            strokeDashoffset,
          }}
        />
        {label && (
          <text
            x={midX}
            y={midY - LABEL_OFFSET}
            fill={color}
            fontFamily={fonts.body}
            fontSize={fontSizes.label}
            textAnchor="middle"
            style={{
              opacity,
              fontWeight: 500,
              letterSpacing: 0.5,
            }}
          >
            {label}
          </text>
        )}
      </svg>
    );
  }

  if (annotation.type === "circle") {
    const { x, y, radius = 50, label } = annotation;

    return (
      <svg
        key={`circle-${x}-${y}`}
        width="1920"
        height="1080"
        viewBox="0 0 1920 1080"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          pointerEvents: "none",
        }}
      >
        <circle
          cx={x}
          cy={y}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={STROKE_WIDTH_CIRCLE}
          style={{
            opacity,
            strokeDasharray: pathLength,
            strokeDashoffset,
          }}
        />
        {label && (
          <text
            x={x}
            y={y - radius - LABEL_OFFSET}
            fill={color}
            fontFamily={fonts.body}
            fontSize={fontSizes.label}
            textAnchor="middle"
            style={{
              opacity,
              fontWeight: 500,
              letterSpacing: 0.5,
            }}
          >
            {label}
          </text>
        )}
      </svg>
    );
  }

  if (annotation.type === "bracket") {
    const { x, y, height = 100, label } = annotation;
    const path = bracketPath(x, y, height);

    return (
      <svg
        key={`bracket-${x}-${y}`}
        width="1920"
        height="1080"
        viewBox="0 0 1920 1080"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          pointerEvents: "none",
        }}
      >
        <path
          d={path}
          fill="none"
          stroke={color}
          strokeWidth={STROKE_WIDTH_BRACKET}
          style={{
            opacity,
            strokeDasharray: pathLength,
            strokeDashoffset,
          }}
        />
        {label && (
          <text
            x={x - 30}
            y={y + height / 2}
            fill={color}
            fontFamily={fonts.body}
            fontSize={fontSizes.label}
            textAnchor="end"
            style={{
              opacity,
              fontWeight: 500,
              letterSpacing: 0.5,
              dominantBaseline: "middle",
            }}
          >
            {label}
          </text>
        )}
      </svg>
    );
  }

  return null;
};

export const Callout: React.FC<CalloutProps> = ({
  annotations,
  startFrame = 0,
  staggerDelay = 15,
}) => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill
      style={{
        pointerEvents: "none",
      }}
    >
      {annotations.map((annotation, index) => {
        const itemStartFrame = startFrame + index * staggerDelay;
        const drawDuration = 20; // frames for draw animation

        return (
          <Annotation
            key={index}
            annotation={annotation}
            frame={frame}
            startFrame={itemStartFrame}
            duration={drawDuration}
          />
        );
      })}
    </AbsoluteFill>
  );
};
