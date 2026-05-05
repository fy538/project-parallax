/**
 * Showreel — one mega-composition that plays through every catalog variant
 * back-to-back with section dividers and per-demo slates.
 *
 * Total duration is computed at calculateMetadata time from the segment list.
 * Renders to a single MP4 you can scrub or share.
 *
 * To add a new template variant to the showreel: import its data in this
 * file, add a `demoSegment(...)` entry to the relevant section, and the
 * total duration recomputes automatically.
 */

import React from "react";
import { Composition, Series } from "remotion";
import { layout, sec } from "../design/theme";

// Templates
import { ChoroplethMap } from "../templates/ChoroplethMap/ChoroplethMap";
import { RouteAnimation } from "../templates/RouteAnimation/RouteAnimation";
import { StatReveal } from "../templates/StatReveal/StatReveal";
import { DataChart } from "../templates/DataChart/DataChart";
import { TimeSeriesChart } from "../templates/TimeSeriesChart/TimeSeriesChart";
import { ProbabilityGauge } from "../templates/ProbabilityGauge/ProbabilityGauge";
import { BayesianUpdate } from "../templates/BayesianUpdate/BayesianUpdate";
import { RadarChart } from "../templates/RadarChart/RadarChart";
import { SankeyFlow } from "../templates/SankeyFlow/SankeyFlow";
import { KineticTypography } from "../templates/KineticTypography/KineticTypography";
import { TitleTransition } from "../templates/TitleTransition/TitleTransition";
import { FrameworkDiagram } from "../templates/FrameworkDiagram/FrameworkDiagram";
import { NetworkDiagram } from "../templates/NetworkDiagram/NetworkDiagram";
import { SplitComposition } from "../templates/SplitComposition/SplitComposition";

// Catalog data
import { catalogMapsData } from "./Maps";
import { catalogDataData } from "./Data";
import { catalogTypographyData } from "./Typography";
import { catalogTitlesData } from "./Titles";
import { catalogDiagramsData } from "./Diagrams";

import { Slate, SectionDivider } from "./Slate";

// ─── Duration helpers ─────────────────────────────────────────────────────

const SLATE_SEC = 2.5;
const SECTION_SEC = 3.5;
const INTRO_SEC = 5;
const OUTRO_SEC = 5;

const choroplethDurationSec = (data: { phases: { durationSec: number }[] }) =>
  data.phases.reduce((sum, p) => sum + p.durationSec, 0);

const routeDurationSec = (data: { phases: { durationSec: number }[] }) =>
  data.phases.reduce((sum, p) => sum + p.durationSec, 0) + 1;

// ─── Segment definitions ──────────────────────────────────────────────────

interface ShowreelSegment {
  durationSec: number;
  render: () => React.ReactNode;
}

const slateSegment = (
  category: string,
  template: string,
  variant: string
): ShowreelSegment => ({
  durationSec: SLATE_SEC,
  render: () => <Slate category={category} template={template} variant={variant} />,
});

const sectionSegment = (
  category: string,
  description: string
): ShowreelSegment => ({
  durationSec: SECTION_SEC,
  render: () => <SectionDivider category={category} description={description} />,
});

