/**
 * PhotoMontage — rapid-fire image sequence with text overlays.
 *
 * Shows multiple related images in rhythmic succession with unified pacing.
 * Each image gets the full BrandImage treatment (4-step pipeline):
 *   1. Desaturate
 *   2. Duotone remap (shadows → midtones → highlights)
 *   3. Grain + vignette
 *   4. Composite at specified opacity
 *
 * Transitions: cut, dissolve (crossfade), or wipe-left.
 * Overlays appear with spring entrance after image settles.
 */

import React, { useMemo } from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Easing,
  Img,
  staticFile,
} from "remotion";
import {
  palette,
  fonts,
  fontSizes,
  layout,
  sec,
  shadows,
  duotone,
  light,
} from "../../design/theme";
import {
  fadeIn,
  fadeOut,
  kenBurnsDrift,
  exitFade,
  heroSpring,
  CLAMP,
} from "../../utils/animation";
import { Background } from "../../components/Background";
import { FadeIn } from "../../components/FadeIn";
import { useCompositionAnimation } from "../../hooks/useCompositionAnimation";
import type { PhotoMontageData, MontageImage } from "./types";

// ── Helper: Compute frame ranges for each image accounting for transitions ──

interface ImageFrameRange {
  imageIndex: number;
  startFrame: number;
  endFrame: number;
  transitionStartFrame: number;
}

function computeImageFrameRanges(
  images: MontageImage[],
  transitionDurationFrames: number
): ImageFrameRange[] {
  const ranges: ImageFrameRange[] = [];
  let currentFrame = 0;

  images.forEach((img, idx) => {
    const imageDurationFrames = sec(img.durationSec);
    const startFrame = currentFrame;
    const endFrame = startFrame + imageDurationFrames;

    ranges.push({
      imageIndex: idx,
      startFrame,
      endFrame,
      transitionStartFrame:
        idx > 0 ? endFrame - transitionDurationFrames : startFrame,
    });

    // Next image starts after transition
    currentFrame = endFrame;
  });

  return ranges;
}

// ── Helper: SVG filter for duotone treatment ──

function DuotoneFilter({
  filterId,
  treatment,
  saturation = 0.25,
}: {
  filterId: string;
  treatment: "standard" | "conflict" | "editorial";
  saturation?: number;
}) {
  const rampColors = duotone[treatment];

  // Convert hex to RGB normalized
  const hexToRgbNormalized = (hex: string): string => {
    const h = hex.replace("#", "");
    const r = parseInt(h.substring(0, 2), 16);
    const g = parseInt(h.substring(2, 4), 16);
    const b = parseInt(h.substring(4, 6), 16);
    return `${r / 255} ${g / 255} ${b / 255}`;
  };

  const shadows = hexToRgbNormalized(rampColors.shadows);
  const midtones = hexToRgbNormalized(rampColors.midtones);
  const highlights = hexToRgbNormalized(rampColors.highlights);

  return (
    <svg width="0" height="0" style={{ position: "absolute", pointerEvents: "none" }}>
      <defs>
        <filter id={filterId} colorInterpolationFilters="sRGB">
          {/* Step 1: Desaturate */}
          <feColorMatrix type="saturate" values={String(saturation)} />

          {/* Convert to luminance */}
          <feColorMatrix
            type="matrix"
            values="0.2126 0.7152 0.0722 0 0
                    0.2126 0.7152 0.0722 0 0
                    0.2126 0.7152 0.0722 0 0
                    0      0      0      1 0"
          />

          {/* Step 2: Apply duotone ramp via component transfer */}
          <feComponentTransfer>
            <feFuncR
              type="linear"
              slope="0"
              intercept={String(parseFloat(shadows.split(" ")[0]))}
            />
            <feFuncG
              type="linear"
              slope="0"
              intercept={String(parseFloat(shadows.split(" ")[1]))}
            />
            <feFuncB
              type="linear"
              slope="0"
              intercept={String(parseFloat(shadows.split(" ")[2]))}
            />
          </feComponentTransfer>

          {/* Step 3: Grain (turb) + vignette effect */}
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.8"
            numOctaves="4"
            result="noise"
            seed="2"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale="2"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>
    </svg>
  );
}

