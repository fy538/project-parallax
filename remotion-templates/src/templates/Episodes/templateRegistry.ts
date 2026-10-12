/** Manifest template dispatch. Keep keys aligned with templateSchemas.ts. */
import type React from "react";

// ── Template imports ─��────────────────────────────────────────────────────────

import { TitleTransition } from "../TitleTransition/TitleTransition";
import { ChoroplethMap } from "../ChoroplethMap/ChoroplethMap";
import { ProportionalSymbolMap } from "../ProportionalSymbolMap/ProportionalSymbolMap";
import { KineticTypography } from "../KineticTypography/KineticTypography";
// TimelineComparison + DualTimeline are @deprecated — replaced by
// HorizontalTimeline. Removed from TEMPLATE_COMPONENTS dispatch May 18, 2026
// (engineering audit P0 #8) so manifest authors can't silently pick them.
// Source kept under src/templates/{TimelineComparison,DualTimeline}/ for
// historical reference + catalog showreel. Lint rule "no-deprecated-template-
// dispatch" in scripts/lint-conventions.mjs guards against re-add.
import { DataChart } from "../DataChart/DataChart";
import { FrameworkDiagram } from "../FrameworkDiagram/FrameworkDiagram";
import { RouteAnimation } from "../RouteAnimation/RouteAnimation";
import { DecisionTree } from "../DecisionTree/DecisionTree";
import { OutcomePartition } from "../OutcomePartition/OutcomePartition";
import { SplitComposition } from "../SplitComposition/SplitComposition";
import { ProbabilityGauge } from "../ProbabilityGauge/ProbabilityGauge";
import { ImageComposite } from "../ImageComposite/ImageComposite";
import { PhotoMontage } from "../PhotoMontage/PhotoMontage";
import { NetworkDiagram } from "../NetworkDiagram/NetworkDiagram";
import { TimeSeriesChart } from "../TimeSeriesChart/TimeSeriesChart";
import { SankeyFlow } from "../SankeyFlow/SankeyFlow";
import { GameBoard } from "../GameBoard/GameBoard";
import { BayesianUpdate } from "../BayesianUpdate/BayesianUpdate";
import { StatReveal } from "../StatReveal/StatReveal";
import { RadarChart } from "../RadarChart/RadarChart";
import { AnnotatedImage } from "../AnnotatedImage/AnnotatedImage";
import { ScrollyReveal } from "../ScrollyReveal/ScrollyReveal";
import { EscalationLadder } from "../EscalationLadder/EscalationLadder";
// DualTimeline @deprecated — see comment above the TimelineComparison import.
import { HorizontalTimeline } from "../HorizontalTimeline/HorizontalTimeline";
import { ArcDiagram } from "../ArcDiagram/ArcDiagram";
import { Slopegraph } from "../Slopegraph/Slopegraph";
import { KPICard } from "../KPICard/KPICard";
import { BulletChart } from "../BulletChart/BulletChart";
import { StepLine } from "../StepLine/StepLine";
// BifurcationRoute template removed May 13, 2026 (phylogenetic-tree
// register didn't fit Parallax; no episodes in queue required it).
import { DuelingFrameworks } from "../DuelingFrameworks/DuelingFrameworks";
import { StrategicLandscape } from "../StrategicLandscape/StrategicLandscape";
import { PricingWaterfall } from "../PricingWaterfall/PricingWaterfall";
import { CausalLoopDiagram } from "../CausalLoopDiagram/CausalLoopDiagram";
import { SpiralTimeline } from "../SpiralTimeline/SpiralTimeline";
import { PrimarySourceReveal } from "../PrimarySourceReveal/PrimarySourceReveal";
import { SmallMultiples } from "../SmallMultiples/SmallMultiples";
import { HandwrittenLetter } from "../HandwrittenLetter/HandwrittenLetter";
import { NewspaperHeadlineRotator } from "../NewspaperHeadlineRotator/NewspaperHeadlineRotator";
import { ArchivalReel } from "../ArchivalReel/ArchivalReel";
import { TelegramCable } from "../TelegramCable/TelegramCable";
import { ComparisonPair } from "../ComparisonPair/ComparisonPair";
import { Syllogism } from "../Syllogism/Syllogism";
import { AxiomList } from "../AxiomList/AxiomList";
import { DialecticFlow } from "../DialecticFlow/DialecticFlow";
import { ConditionalArgument } from "../ConditionalArgument/ConditionalArgument";
import { CounterfactualPath } from "../CounterfactualPath/CounterfactualPath";
import { AnalogyCrossmap } from "../AnalogyCrossmap/AnalogyCrossmap";
import { ToulminMap } from "../ToulminMap/ToulminMap";
import { PhilosophicalFamilyTree } from "../PhilosophicalFamilyTree/PhilosophicalFamilyTree";
import { ConceptEvolutionTimeline } from "../ConceptEvolutionTimeline/ConceptEvolutionTimeline";
import { MorphTransition } from "../MorphTransition/MorphTransition";
import { SplitFrame } from "../SplitFrame/SplitFrame";
import { VennDiagram } from "../VennDiagram/VennDiagram";
import { ChordDiagram } from "../ChordDiagram/ChordDiagram";
import { Treemap } from "../Treemap/Treemap";
import { MatrixHeatmap } from "../MatrixHeatmap/MatrixHeatmap";
// TimelineMorph template deleted May 13, 2026 (its single use case
// migrated to DuelingFrameworks). Removed from FullEpisode template map.
import { AtlasPlate } from "../AtlasPlate/AtlasPlate";
import { BeeswarmChart } from "../BeeswarmChart/BeeswarmChart";
import { BumpChart } from "../BumpChart/BumpChart";
import { CalendarHeatmap } from "../CalendarHeatmap/CalendarHeatmap";
import { CartogramMap } from "../CartogramMap/CartogramMap";
import { ConnectedScatterplot } from "../ConnectedScatterplot/ConnectedScatterplot";
import { DensityMap } from "../DensityMap/DensityMap";
import { DumbbellPlot } from "../DumbbellPlot/DumbbellPlot";
import { DivergingBar } from "../DivergingBar/DivergingBar";
import { DotPlot } from "../DotPlot/DotPlot";
import { OrgChart } from "../OrgChart/OrgChart";
import { HorizonChart } from "../HorizonChart/HorizonChart";
import { IsotypeChart } from "../IsotypeChart/IsotypeChart";
import { MarimekkoChart } from "../MarimekkoChart/MarimekkoChart";
import { PopulationPyramid } from "../PopulationPyramid/PopulationPyramid";
import { RankChangeDotPlot } from "../RankChangeDotPlot/RankChangeDotPlot";
import { RidgelinePlot } from "../RidgelinePlot/RidgelinePlot";
import { Streamgraph } from "../Streamgraph/Streamgraph";
import { TernaryPlot } from "../TernaryPlot/TernaryPlot";
import { TilegramUSMap } from "../TilegramUSMap/TilegramUSMap";
import { CinematicMap } from "../CinematicMap/CinematicMap";
// Map extensions — TerritoryMap + FlowMap (May 20, 2026)
import { TerritoryMap } from "../TerritoryMap/TerritoryMap";
import { FlowMap } from "../FlowMap/FlowMap";
import { AnnotatedZoom } from "../AnnotatedZoom/AnnotatedZoom";
import { GenerativeBackdrop } from "../GenerativeBackdrop/GenerativeBackdrop";
import { BubbleMatrix } from "../BubbleMatrix/BubbleMatrix";
import { BarChartRace } from "../BarChartRace/BarChartRace";
import { SanctionsNetwork } from "../SanctionsNetwork/SanctionsNetwork";
// Math templates — promoted to manifest-level May 20, 2026 (were catalog-only).
import { MathReveal } from "../MathReveal/MathReveal";
import { MathDerivation } from "../MathDerivation/MathDerivation";


