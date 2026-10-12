/**
 * AnnotatedZoom — progressive cinematic zoom into sequential image regions.
 *
 * The camera pulls into a series of regions on a brand-treated base image.
 * The zoom IS the editorial argument; no annotation callouts are needed.
 * Each region has a center point, scale, and optional overlay text label.
 *
 * Editorial register: directional — "look here, then here, then here."
 * Sibling of ScrollyReveal (which pairs zoom with annotation SVG overlays).
 *
 * Use cases:
 *   - Documentary "pull to region" move on a map or photograph
 *   - Zooming into a chart region to highlight one data segment
 *   - Revealing a document detail (full page → specific clause)
 *   - Geographic reveals: zoom out from local detail to regional context
 *
 * Animation sequence:
 *   1. Base image fades in (frames 0–15)
 *   2. Title/subtitle glass strip fades in (frames 10–25), fades out when
 *      first region with scale > 1 fires
 *   3. At each region's revealAtSec, apply zoom transition (Easing.out cubic)
 *   4. Region label fades in after the transition completes, fades out before
 *      the next region fires
 *   5. Optional crosshair renders at the focus center during region hold
 *   6. Source attribution fades in during the last 2.5s
 *   7. Composition-level exit fade via useCompositionAnimation
 *
 * @composition-animation: useCompositionAnimation({ noDrift: true }) —
 *   the zoom transform IS the motion; no separate Ken Burns drift layer.
 */

import React, { useMemo } from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Easing,
} from "remotion";
import { Background } from "../../components/Background";
import { BrandImage } from "../../components/BrandImage";
import { SourceAttribution } from "../../components/SourceAttribution";
import { useCompositionAnimation } from "../../hooks/useCompositionAnimation";
import { useDirection } from "../../hooks/useDirection";
import { resolveAssetSrc } from "../../utils/assetPath";
import { warnIf } from "../../utils/dataWarnings";
import { CLAMP } from "../../utils/animation";
import { palette, fonts, fontSizes, layout, sec } from "../../design/theme";
import type { AnnotatedZoomData, AnnotatedZoomRegion } from "./types";

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Compute the CSS transform string for an image pan/zoom focus.
 *
 * The image is always 100% width/height of its container.
 * To center (centerX%, centerY%) in the viewport at `scale`:
 *   1. Scale around the element's own center (transformOrigin "50% 50%")
 *   2. Translate so that the focus point lands at viewport center
 *
 * translate offset = (50% − centerX%) × scale (in units of the pre-scale container)
 * Using CSS % so we don't need to know the pixel dimensions at runtime.
 *
 * Copied from ScrollyReveal.tsx — same formula, same easing contract.
 */
function computeFocusTransform(
  centerX: number,
  centerY: number,
  scale: number,
): string {
  const tx = (50 - centerX) * scale;
  const ty = (50 - centerY) * scale;
  return `scale(${scale}) translate(${tx}%, ${ty}%)`;
}

/**
 * Return the index of the last region whose revealAtSec <= frameSec.
 * Returns -1 if no region has fired yet.
 */
function getActiveRegionIndex(
  regions: AnnotatedZoomRegion[],
  frameSec: number,
): number {
  let idx = -1;
  for (let i = 0; i < regions.length; i++) {
    if (frameSec >= regions[i].revealAtSec) idx = i;
  }
  return idx;
}

// ── Crosshair ────────────────────────────────────────────────────────────────

/**
 * Thin hairline crosshair at the zoom focus center. Renders in the
 * coordinate space of the zoomed image container (before the CSS transform).
 * Because the container is always 100%×100%, centering at 50%/50% of the
 * container puts the crosshair at the viewport center, which is exactly
 * where the zoom focuses.
 */
const Crosshair: React.FC<{ opacity: number }> = React.memo(({ opacity }) => {
  const HAIR_THICKNESS = 1;
  const HAIR_HALF_LENGTH = 24; // px each side from center
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        opacity,
      }}
    >
      {/* Horizontal hairline */}
      <div
        style={{
          position: "absolute",
          left: `calc(50% - ${HAIR_HALF_LENGTH}px)`,
          top: "50%",
          width: HAIR_HALF_LENGTH * 2,
          height: HAIR_THICKNESS,
          backgroundColor: palette.gold,
          opacity: 0.6,
          transform: "translateY(-50%)",
        }}
      />
      {/* Vertical hairline */}
      <div
        style={{
          position: "absolute",
          top: `calc(50% - ${HAIR_HALF_LENGTH}px)`,
          left: "50%",
          width: HAIR_THICKNESS,
          height: HAIR_HALF_LENGTH * 2,
          backgroundColor: palette.gold,
          opacity: 0.6,
          transform: "translateX(-50%)",
        }}
      />
    </div>
  );
});

