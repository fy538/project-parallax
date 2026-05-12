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
import { z } from "zod";
import { layout, sec } from "../design/theme";

// Templates
import { ChoroplethMap } from "../templates/ChoroplethMap/ChoroplethMap";
import { RouteAnimation } from "../templates/RouteAnimation/RouteAnimation";
import { AtlasPlate } from "../templates/AtlasPlate/AtlasPlate";
import { ProportionalSymbolMap } from "../templates/ProportionalSymbolMap/ProportionalSymbolMap";
import { CartogramMap } from "../templates/CartogramMap/CartogramMap";
import { DensityMap } from "../templates/DensityMap/DensityMap";
import { StatReveal } from "../templates/StatReveal/StatReveal";
import { DataChart } from "../templates/DataChart/DataChart";
import { TimeSeriesChart } from "../templates/TimeSeriesChart/TimeSeriesChart";
import { ProbabilityGauge } from "../templates/ProbabilityGauge/ProbabilityGauge";
import { BayesianUpdate } from "../templates/BayesianUpdate/BayesianUpdate";
import { RadarChart } from "../templates/RadarChart/RadarChart";
import { SankeyFlow } from "../templates/SankeyFlow/SankeyFlow";
import { PricingWaterfall } from "../templates/PricingWaterfall/PricingWaterfall";
import { KineticTypography } from "../templates/KineticTypography/KineticTypography";
import { TitleTransition } from "../templates/TitleTransition/TitleTransition";
import { FrameworkDiagram } from "../templates/FrameworkDiagram/FrameworkDiagram";
import { NetworkDiagram } from "../templates/NetworkDiagram/NetworkDiagram";
import { SplitComposition } from "../templates/SplitComposition/SplitComposition";
import { DecisionTree } from "../templates/DecisionTree/DecisionTree";
import { GameBoard } from "../templates/GameBoard/GameBoard";
import { BifurcationRoute } from "../templates/BifurcationRoute/BifurcationRoute";
import { HorizontalTimeline } from "../templates/HorizontalTimeline/HorizontalTimeline";
import { EscalationLadder } from "../templates/EscalationLadder/EscalationLadder";
import { DuelingFrameworks } from "../templates/DuelingFrameworks/DuelingFrameworks";
import { TimelineComparison } from "../templates/TimelineComparison/TimelineComparison";
import { DualTimeline } from "../templates/DualTimeline/DualTimeline";
import { TimelineMorph } from "../templates/TimelineMorph/TimelineMorph";
import { ImageComposite } from "../templates/ImageComposite/ImageComposite";
import { PhotoMontage } from "../templates/PhotoMontage/PhotoMontage";
import { AnnotatedImage } from "../templates/AnnotatedImage/AnnotatedImage";

// Catalog data
import { catalogMapsData } from "./Maps";
import { catalogDataData } from "./Data";
import { catalogTypographyData } from "./Typography";
import { catalogTitlesData } from "./Titles";
import { catalogDiagramsData } from "./Diagrams";
import { catalogScenariosData } from "./Scenarios";
import { catalogTimelinesData } from "./Timelines";
import { catalogCinematicData } from "./Cinematic";
import { EditorialHeroDemo, EditorialAsideDemo, EditorialMinimalDemo } from "./Editorial";

import { Slate, SectionDivider } from "./Slate";
import { FilmOverlay } from "../components/FilmOverlay";

// ─── Duration helpers ─────────────────────────────────────────────────────

const SLATE_SEC = 2.5;
const SECTION_SEC = 3.5;
const INTRO_SEC = 5;
const OUTRO_SEC = 5;

const choroplethDurationSec = (data: { phases: { durationSec: number }[] }) =>
  data.phases.reduce((sum, p) => sum + p.durationSec, 0);

const routeDurationSec = (data: { phases: { durationSec: number }[] }) =>
  data.phases.reduce((sum, p) => sum + p.durationSec, 0) + 1;