/**
 * Manifest-dispatch registry. Keys are referenced as strings from
 * `assembly-manifest.json` segment `template.component` fields; values
 * are the React components themselves.
 *
 * Typing strategy (May 2026 audit #5):
 *
 *  · Value type is `ComponentType<{ data: any }>` rather than
 *    `ComponentType<{ data: unknown }>` because each template component
 *    declares its own specific data type (e.g. `FC<{data: DataChartData}>`).
 *    With `unknown`, assignment would fail (a component that needs
 *    DataChartData can't be assigned to a slot accepting unknown — that
 *    would force every template to validate at the function boundary).
 *    The `any` here is bounded — runtime validation happens upstream via
 *    TEMPLATE_SCHEMAS (Zod) before dispatch.
 *
 *  · `as const satisfies` (rather than the prior loose `Record<string, ...>`
 *    annotation) preserves per-key literal types, which feeds the
 *    `TemplateComponentName` literal union below. Concretely: adding a
 *    typo to the registry now produces a compile error at the consumer
 *    rather than a runtime "Unknown template component" warning.
 *
 *  · Sister registry TEMPLATE_SCHEMAS lives in Episodes/templateSchemas.ts;
 *    a meta-test (src/__tests__/template-registries-aligned.test.ts)
 *    enforces that the two registries' key sets match exactly.
 */
