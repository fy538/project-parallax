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
import {
  KineticShortComposition,
  DataChartShortComposition,
  SplitShortComposition,
} from "./templates/Shorts";
import { EP01Composition } from "./templates/Episodes";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Folder name="Episodes">
        <EP01Composition />
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
        <ProbabilityGaugeComposition />
      </Folder>

      <Folder name="Typography">
        <KineticTypographyComposition />
      </Folder>

      <Folder name="Diagrams">
        <FrameworkDiagramComposition />
        <SplitCompositionComposition />
      </Folder>

      <Folder name="Scenarios">
        <DecisionTreeComposition />
      </Folder>

      <Folder name="Transitions">
        <TitleTransitionComposition />
      </Folder>

      <Folder name="Cinematic">
        <ImageCompositeComposition />
      </Folder>

      <Folder name="Shorts">
        <KineticShortComposition />
        <DataChartShortComposition />
        <SplitShortComposition />
      </Folder>
    </>
  );
};
