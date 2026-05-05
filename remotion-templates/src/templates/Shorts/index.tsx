/**
 * Shorts — vertical 9:16 compositions for TikTok, YouTube Shorts, Douyin.
 *
 * Three variants matching the Shorts series defined in IDEAS.md:
 *   - KineticShort → "Framework in 45 Seconds", "History Rhymes"
 *   - DataChartShort → "The Market Says...", "Was I Right?"
 *   - SplitShort → "Both Sides Are Wrong"
 *
 * New adapters using ShortsWrapper pattern:
 *   - FrameworkDiagramShort, TimelineComparisonShort, ChoroplethMapShort,
 *     SplitCompositionShort, ProbabilityGaugeShort
 */

import { Composition } from "remotion";
import { KineticShort } from "./KineticShort";
import { DataChartShort } from "./DataChartShort";
import { SplitShort } from "./SplitShort";
import { StatRevealShort } from "./StatRevealShort";
import { FrameworkDiagramShort } from "./FrameworkDiagramShort";
import { TimelineComparisonShort } from "./TimelineComparisonShort";
import { ChoroplethMapShort } from "./ChoroplethMapShort";
import { SplitCompositionShort } from "./SplitCompositionShort";
import { ProbabilityGaugeShort } from "./ProbabilityGaugeShort";
import { sec } from "../../design/theme";
import { shortsLayout } from "./types";
import { QuoteDataSchema } from "../KineticTypography/schema";
import { DataChartSchema } from "../DataChart/schema";
import { SplitCompositionSchema } from "../SplitComposition/schema";
import { StatRevealSchema } from "../StatReveal/schema";
import { FrameworkDiagramSchema } from "../FrameworkDiagram/schema";
import { TimelineComparisonSchema } from "../TimelineComparison/schema";
import { ChoroplethMapSchema } from "../ChoroplethMap/schema";
import { ProbabilityGaugeSchema } from "../ProbabilityGauge/schema";
import type { QuoteData } from "../KineticTypography/types";
import type { DataChartData } from "../DataChart/types";
import type { SplitCompositionData } from "../SplitComposition/types";
import type { StatRevealData } from "../StatReveal/types";
import type { FrameworkDiagramData } from "../FrameworkDiagram/types";
import type { TimelineComparisonData } from "../TimelineComparison/types";
import type { ChoroplethMapData } from "../ChoroplethMap/types";
import type { ProbabilityGaugeData } from "../ProbabilityGauge/types";

// ── Sample data ───────────────────────────────────────────────────────────

const kineticSample: QuoteData = {
  episode: "SHORT",
  variant: "statistic",
  statValue: "7%",
  statLabel: "of US chip demand",
  statContext: "Despite $165B in reshoring investment",
  durationSec: 8,
};

const chartSample: DataChartData = {
  episode: "SHORT",
  title: "The Market Says...",
  subtitle: "Kalshi conflict probabilities",
  variant: "bar",
  unit: "%",
  dataPoints: [
    { label: "Taiwan Strait", value: 8 },
    { label: "Iran Threshold", value: 22 },
    { label: "Korea Escalation", value: 5 },
    { label: "South China Sea", value: 12 },
  ],
  source: "Kalshi.com — April 2026",
  durationSec: 10,
};

const splitSample: SplitCompositionData = {
  episode: "SHORT",
  title: "Both Sides Are Wrong",
  left: {
    tag: "SIDE A",
    title: "China Is Winning",
    items: [
      "DeepSeek proves chip access isn't needed",
      "Domestic production growing 30% YoY",
    ],
    accentColor: "#C23B22",
  },
  right: {
    tag: "SIDE B",
    title: "China Is Losing",
    items: [
      "Still 5+ years behind on cutting edge",
      "Export controls tightening every quarter",
    ],
    accentColor: "#3266AD",
  },
  dividerLabel: "vs",
  source: "The real question is about supply chain topology",
  durationSec: 12,
};

// ── Compositions ──────────────────────────────────────────────────────────

