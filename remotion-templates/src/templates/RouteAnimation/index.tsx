import { Composition } from "remotion";
import { RouteAnimation } from "./RouteAnimation";
import { layout, sec } from "../../design/theme";
import { RouteAnimationSchema } from "./schema";
import type { RouteAnimationData } from "./types";
import sampleData from "../../../data/episodes/silicon-trap/route-chip-supply.json";

function totalDuration(data: RouteAnimationData): number {
  const phaseDuration = data.phases.reduce(
    (sum, p) => sum + p.durationSec,
    0
  );
  return sec(phaseDuration + 1); // +1s for intro delay
}

export const RouteAnimationComposition = () => (
  <Composition
    id="RouteAnimation"
    component={RouteAnimation}
    schema={RouteAnimationSchema}
    calculateMetadata={({ props }) => ({
      durationInFrames: totalDuration(props.data as RouteAnimationData),
      fps: layout.fps,
      width: layout.width,
      height: layout.height,
    })}
    defaultProps={{ data: sampleData as unknown as RouteAnimationData }}
  />
);
