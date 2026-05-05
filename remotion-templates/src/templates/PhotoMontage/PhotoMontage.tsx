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
  staticFile,
} from "remotion";
import {
  fonts,
  fontSizes,
  layout,
  sec,
  duotone,
  contentArea,
} from "../../design/theme";
import { useThemeMode } from "../../hooks/useThemeMode";
import {
  fadeIn,
  fadeOut,
  kenBurnsDrift,
  exitFade,
  heroSpring,
  CLAMP,
} from "../../utils/animation";
import { Background } from "../../components/Background";
import { HeaderStrip } from "../../components/HeaderStrip";
import { FooterStrip } from "../../components/FooterStrip";
import { KenBurns } from "../../components/KenBurns";
import { useCompositionAnimation } from "../../hooks/useCompositionAnimation";
import { useDirection } from "../../hooks/useDirection";
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

  // Convert hex to RGB normalized (0-1)
  const hexToRgb = (hex: string): [number, number, number] => {
    const h = hex.replace("#", "");
    return [
      parseInt(h.substring(0, 2), 16) / 255,
      parseInt(h.substring(2, 4), 16) / 255,
      parseInt(h.substring(4, 6), 16) / 255,
    ];
  };

  const shadowRgb = hexToRgb(rampColors.shadows);
  const highlightRgb = hexToRgb(rampColors.highlights);

  // Proper duotone: slope maps luminance range to color range
  // At luminance 0 → shadow color, at luminance 1 → highlight color
  const slopeR = highlightRgb[0] - shadowRgb[0];
  const slopeG = highlightRgb[1] - shadowRgb[1];
  const slopeB = highlightRgb[2] - shadowRgb[2];

  return (
    <svg width="0" height="0" style={{ position: "absolute", pointerEvents: "none" }}>
      <defs>
        <filter id={filterId} colorInterpolationFilters="sRGB">
          {/* Step 1: Partial desaturation */}
          <feColorMatrix type="saturate" values={String(saturation)} />

          {/* Step 2: Convert to luminance */}
          <feColorMatrix
            type="matrix"
            values="0.2126 0.7152 0.0722 0 0
                    0.2126 0.7152 0.0722 0 0
                    0.2126 0.7152 0.0722 0 0
                    0      0      0      1 0"
          />

          {/* Step 3: Map luminance to duotone ramp (shadow → highlight) */}
          <feComponentTransfer>
            <feFuncR type="linear" slope={String(slopeR)} intercept={String(shadowRgb[0])} />
            <feFuncG type="linear" slope={String(slopeG)} intercept={String(shadowRgb[1])} />
            <feFuncB type="linear" slope={String(slopeB)} intercept={String(shadowRgb[2])} />
          </feComponentTransfer>
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
  const theme = useThemeMode("light");
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

  // Position map using contentArea for safety
  const area = contentArea("content", "generous");
  const positionStyle: React.CSSProperties = {
    position: "absolute",
    ...{
      "bottom-left": { bottom: area.bottom, left: area.left },
      "bottom-right": { bottom: area.bottom, right: area.right },
      "center": { top: "50%", left: "50%", transform: "translate(-50%, -50%)" },
      "top-right": { top: area.top, right: area.right },
      "top-left": { top: area.top, left: area.left },
    }[position],
  };

  // Style variants
  const styleProps: React.CSSProperties = {
    stat: {
      fontFamily: fonts.data,
      fontSize: fontSizes.h2,
      fontWeight: 700,
      color: theme.text.primary,
      textShadow: `0 2px 8px rgba(0, 0, 0, 0.5)`,
      lineHeight: 1.0,
      letterSpacing: 0,
    },
    label: {
      fontFamily: fonts.body,
      fontSize: fontSizes.label,
      fontWeight: 600,
      color: theme.text.primary,
      textTransform: "uppercase",
      letterSpacing: 2,
      textShadow: `0 1px 4px rgba(0, 0, 0, 0.5)`,
    },
    caption: {
      fontFamily: fonts.body,
      fontSize: fontSizes.caption,
      fontWeight: 400,
      color: theme.text.secondary,
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
  const theme = useThemeMode("light");
  const { durationInFrames } = useVideoConfig();
  const direction = useDirection(data._direction);
  const { style: compositionStyle } = useCompositionAnimation(direction.driftOptions);

  const transitionDurationFrames = sec(data.transitionDurationSec ?? 0.3);

  // Compute frame ranges for each image
  const imageRanges = useMemo(
    () => computeImageFrameRanges(data.images, transitionDurationFrames),
    [data.images, transitionDurationFrames]
  );

  // Determine which image(s) are visible at current frame (memoized)
  const { current, next } = useMemo(() => {
    let currentResult: { index: number; image: MontageImage; range: ImageFrameRange; progress: number } | null = null;
    let nextResult: { index: number; image: MontageImage; range: ImageFrameRange; progress: number } | null = null;

    for (let i = 0; i < imageRanges.length; i++) {
      const range = imageRanges[i];
      if (frame >= range.startFrame && frame < range.endFrame) {
        const progress = (frame - range.startFrame) / (range.endFrame - range.startFrame);
        currentResult = { index: i, image: data.images[i], range, progress };

        if (frame >= range.transitionStartFrame && i + 1 < imageRanges.length) {
          const nextRange = imageRanges[i + 1];
          const transitionProgress = (frame - range.transitionStartFrame) / transitionDurationFrames;
          nextResult = { index: i + 1, image: data.images[i + 1], range: nextRange, progress: transitionProgress };
        }
        break;
      }
    }

    return { current: currentResult, next: nextResult };
  }, [frame, imageRanges, data.images, transitionDurationFrames]);

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
    const bgTint = data.backgroundTint || theme.bg.base;

    // Image dimensions based on composite mode
    const isBgMode = image.compositeMode === "background";

    // KenBurns is opt-in (default true unless explicitly disabled)
    const enableKenBurns = image.kenBurns !== false;

    // Alternate directions for visual variety
    const kenBurnsDirections: Array<"zoom-in" | "zoom-out" | "pan-left" | "pan-right"> = [
      "zoom-in",
      "pan-left",
      "zoom-out",
      "pan-right",
    ];
    const kenBurnsDirection = kenBurnsDirections[range.imageIndex % kenBurnsDirections.length];

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

        {/* Actual image with treatment, wrapped in KenBurns if enabled */}
        {enableKenBurns ? (
          <KenBurns
            direction={kenBurnsDirection}
            intensity={3}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
            }}
          >
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
              }}
              alt=""
            />
          </KenBurns>
        ) : (
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
            }}
            alt=""
          />
        )}
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

  // ── Color-wash flash at cut points (documentary "found-footage" punctuation) ──
  // Fires for 2 frames at the boundary between images. Amber overlay at 30% opacity.
  // Only when transition === "cut" and we're within 1 frame of a cut.
  const cutFlashOpacity = useMemo(() => {
    if (data.transition !== "cut" && data.transition !== undefined) return 0;
    for (const range of imageRanges) {
      if (range.imageIndex === 0) continue; // no flash on first image
      const cutFrame = range.startFrame;
      if (frame >= cutFrame && frame < cutFrame + 2) {
        return interpolate(frame, [cutFrame, cutFrame + 2], [0.30, 0], CLAMP);
      }
    }
    return 0;
  }, [data.transition, frame, imageRanges]);

  // ── Crawling grain — backgroundPosition shifts deterministically per frame ──
  const grainOffsetX = (frame * 1.7) % 512;
  const grainOffsetY = (frame * 0.9) % 512;

  return (
    <Background
      variant="light"
      tint={direction.backgroundTint ?? data.backgroundTint}
      atmosphere={direction.atmosphere}
      atmosphereIntensity={direction.atmosphereIntensity}
    >
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

        {/* Crawling grain — drifts per frame for film-stock breathing */}
        <AbsoluteFill
          style={{
            backgroundImage: `url(${staticFile("assets/noise-512.png")})`,
            backgroundRepeat: "repeat",
            backgroundSize: "512px 512px",
            backgroundPosition: `${grainOffsetX}px ${grainOffsetY}px`,
            mixBlendMode: "overlay",
            opacity: 0.08,
            pointerEvents: "none",
            zIndex: 6,
          }}
        />

        {/* Color-wash flash at cuts — 2-frame amber overlay */}
        {cutFlashOpacity > 0 && (
          <AbsoluteFill
            style={{
              backgroundColor: "#E5A544",
              opacity: cutFlashOpacity,
              mixBlendMode: "screen",
              pointerEvents: "none",
              zIndex: 7,
            }}
          />
        )}

        {/* Source attribution (if provided) */}
        {data.source && (
          <div
            style={{
              position: "absolute",
              bottom: contentArea("content", "generous").bottom,
              left: contentArea("content", "generous").left,
              fontSize: fontSizes.meta,
              color: theme.text.muted,
              fontFamily: fonts.body,
              zIndex: 5,
              opacity: exitFade(frame, durationInFrames, 15),
            }}
          >
            {data.source}
          </div>
        )}
      </AbsoluteFill>
      {/* Brand strips */}
      <HeaderStrip mode="light" metadata={data.episode} />
      <FooterStrip mode="light" />
    </Background>
  );
};
