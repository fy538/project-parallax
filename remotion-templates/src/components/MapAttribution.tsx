/**
 * MapAttribution — small editorial attribution chip for maps.
 *
 * Replaces Mapbox's default white "© Mapbox © OpenStreetMap Improve this
 * map" pill (which screams "this is a web app") with a quiet Plex Mono
 * small-caps chip in the Parallax metadata register. License-compliant:
 * Mapbox + OSM both require attribution VISIBLE on the rendered image,
 * but their guidelines permit placement and styling that fits the
 * publication's design system. NYT, FT, Reuters, Bloomberg, and
 * The Pudding all relocate / restyle attribution this way.
 *
 * Defaults to "MAPBOX · OSM" for stock vector-tile usage. Pass
 * `extras` to append data-source attribution (e.g., "NATURAL EARTH" for
 * topojson layers, "ECMWF" for weather data, etc.) — comma-separated.
 *
 * Place in `FooterStrip` or directly above it. Visual register:
 *   - Plex Mono 9pt
 *   - Uppercase, letter-spacing 1.5
 *   - Muted (text.muted) color
 *   - 65% opacity at rest
 *
 * Usage:
 *   <MapAttribution />                            // MAPBOX · OSM
 *   <MapAttribution extras={["NATURAL EARTH"]} /> // MAPBOX · OSM · NATURAL EARTH
 *   <MapAttribution extras={["NATURAL EARTH", "ECMWF"]} dark />
 *
 * References:
 *   - Mapbox attribution guidelines: https://docs.mapbox.com/help/getting-started/attribution/
 *   - OSM attribution requirements: https://www.openstreetmap.org/copyright
 *   - NYT/FT/Reuters convention: small mono chip in corner of map
 */

import React from "react";
import {
  fonts,
  fontSizes,
  layout,
  fontWeights,
  zIndex,
} from "../design/theme";
import { useThemeMode } from "../hooks/useThemeMode";

export interface MapAttributionProps {
  /** Extra source credits to append (e.g., ["NATURAL EARTH", "ECMWF"]). */
  extras?: ReadonlyArray<string>;
  /** Use dark-mode token colors instead of light. */
  dark?: boolean;
  /**
   * Override placement. Default `footer-strip` — renders inline for the
   * `FooterStrip` slot. Use `bottom-right` for templates that don't include
   * a FooterStrip (e.g., inset maps).
   */
  placement?: "footer-strip" | "bottom-right" | "bottom-left";
}

export const MapAttribution: React.FC<MapAttributionProps> = ({
  extras = [],
  dark = false,
  placement = "footer-strip",
}) => {
  const theme = useThemeMode(dark ? "dark" : "light");

  const parts = ["MAPBOX", "OSM", ...extras];
  const text = parts.join(" · ");

  const style: React.CSSProperties = {
    fontFamily: fonts.mono,
    fontSize: 9,
    fontWeight: fontWeights.regular,
    color: theme.text.muted,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    opacity: 0.65,
    whiteSpace: "nowrap",
    pointerEvents: "none",
  };

  if (placement === "footer-strip") {
    // Inline for FooterStrip placement — caller controls positioning.
    return <span style={style}>{text}</span>;
  }

  const safe = layout.safeAreaTier.generous;
  // Place ABOVE the FooterStrip metadata baseline (which sits in the bottom
  // safe-area band at ~y=safe.bottom). Adding 12px clearance lifts the
  // chip into the lower edge of the map content without colliding with
  // FooterStrip's "REC ▸ 00:00" / "FILED yyyy-mm-dd" metadata. z-index
  // ensures it composites above the FooterStrip if absolute-positioned
  // siblings disagree on layer order.
  const positional: React.CSSProperties = {
    position: "absolute",
    bottom: safe.bottom + 12,
    zIndex: zIndex.attribution,
    ...(placement === "bottom-right"
      ? { right: safe.right * 0.4 }
      : { left: safe.left * 0.4 }),
    ...style,
  };

  return <div style={positional}>{text}</div>;
};
