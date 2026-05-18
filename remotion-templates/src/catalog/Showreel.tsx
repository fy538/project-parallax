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

// Templates — ChoroplethMap removed from Showreel May 13, 2026 (G7 / Blocs /
// Tordesillas catalog comps migrated to AtlasPlate per the
// Mapbox→AtlasPlate doctrine; see MAP_TEMPLATE_SELECTOR.md).
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
// BifurcationRoute template deleted May 13, 2026 (phylogenetic-tree
// register didn't fit Parallax editorial voice; no episodes queued for it).
import { HorizontalTimeline } from "../templates/HorizontalTimeline/HorizontalTimeline";
import { EscalationLadder } from "../templates/EscalationLadder/EscalationLadder";
import { DuelingFrameworks } from "../templates/DuelingFrameworks/DuelingFrameworks";
// TimelineComparison + DualTimeline are deprecated as of May 12, 2026.
// HorizontalTimeline (dual mode) replaces both. The showreel slates below
// keep the "TimelineComparison"/"DualTimeline" catalogId labels for slate
// continuity, but the underlying renders are HorizontalTimeline.
// TimelineMorph template deleted May 13, 2026 — its single use case
// ("Blockade, Reinvented") migrated to DuelingFrameworks.
// See: src/catalog/Diagrams.tsx → duelingBlockadesSubstrate.
import { ImageComposite } from "../templates/ImageComposite/ImageComposite";
import { PhotoMontage } from "../templates/PhotoMontage/PhotoMontage";
import { AnnotatedImage } from "../templates/AnnotatedImage/AnnotatedImage";
import { TilegramUSMap } from "../templates/TilegramUSMap/TilegramUSMap";
import { BeeswarmChart } from "../templates/BeeswarmChart/BeeswarmChart";
import { CalendarHeatmap } from "../templates/CalendarHeatmap/CalendarHeatmap";
import { ConnectedScatterplot } from "../templates/ConnectedScatterplot/ConnectedScatterplot";
import { Streamgraph } from "../templates/Streamgraph/Streamgraph";
import { RidgelinePlot } from "../templates/RidgelinePlot/RidgelinePlot";
import { MarimekkoChart } from "../templates/MarimekkoChart/MarimekkoChart";
import { TernaryPlot } from "../templates/TernaryPlot/TernaryPlot";
import { HorizonChart } from "../templates/HorizonChart/HorizonChart";
import { DumbbellPlot } from "../templates/DumbbellPlot/DumbbellPlot";
import { ArcDiagram } from "../templates/ArcDiagram/ArcDiagram";
import { StrategicLandscape } from "../templates/StrategicLandscape/StrategicLandscape";
import { BumpChart } from "../templates/BumpChart/BumpChart";
import { PopulationPyramid } from "../templates/PopulationPyramid/PopulationPyramid";
import { RankChangeDotPlot } from "../templates/RankChangeDotPlot/RankChangeDotPlot";
import { IsotypeChart } from "../templates/IsotypeChart/IsotypeChart";

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
import { FILM_OVERLAY_PRESETS } from "../components/FilmOverlayPresets";
import { SegmentBackdrop } from "../components/EditorialSurface";
import { AbsoluteFill } from "remotion";
// Drift-override helpers — `still()` (used here for every showreel segment)
// lives alongside `breathe()`, `settle()`, `sway()`, `documentary()` for use
// by contact sheets, episode-segment previews, and motion-identity demos.
import { still } from "../utils/direction";

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

