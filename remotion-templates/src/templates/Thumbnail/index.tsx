import { Composition } from "remotion";
import { Thumbnail } from "./Thumbnail";
import { ThumbnailSchema } from "./schema";
import type { ThumbnailData } from "./types";

// Silicon Trap Concept A — default preview data
const sampleData: ThumbnailData = {
  layout: "juxtaposition",
  episode: "silicon-trap",
  episodeLabel: "EP01 · GEOPOLITICS",
  titleText: "TRIUMPH & TRAP",
  statPrimary: "$165B",
  statPrimaryLabel: "U.S. chip subsidies",
  statContrast: "7%",
  statContrastLabel: "domestic output",
};

export const ThumbnailComposition = () => (
  <Composition
    id="Thumbnail"
    component={Thumbnail}
    schema={ThumbnailSchema}
    calculateMetadata={() => ({
      width: 1280,
      height: 720,
      fps: 30,
      durationInFrames: 1,
    })}
    defaultProps={{ data: sampleData }}
  />
);
