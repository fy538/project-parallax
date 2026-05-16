import { Composition } from "remotion";
import { DuelingFrameworks } from "./DuelingFrameworks";
import { layout, sec } from "../../design/theme";
import { DuelingFrameworksSchema } from "./schema";
import type { DuelingFrameworksData } from "./types";
const sampleData = {
  data: {
    episode: "SAMPLE",
    title: "Realism vs. Liberalism",
    phenomenon: "Great power competition",
    durationSec: 12,
    backgroundVariant: "dark" as const,
    frameworkA: {
      name: "Realism",
      color: "#C23B22", // episode-specific — not a brand token
      tenets: [
        { text: "Power politics" },
        { text: "Security dilemma" },
        { text: "Self-help system" },
      ],
      score: 72,
      verdict: "Explains escalation logic",
    },
    frameworkB: {
      name: "Liberalism",
      color: "#3266AD", // episode-specific — not a brand token
      tenets: [
        { text: "Interdependence" },
        { text: "Institutions" },
        { text: "Democratic peace" },
      ],
      score: 55,
      verdict: "Explains restraint signals",
    },
  },
};

export const DuelingFrameworksComposition = () => (
  <Composition
    id="DuelingFrameworks"
    component={DuelingFrameworks}
    schema={DuelingFrameworksSchema}
    calculateMetadata={({ props }) => ({
      durationInFrames: sec((props.data as DuelingFrameworksData).durationSec || 12),
      fps: layout.fps,
      width: layout.width,
      height: layout.height,
    })}
    defaultProps={sampleData as unknown as { data: DuelingFrameworksData }}
  />
);
