import { Composition } from "remotion";
import { Recreation, type RecreationData } from "./Recreation";
import { layout } from "../../design/theme";

export const recreationSampleData: RecreationData = {
  src: "assets/recreation/soldier.glb",
  clip: "Walk",
  durationSec: 6,
};

export const RecreationComposition = () => (
  <Composition
    id="Recreation"
    component={Recreation}
    durationInFrames={Math.round(layout.fps * (recreationSampleData.durationSec ?? 6))}
    fps={layout.fps}
    width={layout.width}
    height={layout.height}
    defaultProps={{ data: recreationSampleData }}
  />
);