export const TEMPLATE_COMPONENTS = {
  TitleTransition,
  ChoroplethMap,
  KineticTypography,
  // TimelineComparison removed (deprecated; see import-block comment).
  DataChart,
  FrameworkDiagram,
  RouteAnimation,
  DecisionTree,
  OutcomePartition,
  SplitComposition,
  ProbabilityGauge,
  ImageComposite,
  PhotoMontage,
  NetworkDiagram,
  SanctionsNetwork,
  TimeSeriesChart,
  SankeyFlow,
  GameBoard,
  BayesianUpdate,
  StatReveal,
  RadarChart,
  AnnotatedImage,
  ScrollyReveal,
  AnnotatedZoom,
  GenerativeBackdrop,
  EscalationLadder,
  // DualTimeline removed (deprecated; see import-block comment).
  HorizontalTimeline,
  // HorizontalTimelineSingle shares the HorizontalTimeline component;
  // registered separately so manifests can explicitly name the single-event variant.
  HorizontalTimelineSingle: HorizontalTimeline,
  DuelingFrameworks,
  StrategicLandscape,
  ArcDiagram,
  PhilosophicalFamilyTree,
  ProportionalSymbolMap,
  Slopegraph,
  KPICard,
  BulletChart,
  StepLine,
  PricingWaterfall,
  AtlasPlate,
  BeeswarmChart,
  BumpChart,
  BarChartRace,
  CalendarHeatmap,
  CartogramMap,
  ConnectedScatterplot,
  DensityMap,
  DumbbellPlot,
  BubbleMatrix,
  DivergingBar,
  DotPlot,
  OrgChart,
  HorizonChart,
  IsotypeChart,
  MarimekkoChart,
  PopulationPyramid,
  RankChangeDotPlot,
  RidgelinePlot,
  Streamgraph,
  TernaryPlot,
  TilegramUSMap,
  CinematicMap,
  TerritoryMap,
  FlowMap,
  CausalLoopDiagram,
  SpiralTimeline,
  ConceptEvolutionTimeline,
  PrimarySourceReveal,
  SmallMultiples,
  HandwrittenLetter,
  NewspaperHeadlineRotator,
  ArchivalReel,
  TelegramCable,
  ComparisonPair,
  Syllogism,
  AxiomList,
  DialecticFlow,
  ConditionalArgument,
  CounterfactualPath,
  AnalogyCrossmap,
  ToulminMap,
  MorphTransition,
  SplitFrame,
  VennDiagram,
  ChordDiagram,
  Treemap,
  MatrixHeatmap,
  // Math templates — promoted from catalog-only to manifest-level May 20, 2026.
  MathReveal,
  MathDerivation,
} as const satisfies Record<string, React.ComponentType<{ data: any }>>;

/**
 * Literal union of every registered template name. Derived directly from
 * the TEMPLATE_COMPONENTS keys via the `as const` above, so renaming /
 * adding / removing a template propagates here at compile time — no
 * separate hand-maintained enum.
 *
 * Use this type wherever you take a template name from external input
 * (manifest JSON, CLI flag, ...) and want compile-time autocomplete +
 * typo-checking on the downstream lookup.
 */
export type TemplateComponentName = keyof typeof TEMPLATE_COMPONENTS;

