import { Composition } from "remotion";
import { HorizontalTimeline } from "./HorizontalTimeline";
import { layout, sec } from "../../design/theme";
import type { HorizontalTimelineData } from "./types";

import sampleData from "../../../data/episodes/silicon-trap/horizontal-timeline-oil-chip.json";

export { HorizontalTimeline } from "./HorizontalTimeline";
export type {
  HorizontalTimelineData,
  TimelineEventData,
  TimelinePairData,
  TimelineMorphEventData,
  TimelineCameraStep,
} from "./types";

export const HorizontalTimelineComposition = () => (
  <Composition
    id="HorizontalTimeline"
    component={HorizontalTimeline}
    calculateMetadata={({ props }) => ({
      durationInFrames: sec((props.data as HorizontalTimelineData).durationSec || 15),
      fps: layout.fps,
      width: layout.width,
      height: layout.height,
    })}
    defaultProps={{ data: sampleData as unknown as HorizontalTimelineData }}
  />
);
