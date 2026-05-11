/**
 * ForegroundBackdropFoundation — Studio preview for FullEpisode-style segment backdrops.
 *
 * Mirrors the stack used in FullEpisode ForegroundSegment: episode-level
 * EditorialSurface (paper + grain) + optional SegmentBackdrop under a chart.
 * Switch backdrop in Studio:
 *   • Sidebar: **Editorial → Backdrop-foundation** → pick `ForegroundBackdrop-{id}` (one composition per PNG), or
 *   • Select **ForegroundBackdropFoundation** (composition is inline in `Root.tsx` so 💾 Save to code works),
 *     **Cmd+J** / **Ctrl+J** → **Props** → **backdropId** (enum or JSON).
 *
 * Still capture example:
 *   npx remotion still ForegroundBackdropFoundation --frame=90 \
 *     --props='{"backdropId":"reading-room"}' --output=/tmp/foundation.png
 */

import React from "react";
import { AbsoluteFill } from "remotion";
import { z } from "zod";
import {
  BACKDROP_MANIFEST,
  EditorialSurface,
  SegmentBackdrop,
} from "../../components/EditorialSurface";
import { DataChart } from "../DataChart/DataChart";
import { useCompositionAnimation } from "../../hooks/useCompositionAnimation";
import { palette, semantic } from "../../design/theme";
import type { DataChartData } from "../DataChart/types";

const backdropIdEnum = z.enum(
  BACKDROP_MANIFEST.map((b) => b.id) as [string, ...string[]],
);

export const ForegroundBackdropFoundationSchema = z.object({
  backdropId: backdropIdEnum,
});

export type ForegroundBackdropFoundationProps = z.infer<
  typeof ForegroundBackdropFoundationSchema
>;

const sampleChart: DataChartData = {
  episode: "foundation-preview",
  title: "Segment backdrop preview",
  subtitle: "Same chart — swap backdropId in Studio props",
  /** Let parent SegmentBackdrop show through (Background paper would hide it). */
  transparentBackground: true,
  variant: "comparison",
  unit: "%",
  comparisonPairs: [
    {
      label: "A",
      leftValue: 62,
      rightValue: 38,
      leftLabel: "One",
      rightLabel: "Two",
    },
    {
      label: "B",
      leftValue: 55,
      rightValue: 45,
      leftLabel: "One",
      rightLabel: "Two",
    },
  ],
  leftGroupLabel: "Series A",
  rightGroupLabel: "Series B",
  leftGroupColor: palette.gold,
  rightGroupColor: semantic.china,
  highlightIndex: 0,
  durationSec: 12,
  source: "Foundation preview — not editorial data",
};

export const ForegroundBackdropFoundation: React.FC<
  ForegroundBackdropFoundationProps
> = ({ backdropId }) => {
  useCompositionAnimation({ noDrift: true });
  return (
    <EditorialSurface intensity={0.6}>
      <AbsoluteFill>
        <SegmentBackdrop backdropId={backdropId} />
        <AbsoluteFill style={{ zIndex: 1 }}>
          <DataChart data={sampleChart} />
        </AbsoluteFill>
      </AbsoluteFill>
    </EditorialSurface>
  );
};
