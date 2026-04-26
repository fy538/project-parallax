/**
 * Shorts — vertical 9:16 compositions for TikTok, YouTube Shorts, Douyin.
 *
 * Three variants matching the Shorts series defined in IDEAS.md:
 *   - KineticShort → "Framework in 45 Seconds", "History Rhymes"
 *   - DataChartShort → "The Market Says...", "Was I Right?"
 *   - SplitShort → "Both Sides Are Wrong"
 */

import { Composition } from "remotion";
import { KineticShort } from "./KineticShort";
import { DataChartShort } from "./DataChartShort";
import { SplitShort } from "./SplitShort";
import { sec } from "../../design/theme";
import { shortsLayout } from "./types";
import { QuoteDataSchema } from "../KineticTypography/schema";
import { DataChartSchema } from "../DataChart/schema";
import { SplitCompositionSchema } from "../SplitComposition/schema";
import type { QuoteData } from "../KineticTypography/types";
import type { DataChartData } from "../DataChart/types";
import type { SplitCompositionData } from "../SplitComposition/types";

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
