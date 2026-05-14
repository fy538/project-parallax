/**
 * MapTextArc — editorial ocean-name typography along an arc.
 *
 * Mapbox's default water labels are placed algorithmically — they appear
 * where the algorithm thinks there's room, in a single straight line, in
 * Open Sans. Editorial cartography (NYT, FT, National Geographic,
 * Bartholomew) places ocean / sea / region names by hand, arched across
 * the body of water, at sparse letter-spacing, often in italic small-caps.
 *
 * This component renders Plex Sans text along an SVG arc that's
 * geographically positioned via Mapbox's `project()`. The arc is defined
 * by a START lat/long and END lat/long; we project both, then construct
 * an SVG path with a midpoint curvature.
 *
 * Editorial defaults:
 *   - Plex Sans Italic
 *   - Uppercase or title case (caller choice — default uppercase for oceans)
 *   - Letter-spacing 4 (very sparse — atlas register)
 *   - Color: muted text token at 75% opacity
 *
 * Usage:
 *   <MapGL ...>
 *     <MapTextArc
 *       start={[-30, 50]}
 *       end={[-15, 35]}
 *       label="NORTH ATLANTIC OCEAN"
 *     />
 *     <MapTextArc
 *       start={[60, 0]}
 *       end={[80, -20]}
 *       label="INDIAN OCEAN"
 *       curvature={0.3}
 *     />
 *   </MapGL>
 *
 * MUST be a child of <MapGL> — uses react-map-gl's `useMap` hook.
 *
 * Reference: NYT Upshot "How the war is shifting" maps; FT historical
 * supplements; National Geographic political-plate ocean labels.
 */

import React, { useId, useMemo } from "react";
import { useCurrentFrame } from "remotion";
import { useMap } from "react-map-gl/mapbox";
import {
  fonts,
  fontSizes,
  layout,
} from "../design/theme";
import { useThemeMode } from "../hooks/useThemeMode";

export interface MapTextArcProps {
  /** Start of the arc as [longitude, latitude]. */
  start: [number, number];
  /** End of the arc as [longitude, latitude]. */
  end: [number, number];
  /** Text to render along the arc. */
  label: string;
  /**
   * Arc curvature — 0 = straight line, 0.3 = subtle bow, 0.6 = strong bow.
   * Positive curves "above" the line (toward the smaller-y side); negative
   * curves below. Default 0.2.
   */
  curvature?: number;
  /**
   * Letter-spacing in pixels (default 4 — the atlas register). Use 6+ for
   * very sparse ocean names; 2 for sea / strait names.
   */
  letterSpacing?: number;
  /** Override font size in px (default `fontSizes.label` = 20). */
  fontSize?: number;
  /** Italic style (default true — matches water-label canon). */
  italic?: boolean;
  /** Use dark-mode text token. */
  dark?: boolean;
  /** Override opacity (default 0.55). */
  opacity?: number;
}

export const MapTextArc: React.FC<MapTextArcProps> = ({
  start,
  end,
  label,
  curvature = 0.2,
  letterSpacing = 4,
  fontSize,
  italic = true,
  dark = false,
  opacity = 0.55,
}) => {
  const { current: map } = useMap();
  const theme = useThemeMode(dark ? "dark" : "light");
  const pathId = useId().replace(/:/g, "_");
  // Re-render every frame so the arc tracks camera motion.
  const _frame = useCurrentFrame();
  void _frame;

  const pathD = useMemo(() => {
    if (!map) return null;
    const m = map.getMap();
    if (!m || typeof m.project !== "function") return null;

    const a = m.project(start);
    const b = m.project(end);
    if (
      !Number.isFinite(a.x) ||
      !Number.isFinite(a.y) ||
      !Number.isFinite(b.x) ||
      !Number.isFinite(b.y)
    ) {
      return null;
    }

    // Curve midpoint: midpoint offset perpendicular to the line by
    // `curvature × distance`.
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 1) return null;
    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2;
    const nx = -dy / dist;
    const ny = dx / dist;
    const cx = mx + nx * curvature * dist;
    const cy = my + ny * curvature * dist;

    return `M ${a.x.toFixed(1)} ${a.y.toFixed(1)} Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
  // eslint-disable-next-line react-hooks/exhaustive-deps -- _frame is the implicit dep
  }, [map, start, end, curvature, _frame]);

  if (!pathD) return null;

  return (
    <svg
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: layout.width,
        height: layout.height,
        pointerEvents: "none",
      }}
      width={layout.width}
      height={layout.height}
    >
      <defs>
        <path id={pathId} d={pathD} />
      </defs>
      <text
        fill={theme.text.muted}
        fontFamily={fonts.body}
        fontSize={fontSize ?? fontSizes.label}
        fontStyle={italic ? "italic" : "normal"}
        letterSpacing={letterSpacing}
        opacity={opacity}
      >
        <textPath href={`#${pathId}`} startOffset="50%" textAnchor="middle">
          {label}
        </textPath>
      </text>
    </svg>
  );
};