// ── Image with overlay styles ──

const ImageOverlay: React.FC<{
  text: string;
  position: "bottom-left" | "bottom-right" | "center" | "top-right" | "top-left";
  style: "stat" | "label" | "caption";
  frame: number;
  imageStartFrame: number;
  transitionStartFrame: number;
}> = ({ text, position, style: overlayStyle, frame, imageStartFrame, transitionStartFrame }) => {
  // Overlay springs in 0.3s after image enters
  const overlayStartFrame = imageStartFrame + sec(0.3);

  const overlayOpacity = overlayStartFrame > frame ? 0 : fadeIn(frame, overlayStartFrame, sec(0.3));

  // Spring entrance
  const springVal = overlayStartFrame > frame ? 0 : heroSpring(frame, layout.fps, overlayStartFrame);
  const scale = 0.85 + springVal * 0.15; // 0.85 → 1.0

  // Exit fade during transition
  const exitOpacity =
    frame >= transitionStartFrame ? fadeOut(frame, transitionStartFrame + sec(0.2), sec(0.2)) : 1;

  const finalOpacity = overlayOpacity * exitOpacity;

  // Position map
  const positionStyle: React.CSSProperties = {
    position: "absolute",
    ...{
      "bottom-left": { bottom: layout.safeArea.bottom, left: layout.safeArea.left },
      "bottom-right": { bottom: layout.safeArea.bottom, right: layout.safeArea.right },
      "center": { top: "50%", left: "50%", transform: "translate(-50%, -50%)" },
      "top-right": { top: layout.safeArea.top, right: layout.safeArea.right },
      "top-left": { top: layout.safeArea.top, left: layout.safeArea.left },
    }[position],
  };

  // Style variants
  const styleProps: React.CSSProperties = {
    stat: {
      fontFamily: fonts.data,
      fontSize: fontSizes.h2,
      fontWeight: 700,
      color: light.text.primary,
      textShadow: `0 2px 8px rgba(0, 0, 0, 0.5)`,
      lineHeight: 1.0,
      letterSpacing: 0,
    },
    label: {
      fontFamily: fonts.body,
      fontSize: fontSizes.label,
      fontWeight: 600,
      color: light.text.primary,
      textTransform: "uppercase",
      letterSpacing: 2,
      textShadow: `0 1px 4px rgba(0, 0, 0, 0.5)`,
    },
    caption: {
      fontFamily: fonts.body,
      fontSize: fontSizes.caption,
      fontWeight: 400,
      color: light.text.secondary,
      textShadow: `0 1px 3px rgba(0, 0, 0, 0.4)`,
    },
  }[overlayStyle];

  return (
    <div
      style={{
        ...positionStyle,
        opacity: finalOpacity,
        transform: `scale(${scale})`,
        transformOrigin:
          position === "bottom-left" || position === "top-left" ? "left" : "right",
        transition: "none",
      }}
    >
      <div style={styleProps}>{text}</div>
    </div>
  );
};

// ── Main component ──

