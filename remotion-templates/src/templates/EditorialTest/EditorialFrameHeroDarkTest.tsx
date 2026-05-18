/**
 * EditorialFrameHeroDarkTest — Dark-mode counterpart to EditorialFrameHeroTest.
 *
 * Demonstrates the EditorialFrame "hero" variant with mode="dark" on the
 * night-grid backdrop (analytical dark register, sibling to the light
 * strategy-grid). Mirror of the light test except for:
 *   - backdrop: night-grid (register: "dark")
 *   - mode="dark" passed explicitly to EditorialFrame
 *
 * Verifies that:
 *   - Hero number reads in bone, not ink
 *   - Headline, body, kicker, byline all flip to bone/umber
 *   - Brand mark stroke + glyph render in bone
 *   - Amber accent (chart highlight) still works on a dark backdrop
 *
 * Render a still for visual comparison:
 *   npx remotion still EditorialFrameHeroDarkTest --frame=90 \
 *     --output=design-references/editorial-frame-hero-dark-render.png
 */

import React from "react";
import { AbsoluteFill } from "remotion";
import { EditorialSurface, pickBackdrop } from "../../components/EditorialSurface";
import { EditorialScaffold } from "../../components/EditorialScaffold";
import { DataChart } from "../DataChart/DataChart";
import { useCompositionAnimation } from "../../hooks/useCompositionAnimation";
import { palette, semantic } from "../../design/theme";
import type { DataChartData } from "../DataChart/types";

// ── Sample data: cooperation rate by strategy across 200 rounds ──────────────
// Same data as the light test so visual comparison isolates the mode flip.

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

export const EditorialFrameHeroDarkTest: React.FC = () => {
  useCompositionAnimation({ noDrift: true });
  return (
    <AbsoluteFill>
      <EditorialSurface intensity={0.4} backdrop={pickBackdrop("night-grid")}>
        <EditorialScaffold
          variant="hero"
          mode="dark"
          kicker="iterated prisoner's dilemma"
          hero="23%"
          headline="Does cooperation need memory?"
          body="Cooperation rate after 200 rounds when players cannot recall prior moves."
          byline="parallax · prisoner's dilemma · 2026"
        >
          <DataChart data={cooperationData} />
        </EditorialScaffold>
      </EditorialSurface>
    </AbsoluteFill>
  );
};