export const KineticShortComposition = () => (
  <Composition
    id="KineticShort"
    component={KineticShort}
    schema={QuoteDataSchema}
    calculateMetadata={({ props }) => ({
      durationInFrames: sec((props.data as QuoteData).durationSec || 8),
      fps: shortsLayout.fps,
      width: shortsLayout.width,
      height: shortsLayout.height,
    })}
    defaultProps={{ data: kineticSample }}
  />
);

export const DataChartShortComposition = () => (
  <Composition
    id="DataChartShort"
    component={DataChartShort}
    schema={DataChartSchema}
    calculateMetadata={({ props }) => ({
      durationInFrames: sec((props.data as DataChartData).durationSec || 10),
      fps: shortsLayout.fps,
      width: shortsLayout.width,
      height: shortsLayout.height,
    })}
    defaultProps={{ data: chartSample }}
  />
);

export const SplitShortComposition = () => (
  <Composition
    id="SplitShort"
    component={SplitShort}
    schema={SplitCompositionSchema}
    calculateMetadata={({ props }) => ({
      durationInFrames: sec((props.data as SplitCompositionData).durationSec || 12),
      fps: shortsLayout.fps,
      width: shortsLayout.width,
      height: shortsLayout.height,
    })}
    defaultProps={{ data: splitSample }}
  />
);

// ── New adapter-pattern Shorts ───────────────────────────────────────────

const statRevealSample: StatRevealData = {
  episode: "SHORT",
  title: "The Scale of Investment",
  stat: {
    value: 280,
    prefix: "$",
    suffix: "B",
    label: "CHIPS Act + private commitments",
  },
  comparisons: [
    { label: "Apollo (adj.)", value: 194, color: "#3266AD" },
    { label: "Marshall Plan", value: 173, color: "#5DAA68" },
    { label: "Manhattan Proj.", value: 30, color: "#C23B22" },
  ],
  source: "CBO, 2025",
  durationSec: 10,
};

export const StatRevealShortComposition = () => (
  <Composition
    id="StatRevealShort"
    component={StatRevealShort}
    schema={StatRevealSchema}
    calculateMetadata={({ props }) => ({
      durationInFrames: sec((props.data as StatRevealData).durationSec || 10),
      fps: shortsLayout.fps,
      width: shortsLayout.width,
      height: shortsLayout.height,
    })}
    defaultProps={{ data: statRevealSample }}
  />
);

// ── New adapter-pattern Shorts (framework, timeline, map, split, probability)

const frameworkDiagramSample: FrameworkDiagramData = {
  episode: "SHORT",
  title: "The Silicon Sandwich",
  variant: "comparison",
  columns: [
    {
      title: "Before Export Controls",
      icon: "🟢",
      items: [
        "China buys cutting-edge chips freely",
        "Semiconductor supply chain seamless",
        "Tech competition on features, not policy",
      ],
      color: "#5DAA68",
    },
    {
      title: "After Export Controls",
      icon: "🔴",
      items: [
        "Advanced chips banned from China",
        "Fragmented supply chains emerge",
        "Tech competition becomes geopolitical",
      ],
      color: "#C23B22",
    },
  ],
  durationSec: 12,
};

const timelineComparisonSample: TimelineComparisonData = {
  episode: "SHORT",
  leftLabel: "Historical",
  rightLabel: "Modern",
  leftColor: "#3266AD",
  rightColor: "#C23B22",
  leftEvents: [
    {
      year: "1960",
      title: "Transistor Revolution",
      icon: "⚡",
      description: "Silicon Valley born",
    },
    {
      year: "1980",
      title: "Chip Wars Begin",
      icon: "⚔",
      description: "Intel vs. Japanese imports",
    },
  ],
  rightEvents: [
    {
      year: "2020",
      title: "TSMC Dominance",
      icon: "🏭",
      description: "94% of cutting-edge fab capacity",
    },
    {
      year: "2024",
      title: "Reshoring Bets",
      icon: "🏛",
      description: "$165B US investment",
    },
  ],
};

