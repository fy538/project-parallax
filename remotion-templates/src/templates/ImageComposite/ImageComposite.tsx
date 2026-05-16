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
  interpolate,
  Img,
  staticFile,
} from "remotion";
import {
  fonts,
  fontSizes,
  fontWeights,
  letterSpacing,
  layout,
  sec,
  duotone as duotoneRamps,
  palette,
  textMaxWidth,
  shadows,
} from "../../design/theme";
import {
  fadeIn,
  slideIn,
  exitFade,
  heroSpring,
  scaleReveal,
  CLAMP,
} from "../../utils/animation";
import { Background } from "../../components/Background";
import {
  analyticalBackgroundBase,
  resolveAnalyticalBackgroundVariant,
  transparentBackdropRequested,
} from "../../utils/segmentBackdrop";
import { HeaderStrip } from "../../components/HeaderStrip";
import { FooterStrip } from "../../components/FooterStrip";
import { useCompositionAnimation } from "../../hooks/useCompositionAnimation";
import { useDirection } from "../../hooks/useDirection";
import { useThemeMode } from "../../hooks/useThemeMode";
import { resolveAssetSrc } from "../../utils/assetPath";
import type { ImageCompositeData } from "./types";

/**
 * Variant: Background — Full-bleed image with Ken Burns drift and duotone overlay.
 */
