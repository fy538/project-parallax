/**
 * Root — registers all compositions with Remotion Studio.
 *
 * Each template gets its own <Folder> for organization.
 * Add new templates here as you build them.
 */

import React from "react";
import { Folder } from "remotion";
import "./design/fonts"; // Preload all Meridian brand fonts
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
  CatalogNwChain,
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
  CatalogShowreel,
  CatalogEmphasisShowcase,
} from "./catalog";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Folder name="Episodes">
        <SiliconTrapComposition />
        <SiliconTrapFullComposition />
        <PrisonersDilemmaShowcaseComposition />
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
          <CatalogNwChain />
          <CatalogSplitMaps />
          <CatalogSplitTime />
        </Folder>

        <Folder name="Timelines">
          <CatalogTimelineComputers />
          <CatalogTimelineDualPandemics />
          <CatalogLadderColdWar />
          <CatalogLadderArms />
        </Folder>

        <Folder name="Scenarios">
          <CatalogTreeChess />
          <CatalogGameChess />
          <CatalogGamePayoff />
          <CatalogBifurcationLatin />
        </Folder>
      </Folder>
    </>
  );
};
