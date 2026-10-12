/**
 * ProtoReel — PROTOTYPE SHOWCASE (May 23, 2026)
 *
 * One mega-composition that plays through every capability prototype from
 * REMOTION_CAPABILITY_MAP.md back-to-back, each preceded by a Slate title card
 * (same convention as src/catalog/Showreel.tsx). This is the single shareable
 * MP4 for the "what Remotion can do that we aren't using yet" R&D round.
 *
 * Order follows the capability map's leverage ranking:
 *   1. Narration sync (media-utils + captions)  — highest leverage
 *   2. Parametric bilingual EN/ZH (calculateMetadata)
 *   3. Geometric vector (paths + shapes)
 *   4. AI-still compositing (paths over Img)
 *   5. Native branded transitions (@remotion/transitions)
 *   6. Generative noise field (@remotion/noise)
 *
 * To add a prototype: import it + its duration constant, drop a slate()/demo()
 * pair into SEGMENTS. Total duration recomputes automatically.
 */
import React from "react";
import { Series } from "remotion";
import { Slate } from "../../catalog/Slate";
import { BrandTransitions, PROTO_BRAND_TRANSITIONS_DURATION } from "./BrandTransitions";
import { GeometricMotion, GEOMETRIC_MOTION_DURATION } from "./GeometricMotion";
import { AIStillComposite, AI_STILL_COMPOSITE_DURATION } from "./AIStillComposite";
import { NoiseField, NOISE_FIELD_DURATION } from "./NoiseField";
import { NarrationSync, NARRATION_SYNC_DURATION } from "./NarrationSync";
import { ParametricBilingual } from "./ParametricBilingual";

const SLATE_FRAMES = 60; // 2s — matches Slate's internal fade timing
const PARAMETRIC_FRAMES = 180; // 6s (calculateMetadata would derive this live; fixed here in-reel)

interface ReelSegment {
  durationInFrames: number;
  render: () => React.ReactNode;
}

const slate = (template: string, variant: string): ReelSegment => ({
  durationInFrames: SLATE_FRAMES,
  render: () => <Slate category="Capability R&D" template={template} variant={variant} />,
});

const SEGMENTS: ReelSegment[] = [
  slate("NarrationSync", "media-utils · captions"),
  { durationInFrames: NARRATION_SYNC_DURATION, render: () => <NarrationSync /> },

  slate("ParametricBilingual", "calculateMetadata · EN"),
  {
    durationInFrames: PARAMETRIC_FRAMES,
    render: () => <ParametricBilingual lang="en" narrationSrc="proto/narration.wav" durationSec={6} />,
  },

  slate("ParametricBilingual", "calculateMetadata · ZH"),
  {
    durationInFrames: PARAMETRIC_FRAMES,
    render: () => <ParametricBilingual lang="zh" narrationSrc="proto/narration.wav" durationSec={6} />,
  },

  slate("GeometricMotion", "paths · shapes"),
  { durationInFrames: GEOMETRIC_MOTION_DURATION, render: () => <GeometricMotion /> },

  slate("AIStillComposite", "paths over Img"),
  { durationInFrames: AI_STILL_COMPOSITE_DURATION, render: () => <AIStillComposite /> },

  slate("BrandTransitions", "@remotion/transitions"),
  { durationInFrames: PROTO_BRAND_TRANSITIONS_DURATION, render: () => <BrandTransitions /> },

  slate("NoiseField", "@remotion/noise"),
  { durationInFrames: NOISE_FIELD_DURATION, render: () => <NoiseField /> },
];

export const PROTO_REEL_DURATION = SEGMENTS.reduce((sum, s) => sum + s.durationInFrames, 0);

export const ProtoReel: React.FC = () => (
  <Series>
    {SEGMENTS.map((segment, i) => (
      <Series.Sequence key={i} durationInFrames={segment.durationInFrames}>
        {segment.render()}
      </Series.Sequence>
    ))}
  </Series>
);
