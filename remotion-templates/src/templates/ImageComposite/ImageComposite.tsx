/**
 * ImageComposite — Treated photograph rendering with duotone pipeline.
 *
 * Renders historical or cinematic photos with selective color treatment,
 * grain overlay, and dynamic text positioning. Supports three layout variants:
 *   - background: Full-bleed image with Ken Burns drift
 *   - inset: Bordered frame centered on Background component
 *   - portrait: Person-focused with name/title strip
 *
 * Per IMAGES.md and POLISH.md.
 */

import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  Img,
  staticFile,
} from "remotion";
import {
  dark,
  light,
  fonts,
  fontSizes,
  fontWeights,
  letterSpacing,
  layout,
  sec,
  duotone as duotoneRamps,
} from "../../design/theme";
import { textShadow } from "../../utils/depth";
import {
  fadeIn,
  slideIn,
  kenBurnsDrift,
  exitFade,
} from "../../utils/animation";
import { Background } from "../../components/Background";
import { useCompositionAnimation } from "../../hooks/useCompositionAnimation";
import type { ImageCompositeData } from "./types";

/**
 * Variant: Background — Full-bleed image with Ken Burns drift and duotone overlay.
 */
const BackgroundVariant: React.FC<{ data: ImageCompositeData }> = ({ data }) => {
  const frame = useCurrentFrame();
  const { style: compStyle } = useCompositionAnimation({ noExit: true });
  const totalFrames = sec(data.durationSec || 6);

  // Duotone ramp selection
  const duotoneRamp = duotoneRamps[data.duotone || "standard"];

  // Ken Burns: subtle zoom drift
  const scale = kenBurnsDrift(frame, totalFrames, 1.03);

  // Text animation
  const textOpacity = fadeIn(frame, 0, 10) * exitFade(frame, totalFrames, 15);
  const textTranslate = slideIn(frame, 0, 30, 20);

  // Text position styles
  const textPositionStyle = (() => {
    switch (data.textPosition) {
      case "bottom-right":
        return { bottom: 80, right: 80 };
      case "center":
        return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
      case "bottom-left":
      default:
        return { bottom: 80, left: 80 };
    }
  })();

  return (
    <AbsoluteFill style={{ backgroundColor: dark.bg.base, overflow: "hidden" }}>
      <AbsoluteFill style={compStyle}>
        {/* Main image with Ken Burns drift */}
      <AbsoluteFill
        style={{
          transform: `scale(${scale})`,
          transformOrigin: "center",
          filter: "grayscale(100%) contrast(1.1)",
        }}
      >
        <Img src={staticFile(data.imagePath)} style={{ width: "100%", height: "100%" }} />
      </AbsoluteFill>

      {/* Duotone gradient overlay */}
      <AbsoluteFill
        style={{
          background: `
            linear-gradient(180deg,
              transparent 0%,
              ${duotoneRamp.highlights}33 20%,
              ${duotoneRamp.midtones}40 50%,
              ${duotoneRamp.shadows}60 100%
            )
          `,
          pointerEvents: "none",
        }}
      />

      {/* Film grain overlay */}
      <AbsoluteFill
        style={{
          backgroundImage: `url(${staticFile("assets/noise-512.png")})`,
          backgroundRepeat: "repeat",
          backgroundSize: "512px 512px",
          mixBlendMode: "overlay",
          opacity: data.grainOpacity ?? 0.12,
          pointerEvents: "none",
        }}
      />

      {/* Vignette overlay */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.4) 100%)`,
          pointerEvents: "none",
        }}
      />

      {/* Text content */}
      <AbsoluteFill style={{ pointerEvents: "none" }}>
        <div
          style={{
            position: "absolute",
            ...textPositionStyle,
            opacity: textOpacity,
            transform: `translateY(${textTranslate}px)`,
            color: dark.text.primary,
            textShadow: textShadow(true),
          }}
        >
          {data.title && (
            <div
              style={{
                fontFamily: fonts.display,
                fontSize: 48,
                fontWeight: fontWeights.bold,
                letterSpacing: letterSpacing.h2,
                lineHeight: 1.2,
                marginBottom: 12,
              }}
            >
              {data.title}
            </div>
          )}
          {data.subtitle && (
            <div
              style={{
                fontFamily: fonts.body,
                fontSize: fontSizes.body,
                fontWeight: fontWeights.regular,
                letterSpacing: letterSpacing.body,
                marginBottom: 8,
              }}
            >
              {data.subtitle}
            </div>
          )}
          {data.source && (
            <div
              style={{
                fontFamily: fonts.body,
                fontSize: fontSizes.meta,
                fontWeight: fontWeights.regular,
                letterSpacing: letterSpacing.meta,
                opacity: 0.7,
              }}
            >
              {data.source}
            </div>
          )}
        </div>
      </AbsoluteFill>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/**
 * Variant: Inset — Bordered frame on Background with grayscale + duotone.
 */
const InsetVariant: React.FC<{ data: ImageCompositeData }> = ({ data }) => {
  const frame = useCurrentFrame();
  const { style: compStyle } = useCompositionAnimation({ noExit: true });
  const totalFrames = sec(data.durationSec || 6);

  const duotoneRamp = duotoneRamps[data.duotone || "standard"];
  const frameOpacity = fadeIn(frame, 0, 10);
  const isDark = data.backgroundVariant !== "light";

  const frameWidth = (layout.width * 60) / 100; // 60% of frame width
  const frameHeight = (frameWidth * 9) / 16; // 16:9 aspect ratio
  const frameX = (layout.width - frameWidth) / 2;
  const frameY = (layout.height - frameHeight) / 2;

  const borderColor = isDark ? dark.text.muted : light.text.muted;
  const bgColor = isDark ? dark.bg.surface : light.bg.surface;

  return (
    <Background variant={isDark ? "dark" : "light"}>
      <AbsoluteFill style={compStyle}>
        {/* Frame */}
      <div
        style={{
          position: "absolute",
          left: frameX,
          top: frameY,
          width: frameWidth,
          height: frameHeight,
          border: `2px solid ${borderColor}`,
          padding: 8,
          overflow: "hidden",
          opacity: frameOpacity,
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            background: bgColor,
            position: "relative",
          }}
        >
          {/* Image with grayscale + duotone */}
          <Img
            src={staticFile(data.imagePath)}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              filter: "grayscale(100%) contrast(1.1)",
            }}
          />

          {/* Duotone overlay */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              background: `linear-gradient(135deg,
                ${duotoneRamp.shadows}40 0%,
                ${duotoneRamp.midtones}30 50%,
                ${duotoneRamp.highlights}20 100%)`,
              pointerEvents: "none",
            }}
          />
        </div>
      </div>

      {/* Title above frame */}
      {data.title && (
        <div
          style={{
            position: "absolute",
            left: frameX,
            top: frameY - 60,
            width: frameWidth,
            opacity: frameOpacity,
            color: isDark ? dark.text.primary : light.text.primary,
            fontFamily: fonts.display,
            fontSize: fontSizes.h3,
            fontWeight: fontWeights.semibold,
            letterSpacing: letterSpacing.h3,
          }}
        >
          {data.title}
        </div>
      )}

      {/* Caption below frame */}
      {(data.caption || data.source) && (
        <div
          style={{
            position: "absolute",
            left: frameX,
            top: frameY + frameHeight + 24,
            width: frameWidth,
            opacity: frameOpacity,
            color: isDark ? dark.text.secondary : light.text.secondary,
            fontFamily: fonts.body,
            fontSize: fontSizes.caption,
            fontWeight: fontWeights.regular,
            letterSpacing: letterSpacing.caption,
            lineHeight: 1.4,
          }}
        >
          {data.caption}
          {data.source && <> — {data.source}</>}
        </div>
      )}
      </AbsoluteFill>
    </Background>
  );
};

/**
 * Variant: Portrait — Person-focused image on left/right with name strip.
 */
const PortraitVariant: React.FC<{ data: ImageCompositeData }> = ({ data }) => {
  const frame = useCurrentFrame();
  const { style: compStyle } = useCompositionAnimation({ noExit: true });
  const totalFrames = sec(data.durationSec || 6);

  const duotoneRamp = duotoneRamps[data.duotone || "standard"];
  const imageOpacity = fadeIn(frame, 0, 10);
  const nameStripOpacity = fadeIn(frame, 10, 10);
  const isDark = data.backgroundVariant !== "light";

  const imageWidth = (layout.width * 40) / 100; // 40% of frame
  const imageHeight = layout.height; // Full height
  const imageX = 0; // Left side (can be changed to right side if needed)

  return (
    <Background variant={data.backgroundVariant === "light" ? "light" : "dark"}>
      <AbsoluteFill style={compStyle}>
        {/* Image container */}
      <AbsoluteFill
        style={{
          left: imageX,
          width: imageWidth,
          overflow: "hidden",
          opacity: imageOpacity,
        }}
      >
        <Img
          src={staticFile(data.imagePath)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            filter: "grayscale(100%) contrast(1.1)",
          }}
        />

        {/* Duotone overlay */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: `linear-gradient(90deg,
              ${duotoneRamp.shadows}30 0%,
              ${duotoneRamp.midtones}25 50%,
              ${duotoneRamp.highlights}15 100%)`,
            pointerEvents: "none",
          }}
        />

        {/* Name strip at bottom of image */}
        {(data.personName || data.personTitle) && (
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              width: "100%",
              backgroundColor: `rgba(0, 0, 0, 0.6)`,
              padding: "16px",
              opacity: nameStripOpacity,
              color: dark.text.primary,
              fontFamily: fonts.body,
              fontSize: fontSizes.label,
              fontWeight: fontWeights.semibold,
              letterSpacing: letterSpacing.label,
            }}
          >
            <div>{data.personName}</div>
            {data.personTitle && (
              <div
                style={{
                  fontSize: fontSizes.caption,
                  fontWeight: fontWeights.regular,
                  marginTop: 4,
                  opacity: 0.8,
                }}
              >
                {data.personTitle}
              </div>
            )}
          </div>
        )}
      </AbsoluteFill>

      {/* Text content on right side */}
      <div
        style={{
          position: "absolute",
          left: imageWidth + 60,
          top: 80,
          width: layout.width - imageWidth - 140,
          opacity: imageOpacity,
          color: isDark ? dark.text.primary : light.text.primary,
        }}
      >
        {data.title && (
          <div
            style={{
              fontFamily: fonts.display,
              fontSize: fontSizes.title,
              fontWeight: fontWeights.bold,
              letterSpacing: letterSpacing.h1,
              lineHeight: 1.2,
              marginBottom: 24,
            }}
          >
            {data.title}
          </div>
        )}
        {data.subtitle && (
          <div
            style={{
              fontFamily: fonts.body,
              fontSize: fontSizes.body,
              fontWeight: fontWeights.regular,
              letterSpacing: letterSpacing.body,
              lineHeight: 1.5,
              marginBottom: 16,
            }}
          >
            {data.subtitle}
          </div>
        )}
      </div>
      </AbsoluteFill>
    </Background>
  );
};

export const ImageComposite: React.FC<{ data: ImageCompositeData }> = ({ data }) => {
  switch (data.variant) {
    case "inset":
      return <InsetVariant data={data} />;
    case "portrait":
      return <PortraitVariant data={data} />;
    case "background":
    default:
      return <BackgroundVariant data={data} />;
  }
};
