/**
 * MapInset — small locator-map overlay for map templates.
 *
 * A globe-projection mini-map (default 240×240px) in a frame corner with a
 * dot marking where the parent map's camera is looking. Standard NYT / FT /
 * Reuters editorial cartography device: gives the viewer instant context for
 * "where on the planet am I?" without changing the main shot.
 *
 * Usage from a template:
 *   <MapInset
 *     parentCamera={{ longitude: 120, latitude: 24, zoom: 5 }}
 *     position="tl"
 *     dark={data.backgroundVariant === "dark"}
 *   />
 *
 * Place the inset OUTSIDE the parent `<MapGL>` (it's its own map), but
 * INSIDE the template's `<AbsoluteFill>` so its absolute positioning
 * resolves against the frame.
 *
 * Dossier: references/template-research/map-annotations.md § MapInset
 */

import React from "react";
import { Marker } from "react-map-gl/mapbox";
import { MapGL } from "./MapGL";
import { layout, palette, shadows } from "../design/theme";

// ── Constants ─────────────────────────────────────────────────────────────

const DEFAULT_SIZE = 240; // px — ~12.5% of frame width
const DEFAULT_GLOBE_ZOOM = 0; // shows the whole globe
const SAFE_PADDING = 56; // matches HeaderStrip / FooterStrip safe area

/** Pin-dot color — rust (Parallax accent). */
const PIN_COLOR = palette.rust;

// ── Position resolution ───────────────────────────────────────────────────

export type InsetPosition = "tl" | "tr" | "bl" | "br";

/**
 * Resolve absolute pixel position for the inset container. Exported for
 * tests — the math is small but worth covering since corner-positioning
 * errors land *exactly* on the brand chrome (HeaderStrip / FooterStrip).
 *
 * Default position is **top-left** — it's the only corner that doesn't
 * collide with brand chrome (HeaderStrip lives top-right with metadata;
 * FooterStrip lives bottom with REC indicator and scale).
 */
export const resolveInsetPosition = (
  position: InsetPosition,
  size: number,
  frameWidth: number = layout.width,
  frameHeight: number = layout.height,
  padding: number = SAFE_PADDING,
): { top: number; left: number } => {
  const fromBottom = frameHeight - size - padding;
  const fromRight = frameWidth - size - padding;
  switch (position) {
    case "tl":
      return { top: padding, left: padding };
    case "tr":
      return { top: padding, left: fromRight };
    case "bl":
      return { top: fromBottom, left: padding };
    case "br":
      return { top: fromBottom, left: fromRight };
  }
};

// ── Props ─────────────────────────────────────────────────────────────────

export interface MapInsetProps {
  /** Parent map's camera (or just the point of interest). */
  parentCamera: { longitude: number; latitude: number; zoom?: number };
  /** Side of the frame. Default "tl" (top-left — avoids brand chrome). */
  position?: InsetPosition;
  /** Side length in pixels. Default 240. */
  size?: number;
  /** Dark mode — uses Meridian Dark style + bone-toned chrome. */
  dark?: boolean;
  /** Frame around the inset. Default true. */
  framed?: boolean;
}

// ── Component ─────────────────────────────────────────────────────────────

export const MapInset: React.FC<MapInsetProps> = ({
  parentCamera,
  position = "tl",
  size = DEFAULT_SIZE,
  dark = false,
  framed = true,
}) => {
  const { top, left } = resolveInsetPosition(position, size);

  // Pin emphasis: small filled dot + ring. Rust on light, rust on dark
  // (works against both palettes — that's why we picked it as accent).
  const pinRadius = 6;
  const ringRadius = 16;
  const frameBorder = framed
    ? `1px solid ${dark ? palette.bone : palette.ink}`
    : "none";

  return (
    <div
      style={{
        position: "absolute",
        top,
        left,
        width: size,
        height: size,
        overflow: "hidden",
        border: frameBorder,
        boxShadow: dark ? shadows.textLift : shadows.textLiftLight,
        // Subtle background tint behind the map for letterboxing during
        // the brief tile-load window.
        backgroundColor: dark ? palette.ink : palette.bone,
      }}
    >
      <MapGL
        longitude={0}
        latitude={20}
        zoom={DEFAULT_GLOBE_ZOOM}
        pitch={0}
        bearing={0}
        globe
        terrain={false}
        dark={dark}
        width={size}
        height={size}
      >
        <Marker
          longitude={parentCamera.longitude}
          latitude={parentCamera.latitude}
          anchor="center"
        >
          <div
            style={{
              position: "relative",
              pointerEvents: "none",
            }}
          >
            {/* Outer ring — softer than the pin so the pin pops. */}
            <div
              style={{
                position: "absolute",
                width: ringRadius * 2,
                height: ringRadius * 2,
                borderRadius: "50%",
                border: `1.5px solid ${PIN_COLOR}`,
                opacity: 0.55,
                transform: "translate(-50%, -50%)",
              }}
            />
            {/* Filled pin. */}
            <div
              style={{
                position: "absolute",
                width: pinRadius * 2,
                height: pinRadius * 2,
                borderRadius: "50%",
                backgroundColor: PIN_COLOR,
                transform: "translate(-50%, -50%)",
                boxShadow: shadows.accentGlowSm(PIN_COLOR),
              }}
            />
          </div>
        </Marker>
      </MapGL>
    </div>
  );
};
