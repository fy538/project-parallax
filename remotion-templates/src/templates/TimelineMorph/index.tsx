// DEPRECATED: Use HorizontalTimeline instead. This template is kept for backward compatibility.

import { Composition } from "remotion";
import { TimelineMorph } from "./TimelineMorph";
import { layout, sec } from "../../design/theme";
import { TimelineMorphSchema } from "./schema";
import type { TimelineMorphData } from "./types";
const sampleData: TimelineMorphData = {
  episode: "SAMPLE",
  title: "Oil → Chips",
  eraATitle: "Oil Age",
  eraBTitle: "Silicon Age",
  eraAColor: "#888780",
  eraBColor: "#E5A544",
  events: [
    { eraALabel: "1941", eraAText: "Oil embargo", eraBLabel: "2022", eraBText: "Chip controls" },
    { eraALabel: "1973", eraAText: "OPEC crisis", eraBLabel: "2023", eraBText: "CHIPS Act funding" },
    { eraALabel: "1979", eraAText: "Iran revolution", eraBLabel: "2025", eraBText: "Export tightening" },
  ],
  holdDurationSec: 3,
  morphDurationSec: 2,
  durationSec: 12,
  backgroundVariant: "dark" as const,
};

function totalDuration(data: TimelineMorphData): number {
  const holdDuration = data.holdDurationSec || 3;
  const morphDuration = data.morphDurationSec || 2;
  const cardShowTime = 1; // minimum time for each card visibility

  // Total: intro delay + (event count * card time) + morph + hold B + outro
  const totalTime =
    0.8 + // intro delay
    data.events.length * cardShowTime + // cards appearing
    holdDuration + // hold era A
    morphDuration + // morph phase
    1; // hold era B before exit

  return sec(totalTime);
}

export const TimelineMorphComposition = () => (
  <Composition
    id="TimelineMorph"
    component={TimelineMorph}
    schema={TimelineMorphSchema}
    calculateMetadata={({ props }) => ({
      durationInFrames: totalDuration(props.data as TimelineMorphData),
      fps: layout.fps,
      width: layout.width,
      height: layout.height,
    })}
    defaultProps={{ data: sampleData as TimelineMorphData }}
  />
);
