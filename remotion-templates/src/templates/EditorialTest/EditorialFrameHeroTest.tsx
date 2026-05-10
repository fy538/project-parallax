/**
 * EditorialFrameHeroTest — Prisoner's dilemma cooperation data in hero layout.
 *
 * Demonstrates the EditorialFrame "hero" variant wrapping DataChart.
 * Exact strings from the spec:
 *   kicker: "iterated prisoner's dilemma"
 *   hero:   "23%"
 *   headline: "Does cooperation need memory?"
 *   body: "Cooperation rate after 200 rounds when players cannot recall prior moves."
 *   byline: "parallax · prisoner's dilemma · 2026"
 *
 * Render a still for visual comparison:
 *   npx remotion still EditorialFrameHeroTest --frame=90 \
 *     --output=design-references/editorial-frame-hero-render.png
 */

import React from "react";
import { AbsoluteFill } from "remotion";
import { EditorialSurface, pickBackdrop } from "../../components/EditorialSurface";
import { EditorialFrame } from "../../components/EditorialFrame";
import { DataChart } from "../DataChart/DataChart";
import { useCompositionAnimation } from "../../hooks/useCompositionAnimation";
import { palette, semantic } from "../../design/theme";
import type { DataChartData } from "../DataChart/types";

// ── Sample data: cooperation rate by strategy across 200 rounds ──────────────
// Two-group comparison: Tit-for-Tat (amber, memory-enabled) vs No-Memory (rust).
// Data per Axelrod (1984) iterated tournament modeling.

const cooperationData: DataChartData = {
  episode: "prisoners-dilemma",
  title: "",
  subtitle: "",
  variant: "comparison",
  unit: "%",
  comparisonPairs: [
    {
      label: "Rd. 50",
      leftValue: 71,
      rightValue: 34,
      leftLabel: "TfT",
      rightLabel: "No-mem",
    },
    {
      label: "Rd. 100",
      leftValue: 69,
      rightValue: 28,
      leftLabel: "TfT",
      rightLabel: "No-mem",
    },
    {
      label: "Rd. 150",
      leftValue: 68,
      rightValue: 25,
      leftLabel: "TfT",
      rightLabel: "No-mem",
    },
    {
      label: "Rd. 200",
      leftValue: 67,
      rightValue: 23,
      leftLabel: "TfT",
      rightLabel: "No-mem",
    },
  ],
  leftGroupLabel: "Tit-for-Tat",
  rightGroupLabel: "No-Memory",
  leftGroupColor: palette.gold,
  rightGroupColor: semantic.china,
  highlightIndex: 3,
  contextNote: "Cooperation collapses from 67% to 23% without memory.",
  durationSec: 14,
  source: "Axelrod (1984) iterated tournament",
};

// ── Composition ───────────────────────────────────────────────────────────────

export const EditorialFrameHeroTest: React.FC = () => {
  // noDrift: EditorialSurface provides paper background; inner DataChart runs
  // its own useCompositionAnimation for Ken Burns on the chart content.
  useCompositionAnimation({ noDrift: true });
  return (
    <AbsoluteFill>
      <EditorialSurface intensity={0.4} backdrop={pickBackdrop("cartographic")}>
        <EditorialFrame
          variant="hero"
          kicker="iterated prisoner's dilemma"
          hero="23%"
          headline="Does cooperation need memory?"
          body="Cooperation rate after 200 rounds when players cannot recall prior moves."
          byline="parallax · prisoner's dilemma · 2026"
        >
          <DataChart data={cooperationData} />
        </EditorialFrame>
      </EditorialSurface>
    </AbsoluteFill>
  );
};
