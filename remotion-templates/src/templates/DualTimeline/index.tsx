// DEPRECATED: Use HorizontalTimeline instead. This template is kept for backward compatibility.

import { Composition } from "remotion";
import { DualTimeline } from "./DualTimeline";
import { layout, sec } from "../../design/theme";
import { DualTimelineSchema } from "./schema";
import type { DualTimelineData } from "./types";
import sampleData from "../../../data/episodes/silicon-trap/dual-timeline-oil-chips.json";

export const DualTimelineComposition = () => (
  <Composition
    id="DualTimeline"
    component={DualTimeline}
    schema={DualTimelineSchema}
    calculateMetadata={({ props }) => ({
      durationInFrames: sec((props.data as DualTimelineData).durationSec || 14),
      fps: layout.fps,
      width: layout.width,
      height: layout.height,
    })}
    defaultProps={{ data: sampleData as DualTimelineData }}
  />
);
