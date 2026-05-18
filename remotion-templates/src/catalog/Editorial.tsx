/**
 * Catalog — Editorial category.
 *
 * EditorialFrame × 3 variants: hero, aside, minimal.
 * Subjects are channel-toned but episode-neutral.
 */

import React from "react";
import { Composition, AbsoluteFill } from "remotion";
import { EditorialSurface } from "../components/EditorialSurface";
import { EditorialScaffold } from "../components/EditorialScaffold";
import { DataChart } from "../templates/DataChart/DataChart";
import { useCompositionAnimation } from "../hooks/useCompositionAnimation";
import { layout, sec, palette, semantic } from "../design/theme";
import type { DataChartData } from "../templates/DataChart/types";
import { CATALOG_EPISODE, catalogId } from "./helpers";

// ── Demo data ─────────────────────────────────────────────────────────────────

const cooperationRates: DataChartData = {
  episode: CATALOG_EPISODE,
  title: "",
  subtitle: "",
  variant: "bar",
  unit: "%",
  dataPoints: [
    { label: "Round 1",   value: 82, color: palette.gold },
    { label: "Round 50",  value: 71, color: palette.gold },
    { label: "Round 100", value: 67, color: palette.gold },
    { label: "Round 150", value: 62, color: palette.gold },
    { label: "Round 200", value: 58, color: palette.gold },
  ],
  highlightIndex: 0,
  contextNote: "Cooperation remains above 50% throughout — iteration sustains it.",
  durationSec: 10,
  source: "Axelrod (1984) iterated tournament",
};

const diffusionData: DataChartData = {
  episode: CATALOG_EPISODE,
  title: "",
  subtitle: "",
  variant: "comparison",
  unit: "",
  comparisonPairs: [
    { label: "1960s", leftValue: 12,  rightValue: 4,   leftLabel: "Theory", rightLabel: "Empirical" },
    { label: "1970s", leftValue: 38,  rightValue: 15,  leftLabel: "Theory", rightLabel: "Empirical" },
    { label: "1980s", leftValue: 140, rightValue: 62,  leftLabel: "Theory", rightLabel: "Empirical" },
    { label: "1990s", leftValue: 890, rightValue: 310, leftLabel: "Theory", rightLabel: "Empirical" },
  ],
  leftGroupLabel: "Theory Papers",
  rightGroupLabel: "Empirical Studies",
  leftGroupColor: palette.gold,
  rightGroupColor: semantic.china,
  highlightIndex: 3,
  contextNote: "Theoretical diffusion outpaced empirical testing 3:1 through the 1990s.",
  durationSec: 12,
  source: "JSTOR citation analysis",
};

// ── Demo compositions ─────────────────────────────────────────────────────────

export const EditorialHeroDemo: React.FC = () => {
  useCompositionAnimation({ noDrift: true });
  return (
    <AbsoluteFill>
      <EditorialSurface intensity={0.6}>
        <EditorialScaffold
          variant="hero"
          kicker="cooperation theory"
          // Hero matches the highlighted bar (cooperationRates.highlightIndex
          // = 0 → Round 1 = 82%). Previously this was "67%" (Round 100, the
          // median), which made the editorial frame and the chart point at
          // different answers. The chart now emphasises Round 1; the hero
          // names it.
          hero="82%"
          headline="Even round one breaks the model"
          body="The one-shot Prisoner's Dilemma predicts defection. Axelrod's iterated tournament saw 82% cooperation in round one — and cooperation never fell below 50% across all 200 rounds."
          byline="parallax · strategic analysis · catalog"
        >
          <DataChart data={cooperationRates} />
        </EditorialScaffold>
      </EditorialSurface>
    </AbsoluteFill>
  );
};

export const EditorialAsideDemo: React.FC = () => {
  useCompositionAnimation({ noDrift: true });
  return (
    <AbsoluteFill>
      <EditorialSurface intensity={0.6}>
        <EditorialScaffold
          variant="aside"
          kicker="theory diffusion"
          hero="3:1"
          body="Theoretical papers outpaced empirical studies three-to-one across every decade of the game-theory boom. The model spread faster than the evidence."
          byline="parallax · academic analysis · catalog"
        >
          <DataChart data={diffusionData} />
        </EditorialScaffold>
      </EditorialSurface>
    </AbsoluteFill>
  );
};

export const EditorialMinimalDemo: React.FC = () => {
  useCompositionAnimation({ noDrift: true });
  return (
    <AbsoluteFill>
      <EditorialSurface intensity={0.6}>
        <EditorialScaffold variant="minimal" showBrandMark>
          <DataChart data={cooperationRates} />
        </EditorialScaffold>
      </EditorialSurface>
    </AbsoluteFill>
  );
};

// ── Composition registrations ─────────────────────────────────────────────────

export const CatalogEditorialHero = () => (
  <Composition
    id={catalogId("Editorial", "hero")}
    component={EditorialHeroDemo}
    width={layout.width}
    height={layout.height}
    fps={layout.fps}
    durationInFrames={sec(14)}
    defaultProps={{}}
  />
);

export const CatalogEditorialAside = () => (
  <Composition
    id={catalogId("Editorial", "aside")}
    component={EditorialAsideDemo}
    width={layout.width}
    height={layout.height}
    fps={layout.fps}
    durationInFrames={sec(12)}
    defaultProps={{}}
  />
);

export const CatalogEditorialMinimal = () => (
  <Composition
    id={catalogId("Editorial", "minimal")}
    component={EditorialMinimalDemo}
    width={layout.width}
    height={layout.height}
    fps={layout.fps}
    durationInFrames={sec(10)}
    defaultProps={{}}
  />
);
