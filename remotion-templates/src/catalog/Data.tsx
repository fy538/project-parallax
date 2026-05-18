/**
 * Catalog — Data category.
 *
 * StatReveal × 3, DataChart × 2, TimeSeriesChart × 2, ProbabilityGauge × 2,
 * BayesianUpdate × 1, RadarChart × 1, SankeyFlow × 1.
 *
 * All subjects are evergreen / educational — never confused for episode work.
 */

import { Composition } from "remotion";
import { StatReveal } from "../templates/StatReveal/StatReveal";
import { StatRevealSchema } from "../templates/StatReveal/schema";
import type { StatRevealData } from "../templates/StatReveal/types";
import { DataChart } from "../templates/DataChart/DataChart";
import { DataChartSchema } from "../templates/DataChart/schema";
import type { DataChartData } from "../templates/DataChart/types";
import { TimeSeriesChart } from "../templates/TimeSeriesChart/TimeSeriesChart";
import { TimeSeriesChartSchema } from "../templates/TimeSeriesChart/schema";
import type { TimeSeriesChartData } from "../templates/TimeSeriesChart/types";
import { ProbabilityGauge } from "../templates/ProbabilityGauge/ProbabilityGauge";
import { ProbabilityGaugeSchema } from "../templates/ProbabilityGauge/schema";
import type { ProbabilityGaugeData } from "../templates/ProbabilityGauge/types";
import { BayesianUpdate } from "../templates/BayesianUpdate/BayesianUpdate";
import { BayesianUpdateSchema } from "../templates/BayesianUpdate/schema";
import type { BayesianUpdateData } from "../templates/BayesianUpdate/types";
import { PricingWaterfall } from "../templates/PricingWaterfall/PricingWaterfall";
import { PricingWaterfallSchema } from "../templates/PricingWaterfall/schema";
import type { PricingWaterfallData } from "../templates/PricingWaterfall/types";
import { RadarChart } from "../templates/RadarChart/RadarChart";
import { RadarChartSchema } from "../templates/RadarChart/schema";
import type { RadarChartData } from "../templates/RadarChart/types";
import { SankeyFlow } from "../templates/SankeyFlow/SankeyFlow";
import { SankeyFlowSchema } from "../templates/SankeyFlow/schema";
import type { SankeyFlowData } from "../templates/SankeyFlow/types";
import { BumpChart } from "../templates/BumpChart/BumpChart";
import { BumpChartSchema } from "../templates/BumpChart/schema";
import type { BumpChartData } from "../templates/BumpChart/types";
import { PopulationPyramid } from "../templates/PopulationPyramid/PopulationPyramid";
import { PopulationPyramidSchema } from "../templates/PopulationPyramid/schema";
import type { PopulationPyramidData } from "../templates/PopulationPyramid/types";
import { RankChangeDotPlot } from "../templates/RankChangeDotPlot/RankChangeDotPlot";
import { RankChangeDotPlotSchema } from "../templates/RankChangeDotPlot/schema";
import type { RankChangeDotPlotData } from "../templates/RankChangeDotPlot/types";
import rankChangeSemiconductors from "../../data/episodes/catalog/rank-change-semiconductors.json";
import { IsotypeChart } from "../templates/IsotypeChart/IsotypeChart";
import { IsotypeChartSchema } from "../templates/IsotypeChart/schema";
import type { IsotypeChartData } from "../templates/IsotypeChart/types";
import isotypeChipsData from "../../data/episodes/catalog/isotype-chips.json";
import { BeeswarmChart } from "../templates/BeeswarmChart/BeeswarmChart";
import { BeeswarmChartSchema } from "../templates/BeeswarmChart/schema";
import type { BeeswarmData } from "../templates/BeeswarmChart/types";
import { CalendarHeatmap } from "../templates/CalendarHeatmap/CalendarHeatmap";
import { CalendarHeatmapSchema } from "../templates/CalendarHeatmap/schema";
import type { CalendarHeatmapData, CalendarDay } from "../templates/CalendarHeatmap/types";
import { ConnectedScatterplot } from "../templates/ConnectedScatterplot/ConnectedScatterplot";
import { ConnectedScatterplotSchema } from "../templates/ConnectedScatterplot/schema";
import type { ConnectedScatterplotData } from "../templates/ConnectedScatterplot/types";
import { Streamgraph } from "../templates/Streamgraph/Streamgraph";
import { StreamgraphSchema } from "../templates/Streamgraph/schema";
import type { StreamgraphData, StreamSeries } from "../templates/Streamgraph/types";
import { RidgelinePlot } from "../templates/RidgelinePlot/RidgelinePlot";
import { RidgelinePlotSchema } from "../templates/RidgelinePlot/schema";
import type { RidgelinePlotData } from "../templates/RidgelinePlot/types";
import { MarimekkoChart } from "../templates/MarimekkoChart/MarimekkoChart";
import { MarimekkoChartSchema } from "../templates/MarimekkoChart/schema";
import type { MarimekkoChartData } from "../templates/MarimekkoChart/types";
import { TernaryPlot } from "../templates/TernaryPlot/TernaryPlot";
import { TernaryPlotSchema } from "../templates/TernaryPlot/schema";
import type { TernaryPlotData } from "../templates/TernaryPlot/types";
import { HorizonChart } from "../templates/HorizonChart/HorizonChart";
import { HorizonChartSchema } from "../templates/HorizonChart/schema";
import type { HorizonChartData, HorizonDatum } from "../templates/HorizonChart/types";
import { DumbbellPlot } from "../templates/DumbbellPlot/DumbbellPlot";
import { DumbbellPlotSchema } from "../templates/DumbbellPlot/schema";
import type { DumbbellPlotData } from "../templates/DumbbellPlot/types";
import { layout, palette, sec } from "../design/theme";
import { CATALOG_EPISODE, catalogId } from "./helpers";
import bumpGdpData from "../../data/episodes/catalog/bump-chart-gdp.json";
import pyramidChinaData from "../../data/episodes/catalog/population-pyramid-china.json";

// Phase 4 editorial-native template sample data — re-exported from each
// template's index.tsx so the showreel can render them without duplicating
// the data inline.
import { slopegraphSampleData } from "../templates/Slopegraph";
import { kpiCardSampleData } from "../templates/KPICard";
import { bulletChartSampleData } from "../templates/BulletChart";
import { stepLineSampleData } from "../templates/StepLine";

// Production-episode JSON with EditorialFrame `frame` blocks — drives the
// "EditorialFrame · publication composition" section of the showreel so
// viewers see the kicker + heroStat + annotations + chrome stack the
// architecture actually ships in episodes (rather than the legacy
// chart-only renders that the regular Data section already covers).
import chartChipsActData from "../../data/episodes/silicon-trap/chart-chips-act.json";
import chartLithographyData from "../../data/episodes/silicon-trap/chart-lithography.json";
import timeseriesSmicYieldData from "../../data/episodes/silicon-trap/timeseries-smic-yield.json";
import forecastPdCooperationData from "../../data/episodes/prisoners-dilemma/forecast-pd-cooperation.json";

// ─── StatReveal — three different scale categories ────────────────────────

const statApollo: StatRevealData = {
  episode: CATALOG_EPISODE,
  title: "What Apollo Cost",
  subtitle: "Inflation-adjusted to 2024 dollars",
  stat: { value: 257, prefix: "$", suffix: "B", label: "Total Apollo Program cost (1961–1972)", decimals: 0 },
  comparisons: [
    { label: "Manhattan Project", value: 30, color: "#3266AD" },
    { label: "Marshall Plan", value: 173, color: "#5DAA68" },
    { label: "Interstate Highway System", value: 575, color: "#E5A544" },
  ],
  source: "NASA historical accounting",
  durationSec: 9,
};

const statMariana: StatRevealData = {
  episode: CATALOG_EPISODE,
  title: "How Deep Is Deep",
  subtitle: "The Mariana Trench compared to other vertical scales",
  stat: { value: 10994, suffix: " m", label: "Challenger Deep below sea level", decimals: 0 },
  comparisons: [
    { label: "Mt. Everest (above sea)", value: 8849, color: "#E5A544" },
    { label: "Cruising altitude (737)", value: 11277, color: "#3266AD" },
    { label: "Burj Khalifa height", value: 828, color: "#888780" },
  ],
  heroIsMax: false,
  source: "NOAA bathymetry",
  durationSec: 8,
};

const statHabitable: StatRevealData = {
  episode: CATALOG_EPISODE,
  title: "Habitable Land",
  subtitle: "Where humans can actually live, by region",
  stat: { value: 71, suffix: "%", label: "of Earth's surface is ocean", decimals: 0 },
  comparisons: [
    { label: "Land area", value: 29, color: "#5DAA68" },
    { label: "Glaciers / ice", value: 10, color: "#3266AD" },
    { label: "Deserts", value: 8, color: "#E5A544" },
    { label: "Habitable land", value: 11, color: "#C23B22" },
  ],
  source: "Our World in Data",
  durationSec: 9,
};

// ─── DataChart — bar + comparison ─────────────────────────────────────────

