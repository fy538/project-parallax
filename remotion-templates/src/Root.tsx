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
import { TimelineComparisonComposition } from "./templates/TimelineComparison";
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
import {
  KineticShortComposition,
  DataChartShortComposition,
  SplitShortComposition,
} from "./templates/Shorts";
import { EP01Composition, EP01FullComposition } from "./templates/Episodes";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Folder name="Episodes">
        <EP01Composition />
        <EP01FullComposition />
      </Folder>

      <Folder name="Maps">
        <ChoroplethMapComposition />
        <RouteAnimationComposition />
      </Folder>

      <Folder name="Timelines">
        <TimelineComparisonComposition />
      </Folder>

      <Folder name="Data">
        <DataChartComposition />
        <TimeSeriesChartComposition />
        <SankeyFlowComposition />
        <ProbabilityGaugeComposition />
      </Folder>

      <Folder name="Typography">
        <KineticTypographyComposition />
      </Folder>

      <Folder name="Diagrams">
        <FrameworkDiagramComposition />
        <NetworkDiagramComposition />
        <SplitCompositionComposition />
      </Folder>

      <Folder name="Scenarios">
        <DecisionTreeComposition />
        <GameBoardComposition />
      </Folder>

      <Folder name="Transitions">
        <TitleTransitionComposition />
      </Folder>

      <Folder name="Cinematic">
        <ImageCompositeComposition />
        <PhotoMontageComposition />
      </Folder>

      <Folder name="Shorts">
        <KineticShortComposition />
        <DataChartShortComposition />
        <SplitShortComposition />
      </Folder>
    </>
  );
};
