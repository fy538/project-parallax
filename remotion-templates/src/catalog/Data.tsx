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
import { RadarChart } from "../templates/RadarChart/RadarChart";
import { RadarChartSchema } from "../templates/RadarChart/schema";
import type { RadarChartData } from "../templates/RadarChart/types";
import { SankeyFlow } from "../templates/SankeyFlow/SankeyFlow";
import { SankeyFlowSchema } from "../templates/SankeyFlow/schema";
import type { SankeyFlowData } from "../templates/SankeyFlow/types";
import { layout, sec } from "../design/theme";
import { CATALOG_EPISODE, catalogId } from "./helpers";

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

const tsPopulation: TimeSeriesChartData = {
  episode: CATALOG_EPISODE,
  title: "World Population by Region",
  subtitle: "Five regions diverge across the 20th century",
  lines: [
    {
      label: "Asia", color: "#C23B22",
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
  variant: "gauge",
  gauges: [
    { label: "NWS official", value: 65 },
    { label: "ECMWF model", value: 72, color: "#3266AD" },
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
    { label: "Top Speed", short: "SPD" },
    { label: "Endurance", short: "END" },
    { label: "Power", short: "PWR" },
    { label: "Technical Skill", short: "TECH" },
    { label: "Recovery", short: "REC" },
    { label: "Versatility", short: "VER" },
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

export const catalogDataData = {
  statApollo, statMariana, statHabitable,
  chartMountains, chartSpaceRace,
  tsCarbonDioxide, tsPopulation,
  gaugeWeather, gaugeScorecard,
  bayesVenice, radarAthletes, sankeyEnergy,
};
