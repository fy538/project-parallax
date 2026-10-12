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
import { BrandTransitions, PROTO_BRAND_TRANSITIONS_DURATION } from "./templates/_proto/BrandTransitions";
import { GeometricMotion, GEOMETRIC_MOTION_DURATION } from "./templates/_proto/GeometricMotion";
import { AIStillComposite, AI_STILL_COMPOSITE_DURATION } from "./templates/_proto/AIStillComposite";
import { NoiseField, NOISE_FIELD_DURATION } from "./templates/_proto/NoiseField";
import { PromiseAndCopy } from "./pilots/PromiseAndCopy/PromiseAndCopy";
import { promiseAndCopySchema } from "./pilots/PromiseAndCopy/schema";
import { promiseAndCopyMetadata } from "./pilots/PromiseAndCopy/timeline";
import { WhatWeCount } from "./pilots/WhatWeCount/WhatWeCount";
import { PhilosophyMarkLab, PhilosophyStyleLab } from "./experiments/PhilosophyStyleLab";
import { CONTINUITY_RECORD_DURATION, ContinuityRecord } from "./experiments/ContinuityRecord";
import { FIELD_ATLAS_STUDY_DURATION, FieldAtlasStudy } from "./experiments/FieldAtlasStudy";
import { CLEAN_ILLUSTRATION_STUDY_DURATION, CleanIllustrationStudy } from "./experiments/CleanIllustrationStudy";
import { TYPOGRAPHY_DIRECTION_STUDY_DURATION, TypographyDirectionStudy, TypographyIllustrationStudy, TypographyUnderstandingStudy } from "./experiments/TypographyDirectionStudy";
import { IllustrationLanguageBoard, IllustrationOrganicStudy, IllustrationRelationalStudy, IllustrationSystemicStudy } from "./experiments/IllustrationLanguageStudy";
import { ConstructivistForestStudy } from "./experiments/ConstructivistForestStudy";
import { FOREST_ARGUMENT_DURATION, ForestArgumentCode, ForestArgumentCutout, ForestArgumentHybrid } from "./experiments/ForestArgumentStudy";
import { ConstructivistHumanStudy, ConstructivistRangeBoard } from "./experiments/ConstructivistHumanStudy";
import { STILLS_REEL_DURATION, StillsReel } from "./experiments/StillsReel";
import { STILLS_REEL_2_DURATION, StillsReel2 } from "./experiments/StillsReel2";
import { STILLS_REEL_3_DURATION, StillsReel3 } from "./experiments/StillsReel3";
import { STILLS_REEL_4_DURATION, StillsReel4 } from "./experiments/StillsReel4";
import { STILLS_REEL_5_DURATION, StillsReel5 } from "./experiments/StillsReel5";
import { STILLS_REEL_POLISH_DURATION, STILLS_REEL_RETAKES_DURATION, StillsReelPolish, StillsReelRetakes } from "./experiments/StillsReelPolish";
import { whatWeCountSchema } from "./pilots/WhatWeCount/schema";
import { whatWeCountMetadata } from "./pilots/WhatWeCount/timeline";
import { NarrationSync, NARRATION_SYNC_DURATION } from "./templates/_proto/NarrationSync";
import {
  ParametricBilingual,
  ParametricSchema,
  parametricMetadata,
  PARAMETRIC_EN_DEFAULTS,
  PARAMETRIC_ZH_DEFAULTS,
} from "./templates/_proto/ParametricBilingual";
import { ProtoReel, PROTO_REEL_DURATION } from "./templates/_proto/ProtoReel";
import { RouteAnimationComposition } from "./templates/RouteAnimation";
import { CinematicMapComposition } from "./templates/CinematicMap";
import { TerritoryMapComposition } from "./templates/TerritoryMap";
import { FlowMapComposition } from "./templates/FlowMap";
import { CausalLoopDiagramComposition } from "./templates/CausalLoopDiagram";
import { SpiralTimelineComposition } from "./templates/SpiralTimeline";
import { PrimarySourceRevealComposition } from "./templates/PrimarySourceReveal";
import { SmallMultiplesComposition } from "./templates/SmallMultiples";
import { HandwrittenLetterComposition } from "./templates/HandwrittenLetter";
import { NewspaperHeadlineRotatorComposition } from "./templates/NewspaperHeadlineRotator";
import { ArchivalReelComposition } from "./templates/ArchivalReel";
import { TelegramCableComposition } from "./templates/TelegramCable";
import { ComparisonPairComposition } from "./templates/ComparisonPair";
import { SplitFrameComposition } from "./templates/SplitFrame";
import { VennDiagramComposition } from "./templates/VennDiagram";
import { ChordDiagramComposition } from "./templates/ChordDiagram";
import { TreemapComposition } from "./templates/Treemap";
import { MatrixHeatmapComposition } from "./templates/MatrixHeatmap";
import { SyllogismComposition } from "./templates/Syllogism";
import { AxiomListComposition } from "./templates/AxiomList";
import { DialecticFlowComposition } from "./templates/DialecticFlow";
import { ConditionalArgumentComposition } from "./templates/ConditionalArgument";
import { CounterfactualPathComposition } from "./templates/CounterfactualPath";
import { AnalogyCrossmapComposition } from "./templates/AnalogyCrossmap";
import { ToulminMapComposition } from "./templates/ToulminMap";
import { PhilosophicalFamilyTreeComposition } from "./templates/PhilosophicalFamilyTree";
import { ConceptEvolutionTimelineComposition } from "./templates/ConceptEvolutionTimeline";
import { MorphTransitionComposition } from "./templates/MorphTransition";
import { AtlasPlateComposition } from "./templates/AtlasPlate";
import { RecreationComposition } from "./templates/Recreation";
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
import { OutcomePartitionComposition } from "./templates/OutcomePartition";
import { DecisionTreeHorizontalComposition } from "./catalog/Scenarios";
import { SplitCompositionComposition } from "./templates/SplitComposition";
import { ProbabilityGaugeComposition } from "./templates/ProbabilityGauge";
import { ImageCompositeComposition } from "./templates/ImageComposite";
import { PhotoMontageComposition } from "./templates/PhotoMontage";
import { NetworkDiagramComposition } from "./templates/NetworkDiagram";
import { ArcDiagramComposition } from "./templates/ArcDiagram";
import { SlopegraphComposition } from "./templates/Slopegraph";
import { KPICardComposition } from "./templates/KPICard";
import { BulletChartComposition } from "./templates/BulletChart";
import { StepLineComposition } from "./templates/StepLine";
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
import { DivergingBarComposition } from "./templates/DivergingBar";
import { DotPlotComposition } from "./templates/DotPlot";
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
import { MathRevealComposition } from "./templates/MathReveal";
import { MathDerivationComposition } from "./templates/MathDerivation";
import {
  CatalogMathAnnotatedBayes,
  CatalogMathNewtonBounded,
  CatalogMathInlineDemo,
} from "./catalog/MathPrimitives";
import { CatalogMathRenderShowcase } from "./catalog/MathRenderShowcase";
import { PricingWaterfallComposition } from "./templates/PricingWaterfall";
import { IsotypeChartComposition } from "./templates/IsotypeChart";
import { BumpChartComposition } from "./templates/BumpChart";
import { PopulationPyramidComposition } from "./templates/PopulationPyramid";
import { RadarChartComposition } from "./templates/RadarChart";
import { RankChangeDotPlotComposition } from "./templates/RankChangeDotPlot";
import { OrgChartComposition } from "./templates/OrgChart";
import { AnnotatedImageComposition } from "./templates/AnnotatedImage";
import { ScrollyRevealComposition } from "./templates/ScrollyReveal";
import { AnnotatedZoomComposition } from "./templates/AnnotatedZoom";
import { GenerativeBackdropComposition } from "./templates/GenerativeBackdrop";
import { BubbleMatrixComposition } from "./templates/BubbleMatrix";
import { BarChartRaceComposition } from "./templates/BarChartRace";
import { SanctionsNetworkComposition } from "./templates/SanctionsNetwork";
import { EscalationLadderComposition } from "./templates/EscalationLadder";
import { HorizontalTimelineComposition, HorizontalTimelineSingleComposition } from "./templates/HorizontalTimeline";
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
import { AiCareMotivesFullComposition } from "./templates/Episodes/AiCareMotivesFull";
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
  CatalogRouteSilkRoadToner,
  CatalogRouteRomeRadial,
  CatalogRouteMagellan,
  CatalogRouteChokepoints,
  CatalogAtlasCocom,
  CatalogAtlasColdWarVintage,
  CatalogAtlasReliefHimalaya,
  CatalogProportionalFabs,
  CatalogCartogramEU,
  CatalogDensityFabs,
  CatalogTilegramElectoral,
  CatalogCinematicKhyberPass,
  CatalogCinematicTaiwanStrait,
  CatalogCinematicGlobeRevealMiddleEast,
  CatalogTerritoryOttomanRetreat,
  CatalogTerritoryCocomMembership,
  CatalogFlowMapRussiaOilRerouting,
  CatalogFlowMapSemiconductorSupply,
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
  CatalogTreePolicyIndented,
  CatalogTreeTaiwanSpine,
  CatalogTreeBerlinSchematic,
  CatalogGameChess,
  CatalogGamePayoff,
  CatalogGamePDCanonical,
  CatalogGameIteratedPD,
  // CatalogBifurcationCocom removed May 13, 2026 with BifurcationRoute template.
  CatalogEditorialHero,
  CatalogEditorialAside,
  CatalogEditorialMinimal,
  // Exploratory: three structural directions for moving the editorial
  // catalog out of PowerPoint register. Iteration data on top, diffusion
  // (4 vs 890 skew) variants below.
  CatalogEditorialDirectionA,
  CatalogEditorialDirectionB,
  CatalogEditorialDirectionC,
  CatalogEditorialDirectionADiffusion,
  CatalogEditorialDirectionBDiffusion,
  CatalogEditorialDirectionCDiffusion,
  // Eight text-animation techniques in one side-by-side composition.
  CatalogTextAnimationShowcase,
  // Five composite editorial patterns (DefinitionReveal + callback,
  // StatCaption, QuoteAttribution × 2 registers).
  CatalogCompositePatternsShowcase,
  // 3×2 mosaic of the six drift presets on identical content — visual
  // reference for HOLD_MOTION_REGISTER / POLISH D20.
  CatalogDriftRegisterShowcase,
  // 3×2 mosaic of the six canonical transitions on identical content — visual
  // reference for TRANSITION_GRAMMAR / POLISH D21.
  CatalogTransitionGrammarShowcase,
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
      <Folder name="Current">
        <Composition
          id="what-we-count"
          component={WhatWeCount}
          schema={whatWeCountSchema}
          calculateMetadata={whatWeCountMetadata}
          fps={layout.fps}
          width={layout.width}
          height={layout.height}
          durationInFrames={sec(80)}
          defaultProps={{"title":"When the score becomes the goal","labels":{"machine":"The machine","goal":"Restore this forest.","reward":"1 point / planting","forest":"The same grove"},"positions":{"machineX":290,"forestX":1430},"pauses":{"goal":1.2,"rule":1.3,"plant":1.3,"loophole":1.6,"repeat":1.1,"diagnosis":1.8,"repair":1.8,"mirror":1.8},"endingHoldSec":3,"narrationVolume":1}}
        />
        {/* Inline literals are required for the installed Studio's Save to code. */}
        <Composition
          id="promise-and-copy"
          component={PromiseAndCopy}
          schema={promiseAndCopySchema}
          calculateMetadata={promiseAndCopyMetadata}
          fps={layout.fps}
          width={layout.width}
          height={layout.height}
          durationInFrames={sec(75)}
          defaultProps={{"title":"Who inherits a promise?","labels":{"promise":"I will protect this forest.","original":"The first mind","successorA":"Successor A","successorB":"Successor B","forest":"The forest"},"imageSrc":"","positions":{"original":{"x":290,"y":600},"successorA":{"x":810,"y":440},"successorB":{"x":810,"y":740},"forest":{"x":1480,"y":600,"size":460}},"pauses":{"promise":1.2,"copy":1.8,"question":1.8,"possibility":1.5,"human":1.8,"closing":1.8},"endingHoldSec":3,"narrationVolume":1}}
        />
      </Folder>

      <Folder name="Legacy-Episodes">
        <SiliconTrapComposition />
        <SiliconTrapFullComposition />
        <PrisonersDilemmaShowcaseComposition />
        <PrisonersDilemmaFullComposition />
        <AiCareMotivesFullComposition />
      </Folder>

      <Folder name="Templates">
        <Folder name="Maps">
          <ChoroplethMapComposition />
          <RouteAnimationComposition />
          <CinematicMapComposition />
          <TerritoryMapComposition />
          <FlowMapComposition />
          <AtlasPlateComposition />
          <ProportionalSymbolMapComposition />
          <CartogramMapComposition />
          <DensityMapComposition />
          <TilegramUSMapComposition />
        </Folder>

        <Folder name="Timelines">
          <HorizontalTimelineComposition />
          <HorizontalTimelineSingleComposition />
          <EscalationLadderComposition />
          <SpiralTimelineComposition />
          <ConceptEvolutionTimelineComposition />
        </Folder>

        <Folder name="Data">
          <DataChartComposition />
          <TimeSeriesChartComposition />
          <SmallMultiplesComposition />
          <SankeyFlowComposition />
          <ProbabilityGaugeComposition />
          <BayesianUpdateComposition />
          <BayesianUpdateMultiComposition />
          <StatRevealComposition />
          <RadarChartComposition />
          <PricingWaterfallComposition />
          <IsotypeChartComposition />
          <BumpChartComposition />
          <BarChartRaceComposition />
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
          <BubbleMatrixComposition />
          <DivergingBarComposition />
          <DotPlotComposition />
          <SlopegraphComposition />
          <KPICardComposition />
          <BulletChartComposition />
          <StepLineComposition />
          <TreemapComposition />
          <MatrixHeatmapComposition />
        </Folder>

        <Folder name="Typography">
          <KineticTypographyComposition />
          <PrimarySourceRevealComposition />
        </Folder>

        <Folder name="Math">
          <MathRevealComposition />
          <MathDerivationComposition />
        </Folder>

        <Folder name="Diagrams">
          <FrameworkDiagramComposition />
          <DuelingFrameworksComposition />
          <NetworkDiagramComposition />
          <SanctionsNetworkComposition />
          <CausalLoopDiagramComposition />
          <ArcDiagramComposition />
          <PhilosophicalFamilyTreeComposition />
          <SplitCompositionComposition />
          <SplitFrameComposition />
          <ComparisonPairComposition />
          <VennDiagramComposition />
          <ChordDiagramComposition />
          <StrategicLandscapeComposition />
        </Folder>

        <Folder name="Scenarios">
          <OrgChartComposition />
          <DecisionTreeComposition />
          <DecisionTreeHorizontalComposition />
          <OutcomePartitionComposition />
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
          <ScrollyRevealComposition />
          <AnnotatedZoomComposition />
          <GenerativeBackdropComposition />
        </Folder>

        <Folder name="Motion">
          <MorphTransitionComposition />
        </Folder>

        <Folder name="Argument-Primitives">
          <SyllogismComposition />
          <AxiomListComposition />
          <DialecticFlowComposition />
          <ConditionalArgumentComposition />
          <CounterfactualPathComposition />
          <AnalogyCrossmapComposition />
          <ToulminMapComposition />
        </Folder>

        <Folder name="Documentary-Archival">
          <HandwrittenLetterComposition />
          <NewspaperHeadlineRotatorComposition />
          <ArchivalReelComposition />
          <TelegramCableComposition />
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
        <CatalogDriftRegisterShowcase />
        <CatalogTransitionGrammarShowcase />

        <Folder name="Maps">
          <CatalogAtlasG7 />
          <CatalogAtlasBlocs />
          <CatalogAtlasTordesillas />
          <CatalogRouteSilkRoad />
          <CatalogRouteSilkRoadToner />
          <CatalogRouteRomeRadial />
          <CatalogRouteMagellan />
          <CatalogRouteChokepoints />
          <CatalogAtlasCocom />
          <CatalogAtlasColdWarVintage />
          <CatalogAtlasReliefHimalaya />
          <CatalogProportionalFabs />
          <CatalogCartogramEU />
          <CatalogDensityFabs />
          <CatalogTilegramElectoral />
          <CatalogCinematicKhyberPass />
          <CatalogCinematicTaiwanStrait />
          <CatalogCinematicGlobeRevealMiddleEast />
          <CatalogTerritoryOttomanRetreat />
          <CatalogTerritoryCocomMembership />
          <CatalogFlowMapRussiaOilRerouting />
          <CatalogFlowMapSemiconductorSupply />
        </Folder>

        <Folder name="Math">
          <CatalogMathAnnotatedBayes />
          <CatalogMathNewtonBounded />
          <CatalogMathInlineDemo />
          <CatalogMathRenderShowcase />
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
          <CatalogTreePolicyIndented />
          <CatalogTreeTaiwanSpine />
          <CatalogTreeBerlinSchematic />
          <CatalogGameChess />
          <CatalogGamePayoff />
          <CatalogGamePDCanonical />
          <CatalogGameIteratedPD />
        </Folder>

        <Folder name="Editorial">
          <CatalogEditorialHero />
          <CatalogEditorialAside />
          <CatalogEditorialMinimal />
          {/* Iteration data (clean 0-100% scale) */}
          <CatalogEditorialDirectionA />
          <CatalogEditorialDirectionB />
          <CatalogEditorialDirectionC />
          {/* Diffusion data (4 vs 890 skew — the harder stress test) */}
          <CatalogEditorialDirectionADiffusion />
          <CatalogEditorialDirectionBDiffusion />
          <CatalogEditorialDirectionCDiffusion />
          {/* Text-animation reference: eight techniques in one composition */}
          <CatalogTextAnimationShowcase />
          {/* Composite editorial patterns: high-level choreography */}
          <CatalogCompositePatternsShowcase />
        </Folder>
      </Folder>
      <Folder name="Experiments">
        <Composition
          id="stills-reel-ai-care"
          component={StillsReel}
          durationInFrames={STILLS_REEL_DURATION}
          fps={layout.fps}
          width={layout.width}
          height={layout.height}
        />
        <Composition
          id="stills-reel-2-ai-care"
          component={StillsReel2}
          durationInFrames={STILLS_REEL_2_DURATION}
          fps={layout.fps}
          width={layout.width}
          height={layout.height}
        />
        <Composition
          id="stills-reel-3-ai-care"
          component={StillsReel3}
          durationInFrames={STILLS_REEL_3_DURATION}
          fps={layout.fps}
          width={layout.width}
          height={layout.height}
        />
        <Composition
          id="stills-reel-4-ai-care"
          component={StillsReel4}
          durationInFrames={STILLS_REEL_4_DURATION}
          fps={layout.fps}
          width={layout.width}
          height={layout.height}
        />
        <Composition
          id="stills-reel-5-ai-care"
          component={StillsReel5}
          durationInFrames={STILLS_REEL_5_DURATION}
          fps={layout.fps}
          width={layout.width}
          height={layout.height}
        />
        <Composition
          id="stills-reel-polish-ai-care"
          component={StillsReelPolish}
          durationInFrames={STILLS_REEL_POLISH_DURATION}
          fps={layout.fps}
          width={layout.width}
          height={layout.height}
        />
        <Composition
          id="stills-reel-retakes-ai-care"
          component={StillsReelRetakes}
          durationInFrames={STILLS_REEL_RETAKES_DURATION}
          fps={layout.fps}
          width={layout.width}
          height={layout.height}
        />
        <Composition
          id="forest-argument-cutout"
          component={ForestArgumentCutout}
          durationInFrames={FOREST_ARGUMENT_DURATION}
          fps={layout.fps}
          width={layout.width}
          height={layout.height}
        />
        <Composition
          id="forest-argument-hybrid"
          component={ForestArgumentHybrid}
          durationInFrames={FOREST_ARGUMENT_DURATION}
          fps={layout.fps}
          width={layout.width}
          height={layout.height}
        />
        <Composition
          id="forest-argument-code"
          component={ForestArgumentCode}
          durationInFrames={FOREST_ARGUMENT_DURATION}
          fps={layout.fps}
          width={layout.width}
          height={layout.height}
        />
        <Composition
          id="constructivist-range-board"
          component={ConstructivistRangeBoard}
          durationInFrames={1}
          fps={layout.fps}
          width={1920}
          height={660}
        />
        <Composition
          id="constructivist-human-study"
          component={ConstructivistHumanStudy}
          durationInFrames={1}
          fps={layout.fps}
          width={layout.width}
          height={layout.height}
        />
        <Composition
          id="constructivist-forest-study"
          component={ConstructivistForestStudy}
          durationInFrames={1}
          fps={layout.fps}
          width={layout.width}
          height={layout.height}
        />
        <Composition
          id="illustration-language-board"
          component={IllustrationLanguageBoard}
          durationInFrames={1}
          fps={layout.fps}
          width={1920}
          height={560}
        />
        <Composition
          id="illustration-organic-study"
          component={IllustrationOrganicStudy}
          durationInFrames={1}
          fps={layout.fps}
          width={layout.width}
          height={layout.height}
        />
        <Composition
          id="illustration-relational-study"
          component={IllustrationRelationalStudy}
          durationInFrames={1}
          fps={layout.fps}
          width={layout.width}
          height={layout.height}
        />
        <Composition
          id="illustration-systemic-study"
          component={IllustrationSystemicStudy}
          durationInFrames={1}
          fps={layout.fps}
          width={layout.width}
          height={layout.height}
        />
        <Composition
          id="typography-understanding-study"
          component={TypographyUnderstandingStudy}
          durationInFrames={120}
          fps={layout.fps}
          width={layout.width}
          height={layout.height}
        />
        <Composition
          id="typography-illustration-study"
          component={TypographyIllustrationStudy}
          durationInFrames={120}
          fps={layout.fps}
          width={layout.width}
          height={layout.height}
        />
        <Composition
          id="typography-direction-study"
          component={TypographyDirectionStudy}
          durationInFrames={TYPOGRAPHY_DIRECTION_STUDY_DURATION}
          fps={layout.fps}
          width={layout.width}
          height={layout.height}
        />
        <Composition
          id="clean-illustration-study"
          component={CleanIllustrationStudy}
          durationInFrames={CLEAN_ILLUSTRATION_STUDY_DURATION}
          fps={layout.fps}
          width={layout.width}
          height={layout.height}
        />
        <Composition
          id="field-atlas-study"
          component={FieldAtlasStudy}
          durationInFrames={FIELD_ATLAS_STUDY_DURATION}
          fps={layout.fps}
          width={layout.width}
          height={layout.height}
        />
        <Composition
          id="continuity-record-study"
          component={ContinuityRecord}
          durationInFrames={CONTINUITY_RECORD_DURATION}
          fps={layout.fps}
          width={layout.width}
          height={layout.height}
        />
        <Composition
          id="philosophy-mark-lab"
          component={PhilosophyMarkLab}
          durationInFrames={1}
          fps={layout.fps}
          width={layout.width}
          height={layout.height}
        />
        <Composition
          id="philosophy-style-lab"
          component={PhilosophyStyleLab}
          durationInFrames={1}
          fps={layout.fps}
          width={layout.width}
          height={layout.height}
        />
        {/* Capability R&D reel — every prototype back-to-back with slates (REMOTION_CAPABILITY_MAP.md showcase index) */}
        <Composition
          id="proto-reel"
          component={ProtoReel}
          durationInFrames={PROTO_REEL_DURATION}
          fps={30}
          width={1920}
          height={1080}
        />
        {/* P1 motion-layer prototype — native branded transitions (REMOTION_MOTION_LAYER_ROADMAP.md) */}
        <Composition
          id="proto-brand-transitions"
          component={BrandTransitions}
          durationInFrames={PROTO_BRAND_TRANSITIONS_DURATION}
          fps={30}
          width={1920}
          height={1080}
        />
        <Composition
          id="proto-ai-still-composite"
          component={AIStillComposite}
          durationInFrames={AI_STILL_COMPOSITE_DURATION}
          fps={30}
          width={1920}
          height={1080}
        />
        <Composition
          id="proto-noise-field"
          component={NoiseField}
          durationInFrames={NOISE_FIELD_DURATION}
          fps={30}
          width={1920}
          height={1080}
        />
        {/* Geometric vector layer — draw-on (evolvePath) + path morph (interpolatePath) */}
        <Composition
          id="proto-geometric-motion"
          component={GeometricMotion}
          durationInFrames={GEOMETRIC_MOTION_DURATION}
          fps={30}
          width={1920}
          height={1080}
        />
        {/* Narration sync — word-timed reveal (captions/whisper) + audio-reactive spectrum (media-utils) */}
        <Composition
          id="proto-narration-sync"
          component={NarrationSync}
          durationInFrames={NARRATION_SYNC_DURATION}
          fps={30}
          width={1920}
          height={1080}
        />
        {/* Parametric bilingual — one component → EN/ZH variants; duration auto-derived from narration WAV */}
        <Composition
          id="proto-parametric-en"
          component={ParametricBilingual}
          schema={ParametricSchema}
          calculateMetadata={parametricMetadata}
          defaultProps={PARAMETRIC_EN_DEFAULTS}
        />
        <Composition
          id="proto-parametric-zh"
          component={ParametricBilingual}
          schema={ParametricSchema}
          calculateMetadata={parametricMetadata}
          defaultProps={PARAMETRIC_ZH_DEFAULTS}
        />
        <RecreationComposition />
      </Folder>

      <Folder name="Tests">
        <AudioPreviewComposition />
        <FilmOverlayCascadeTestComposition />
        <EditorialFrameHeroTestComposition />
        <EditorialFrameHeroDarkTestComposition />
        <EditorialFrameHeroFlippedTestComposition />
        <EditorialFrameAsideTestComposition />
        <EditorialFrameMinimalTestComposition />
      </Folder>

    </>
  );
};
