/**
 * ScrollyReveal — progressive annotation reveal over a brand-treated image.
 *
 * Renders a brand-treated base image with step-by-step callout annotations.
 * Each step optionally pans and zooms the image to a focus region while
 * revealing one or more annotation overlays.
 *
 * Editorial register: "scrollytelling" — the image is the primary evidence;
 * annotations build the argument sequentially. Used for geographic analysis,
 * architectural breakdowns, diagram walkthroughs.
 *
 * Reveal sequence:
 *   1. Image fades in over first ~0.8s
 *   2. Title slides in from top
 *   3. Steps fire at their declared `revealAtSec`; each step:
 *      a. Pans/zooms the image to the step's `focus` region (if set)
 *      b. Reveals the step's annotations via AnnotationSVGLayer
 *
 * @composition-animation: useCompositionAnimation({ noDrift: true }) —
 *   the focus-transform IS the motion; no separate Ken Burns drift layer.
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
import { TitleBlock } from "../../components/TitleBlock";
import { SourceAttribution } from "../../components/SourceAttribution";
import { AnnotationSVGLayer } from "../../components/AnnotationSVGLayer";
import { useCompositionAnimation } from "../../hooks/useCompositionAnimation";
import { useDirection } from "../../hooks/useDirection";
import { useThemeMode } from "../../hooks/useThemeMode";
import { resolveAssetSrc } from "../../utils/assetPath";
import { warnIf } from "../../utils/dataWarnings";
import { CLAMP } from "../../utils/animation";
import { layout, sec } from "../../design/theme";
import type { AnnotationItem } from "../../components/AnnotationSVGLayer";
import type { ScrollyRevealData, ScrollyStep } from "./types";

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Compute the CSS transform string for an image pan/zoom focus.
 * The image is always 100% width/height of its container.
 * To center `(centerX%, centerY%)` in the viewport at `scale`:
 *   - First scale around center (transformOrigin: "50% 50%")
 *   - Then translate to put the focus point at the viewport center
 *
 * translate offset (px) = (50% - centerX%) * width * scale
 * (using CSS %, so we pass dimensionless values and let CSS resolve)
 */
function computeFocusTransform(
  centerX: number,
  centerY: number,
  scale: number,
): string {
  // Translate offsets in % of the container (before scale is applied).
  // We shift the image so that (centerX, centerY) ends up at (50%, 50%).
  const tx = (50 - centerX) * scale;
  const ty = (50 - centerY) * scale;
  return `scale(${scale}) translate(${tx}%, ${ty}%)`;
}

/** Returns the step that was last active at a given frame. */
function getActiveStepIndex(steps: ScrollyStep[], frameSec: number): number {
  let idx = -1;
  for (let i = 0; i < steps.length; i++) {
    if (frameSec >= steps[i].revealAtSec) idx = i;
  }
  return idx;
}

// ── Component ────────────────────────────────────────────────────────────────

