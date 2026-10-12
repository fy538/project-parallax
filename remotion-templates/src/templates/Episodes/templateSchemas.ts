/**
 * TEMPLATE_SCHEMAS — maps every TEMPLATE_COMPONENTS key to its Zod schema.
 *
 * Used by episode-integrity.test.ts to validate all template data files
 * referenced in an assembly manifest before any render is attempted.
 *
 * Each schema wraps the data object as `z.object({ data: z.object({...}) })`
 * so validation is called as: schema.safeParse({ data: jsonFileContents }).
 *
 * Keep this in sync with TEMPLATE_COMPONENTS in templateRegistry.ts.
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
import { ScrollyRevealSchema } from "../ScrollyReveal/schema";
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
// TEMPLATE_COMPONENTS (templateRegistry.ts) but missing here. The alignment
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
import { DivergingBarSchema } from "../DivergingBar/schema";
import { DotPlotSchema } from "../DotPlot/schema";
import { OrgChartSchema } from "../OrgChart/schema";
import { HorizonChartSchema } from "../HorizonChart/schema";
import { IsotypeChartSchema } from "../IsotypeChart/schema";
import { MarimekkoChartSchema } from "../MarimekkoChart/schema";
import { PopulationPyramidSchema } from "../PopulationPyramid/schema";
import { RankChangeDotPlotSchema } from "../RankChangeDotPlot/schema";
import { RidgelinePlotSchema } from "../RidgelinePlot/schema";
import { StreamgraphSchema } from "../Streamgraph/schema";
import { TernaryPlotSchema } from "../TernaryPlot/schema";
import { TilegramUSMapSchema } from "../TilegramUSMap/schema";
import { CinematicMapSchema } from "../CinematicMap/schema";
import { TerritoryMapSchema } from "../TerritoryMap/schema";
import { FlowMapSchema } from "../FlowMap/schema";
import { CausalLoopDiagramSchema } from "../CausalLoopDiagram/schema";
import { SpiralTimelineSchema } from "../SpiralTimeline/schema";
import { PrimarySourceSchema } from "../PrimarySourceReveal/schema";
import { SmallMultiplesSchema } from "../SmallMultiples/schema";
import { HandwrittenLetterSchema } from "../HandwrittenLetter/schema";
import { NewspaperHeadlineRotatorSchema } from "../NewspaperHeadlineRotator/schema";
import { ArchivalReelSchema } from "../ArchivalReel/schema";
import { TelegramCableSchema } from "../TelegramCable/schema";
import { ComparisonPairSchema } from "../ComparisonPair/schema";
import { SyllogismSchema } from "../Syllogism/schema";
import { AxiomListSchema } from "../AxiomList/schema";
import { DialecticFlowSchema } from "../DialecticFlow/schema";
import { ConditionalArgumentSchema } from "../ConditionalArgument/schema";
import { CounterfactualPathSchema } from "../CounterfactualPath/schema";
import { AnalogyCrossmapSchema } from "../AnalogyCrossmap/schema";
import { ToulminMapSchema } from "../ToulminMap/schema";
import { PhilosophicalFamilyTreeSchema } from "../PhilosophicalFamilyTree/schema";
import { ConceptEvolutionTimelineSchema } from "../ConceptEvolutionTimeline/schema";
import { MorphTransitionSchema } from "../MorphTransition/schema";
import { SplitFrameSchema } from "../SplitFrame/schema";
import { VennDiagramSchema } from "../VennDiagram/schema";
import { ChordDiagramSchema } from "../ChordDiagram/schema";
import { TreemapSchema } from "../Treemap/schema";
import { MatrixHeatmapSchema } from "../MatrixHeatmap/schema";
import { AnnotatedZoomSchema } from "../AnnotatedZoom/schema";
import { GenerativeBackdropSchema } from "../GenerativeBackdrop/schema";
import { BubbleMatrixSchema } from "../BubbleMatrix/schema";
import { BarChartRaceSchema } from "../BarChartRace/schema";
import { SanctionsNetworkSchema } from "../SanctionsNetwork/schema";
// Math templates — promoted to manifest-level May 20, 2026.
import { MathRevealSchema } from "../MathReveal/schema";
import { MathDerivationSchema } from "../MathDerivation/schema";

/**
 * Sister to TEMPLATE_COMPONENTS in templateRegistry.ts. The key sets MUST
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
  SanctionsNetwork: SanctionsNetworkSchema,
  TimeSeriesChart: TimeSeriesChartSchema,
  SankeyFlow: SankeyFlowSchema,
  GameBoard: GameBoardSchema,
  BayesianUpdate: BayesianUpdateSchema,
  StatReveal: StatRevealSchema,
  RadarChart: RadarChartSchema,
  AnnotatedImage: AnnotatedImageSchema,
  ScrollyReveal: ScrollyRevealSchema,
  AnnotatedZoom: AnnotatedZoomSchema,
  GenerativeBackdrop: GenerativeBackdropSchema,
  EscalationLadder: EscalationLadderSchema,
  // DualTimeline removed (deprecated; see import-block comment).
  HorizontalTimeline: HorizontalTimelineSchema,
  HorizontalTimelineSingle: HorizontalTimelineSchema,
  DuelingFrameworks: DuelingFrameworksSchema,
  StrategicLandscape: StrategicLandscapeSchema,
  ArcDiagram: ArcDiagramSchema,
  PhilosophicalFamilyTree: PhilosophicalFamilyTreeSchema,
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
  BarChartRace: BarChartRaceSchema,
  CalendarHeatmap: CalendarHeatmapSchema,
  CartogramMap: CartogramMapSchema,
  ConnectedScatterplot: ConnectedScatterplotSchema,
  DensityMap: DensityMapSchema,
  DumbbellPlot: DumbbellPlotSchema,
  BubbleMatrix: BubbleMatrixSchema,
  DivergingBar: DivergingBarSchema,
  DotPlot: DotPlotSchema,
  OrgChart: OrgChartSchema,
  HorizonChart: HorizonChartSchema,
  IsotypeChart: IsotypeChartSchema,
  MarimekkoChart: MarimekkoChartSchema,
  PopulationPyramid: PopulationPyramidSchema,
  RankChangeDotPlot: RankChangeDotPlotSchema,
  RidgelinePlot: RidgelinePlotSchema,
  Streamgraph: StreamgraphSchema,
  TernaryPlot: TernaryPlotSchema,
  TilegramUSMap: TilegramUSMapSchema,
  CinematicMap: CinematicMapSchema,
  TerritoryMap: TerritoryMapSchema,
  FlowMap: FlowMapSchema,
  CausalLoopDiagram: CausalLoopDiagramSchema,
  SpiralTimeline: SpiralTimelineSchema,
  ConceptEvolutionTimeline: ConceptEvolutionTimelineSchema,
  PrimarySourceReveal: PrimarySourceSchema,
  SmallMultiples: SmallMultiplesSchema,
  HandwrittenLetter: HandwrittenLetterSchema,
  NewspaperHeadlineRotator: NewspaperHeadlineRotatorSchema,
  ArchivalReel: ArchivalReelSchema,
  TelegramCable: TelegramCableSchema,
  ComparisonPair: ComparisonPairSchema,
  Syllogism: SyllogismSchema,
  AxiomList: AxiomListSchema,
  DialecticFlow: DialecticFlowSchema,
  ConditionalArgument: ConditionalArgumentSchema,
  CounterfactualPath: CounterfactualPathSchema,
  AnalogyCrossmap: AnalogyCrossmapSchema,
  ToulminMap: ToulminMapSchema,
  MorphTransition: MorphTransitionSchema,
  SplitFrame: SplitFrameSchema,
  VennDiagram: VennDiagramSchema,
  ChordDiagram: ChordDiagramSchema,
  Treemap: TreemapSchema,
  MatrixHeatmap: MatrixHeatmapSchema,
  // Math templates — promoted to manifest-level May 20, 2026.
  MathReveal: MathRevealSchema,
  MathDerivation: MathDerivationSchema,
} as const satisfies Record<string, z.ZodTypeAny>;

/** Literal union of every name registered in TEMPLATE_SCHEMAS. */
export type TemplateSchemaName = keyof typeof TEMPLATE_SCHEMAS;
