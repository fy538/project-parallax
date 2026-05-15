// @composition-animation: delegated — pure SVG sub-component; AtlasPlate.tsx owns the hook.

/**
 * CountryLabel — single country label rendered at its centroid (or
 * displaced by the greedy collision placer). Extracted from
 * AtlasPlate.tsx (May 2026 split).
 *
 * Inputs are all primitives so React.memo's shallow-compare can skip
 * re-render when nothing on this country changed. The collision placer
 * runs once per phase; between phase transitions the dx/dy are stable.
 */

import React from "react";
import {
  fonts,
  fontSizes,
  fontWeights,
  letterSpacing,
  palette,
} from "../../design/theme";

export interface CountryLabelProps {
  label: string;
  /** Anchor (centroid) screen position. The leader, when shown, starts here. */
  anchorX: number;
  anchorY: number;
  /** Offset from anchor to label center, from the collision placer. */
  dx: number;
  dy: number;
  /** When true, render a thin leader line from anchor to label position. */
  showLeader: boolean;
  /** Text alignment from the placer (matches displacement direction). */
  align: "left" | "right" | "center";
  opacity: number;
  dark: boolean;
}

export const CountryLabel = React.memo<CountryLabelProps>(({
  label,
  anchorX,
  anchorY,
  dx,
  dy,
  showLeader,
  align,
  opacity,
  dark,
}) => {
  const color = dark ? palette.bone : palette.ink;
  const x = anchorX + dx;
  const y = anchorY + dy;
  const textAnchor =
    align === "left" ? "start" : align === "right" ? "end" : "middle";
  return (
    <g opacity={opacity} style={{ pointerEvents: "none" }}>
      {showLeader && (
        // Thin leader from polygon-edge-near-anchor toward the label.
        // Stops 6 px short of the label so it doesn't punch through text.
        <line
          x1={anchorX}
          y1={anchorY}
          x2={x - Math.sign(dx) * 6}
          y2={y - Math.sign(dy) * 4}
          stroke={color}
          strokeWidth={0.6}
          strokeOpacity={0.5}
        />
      )}
      <text
        x={x}
        y={y}
        dominantBaseline="middle"
        textAnchor={textAnchor}
        style={{
          fontFamily: fonts.display,
          fontSize: fontSizes.label,
          fontWeight: fontWeights.medium,
          letterSpacing: `${letterSpacing.label}px`,
          textTransform: "uppercase",
          fill: color,
        }}
      >
        {label}
      </text>
    </g>
  );
});
CountryLabel.displayName = "CountryLabel";
