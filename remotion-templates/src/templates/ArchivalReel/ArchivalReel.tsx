/**
 * ArchivalReel — film-stock register applied to a still image.
 *
 * Three canonical stocks: 8mm, 16mm, VHS. Each ships its own visual signature
 * (grain, color cast, gate weave / scanlines, scratches, frame jitter).
 *
 * Apollo 11 doctrine: when the source IS real archive film, set
 * `nativeFootage: true` to reduce treatment intensity by ~60%. Real film
 * already has its own grain; adding more produces the Instagram-filter look.
 *
 * @composition-animation: delegated
 *   Frame-by-frame jitter / gate weave / scanline scroll IS the motion;
 *   no Ken Burns drift on top.
 */

import React from "react";
import {
  AbsoluteFill,
  Img,
  useCurrentFrame,
  interpolate,
  random,
} from "remotion";
import { Background } from "../../components/Background";
import { TitleBlock } from "../../components/TitleBlock";
import { SourceAttribution } from "../../components/SourceAttribution";
import { useCompositionAnimation } from "../../hooks/useCompositionAnimation";
import { useDirection } from "../../hooks/useDirection";
import { resolveAssetSrc } from "../../utils/assetPath";
import {
  fontSizes,
  fontWeights,
  fonts,
  layout,
  palette,
} from "../../design/theme";
import type { ArchivalReelData, FilmStock } from "./types";

// ── Stock presets ──────────────────────────────────────────────────────────

interface StockPreset {
  /** CSS filter for color cast + saturation. */
  filter: string;
  /** Grain SVG turbulence base frequency — higher = finer grain. */
  grainBaseFrequency: number;
  /** Grain opacity at intensity=1.0. */
  grainMaxOpacity: number;
  /** Frame stepping for judder simulation. 1 = no judder, N = hold same frame for N renders. */
  judderEvery: number;
  /** Gate weave amplitude in px at intensity=1.0. */
  gateWeavePx: number;
  /** Scanline pattern on/off. */
  scanlines: boolean;
  /** Chroma bleed on/off (red/blue offset on saturated edges). */
  chromaBleed: boolean;
  /** Vertical scratches probability per frame at intensity=1.0. */
  scratchProbability: number;
  /** Vignette intensity 0-1. */
  vignette: number;
}

const STOCK_PRESETS: Record<FilmStock, StockPreset> = {
  "8mm": {
    // Kodachrome shift — warm magenta, slight saturation lift, soft luma.
    filter:
      "saturate(1.15) contrast(0.95) sepia(0.18) hue-rotate(-8deg) brightness(1.04)",
    grainBaseFrequency: 0.75,
    grainMaxOpacity: 0.42,
    judderEvery: 2, // 30/2 = 15 fps simulation of 18 fps source
    gateWeavePx: 4,
    scanlines: false,
    chromaBleed: false,
    scratchProbability: 0.018,
    vignette: 0.55,
  },
  "16mm": {
    // Neutral-to-cool, slight contrast bump, deeper blacks.
    filter: "saturate(0.92) contrast(1.08) brightness(0.97)",
    grainBaseFrequency: 1.2,
    grainMaxOpacity: 0.28,
    judderEvery: 1,
    gateWeavePx: 2,
    scanlines: false,
    chromaBleed: false,
    scratchProbability: 0.012,
    vignette: 0.32,
  },
  vhs: {
    // Saturation lift, soft luma, slight cyan in shadows.
    filter:
      "saturate(1.22) contrast(0.92) brightness(1.02) hue-rotate(2deg)",
    grainBaseFrequency: 1.8,
    grainMaxOpacity: 0.18,
    judderEvery: 1,
    gateWeavePx: 0,
    scanlines: true,
    chromaBleed: true,
    scratchProbability: 0.002,
    vignette: 0.18,
  },
};

// ── Component ──────────────────────────────────────────────────────────────