/** Generic phase-sum helper for AtlasPlate, ProportionalSymbolMap, CartogramMap, DensityMap. */
const phaseDurationSec = (data: { phases: { durationSec: number }[] }) =>
  data.phases.reduce((sum, p) => sum + p.durationSec, 0);

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
  sectionSegment(
    "Maps",
    "ChoroplethMap × 3 · RouteAnimation × 4 · AtlasPlate × 2 · ProportionalSymbol · Cartogram · Density"
  ),

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
  slateSegment("Maps", "RouteAnimation", "rome-radial"),
  {
    durationSec: catalogMapsData.routeRomeRadial.durationSec ?? 9,
    render: () => <RouteAnimation data={catalogMapsData.routeRomeRadial} />,
  },
  slateSegment("Maps", "AtlasPlate", "cocom"),
  {
    durationSec: phaseDurationSec(catalogMapsData.atlasCocom) || 18,
    render: () => <AtlasPlate data={catalogMapsData.atlasCocom} />,
  },
  slateSegment("Maps", "AtlasPlate", "cold-war-vintage"),
  {
    durationSec: phaseDurationSec(catalogMapsData.atlasColdWarVintage) || 20,
    render: () => <AtlasPlate data={catalogMapsData.atlasColdWarVintage} />,
  },
  slateSegment("Maps", "ProportionalSymbolMap", "fabs"),
  {
    durationSec: phaseDurationSec(catalogMapsData.proportionalFabs) || 12,
    render: () => <ProportionalSymbolMap data={catalogMapsData.proportionalFabs} />,
  },
  slateSegment("Maps", "CartogramMap", "eu-population"),
  {
    durationSec: phaseDurationSec(catalogMapsData.cartogramEU) || 12,
    render: () => <CartogramMap data={catalogMapsData.cartogramEU} />,
  },
  slateSegment("Maps", "DensityMap", "fab-sites"),
  {
    durationSec: phaseDurationSec(catalogMapsData.densityFabs) || 10,
    render: () => <DensityMap data={catalogMapsData.densityFabs} />,
  },

  // ── Data ──
  sectionSegment(
    "Data",
    "StatReveal × 3 · DataChart × 4 · TimeSeriesChart × 4 · ProbabilityGauge × 2 · BayesianUpdate · RadarChart · SankeyFlow · PricingWaterfall"
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
  slateSegment("Data", "DataChart", "speeds-bar"),
  {
    durationSec: catalogDataData.chartMountains.durationSec ?? 8,
    render: () => <DataChart data={catalogDataData.chartMountains} />,
  },
  slateSegment("Data", "DataChart", "space-race-comparison"),
  {
    durationSec: catalogDataData.chartSpaceRace.durationSec ?? 8,
    render: () => <DataChart data={catalogDataData.chartSpaceRace} />,
  },
  slateSegment("Data", "DataChart", "axelrod-lollipop"),
  {
    durationSec: catalogDataData.chartAxelrodRankings.durationSec ?? 10,
    render: () => <DataChart data={catalogDataData.chartAxelrodRankings} />,
  },
  slateSegment("Data", "DataChart", "olympics-small-multiples"),
  {
    durationSec: catalogDataData.chartOlympicsSmallMultiples.durationSec ?? 10,
    render: () => <DataChart data={catalogDataData.chartOlympicsSmallMultiples} />,
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
  slateSegment("Data", "TimeSeriesChart", "life-expectancy-slope"),
  {
    durationSec: catalogDataData.tsLifeExpectancySlope.durationSec ?? 12,
    render: () => <TimeSeriesChart data={catalogDataData.tsLifeExpectancySlope} />,
  },
  slateSegment("Data", "TimeSeriesChart", "population-small-multiples"),
  {
    durationSec: catalogDataData.tsPopulationSmallMultiples.durationSec ?? 12,
    render: () => <TimeSeriesChart data={catalogDataData.tsPopulationSmallMultiples} />,
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
  slateSegment("Data", "SankeyFlow", "plastic-fate"),
  {
    durationSec: catalogDataData.sankeyEnergy.durationSec ?? 11,
    render: () => <SankeyFlow data={catalogDataData.sankeyEnergy} />,
  },
  slateSegment("Data", "PricingWaterfall", "coffee-cup"),
  {
    durationSec: catalogDataData.waterfallCoffee.durationSec ?? 10,
    render: () => <PricingWaterfall data={catalogDataData.waterfallCoffee} />,
  },

  // ── Motion-Identity ──
  sectionSegment(
    "Motion-Identity",
    "PricingWaterfall — still / briefing / documentary motion registers"
  ),
  slateSegment("Motion-Identity", "PricingWaterfall", "motion-still"),
  {
    durationSec: catalogDataData.waterfallCoffee.durationSec ?? 10,
    render: () => <PricingWaterfall data={{ ...catalogDataData.waterfallCoffee, motionIdentity: "still" as const }} />,
  },
  slateSegment("Motion-Identity", "PricingWaterfall", "motion-briefing"),
  {
    durationSec: catalogDataData.waterfallCoffee.durationSec ?? 10,
    render: () => <PricingWaterfall data={{ ...catalogDataData.waterfallCoffee, motionIdentity: "briefing" as const }} />,
  },
  slateSegment("Motion-Identity", "PricingWaterfall", "motion-documentary"),
  {
    durationSec: catalogDataData.waterfallCoffee.durationSec ?? 10,
    render: () => <PricingWaterfall data={{ ...catalogDataData.waterfallCoffee, motionIdentity: "documentary" as const }} />,
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
  sectionSegment("Titles", "TitleTransition × 4 — episode-title, section, end-card, editorial-title"),
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
  slateSegment("Titles", "TitleTransition", "editorial"),
  {
    durationSec: catalogTitlesData.titleEditorial.durationSec ?? 4,
    render: () => <TitleTransition data={catalogTitlesData.titleEditorial} />,
  },

  // ── Diagrams ──
  sectionSegment(
    "Diagrams",
    "FrameworkDiagram × 3 · NetworkDiagram · SplitComposition × 2 · DuelingFrameworks"
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
  slateSegment("Diagrams", "DuelingFrameworks", "empire-fall"),
  {
    durationSec: catalogDiagramsData.duelingEmpireFall.durationSec ?? 22,
    render: () => <DuelingFrameworks data={catalogDiagramsData.duelingEmpireFall} />,
  },

  // ── Scenarios ──
  sectionSegment(
    "Scenarios",
    "DecisionTree · GameBoard × 2 · BifurcationRoute"
  ),
  slateSegment("Scenarios", "DecisionTree", "chess-opening"),
  {
    durationSec: catalogScenariosData.treeChessOpening.durationSec ?? 12,
    render: () => <DecisionTree data={catalogScenariosData.treeChessOpening} />,
  },
  slateSegment("Scenarios", "GameBoard", "chess-endgame"),
  {
    durationSec: catalogScenariosData.gameChess.durationSec ?? 10,
    render: () => <GameBoard data={catalogScenariosData.gameChess} />,
  },
  slateSegment("Scenarios", "GameBoard", "stag-hunt"),
  {
    durationSec: catalogScenariosData.gamePayoff.durationSec ?? 9,
    render: () => <GameBoard data={catalogScenariosData.gamePayoff} />,
  },
  slateSegment("Scenarios", "GameBoard", "pd-canonical"),
  {
    durationSec: catalogScenariosData.gamePDCanonical.durationSec ?? 11,
    render: () => <GameBoard data={catalogScenariosData.gamePDCanonical} />,
  },
  slateSegment("Scenarios", "BifurcationRoute", "latin-romance"),
  {
    durationSec: catalogScenariosData.bifurcationLatin.durationSec ?? 12,
    render: () => <BifurcationRoute data={catalogScenariosData.bifurcationLatin} />,
  },

  // ── Timelines ──
  sectionSegment(
    "Timelines",
    "HorizontalTimeline × 3 · EscalationLadder × 2 · TimelineComparison · DualTimeline · TimelineMorph"
  ),
  slateSegment("Timelines", "HorizontalTimeline", "computers"),
  {
    durationSec: catalogTimelinesData.timelineComputers.durationSec ?? 15,
    render: () => <HorizontalTimeline data={catalogTimelinesData.timelineComputers} />,
  },
  slateSegment("Timelines", "HorizontalTimeline", "pandemics-dual"),
  {
    durationSec: catalogTimelinesData.timelineDualPandemics.durationSec ?? 15,
    render: () => <HorizontalTimeline data={catalogTimelinesData.timelineDualPandemics} />,
  },
  slateSegment("Timelines", "HorizontalTimeline", "revolutions-phase"),
  {
    durationSec: catalogTimelinesData.timelineDualRevolutionsPhase.durationSec ?? 18,
    render: () => <HorizontalTimeline data={catalogTimelinesData.timelineDualRevolutionsPhase} />,
  },
  slateSegment("Timelines", "EscalationLadder", "cold-war"),
  {
    durationSec: catalogTimelinesData.ladderColdWar.durationSec ?? 12,
    render: () => <EscalationLadder data={catalogTimelinesData.ladderColdWar} />,
  },
  slateSegment("Timelines", "EscalationLadder", "arms-treaties"),
  {
    durationSec: catalogTimelinesData.ladderArms.durationSec ?? 12,
    render: () => <EscalationLadder data={catalogTimelinesData.ladderArms} />,
  },
  slateSegment("Timelines", "TimelineComparison", "revolutions"),
  {
    durationSec: 16,
    render: () => <TimelineComparison data={catalogTimelinesData.comparisonRevolutions} />,
  },
  slateSegment("Timelines", "DualTimeline", "imperial-transitions"),
  {
    durationSec: catalogTimelinesData.dualImperialTransitions.durationSec ?? 16,
    render: () => <DualTimeline data={catalogTimelinesData.dualImperialTransitions} />,
  },
  slateSegment("Timelines", "TimelineMorph", "blockades"),
  {
    durationSec: catalogTimelinesData.morphBlockades.durationSec ?? 16,
    render: () => <TimelineMorph data={catalogTimelinesData.morphBlockades} />,
  },

  // ── Cinematic ──
  sectionSegment(
    "Cinematic",
    "ImageComposite · PhotoMontage · AnnotatedImage"
  ),
  slateSegment("Cinematic", "ImageComposite", "archive"),
  {
    durationSec: catalogCinematicData.compositeArchive.durationSec ?? 8,
    render: () => <ImageComposite data={catalogCinematicData.compositeArchive} />,
  },
  slateSegment("Cinematic", "PhotoMontage", "treatments"),
  {
    durationSec: catalogCinematicData.montageTreatments.durationSec ?? 12,
    render: () => <PhotoMontage data={catalogCinematicData.montageTreatments} />,
  },
  slateSegment("Cinematic", "AnnotatedImage", "callout-demo"),
  {
    durationSec: catalogCinematicData.annotatedDemo.durationSec ?? 12,
    render: () => <AnnotatedImage data={catalogCinematicData.annotatedDemo} />,
  },

  // ── Editorial ──
  sectionSegment(
    "Editorial",
    "EditorialFrame × 3 — hero, aside, minimal"
  ),
  slateSegment("Editorial", "EditorialFrame", "hero"),
  { durationSec: 14, render: () => <EditorialHeroDemo /> },
  slateSegment("Editorial", "EditorialFrame", "aside"),
  { durationSec: 12, render: () => <EditorialAsideDemo /> },
  slateSegment("Editorial", "EditorialFrame", "minimal"),
  { durationSec: 10, render: () => <EditorialMinimalDemo /> },

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

// ─── Schema (drives Remotion Studio props panel) ─────────────────────────
//
// In Studio: open catalog-showreel → right-hand "Props" panel.
// Flip enableFilmOverlay off to see templates clean; dial filmIntensity
// (0–1) to compare treatment strengths without changing source.

const ShowreelSchema = z.object({
  /** Toggle grain + vignette overlay on the entire showreel. Default: true. */
  enableFilmOverlay: z.boolean().default(true),
  /** Overall FilmOverlay intensity (0 = off, 1 = max). Default: 0.45. */
  filmIntensity: z.number().min(0).max(1).default(0.45),
});

type ShowreelProps = z.infer<typeof ShowreelSchema>;

// ─── The Showreel React component ─────────────────────────────────────────

const Showreel: React.FC<ShowreelProps> = ({
  enableFilmOverlay = true,
  filmIntensity = 0.45,
}) => {
  const series = (
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

  return enableFilmOverlay ? (
    <FilmOverlay effects={["grain", "vignette"]} intensity={filmIntensity}>
      {series}
    </FilmOverlay>
  ) : series;
};

// ─── Composition registration ─────────────────────────────────────────────

export const CatalogShowreel = () => (
  <Composition
    id="catalog-showreel"
    component={Showreel}
    schema={ShowreelSchema}
    defaultProps={{ enableFilmOverlay: true, filmIntensity: 0.45 }}
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
