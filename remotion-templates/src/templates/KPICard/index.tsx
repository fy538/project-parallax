import { Composition } from "remotion";
import { KPICard } from "./KPICard";
import { layout, sec } from "../../design/theme";
import { KPICardSchema } from "./schema";
import type { KPICardData } from "./types";

const sampleData: KPICardData = {
  episode: "_catalog",
  title: "TSMC controls cutting-edge production",
  value: "92",
  unit: "%",
  change: "+5 pp YoY",
  context: "Share of global ≤7nm wafer-fab capacity, 2024.",
  trend: [62, 68, 73, 78, 84, 87, 92],
  source: "SEMI Industry Statistics (2024).",
  durationSec: 6,
  frame: {
    kicker: "FAB CAPACITY",
    title: "TSMC controls 92% of cutting-edge production.",
    dek: "Share of global ≤7nm wafer-fab capacity has compounded for seven years.",
    layout: "centered",
    chrome: "publication",
    legend: "suppressed",
    source: "SEMI Industry Statistics (2024).",
    modeTag: "supply concentration · catalog",
  },
};

export const KPICardComposition = () => (
  <Composition
    id="KPICard"
    component={KPICard}
    schema={KPICardSchema}
    calculateMetadata={({ props }) => ({
      durationInFrames: sec((props.data as KPICardData).durationSec ?? 6),
      fps: layout.fps,
      width: layout.width,
      height: layout.height,
    })}
    defaultProps={{ data: sampleData as KPICardData }}
  />
);