const SHOWREEL_SEGMENTS: ShowreelSegment[] = [
  // Intro
  {
    durationSec: INTRO_SEC,
    render: () => <TitleTransition data={catalogTitlesData.titleEpisode} />,
  },

  // ── Maps ──
  sectionSegment("Maps", "ChoroplethMap × 3 · RouteAnimation × 3"),

  slateSegment("Maps", "ChoroplethMap", "g7"),
  {
    durationSec: choroplethDurationSec(catalogMapsData.choroplethG7),
    render: () => <ChoroplethMap data={catalogMapsData.choroplethG7} />,
  },
  slateSegment("Maps", "ChoroplethMap", "cold-war-blocs"),
  {
    durationSec: choroplethDurationSec(catalogMapsData.choroplethBlocs),
    render: () => <ChoroplethMap data={catalogMapsData.choroplethBlocs} />,
  },
  slateSegment("Maps", "ChoroplethMap", "tordesillas"),
  {
    durationSec: choroplethDurationSec(catalogMapsData.choroplethTordesillas),
    render: () => <ChoroplethMap data={catalogMapsData.choroplethTordesillas} />,
  },
  slateSegment("Maps", "RouteAnimation", "silk-road"),
  {
    durationSec: routeDurationSec(catalogMapsData.routeSilkRoad),
    render: () => <RouteAnimation data={catalogMapsData.routeSilkRoad} />,
  },
  slateSegment("Maps", "RouteAnimation", "magellan"),
  {
    durationSec: routeDurationSec(catalogMapsData.routeMagellan),
    render: () => <RouteAnimation data={catalogMapsData.routeMagellan} />,
  },
  slateSegment("Maps", "RouteAnimation", "chokepoints"),
  {
    durationSec: routeDurationSec(catalogMapsData.routeChokepoints),
    render: () => <RouteAnimation data={catalogMapsData.routeChokepoints} />,
  },

  // ── Data ──
  sectionSegment(
    "Data",
    "StatReveal × 3 · DataChart × 2 · TimeSeriesChart × 2 · ProbabilityGauge × 2 · BayesianUpdate · RadarChart · SankeyFlow"
  ),

  slateSegment("Data", "StatReveal", "apollo-cost"),
  {
    durationSec: catalogDataData.statApollo.durationSec ?? 9,
    render: () => <StatReveal data={catalogDataData.statApollo} />,
  },
  slateSegment("Data", "StatReveal", "mariana-depth"),
  {
    durationSec: catalogDataData.statMariana.durationSec ?? 9,
    render: () => <StatReveal data={catalogDataData.statMariana} />,
  },
  slateSegment("Data", "StatReveal", "habitable-land"),
  {
    durationSec: catalogDataData.statHabitable.durationSec ?? 9,
    render: () => <StatReveal data={catalogDataData.statHabitable} />,
  },
  slateSegment("Data", "DataChart", "mountains-bar"),
  {
    durationSec: catalogDataData.chartMountains.durationSec ?? 8,
    render: () => <DataChart data={catalogDataData.chartMountains} />,
  },
  slateSegment("Data", "DataChart", "space-race-comparison"),
  {
    durationSec: catalogDataData.chartSpaceRace.durationSec ?? 8,
    render: () => <DataChart data={catalogDataData.chartSpaceRace} />,
  },
  slateSegment("Data", "TimeSeriesChart", "atmospheric-co2"),
  {
    durationSec: catalogDataData.tsCarbonDioxide.durationSec ?? 12,
    render: () => <TimeSeriesChart data={catalogDataData.tsCarbonDioxide} />,
  },
  slateSegment("Data", "TimeSeriesChart", "world-population"),
  {
    durationSec: catalogDataData.tsPopulation.durationSec ?? 10,
    render: () => <TimeSeriesChart data={catalogDataData.tsPopulation} />,
  },
  slateSegment("Data", "ProbabilityGauge", "weather"),
  {
    durationSec: catalogDataData.gaugeWeather.durationSec ?? 8,
    render: () => <ProbabilityGauge data={catalogDataData.gaugeWeather} />,
  },
  slateSegment("Data", "ProbabilityGauge", "scorecard"),
  {
    durationSec: catalogDataData.gaugeScorecard.durationSec ?? 8,
    render: () => <ProbabilityGauge data={catalogDataData.gaugeScorecard} />,
  },
  slateSegment("Data", "BayesianUpdate", "venice-floods"),
  {
    durationSec: catalogDataData.bayesVenice.durationSec ?? 12,
    render: () => <BayesianUpdate data={catalogDataData.bayesVenice} />,
  },
  slateSegment("Data", "RadarChart", "track-specialists"),
  {
    durationSec: catalogDataData.radarAthletes.durationSec ?? 11,
    render: () => <RadarChart data={catalogDataData.radarAthletes} />,
  },
  slateSegment("Data", "SankeyFlow", "energy-flows"),
  {
    durationSec: catalogDataData.sankeyEnergy.durationSec ?? 11,
    render: () => <SankeyFlow data={catalogDataData.sankeyEnergy} />,
  },

  // ── Typography ──
  sectionSegment("Typography", "KineticTypography × 4 — quote, definition, bilingual, statistic"),
  slateSegment("Typography", "KineticTypography", "quote"),
  {
    durationSec: catalogTypographyData.quoteHeraclitus.durationSec ?? 6,
    render: () => <KineticTypography data={catalogTypographyData.quoteHeraclitus} />,
  },
  slateSegment("Typography", "KineticTypography", "definition"),
  {
    durationSec: catalogTypographyData.definitionAnagnorisis.durationSec ?? 6,
    render: () => <KineticTypography data={catalogTypographyData.definitionAnagnorisis} />,
  },
  slateSegment("Typography", "KineticTypography", "bilingual"),
  {
    durationSec: catalogTypographyData.bilingualTianxia.durationSec ?? 6,
    render: () => <KineticTypography data={catalogTypographyData.bilingualTianxia} />,
  },
  slateSegment("Typography", "KineticTypography", "statistic"),
  {
    durationSec: catalogTypographyData.statisticLighthouse.durationSec ?? 6,
    render: () => <KineticTypography data={catalogTypographyData.statisticLighthouse} />,
  },

  // ── Titles ──
  sectionSegment("Titles", "TitleTransition × 3 — episode-title, section, end-card"),
  slateSegment("Titles", "TitleTransition", "section"),
  {
    durationSec: catalogTitlesData.titleSection.durationSec ?? 4,
    render: () => <TitleTransition data={catalogTitlesData.titleSection} />,
  },
  slateSegment("Titles", "TitleTransition", "end-card"),
  {
    durationSec: catalogTitlesData.titleEndCard.durationSec ?? 5,
    render: () => <TitleTransition data={catalogTitlesData.titleEndCard} />,
  },

  // ── Diagrams ──
  sectionSegment(
    "Diagrams",
    "FrameworkDiagram × 3 · NetworkDiagram × 2 · SplitComposition × 2"
  ),
  slateSegment("Diagrams", "FrameworkDiagram", "comparison"),
  {
    durationSec: catalogDiagramsData.fwComparison.durationSec ?? 10,
    render: () => <FrameworkDiagram data={catalogDiagramsData.fwComparison} />,
  },
  slateSegment("Diagrams", "FrameworkDiagram", "flow"),
  {
    durationSec: catalogDiagramsData.fwFlow.durationSec ?? 10,
    render: () => <FrameworkDiagram data={catalogDiagramsData.fwFlow} />,
  },
  slateSegment("Diagrams", "FrameworkDiagram", "matrix"),
  {
    durationSec: catalogDiagramsData.fwMatrix.durationSec ?? 10,
    render: () => <FrameworkDiagram data={catalogDiagramsData.fwMatrix} />,
  },
  slateSegment("Diagrams", "NetworkDiagram", "hub-spoke"),
  {
    durationSec: catalogDiagramsData.nwHubSpoke.durationSec ?? 12,
    render: () => <NetworkDiagram data={catalogDiagramsData.nwHubSpoke} />,
  },
  slateSegment("Diagrams", "NetworkDiagram", "horizontal-chain"),
  {
    durationSec: catalogDiagramsData.nwChain.durationSec ?? 11,
    render: () => <NetworkDiagram data={catalogDiagramsData.nwChain} />,
  },
  slateSegment("Diagrams", "SplitComposition", "maps"),
  {
    durationSec: catalogDiagramsData.splitMaps.durationSec ?? 11,
    render: () => <SplitComposition data={catalogDiagramsData.splitMaps} />,
  },
  slateSegment("Diagrams", "SplitComposition", "time"),
  {
    durationSec: catalogDiagramsData.splitTime.durationSec ?? 11,
    render: () => <SplitComposition data={catalogDiagramsData.splitTime} />,
  },

  // Outro
  {
    durationSec: OUTRO_SEC,
    render: () => <TitleTransition data={catalogTitlesData.titleEndCard} />,
  },
];

