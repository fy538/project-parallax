// DEPRECATED: Use HorizontalTimeline instead. This template is kept for backward compatibility.

import { Composition } from "remotion";
import { TimelineComparison } from "./TimelineComparison";
import { layout, sec } from "../../design/theme";
import { TimelineComparisonSchema } from "./schema";
import type { TimelineComparisonData } from "./types";

// Inline sample data — timeline-oil-chips.json was deprecated in favor of DualTimeline.
const sampleData: TimelineComparisonData = {
  episode: "silicon-trap",
  leftLabel: "Historical",
  rightLabel: "Modern",
  secondsPerEvent: 2,
  leftEvents: [
    { year: "1941", title: "Oil embargo imposed on Japan", color: "#3266AD" },
    { year: "1941", title: "Pearl Harbor attack", color: "#3266AD" },
  ],
  rightEvents: [
    { year: "2022", title: "Chip export controls on China", color: "#C23B22" },
    { year: "2024", title: "Huawei Kirin breakthrough", color: "#C23B22" },
  ],
};

function totalDuration(data: TimelineComparisonData): number {
  const secsPerEvent = data.secondsPerEvent || 2;
  const totalEvents = Math.max(data.leftEvents.length, data.rightEvents.length);
  return sec(totalEvents * secsPerEvent + 3); // +3s for intro/outro
}

export const TimelineComparisonComposition = () => (
  <Composition
    id="TimelineComparison"
    component={TimelineComparison}
    schema={TimelineComparisonSchema}
    calculateMetadata={({ props }) => ({
      durationInFrames: totalDuration(props.data as TimelineComparisonData),
      fps: layout.fps,
      width: layout.width,
      height: layout.height,
    })}
    defaultProps={{ data: sampleData }}
  />
);