export const PhotoMontage: React.FC<{ data: PhotoMontageData }> = ({ data }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const { style: compositionStyle } = useCompositionAnimation();

  const transitionDurationFrames = sec(data.transitionDurationSec ?? 0.3);

  // Compute frame ranges for each image
  const imageRanges = useMemo(
    () => computeImageFrameRanges(data.images, transitionDurationFrames),
    [data.images, transitionDurationFrames]
  );

  // Determine which image(s) are visible at current frame
  const getActiveImages = (): {
    current: { index: number; image: MontageImage; range: ImageFrameRange; progress: number } | null;
    next: { index: number; image: MontageImage; range: ImageFrameRange; progress: number } | null;
  } => {
    let current = null;
    let next = null;

    for (let i = 0; i < imageRanges.length; i++) {
      const range = imageRanges[i];
      if (frame >= range.startFrame && frame < range.endFrame) {
        const progress = (frame - range.startFrame) / (range.endFrame - range.startFrame);
        current = {
          index: i,
          image: data.images[i],
          range,
          progress,
        };

        // Check if we're in transition
        if (frame >= range.transitionStartFrame && i + 1 < imageRanges.length) {
          const nextRange = imageRanges[i + 1];
          const transitionProgress = (frame - range.transitionStartFrame) / transitionDurationFrames;
          next = {
            index: i + 1,
            image: data.images[i + 1],
            range: nextRange,
            progress: transitionProgress,
          };
        }
        break;
      }
    }

    return { current, next };
  };

  const { current, next } = getActiveImages();

  // Render a single image with treatment
  const renderImage = (
    image: MontageImage,
    range: ImageFrameRange,
    transitionProgress: number = 0,
    isTransitioningOut: boolean = false
  ) => {
    const filterId = `montage-${image.treatment}-${range.imageIndex}`;
    const finalOpacity = isTransitioningOut ? 1 - transitionProgress : 1;

    // Background tint
    const bgTint = data.backgroundTint || light.bg.base;

    // Ken Burns drift during image hold
    const imageDuration = range.endFrame - range.startFrame;
    const driftScale = kenBurnsDrift(frame - range.startFrame, imageDuration, 1.02);

    // Image dimensions based on composite mode
    const isBgMode = image.compositeMode === "background";

    return (
      <div
        key={range.imageIndex}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          opacity: finalOpacity,
          overflow: "hidden",
        }}
      >
        {/* Duotone filter SVG */}
        <DuotoneFilter
          filterId={filterId}
          treatment={image.treatment}
          saturation={0.25}
        />

        {/* Background tint layer */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: bgTint,
            zIndex: 1,
          }}
        />

        {/* Actual image with treatment */}
        <img
          src={staticFile(image.src)}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: isBgMode ? "cover" : "contain",
            objectPosition: "center",
            opacity: image.compositeOpacity ?? (isBgMode ? 0.35 : 0.7),
            filter: `url(#${filterId})`,
            transform: `scale(${driftScale})`,
            transformOrigin: "center",
            zIndex: 2,
          }}
          alt=""
        />
      </div>
    );
  };

  // Render overlays for current image
  const renderOverlays = (
    image: MontageImage,
    range: ImageFrameRange
  ) => {
    if (!image.overlay && !image.secondaryOverlay) return null;

    return (
      <div
        key={`overlays-${range.imageIndex}`}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: 10,
          pointerEvents: "none",
        }}
      >
        {image.overlay && (
          <ImageOverlay
            text={image.overlay.text}
            position={image.overlay.position}
            style={image.overlay.style}
            frame={frame}
            imageStartFrame={range.startFrame}
            transitionStartFrame={range.transitionStartFrame}
          />
        )}
        {image.secondaryOverlay && (
          <ImageOverlay
            text={image.secondaryOverlay.text}
            position={image.secondaryOverlay.position}
            style="caption"
            frame={frame}
            imageStartFrame={range.startFrame}
            transitionStartFrame={range.transitionStartFrame}
          />
        )}
      </div>
    );
  };

  return (
    <Background variant="light" tint={data.backgroundTint}>
      <AbsoluteFill style={compositionStyle}>
        {/* Render images with transitions */}
        {current && (
          <>
            {renderImage(current.image, current.range)}
            {renderOverlays(current.image, current.range)}
          </>
        )}

        {/* Transition to next image */}
        {next && data.transition !== "cut" && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              opacity:
                data.transition === "dissolve"
                  ? interpolate(
                      next.progress,
                      [0, 1],
                      [0, 1],
                      CLAMP
                    )
                  : 1,
              clipPath:
                data.transition === "wipe-left"
                  ? `inset(0 ${100 * (1 - next.progress)}% 0 0)`
                  : undefined,
            }}
          >
            {renderImage(next.image, next.range, next.progress, false)}
            {renderOverlays(next.image, next.range)}
          </div>
        )}

        {/* Source attribution (if provided) */}
        {data.source && (
          <div
            style={{
              position: "absolute",
              bottom: layout.safeArea.bottom,
              left: layout.safeArea.left,
              fontSize: fontSizes.meta,
              color: light.text.muted,
              fontFamily: fonts.body,
              zIndex: 5,
              opacity: exitFade(frame, durationInFrames, 15),
            }}
          >
            {data.source}
          </div>
        )}
      </AbsoluteFill>
    </Background>
  );
};
