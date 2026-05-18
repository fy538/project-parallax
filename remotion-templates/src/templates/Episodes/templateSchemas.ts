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

// May 18, 2026 audit #5 — added the 19 schemas that were registered in
// TEMPLATE_COMPONENTS (FullEpisode.tsx) but missing here. The alignment
// meta-test (src/__tests__/template-registries-aligned.test.ts) caught
// the pre-existing drift. Without these entries, manifest data for
// these templates bypassed Zod validation — typo'd fields silently
// produced prop-shape bugs at render time.
import { OutcomePartitionSchema } from "../OutcomePartition/schema";
import { PricingWaterfallSchema } from "../PricingWaterfall/schema";
import { AtlasPlateSchema } from "../AtlasPlate/schema";
import { BeeswarmChartSchema } from "../BeeswarmChart/schema";
import { BumpChartSchema } from "../BumpChart/schema";
import { CalendarHeatmapSchema } from "../CalendarHeatmap/schema";
import { CartogramMapSchema } from "../CartogramMap/schema";
import { ConnectedScatterplotSchema } from "../ConnectedScatterplot/schema";
import { DensityMapSchema } from "../DensityMap/schema";
import { DumbbellPlotSchema } from "../DumbbellPlot/schema";
import { HorizonChartSchema } from "../HorizonChart/schema";
import { IsotypeChartSchema } from "../IsotypeChart/schema";
import { MarimekkoChartSchema } from "../MarimekkoChart/schema";
import { PopulationPyramidSchema } from "../PopulationPyramid/schema";
import { RankChangeDotPlotSchema } from "../RankChangeDotPlot/schema";
import { RidgelinePlotSchema } from "../RidgelinePlot/schema";
import { StreamgraphSchema } from "../Streamgraph/schema";
import { TernaryPlotSchema } from "../TernaryPlot/schema";
import { TilegramUSMapSchema } from "../TilegramUSMap/schema";

/**
 * Sister to TEMPLATE_COMPONENTS in FullEpisode.tsx. The key sets MUST
 * match — enforced at runtime by
 * src/__tests__/template-registries-aligned.test.ts (audit #5).
 *
 * `as const satisfies` preserves per-key literal types like
 * TEMPLATE_COMPONENTS does, enabling the alignment test to do a
 * compile-time key-set diff in addition to the runtime check.
 */
export const TEMPLATE_SCHEMAS = {
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
  // ── Audit #5 backfill (May 18, 2026) ─────────────────────────────────
  OutcomePartition: OutcomePartitionSchema,
  PricingWaterfall: PricingWaterfallSchema,
  AtlasPlate: AtlasPlateSchema,
  BeeswarmChart: BeeswarmChartSchema,
  BumpChart: BumpChartSchema,
  CalendarHeatmap: CalendarHeatmapSchema,
  CartogramMap: CartogramMapSchema,
  ConnectedScatterplot: ConnectedScatterplotSchema,
  DensityMap: DensityMapSchema,
  DumbbellPlot: DumbbellPlotSchema,
  HorizonChart: HorizonChartSchema,
  IsotypeChart: IsotypeChartSchema,
  MarimekkoChart: MarimekkoChartSchema,
  PopulationPyramid: PopulationPyramidSchema,
  RankChangeDotPlot: RankChangeDotPlotSchema,
  RidgelinePlot: RidgelinePlotSchema,
  Streamgraph: StreamgraphSchema,
  TernaryPlot: TernaryPlotSchema,
  TilegramUSMap: TilegramUSMapSchema,
} as const satisfies Record<string, z.ZodTypeAny>;

/** Literal union of every name registered in TEMPLATE_SCHEMAS. */
export type TemplateSchemaName = keyof typeof TEMPLATE_SCHEMAS;