const BackgroundVariant: React.FC<{ data: ImageCompositeData }> = ({ data }) => {
  const frame = useCurrentFrame();
  // HOLD_MOTION_REGISTER Register C — photo plates use documentary Ken Burns
  // (POLISH.md D20). Pre-cleanup: this variant manually drifted ONLY the
  // photo at scale 1.03, while text stayed fixed — a Gestalt Common Fate
  // violation (foreground moves, background doesn't → independent layer
  // drifts → motion-sickness risk per OpenNews 2018, hold-motion.md § 7).
  //
  // Post-cleanup (May 16, 2026): single composition-level documentary
  // drift via useDirection cascade. Photo + text drift together as one
  // scene. Per-segment _direction.driftPreset overrides.
  const direction = useDirection(data._direction, "documentary");
  const { style: compStyle } = useCompositionAnimation(direction.driftOptions);
  const totalFrames = sec(data.durationSec || 6);
  const theme = useThemeMode(data.backgroundVariant || "light");

  // Duotone ramp selection
  const duotoneRamp = duotoneRamps[data.duotone || "standard"];

  // Text animation — spring-based entrance
  const textOpacity = fadeIn(frame, 0, sec(0.4)) * exitFade(frame, totalFrames, sec(0.5));
  const textTranslate = slideIn(frame, 0, 30, sec(0.7));
  const textScale = scaleReveal(frame, 0, sec(0.6), 1.05, 1.0);

  // Text position styles
  const textPositionStyle = (() => {
    switch (data.textPosition) {
      case "bottom-right":
        return { bottom: layout.safeAreaTier.generous.bottom, right: layout.safeAreaTier.generous.right };
      case "center":
        return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
      case "bottom-left":
      default:
        return { bottom: layout.safeAreaTier.generous.bottom, left: layout.safeAreaTier.generous.left };
    }
  })();

  // ── Real SVG duotone — feColorMatrix → feFuncR/G/B chain ──
  // Builds an inline SVG filter that desaturates → maps luminance → remaps to brand ramp.
  const filterId = `imgcomp-duotone-${data.duotone || "standard"}`;
  const hexToRgb = (hex: string): [number, number, number] => {
    const h = hex.replace("#", "");
    return [
      parseInt(h.substring(0, 2), 16) / 255,
      parseInt(h.substring(2, 4), 16) / 255,
      parseInt(h.substring(4, 6), 16) / 255,
    ];
  };
  const shadowRgb = hexToRgb(duotoneRamp.shadows);
  const highlightRgb = hexToRgb(duotoneRamp.highlights);
  const slopeR = highlightRgb[0] - shadowRgb[0];
  const slopeG = highlightRgb[1] - shadowRgb[1];
  const slopeB = highlightRgb[2] - shadowRgb[2];

  // ── Crawling grain — backgroundPosition shifts deterministically per frame ──
  const grainOffsetX = (frame * 1.5) % 512;
  const grainOffsetY = (frame * 0.85) % 512;

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      {/* Real SVG duotone filter (proper ramp remap, not gradient overlay) */}
      <svg width="0" height="0" style={{ position: "absolute", pointerEvents: "none" }}>
        <defs>
          <filter id={filterId} colorInterpolationFilters="sRGB">
            <feColorMatrix type="saturate" values="0.25" />
            <feColorMatrix
              type="matrix"
              values="0.2126 0.7152 0.0722 0 0
                      0.2126 0.7152 0.0722 0 0
                      0.2126 0.7152 0.0722 0 0
                      0      0      0      1 0"
            />
            <feComponentTransfer>
              <feFuncR type="linear" slope={String(slopeR)} intercept={String(shadowRgb[0])} />
              <feFuncG type="linear" slope={String(slopeG)} intercept={String(shadowRgb[1])} />
              <feFuncB type="linear" slope={String(slopeB)} intercept={String(shadowRgb[2])} />
            </feComponentTransfer>
          </filter>
        </defs>
      </svg>

      <AbsoluteFill style={compStyle}>
        {/* Main image — Ken Burns drift now applied at composition level
            via compStyle (Register C documentary preset). Removed the
            per-element transform: scale(${scale}) that previously drifted
            only this layer; that pattern was a Common Fate violation
            (foreground photo drifted, text/grain/vignette overlay stayed
            fixed). Documentary preset (1.06 scale + 18px pan + 0.3°
            rotation) now applies uniformly to the whole composition. */}
      <AbsoluteFill
        style={{
          filter: `url(#${filterId})`,
        }}
      >
        <Img src={resolveAssetSrc(data.imagePath)} style={{ width: "100%", height: "100%" }} />
      </AbsoluteFill>

      {/* Crawling film grain — backgroundPosition drifts per frame */}
      <AbsoluteFill
        style={{
          backgroundImage: `url(${staticFile("assets/noise-512.png")})`,
          backgroundRepeat: "repeat",
          backgroundSize: "512px 512px",
          backgroundPosition: `${grainOffsetX}px ${grainOffsetY}px`,
          mixBlendMode: "overlay",
          opacity: data.grainOpacity ?? 0.12,
          pointerEvents: "none",
        }}
      />

      {/* Vignette overlay */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at center, transparent 40%, ${palette.ink}66 100%)`,
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
            transform: `translateY(${textTranslate}px) scale(${textScale})`,
            transformOrigin: "left bottom",
            color: theme.text.primary,
            textShadow: shadows.textLift,
          }}
        >
          {data.title && (
            <div
              style={{
                fontFamily: fonts.display,
                fontSize: fontSizes.h2,
                fontWeight: fontWeights.bold,
                letterSpacing: letterSpacing.h2,
                lineHeight: 1.2,
                maxWidth: textMaxWidth.h2,
                marginBottom: layout.spacing.sm,
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
                maxWidth: textMaxWidth.body,
                fontWeight: fontWeights.regular,
                letterSpacing: letterSpacing.body,
                marginBottom: layout.spacing.xs,
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
  // HOLD_MOTION_REGISTER Register C — photo plate gets documentary Ken Burns
  // by default (POLISH.md D20). Per-segment _direction.driftPreset overrides.
  const direction = useDirection(data._direction, "documentary");
  const { style: compStyle } = useCompositionAnimation(direction.driftOptions);
  const theme = useThemeMode(data.backgroundVariant || "light");

  const duotoneRamp = duotoneRamps[data.duotone || "standard"];
  const frameOpacity = fadeIn(frame, 0, sec(0.4));
  const frameScale = scaleReveal(frame, 0, sec(0.7), 1.06, 1.0);
  const isDark = data.backgroundVariant === "dark";

  const frameWidth = (layout.width * 60) / 100; // 60% of frame width
  const frameHeight = (frameWidth * 9) / 16; // 16:9 aspect ratio
  const frameX = (layout.width - frameWidth) / 2;
  const frameY = (layout.height - frameHeight) / 2;

  const borderColor = theme.text.muted;
  const bgColor = theme.bg.surface;

  return (
    <Background
      variant={resolveAnalyticalBackgroundVariant(
        analyticalBackgroundBase(data.backgroundVariant),
        transparentBackdropRequested(data),
      )}
      tint={direction.backgroundTint}
      atmosphere={direction.atmosphere}
      atmosphereIntensity={direction.atmosphereIntensity}
    >
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
          padding: layout.spacing.xs,
          overflow: "hidden",
          opacity: frameOpacity,
          transform: `scale(${frameScale})`,
          transformOrigin: "center",
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
          {/* SVG duotone filter (proper feColorMatrix → ramp remap) */}
          <svg width="0" height="0" style={{ position: "absolute" }}>
            <defs>
              <filter id="imgcomp-inset-duotone" colorInterpolationFilters="sRGB">
                <feColorMatrix type="saturate" values="0.25" />
                <feColorMatrix
                  type="matrix"
                  values="0.2126 0.7152 0.0722 0 0
                          0.2126 0.7152 0.0722 0 0
                          0.2126 0.7152 0.0722 0 0
                          0      0      0      1 0"
                />
                <feComponentTransfer>
                  <feFuncR
                    type="linear"
                    slope={String(
                      (parseInt(duotoneRamp.highlights.replace("#", "").slice(0, 2), 16) -
                        parseInt(duotoneRamp.shadows.replace("#", "").slice(0, 2), 16)) /
                        255
                    )}
                    intercept={String(
                      parseInt(duotoneRamp.shadows.replace("#", "").slice(0, 2), 16) / 255
                    )}
                  />
                  <feFuncG
                    type="linear"
                    slope={String(
                      (parseInt(duotoneRamp.highlights.replace("#", "").slice(2, 4), 16) -
                        parseInt(duotoneRamp.shadows.replace("#", "").slice(2, 4), 16)) /
                        255
                    )}
                    intercept={String(
                      parseInt(duotoneRamp.shadows.replace("#", "").slice(2, 4), 16) / 255
                    )}
                  />
                  <feFuncB
                    type="linear"
                    slope={String(
                      (parseInt(duotoneRamp.highlights.replace("#", "").slice(4, 6), 16) -
                        parseInt(duotoneRamp.shadows.replace("#", "").slice(4, 6), 16)) /
                        255
                    )}
                    intercept={String(
                      parseInt(duotoneRamp.shadows.replace("#", "").slice(4, 6), 16) / 255
                    )}
                  />
                </feComponentTransfer>
              </filter>
            </defs>
          </svg>
          {/* Image with proper SVG duotone */}
          <Img
            src={resolveAssetSrc(data.imagePath)}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              filter: "url(#imgcomp-inset-duotone)",
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
            color: theme.text.primary,
            fontFamily: fonts.display,
            fontSize: fontSizes.h3,
            maxWidth: textMaxWidth.h3,
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
            top: frameY + frameHeight + layout.spacing.md,
            width: frameWidth,
            opacity: frameOpacity,
            color: theme.text.secondary,
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
      {/* Brand strips */}
      <HeaderStrip mode={data.backgroundVariant || "light"} metadata={data.episode} />
      <FooterStrip mode={data.backgroundVariant || "light"} />
    </Background>
  );
};

/**
 * Variant: Portrait — Person-focused image on left/right with name strip.
 */
const PortraitVariant: React.FC<{ data: ImageCompositeData }> = ({ data }) => {
  const frame = useCurrentFrame();
  // HOLD_MOTION_REGISTER Register C — portrait photo gets documentary Ken Burns
  // by default (POLISH.md D20). Per-segment _direction.driftPreset overrides.
  const direction = useDirection(data._direction, "documentary");
  const { style: compStyle } = useCompositionAnimation(direction.driftOptions);
  const theme = useThemeMode(data.backgroundVariant || "light");

  const totalFrames = sec(data.durationSec || 6);
  const duotoneRamp = duotoneRamps[data.duotone || "standard"];
  const imageOpacity = fadeIn(frame, 0, sec(0.4));
  const imageScale = scaleReveal(frame, 0, sec(0.8), 1.04, 1.0);
  const nameStripOpacity = fadeIn(frame, sec(0.5), sec(0.4));
  // Parallax: text drifts slightly faster than image
  const textDriftY = interpolate(frame, [0, totalFrames], [8, -8], CLAMP); // linear-ok: slow full-clip parallax drift, linear speed is intentional

  const imageWidth = (layout.width * 40) / 100; // 40% of frame
  const imageX = 0; // Left side (can be changed to right side if needed)

  return (
    <Background
      variant={resolveAnalyticalBackgroundVariant(
        analyticalBackgroundBase(data.backgroundVariant),
        transparentBackdropRequested(data),
      )}
      tint={direction.backgroundTint}
      atmosphere={direction.atmosphere}
      atmosphereIntensity={direction.atmosphereIntensity}
    >
      <AbsoluteFill style={compStyle}>
        {/* Image container */}
      <AbsoluteFill
        style={{
          left: imageX,
          width: imageWidth,
          overflow: "hidden",
          opacity: imageOpacity,
          transform: `scale(${imageScale})`,
          transformOrigin: "center",
        }}
      >
        {/* SVG duotone filter — proper feColorMatrix ramp remap */}
        <svg width="0" height="0" style={{ position: "absolute" }}>
          <defs>
            <filter id="imgcomp-portrait-duotone" colorInterpolationFilters="sRGB">
              <feColorMatrix type="saturate" values="0.25" />
              <feColorMatrix
                type="matrix"
                values="0.2126 0.7152 0.0722 0 0
                        0.2126 0.7152 0.0722 0 0
                        0.2126 0.7152 0.0722 0 0
                        0      0      0      1 0"
              />
              <feComponentTransfer>
                <feFuncR
                  type="linear"
                  slope={String(
                    (parseInt(duotoneRamp.highlights.replace("#", "").slice(0, 2), 16) -
                      parseInt(duotoneRamp.shadows.replace("#", "").slice(0, 2), 16)) /
                      255
                  )}
                  intercept={String(
                    parseInt(duotoneRamp.shadows.replace("#", "").slice(0, 2), 16) / 255
                  )}
                />
                <feFuncG
                  type="linear"
                  slope={String(
                    (parseInt(duotoneRamp.highlights.replace("#", "").slice(2, 4), 16) -
                      parseInt(duotoneRamp.shadows.replace("#", "").slice(2, 4), 16)) /
                      255
                  )}
                  intercept={String(
                    parseInt(duotoneRamp.shadows.replace("#", "").slice(2, 4), 16) / 255
                  )}
                />
                <feFuncB
                  type="linear"
                  slope={String(
                    (parseInt(duotoneRamp.highlights.replace("#", "").slice(4, 6), 16) -
                      parseInt(duotoneRamp.shadows.replace("#", "").slice(4, 6), 16)) /
                      255
                  )}
                  intercept={String(
                    parseInt(duotoneRamp.shadows.replace("#", "").slice(4, 6), 16) / 255
                  )}
                />
              </feComponentTransfer>
            </filter>
          </defs>
        </svg>
        <Img
          src={resolveAssetSrc(data.imagePath)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            filter: "url(#imgcomp-portrait-duotone)",
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
              backgroundColor: `${palette.ink}99`,
              padding: layout.spacing.xs,
              opacity: nameStripOpacity,
              color: theme.text.primary,
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
                  marginTop: layout.spacing.xs,
                  opacity: 0.8,
                }}
              >
                {data.personTitle}
              </div>
            )}
          </div>
        )}
      </AbsoluteFill>

      {/* Text content on right side — parallax drift */}
      <div
        style={{
          position: "absolute",
          left: imageWidth + layout.spacing.xl,
          top: layout.safeAreaTier.generous.top,
          width: layout.width - imageWidth - layout.spacing.xxxl - layout.spacing.xl,
          opacity: imageOpacity,
          color: theme.text.primary,
          transform: `translateY(${textDriftY}px)`,
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
              maxWidth: textMaxWidth.h1,
              marginBottom: layout.spacing.md,
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
              maxWidth: textMaxWidth.body,
              fontWeight: fontWeights.regular,
              letterSpacing: letterSpacing.body,
              lineHeight: 1.5,
              marginBottom: layout.spacing.sm,
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