const chartMountains: DataChartData = {
  episode: CATALOG_EPISODE,
  // Short title + highlight on the rightmost bar — keeps the hero number
  // away from the title's bounding box. Wide value range (cyclist→jet)
  // so bars actually look distinct.
  title: "Maximum Speeds",
  subtitle: "Of various things, in miles per hour",
  variant: "bar",
  unit: " mph",
  dataPoints: [
    { label: "Cyclist", value: 12 },
    { label: "Cheetah", value: 70 },
    { label: "Highway car", value: 80 },
    { label: "Race car", value: 220 },
    { label: "Bullet train", value: 268, sublabel: "Shanghai Maglev" },
    { label: "Commercial jet", value: 575 },
    { label: "F-22 Raptor", value: 1500, color: "#C23B22" },
  ],
  highlightIndex: 6,
  contextNote: "An F-22 covers a mile in under 2.5 seconds — 125× a cyclist.",
  source: "Manufacturer specs and public records",
  durationSec: 9,
};

// Olympic medal counts make a far better comparison demo than year values:
// real bar-height differences, no thousand-separator number formatting issue,
// same Cold War subject. Six Summer Games during the bipolar era.
const chartSpaceRace: DataChartData = {
  episode: CATALOG_EPISODE,
  title: "Olympic Medals During the Cold War",
  subtitle: "Total medal counts at six Summer Games, US vs. USSR",
  variant: "comparison",
  comparisonPairs: [
    { label: "Helsinki '52", leftValue: 76, rightValue: 71 },
    { label: "Melbourne '56", leftValue: 74, rightValue: 98 },
    { label: "Rome '60", leftValue: 71, rightValue: 103 },
    { label: "Tokyo '64", leftValue: 90, rightValue: 96 },
    { label: "Mexico '68", leftValue: 107, rightValue: 91 },
    { label: "Munich '72", leftValue: 94, rightValue: 99 },
  ],
  leftGroupLabel: "United States",
  leftGroupColor: "#3266AD",
  rightGroupLabel: "Soviet Union",
  rightGroupColor: "#C23B22",
  contextNote: "The lead changes hands at every Games until the boycotts of the 1980s.",
  source: "International Olympic Committee",
  durationSec: 11,
};

// Lollipop demo — Axelrod-tournament style ranking. Twelve strategies competing
// across 200 iterated PD rounds; Tit-for-Tat wins, Always-Defect dies last.
// PD-thematic for the launch episode; the same form fits "approval ratings by
// country" or any 10+ item ranking. See:
// references/template-research/data-chart.md § 6.4
const chartAxelrodRankings: DataChartData = {
  episode: CATALOG_EPISODE,
  title: "Cooperation Pays",
  subtitle: "Average score per round, 200-round Axelrod tournament — top strategies, plus the floor",
  variant: "lollipop",
  unit: "",
  dataPoints: [
    { label: "Tit-for-Tat", value: 504, color: "#E5A544" },
    { label: "Tit-for-Two-Tats", value: 500 },
    { label: "Nydegger", value: 486 },
    { label: "Grofman", value: 482 },
    { label: "Shubik", value: 481 },
    { label: "Stein-Rapoport", value: 478 },
    { label: "Friedman (grim trigger)", value: 473 },
    { label: "Davis", value: 472 },
    { label: "Downing", value: 397 },
    { label: "Always Defect", value: 225 },
  ],
  highlightIndex: 0,
  source: "Axelrod, The Evolution of Cooperation (1984)",
  durationSec: 12,
};

// Small-multiples DataChart sample — Olympic medal rankings by Games,
// four panels (Helsinki '52 / Tokyo '64 / Munich '72 / Moscow '80) showing
// the same five-country comparison. Shared value scale lets the eye read
// "compared to what?" across panels. Right form when a multi-line chart
// would be spaghetti.
// See: references/template-research/data-chart.md § 6.5
const chartOlympicsSmallMultiples: DataChartData = {
  episode: CATALOG_EPISODE,
  title: "Cold War Olympics, Four Games",
  subtitle: "Total medals per country — shared value scale across panels",
  variant: "small-multiples",
  unit: "",
  panels: [
    {
      title: "Helsinki '52",
      dataPoints: [
        { label: "USSR", value: 71, color: "#C23B22" },
        { label: "US", value: 76, color: "#3266AD" },
        { label: "Hungary", value: 42 },
        { label: "Sweden", value: 35 },
        { label: "Italy", value: 21 },
      ],
    },
    {
      title: "Tokyo '64",
      dataPoints: [
        { label: "USSR", value: 96, color: "#C23B22" },
        { label: "US", value: 90, color: "#3266AD" },
        { label: "Hungary", value: 22 },
        { label: "Sweden", value: 8 },
        { label: "Italy", value: 27 },
      ],
    },
    {
      title: "Munich '72",
      dataPoints: [
        { label: "USSR", value: 99, color: "#C23B22" },
        { label: "US", value: 94, color: "#3266AD" },
        { label: "E. Germany", value: 66 },
        { label: "W. Germany", value: 40 },
        { label: "Hungary", value: 35 },
      ],
    },
    {
      title: "Moscow '80",
      subtitle: "US boycott",
      dataPoints: [
        { label: "USSR", value: 195, color: "#C23B22" },
        { label: "E. Germany", value: 126 },
        { label: "Bulgaria", value: 41 },
        { label: "Cuba", value: 20 },
        { label: "Italy", value: 15 },
      ],
    },
  ],
  source: "International Olympic Committee",
  durationSec: 11,
};

// ─── TimeSeriesChart × 2 ──────────────────────────────────────────────────

// Simplified: dropped the heroStat (which collided with the top-right annotation)
// and removed one annotation so the remaining one has room to breathe. The
// chart now reads as a single accelerating curve with one clear era boundary.
const tsCarbonDioxide: TimeSeriesChartData = {
  episode: CATALOG_EPISODE,
  title: "Atmospheric CO₂, 1850–2024",
  subtitle: "Concentration in parts per million",
  lines: [
    {
      label: "CO₂ (ppm)",
      color: "#C23B22",
      areaFill: true,
      points: [
        { x: 1850, y: 285 }, { x: 1900, y: 296 }, { x: 1950, y: 311 },
        { x: 1970, y: 325 }, { x: 1990, y: 354 }, { x: 2000, y: 369 },
        { x: 2010, y: 389 }, { x: 2020, y: 414 }, { x: 2024, y: 421 },
      ],
    },
  ],
  annotations: [
    { x: 2013, label: "Crosses 400 ppm" },
  ],
  eras: [
    { from: 1945, to: 2024, label: "The great acceleration", color: "#C23B22", opacity: 0.1 },
  ],
  referenceLines: [{ y: 280, label: "Pre-industrial baseline", dashed: true, color: "#5DAA68" }],
  xLabel: "Year",
  yUnit: " ppm",
  source: "NOAA, ice core records",
  durationSec: 12,
};

// Slope-chart sample — ranking change between two moments. Life expectancy
// at birth, 1900 vs 2020, four illustrative countries. Lines that diverge
// upward show developmental progress; crossings would indicate ranking
// inversions. The editorial point IS the change between the two anchors,
// nothing in between.
// See: references/template-research/time-series-chart.md § 6.2
const tsLifeExpectancySlope: TimeSeriesChartData = {
  episode: CATALOG_EPISODE,
  title: "Japan Overtook the West",
  subtitle: "Life expectancy at birth — 1900 vs 2020",
  variant: "slope",
  xLabel: "1900 → 2020",
  yUnit: " yrs",
  lines: [
    // Japan: war-devastated, behind Europe in 1900 → world leader by 2020.
    // The crossing is the editorial argument.
    {
      label: "Japan", color: "#C23B22", hero: true,
      points: [{ x: 1900, y: 44 }, { x: 2020, y: 84 }],
    },
    // United States: started highest, fell to third — the stagnation story.
    {
      label: "United States", color: "#3266AD",
      points: [{ x: 1900, y: 47 }, { x: 2020, y: 77 }],
    },
    // France: European peer, clear mid-position in 2020 (83) — distinct from Japan.
    {
      label: "France", color: "#E5A544",
      points: [{ x: 1900, y: 45 }, { x: 2020, y: 83 }],
    },
    // India: the dramatic catch-up from abject poverty, still trailing.
    {
      label: "India", color: "#5DAA68",
      points: [{ x: 1900, y: 24 }, { x: 2020, y: 70 }],
    },
  ],
  source: "Our World in Data",
  durationSec: 10,
};

// Small-multiples demo — same population data as `tsPopulation`, rendered
// as four side-by-side panels with a shared y-axis. Right form when the
// editorial point is "compare these trajectories without spaghetti."
// See: references/template-research/time-series-chart.md § 6.3
const tsPopulationSmallMultiples: TimeSeriesChartData = {
  episode: CATALOG_EPISODE,
  title: "Four Trajectories, One Century",
  subtitle: "Population (millions) — same y-axis across all panels",
  variant: "small-multiples",
  lines: [
    {
      label: "Asia", color: "#C23B22", hero: true,
      points: [{ x: 1900, y: 947 }, { x: 1950, y: 1404 }, { x: 2000, y: 3741 }, { x: 2024, y: 4721 }],
    },
    {
      label: "Africa", color: "#E5A544",
      points: [{ x: 1900, y: 133 }, { x: 1950, y: 228 }, { x: 2000, y: 819 }, { x: 2024, y: 1485 }],
    },
    {
      label: "Europe", color: "#3266AD",
      points: [{ x: 1900, y: 408 }, { x: 1950, y: 549 }, { x: 2000, y: 728 }, { x: 2024, y: 743 }],
    },
    {
      label: "Americas", color: "#5DAA68",
      points: [{ x: 1900, y: 156 }, { x: 1950, y: 339 }, { x: 2000, y: 836 }, { x: 2024, y: 1037 }],
    },
  ],
  xLabel: "Year",
  yUnit: " M",
  source: "UN Population Division",
  durationSec: 10,
};

