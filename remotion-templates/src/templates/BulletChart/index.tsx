import { Composition } from "remotion";
import { BulletChart } from "./BulletChart";
import { layout, sec } from "../../design/theme";
import { BulletChartSchema } from "./schema";
import type { BulletChartData } from "./types";

const sampleData: BulletChartData = {
  episode: "_catalog",
  title: "Forecast accuracy vs commitment, 2024.",
  unit: "%",
  source: "Composite of forecaster Brier scores.",
  durationSec: 7,
  measures: [
    { label: "US-China trade", actual: 72, target: 80, qualitativeRanges: [50, 70, 100] },
    { label: "EU energy", actual: 58, target: 65, qualitativeRanges: [50, 70, 100] },
    { label: "Climate pledges", actual: 41, target: 60, qualitativeRanges: [50, 70, 100] },
    { label: "AI governance", actual: 35, target: 55, qualitativeRanges: [50, 70, 100] },
  ],
  frame: {
    kicker: "FORECAST CALIBRATION",
    title: "Forecasters beat target on trade; missed by 20pp on AI governance.",
    dek: "Brier-score accuracy across four forecast tracks. Bar = actual; tick = target; bands = bad / ok / good.",
    layout: "centered",
    chrome: "publication",
    legend: "suppressed",
    source: "Composite of forecaster Brier scores (2024).",
    modeTag: "forecast accountability · catalog",
  },
};

export const BulletChartComposition = () => (
  <Composition
    id="BulletChart"
    component={BulletChart}
    schema={BulletChartSchema}
    calculateMetadata={({ props }) => ({
      durationInFrames: sec((props.data as BulletChartData).durationSec ?? 7),
      fps: layout.fps,
      width: layout.width,
      height: layout.height,
    })}
    defaultProps={{ data: sampleData as BulletChartData }}
  />
);
