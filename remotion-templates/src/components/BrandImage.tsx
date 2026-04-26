/**
 * BrandImage — image treatment component implementing BRAND.md's 4-step pipeline.
 *
 * Every image in a Parallax video passes through the same treatment:
 *   1. Desaturate (20-30% of original color)
 *   2. Duotone remap (shadows → midtones → highlights from brand palette)
 *   3. Grain + vignette (film texture, edge darkening)
 *   4. Composite (placed at specified opacity into the composition)
 *
 * Uses SVG filters for GPU-accelerated, resolution-independent treatment.
 * The Python CLI (tools/brand-treatment/treat.py) produces identical output
 * for preview/batch processing outside Remotion.
 *
 * Usage:
 *   <BrandImage src={staticFile("assets/ep01/tsmc-aerial.jpg")} />
 *   <BrandImage src={staticFile("assets/ep01/pearl-harbor.jpg")} ramp="conflict" />
 *   <BrandImage src={url} ramp="editorial" composite="inset" opacity={0.7} />
 *
 * Composite modes:
 *   "background" — full-bleed behind content, 25-40% opacity (default 0.35)
 *   "inset"      — confined panel, 60-80% opacity (default 0.7)
 *   "antipode"   — half-frame for comparison, 40-50% opacity (default 0.45)
 *   "raw"        — no opacity override, uses the opacity prop directly
 */

import React, { useMemo } from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { duotone, palette } from "../design/theme";

// ── Types ────────────────────────────────────────────────────────────────────

type DuotoneRamp = keyof typeof duotone;

type CompositeMode = "background" | "inset" | "antipode" | "raw";

interface BrandImageProps {
  /** Image source URL or staticFile path */
  src: string;
  /** Duotone color ramp (default: "standard") */
  ramp?: DuotoneRamp;
  /** Composite mode — sets default opacity per BRAND.md */
  composite?: CompositeMode;
  /** Override opacity (0-1). If omitted, uses composite mode default. */
  opacity?: number;
  /** Desaturation level (0-1, default 0.25 = 25% of original color) */
  saturation?: number;
  /** Grain intensity (0-1, default 0.10) */
  grainIntensity?: number;
  /** Vignette strength (0-1, default 0.18) */
  vignetteStrength?: number;
  /** Disable grain overlay */
  noGrain?: boolean;
  /** Disable vignette */
  noVignette?: boolean;
  /** CSS object-fit (default: "cover") */
  fit?: React.CSSProperties["objectFit"];
  /** CSS object-position (default: "center") */
  position?: string;
  /** Alt text for accessibility */
  alt?: string;
  /** Additional style applied to the container */
  style?: React.CSSProperties;
  /** Children rendered on top of the image */
  children?: React.ReactNode;
}

// ── Composite mode opacity defaults (from BRAND.md) ─────────────────────────

const COMPOSITE_OPACITY: Record<CompositeMode, number> = {
  background: 0.35, // 25-40% range, defaulting to middle
  inset: 0.7,       // 60-80% range
  antipode: 0.45,   // 40-50% range
  raw: 1.0,
};

// ── Helper: hex to RGB for SVG filter ────────────────────────────────────────

function hexToRgbNormalized(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.substring(0, 2), 16) / 255,
    parseInt(h.substring(2, 4), 16) / 255,
    parseInt(h.substring(4, 6), 16) / 255,
  ];
}

// ── Component ────────────────────────────────────────────────────────────────

export const BrandImage: React.FC<BrandImageProps> = ({
  src,
  ramp = "standard",
  composite = "background",
  opacity,
  saturation = 0.25,
  grainIntensity = 0.10,
  vignetteStrength = 0.18,
  noGrain = false,
  noVignette = false,
  fit = "cover",
  position = "center",
  alt = "",
  style,
  children,
}) => {
  const finalOpacity = opacity ?? COMPOSITE_OPACITY[composite];

  // Get duotone colors
  const rampColors = duotone[ramp];
  const shadows = hexToRgbNormalized(rampColors.shadows);
  const midtones = hexToRgbNormalized(rampColors.midtones);
  const highlights = hexToRgbNormalized(rampColors.highlights);

  // Unique filter ID to avoid collisions when multiple BrandImages are on screen
  const filterId = useMemo(
    () => `brand-treatment-${ramp}-${Math.random().toString(36).slice(2, 8)}`,
    [ramp]
  );

  /**
   * SVG filter chain:
   *   1. feColorMatrix (saturate) — reduces saturation
   *   2. feComponentTransfer — applies the three-stop duotone ramp
   *      by mapping luminance through custom transfer functions
   *
   * The duotone is implemented as a piecewise-linear transfer function:
   *   - Input luminance 0.0 → shadows color
   *   - Input luminance 0.5 → midtones color
   *   - Input luminance 1.0 → highlights color
   */

  return (
    <AbsoluteFill style={{ opacity: finalOpacity, ...style }}>
      {/* SVG filter definitions */}
      <svg
        width="0"
        height="0"
        style={{ position: "absolute", pointerEvents: "none" }}
      >
        <defs>
          <filter id={filterId} colorInterpolationFilters="sRGB">
            {/* Step 1: Desaturate */}
            <feColorMatrix type="saturate" values={String(saturation)} />

            {/* Convert to luminance for duotone mapping */}
            <feColorMatrix
              type="matrix"
              values="0.2126 0.7152 0.0722 0 0
                      0.2126 0.7152 0.0722 0 0
                      0.2126 0.7152 0.0722 0 0
                      0      0      0      1 0"
            />

            {/* Step 2: Duotone remap via component transfer */}
            <feComponentTransfer>
              <feFuncR
                type="table"
                tableValues={`${shadows[0]} ${midtones[0]} ${highlights[0]}`}
              />
              <feFuncG
                type="table"
                tableValues={`${shadows[1]} ${midtones[1]} ${highlights[1]}`}
              />
              <feFuncB
                type="table"
                tableValues={`${shadows[2]} ${midtones[2]} ${highlights[2]}`}
              />
            </feComponentTransfer>
          </filter>
        </defs>
      </svg>

      {/* The treated image */}
      <Img
        src={src}
        alt={alt}
        style={{
          width: "100%",
          height: "100%",
          objectFit: fit,
          objectPosition: position,
          filter: `url(#${filterId})`,
        }}
      />

      {/* Step 3a: Grain overlay */}
      {!noGrain && (
        <AbsoluteFill
          style={{
            backgroundImage: `url(${staticFile("assets/noise-512.png")})`,
            backgroundRepeat: "repeat",
            backgroundSize: "512px 512px",
            mixBlendMode: "overlay",
            opacity: grainIntensity,
            pointerEvents: "none",
          }}
        />
      )}

      {/* Step 3b: Vignette */}
      {!noVignette && (
        <AbsoluteFill
          style={{
            background: `radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,${vignetteStrength}) 100%)`,
            pointerEvents: "none",
          }}
        />
      )}

      {/* Content rendered on top */}
      {children}
    </AbsoluteFill>
  );
};

export default BrandImage;