// ── Region Label ─────────────────────────────────────────────────────────────

interface RegionLabelProps {
  label: string;
  sublabel?: string;
  opacity: number;
}

/**
 * Semi-transparent pill/banner at the bottom of the frame.
 * Shows the label for the currently active zoom region.
 * Gold text on a dark pill for maximum legibility against any image.
 */
const RegionLabel: React.FC<RegionLabelProps> = React.memo(
  ({ label, sublabel, opacity }) => (
    <div
      style={{
        position: "absolute",
        bottom: layout.safeAreaTier.generous.bottom + 64,
        left: "50%",
        transform: "translateX(-50%)",
        opacity,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 6,
        pointerEvents: "none",
      }}
    >
      {/* Main label pill */}
      <div
        style={{
          backgroundColor: `${palette.midnight}CC`,
          borderRadius: 4,
          paddingLeft: 20,
          paddingRight: 20,
          paddingTop: 8,
          paddingBottom: 8,
          border: `1px solid ${palette.gold}40`,
          backdropFilter: "blur(4px)",
        }}
      >
        <span
          style={{
            fontFamily: fonts.mono,
            fontSize: fontSizes.label,
            fontWeight: 500,
            color: palette.gold,
            letterSpacing: 1.5,
            textTransform: "uppercase" as const,
            whiteSpace: "nowrap" as const,
          }}
        >
          {label}
        </span>
      </div>
      {/* Sublabel — secondary detail line */}
      {sublabel && (
        <div
          style={{
            backgroundColor: `${palette.ink}99`,
            borderRadius: 3,
            paddingLeft: 14,
            paddingRight: 14,
            paddingTop: 4,
            paddingBottom: 4,
          }}
        >
          <span
            style={{
              fontFamily: fonts.mono,
              fontSize: fontSizes.meta,
              fontWeight: 400,
              color: palette.sand,
              letterSpacing: 0.5,
              whiteSpace: "nowrap" as const,
            }}
          >
            {sublabel}
          </span>
        </div>
      )}
    </div>
  ),
);

// ── Title Glass Strip ────────────────────────────────────────────────────────

interface TitleGlassProps {
  title: string;
  subtitle?: string;
  opacity: number;
}

/**
 * Compact glass-effect overlay at bottom-left of frame.
 * Used instead of TitleBlock so it doesn't obscure the full-bleed image.
 * Fades out when the first zoom region fires.
 */
const TitleGlass: React.FC<TitleGlassProps> = React.memo(
  ({ title, subtitle, opacity }) => {
    const safe = layout.safeAreaTier.generous;
    return (
      <div
        style={{
          position: "absolute",
          bottom: safe.bottom,
          left: safe.left,
          opacity,
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            backgroundColor: `${palette.ink}B3`,
            borderLeft: `3px solid ${palette.gold}`,
            paddingLeft: 16,
            paddingRight: 20,
            paddingTop: 10,
            paddingBottom: 10,
            backdropFilter: "blur(6px)",
          }}
        >
          <div
            style={{
              fontFamily: fonts.mono,
              fontSize: fontSizes.label,
              fontWeight: 700,
              color: palette.bone,
              letterSpacing: 2,
              textTransform: "uppercase" as const,
            }}
          >
            {title}
          </div>
          {subtitle && (
            <div
              style={{
                fontFamily: fonts.body,
                fontSize: fontSizes.meta,
                fontWeight: 400,
                color: palette.taupe,
                marginTop: 4,
                letterSpacing: 0.3,
              }}
            >
              {subtitle}
            </div>
          )}
        </div>
      </div>
    );
  },
);

// ── Component ────────────────────────────────────────────────────────────────

