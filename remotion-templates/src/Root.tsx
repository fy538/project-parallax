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
// DEPRECATED: TimelineComparison, TimelineMorph, DualTimeline — replaced by HorizontalTimeline
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
import { TimeSeriesChartComposition } from "./templates/TimeSeriesChart";
import { SankeyFlowComposition } from "./templates/SankeyFlow";
import { GameBoardComposition } from "./templates/GameBoard";
import { BayesianUpdateComposition, BayesianUpdateMultiComposition } from "./templates/BayesianUpdate";
import { BifurcationRouteComposition } from "./templates/BifurcationRoute";
import { DuelingFrameworksComposition } from "./templates/DuelingFrameworks";
import { StrategicLandscapeComposition } from "./templates/StrategicLandscape";
import { StatRevealComposition } from "./templates/StatReveal";
import { PricingWaterfallComposition } from "./templates/PricingWaterfall";
import { RadarChartComposition } from "./templates/RadarChart";
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
import { AudioPreviewComposition } from "./templates/AudioPreview";
import { PrisonersDilemmaShowcaseComposition } from "./templates/Episodes/PrisonersDilemmaShowcase";
import { PrisonersDilemmaFullComposition } from "./templates/Episodes/PrisonersDilemmaFull";
import { ThumbnailComposition } from "./templates/Thumbnail";
import {
  EditorialFrameHeroTestComposition,
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
  CatalogChoroplethG7,
  CatalogChoroplethBlocs,
  CatalogChoroplethTordesillas,
  CatalogRouteSilkRoad,
  CatalogRouteMagellan,
  CatalogRouteChokepoints,
  CatalogStatApollo,
  CatalogStatMariana,
  CatalogStatHabitable,
  CatalogChartMountains,
  CatalogChartSpaceRace,
  CatalogTsCO2,
  CatalogTsPopulation,
  CatalogGaugeWeather,
  CatalogGaugeScorecard,
  CatalogBayesVenice,
  CatalogRadarAthletes,
  CatalogSankeyEnergy,
  CatalogWaterfallCoffee,
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
  CatalogFwComparison,
  CatalogFwFlow,
  CatalogFwMatrix,
  CatalogNwHubSpoke,
  CatalogSplitMaps,
  CatalogSplitTime,
  CatalogTimelineComputers,
  CatalogTimelineDualPandemics,
  CatalogLadderColdWar,
  CatalogLadderArms,
  CatalogTreeChess,
  CatalogGameChess,
  CatalogGamePayoff,
  CatalogBifurcationLatin,
  CatalogEditorialHero,
  CatalogEditorialAside,
  CatalogEditorialMinimal,
  CatalogShowreel,
  CatalogEmphasisShowcase,
  CatalogTemplatePreview,
  CatalogDuelingEmpireFall,
  CatalogTimelineComparisonRevolutions,
  CatalogDualImperialTransitions,
  CatalogMorphBlockades,
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
      </Folder>

      <Folder name="Maps">
        <ChoroplethMapComposition />
        <RouteAnimationComposition />
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
      </Folder>

      <Folder name="Typography">
        <KineticTypographyComposition />
      </Folder>

      <Folder name="Diagrams">
        <FrameworkDiagramComposition />
        <DuelingFrameworksComposition />
        <NetworkDiagramComposition />
        <SplitCompositionComposition />
        <StrategicLandscapeComposition />
      </Folder>

      <Folder name="Scenarios">
        <DecisionTreeComposition />
        <GameBoardComposition />
        <BifurcationRouteComposition />
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
        <CatalogEmphasisShowcase />
        <CatalogTemplatePreview />

        <Folder name="Maps">
          <CatalogChoroplethG7 />
          <CatalogChoroplethBlocs />
          <CatalogChoroplethTordesillas />
          <CatalogRouteSilkRoad />
          <CatalogRouteMagellan />
          <CatalogRouteChokepoints />
        </Folder>

        <Folder name="Data">
          <CatalogStatApollo />
          <CatalogStatMariana />
          <CatalogStatHabitable />
          <CatalogChartMountains />
          <CatalogChartSpaceRace />
          <CatalogTsCO2 />
          <CatalogTsPopulation />
          <CatalogGaugeWeather />
          <CatalogGaugeScorecard />
          <CatalogBayesVenice />
          <CatalogRadarAthletes />
          <CatalogSankeyEnergy />
          <CatalogWaterfallCoffee />
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
        </Folder>

        <Folder name="Diagrams">
          <CatalogFwComparison />
          <CatalogFwFlow />
          <CatalogFwMatrix />
          <CatalogNwHubSpoke />
          <CatalogSplitMaps />
          <CatalogSplitTime />
          <CatalogDuelingEmpireFall />
        </Folder>

        <Folder name="Timelines">
          <CatalogTimelineComputers />
          <CatalogTimelineDualPandemics />
          <CatalogLadderColdWar />
          <CatalogLadderArms />
          <CatalogTimelineComparisonRevolutions />
          <CatalogDualImperialTransitions />
          <CatalogMorphBlockades />
        </Folder>

        <Folder name="Cinematic">
          <CatalogImageArchive />
          <CatalogMontageTreatments />
          <CatalogAnnotatedDemo />
        </Folder>

        <Folder name="Scenarios">
          <CatalogTreeChess />
          <CatalogGameChess />
          <CatalogGamePayoff />
          <CatalogBifurcationLatin />
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
