/**
 * EditorialFrameVariantsTest — Aside and minimal variants of EditorialFrame.
 *
 * Two compositions demonstrating the variant system:
 *   EditorialFrameAsideTest  — chart-dominant layout with smaller hero
 *   EditorialFrameMinimalTest — pure passthrough with tiny ∴ mark
 *
 * Render stills:
 *   npx remotion still EditorialFrameAsideTest --frame=60 \
 *     --output=design-references/editorial-frame-aside-render.png
 *   npx remotion still EditorialFrameMinimalTest --frame=30 \
 *     --output=design-references/editorial-frame-minimal-render.png
 */

import React from "react";
import { AbsoluteFill } from "remotion";
import { EditorialSurface, pickBackdrop } from "../../components/EditorialSurface";
import { EditorialFrame } from "../../components/EditorialFrame";
import { DataChart } from "../DataChart/DataChart";
import { useCompositionAnimation } from "../../hooks/useCompositionAnimation";
import { palette, semantic } from "../../design/theme";
import type { DataChartData } from "../DataChart/types";

// ── Shared data ───────────────────────────────────────────────────────────────

const defectionRateData: DataChartData = {
  episode: "prisoners-dilemma",
  title: "",
  subtitle: "",
  variant: "bar",
  unit: "%",
  dataPoints: [
    { label: "Always-D",    value: 100, color: semantic.china },
    { label: "Random",      value: 55,  color: palette.umber },
    { label: "No-Memory",   value: 77,  color: semantic.china },
    { label: "Tit-for-Tat", value: 31,  color: palette.gold },
    { label: "Always-C",    value: 0,   color: palette.gold },
  ],
  highlightIndex: 2,
  contextNote: "No-Memory defects 77% of the time despite mutual gains from cooperation.",
  durationSec: 10,
  source: "Axelrod (1984)",
};

// ── Aside composition ─────────────────────────────────────────────────────────

export const EditorialFrameAsideTest: React.FC = () => {
  useCompositionAnimation({ noDrift: true });
  return (
    <AbsoluteFill>
      <EditorialSurface intensity={0.4} backdrop={pickBackdrop("horizon")}>
        <EditorialFrame
          variant="aside"
          kicker="iterated prisoner's dilemma"
          hero="77%"
          body="No-Memory defects in 77% of interactions. Without recall, agents cannot distinguish cooperators from defectors."
          byline="parallax · prisoner's dilemma · 2026"
        >
          <DataChart data={defectionRateData} />
        </EditorialFrame>
      </EditorialSurface>
    </AbsoluteFill>
  );
};

// ── Minimal composition ───────────────────────────────────────────────────────

export const EditorialFrameMinimalTest: React.FC = () => {
  useCompositionAnimation({ noDrift: true });
  return (
    <AbsoluteFill>
      <EditorialSurface intensity={0.4} backdrop={pickBackdrop("cartographic")}>
        <EditorialFrame variant="minimal" showBrandMark>
          <DataChart data={defectionRateData} />
        </EditorialFrame>
      </EditorialSurface>
    </AbsoluteFill>
  );
};
