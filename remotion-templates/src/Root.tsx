/**
 * Root — registers all compositions with Remotion Studio.
 *
 * Each template gets its own <Folder> for organization.
 * Add new templates here as you build them.
 *
 * ForegroundBackdropFoundation is declared inline under Editorial → Backdrop-foundation
 * so Remotion Studio can statically analyze defaultProps for 💾 Save to code.
 */

import React from "react";
import { Composition, Folder } from "remotion";
import "./design/fonts"; // Preload all Meridian brand fonts
import { BACKDROP_MANIFEST } from "./components/EditorialSurface";
import { layout, sec } from "./design/theme";
import { ChoroplethMapComposition } from "./templates/ChoroplethMap";
import { RouteAnimationComposition } from "./templates/RouteAnimation";
import { AtlasPlateComposition } from "./templates/AtlasPlate";
import { ProportionalSymbolMapComposition } from "./templates/ProportionalSymbolMap";
import { CartogramMapComposition } from "./templates/CartogramMap";
import { DensityMapComposition } from "./templates/DensityMap";
// DEPRECATED: TimelineComparison, DualTimeline — replaced by HorizontalTimeline.
// REMOVED (May 13, 2026): TimelineMorph — its single use case (Blockade,
// Reinvented) migrated to DuelingFrameworks as a structural comparison.
// Kept in codebase for FullEpisode backward compat, but removed from Studio sidebar.
import { DataChartComposition } from "./templates/DataChart";
import { KineticTypographyComposition } from "./templates/KineticTypography";
import { FrameworkDiagramComposition } from "./templates/FrameworkDiagram";
import { TitleTransitionComposition } from "./templates/TitleTransition";
import { DecisionTreeComposition } from "./templates/DecisionTree";
import { SplitCompositionComposition } from "./templates/SplitComposition";
import { ProbabilityGaugeComposition } from "./templates/ProbabilityGauge";
import { ImageCompositeComposition } from "./templates/ImageComposite";
import { PhotoMontageComposition } from "./templates/PhotoMontage";
import { NetworkDiagramComposition } from "./templates/NetworkDiagram";
import { ArcDiagramComposition } from "./templates/ArcDiagram";
import { BeeswarmChartComposition } from "./templates/BeeswarmChart";
import { TilegramUSMapComposition } from "./templates/TilegramUSMap";
import { CalendarHeatmapComposition } from "./templates/CalendarHeatmap";
import { ConnectedScatterplotComposition } from "./templates/ConnectedScatterplot";
import { StreamgraphComposition } from "./templates/Streamgraph";
import { RidgelinePlotComposition } from "./templates/RidgelinePlot";
import { MarimekkoChartComposition } from "./templates/MarimekkoChart";
import { TernaryPlotComposition } from "./templates/TernaryPlot";
import { HorizonChartComposition } from "./templates/HorizonChart";
import { DumbbellPlotComposition } from "./templates/DumbbellPlot";
import { TimeSeriesChartComposition } from "./templates/TimeSeriesChart";
import { SankeyFlowComposition } from "./templates/SankeyFlow";
import { GameBoardComposition } from "./templates/GameBoard";
import { BayesianUpdateComposition, BayesianUpdateMultiComposition } from "./templates/BayesianUpdate";
// BifurcationRoute template removed May 13, 2026 — phylogenetic-tree
// rendering didn't fit Parallax's editorial register; no episodes in the
// queue required it. Future institutional-bifurcation stories can use
// DuelingFrameworks or HorizontalTimeline dual mode (e.g., the COCOM
// successor regimes migrated to those forms).
import { DuelingFrameworksComposition } from "./templates/DuelingFrameworks";
import { StrategicLandscapeComposition } from "./templates/StrategicLandscape";
import { StatRevealComposition } from "./templates/StatReveal";
import { PricingWaterfallComposition } from "./templates/PricingWaterfall";
import { IsotypeChartComposition } from "./templates/IsotypeChart";
import { BumpChartComposition } from "./templates/BumpChart";
import { PopulationPyramidComposition } from "./templates/PopulationPyramid";
import { RadarChartComposition } from "./templates/RadarChart";
import { RankChangeDotPlotComposition } from "./templates/RankChangeDotPlot";
import { AnnotatedImageComposition } from "./templates/AnnotatedImage";
import { EscalationLadderComposition } from "./templates/EscalationLadder";
import { HorizontalTimelineComposition } from "./templates/HorizontalTimeline";
import {
  KineticShortComposition,
  DataChartShortComposition,
  SplitShortComposition,
  StatRevealShortComposition,
  FrameworkDiagramShortComposition,
  ChoroplethMapShortComposition,
  SplitCompositionShortComposition,
  ProbabilityGaugeShortComposition,
} from "./templates/Shorts";
import { SiliconTrapComposition, SiliconTrapFullComposition } from "./templates/Episodes";
import { FilmOverlayCascadeTestComposition } from "./templates/Episodes/FilmOverlayCascadeTestComp";
import { AudioPreviewComposition } from "./templates/AudioPreview";
import { PrisonersDilemmaShowcaseComposition } from "./templates/Episodes/PrisonersDilemmaShowcase";
import { PrisonersDilemmaFullComposition } from "./templates/Episodes/PrisonersDilemmaFull";
import { ThumbnailComposition } from "./templates/Thumbnail";
import {
  EditorialFrameHeroTestComposition,
  EditorialFrameHeroDarkTestComposition,
  EditorialFrameHeroFlippedTestComposition,
  EditorialFrameAsideTestComposition,
  EditorialFrameMinimalTestComposition,
  ForegroundBackdropShortcutCompositions,
} from "./templates/EditorialTest";
import {
  ForegroundBackdropFoundation,
  ForegroundBackdropFoundationSchema,
} from "./templates/EditorialTest/ForegroundBackdropFoundation";