export const ArchivalReel: React.FC<{ data: ArchivalReelData }> = ({ data }) => {
  const frame = useCurrentFrame();
  const direction = useDirection(data._direction);
  // No drift — film artifacts ARE the motion.
  const { style: compStyle } = useCompositionAnimation({ noDrift: true });
  const mode = data.backgroundVariant ?? "dark";

  const preset = STOCK_PRESETS[data.stock];
  const baseIntensity = data.intensity ?? 0.5;
  // Apollo 11 doctrine: native footage gets ~60% less treatment.
  const intensity = data.nativeFootage ? baseIntensity * 0.4 : baseIntensity;
  const useGateWeave = data.gateWeave ?? data.stock !== "vhs";

  // Frame-stepping for judder simulation (8mm only by default).
  const steppedFrame = Math.floor(frame / preset.judderEvery) * preset.judderEvery;

  // Gate weave — deterministic per-frame x/y jitter.
  const weaveX = useGateWeave
    ? (random(`weave-x-${steppedFrame}`) - 0.5) * preset.gateWeavePx * intensity * 2
    : 0;
  const weaveY = useGateWeave
    ? (random(`weave-y-${steppedFrame}`) - 0.5) * preset.gateWeavePx * intensity
    : 0;

  // Scratch — vertical line at random x for occasional frames.
  const showScratch =
    random(`scratch-${steppedFrame}`) < preset.scratchProbability * intensity * 2;
  const scratchX = showScratch
    ? random(`scratch-x-${steppedFrame}`) * layout.width
    : 0;

  // Splice flash (8mm only) — rare bright flicker.
  const showFlash =
    data.stock === "8mm" &&
    random(`flash-${steppedFrame}`) < 0.003 * intensity;

  // VHS tracking band — scrolls vertically every ~120 frames.
  const trackingBandY =
    data.stock === "vhs"
      ? ((frame * 4) % (layout.height + 60)) - 60
      : -1000;

  const colorCastOverlay = data.colorCast;
  const imageFit = data.imageFit ?? "cover";

  return (
    <Background variant={mode}>
      <AbsoluteFill style={compStyle}>
        {/* Image with film treatment applied. */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            overflow: "hidden",
            transform: `translate(${weaveX}px, ${weaveY}px)`,
          }}
        >
          <Img
            src={resolveAssetSrc(data.imageUrl)}
            style={{
              width: "100%",
              height: "100%",
              objectFit: imageFit,
              filter: preset.filter,
            }}
          />
        </div>

        {/* Grain overlay — SVG turbulence noise multiplied over the image. */}
        <svg
          width={layout.width}
          height={layout.height}
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            mixBlendMode: "overlay",
            opacity: preset.grainMaxOpacity * intensity,
          }}
        >
          <filter id={`reel-grain-${data.stock}`}>
            <feTurbulence
              type="fractalNoise"
              baseFrequency={preset.grainBaseFrequency}
              numOctaves={2}
              seed={steppedFrame}
            />
            <feColorMatrix
              values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"
            />
          </filter>
          <rect
            x={0}
            y={0}
            width={layout.width}
            height={layout.height}
            filter={`url(#reel-grain-${data.stock})`}
          />
        </svg>

        {/* VHS scanlines — every 2px alternating dark band. */}
        {preset.scanlines && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage:
                "repeating-linear-gradient(180deg, transparent 0px, transparent 2px, rgba(0,0,0,0.18) 2px, rgba(0,0,0,0.18) 3px)",
              opacity: intensity * 0.9,
              mixBlendMode: "multiply",
              pointerEvents: "none",
            }}
          />
        )}

        {/* VHS chroma bleed — red/blue offset edge halo. */}
        {preset.chromaBleed && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              boxShadow: `inset 2px 0 0 rgba(200,40,40,${0.12 * intensity}), inset -2px 0 0 rgba(40,80,200,${0.12 * intensity})`,
              pointerEvents: "none",
              mixBlendMode: "screen",
            }}
          />
        )}

        {/* VHS tracking band — horizontal noise band scrolling vertically. */}
        {data.stock === "vhs" && (
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: trackingBandY,
              height: 28,
              background:
                "linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.18) 40%, rgba(255,255,255,0.28) 50%, rgba(255,255,255,0.18) 60%, transparent 100%)",
              mixBlendMode: "overlay",
              pointerEvents: "none",
              opacity: intensity * 0.6,
            }}
          />
        )}

        {/* Vertical scratch (occasional). */}
        {showScratch && (
          <div
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: scratchX,
              width: 1.5,
              background: "rgba(255,255,255,0.4)",
              pointerEvents: "none",
            }}
          />
        )}

        {/* 8mm splice flash — full-frame brightness pulse. */}
        {showFlash && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(255,250,230,0.35)",
              pointerEvents: "none",
              mixBlendMode: "screen",
            }}
          />
        )}

        {/* Vignette — soft corner darken (stock-specific intensity). */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `radial-gradient(ellipse at center, transparent ${60 - preset.vignette * 30}%, rgba(0,0,0,${preset.vignette * intensity}) 100%)`,
            pointerEvents: "none",
          }}
        />

        {/* Custom color cast overlay (if specified). */}
        {colorCastOverlay && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: colorCastOverlay,
              opacity: intensity * 0.25,
              mixBlendMode: "multiply",
              pointerEvents: "none",
            }}
          />
        )}

        {/* Title block — rendered AFTER all film effects so it sits on top
            of the treated image, not underneath grain/vignette/scanlines. */}
        {data.title && (
          <TitleBlock
            title={data.title}
            subtitle={data.subtitle}
            mode={mode}
            syncPoints={direction.syncPoints}
          />
        )}

        {/* Caption strip — film stock + dateline + source ("16MM · 1968 · NBC"). */}
        {data.caption && (
          <div
            style={{
              position: "absolute",
              bottom: 60,
              left: 60,
              fontFamily: fonts.mono,
              fontSize: fontSizes.caption,
              color: palette.bone,
              letterSpacing: 2,
              textTransform: "uppercase",
              padding: "8px 16px",
              background: "rgba(0,0,0,0.55)",
              fontWeight: fontWeights.medium,
            }}
          >
            {[
              data.stock.toUpperCase(),
              data.caption.dateline,
              data.caption.source ?? data.caption.text,
            ]
              .filter(Boolean)
              .join(" · ")}
          </div>
        )}

        <SourceAttribution source={data.source} mode={mode} prefix="Source · " />
      </AbsoluteFill>
    </Background>
  );
};
