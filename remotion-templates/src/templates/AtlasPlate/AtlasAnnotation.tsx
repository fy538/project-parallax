// @composition-animation: delegated — pure SVG sub-component; AtlasPlate.tsx owns the hook.

/**
 * AtlasAnnotation — SVG label + leader-line + anchor-dot for a single
 * AtlasPlate annotation. Extracted from AtlasPlate.tsx (May 2026 split).
 *
 * React.memo'd with shallow-compare: skips re-render when the annotation
 * (stable ref from data), screen coords, opacity, and `dark` flag are
 * unchanged. Outside camera transitions screen coords are constant;
 * outside fade windows opacity is constant — so the sub-component
 * typically renders ~once per phase, not once per frame.
 *
 * All inputs are primitives or stable refs from the parent. NEVER
 * accepts derived objects (e.g., a fresh `{ x, y }` each render) as
 * props — those would defeat memo. The parent (`AtlasPlate.tsx`)
 * pre-projects screen coords inline and passes the numbers.
 */

import React from "react";
import {
  fonts,
  fontSizes,
  fontWeights,
  letterSpacing,
  palette,
} from "../../design/theme";
import { resolveColor as resolveAnnotationColor } from "../../components/MapAnnotations";
import type { MapAnnotation } from "../../components/MapAnnotations.types";

export interface AtlasAnnotationProps {
  annotation: MapAnnotation;
  /** Projected screen position — passed as primitives so React.memo shallowEqual works. */
  screenX: number;
  screenY: number;
  /** Pre-computed by parent so the sub-component is a pure presentation. */
  opacity: number;
  dark: boolean;
}

export const AtlasAnnotation = React.memo<AtlasAnnotationProps>(({
  annotation,
  screenX,
  screenY,
  opacity,
  dark,
}) => {
  const color = resolveAnnotationColor(annotation.hierarchy, annotation.emphasis, dark);
  const x = screenX;
  const y = screenY;
  const dx = annotation.leader?.dx ?? 0;
  const dy = annotation.leader?.dy ?? (annotation.hierarchy === "primary" ? -28 : annotation.hierarchy === "secondary" ? -22 : -16);
  const hasLeader = !!annotation.leader;

  const fontSize =
    annotation.hierarchy === "primary" ? fontSizes.h3
    : annotation.hierarchy === "secondary" ? fontSizes.body
    : fontSizes.caption;
  const fontWeight =
    annotation.hierarchy === "primary" ? fontWeights.semibold
    : annotation.hierarchy === "secondary" ? fontWeights.medium
    : fontWeights.regular;
  const fontFamily =
    annotation.hierarchy === "tertiary" ? fonts.metadata : fonts.display;
  const textTransform = annotation.hierarchy === "primary" ? "uppercase" : "none";
  const textAnchor =
    annotation.align === "left" ? "end"
    : annotation.align === "right" ? "start"
    : dx > 4 ? "start"
    : dx < -4 ? "end"
    : "middle";

  return (
    <g opacity={opacity} style={{ pointerEvents: "none" }}>
      {/* Anchor dot — small filled dot at the lon/lat. */}
      <circle cx={x} cy={y} r={annotation.hierarchy === "tertiary" ? 2 : 3.5} fill={color} />

      {/* Leader line. */}
      {hasLeader && (
        <line
          x1={x}
          y1={y}
          x2={x + dx}
          y2={y + dy}
          stroke={color}
          strokeOpacity={0.55}
          strokeWidth={annotation.hierarchy === "primary" ? 1.25 : annotation.hierarchy === "secondary" ? 1 : 0.75}
          strokeLinecap="round"
        />
      )}

      {/* Label. */}
      <text
        x={x + dx}
        y={y + dy}
        dominantBaseline="middle"
        textAnchor={textAnchor}
        style={{
          fontFamily,
          fontSize,
          fontWeight,
          letterSpacing: `${annotation.hierarchy === "primary" ? letterSpacing.h3 : letterSpacing.label}px`,
          textTransform,
          fill: color,
        }}
      >
        {annotation.label}
      </text>
      {annotation.sublabel && (
        <text
          x={x + dx}
          y={y + dy + fontSize * 0.9}
          dominantBaseline="middle"
          textAnchor={textAnchor}
          style={{
            fontFamily: fonts.metadata,
            fontSize: fontSizes.meta,
            fontWeight: fontWeights.regular,
            letterSpacing: `${letterSpacing.meta}px`,
            textTransform: "uppercase",
            fill: palette.taupe,
          }}
        >
          {annotation.sublabel}
        </text>
      )}
    </g>
  );
});
AtlasAnnotation.displayName = "AtlasAnnotation";