const tsPopulation: TimeSeriesChartData = {
  episode: CATALOG_EPISODE,
  title: "World Population by Region",
  subtitle: "Five regions diverge across the 20th century",
  lines: [
    {
      label: "Asia", color: "#C23B22", hero: true,
      points: [{ x: 1900, y: 947 }, { x: 1950, y: 1404 }, { x: 2000, y: 3741 }, { x: 2024, y: 4721 }],
    },
    {
      label: "Africa", color: "#E5A544",
      points: [{ x: 1900, y: 133 }, { x: 1950, y: 228 }, { x: 2000, y: 819 }, { x: 2024, y: 1485 }],
    },
    {
      label: "Europe", color: "#3266AD",
      points: [{ x: 1900, y: 408 }, { x: 1950, y: 549 }, { x: 2000, y: 728 }, { x: 2024, y: 743 }],
    },
    {
      label: "Americas", color: "#5DAA68",
      points: [{ x: 1900, y: 156 }, { x: 1950, y: 339 }, { x: 2000, y: 836 }, { x: 2024, y: 1037 }],
    },
  ],
  xLabel: "Year",
  yUnit: " M",
  source: "UN Population Division",
  durationSec: 10,
};

// ─── ProbabilityGauge — gauge + scorecard ─────────────────────────────────

const gaugeWeather: ProbabilityGaugeData = {
  episode: CATALOG_EPISODE,
  title: "Will It Rain Tomorrow?",
  subtitle: "Three estimates compared",
  variant: "strip",
  gauges: [
    { label: "NWS", value: 65, marketSource: "Official" },
    { label: "ECMWF", value: 72, color: "#3266AD", marketSource: "Model" },
    { label: "Crowdsourced", value: 58, color: "#E5A544", marketSource: "Manifold" },
  ],
  source: "Hypothetical demonstration",
  durationSec: 8,
};

const gaugeScorecard: ProbabilityGaugeData = {
  episode: CATALOG_EPISODE,
  title: "Forecaster Calibration — A Track Record",
  subtitle: "How a hypothetical analyst's predictions resolved",
  variant: "scorecard",
  scorecard: [
    { prediction: "S&P 500 above 5,000 by EOY", yourEstimate: 70, marketPrice: 65, outcome: "correct" },
    { prediction: "Sub-3-hour marathon record falls", yourEstimate: 35, marketPrice: 40, outcome: "wrong" },
    { prediction: "Halley's Comet visible by Dec", yourEstimate: 5, outcome: "correct" },
    { prediction: "Volcano X erupts within 12 mo", yourEstimate: 25, marketPrice: 18, outcome: "pending" },
  ],
  source: "Demonstration scorecard",
  durationSec: 10,
};

// ─── BayesianUpdate × 1 ───────────────────────────────────────────────────

const bayesVenice: BayesianUpdateData = {
  episode: CATALOG_EPISODE,
  title: "Will Venice Be Routinely Inundated by 2050?",
  subtitle: "Belief updated with each new piece of evidence",
  variant: "single",
  prior: 50,
  question: "P(St. Mark's Square floods 60+ days/year by 2050)",
  evidence: [
    { label: "MOSE barriers operational since 2020", direction: "down", magnitude: 3, source: "Italian Ministry of Infrastructure" },
    { label: "Sea level rise tracking high IPCC scenario", direction: "up", magnitude: 4, source: "IPCC AR6" },
    { label: "Subsidence rate revised upward", direction: "up", magnitude: 2 },
    { label: "Aquifer extraction now banned", direction: "down", magnitude: 1 },
  ],
  source: "Illustrative reasoning chain",
  durationSec: 12,
};

// ─── RadarChart × 1 ───────────────────────────────────────────────────────

const radarAthletes: RadarChartData = {
  episode: CATALOG_EPISODE,
  title: "Three Track Specialists Compared",
  subtitle: "Six attributes, normalized to peer percentile",
  axes: [
    { label: "Speed" },
    { label: "Endurance" },
    { label: "Power" },
    { label: "Technique" },
    { label: "Recovery" },
    { label: "Versatility" },
  ],
  subjects: [
    { name: "Sprinter", values: [98, 30, 92, 75, 45, 35], color: "#C23B22", fillOpacity: 0.15 },
    { name: "Marathoner", values: [55, 99, 50, 60, 90, 50], color: "#3266AD", fillOpacity: 0.15 },
    { name: "Decathlete", values: [82, 75, 85, 92, 70, 95], color: "#E5A544", fillOpacity: 0.15 },
  ],
  source: "Composite of literature norms",
  durationSec: 11,
};

// ─── SankeyFlow × 1 ───────────────────────────────────────────────────────

// Three-column cascade: total → use/discard → fate of the discarded.
// Single dominant flow (4,400 Mt to landfill) makes the editorial point land
// on first read. Numbers from Geyer, Jambeck & Law, "Production, use, and
// fate of all plastics ever made," Science Advances (2017).
const sankeyEnergy: SankeyFlowData = {
  episode: CATALOG_EPISODE,
  title: "All the Plastic Ever Made",
  subtitle: "Where 8.3 billion tons ended up, 1950–2017",
  nodes: [
    { id: "produced", label: "Plastic produced", value: 8300, column: 0, color: "#6B1D1D" },

    { id: "in-use", label: "Still in use", value: 2500, column: 1, color: "#5DAA68" },
    { id: "discarded", label: "Discarded", value: 5800, column: 1, color: "#888780" },

    { id: "recycled", label: "Recycled", value: 600, column: 2, color: "#5DAA68" },
    { id: "incinerated", label: "Incinerated", value: 800, column: 2, color: "#E5A544" },
    { id: "landfill", label: "Landfill or environment", value: 4400, column: 2, color: "#1C1814" },
  ],
  links: [
    { from: "produced", to: "in-use", value: 2500 },
    { from: "produced", to: "discarded", value: 5800 },
    { from: "discarded", to: "recycled", value: 600 },
    { from: "discarded", to: "incinerated", value: 800 },
    { from: "discarded", to: "landfill", value: 4400 },
  ],
  valueSuffix: " Mt",
  columnHeaders: ["Produced", "Use vs. Discarded", "Fate"],
  sourceTotal: {
    value: "8.3K Mt",
    context: "global plastic produced, 1950–2017",
  },
  source: "Geyer, Jambeck & Law (2017), Science Advances",
  durationSec: 11,
};

// ─── Composition registrations ────────────────────────────────────────────

const statRevealComp = (id: string, data: StatRevealData) => (
  <Composition
    id={id}
    component={StatReveal}
    schema={StatRevealSchema}
    calculateMetadata={({ props }) => ({
      durationInFrames: sec((props.data as StatRevealData).durationSec || 9),
      fps: layout.fps,
      width: layout.width,
      height: layout.height,
    })}
    defaultProps={{ data }}
  />
);

export const CatalogStatApollo = () => statRevealComp(catalogId("StatReveal", "apollo-cost"), statApollo);
export const CatalogStatMariana = () => statRevealComp(catalogId("StatReveal", "mariana-depth"), statMariana);
export const CatalogStatHabitable = () => statRevealComp(catalogId("StatReveal", "habitable-land"), statHabitable);

const dataChartComp = (id: string, data: DataChartData) => (
  <Composition
    id={id}
    component={DataChart}
    schema={DataChartSchema}
    calculateMetadata={({ props }) => ({
      durationInFrames: sec((props.data as DataChartData).durationSec || 8),
      fps: layout.fps,
      width: layout.width,
      height: layout.height,
    })}
    defaultProps={{ data }}
  />
);

export const CatalogChartMountains = () => dataChartComp(catalogId("DataChart", "speeds-bar"), chartMountains);
export const CatalogChartSpaceRace = () => dataChartComp(catalogId("DataChart", "space-race-comparison"), chartSpaceRace);
export const CatalogChartAxelrodLollipop = () => dataChartComp(catalogId("DataChart", "axelrod-lollipop"), chartAxelrodRankings);
export const CatalogChartOlympicsSmallMultiples = () => dataChartComp(catalogId("DataChart", "olympics-small-multiples"), chartOlympicsSmallMultiples);

const tsComp = (id: string, data: TimeSeriesChartData) => (
  <Composition
    id={id}
    component={TimeSeriesChart}
    schema={TimeSeriesChartSchema}
    calculateMetadata={({ props }) => ({
      durationInFrames: sec((props.data as TimeSeriesChartData).durationSec || 10),
      fps: layout.fps,
      width: layout.width,
      height: layout.height,
    })}
    defaultProps={{ data }}
  />
);

export const CatalogTsCO2 = () => tsComp(catalogId("TimeSeriesChart", "atmospheric-co2"), tsCarbonDioxide);
export const CatalogTsPopulation = () => tsComp(catalogId("TimeSeriesChart", "world-population"), tsPopulation);
export const CatalogTsLifeExpectancySlope = () => tsComp(catalogId("TimeSeriesChart", "life-expectancy-slope"), tsLifeExpectancySlope);
export const CatalogTsPopulationSmallMultiples = () => tsComp(catalogId("TimeSeriesChart", "population-small-multiples"), tsPopulationSmallMultiples);

