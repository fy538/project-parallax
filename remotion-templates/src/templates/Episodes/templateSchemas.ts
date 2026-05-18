/**
 * TEMPLATE_SCHEMAS — maps every TEMPLATE_COMPONENTS key to its Zod schema.
 *
 * Used by episode-integrity.test.ts to validate all template data files
 * referenced in an assembly manifest before any render is attempted.
 *
 * Each schema wraps the data object as `z.object({ data: z.object({...}) })`
 * so validation is called as: schema.safeParse({ data: jsonFileContents }).
 *
 * Keep this in sync with TEMPLATE_COMPONENTS in FullEpisode.tsx.
 * When adding a new template: import its schema here and add an entry.
 */

import { z } from "zod";

import { TitleTransitionSchema } from "../TitleTransition/schema";
import { ChoroplethMapSchema } from "../ChoroplethMap/schema";
import { QuoteDataSchema as KineticTypographySchema } from "../KineticTypography/schema";
// TimelineComparison + DualTimeline schemas no longer exported — both
// templates are @deprecated (May 18, 2026 audit P0 #8). Source kept under
// src/templates/{TimelineComparison,DualTimeline}/ for historical reference
// + catalog showreel. See note in FullEpisode.tsx for full rationale.
import { DataChartSchema } from "../DataChart/schema";
import { FrameworkDiagramSchema } from "../FrameworkDiagram/schema";
import { RouteAnimationSchema } from "../RouteAnimation/schema";
import { DecisionTreeSchema } from "../DecisionTree/schema";
import { SplitCompositionSchema } from "../SplitComposition/schema";
import { ProbabilityGaugeSchema } from "../ProbabilityGauge/schema";
import { ImageCompositeSchema } from "../ImageComposite/schema";
import { PhotoMontageSchema } from "../PhotoMontage/schema";
import { NetworkDiagramSchema } from "../NetworkDiagram/schema";
import { TimeSeriesChartSchema } from "../TimeSeriesChart/schema";
import { SankeyFlowSchema } from "../SankeyFlow/schema";
import { GameBoardSchema } from "../GameBoard/schema";
import { BayesianUpdateSchema } from "../BayesianUpdate/schema";
import { StatRevealSchema } from "../StatReveal/schema";
import { RadarChartSchema } from "../RadarChart/schema";
import { AnnotatedImageSchema } from "../AnnotatedImage/schema";
import { EscalationLadderSchema } from "../EscalationLadder/schema";
// DualTimelineSchema removed — see comment above the KineticTypography import.
import { HorizontalTimelineSchema } from "../HorizontalTimeline/schema";
import { DuelingFrameworksSchema } from "../DuelingFrameworks/schema";
import { StrategicLandscapeSchema } from "../StrategicLandscape/schema";
import { ArcDiagramSchema } from "../ArcDiagram/schema";
import { ProportionalSymbolMapSchema } from "../ProportionalSymbolMap/schema";
import { SlopegraphSchema } from "../Slopegraph/schema";
import { KPICardSchema } from "../KPICard/schema";
import { BulletChartSchema } from "../BulletChart/schema";
import { StepLineSchema } from "../StepLine/schema";

export const TEMPLATE_SCHEMAS: Record<string, z.ZodTypeAny> = {
  TitleTransition: TitleTransitionSchema,
  ChoroplethMap: ChoroplethMapSchema,
  KineticTypography: KineticTypographySchema,
  // TimelineComparison removed (deprecated; see import-block comment).
  DataChart: DataChartSchema,
  FrameworkDiagram: FrameworkDiagramSchema,
  RouteAnimation: RouteAnimationSchema,
  DecisionTree: DecisionTreeSchema,
  SplitComposition: SplitCompositionSchema,
  ProbabilityGauge: ProbabilityGaugeSchema,
  ImageComposite: ImageCompositeSchema,
  PhotoMontage: PhotoMontageSchema,
  NetworkDiagram: NetworkDiagramSchema,
  TimeSeriesChart: TimeSeriesChartSchema,
  SankeyFlow: SankeyFlowSchema,
  GameBoard: GameBoardSchema,
  BayesianUpdate: BayesianUpdateSchema,
  StatReveal: StatRevealSchema,
  RadarChart: RadarChartSchema,
  AnnotatedImage: AnnotatedImageSchema,
  EscalationLadder: EscalationLadderSchema,
  // DualTimeline removed (deprecated; see import-block comment).
  HorizontalTimeline: HorizontalTimelineSchema,
  DuelingFrameworks: DuelingFrameworksSchema,
  StrategicLandscape: StrategicLandscapeSchema,
  ArcDiagram: ArcDiagramSchema,
  ProportionalSymbolMap: ProportionalSymbolMapSchema,
  Slopegraph: SlopegraphSchema,
  KPICard: KPICardSchema,
  BulletChart: BulletChartSchema,
  StepLine: StepLineSchema,
};
