/**
 * KenBurns — cinematic slow pan and zoom effect for images and content.
 *
 * Adds a subtle, continuous camera motion (zoom-in with optional pan) over the
 * composition's full duration. The effect creates depth and visual motion without
 * distracting from content.
 *
 * Five directional modes:
 *   "zoom-in"   — 1.0 → 1.0 + intensity (slow zoom toward center)
 *   "zoom-out"  — 1.0 + intensity → 1.0 (slow zoom away from center)
 *   "pan-left"  — camera drifts left (increases xOffset over time)
 *   "pan-right" — camera drifts right (decreases xOffset)
 *   "pan-up"    — camera drifts up (increases yOffset)
 *   "drift"     — subtle zoom-in + gentle diagonal pan (realistic camera feel)
 *
 * Intensity (1-10, default 3):
 *   1-2   = very subtle (1-2% movement, ideal for backgrounds with text)
 *   3-4   = gentle (3-4% movement, default for images)
 *   5-7   = moderate (5-7% movement, dramatic images)
 *   8-10  = strong (8-10% movement, hero images that can withstand motion)
 *
 * Usage:
 *   <KenBurns direction="zoom-in" intensity={3}>
 *     <img src="..." />
 *   </KenBurns>
 *
 *   <KenBurns direction="drift" intensity={2}>
 *     <BrandImage src={...} />
 *   </KenBurns>
 *
 * Implementation uses Remotion's useCurrentFrame() and interpolate() with
 * linear easing (smooth, cinematic motion) and clamped extrapolation.
 */

import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { layout } from "../design/theme";

export interface KenBurnsProps {
  /**
   * Direction of camera motion.
   * "zoom-in" (default) — scale from 1.0 up to 1.0 + intensity/100
   * "zoom-out" — scale from 1.0 + intensity/100 down to 1.0
   * "pan-left" — translate right (camera moves left)
   * "pan-right" — translate left (camera moves right)
   * "pan-up" — translate down (camera moves up)
   * "drift" — subtle zoom-in + gentle diagonal pan for natural feel
   */
  direction?: "zoom-in" | "zoom-out" | "pan-left" | "pan-right" | "pan-up" | "drift";

  /**
   * Intensity of movement (1-10, default 3).
   * Scales the total amount of zoom or pan over the composition duration:
   *   intensity * (1% or px per 100px frame width) = total movement
   */
  intensity?: number;

  /**
   * Optional override for initial scale (for zoom directions).
   * If not provided, computed from direction + intensity.
   * Useful for layering effects or starting from a non-1.0 state.
   */
  startScale?: number;

  /**
   * Optional CSS applied to the outer container.
   * Use to set width/height, position, or other layout properties.
   */
  style?: React.CSSProperties;

  /**
   * Content rendered inside the transforming container.
   * Typically an image, but can be any React content.
   */
  children: React.ReactNode;
}

export const KenBurns: React.FC<KenBurnsProps> = ({
  direction = "zoom-in",
  intensity = 3,
  startScale,
  style,
  children,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  // Clamp intensity to reasonable range
  const intensityClamped = Math.max(1, Math.min(10, intensity));

  // Compute transform based on direction and progress (0 → 1)
  const progress = Math.min(1, frame / durationInFrames);
  const movementAmount = intensityClamped / 100; // Convert intensity to percentage

  let scale = 1;
  let translateX = 0;
  let translateY = 0;

  switch (direction) {
    case "zoom-in": {
      // Scale from 1.0 up to 1.0 + movementAmount
      const finalScale = (startScale ?? 1.0) + movementAmount;
      scale = interpolate(
        frame,
        [0, durationInFrames],
        [startScale ?? 1.0, finalScale],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
      );
      break;
    }

    case "zoom-out": {
      // Scale from 1.0 + movementAmount down to 1.0
      const startScaleVal = (startScale ?? 1.0) + movementAmount;
      scale = interpolate(
        frame,
        [0, durationInFrames],
        [startScaleVal, startScale ?? 1.0],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
      );
      break;
    }

    case "pan-left": {
      // Camera moves left, so translate right (positive X)
      const maxPan = layout.width * movementAmount * 0.5;
      translateX = interpolate(
        frame,
        [0, durationInFrames],
        [0, maxPan],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
      );
      break;
    }

    case "pan-right": {
      // Camera moves right, so translate left (negative X)
      const maxPan = layout.width * movementAmount * 0.5;
      translateX = interpolate(
        frame,
        [0, durationInFrames],
        [0, -maxPan],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
      );
      break;
    }

    case "pan-up": {
      // Camera moves up, so translate down (positive Y)
      const maxPan = layout.height * movementAmount * 0.5;
      translateY = interpolate(
        frame,
        [0, durationInFrames],
        [0, maxPan],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
      );
      break;
    }

    case "drift": {
      // Subtle zoom-in (half the intensity) + gentle diagonal pan
      const zoomAmount = movementAmount * 0.5;
      const finalScale = 1.0 + zoomAmount;
      scale = interpolate(
        frame,
        [0, durationInFrames],
        [1.0, finalScale],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
      );

      // Gentle diagonal pan — combines small X and Y movements
      // Use sine waves for natural, organic-feeling motion
      const panX = Math.sin(progress * Math.PI * 0.5) * layout.width * movementAmount * 0.3;
      const panY = Math.cos(progress * Math.PI * 0.5 + 0.5) * layout.height * movementAmount * 0.2;

      translateX = panX;
      translateY = panY;
      break;
    }

    default:
      // Fallback to zoom-in
      const finalScale = 1.0 + movementAmount;
      scale = interpolate(
        frame,
        [0, durationInFrames],
        [1.0, finalScale],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
      );
  }

  // Build transform string
  const transformValue =
    `scale(${scale}) translate(${translateX}px, ${translateY}px)`;

  return (
    <div
      style={{
        overflow: "hidden",
        width: "100%",
        height: "100%",
        ...style,
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          transform: transformValue,
          transformOrigin: "center center",
          willChange: "transform",
        }}
      >
        {children}
      </div>
    </div>
  );
};

// Re-export as default for convenience
export default KenBurns;