const gaugeComp = (id: string, data: ProbabilityGaugeData) => (
  <Composition
    id={id}
    component={ProbabilityGauge}
    schema={ProbabilityGaugeSchema}
    calculateMetadata={({ props }) => ({
      durationInFrames: sec((props.data as ProbabilityGaugeData).durationSec || 8),
      fps: layout.fps,
      width: layout.width,
      height: layout.height,
    })}
    defaultProps={{ data }}
  />
);

export const CatalogGaugeWeather = () => gaugeComp(catalogId("ProbabilityGauge", "weather"), gaugeWeather);
export const CatalogGaugeScorecard = () => gaugeComp(catalogId("ProbabilityGauge", "scorecard"), gaugeScorecard);

export const CatalogBayesVenice = () => (
  <Composition
    id={catalogId("BayesianUpdate", "venice-floods")}
    component={BayesianUpdate}
    schema={BayesianUpdateSchema}
    calculateMetadata={({ props }) => ({
      durationInFrames: sec((props.data as BayesianUpdateData).durationSec || 12),
      fps: layout.fps,
      width: layout.width,
      height: layout.height,
    })}
    defaultProps={{ data: bayesVenice }}
  />
);

export const CatalogRadarAthletes = () => (
  <Composition
    id={catalogId("RadarChart", "track-specialists")}
    component={RadarChart}
    schema={RadarChartSchema}
    calculateMetadata={({ props }) => ({
      durationInFrames: sec((props.data as RadarChartData).durationSec || 11),
      fps: layout.fps,
      width: layout.width,
      height: layout.height,
    })}
    defaultProps={{ data: radarAthletes }}
  />
);

export const CatalogSankeyEnergy = () => (
  <Composition
    id={catalogId("SankeyFlow", "plastic-fate")}
    component={SankeyFlow}
    schema={SankeyFlowSchema}
    calculateMetadata={({ props }) => ({
      durationInFrames: sec((props.data as SankeyFlowData).durationSec || 11),
      fps: layout.fps,
      width: layout.width,
      height: layout.height,
    })}
    defaultProps={{ data: sankeyEnergy }}
  />
);

// ─── PricingWaterfall × 1 ─────────────────────────────────────────────────
//
// Coffee bean's journey — the canonical value-capture demo. Replaces the
// NetworkDiagram horizontal-chain version (deprecated May 10, 2026), which
// could show the journey but couldn't carry the "3% to the farmer"
// editorial point as a chart instead of a corner pull-quote.

const waterfallCoffee: PricingWaterfallData = {
  episode: CATALOG_EPISODE,
  title: "Where Your $5 Cup Goes",
  subtitle: "The coffee bean's journey from Yirgacheffe to Williamsburg",
  total: {
    value: "$5",
    label: "specialty coffee, retail",
  },
  stages: [
    { label: "Farm", share: 3, descriptor: "Yirgacheffe, Ethiopia", hero: true },
    { label: "Cooperative", share: 5, descriptor: "Wash & dry" },
    { label: "Exporter", share: 8, descriptor: "Addis Ababa" },
    { label: "Importer", share: 14, descriptor: "Hamburg" },
    { label: "Roaster", share: 25, descriptor: "Brooklyn" },
    { label: "Café", share: 45, descriptor: "Williamsburg" },
  ],
  source: "Specialty Coffee Association reports; representative figures",
  durationSec: 10,
};

export const CatalogWaterfallCoffee = () => (
  <Composition
    id={catalogId("PricingWaterfall", "coffee-cup")}
    component={PricingWaterfall}
    schema={PricingWaterfallSchema}
    calculateMetadata={({ props }) => ({
      durationInFrames: sec((props.data as PricingWaterfallData).durationSec || 10),
      fps: layout.fps,
      width: layout.width,
      height: layout.height,
    })}
    defaultProps={{ data: waterfallCoffee }}
  />
);

// ─── Motion Identity comparison — same content, 3 substrate-motion presets
// Scrub each in Studio to evaluate the substrate-motion theory in motion
// (the effect doesn't read in stills — film grain and atmospheric drift
// are felt at the edge of attention, not consciously noticed).

export const CatalogWaterfallMotionStill = () => (
  <Composition
    id={catalogId("PricingWaterfall", "motion-still")}
    component={PricingWaterfall}
    schema={PricingWaterfallSchema}
    calculateMetadata={({ props }) => ({
      durationInFrames: sec((props.data as PricingWaterfallData).durationSec || 10),
      fps: layout.fps,
      width: layout.width,
      height: layout.height,
    })}
    defaultProps={{ data: { ...waterfallCoffee, motionIdentity: "still" as const } }}
  />
);

export const CatalogWaterfallMotionBriefing = () => (
  <Composition
    id={catalogId("PricingWaterfall", "motion-briefing")}
    component={PricingWaterfall}
    schema={PricingWaterfallSchema}
    calculateMetadata={({ props }) => ({
      durationInFrames: sec((props.data as PricingWaterfallData).durationSec || 10),
      fps: layout.fps,
      width: layout.width,
      height: layout.height,
    })}
    defaultProps={{ data: { ...waterfallCoffee, motionIdentity: "briefing" as const } }}
  />
);

export const CatalogWaterfallMotionDocumentary = () => (
  <Composition
    id={catalogId("PricingWaterfall", "motion-documentary")}
    component={PricingWaterfall}
    schema={PricingWaterfallSchema}
    calculateMetadata={({ props }) => ({
      durationInFrames: sec((props.data as PricingWaterfallData).durationSec || 10),
      fps: layout.fps,
      width: layout.width,
      height: layout.height,
    })}
    defaultProps={{ data: { ...waterfallCoffee, motionIdentity: "documentary" as const } }}
  />
);

// ─── BumpChart — GDP power-transition demo ───────────────────────────────

export const CatalogBumpGDP = () => (
  <Composition
    id={catalogId("BumpChart", "gdp-power-transition")}
    component={BumpChart}
    schema={BumpChartSchema}
    calculateMetadata={({ props }) => ({
      durationInFrames: sec((props.data as BumpChartData).durationSec ?? 14),
      fps: layout.fps,
      width: layout.width,
      height: layout.height,
    })}
    defaultProps={{ data: bumpGdpData as BumpChartData }}
  />
);

// ─── PopulationPyramid — China 1990 vs 2025 ─────────────────────────────────

export const CatalogPyramidChina = () => (
  <Composition
    id={catalogId("PopulationPyramid", "china-morph")}
    component={PopulationPyramid}
    schema={PopulationPyramidSchema}
    calculateMetadata={({ props }) => ({
      durationInFrames: sec((props.data as PopulationPyramidData).durationSec ?? 14),
      fps: layout.fps,
      width: layout.width,
      height: layout.height,
    })}
    defaultProps={{ data: pyramidChinaData as PopulationPyramidData }}
  />
);

// ─── RankChangeDotPlot — semiconductor foundry rankings after export controls

export const CatalogRankChangeSemiconductors = () => (
  <Composition
    id={catalogId("RankChangeDotPlot", "semiconductors")}
    component={RankChangeDotPlot}
    schema={RankChangeDotPlotSchema}
    calculateMetadata={({ props }) => ({
      durationInFrames: sec((props.data as RankChangeDotPlotData).durationSec ?? 11),
      fps: layout.fps,
      width: layout.width,
      height: layout.height,
    })}
    defaultProps={{ data: rankChangeSemiconductors as RankChangeDotPlotData }}
  />
);

// ─── IsotypeChart — TSMC leading-edge chip share ──────────────────────────

export const CatalogIsotypeChips = () => (
  <Composition
    id={catalogId("IsotypeChart", "tsmc-chip-share")}
    component={IsotypeChart}
    schema={IsotypeChartSchema}
    calculateMetadata={({ props }) => ({
      durationInFrames: sec((props.data as IsotypeChartData).durationSec ?? 10),
      fps: layout.fps,
      width: layout.width,
      height: layout.height,
    })}
    defaultProps={{ data: isotypeChipsData as IsotypeChartData }}
  />
);

// ─── BeeswarmChart × 1 — military-spending distribution ───────────────────

const beeswarmMilitarySpending: BeeswarmData = {
  episode: CATALOG_EPISODE,
  title: "Military Spending as % of GDP, 2024",
  subtitle: "Most NATO members fall under 2%; a handful run hot",
  items: [
    { label: "Iceland", value: 0.0 },
    { label: "Luxembourg", value: 1.3 },
    { label: "Spain", value: 1.3 },
    { label: "Belgium", value: 1.3 },
    { label: "Canada", value: 1.4 },
    { label: "Slovenia", value: 1.3 },
    { label: "Italy", value: 1.5 },
    { label: "Portugal", value: 1.5 },
    { label: "Türkiye", value: 1.5 },
    { label: "Croatia", value: 1.8 },
    { label: "Netherlands", value: 2.1 },
    { label: "Norway", value: 2.2 },
    { label: "Germany", value: 2.1 },
    { label: "France", value: 2.1 },
    { label: "Albania", value: 2.0 },
    { label: "Czechia", value: 2.1 },
    { label: "Slovakia", value: 2.0 },
    { label: "Bulgaria", value: 2.2 },
    { label: "Romania", value: 2.3 },
    { label: "Hungary", value: 2.1 },
    { label: "Denmark", value: 2.4 },
    { label: "Montenegro", value: 2.0 },
    { label: "UK", value: 2.3 },
    { label: "Finland", value: 2.4 },
    { label: "Lithuania", value: 2.9 },
    { label: "Estonia", value: 3.4 },
    { label: "Greece", value: 3.1 },
    { label: "Latvia", value: 3.2 },
    { label: "USA", value: 3.4, highlight: true },
    { label: "Poland", value: 4.1, highlight: true },
    { label: "Israel", value: 5.2, highlight: true },
    { label: "Russia", value: 5.9, highlight: true },
    { label: "Saudi Arabia", value: 7.1, highlight: true },
  ],
  axisLabel: "% of GDP",
  unit: "%",
  valueFormat: "percent",
  referenceLine: { value: 2.0, label: "NATO target: 2.0%" },
  source: "SIPRI Military Expenditure Database, 2024",
  durationSec: 12,
};