// Catalog — toolkit view (multi-variant demos, never tied to a real episode)
import {
  CatalogAtlasG7,
  CatalogAtlasBlocs,
  CatalogAtlasTordesillas,
  CatalogRouteSilkRoad,
  CatalogRouteRomeRadial,
  CatalogRouteMagellan,
  CatalogRouteChokepoints,
  CatalogAtlasCocom,
  CatalogAtlasColdWarVintage,
  CatalogProportionalFabs,
  CatalogCartogramEU,
  CatalogDensityFabs,
  CatalogTilegramElectoral,
  CatalogStatApollo,
  CatalogStatMariana,
  CatalogStatHabitable,
  CatalogChartMountains,
  CatalogChartSpaceRace,
  CatalogChartAxelrodLollipop,
  CatalogChartOlympicsSmallMultiples,
  CatalogTsCO2,
  CatalogTsPopulation,
  CatalogTsLifeExpectancySlope,
  CatalogTsPopulationSmallMultiples,
  CatalogGaugeWeather,
  CatalogGaugeScorecard,
  CatalogBayesVenice,
  CatalogRadarAthletes,
  CatalogSankeyEnergy,
  CatalogWaterfallCoffee,
  CatalogIsotypeChips,
  CatalogBumpGDP,
  CatalogPyramidChina,
  CatalogRankChangeSemiconductors,
  CatalogWaterfallMotionStill,
  CatalogWaterfallMotionBriefing,
  CatalogWaterfallMotionDocumentary,
  CatalogQuoteHeraclitus,
  CatalogDefinitionAnagnorisis,
  CatalogBilingualTianxia,
  CatalogStatisticLighthouse,
  CatalogTitleEpisode,
  CatalogTitleSection,
  CatalogTitleEndCard,
  CatalogTitleEditorial,
  CatalogFwComparison,
  CatalogFwFlow,
  CatalogFwMatrix,
  CatalogNwHubSpoke,
  CatalogNwBipartite,
  CatalogSplitMaps,
  CatalogSplitTime,
  CatalogArcDiagram,
  CatalogStrategicLandscape,
  CatalogTernaryUKVoter,
  CatalogBeeswarmMilitary,
  CatalogCalendarIsraelIran,
  CatalogCalendarFedRates,
  CatalogScatterPhillips,
  CatalogStreamgraphOil,
  CatalogStreamgraphFlags,
  CatalogRidgelineLifeExpectancy,
  CatalogMarimekkoEnergy,
  CatalogMarimekkoEnergyEmphasis,
  CatalogTernaryUN,
  CatalogHorizonBRICS,
  CatalogHorizonBRICSShared,
  CatalogDumbbellIncome,
  CatalogTimelineComputers,
  CatalogTimelineDualPandemics,
  CatalogTimelineDualRevolutionsPhase,
  CatalogLadderColdWar,
  CatalogLadderArms,
  CatalogTreeChess,
  CatalogTreeExCommLadder,
  CatalogGameChess,
  CatalogGamePayoff,
  CatalogGamePDCanonical,
  CatalogGameIteratedPD,
  // CatalogBifurcationCocom removed May 13, 2026 with BifurcationRoute template.
  CatalogEditorialHero,
  CatalogEditorialAside,
  CatalogEditorialMinimal,
  CatalogShowreel,
  CatalogShowreelBackdrops,
  CatalogEmphasisShowcase,
  CatalogTemplatePreview,
  CatalogDuelingEmpireFall,
  CatalogDuelingBlockadesSubstrate,
  CatalogTimelineComparisonRevolutions,
  CatalogDualImperialTransitions,
  CatalogImageArchive,
  CatalogMontageTreatments,
  CatalogAnnotatedDemo,
} from "./catalog";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Folder name="Episodes">
        <SiliconTrapComposition />
        <SiliconTrapFullComposition />
        <PrisonersDilemmaShowcaseComposition />
        <PrisonersDilemmaFullComposition />
        <AudioPreviewComposition />
        {/* Test fixture — NOT for production rendering; used by filmOverlay-cascade-integration.test.ts */}
        <FilmOverlayCascadeTestComposition />
      </Folder>

      <Folder name="Maps">
        <ChoroplethMapComposition />
        <RouteAnimationComposition />
        <AtlasPlateComposition />
        <ProportionalSymbolMapComposition />
        <CartogramMapComposition />
        <DensityMapComposition />
        <TilegramUSMapComposition />
      </Folder>

      <Folder name="Timelines">
        <HorizontalTimelineComposition />
        <EscalationLadderComposition />
      </Folder>

      <Folder name="Data">
        <DataChartComposition />
        <TimeSeriesChartComposition />
        <SankeyFlowComposition />
        <ProbabilityGaugeComposition />
        <BayesianUpdateComposition />
        <BayesianUpdateMultiComposition />
        <StatRevealComposition />
        <RadarChartComposition />
        <PricingWaterfallComposition />
        <IsotypeChartComposition />
        <BumpChartComposition />
        <PopulationPyramidComposition />
        <RankChangeDotPlotComposition />
        <BeeswarmChartComposition />
        <CalendarHeatmapComposition />
        <ConnectedScatterplotComposition />
        <StreamgraphComposition />
        <RidgelinePlotComposition />
        <MarimekkoChartComposition />
        <TernaryPlotComposition />
        <HorizonChartComposition />
        <DumbbellPlotComposition />
      </Folder>

      <Folder name="Typography">
        <KineticTypographyComposition />
      </Folder>

      <Folder name="Diagrams">
        <FrameworkDiagramComposition />
        <DuelingFrameworksComposition />
        <NetworkDiagramComposition />
        <ArcDiagramComposition />
        <SplitCompositionComposition />
        <StrategicLandscapeComposition />
      </Folder>

      <Folder name="Scenarios">
        <DecisionTreeComposition />
        <GameBoardComposition />
        {/* BifurcationRouteComposition removed May 13, 2026 — see import comment. */}
      </Folder>

      <Folder name="Transitions">
        <TitleTransitionComposition />
      </Folder>

      <Folder name="Cinematic">
        <ImageCompositeComposition />
        <PhotoMontageComposition />
        <AnnotatedImageComposition />
      </Folder>

      <Folder name="Thumbnails">
        <ThumbnailComposition />
      </Folder>

      <Folder name="Editorial">
        <Folder name="Backdrop-foundation">
          <Composition
            id="ForegroundBackdropFoundation"
            component={ForegroundBackdropFoundation}
            schema={ForegroundBackdropFoundationSchema}
            width={layout.width}
            height={layout.height}
            fps={layout.fps}
            durationInFrames={sec(12)}
            defaultProps={{"backdropId":"horizon" as const}}
          />
          <ForegroundBackdropShortcutCompositions />
        </Folder>
        <EditorialFrameHeroTestComposition />
        <EditorialFrameHeroDarkTestComposition />
        <EditorialFrameHeroFlippedTestComposition />
        <EditorialFrameAsideTestComposition />
        <EditorialFrameMinimalTestComposition />
      </Folder>

      <Folder name="Shorts">
        <KineticShortComposition />
        <DataChartShortComposition />
        <SplitShortComposition />
        <StatRevealShortComposition />
        <FrameworkDiagramShortComposition />
        <ChoroplethMapShortComposition />
        <SplitCompositionShortComposition />
        <ProbabilityGaugeShortComposition />
      </Folder>

      {/*
        Catalog — toolkit view, evergreen demo data.
        See src/catalog/README.md for conventions.
      */}
      <Folder name="Catalog">
        <CatalogShowreel />
        <CatalogShowreelBackdrops />
        <CatalogEmphasisShowcase />
        <CatalogTemplatePreview />

        <Folder name="Maps">
          <CatalogAtlasG7 />
          <CatalogAtlasBlocs />
          <CatalogAtlasTordesillas />
          <CatalogRouteSilkRoad />
          <CatalogRouteRomeRadial />
          <CatalogRouteMagellan />
          <CatalogRouteChokepoints />
          <CatalogAtlasCocom />
          <CatalogAtlasColdWarVintage />
          <CatalogProportionalFabs />
          <CatalogCartogramEU />
          <CatalogDensityFabs />
          <CatalogTilegramElectoral />
        </Folder>

        <Folder name="Data">
          <CatalogStatApollo />
          <CatalogStatMariana />
          <CatalogStatHabitable />
          <CatalogChartMountains />
          <CatalogChartSpaceRace />
          <CatalogChartAxelrodLollipop />
          <CatalogChartOlympicsSmallMultiples />
          <CatalogTsCO2 />
          <CatalogTsPopulation />
          <CatalogTsLifeExpectancySlope />
          <CatalogTsPopulationSmallMultiples />
          <CatalogGaugeWeather />
          <CatalogGaugeScorecard />
          <CatalogBayesVenice />
          <CatalogRadarAthletes />
          <CatalogSankeyEnergy />
          <CatalogWaterfallCoffee />
          <CatalogIsotypeChips />
          <CatalogBumpGDP />
          <CatalogPyramidChina />
          <CatalogRankChangeSemiconductors />
          <CatalogBeeswarmMilitary />
          <CatalogCalendarIsraelIran />
          <CatalogCalendarFedRates />
          <CatalogScatterPhillips />
          <CatalogStreamgraphOil />
          <CatalogStreamgraphFlags />
          <CatalogRidgelineLifeExpectancy />
          <CatalogMarimekkoEnergy />
          <CatalogMarimekkoEnergyEmphasis />
          <CatalogTernaryUN />
          <CatalogHorizonBRICS />
          <CatalogHorizonBRICSShared />
          <CatalogDumbbellIncome />
        </Folder>

        <Folder name="Motion-Identity">
          <CatalogWaterfallMotionStill />
          <CatalogWaterfallMotionBriefing />
          <CatalogWaterfallMotionDocumentary />
        </Folder>

        <Folder name="Typography">
          <CatalogQuoteHeraclitus />
          <CatalogDefinitionAnagnorisis />
          <CatalogBilingualTianxia />
          <CatalogStatisticLighthouse />
        </Folder>

        <Folder name="Titles">
          <CatalogTitleEpisode />
          <CatalogTitleSection />
          <CatalogTitleEndCard />
          <CatalogTitleEditorial />
        </Folder>

        <Folder name="Diagrams">
          <CatalogFwComparison />
          <CatalogFwFlow />
          <CatalogFwMatrix />
          <CatalogNwHubSpoke />
          <CatalogNwBipartite />
          <CatalogSplitMaps />
          <CatalogSplitTime />
          <CatalogDuelingEmpireFall />
          <CatalogDuelingBlockadesSubstrate />
          <CatalogArcDiagram />
          <CatalogStrategicLandscape />
          <CatalogTernaryUKVoter />
        </Folder>

        <Folder name="Timelines">
          <CatalogTimelineComputers />
          <CatalogTimelineDualPandemics />
          <CatalogTimelineDualRevolutionsPhase />
          <CatalogLadderColdWar />
          <CatalogLadderArms />
          <CatalogTimelineComparisonRevolutions />
          <CatalogDualImperialTransitions />
        </Folder>

        <Folder name="Cinematic">
          <CatalogImageArchive />
          <CatalogMontageTreatments />
          <CatalogAnnotatedDemo />
        </Folder>

        <Folder name="Scenarios">
          <CatalogTreeChess />
          <CatalogTreeExCommLadder />
          <CatalogGameChess />
          <CatalogGamePayoff />
          <CatalogGamePDCanonical />
          <CatalogGameIteratedPD />
        </Folder>

        <Folder name="Editorial">
          <CatalogEditorialHero />
          <CatalogEditorialAside />
          <CatalogEditorialMinimal />
        </Folder>
      </Folder>
    </>
  );
};