const TOTAL_DURATION_SEC = SHOWREEL_SEGMENTS.reduce(
  (sum, s) => sum + s.durationSec,
  0
);

// ─── The Showreel React component ─────────────────────────────────────────

const Showreel: React.FC = () => {
  return (
    <Series>
      {SHOWREEL_SEGMENTS.map((segment, i) => (
        <Series.Sequence
          key={i}
          durationInFrames={Math.max(1, sec(segment.durationSec))}
        >
          {segment.render()}
        </Series.Sequence>
      ))}
    </Series>
  );
};

// ─── Composition registration ─────────────────────────────────────────────

export const CatalogShowreel = () => (
  <Composition
    id="catalog-showreel"
    component={Showreel}
    durationInFrames={Math.max(1, sec(TOTAL_DURATION_SEC))}
    fps={layout.fps}
    width={layout.width}
    height={layout.height}
  />
);

// Diagnostics: useful for debugging when you add a new variant.
// console.log(`[Showreel] ${SHOWREEL_SEGMENTS.length} segments, ${TOTAL_DURATION_SEC.toFixed(1)}s total`);
export const SHOWREEL_TOTAL_SECONDS = TOTAL_DURATION_SEC;
export const SHOWREEL_SEGMENT_COUNT = SHOWREEL_SEGMENTS.length;
