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
import { layout, sec } from "../design/theme";
import { CATALOG_EPISODE, catalogId } from "./helpers";
import bumpGdpData from "../../data/episodes/catalog/bump-chart-gdp.json";
import pyramidChinaData from "../../data/episodes/catalog/population-pyramid-china.json";

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

export const catalogDataData = {
  statApollo, statMariana, statHabitable,
  chartMountains, chartSpaceRace, chartAxelrodRankings, chartOlympicsSmallMultiples,
  tsCarbonDioxide, tsPopulation, tsLifeExpectancySlope, tsPopulationSmallMultiples,
  gaugeWeather, gaugeScorecard,
  bayesVenice, radarAthletes, sankeyEnergy,
  waterfallCoffee,
};