export const CatalogBeeswarmMilitary = () => (
  <Composition
    id={catalogId("BeeswarmChart", "military-spending")}
    component={BeeswarmChart}
    schema={BeeswarmChartSchema}
    calculateMetadata={({ props }) => ({
      durationInFrames: sec((props.data as BeeswarmData).durationSec ?? 12),
      fps: layout.fps,
      width: layout.width,
      height: layout.height,
    })}
    defaultProps={{ data: beeswarmMilitarySpending as BeeswarmData }}
  />
);

// ─── CalendarHeatmap × 1 — Israel/Iran 2024 escalation calendar ───────────

const buildCalendarIsraelIranDays = (): CalendarDay[] => {
  type Cluster = { month: number; entries: [number, number][] };
  const clusters: Cluster[] = [
    { month: 1, entries: [[2, 3], [3, 2], [8, 2], [14, 1], [22, 3], [25, 2]] },
    { month: 2, entries: [[4, 1], [9, 2], [14, 1], [26, 2]] },
    { month: 3, entries: [[5, 1], [11, 2], [18, 2], [27, 3], [29, 2]] },
    { month: 4, entries: [[1, 5], [2, 3], [3, 2], [9, 2], [12, 3], [13, 5], [14, 4], [19, 3]] },
    { month: 5, entries: [[6, 1], [10, 2], [17, 1], [24, 2]] },
    { month: 6, entries: [[3, 2], [11, 3], [18, 2], [25, 2]] },
    { month: 7, entries: [[2, 2], [9, 1], [13, 2], [16, 2], [22, 3], [27, 3], [30, 4], [31, 5]] },
    { month: 8, entries: [[1, 4], [2, 3], [4, 2], [11, 2], [16, 3], [21, 2], [25, 4], [27, 2], [30, 2]] },
    { month: 9, entries: [[4, 2], [10, 2], [17, 4], [18, 4], [20, 3], [23, 3], [27, 4]] },
    { month: 10, entries: [[1, 5], [2, 4], [3, 3], [6, 2], [10, 3], [16, 4], [17, 2], [22, 3], [26, 4], [27, 3], [29, 2], [31, 2]] },
    { month: 11, entries: [[5, 2], [11, 2], [18, 1], [25, 2]] },
    { month: 12, entries: [[3, 1], [9, 1], [16, 2], [24, 1]] },
  ];
  const days: CalendarDay[] = [];
  for (const c of clusters) {
    for (const [d, v] of c.entries) {
      const iso = `2024-${String(c.month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      days.push({ date: iso, value: v });
    }
  }
  return days;
};

const calendarHeatmapIsraelIran: CalendarHeatmapData = {
  episode: CATALOG_EPISODE,
  title: "Israel–Iran Proxy Escalation, 2024",
  subtitle: "A year of tit-for-tat — the days when something happened",
  year: 2024,
  days: buildCalendarIsraelIranDays(),
  colorScale: "intensity",
  maxValue: 5,
  valueLabel: "Daily escalation events",
  legendLabels: { low: "Quiet", high: "Peak" },
  weekStart: "sunday",
  highlights: [
    { date: "2024-04-13", label: "Iran's first direct strike" },
    { date: "2024-07-31", label: "Haniyeh assassinated" },
    { date: "2024-10-01", label: "Iran's missile barrage" },
  ],
  source: "Open-source incident tracking; illustrative only",
  durationSec: 14,
};

export const CatalogCalendarIsraelIran = () => (
  <Composition
    id={catalogId("CalendarHeatmap", "israel-iran-2024")}
    component={CalendarHeatmap}
    schema={CalendarHeatmapSchema}
    calculateMetadata={({ props }) => ({
      durationInFrames: sec((props.data as CalendarHeatmapData).durationSec ?? 14),
      fps: layout.fps,
      width: layout.width,
      height: layout.height,
    })}
    defaultProps={{ data: calendarHeatmapIsraelIran as CalendarHeatmapData }}
  />
);

// ─── CalendarHeatmap × 2 — Fed funds rate changes, 2024 (DIVERGING) ───────
//
// Exercises the symmetric diverging legend: most days held (value 0,
// faint placeholders), FOMC meeting days show ±25 or ±50 bp moves. Tests
// that the legend spans −maxAbs → 0 → +maxAbs with the neutral anchor
// rendered as bg.base in the middle of the ramp.

const calendarFedRates2024: CalendarHeatmapData = {
  episode: CATALOG_EPISODE,
  title: "Fed-funds Rate Changes, 2024",
  subtitle: "FOMC meeting days only — most of the year was hold",
  year: 2024,
  // Illustrative aggregation of FOMC meeting outcomes — sign + magnitude
  // chosen to exercise both halves of the diverging ramp at ±25 and ±50.
  days: [
    { date: "2024-01-31", value: 0 },   // hold
    { date: "2024-03-20", value: 0 },   // hold
    { date: "2024-05-01", value: 0 },   // hold
    { date: "2024-06-12", value: 0 },   // hold
    { date: "2024-07-31", value: 0 },   // hold
    { date: "2024-09-18", value: -0.5 }, // 50 bp cut
    { date: "2024-11-07", value: -0.25 }, // 25 bp cut
    { date: "2024-12-18", value: -0.25 }, // 25 bp cut
    // Hypothetical hike days exercise the positive half of the ramp.
    { date: "2024-02-14", value: 0.25 },
    { date: "2024-04-17", value: 0.5 },
    { date: "2024-08-21", value: 0.25 },
    { date: "2024-10-30", value: -0.5 },
  ],
  colorScale: "diverging",
  maxValue: 0.5,
  valueLabel: "Daily Fed-funds rate change (bp)",
  legendLabels: { low: "Cut", high: "Hike", zero: "Hold" },
  weekStart: "sunday",
  highlights: [
    { date: "2024-09-18", label: "First cut of the cycle" },
    { date: "2024-12-18", label: "Year-end cut" },
  ],
  source: "FOMC meeting records; illustrative aggregation",
  durationSec: 14,
};

export const CatalogCalendarFedRates = () => (
  <Composition
    id={catalogId("CalendarHeatmap", "fed-rates-2024")}
    component={CalendarHeatmap}
    schema={CalendarHeatmapSchema}
    calculateMetadata={({ props }) => ({
      durationInFrames: sec((props.data as CalendarHeatmapData).durationSec ?? 14),
      fps: layout.fps,
      width: layout.width,
      height: layout.height,
    })}
    defaultProps={{ data: calendarFedRates2024 as CalendarHeatmapData }}
  />
);

// ─── ConnectedScatterplot × 1 — Phillips curve trajectory ─────────────────

const scatterPhillipsCurve: ConnectedScatterplotData = {
  episode: CATALOG_EPISODE,
  title: "The Phillips Curve, Then and Now",
  subtitle: "US inflation vs unemployment — fifty years of broken promises",
  points: [
    { year: 1973, x: 4.9, y: 6.2 },
    { year: 1975, x: 8.5, y: 9.1, highlight: true, label: "stagflation" },
    { year: 1980, x: 7.1, y: 13.5, highlight: true, label: "Volcker shock" },
    { year: 1982, x: 9.7, y: 6.1 },
    { year: 1985, x: 7.2, y: 3.5 },
    { year: 1990, x: 5.6, y: 5.4 },
    { year: 1995, x: 5.6, y: 2.8 },
    { year: 2000, x: 4.0, y: 3.4 },
    { year: 2005, x: 5.1, y: 3.4 },
    { year: 2008, x: 5.8, y: 3.8 },
    { year: 2010, x: 9.6, y: 1.6 },
    { year: 2015, x: 5.3, y: 0.1 },
    { year: 2019, x: 3.7, y: 1.8 },
    { year: 2020, x: 8.1, y: 1.2, highlight: true, label: "pandemic" },
    { year: 2021, x: 5.4, y: 4.7 },
    { year: 2022, x: 3.6, y: 8.0, highlight: true, label: "post-pandemic inflation" },
    { year: 2023, x: 3.6, y: 4.1 },
    { year: 2024, x: 4.0, y: 2.9 },
  ],
  xAxisLabel: "Unemployment (% of labor force)",
  yAxisLabel: "Inflation (CPI YoY %)",
  xUnit: "%",
  yUnit: "%",
  source: "BLS, FRED",
  durationSec: 14,
};

export const CatalogScatterPhillips = () => (
  <Composition
    id={catalogId("ConnectedScatterplot", "phillips-curve")}
    component={ConnectedScatterplot}
    schema={ConnectedScatterplotSchema}
    calculateMetadata={({ props }) => ({
      durationInFrames: sec((props.data as ConnectedScatterplotData).durationSec ?? 14),
      fps: layout.fps,
      width: layout.width,
      height: layout.height,
    })}
    defaultProps={{ data: scatterPhillipsCurve as ConnectedScatterplotData }}
  />
);

// ─── Streamgraph × 1 — US oil imports by source country ───────────────────

const STREAMGRAPH_OIL_BENCHMARKS: Array<{
  x: number; sa: number; ca: number; mx: number; vz: number; other: number;
}> = [
  { x: 1970, sa: 6,  ca: 30, mx: 4,  vz: 28, other: 32 },
  { x: 1980, sa: 22, ca: 17, mx: 17, vz: 10, other: 34 },
  { x: 1990, sa: 25, ca: 16, mx: 17, vz: 16, other: 26 },
  { x: 2000, sa: 18, ca: 19, mx: 17, vz: 14, other: 32 },
  { x: 2010, sa: 16, ca: 25, mx: 16, vz: 11, other: 32 },
  { x: 2020, sa: 7,  ca: 51, mx: 14, vz: 1,  other: 27 },
  { x: 2024, sa: 5,  ca: 55, mx: 16, vz: 1,  other: 23 },
];

function buildStreamgraphOilSeries(): StreamSeries[] {
  const points: Array<{
    x: number; sa: number; ca: number; mx: number; vz: number; other: number;
  }> = [];
  for (let i = 0; i < STREAMGRAPH_OIL_BENCHMARKS.length - 1; i++) {
    const a = STREAMGRAPH_OIL_BENCHMARKS[i];
    const b = STREAMGRAPH_OIL_BENCHMARKS[i + 1];
    points.push(a);
    points.push({
      x: Math.round((a.x + b.x) / 2),
      sa: (a.sa + b.sa) / 2,
      ca: (a.ca + b.ca) / 2,
      mx: (a.mx + b.mx) / 2,
      vz: (a.vz + b.vz) / 2,
      other: (a.other + b.other) / 2,
    });
  }
  points.push(STREAMGRAPH_OIL_BENCHMARKS[STREAMGRAPH_OIL_BENCHMARKS.length - 1]);
  const xs = points.map((p) => p.x);
  return [
    { id: "saudi", label: "Saudi Arabia", color: palette.rust, values: xs.map((x, i) => ({ x, value: points[i].sa })) },
    { id: "canada", label: "Canada", color: palette.amber, values: xs.map((x, i) => ({ x, value: points[i].ca })) },
    { id: "mexico", label: "Mexico", color: palette.bronze, values: xs.map((x, i) => ({ x, value: points[i].mx })) },
    { id: "venezuela", label: "Venezuela", color: palette.olive, values: xs.map((x, i) => ({ x, value: points[i].vz })) },
    { id: "other", label: "Other", color: palette.bone, values: xs.map((x, i) => ({ x, value: points[i].other })) },
  ];
}

const streamgraphUSOil: StreamgraphData = {
  episode: CATALOG_EPISODE,
  title: "Where America Gets Its Oil",
  subtitle: "Imports by source, 1970–2024 — the Saudi era yields to the neighbors",
  series: buildStreamgraphOilSeries(),
  xAxisLabel: "Year",
  offset: "silhouette",
  valueFormat: "percent",
  source: "EIA Monthly Energy Review",
  durationSec: 14,
};

export const CatalogStreamgraphOil = () => (
  <Composition
    id={catalogId("Streamgraph", "us-oil-imports")}
    component={Streamgraph}
    schema={StreamgraphSchema}
    calculateMetadata={({ props }) => ({
      durationInFrames: sec((props.data as StreamgraphData).durationSec ?? 14),
      fps: layout.fps,
      width: layout.width,
      height: layout.height,
    })}
    defaultProps={{ data: streamgraphUSOil as StreamgraphData }}
  />
);

// ─── Streamgraph × 2 — tanker flag-state composition, with aggregateOther ──
//
// 12 input series exercising the new `aggregateOther` rollup: the
// template auto-keeps the top 5 by total area and sums the rest into
// "Other flags". Illustrative directional shape (Panama/Liberia/Marshall
// Islands dominant; Greece/Hong Kong receding; China/India rising) cued
// from UNCTAD review-of-maritime-transport summaries.

const FLAG_STATE_YEARS = [
  2014, 2016, 2018, 2020, 2022, 2024,
] as const;

const FLAG_STATE_SERIES: Array<{
  id: string;
  label: string;
  color: string;
  // value at each FLAG_STATE_YEARS position
  values: number[];
}> = [
  { id: "panama",           label: "Panama",            color: palette.rust,    values: [18.0, 17.6, 17.2, 16.8, 16.5, 16.2] },
  { id: "liberia",          label: "Liberia",           color: palette.amber,   values: [12.4, 12.9, 13.5, 14.0, 14.6, 15.1] },
  { id: "marshall-islands", label: "Marshall Islands",  color: palette.bronze,  values: [11.2, 11.8, 12.3, 12.8, 13.2, 13.5] },
  { id: "hong-kong",        label: "Hong Kong, China",  color: palette.olive,   values: [ 9.4,  9.1,  8.8,  8.5,  8.2,  7.8] },
  { id: "singapore",        label: "Singapore",         color: palette.gold,    values: [ 6.5,  6.6,  6.7,  6.8,  6.9,  7.0] },
  { id: "malta",            label: "Malta",             color: palette.oxblood, values: [ 5.0,  5.1,  5.2,  5.3,  5.4,  5.5] },
  { id: "bahamas",          label: "Bahamas",           color: palette.amber,   values: [ 4.6,  4.3,  4.0,  3.7,  3.4,  3.1] },
  { id: "greece",           label: "Greece",            color: palette.bronze,  values: [ 4.2,  3.9,  3.6,  3.3,  3.0,  2.7] },
  { id: "china",            label: "China",             color: palette.rust,    values: [ 3.0,  3.3,  3.6,  3.9,  4.1,  4.3] },
  { id: "india",            label: "India",             color: palette.amber,   values: [ 1.4,  1.5,  1.6,  1.7,  1.8,  1.9] },
  { id: "italy",            label: "Italy",             color: palette.olive,   values: [ 2.0,  1.9,  1.8,  1.7,  1.6,  1.5] },
  { id: "rest-of-world",    label: "All Other",         color: palette.bone,    values: [22.3, 22.0, 21.7, 21.5, 21.3, 21.4] },
];

function buildStreamgraphFlagSeries(): StreamSeries[] {
  return FLAG_STATE_SERIES.map((s) => ({
    id: s.id,
    label: s.label,
    color: s.color,
    values: FLAG_STATE_YEARS.map((x, i) => ({ x, value: s.values[i] })),
  }));
}

const streamgraphCountryFlags2024: StreamgraphData = {
  episode: CATALOG_EPISODE,
  title: "Whose Flag Flies Over the Oil Tanker?",
  subtitle: "Global tanker fleet by registry, 2014–2024 — three flags of convenience hold the deck",
  series: buildStreamgraphFlagSeries(),
  xAxisLabel: "Year",
  offset: "silhouette",
  valueFormat: "percent",
  aggregateOther: {
    maxSeries: 6,
    otherLabel: "Other flags",
    otherColor: palette.bone,
  },
  source: "UNCTAD review of maritime transport; illustrative aggregation",
  durationSec: 14,
};

export const CatalogStreamgraphFlags = () => (
  <Composition
    id={catalogId("Streamgraph", "tanker-flags-2024")}
    component={Streamgraph}
    schema={StreamgraphSchema}
    calculateMetadata={({ props }) => ({
      durationInFrames: sec((props.data as StreamgraphData).durationSec ?? 14),
      fps: layout.fps,
      width: layout.width,
      height: layout.height,
    })}
    defaultProps={{ data: streamgraphCountryFlags2024 as StreamgraphData }}
  />
);

// ─── RidgelinePlot × 1 — life expectancy by continent ─────────────────────

const ridgelineLifeExpectancy: RidgelinePlotData = {
  episode: CATALOG_EPISODE,
  title: "Life Expectancy at Birth, by Continent",
  subtitle: "The Africa-Europe gap, in distributional shape",
  groups: [
    {
      id: "africa", label: "Africa", color: "rust",
      density: [
        { x: 50, y: 0.0077 }, { x: 53, y: 0.0166 }, { x: 56, y: 0.0297 },
        { x: 60, y: 0.0484 }, { x: 64, y: 0.057 }, { x: 68, y: 0.0484 },
        { x: 72, y: 0.0297 }, { x: 76, y: 0.0131 }, { x: 80, y: 0.0042 },
        { x: 83, y: 0.0014 }, { x: 86, y: 0.0004 }, { x: 88, y: 0.0002 },
      ],
    },
    {
      id: "asia", label: "Asia", color: "amber",
      density: [
        { x: 50, y: 0.0001 }, { x: 53, y: 0.0003 }, { x: 56, y: 0.0009 },
        { x: 60, y: 0.0028 }, { x: 64, y: 0.0098 }, { x: 68, y: 0.0323 },
        { x: 72, y: 0.0625 }, { x: 76, y: 0.0713 }, { x: 80, y: 0.048 },
        { x: 83, y: 0.0252 }, { x: 86, y: 0.0098 }, { x: 88, y: 0.0044 },
      ],
    },
    {
      id: "americas", label: "Americas", color: "olive",
      density: [
        { x: 50, y: 0.0001 }, { x: 53, y: 0.0002 }, { x: 56, y: 0.0004 },
        { x: 60, y: 0.0012 }, { x: 64, y: 0.0055 }, { x: 68, y: 0.0183 },
        { x: 72, y: 0.0597 }, { x: 76, y: 0.0887 }, { x: 80, y: 0.0597 },
        { x: 83, y: 0.0264 }, { x: 86, y: 0.0075 }, { x: 88, y: 0.0025 },
      ],
    },
    {
      id: "europe", label: "Europe", color: "bronze",
      density: [
        { x: 50, y: 0.0001 }, { x: 53, y: 0.0001 }, { x: 56, y: 0.0001 },
        { x: 60, y: 0.0002 }, { x: 64, y: 0.0005 }, { x: 68, y: 0.0021 },
        { x: 72, y: 0.0089 }, { x: 76, y: 0.0215 }, { x: 80, y: 0.1026 },
        { x: 83, y: 0.1187 }, { x: 86, y: 0.0571 }, { x: 88, y: 0.0215 },
      ],
    },
    {
      id: "oceania", label: "Oceania", color: "taupe",
      density: [
        { x: 50, y: 0.0001 }, { x: 53, y: 0.0001 }, { x: 56, y: 0.0002 },
        { x: 60, y: 0.0004 }, { x: 64, y: 0.0012 }, { x: 68, y: 0.0041 },
        { x: 72, y: 0.0135 }, { x: 76, y: 0.0605 }, { x: 80, y: 0.0997 },
        { x: 83, y: 0.0753 }, { x: 86, y: 0.0324 }, { x: 88, y: 0.0135 },
      ],
    },
  ],
  xAxisLabel: "Life expectancy at birth (years)",
  highlightIds: ["africa", "europe"],
  overlap: 0.45,
  source: "UN DESA, World Population Prospects 2024",
  durationSec: 12,
};

export const CatalogRidgelineLifeExpectancy = () => (
  <Composition
    id={catalogId("RidgelinePlot", "life-expectancy")}
    component={RidgelinePlot}
    schema={RidgelinePlotSchema}
    calculateMetadata={({ props }) => ({
      durationInFrames: sec((props.data as RidgelinePlotData).durationSec ?? 12),
      fps: layout.fps,
      width: layout.width,
      height: layout.height,
    })}
    defaultProps={{ data: ridgelineLifeExpectancy as RidgelinePlotData }}
  />
);

// ─── MarimekkoChart × 1 — G7 energy mix ───────────────────────────────────

const marimekkoG7Energy: MarimekkoChartData = {
  episode: CATALOG_EPISODE,
  title: "Energy Mix by G7 Economy",
  subtitle: "Width = share of G7 GDP; height = source composition within each economy",
  columns: [
    {
      id: "us", label: "United States", sublabel: "≈ 50% of G7 GDP", width: 50,
      segments: [
        { key: "fossil", label: "Fossil fuels", value: 80 },
        { key: "nuclear", label: "Nuclear", value: 8 },
        { key: "renewable", label: "Renewables", value: 12 },
      ],
    },
    {
      id: "germany", label: "Germany", sublabel: "≈ 10%", width: 10,
      segments: [
        { key: "fossil", label: "Fossil fuels", value: 55 },
        { key: "nuclear", label: "Nuclear", value: 5 },
        { key: "renewable", label: "Renewables", value: 40 },
      ],
    },
    {
      id: "japan", label: "Japan", sublabel: "≈ 10%", width: 10,
      segments: [
        { key: "fossil", label: "Fossil fuels", value: 78 },
        { key: "nuclear", label: "Nuclear", value: 6 },
        { key: "renewable", label: "Renewables", value: 16 },
      ],
    },
    {
      id: "uk", label: "United Kingdom", sublabel: "≈ 7%", width: 7,
      segments: [
        { key: "fossil", label: "Fossil fuels", value: 65 },
        { key: "nuclear", label: "Nuclear", value: 15 },
        { key: "renewable", label: "Renewables", value: 20 },
      ],
    },
    {
      id: "france", label: "France", sublabel: "≈ 7%", width: 7,
      segments: [
        { key: "fossil", label: "Fossil fuels", value: 50 },
        { key: "nuclear", label: "Nuclear", value: 35 },
        { key: "renewable", label: "Renewables", value: 15 },
      ],
    },
    {
      id: "italy", label: "Italy", sublabel: "≈ 5%", width: 5,
      segments: [
        { key: "fossil", label: "Fossil fuels", value: 75 },
        { key: "nuclear", label: "Nuclear", value: 0 },
        { key: "renewable", label: "Renewables", value: 25 },
      ],
    },
    {
      id: "canada", label: "Canada", sublabel: "≈ 11%", width: 11,
      segments: [
        { key: "fossil", label: "Fossil fuels", value: 60 },
        { key: "nuclear", label: "Nuclear", value: 14 },
        { key: "renewable", label: "Renewables", value: 26 },
      ],
    },
  ],
  widthMode: "percent",
  segmentColorMap: {
    fossil: palette.rust,
    nuclear: palette.gold,
    renewable: palette.olive,
  },
  source: "BP Statistical Review of World Energy 2024; IEA",
  durationSec: 14,
};

export const CatalogMarimekkoEnergy = () => (
  <Composition
    id={catalogId("MarimekkoChart", "g7-energy")}
    component={MarimekkoChart}
    schema={MarimekkoChartSchema}
    calculateMetadata={({ props }) => ({
      durationInFrames: sec((props.data as MarimekkoChartData).durationSec ?? 14),
      fps: layout.fps,
      width: layout.width,
      height: layout.height,
    })}
    defaultProps={{ data: marimekkoG7Energy as MarimekkoChartData }}
  />
);

// Emphasis variant — same G7 dataset, but the editorial point is now
// "fossil fuels' share of every G7 economy". Renewables and nuclear
// recede to muted siblings; fossil reads as a horizontal rust band at
// full saturation. Demonstrates the `emphasisKey` field documented in
// `references/template-research/marimekko-chart.md` § 6.
const marimekkoG7EnergyEmphasis: MarimekkoChartData = {
  ...marimekkoG7Energy,
  title: "Fossil Fuels Still Dominate G7 Energy",
  subtitle:
    "Width = share of G7 GDP; rust = fossil-fuel share across every economy",
  emphasisKey: "fossil",
};

export const CatalogMarimekkoEnergyEmphasis = () => (
  <Composition
    id={catalogId("MarimekkoChart", "g7-energy-emphasis")}
    component={MarimekkoChart}
    schema={MarimekkoChartSchema}
    calculateMetadata={({ props }) => ({
      durationInFrames: sec((props.data as MarimekkoChartData).durationSec ?? 14),
      fps: layout.fps,
      width: layout.width,
      height: layout.height,
    })}
    defaultProps={{ data: marimekkoG7EnergyEmphasis as MarimekkoChartData }}
  />
);

// ─── TernaryPlot × 1 — UN Security Council bloc alignment ─────────────────

const ternaryUNVotes: TernaryPlotData = {
  episode: CATALOG_EPISODE,
  title: "UN Security Council Vote Alignment, 2020–2024",
  subtitle: "Each resolution as a point — Washington, Beijing, Moscow",
  axisLabels: { a: "US bloc", b: "China bloc", c: "Russia bloc" },
  points: [
    { id: "ukraine-invasion", label: "Ukraine invasion", a: 80, b: 10, c: 10, highlight: true },
    { id: "taiwan-strait", label: "Taiwan strait stability", a: 70, b: 20, c: 10, highlight: true },
    { id: "myanmar-junta", a: 78, b: 12, c: 10 },
    { id: "venezuela-elections", a: 75, b: 13, c: 12 },
    { id: "belarus-rights", a: 82, b: 8, c: 10 },
    { id: "moldova-sovereignty", a: 76, b: 14, c: 10 },
    { id: "uyghur-rights", a: 74, b: 16, c: 10 },
    { id: "hong-kong-law", a: 72, b: 18, c: 10 },
    { id: "north-korea-launches", a: 68, b: 22, c: 10 },
    { id: "sanctions-russia", label: "Sanctions vote", a: 60, b: 15, c: 25, highlight: true },
    { id: "south-china-sea", a: 18, b: 70, c: 12 },
    { id: "taiwan-arms-block", a: 15, b: 75, c: 10 },
    { id: "huawei-procurement", a: 12, b: 78, c: 10 },
    { id: "bri-financing", a: 14, b: 74, c: 12 },
    { id: "wto-tech-rules", a: 20, b: 68, c: 12 },
    { id: "rcep-coordination", a: 22, b: 65, c: 13 },
    { id: "syria-mandate", a: 15, b: 20, c: 65 },
    { id: "wagner-cmma", a: 12, b: 18, c: 70 },
    { id: "crimea-status", a: 10, b: 15, c: 75 },
    { id: "central-asia-bases", a: 14, b: 22, c: 64 },
    { id: "donbass-monitor", a: 16, b: 19, c: 65 },
    { id: "iran-nuclear", label: "Iran nuclear deal", a: 50, b: 30, c: 20, highlight: true },
    { id: "climate-paris-followon", label: "Climate financing", a: 40, b: 40, c: 20, highlight: true },
    { id: "afghanistan-aid", a: 38, b: 35, c: 27 },
    { id: "sahel-peacekeeping", a: 42, b: 30, c: 28 },
    { id: "haiti-mission", a: 45, b: 32, c: 23 },
    { id: "sudan-rapid-support", a: 36, b: 38, c: 26 },
    { id: "yemen-ceasefire", a: 41, b: 34, c: 25 },
    { id: "pandemic-treaty", a: 44, b: 33, c: 23 },
    { id: "ai-governance", a: 47, b: 31, c: 22 },
  ],
  gridlines: true,
  centroid: true,
  source: "UN General Assembly voting records 2020–2024; illustrative aggregation",
  durationSec: 14,
};

export const CatalogTernaryUN = () => (
  <Composition
    id={catalogId("TernaryPlot", "un-votes")}
    component={TernaryPlot}
    schema={TernaryPlotSchema}
    calculateMetadata={({ props }) => ({
      durationInFrames: sec((props.data as TernaryPlotData).durationSec ?? 14),
      fps: layout.fps,
      width: layout.width,
      height: layout.height,
    })}
    defaultProps={{ data: ternaryUNVotes }}
  />
);

// ─── HorizonChart × 1 — BRICS+ currency volatility ────────────────────────

const buildHorizonSeries = (
  amplitude: number,
  phase: number,
  spike: number,
  spikeAt: number,
): HorizonDatum[] => {
  const points: HorizonDatum[] = [];
  for (let i = 0; i < 24; i++) {
    const t = i;
    const base =
      Math.sin((t / 24) * Math.PI * 2 + phase) * amplitude +
      Math.sin((t / 24) * Math.PI * 6 + phase * 1.3) * amplitude * 0.4 +
      ((i * 37) % 11 - 5) * 0.15;
    const v = i === spikeAt ? base + spike : base;
    points.push({ x: t, value: Number(v.toFixed(2)) });
  }
  return points;
};

const horizonBRICSFX: HorizonChartData = {
  episode: CATALOG_EPISODE,
  title: "BRICS+ Currency Volatility, 2024",
  subtitle: "Daily % change vs USD — sized to fit, layered to compare",
  series: [
    { id: "brl", label: "BRL", sublabel: "Brazil", values: buildHorizonSeries(2.2, 0.0, 3.5, 14) },
    { id: "rub", label: "RUB", sublabel: "Russia", values: buildHorizonSeries(5.0, 1.1, -7.0, 9) },
    { id: "inr", label: "INR", sublabel: "India", values: buildHorizonSeries(1.4, 0.6, 2.0, 18) },
    { id: "cny", label: "CNY", sublabel: "China", values: buildHorizonSeries(0.9, 0.3, 1.4, 5) },
    { id: "zar", label: "ZAR", sublabel: "South Africa", values: buildHorizonSeries(2.6, 2.2, -4.0, 16) },
    { id: "egp", label: "EGP", sublabel: "Egypt", values: buildHorizonSeries(2.0, 1.7, 5.5, 7) },
    { id: "irr", label: "IRR", sublabel: "Iran", values: buildHorizonSeries(4.8, 0.9, -6.5, 20) },
    { id: "aed", label: "AED", sublabel: "UAE", values: buildHorizonSeries(0.6, 2.0, 0.8, 11) },
  ],
  xAxisLabel: "2024 (twice-monthly)",
  valueFormat: "number",
  bands: 3,
  baseline: 0,
  source: "FX data illustrative; not a verified dataset",
  durationSec: 12,
};

export const CatalogHorizonBRICS = () => (
  <Composition
    id={catalogId("HorizonChart", "brics-fx")}
    component={HorizonChart}
    schema={HorizonChartSchema}
    calculateMetadata={({ props }) => ({
      durationInFrames: sec((props.data as HorizonChartData).durationSec ?? 12),
      fps: layout.fps,
      width: layout.width,
      height: layout.height,
    })}
    defaultProps={{ data: horizonBRICSFX as HorizonChartData }}
  />
);

// Same BRICS+ data but rendered with a SHARED band scale — so RUB and IRR
// (high-volatility regimes) visibly tower over CNY and AED (managed pegs).
// The per-series variant above flattens that magnitude gap by design;
// this variant exists to demo the alternative for absolute-magnitude
// stories. See HorizonChartData.scaleMode JSDoc.
const horizonBRICSShared: HorizonChartData = {
  ...horizonBRICSFX,
  title: "BRICS+ Currency Volatility — Shared Scale",
  subtitle:
    "Same data, shared band height — RUB and IRR dwarf the managed pegs",
  scaleMode: "shared",
};

export const CatalogHorizonBRICSShared = () => (
  <Composition
    id={catalogId("HorizonChart", "brics-fx-shared")}
    component={HorizonChart}
    schema={HorizonChartSchema}
    calculateMetadata={({ props }) => ({
      durationInFrames: sec((props.data as HorizonChartData).durationSec ?? 12),
      fps: layout.fps,
      width: layout.width,
      height: layout.height,
    })}
    defaultProps={{ data: horizonBRICSShared as HorizonChartData }}
  />
);

// ─── DumbbellPlot × 1 — income spread, 10th vs 90th percentile ────────────

const dumbbellIncome: DumbbellPlotData = {
  episode: CATALOG_EPISODE,
  title: "Income Inequality, by Country",
  subtitle: "From the 10th percentile to the 90th — the spread that policy lives in",
  xAxisLabel: "Annual income (USD PPP)",
  xUnit: "USD PPP",
  valueFormat: "currency",
  lowLegendLabel: "10th percentile",
  highLegendLabel: "90th percentile",
  midLegendLabel: "Median",
  sortBy: "range",
  source: "OECD Income Distribution Database 2023",
  durationSec: 14,
  items: [
    { label: "United States",  low: 11000, mid: 34000, high: 142000, highlight: true },
    { label: "Canada",         low: 17000, mid: 47000, high: 96000 },
    { label: "United Kingdom", low: 13000, mid: 38000, high: 95000 },
    { label: "Germany",        low: 17000, mid: 46000, high: 89000 },
    { label: "South Korea",    low: 14000, mid: 35000, high: 79000 },
    { label: "Japan",          low: 14000, mid: 37000, high: 78000 },
    { label: "Denmark",        low: 22000, mid: 44000, high: 76000, highlight: true },
    { label: "France",         low: 16000, mid: 38000, high: 75000 },
    { label: "Sweden",         low: 21000, mid: 41000, high: 72000, highlight: true },
    { label: "Italy",          low: 12000, mid: 30000, high: 71000 },
    { label: "Mexico",         low: 5000,  mid: 14000, high: 51000 },
    { label: "Brazil",         low: 4000,  mid: 12000, high: 58000 },
  ],
};

export const CatalogDumbbellIncome = () => (
  <Composition
    id={catalogId("DumbbellPlot", "income-spread")}
    component={DumbbellPlot}
    schema={DumbbellPlotSchema}
    calculateMetadata={({ props }) => ({
      durationInFrames: sec((props.data as DumbbellPlotData).durationSec ?? 14),
      fps: layout.fps,
      width: layout.width,
      height: layout.height,
    })}
    defaultProps={{ data: dumbbellIncome }}
  />
);

// Re-cast pre-existing data JSONs to their typed forms so the showreel can
// pass them in alongside the catalog-typed objects. JSON imports come back
// as `any` from the loader; this asserts the schema-validated shape.
const bumpGDP = bumpGdpData as BumpChartData;
const pyramidChina = pyramidChinaData as PopulationPyramidData;
const isotypeChips = isotypeChipsData as IsotypeChartData;
const rankChangeSemiconductorsTyped = rankChangeSemiconductors as RankChangeDotPlotData;

// Frame-equipped production data for the EditorialFrame showcase. The JSON
// loader returns `any`; assert the schema-validated shape here so the
// showreel doesn't have to repeat the cast at every call site.
const chartChipsAct = chartChipsActData as unknown as DataChartData;
const chartLithography = chartLithographyData as unknown as DataChartData;
const timeseriesSmicYield = timeseriesSmicYieldData as unknown as TimeSeriesChartData;
const forecastPdCooperation = forecastPdCooperationData as unknown as ProbabilityGaugeData;

export const catalogDataData = {
  statApollo, statMariana, statHabitable,
  chartMountains, chartSpaceRace, chartAxelrodRankings, chartOlympicsSmallMultiples,
  tsCarbonDioxide, tsPopulation, tsLifeExpectancySlope, tsPopulationSmallMultiples,
  gaugeWeather, gaugeScorecard,
  bayesVenice, radarAthletes, sankeyEnergy,
  waterfallCoffee,
  // Pre-existing-but-never-exported template data
  bumpGDP,
  pyramidChina,
  rankChangeSemiconductors: rankChangeSemiconductorsTyped,
  isotypeChips,
  // New template data (May 13, 2026)
  beeswarmMilitarySpending,
  calendarHeatmapIsraelIran,
  scatterPhillipsCurve,
  streamgraphUSOil,
  streamgraphCountryFlags2024,
  ridgelineLifeExpectancy,
  marimekkoG7Energy,
  marimekkoG7EnergyEmphasis,
  ternaryUNVotes,
  horizonBRICSFX,
  horizonBRICSShared,
  dumbbellIncome,
  // Phase 4 editorial-native templates (May 17, 2026)
  slopegraphNATO: slopegraphSampleData,
  kpiCardTSMC: kpiCardSampleData,
  bulletForecastAccuracy: bulletChartSampleData,
  stepLineFedFunds: stepLineSampleData,
  // EditorialFrame showcase — production episode data with frame blocks
  efChipsAct: chartChipsAct,
  efLithography: chartLithography,
  efSmicYield: timeseriesSmicYield,
  efForecastPD: forecastPdCooperation,
};
