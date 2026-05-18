import { Composition } from "remotion";
import { StepLine } from "./StepLine";
import { layout, sec } from "../../design/theme";
import { StepLineSchema } from "./schema";
import type { StepLineData } from "./types";

export const stepLineSampleData: StepLineData = {
  episode: "_catalog",
  title: "Fed funds rate, 2020–2024.",
  source: "FRED — Federal Funds Effective Rate.",
  yLabel: "Rate",
  yUnit: "%",
  areaFill: true,
  areaOpacity: 0.08,
  durationSec: 8,
  points: [
    { x: 2020, y: 0.25, event: "COVID floor" },
    { x: 2021, y: 0.25 },
    { x: 2022, y: 0.5 },
    { x: 2022.5, y: 2.5 },
    { x: 2023, y: 4.75, event: "Banking stress" },
    { x: 2023.5, y: 5.25 },
    { x: 2024, y: 5.5 },
    { x: 2024.5, y: 5.0, event: "First cut" },
  ],
  frame: {
    kicker: "MONETARY POLICY",
    title: "From zero to five-and-a-quarter, then the first cut.",
    dek: "Federal Funds Effective Rate, stepped — each move discrete, not gradual.",
    layout: "centered",
    chrome: "publication",
    legend: "suppressed",
    source: "FRED — Federal Funds Effective Rate.",
    modeTag: "monetary policy · catalog",
  },
};

export const StepLineComposition = () => (
  <Composition
    id="StepLine"
    component={StepLine}
    schema={StepLineSchema}
    calculateMetadata={({ props }) => ({
      durationInFrames: sec((props.data as StepLineData).durationSec ?? 8),
      fps: layout.fps,
      width: layout.width,
      height: layout.height,
    })}
    defaultProps={{ data: stepLineSampleData as StepLineData }}
  />
);
