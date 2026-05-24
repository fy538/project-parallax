import { Composition } from "remotion";
import { Recreation, type RecreationData } from "./Recreation";
import { layout } from "../../design/theme";

export const recreationSampleData: RecreationData = {
  // Stand-in rigged character. Swapping in a period-accurate Roman model
  // (downloaded from Sketchfab / Meshy) is this one field — the template
  // auto-normalizes scale + position and falls back to the GLB's first clip,
  // so any rigged humanoid drops in without further changes.
  src: "assets/recreation/roman-walking.glb",
  set: "senate",
  renderMode: "constructivist",
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