export const AnnotatedZoom: React.FC<{ data: AnnotatedZoomData }> = ({
  data,
}) => {
  // ── Validation warnings ────────────────────────────────────────────────
  warnIf(
    data.regions.length > 8,
    "AnnotatedZoom",
    `regions.length ${data.regions.length} exceeds the 8-region editorial limit — viewer spatial model degrades.`,
  );

  for (let i = 1; i < data.regions.length; i++) {
    warnIf(
      data.regions[i].revealAtSec <= data.regions[i - 1].revealAtSec,
      "AnnotatedZoom",
      `Region ${i} revealAtSec (${data.regions[i].revealAtSec}) is not after region ${i - 1} ` +
        `(${data.regions[i - 1].revealAtSec}). Regions must be in ascending revealAtSec order.`,
    );
  }

  for (let i = 0; i < data.regions.length; i++) {
    warnIf(
      data.regions[i].scale > 5,
      "AnnotatedZoom",
      `Region ${i} scale ${data.regions[i].scale} exceeds 5.0 — image will be extremely pixelated.`,
    );
  }

  // ── Hooks ──────────────────────────────────────────────────────────────
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const direction = useDirection(data._direction);
  // noDrift: true — the zoom transform IS the motion; no Ken Burns drift
  const { style: compStyle } = useCompositionAnimation({
    ...direction.driftOptions,
    noDrift: true,
  });

  const durationSec = data.durationSec ?? 16;
  const frameSec = frame / fps;
  const backgroundVariant = data.backgroundVariant ?? "dark";
  const holdAtLastRegion = data.holdAtLastRegion ?? true;

  // ── Pre-sorted regions (ascending revealAtSec) ─────────────────────────
  const sortedRegions = useMemo(
    () => [...data.regions].sort((a, b) => a.revealAtSec - b.revealAtSec),
    [data.regions],
  );

  // ── Per-region frame numbers ───────────────────────────────────────────
  const regionFrames = useMemo(
    () =>
      sortedRegions.map((r) => ({
        revealFrame: r.revealAtSec * fps,
        transitionFrames: (r.transitionSec ?? 0.8) * fps,
      })),
    [sortedRegions, fps],
  );

  // ── Active region index ────────────────────────────────────────────────
  const activeRegionIndex = useMemo(
    () => getActiveRegionIndex(sortedRegions, frameSec),
    [sortedRegions, frameSec],
  );

  // ── Image pan/zoom transform ──────────────────────────────────────────
  const imagePanZoomStyle = useMemo<React.CSSProperties>(() => {
    const IDENTITY = { centerX: 50, centerY: 50, scale: 1.0 };

    // Before first region fires
    if (activeRegionIndex < 0) {
      // Animate toward the first region if its revealAtSec is near
      const firstRegion = sortedRegions[0];
      if (!firstRegion) {
        return {
          transformOrigin: "50% 50%",
          transform: computeFocusTransform(50, 50, 1.0),
        };
      }
      // Pre-roll: we're before the first reveal — stay at identity
      return {
        transformOrigin: "50% 50%",
        transform: computeFocusTransform(50, 50, 1.0),
        transition: "none",
      };
    }

    const currentRegion = sortedRegions[activeRegionIndex];

    // Check if we should return to full frame after the last region
    // (holdAtLastRegion === false)
    const isLastRegion = activeRegionIndex === sortedRegions.length - 1;
    if (!holdAtLastRegion && isLastRegion) {
      const totalFrames = durationSec * fps;
      const returnStartFrame = totalFrames - sec(1.0);
      const progress = interpolate(
        frame,
        [returnStartFrame, totalFrames],
        [0, 1],
        { ...CLAMP, easing: Easing.out(Easing.cubic) },
      );
      const cx = interpolate(progress, [0, 1], [currentRegion.centerX, 50], CLAMP);
      const cy = interpolate(progress, [0, 1], [currentRegion.centerY, 50], CLAMP);
      const sc = interpolate(progress, [0, 1], [currentRegion.scale, 1.0], CLAMP);
      return {
        transformOrigin: "50% 50%",
        transform: computeFocusTransform(cx, cy, sc),
        transition: "none",
      };
    }

    // Previous focus: identity (if first region), else previous region
    const prevRegion =
      activeRegionIndex > 0 ? sortedRegions[activeRegionIndex - 1] : IDENTITY;

    const transitionSec = currentRegion.transitionSec ?? 0.8;
    const revealSec = currentRegion.revealAtSec;

    // Interpolate progress 0→1 over the transition duration
    const focusProgress = interpolate(
      frameSec,
      [revealSec, revealSec + transitionSec],
      [0, 1],
      { ...CLAMP, easing: Easing.out(Easing.cubic) },
    );

    const cx = interpolate(
      focusProgress,
      [0, 1],
      [prevRegion.centerX, currentRegion.centerX],
      CLAMP,
    );
    const cy = interpolate(
      focusProgress,
      [0, 1],
      [prevRegion.centerY, currentRegion.centerY],
      CLAMP,
    );
    const sc = interpolate(
      focusProgress,
      [0, 1],
      [prevRegion.scale, currentRegion.scale],
      CLAMP,
    );

    return {
      transformOrigin: "50% 50%",
      transform: computeFocusTransform(cx, cy, sc),
      transition: "none", // Remotion controls timing, not CSS transitions
    };
  }, [
    sortedRegions,
    regionFrames,
    activeRegionIndex,
    frameSec,
    frame,
    fps,
    holdAtLastRegion,
    durationSec,
  ]);

  // ── Image entrance opacity ─────────────────────────────────────────────
  const imageOpacity = useMemo(
    () =>
      interpolate(frame, [sec(0.2), sec(0.2) + sec(0.5)], [0, 1], CLAMP),
    [frame],
  );

  // ── Title glass opacity ────────────────────────────────────────────────
  // Fades in during frames 10–25, fades out when first region with scale > 1.0
  // fires (the zoom becomes the content from that point onward).
  const titleOpacity = useMemo(() => {
    if (!data.title) return 0;
    const fadeInStart = sec(0.2);
    const fadeInEnd = sec(0.2) + sec(0.5);
    const fadeIn = interpolate(frame, [fadeInStart, fadeInEnd], [0, 1], CLAMP);

    // Find the first zoom region (scale > 1.0) to determine fade-out point
    const firstZoomRegion = sortedRegions.find((r) => r.scale > 1.0);
    if (!firstZoomRegion) return fadeIn;

    const zoomStart = firstZoomRegion.revealAtSec;
    const fadeOutEnd = zoomStart * fps;
    const fadeOutStart = fadeOutEnd - sec(0.4);
    const fadeOut = interpolate(
      frame,
      [fadeOutStart, fadeOutEnd],
      [1, 0],
      CLAMP,
    );
    return Math.min(fadeIn, fadeOut);
  }, [data.title, frame, fps, sortedRegions]);

  // ── Region label opacity ──────────────────────────────────────────────
  // Current region's label: fades in 0.3s after the zoom transition ends,
  // fades out 0.3s before the next region fires.
  const { labelText, sublabelText, labelOpacity, showCrosshair } =
    useMemo(() => {
      if (activeRegionIndex < 0) {
        return {
          labelText: undefined,
          sublabelText: undefined,
          labelOpacity: 0,
          showCrosshair: false,
        };
      }

      const currentRegion = sortedRegions[activeRegionIndex];
      if (!currentRegion.label) {
        return {
          labelText: undefined,
          sublabelText: undefined,
          labelOpacity: 0,
          showCrosshair: currentRegion.showCrosshair ?? false,
        };
      }

      const transitionSec = currentRegion.transitionSec ?? 0.8;
      const labelFadeInStart =
        (currentRegion.revealAtSec + transitionSec + 0.3) * fps;
      const labelFadeInEnd = labelFadeInStart + sec(0.3);

      let fadeOut = 1;
      const nextRegion = sortedRegions[activeRegionIndex + 1];
      if (nextRegion) {
        const fadeOutEnd = nextRegion.revealAtSec * fps;
        const fadeOutStart = fadeOutEnd - sec(0.3);
        fadeOut = interpolate(frame, [fadeOutStart, fadeOutEnd], [1, 0], CLAMP);
      }

      const fadeIn = interpolate(
        frame,
        [labelFadeInStart, labelFadeInEnd],
        [0, 1],
        CLAMP,
      );

      return {
        labelText: currentRegion.label,
        sublabelText: currentRegion.sublabel,
        labelOpacity: Math.min(fadeIn, fadeOut),
        showCrosshair: currentRegion.showCrosshair ?? false,
      };
    }, [activeRegionIndex, sortedRegions, frame, fps]);

  // ── Crosshair opacity ─────────────────────────────────────────────────
  // Fades in with the label (after transition) and fades out before next region
  const crosshairOpacity = showCrosshair ? labelOpacity : 0;

  // ── Resolved asset src ─────────────────────────────────────────────────
  const resolvedSrc = useMemo(
    () => resolveAssetSrc(data.base.src),
    [data.base.src],
  );

  return (
    <Background
      variant={backgroundVariant}
      atmosphere={direction.atmosphere}
      atmosphereIntensity={direction.atmosphereIntensity}
      tint={direction.backgroundTint}
    >
      <AbsoluteFill style={compStyle}>
        {/* Base image layer — CSS pan/zoom transform applied to wrapper div */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            overflow: "hidden",
            opacity: imageOpacity,
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              ...imagePanZoomStyle,
            }}
          >
            <BrandImage
              src={resolvedSrc}
              alt={data.base.alt ?? ""}
              ramp={data.base.duotoneRamp ?? "standard"}
              composite="inset"
              fit="cover"
              position={data.base.objectPosition ?? "center"}
              style={{ width: "100%", height: "100%" }}
            />
            {/* Crosshair at the zoom focus point */}
            {showCrosshair && <Crosshair opacity={crosshairOpacity} />}
          </div>
        </div>

        {/* Title glass strip — fades out when zoom begins */}
        {data.title && (
          <TitleGlass
            title={data.title}
            subtitle={data.subtitle}
            opacity={titleOpacity}
          />
        )}

        {/* Region label — shows the currently active zoom region's label */}
        {labelText && (
          <RegionLabel
            label={labelText}
            sublabel={sublabelText}
            opacity={labelOpacity}
          />
        )}

        {/* Source attribution — fades in during the last 2.5s */}
        <SourceAttribution
          source={data.source}
          mode={backgroundVariant}
          startSec={durationSec - 2.5}
        />
      </AbsoluteFill>
    </Background>
  );
};
