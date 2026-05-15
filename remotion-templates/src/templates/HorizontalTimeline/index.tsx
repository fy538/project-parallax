import { Composition } from "remotion";
import { HorizontalTimeline } from "./HorizontalTimeline";
import { HorizontalTimelineSchema } from "./schema";
import { layout, sec } from "../../design/theme";
import type { HorizontalTimelineData } from "./types";

import sampleData from "../../../data/episodes/silicon-trap/horizontal-timeline-oil-chip.json";
import singleSampleData from "../../../data/episodes/catalog/horizontal-timeline-cold-war-arms.json";

export { HorizontalTimeline } from "./HorizontalTimeline";
export { HorizontalTimelineSchema } from "./schema";
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
    schema={HorizontalTimelineSchema}
    calculateMetadata={({ props }) => ({
      durationInFrames: sec((props.data as HorizontalTimelineData).durationSec || 15),
      fps: layout.fps,
      width: layout.width,
      height: layout.height,
    })}
    defaultProps={{ data: sampleData as unknown as HorizontalTimelineData }}
  />
);

/** Single-mode sample that exercises the `eras` era-bracket prop (single mode only). */
export const HorizontalTimelineSingleComposition = () => (
  <Composition
    id="HorizontalTimelineSingle"
    component={HorizontalTimeline}
    schema={HorizontalTimelineSchema}
    calculateMetadata={({ props }) => ({
      durationInFrames: sec((props.data as HorizontalTimelineData).durationSec || 15),
      fps: layout.fps,
      width: layout.width,
      height: layout.height,
    })}
    defaultProps={{ data: singleSampleData as unknown as HorizontalTimelineData }}
  />
);
