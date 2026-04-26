import { Composition } from "remotion";
import { TimelineComparison } from "./TimelineComparison";
import { layout, sec } from "../../design/theme";
import { TimelineComparisonSchema } from "./schema";
import type { TimelineComparisonData } from "./types";
import sampleData from "../../../data/episodes/ep01/timeline-oil-chips.json";

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
    defaultProps={{ data: sampleData as TimelineComparisonData }}
  />
);
