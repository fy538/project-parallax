// @composition-animation: delegated — pure SVG sub-component; AtlasPlate.tsx owns the hook.

/**
 * SeaLabelText — `<textPath>` rendering of a sea/ocean label along a
 * projected screen-space arc. Extracted from AtlasPlate.tsx (May 2026 split).
 *
 * Atlas-plate convention: tracked uppercase, muted color so the
 * water-body name reads as figure-ground reference rather than data.
 *
 * Defines a `<defs>` path the `<textPath>` follows. The path itself
 * stays invisible (stroke="none"); only the text along it renders.
 *
 * Hierarchy controls size + letterspacing — ocean basins get more
 * presence than seas / gulfs, matching atlas convention.
 *
 * React.memo'd: re-renders only when its primitive props change. The
 * parent (AtlasPlate) memoizes the `d` path string already, so this
 * sub-component is effectively static across non-camera-transition frames.
 */

import React from "react";
import { fonts, fontSizes, fontWeights } from "../../design/theme";

export interface SeaLabelTextProps {
  /** Unique SVG id for the path the textPath references. */
  pathId: string;
  /** SVG path data string (screen-space; pre-projected). */
  d: string;
  /** The label text (rendered uppercase). */
  label: string;
  hierarchy: "primary" | "secondary";
  dark: boolean;
  isVintage: boolean;
}

export const SeaLabelText = React.memo<SeaLabelTextProps>(({
  pathId,
  d,
  label,
  hierarchy,
  dark,
  isVintage,
}) => {
  // Muted color — water labels should read as cartographic chrome, not
  // editorial emphasis. Vintage register uses its own faded-brown tone.
  const color = isVintage
    ? "#7A6448"
    : dark
    ? "#5A5448"
    : "#9A8E78";
  const fontSize =
    hierarchy === "primary" ? fontSizes.label : fontSizes.caption;
  // Wide letterspacing is the atlas convention — labels SHOULD feel
  // stretched out across the water. Primary (oceans) gets more tracking.
  const tracking = hierarchy === "primary" ? 6 : 4;

  return (
    <>
      <defs>
        <path id={pathId} d={d} fill="none" stroke="none" />
      </defs>
      <text
        style={{
          fontFamily: fonts.display,
          fontSize,
          fontWeight: fontWeights.regular,
          letterSpacing: `${tracking}px`,
          textTransform: "uppercase",
          fill: color,
          opacity: 0.85,
          pointerEvents: "none",
        }}
      >
        <textPath
          href={`#${pathId}`}
          startOffset="50%"
          textAnchor="middle"
        >
          {label}
        </textPath>
      </text>
    </>
  );
});
SeaLabelText.displayName = "SeaLabelText";
