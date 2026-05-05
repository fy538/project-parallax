import { Composition } from "remotion";
import { StatReveal } from "./StatReveal";
import { layout, sec } from "../../design/theme";
import { StatRevealSchema } from "./schema";
import type { StatRevealData } from "./types";

const sampleData: StatRevealData = {
  episode: "silicon-trap",
  title: "The Scale of Investment",
  subtitle: "CHIPS Act funding vs. comparable programs",
  stat: {
    value: 280,
    prefix: "$",
    suffix: "B",
    label: "Total CHIPS Act + private commitments",
    decimals: 0,
  },
  comparisons: [
    { label: "Apollo Program (adj.)", value: 194, color: "#3266AD" },
    { label: "Marshall Plan (adj.)", value: 173, color: "#5DAA68" },
    { label: "Manhattan Project (adj.)", value: 30, color: "#C23B22" },
  ],
  source: "Congressional Budget Office, 2025",
  durationSec: 10,
};

export const StatRevealComposition = () => (
  <Composition
    id="StatReveal"
    component={StatReveal}
    schema={StatRevealSchema}
    calculateMetadata={({ props }) => ({
      durationInFrames: sec(
        (props.data as StatRevealData).durationSec || 10
      ),
      fps: layout.fps,
      width: layout.width,
      height: layout.height,
    })}
    defaultProps={{ data: sampleData }}
  />
);