export const ScrollyReveal: React.FC<{ data: ScrollyRevealData }> = ({ data }) => {
  // ── Validation warnings ────────────────────────────────────────────────
  warnIf(
    data.steps.length === 0,
    "ScrollyReveal",
    "steps array is empty — composition will render blank.",
  );

  // Warn if steps are not in ascending revealAtSec order.
  for (let i = 1; i < data.steps.length; i++) {
    warnIf(
      data.steps[i].revealAtSec <= data.steps[i - 1].revealAtSec,
      "ScrollyReveal",
      `Step ${i} revealAtSec (${data.steps[i].revealAtSec}) is not after step ${i - 1} ` +
        `(${data.steps[i - 1].revealAtSec}). Steps must be in ascending revealAtSec order.`,
    );
  }

  for (let i = 0; i < data.steps.length; i++) {
    const focus = data.steps[i].focus;
    warnIf(
      !!focus && focus.scale > 2.5,
      "ScrollyReveal",
      `Step ${i} focus.scale ${focus?.scale} exceeds 2.5 — image will appear pixelated.`,
    );
  }

  // ── Hooks ──────────────────────────────────────────────────────────────
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const direction = useDirection(data._direction);
  // noDrift: true — the focus transform IS the motion; no Ken Burns drift
  const { style: compStyle } = useCompositionAnimation({
    ...direction.driftOptions,
    noDrift: true,
  });
  const theme = useThemeMode(data.backgroundVariant ?? "dark");
  const durationSec = data.durationSec ?? 14;
  const frameSec = frame / fps;
  const annotationMode = data.annotationMode ?? "accumulate";

  // ── Derived timing ─────────────────────────────────────────────────────
  const imageEntranceFrames = sec(0.8);
  const imageStartFrame = sec(0.2);

  // ── Active step index ──────────────────────────────────────────────────
  const activeStepIndex = useMemo(
    () => getActiveStepIndex(data.steps, frameSec),
    [data.steps, frameSec],
  );

  // ── Flat annotation list ──────────────────────────────────────────────
  // Accumulate: flatten all steps' annotations into a single ordered list.
  // Replace: only the active step's annotations are tracked (same flattened
  //   list, but revealProgress returns 0 for annotations from prior steps).
  const allAnnotations = useMemo<AnnotationItem[]>(() => {
    const result: AnnotationItem[] = [];
    for (const step of data.steps) {
      for (const ann of step.annotations) {
        result.push({
          id: ann.id,
          x: ann.x,
          y: ann.y,
          label: ann.label,
          detail: ann.detail,
          placement: ann.placement,
          color: ann.color,
          type: ann.type ?? "callout",
          radius: ann.radius,
        });
      }
    }
    return result;
  }, [data.steps]);

  // Map each annotation back to its step index
  const annotationStepIndex = useMemo<number[]>(() => {
    const result: number[] = [];
    for (let s = 0; s < data.steps.length; s++) {
      for (let _a = 0; _a < data.steps[s].annotations.length; _a++) {
        result.push(s);
      }
    }
    return result;
  }, [data.steps]);

  // Total annotations visible (in accumulate mode: all up to active step)
  const activeCount = useMemo(() => {
    let count = 0;
    for (let i = 0; i <= activeStepIndex && i < data.steps.length; i++) {
      count += data.steps[i].annotations.length;
    }
    return count;
  }, [data.steps, activeStepIndex]);

  // ── Per-annotation reveal progress ────────────────────────────────────
  // Each annotation fades in over 0.5s starting at its step's revealAtSec.
  // In replace mode, annotations from prior steps fade out over 0.3s after
  // the next step fires.
  const ANNOTATION_FADE_IN_SEC = 0.5;
  const ANNOTATION_FADE_OUT_SEC = 0.3;

  const revealProgressFn = useMemo(() => {
    return (idx: number): number => {
      const stepIdx = annotationStepIndex[idx];
      if (stepIdx === undefined) return 0;

      const step = data.steps[stepIdx];
      if (!step) return 0;

      const stepStartSec = step.revealAtSec;
      const fadeInEnd = stepStartSec + ANNOTATION_FADE_IN_SEC;

      const fadeIn = interpolate(
        frameSec,
        [stepStartSec, fadeInEnd],
        [0, 1],
        CLAMP,
      );

      if (annotationMode === "accumulate") {
        return fadeIn;
      }

      // replace mode: fade out annotations from prior steps
      if (stepIdx < activeStepIndex) {
        const nextStep = data.steps[stepIdx + 1];
        if (!nextStep) return fadeIn;
        const fadeOutStart = nextStep.revealAtSec;
        const fadeOutEnd = fadeOutStart + ANNOTATION_FADE_OUT_SEC;
        const fadeOut = interpolate(
          frameSec,
          [fadeOutStart, fadeOutEnd],
          [1, 0],
          CLAMP,
        );
        return Math.min(fadeIn, fadeOut);
      }

      return fadeIn;
    };
  }, [annotationStepIndex, data.steps, frameSec, annotationMode, activeStepIndex]);

  // ── Image pan/zoom transform ──────────────────────────────────────────
  // Interpolate between the previous step's focus and the current step's
  // focus, over `focus.durationSec` starting at the step's `revealAtSec`.
  const imagePanZoomStyle = useMemo<React.CSSProperties>(() => {
    const IDENTITY_FOCUS = { centerX: 50, centerY: 50, scale: 1.0, durationSec: 0.6 };

    if (activeStepIndex < 0) {
      return {
        transformOrigin: "50% 50%",
        transform: computeFocusTransform(50, 50, 1.0),
      };
    }

    const currentStep = data.steps[activeStepIndex];
    const currentFocus = currentStep.focus ?? IDENTITY_FOCUS;

    // Previous focus: the focus of the step before activeStepIndex.
    const prevFocus =
      activeStepIndex > 0
        ? (data.steps[activeStepIndex - 1].focus ?? IDENTITY_FOCUS)
        : IDENTITY_FOCUS;

    const transitionSec = currentFocus.durationSec ?? 0.6;
    const revealSec = currentStep.revealAtSec;

    // Interpolate progress 0→1 over the transition duration.
    const focusProgress = interpolate(
      frameSec,
      [revealSec, revealSec + transitionSec],
      [0, 1],
      { ...CLAMP, easing: Easing.out(Easing.cubic) },
    );

    const cx = interpolate(focusProgress, [0, 1], [prevFocus.centerX, currentFocus.centerX], CLAMP);
    const cy = interpolate(focusProgress, [0, 1], [prevFocus.centerY, currentFocus.centerY], CLAMP);
    const sc = interpolate(focusProgress, [0, 1], [prevFocus.scale, currentFocus.scale], CLAMP);

    return {
      transformOrigin: "50% 50%",
      transform: computeFocusTransform(cx, cy, sc),
      transition: "none",  // Remotion controls timing, not CSS transitions
    };
  }, [data.steps, activeStepIndex, frameSec]);

  // ── Image opacity ──────────────────────────────────────────────────────
  const imageOpacity = interpolate(
    frame,
    [imageStartFrame, imageStartFrame + imageEntranceFrames],
    [0, 1],
    CLAMP,
  );

  // ── Resolved asset src ─────────────────────────────────────────────────
  const resolvedSrc = useMemo(
    () => resolveAssetSrc(data.base.src),
    [data.base.src],
  );

  const backgroundVariant = data.backgroundVariant ?? "dark";

  return (
    <Background
      variant={backgroundVariant}
      atmosphere={direction.atmosphere}
      atmosphereIntensity={direction.atmosphereIntensity}
      tint={direction.backgroundTint}
    >
      <AbsoluteFill style={compStyle}>
        {/* Base image layer with CSS pan/zoom transform */}
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
          </div>
        </div>

        {/* SVG annotation overlay */}
        <AnnotationSVGLayer
          annotations={allAnnotations}
          activeCount={activeCount}
          revealProgress={revealProgressFn}
          width={layout.width}
          height={layout.height}
          mode={annotationMode}
        />

        {/* Title */}
        {data.title && (
          <TitleBlock
            title={data.title}
            subtitle={data.subtitle}
            mode={backgroundVariant}
            safeAreaTier="generous"
          />
        )}

        {/* Source attribution */}
        <SourceAttribution
          source={data.source}
          mode={backgroundVariant}
          startSec={durationSec * 0.2}
        />
      </AbsoluteFill>
    </Background>
  );
};