// `still()` is imported from `../utils/direction` (see top of file).

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
    render: () => <TitleTransition data={still(catalogTitlesData.titleEpisode)} />,
  },

  // ── Maps ──
  // G7 / Blocs / Tordesillas migrated from ChoroplethMap (Mapbox) to
  // AtlasPlate (pure SVG) — May 13, 2026. Static editorial choropleths
  // are NYT/FT/Bloomberg canonical D3+TopoJSON territory; AtlasPlate is
  // structurally identical. See MAP_TEMPLATE_SELECTOR.md migration notes.
  sectionSegment(
    "Maps",
    "AtlasPlate × 5 · RouteAnimation × 4 · ProportionalSymbol · Cartogram · Density · Tilegram"
  ),

  slateSegment("Maps", "AtlasPlate", "g7"),
  {
    durationSec: choroplethDurationSec(catalogMapsData.atlasG7),
    render: () => <AtlasPlate data={still(catalogMapsData.atlasG7)} />,
  },
  slateSegment("Maps", "AtlasPlate", "cold-war-blocs"),
  {
    durationSec: choroplethDurationSec(catalogMapsData.atlasBlocs),
    render: () => <AtlasPlate data={still(catalogMapsData.atlasBlocs)} />,
  },
  slateSegment("Maps", "AtlasPlate", "tordesillas"),
  {
    durationSec: choroplethDurationSec(catalogMapsData.atlasTordesillas),
    render: () => <AtlasPlate data={still(catalogMapsData.atlasTordesillas)} />,
  },
  slateSegment("Maps", "RouteAnimation", "silk-road"),
  {
    durationSec: routeDurationSec(catalogMapsData.routeSilkRoad),
    render: () => <RouteAnimation data={still(catalogMapsData.routeSilkRoad)} />,
  },
  slateSegment("Maps", "RouteAnimation", "magellan"),
  {
    durationSec: routeDurationSec(catalogMapsData.routeMagellan),
    render: () => <RouteAnimation data={still(catalogMapsData.routeMagellan)} />,
  },
  slateSegment("Maps", "RouteAnimation", "chokepoints"),
  {
    durationSec: routeDurationSec(catalogMapsData.routeChokepoints),
    render: () => <RouteAnimation data={still(catalogMapsData.routeChokepoints)} />,
  },
  slateSegment("Maps", "RouteAnimation", "rome-radial"),
  {
    durationSec: catalogMapsData.routeRomeRadial.durationSec ?? 9,
    render: () => <RouteAnimation data={still(catalogMapsData.routeRomeRadial)} />,
  },
  slateSegment("Maps", "AtlasPlate", "cocom"),
  {
    durationSec: phaseDurationSec(catalogMapsData.atlasCocom) || 18,
    render: () => <AtlasPlate data={still(catalogMapsData.atlasCocom)} />,
  },
  slateSegment("Maps", "AtlasPlate", "cold-war-vintage"),
  {
    durationSec: phaseDurationSec(catalogMapsData.atlasColdWarVintage) || 20,
    render: () => <AtlasPlate data={still(catalogMapsData.atlasColdWarVintage)} />,
  },
  slateSegment("Maps", "ProportionalSymbolMap", "fabs"),
  {
    durationSec: phaseDurationSec(catalogMapsData.proportionalFabs) || 12,
    render: () => <ProportionalSymbolMap data={still(catalogMapsData.proportionalFabs)} />,
  },
  slateSegment("Maps", "CartogramMap", "eu-population"),
  {
    durationSec: phaseDurationSec(catalogMapsData.cartogramEU) || 12,
    render: () => <CartogramMap data={still(catalogMapsData.cartogramEU)} />,
  },
  slateSegment("Maps", "DensityMap", "fab-sites"),
  {
    durationSec: phaseDurationSec(catalogMapsData.densityFabs) || 10,
    render: () => <DensityMap data={still(catalogMapsData.densityFabs)} />,
  },
  slateSegment("Maps", "TilegramUSMap", "electoral-2024"),
  {
    durationSec: catalogMapsData.tilegramElectoral2024.durationSec ?? 12,
    render: () => <TilegramUSMap data={still(catalogMapsData.tilegramElectoral2024)} />,
  },

  // ── Data ──
  sectionSegment(
    "Data",
    "StatReveal × 3 · DataChart × 4 · TimeSeriesChart × 4 · ProbabilityGauge × 2 · BayesianUpdate · RadarChart · SankeyFlow · PricingWaterfall · Isotype · BumpChart · PopulationPyramid · RankChangeDotPlot · Beeswarm · Calendar · ConnectedScatter · Streamgraph · Ridgeline · Marimekko · Ternary · Horizon · Dumbbell"
  ),

  slateSegment("Data", "StatReveal", "apollo-cost"),
  {
    durationSec: catalogDataData.statApollo.durationSec ?? 9,
    render: () => <StatReveal data={still(catalogDataData.statApollo)} />,
  },
  slateSegment("Data", "StatReveal", "mariana-depth"),
  {
    durationSec: catalogDataData.statMariana.durationSec ?? 9,
    render: () => <StatReveal data={still(catalogDataData.statMariana)} />,
  },
  slateSegment("Data", "StatReveal", "habitable-land"),
  {
    durationSec: catalogDataData.statHabitable.durationSec ?? 9,
    render: () => <StatReveal data={still(catalogDataData.statHabitable)} />,
  },
  slateSegment("Data", "DataChart", "speeds-bar"),
  {
    durationSec: catalogDataData.chartMountains.durationSec ?? 8,
    render: () => <DataChart data={still(catalogDataData.chartMountains)} />,
  },
  slateSegment("Data", "DataChart", "space-race-comparison"),
  {
    durationSec: catalogDataData.chartSpaceRace.durationSec ?? 8,
    render: () => <DataChart data={still(catalogDataData.chartSpaceRace)} />,
  },
  slateSegment("Data", "DataChart", "axelrod-lollipop"),
  {
    durationSec: catalogDataData.chartAxelrodRankings.durationSec ?? 10,
    render: () => <DataChart data={still(catalogDataData.chartAxelrodRankings)} />,
  },
  slateSegment("Data", "DataChart", "olympics-small-multiples"),
  {
    durationSec: catalogDataData.chartOlympicsSmallMultiples.durationSec ?? 10,
    render: () => <DataChart data={still(catalogDataData.chartOlympicsSmallMultiples)} />,
  },
  slateSegment("Data", "TimeSeriesChart", "atmospheric-co2"),
  {
    durationSec: catalogDataData.tsCarbonDioxide.durationSec ?? 12,
    render: () => <TimeSeriesChart data={still(catalogDataData.tsCarbonDioxide)} />,
  },
  slateSegment("Data", "TimeSeriesChart", "world-population"),
  {
    durationSec: catalogDataData.tsPopulation.durationSec ?? 10,
    render: () => <TimeSeriesChart data={still(catalogDataData.tsPopulation)} />,
  },
  slateSegment("Data", "TimeSeriesChart", "life-expectancy-slope"),
  {
    durationSec: catalogDataData.tsLifeExpectancySlope.durationSec ?? 12,
    render: () => <TimeSeriesChart data={still(catalogDataData.tsLifeExpectancySlope)} />,
  },
  slateSegment("Data", "TimeSeriesChart", "population-small-multiples"),
  {
    durationSec: catalogDataData.tsPopulationSmallMultiples.durationSec ?? 12,
    render: () => <TimeSeriesChart data={still(catalogDataData.tsPopulationSmallMultiples)} />,
  },
  slateSegment("Data", "ProbabilityGauge", "weather"),
  {
    durationSec: catalogDataData.gaugeWeather.durationSec ?? 8,
    render: () => <ProbabilityGauge data={still(catalogDataData.gaugeWeather)} />,
  },
  slateSegment("Data", "ProbabilityGauge", "scorecard"),
  {
    durationSec: catalogDataData.gaugeScorecard.durationSec ?? 8,
    render: () => <ProbabilityGauge data={still(catalogDataData.gaugeScorecard)} />,
  },
  slateSegment("Data", "BayesianUpdate", "venice-floods"),
  {
    durationSec: catalogDataData.bayesVenice.durationSec ?? 12,
    render: () => <BayesianUpdate data={still(catalogDataData.bayesVenice)} />,
  },
  slateSegment("Data", "RadarChart", "track-specialists"),
  {
    durationSec: catalogDataData.radarAthletes.durationSec ?? 11,
    render: () => <RadarChart data={still(catalogDataData.radarAthletes)} />,
  },
  slateSegment("Data", "SankeyFlow", "plastic-fate"),
  {
    durationSec: catalogDataData.sankeyEnergy.durationSec ?? 11,
    render: () => <SankeyFlow data={still(catalogDataData.sankeyEnergy)} />,
  },
  slateSegment("Data", "PricingWaterfall", "coffee-cup"),
  {
    durationSec: catalogDataData.waterfallCoffee.durationSec ?? 10,
    render: () => <PricingWaterfall data={still(catalogDataData.waterfallCoffee)} />,
  },
  slateSegment("Data", "IsotypeChart", "tsmc-chip-share"),
  {
    durationSec: catalogDataData.isotypeChips.durationSec ?? 10,
    render: () => <IsotypeChart data={still(catalogDataData.isotypeChips)} />,
  },
  slateSegment("Data", "BumpChart", "gdp-power-transition"),
  {
    durationSec: catalogDataData.bumpGDP.durationSec ?? 14,
    render: () => <BumpChart data={still(catalogDataData.bumpGDP)} />,
  },
  slateSegment("Data", "PopulationPyramid", "china-morph"),
  {
    durationSec: catalogDataData.pyramidChina.durationSec ?? 14,
    render: () => <PopulationPyramid data={still(catalogDataData.pyramidChina)} />,
  },
  slateSegment("Data", "RankChangeDotPlot", "semiconductors"),
  {
    durationSec: catalogDataData.rankChangeSemiconductors.durationSec ?? 11,
    render: () => <RankChangeDotPlot data={still(catalogDataData.rankChangeSemiconductors)} />,
  },
  slateSegment("Data", "BeeswarmChart", "military-spending"),
  {
    durationSec: catalogDataData.beeswarmMilitarySpending.durationSec ?? 12,
    render: () => <BeeswarmChart data={still(catalogDataData.beeswarmMilitarySpending)} />,
  },
  slateSegment("Data", "CalendarHeatmap", "israel-iran-2024"),
  {
    durationSec: catalogDataData.calendarHeatmapIsraelIran.durationSec ?? 14,
    render: () => <CalendarHeatmap data={still(catalogDataData.calendarHeatmapIsraelIran)} />,
  },
  slateSegment("Data", "ConnectedScatterplot", "phillips-curve"),
  {
    durationSec: catalogDataData.scatterPhillipsCurve.durationSec ?? 14,
    render: () => <ConnectedScatterplot data={still(catalogDataData.scatterPhillipsCurve)} />,
  },
  slateSegment("Data", "Streamgraph", "us-oil-imports"),
  {
    durationSec: catalogDataData.streamgraphUSOil.durationSec ?? 14,
    render: () => <Streamgraph data={still(catalogDataData.streamgraphUSOil)} />,
  },
  slateSegment("Data", "RidgelinePlot", "life-expectancy"),
  {
    durationSec: catalogDataData.ridgelineLifeExpectancy.durationSec ?? 12,
    render: () => <RidgelinePlot data={still(catalogDataData.ridgelineLifeExpectancy)} />,
  },
  slateSegment("Data", "MarimekkoChart", "g7-energy"),
  {
    durationSec: catalogDataData.marimekkoG7Energy.durationSec ?? 14,
    render: () => <MarimekkoChart data={still(catalogDataData.marimekkoG7Energy)} />,
  },
  slateSegment("Data", "TernaryPlot", "un-votes"),
  {
    durationSec: catalogDataData.ternaryUNVotes.durationSec ?? 14,
    render: () => <TernaryPlot data={still(catalogDataData.ternaryUNVotes)} />,
  },
  slateSegment("Data", "HorizonChart", "brics-fx"),
  {
    durationSec: catalogDataData.horizonBRICSFX.durationSec ?? 12,
    render: () => <HorizonChart data={still(catalogDataData.horizonBRICSFX)} />,
  },
  slateSegment("Data", "DumbbellPlot", "income-spread"),
  {
    durationSec: catalogDataData.dumbbellIncome.durationSec ?? 14,
    render: () => <DumbbellPlot data={still(catalogDataData.dumbbellIncome)} />,
  },

  // ── Motion-Identity ──
  sectionSegment(
    "Motion-Identity",
    "PricingWaterfall — still / briefing / documentary motion registers"
  ),
  slateSegment("Motion-Identity", "PricingWaterfall", "motion-still"),
  {
    durationSec: catalogDataData.waterfallCoffee.durationSec ?? 10,
    render: () => <PricingWaterfall data={still({ ...catalogDataData.waterfallCoffee, motionIdentity: "still" as const })} />,
  },
  slateSegment("Motion-Identity", "PricingWaterfall", "motion-briefing"),
  {
    durationSec: catalogDataData.waterfallCoffee.durationSec ?? 10,
    render: () => <PricingWaterfall data={still({ ...catalogDataData.waterfallCoffee, motionIdentity: "briefing" as const })} />,
  },
  slateSegment("Motion-Identity", "PricingWaterfall", "motion-documentary"),
  {
    durationSec: catalogDataData.waterfallCoffee.durationSec ?? 10,
    render: () => <PricingWaterfall data={still({ ...catalogDataData.waterfallCoffee, motionIdentity: "documentary" as const })} />,
  },

  // ── Typography ──
  sectionSegment("Typography", "KineticTypography × 4 — quote, definition, bilingual, statistic"),
  slateSegment("Typography", "KineticTypography", "quote"),
  {
    durationSec: catalogTypographyData.quoteHeraclitus.durationSec ?? 6,
    render: () => <KineticTypography data={still(catalogTypographyData.quoteHeraclitus)} />,
  },
  slateSegment("Typography", "KineticTypography", "definition"),
  {
    durationSec: catalogTypographyData.definitionAnagnorisis.durationSec ?? 6,
    render: () => <KineticTypography data={still(catalogTypographyData.definitionAnagnorisis)} />,
  },
  slateSegment("Typography", "KineticTypography", "bilingual"),
  {
    durationSec: catalogTypographyData.bilingualTianxia.durationSec ?? 6,
    render: () => <KineticTypography data={still(catalogTypographyData.bilingualTianxia)} />,
  },
  slateSegment("Typography", "KineticTypography", "statistic"),
  {
    durationSec: catalogTypographyData.statisticLighthouse.durationSec ?? 6,
    render: () => <KineticTypography data={still(catalogTypographyData.statisticLighthouse)} />,
  },

  // ── Titles ──
  sectionSegment("Titles", "TitleTransition × 4 — episode-title, section, end-card, editorial-title"),
  slateSegment("Titles", "TitleTransition", "section"),
  {
    durationSec: catalogTitlesData.titleSection.durationSec ?? 4,
    render: () => <TitleTransition data={still(catalogTitlesData.titleSection)} />,
  },
  slateSegment("Titles", "TitleTransition", "end-card"),
  {
    durationSec: catalogTitlesData.titleEndCard.durationSec ?? 5,
    render: () => <TitleTransition data={still(catalogTitlesData.titleEndCard)} />,
  },
  slateSegment("Titles", "TitleTransition", "editorial"),
  {
    durationSec: catalogTitlesData.titleEditorial.durationSec ?? 4,
    render: () => <TitleTransition data={still(catalogTitlesData.titleEditorial)} />,
  },

  // ── Diagrams ──
  sectionSegment(
    "Diagrams",
    "FrameworkDiagram × 3 · NetworkDiagram × 2 · SplitComposition × 2 · DuelingFrameworks · ArcDiagram · StrategicLandscape"
  ),
  slateSegment("Diagrams", "FrameworkDiagram", "comparison"),
  {
    durationSec: catalogDiagramsData.fwComparison.durationSec ?? 10,
    render: () => <FrameworkDiagram data={still(catalogDiagramsData.fwComparison)} />,
  },
  slateSegment("Diagrams", "FrameworkDiagram", "flow"),
  {
    durationSec: catalogDiagramsData.fwFlow.durationSec ?? 10,
    render: () => <FrameworkDiagram data={still(catalogDiagramsData.fwFlow)} />,
  },
  slateSegment("Diagrams", "FrameworkDiagram", "matrix"),
  {
    durationSec: catalogDiagramsData.fwMatrix.durationSec ?? 10,
    render: () => <FrameworkDiagram data={still(catalogDiagramsData.fwMatrix)} />,
  },
  slateSegment("Diagrams", "NetworkDiagram", "hub-spoke"),
  {
    durationSec: catalogDiagramsData.nwHubSpoke.durationSec ?? 12,
    render: () => <NetworkDiagram data={still(catalogDiagramsData.nwHubSpoke)} />,
  },
  slateSegment("Diagrams", "NetworkDiagram", "bipartite"),
  {
    durationSec: catalogDiagramsData.nwBipartite.durationSec ?? 12,
    render: () => <NetworkDiagram data={still(catalogDiagramsData.nwBipartite)} />,
  },
  slateSegment("Diagrams", "ArcDiagram", "grand-strategy"),
  {
    durationSec: catalogDiagramsData.arcDiagramGrandStrategy.durationSec ?? 14,
    render: () => <ArcDiagram data={still(catalogDiagramsData.arcDiagramGrandStrategy)} />,
  },
  slateSegment("Diagrams", "StrategicLandscape", "semiconductor-strategy"),
  {
    durationSec: catalogDiagramsData.strategicLandscapeDemo.durationSec ?? 10,
    render: () => <StrategicLandscape data={still(catalogDiagramsData.strategicLandscapeDemo)} />,
  },
  slateSegment("Diagrams", "SplitComposition", "maps"),
  {
    durationSec: catalogDiagramsData.splitMaps.durationSec ?? 11,
    render: () => <SplitComposition data={still(catalogDiagramsData.splitMaps)} />,
  },
  slateSegment("Diagrams", "SplitComposition", "time"),
  {
    durationSec: catalogDiagramsData.splitTime.durationSec ?? 11,
    render: () => <SplitComposition data={still(catalogDiagramsData.splitTime)} />,
  },
  slateSegment("Diagrams", "DuelingFrameworks", "empire-fall"),
  {
    durationSec: catalogDiagramsData.duelingEmpireFall.durationSec ?? 22,
    render: () => <DuelingFrameworks data={still(catalogDiagramsData.duelingEmpireFall)} />,
  },

  // ── Scenarios ──
  sectionSegment(
    "Scenarios",
    "DecisionTree · GameBoard × 3"
  ),
  slateSegment("Scenarios", "DecisionTree", "chess-opening"),
  {
    durationSec: catalogScenariosData.treeChessOpening.durationSec ?? 12,
    render: () => <DecisionTree data={still(catalogScenariosData.treeChessOpening)} />,
  },
  slateSegment("Scenarios", "GameBoard", "chess-endgame"),
  {
    durationSec: catalogScenariosData.gameChess.durationSec ?? 10,
    render: () => <GameBoard data={still(catalogScenariosData.gameChess)} />,
  },
  slateSegment("Scenarios", "GameBoard", "stag-hunt"),
  {
    durationSec: catalogScenariosData.gamePayoff.durationSec ?? 9,
    render: () => <GameBoard data={still(catalogScenariosData.gamePayoff)} />,
  },
  slateSegment("Scenarios", "GameBoard", "pd-canonical"),
  {
    durationSec: catalogScenariosData.gamePDCanonical.durationSec ?? 11,
    render: () => <GameBoard data={still(catalogScenariosData.gamePDCanonical)} />,
  },
  // BifurcationRoute slate removed May 13, 2026 with the template deletion.

  // ── Timelines ──
  sectionSegment(
    "Timelines",
    "HorizontalTimeline × 5 (single, dual×3, phase-aligned) · EscalationLadder × 2"
  ),
  slateSegment("Timelines", "HorizontalTimeline", "computers"),
  {
    durationSec: catalogTimelinesData.timelineComputers.durationSec ?? 15,
    render: () => <HorizontalTimeline data={still(catalogTimelinesData.timelineComputers)} />,
  },
  slateSegment("Timelines", "HorizontalTimeline", "pandemics-dual"),
  {
    durationSec: catalogTimelinesData.timelineDualPandemics.durationSec ?? 15,
    render: () => <HorizontalTimeline data={still(catalogTimelinesData.timelineDualPandemics)} />,
  },
  slateSegment("Timelines", "HorizontalTimeline", "revolutions-phase"),
  {
    durationSec: catalogTimelinesData.timelineDualRevolutionsPhase.durationSec ?? 18,
    render: () => <HorizontalTimeline data={still(catalogTimelinesData.timelineDualRevolutionsPhase)} />,
  },
  slateSegment("Timelines", "EscalationLadder", "cold-war"),
  {
    durationSec: catalogTimelinesData.ladderColdWar.durationSec ?? 12,
    render: () => <EscalationLadder data={still(catalogTimelinesData.ladderColdWar)} />,
  },
  slateSegment("Timelines", "EscalationLadder", "arms-treaties"),
  {
    durationSec: catalogTimelinesData.ladderArms.durationSec ?? 12,
    render: () => <EscalationLadder data={still(catalogTimelinesData.ladderArms)} />,
  },
  // Was: TimelineComparison "revolutions" — migrated May 12, 2026 to
  // HorizontalTimeline dual mode (Industrial Revolution vs Information Revolution).
  slateSegment("Timelines", "HorizontalTimeline", "industrial-info-dual"),
  {
    durationSec: 16,
    render: () => <HorizontalTimeline data={still(catalogTimelinesData.timelineDualIndustrialInfo)} />,
  },
  // Was: DualTimeline "imperial-transitions" — migrated May 12, 2026 to
  // HorizontalTimeline dual mode (Rome→Byzantium vs Britain→America).
  slateSegment("Timelines", "HorizontalTimeline", "imperial-transitions-dual"),
  {
    durationSec: catalogTimelinesData.timelineDualImperialTransitions.durationSec ?? 16,
    render: () => <HorizontalTimeline data={still(catalogTimelinesData.timelineDualImperialTransitions)} />,
  },
  // Was: TimelineMorph "blockades" — migrated May 13, 2026 to
  // DuelingFrameworks (structural comparison, not chronological morph).
  // See src/catalog/Diagrams.tsx → duelingBlockadesSubstrate.
  slateSegment("Timelines", "DuelingFrameworks", "blockades-substrate"),
  {
    durationSec: catalogDiagramsData.duelingBlockadesSubstrate.durationSec ?? 20,
    render: () => <DuelingFrameworks data={still(catalogDiagramsData.duelingBlockadesSubstrate)} />,
  },

  // ── Cinematic ──
  sectionSegment(
    "Cinematic",
    "ImageComposite · PhotoMontage · AnnotatedImage"
  ),
  slateSegment("Cinematic", "ImageComposite", "archive"),
  {
    durationSec: catalogCinematicData.compositeArchive.durationSec ?? 8,
    render: () => <ImageComposite data={still(catalogCinematicData.compositeArchive)} />,
  },
  slateSegment("Cinematic", "PhotoMontage", "treatments"),
  {
    durationSec: catalogCinematicData.montageTreatments.durationSec ?? 12,
    render: () => <PhotoMontage data={still(catalogCinematicData.montageTreatments)} />,
  },
  slateSegment("Cinematic", "AnnotatedImage", "callout-demo"),
  {
    durationSec: catalogCinematicData.annotatedDemo.durationSec ?? 12,
    render: () => <AnnotatedImage data={still(catalogCinematicData.annotatedDemo)} />,
  },

  // ── Editorial ──
  sectionSegment(
    "Editorial",
    "EditorialScaffold × 3 — hero, aside, minimal"
  ),
  slateSegment("Editorial", "EditorialScaffold", "hero"),
  { durationSec: 14, render: () => <EditorialHeroDemo /> },
  slateSegment("Editorial", "EditorialScaffold", "aside"),
  { durationSec: 12, render: () => <EditorialAsideDemo /> },
  slateSegment("Editorial", "EditorialScaffold", "minimal"),
  { durationSec: 10, render: () => <EditorialMinimalDemo /> },

  // ── Effects + Backdrops Showcase ──
  // Demonstrates the FilmOverlay 5-preset cascade and the per-segment
  // backdrop selection. The top-of-showreel `enableFilmOverlay` toggle wraps
  // EVERYTHING in grain+vignette uniformly; this section flips that locally
  // so you can see the same template under each of the 5 named presets, then
  // 5 different backdrop ids under the same template. Read this section
  // alongside `remotion-templates/CLAUDE.md` → FilmOverlay cascade.
  sectionSegment(
    "Effects & Backdrops",
    "FilmOverlay presets × 5 (clean, documentary, cinematic, dramatic, archival) · Backdrops × 5 — pairs the cascade with sample backdrop ids"
  ),

  // Five FilmOverlay presets on the same kinetic typography moment.
  // Each tile renders a 6s isolated card so you can see what the grain /
  // light-leak / dust / scratch / vignette stack does at the preset's
  // canonical intensity. This bypasses the global `enableFilmOverlay`
  // toggle on the top level — each preset is rendered locally with its
  // own FilmOverlay wrapper.
  slateSegment("Effects", "FilmOverlay", "clean (no grain, no vignette)"),
  {
    durationSec: 6,
    render: () => (
      <FilmOverlay
        effects={FILM_OVERLAY_PRESETS.clean.effects}
        intensity={FILM_OVERLAY_PRESETS.clean.intensity}
      >
        <KineticTypography data={still(catalogTypographyData.quoteHeraclitus)} />
      </FilmOverlay>
    ),
  },
  slateSegment("Effects", "FilmOverlay", "documentary (grain + vignette)"),
  {
    durationSec: 6,
    render: () => (
      <FilmOverlay
        effects={FILM_OVERLAY_PRESETS.documentary.effects}
        intensity={FILM_OVERLAY_PRESETS.documentary.intensity}
      >
        <KineticTypography data={still(catalogTypographyData.quoteHeraclitus)} />
      </FilmOverlay>
    ),
  },
  slateSegment("Effects", "FilmOverlay", "cinematic (+ light-leak)"),
  {
    durationSec: 6,
    render: () => (
      <FilmOverlay
        effects={FILM_OVERLAY_PRESETS.cinematic.effects}
        intensity={FILM_OVERLAY_PRESETS.cinematic.intensity}
      >
        <KineticTypography data={still(catalogTypographyData.quoteHeraclitus)} />
      </FilmOverlay>
    ),
  },
  slateSegment("Effects", "FilmOverlay", "dramatic (heavier grain + vignette)"),
  {
    durationSec: 6,
    render: () => (
      <FilmOverlay
        effects={FILM_OVERLAY_PRESETS.dramatic.effects}
        intensity={FILM_OVERLAY_PRESETS.dramatic.intensity}
      >
        <KineticTypography data={still(catalogTypographyData.quoteHeraclitus)} />
      </FilmOverlay>
    ),
  },
  slateSegment("Effects", "FilmOverlay", "archival (+ dust + scratch + flicker)"),
  {
    durationSec: 6,
    render: () => (
      <FilmOverlay
        effects={FILM_OVERLAY_PRESETS.archival.effects}
        intensity={FILM_OVERLAY_PRESETS.archival.intensity}
      >
        <KineticTypography data={still(catalogTypographyData.quoteHeraclitus)} />
      </FilmOverlay>
    ),
  },

  // Five backdrops under the same StatReveal — shows what each backdrop id
  // contributes editorially. Picked to span the registers: cartographic
  // (neutral default), reading-room (literary), strategy-grid (analytical),
  // night-operations (somber), foundry-ember (industrial drama).
  slateSegment("Backdrops", "cartographic", "neutral cartographic wash"),
  {
    durationSec: 6,
    render: () => (
      <AbsoluteFill>
        <SegmentBackdrop backdropId="cartographic" />
        <StatReveal data={still(catalogDataData.statApollo)} />
      </AbsoluteFill>
    ),
  },
  slateSegment("Backdrops", "reading-room", "literary / archival register"),
  {
    durationSec: 6,
    render: () => (
      <AbsoluteFill>
        <SegmentBackdrop backdropId="reading-room" />
        <StatReveal data={still(catalogDataData.statApollo)} />
      </AbsoluteFill>
    ),
  },
  slateSegment("Backdrops", "strategy-grid", "analytical register"),
  {
    durationSec: 6,
    render: () => (
      <AbsoluteFill>
        <SegmentBackdrop backdropId="strategy-grid" />
        <StatReveal data={still(catalogDataData.statApollo)} />
      </AbsoluteFill>
    ),
  },
  slateSegment("Backdrops", "night-operations", "somber / nighttime register"),
  {
    durationSec: 6,
    render: () => (
      <AbsoluteFill>
        <SegmentBackdrop backdropId="night-operations" />
        <StatReveal data={still(catalogDataData.statApollo)} />
      </AbsoluteFill>
    ),
  },
  slateSegment("Backdrops", "foundry-ember", "industrial / dramatic register"),
  {
    durationSec: 6,
    render: () => (
      <AbsoluteFill>
        <SegmentBackdrop backdropId="foundry-ember" />
        <StatReveal data={still(catalogDataData.statApollo)} />
      </AbsoluteFill>
    ),
  },

  // Outro
  {
    durationSec: OUTRO_SEC,
    render: () => <TitleTransition data={still(catalogTitlesData.titleEndCard)} />,
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
