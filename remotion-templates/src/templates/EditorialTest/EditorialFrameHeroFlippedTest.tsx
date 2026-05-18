/**
 * EditorialFrameHeroFlippedTest — Mirror of the hero test, paired with the
 * right-anchored "reading-room" backdrop.
 *
 * Same prisoner's-dilemma cooperation data as EditorialFrameHeroTest. The
 * point of this composition: verify that the hero-flipped variant (hero
 * right, chart left) sits cleanly over a backdrop whose visual weight is on
 * the right side, without the foreground hero block fighting the backdrop's
 * book-wall + light-beam anchor.
 */

import React from "react";
import { AbsoluteFill } from "remotion";
import { EditorialSurface, pickBackdrop } from "../../components/EditorialSurface";
import { EditorialScaffold } from "../../components/EditorialScaffold";
import { DataChart } from "../DataChart/DataChart";
import { useCompositionAnimation } from "../../hooks/useCompositionAnimation";
import { palette, semantic } from "../../design/theme";
import type { DataChartData } from "../DataChart/types";

const cooperationData: DataChartData = {
  episode: "prisoners-dilemma",
  title: "",
  subtitle: "",
  variant: "comparison",
  unit: "%",
  comparisonPairs: [
    { label: "Rd. 50",  leftValue: 71, rightValue: 34, leftLabel: "TfT", rightLabel: "No-mem" },
    { label: "Rd. 100", leftValue: 69, rightValue: 28, leftLabel: "TfT", rightLabel: "No-mem" },
    { label: "Rd. 150", leftValue: 68, rightValue: 25, leftLabel: "TfT", rightLabel: "No-mem" },
    { label: "Rd. 200", leftValue: 67, rightValue: 23, leftLabel: "TfT", rightLabel: "No-mem" },
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

export const EditorialFrameHeroFlippedTest: React.FC = () => {
  useCompositionAnimation({ noDrift: true });
  return (
    <AbsoluteFill>
      <EditorialSurface intensity={0.4} backdrop={pickBackdrop("reading-room")}>
        <EditorialScaffold
          variant="hero-flipped"
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