const choroplethMapSample: ChoroplethMapData = {
  episode: "SHORT",
  title: "Global Chip Access",
  phases: [
    {
      title: "Current Export Controls",
      subtitle: "US policy vs. China access",
      durationSec: 10,
      countries: [
        { name: "United States", iso3: "USA", value: 100, fill: "#3266AD" },
        { name: "China", iso3: "CHN", value: 0, fill: "#C23B22" },
        { name: "Taiwan", iso3: "TWN", value: 100, fill: "#5DAA68" },
        { name: "South Korea", iso3: "KOR", value: 80, fill: "#E5A544" },
      ],
    },
  ],
};

const splitCompositionSample: SplitCompositionData = {
  episode: "SHORT",
  title: "Geopolitical Asymmetry",
  left: {
    tag: "STRUCTURAL",
    title: "Supply Chain Vulnerability",
    items: ["TSMC concentrates 90% of advanced fab capacity", "Taiwan Strait dependency"],
    accentColor: "#3266AD",
  },
  right: {
    tag: "RESPONSE",
    title: "Reshoring Gambit",
    items: ["$165B CHIPS Act", "10-year ROI unclear"],
    accentColor: "#C23B22",
  },
  dividerLabel: "vs",
  durationSec: 12,
};

const probabilityGaugeSample: ProbabilityGaugeData = {
  episode: "SHORT",
  title: "Market Forecast",
  variant: "gauge",
  gauges: [
    {
      label: "Taiwan trade restrictions within 5 years",
      value: 42,
      marketSource: "Kalshi — April 2026",
    },
  ],
  durationSec: 10,
};

export const FrameworkDiagramShortComposition = () => (
  <Composition
    id="FrameworkDiagram-Short"
    component={FrameworkDiagramShort}
    schema={FrameworkDiagramSchema}
    calculateMetadata={({ props }) => ({
      durationInFrames: sec((props.data as FrameworkDiagramData).durationSec || 12),
      fps: shortsLayout.fps,
      width: shortsLayout.width,
      height: shortsLayout.height,
    })}
    defaultProps={{ data: frameworkDiagramSample }}
  />
);

export const TimelineComparisonShortComposition = () => (
  <Composition
    id="TimelineComparison-Short"
    component={TimelineComparisonShort}
    schema={TimelineComparisonSchema}
    calculateMetadata={({ props }) => ({
      durationInFrames: sec(12), // Fixed 12 second duration
      fps: shortsLayout.fps,
      width: shortsLayout.width,
      height: shortsLayout.height,
    })}
    defaultProps={{ data: timelineComparisonSample }}
  />
);

export const ChoroplethMapShortComposition = () => (
  <Composition
    id="ChoroplethMap-Short"
    component={ChoroplethMapShort}
    schema={ChoroplethMapSchema}
    calculateMetadata={({ props }) => ({
      durationInFrames: sec(10), // Fixed 10 second duration
      fps: shortsLayout.fps,
      width: shortsLayout.width,
      height: shortsLayout.height,
    })}
    defaultProps={{ data: choroplethMapSample }}
  />
);

export const SplitCompositionShortComposition = () => (
  <Composition
    id="SplitComposition-Short"
    component={SplitCompositionShort}
    schema={SplitCompositionSchema}
    calculateMetadata={({ props }) => ({
      durationInFrames: sec((props.data as SplitCompositionData).durationSec || 12),
      fps: shortsLayout.fps,
      width: shortsLayout.width,
      height: shortsLayout.height,
    })}
    defaultProps={{ data: splitCompositionSample }}
  />
);

export const ProbabilityGaugeShortComposition = () => (
  <Composition
    id="ProbabilityGauge-Short"
    component={ProbabilityGaugeShort}
    schema={ProbabilityGaugeSchema}
    calculateMetadata={({ props }) => ({
      durationInFrames: sec((props.data as ProbabilityGaugeData).durationSec || 10),
      fps: shortsLayout.fps,
      width: shortsLayout.width,
      height: shortsLayout.height,
    })}
    defaultProps={{ data: probabilityGaugeSample }}
  />
);
