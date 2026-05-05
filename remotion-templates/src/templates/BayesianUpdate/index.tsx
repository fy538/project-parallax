import { Composition } from "remotion";
import { BayesianUpdate } from "./BayesianUpdate";
import { layout, sec } from "../../design/theme";
import { BayesianUpdateSchema } from "./schema";
import type { BayesianUpdateData } from "./types";

const sampleData: BayesianUpdateData = {
  episode: "EP02",
  title: "Will Export Controls Succeed?",
  subtitle: "Bayesian estimate updated with each new piece of evidence",
  variant: "single",
  prior: 55,
  question: "P(US export controls achieve lasting tech advantage)",
  evidence: [
    {
      label: "COCOM precedent: 45 years of success vs USSR",
      direction: "up",
      magnitude: 3,
      source: "Cold War data",
    },
    {
      label: "China's economy 6× more integrated than USSR",
      direction: "down",
      magnitude: 4,
    },
    {
      label: "SMIC achieves 7nm without EUV",
      direction: "down",
      magnitude: 3,
      source: "TechInsights teardown, 2024",
    },
    {
      label: "DeepSeek R2 fails on domestic chips",
      direction: "up",
      magnitude: 2,
      source: "Industry reports, 2025",
    },
    {
      label: "Revenue-sharing deal replaces denial",
      direction: "down",
      magnitude: 3,
      source: "Executive order, Aug 2025",
    },
  ],
  marketPrice: 42,
  marketSource: "Kalshi",
  source: "Parallax analysis — composite estimate",
  durationSec: 14,
};

const multiSampleData: BayesianUpdateData = {
  episode: "EP03",
  title: "AI Export Containment: Multi-Path Outcomes",
  subtitle: "How a single policy shift redistributes probabilities across competing scenarios",
  variant: "multi",
  question: "How will new US AI export restrictions reshape the geopolitical landscape?",
  multiHypotheses: [
    {
      label: "Controls succeed",
      prior: 28,
      color: "#5DAA68",
    },
    {
      label: "Controls backfire",
      prior: 24,
      color: "#D64545",
    },
    {
      label: "Partial effectiveness",
      prior: 32,
      color: "#E5A544",
    },
    {
      label: "Technological leapfrog",
      prior: 16,
      color: "#3266AD",
    },
  ],
  evidence: [
    {
      label: "TSMC wafer starts to China drop 8%",
      direction: "up",
      magnitude: 2,
      source: "Gartner, Q1 2026",
    },
    {
      label: "DeepSeek trains competitive LLM on 11 month timeline",
      direction: "down",
      magnitude: 3,
      source: "TechCrunch analysis",
    },
    {
      label: "EU mirrors US restrictions on GPU exports",
      direction: "up",
      magnitude: 3,
      source: "EU Commission statement",
    },
  ],
  source: "Parallax geopolitical modeling",
  durationSec: 16,
};

export const BayesianUpdateComposition = () => (
  <Composition
    id="BayesianUpdate"
    component={BayesianUpdate}
    schema={BayesianUpdateSchema}
    calculateMetadata={({ props }) => ({
      durationInFrames: sec(
        (props.data as BayesianUpdateData).durationSec || 12
      ),
      fps: layout.fps,
      width: layout.width,
      height: layout.height,
    })}
    defaultProps={{ data: sampleData }}
  />
);

export const BayesianUpdateMultiComposition = () => (
  <Composition
    id="BayesianUpdate-Multi"
    component={BayesianUpdate}
    schema={BayesianUpdateSchema}
    calculateMetadata={({ props }) => ({
      durationInFrames: sec(
        (props.data as BayesianUpdateData).durationSec || 12
      ),
      fps: layout.fps,
      width: layout.width,
      height: layout.height,
    })}
    defaultProps={{ data: multiSampleData }}
  />
);
