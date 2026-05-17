// DEPRECATED: Use HorizontalTimeline instead. This template is kept for backward compatibility.

import { Composition } from "remotion";
import { DualTimeline } from "./DualTimeline";
import { standardMetadata } from "../../utils/composition";
import { DualTimelineSchema } from "./schema";
import type { DualTimelineData } from "./types";
import sampleData from "../../../data/episodes/silicon-trap/dual-timeline-oil-chips.json";

export const DualTimelineComposition = () => (
  <Composition
    id="DualTimeline"
    component={DualTimeline}
    schema={DualTimelineSchema}
    calculateMetadata={standardMetadata<DualTimelineData>(14)}
    defaultProps={{ data: sampleData as DualTimelineData }}
  />
);
