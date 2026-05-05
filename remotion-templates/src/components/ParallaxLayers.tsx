/**
 * ParallaxLayers — Cinematic depth through differential drift rates.
 *
 * Stacks layers with different pan/scale drift multipliers to create
 * depth — layers with higher driftRate move more, appearing closer.
 * A layer with driftRate=0 stays static (background).
 *
 * Usage:
 *   <ParallaxLayers
 *     layers={[
 *       { content: <Background />, driftRate: 0, zIndex: 0 },
 *       { content: <Midground />, driftRate: 1, zIndex: 1 },
 *       { content: <Foreground />, driftRate: 1.8, zIndex: 2 },
 *     ]}
 *     maxPan={12}
 *     driftAngle={30}
 *   />
 */

import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { CLAMP_QUAD_INOUT } from "../utils/animation";

interface ParallaxLayer {
  /** React content for this layer */
  content: React.ReactNode;
  /** Pan drift rate multiplier (0 = static, 1 = full drift, 2 = double drift). Default: 1 */
  driftRate?: number;
  /** Scale drift multiplier. Default: 1 */
  scaleRate?: number;
  /** Z-index for stacking order */
  zIndex?: number;
  /** Optional opacity */
  opacity?: number;
}

interface ParallaxLayersProps {
  layers: ParallaxLayer[];
  /** Max pan offset in pixels. Default: 12 */
  maxPan?: number;
  /** Max scale range (e.g., 1.03 means 1.0 → 1.03). Default: 1.03 */
  maxScale?: number;
  /** Drift direction angle in degrees (0 = right, 90 = down). Default: 30 */
  driftAngle?: number;
}

/**
 * Calculate pan offset from frame progress, drift rate, and direction angle.
 */
const calculatePan = (
  frame: number,
  totalFrames: number,
  maxPan: number,
  angle: number,
  rate: number
): { x: number; y: number } => {
  const progress = interpolate(frame, [0, totalFrames], [0, 1], CLAMP_QUAD_INOUT);
  const offset = maxPan * rate * progress;
  const radians = (angle * Math.PI) / 180;
  return {
    x: offset * Math.cos(radians),
    y: offset * Math.sin(radians),
  };
};

/**
 * Calculate scale from frame progress and scale rate.
 */
const calculateScale = (
  frame: number,
  totalFrames: number,
  maxScale: number,
  rate: number
): number => {
  const progress = interpolate(frame, [0, totalFrames], [0, 1], CLAMP_QUAD_INOUT);
  return 1 + (maxScale - 1) * rate * progress;
};

export const ParallaxLayers = React.memo<ParallaxLayersProps>(({
  layers,
  maxPan = 12,
  maxScale = 1.03,
  driftAngle = 30,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  return (
    <AbsoluteFill>
      {layers.map((layer, idx) => {
        const driftRate = layer.driftRate ?? 1;
        const scaleRate = layer.scaleRate ?? 1;
        const zIndex = layer.zIndex ?? idx;
        const opacity = layer.opacity ?? 1;

        const pan = calculatePan(frame, durationInFrames, maxPan, driftAngle, driftRate);
        const scale = calculateScale(frame, durationInFrames, maxScale, scaleRate);

        return (
          <div
            key={idx}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              zIndex,
              opacity,
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
              transformOrigin: "center center",
            }}
          >
            {layer.content}
          </div>
        );
      })}
    </AbsoluteFill>
  );
});

ParallaxLayers.displayName = "ParallaxLayers";
