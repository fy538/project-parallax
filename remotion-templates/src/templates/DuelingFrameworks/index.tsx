import { Composition } from "remotion";
import { DuelingFrameworks } from "./DuelingFrameworks";
import { standardMetadata } from "../../utils/composition";
import { DuelingFrameworksSchema } from "./schema";
import type { DuelingFrameworksData } from "./types";
const sampleData = {
  data: {
    episode: "SAMPLE",
    title: "Realism vs. Liberalism",
    phenomenon: "Great power competition",
    durationSec: 12,
    // DuelingFrameworks is the analytical "bounded analogy" form — editorial
    // newsroom register, not atmospheric. Light is primary per BRAND.md;
    // both catalog variants (Empire Fall, Blockades) also render in light.
    // The dark-mode standalone was producing a "movie title screen" feel
    // from the Background atmosphere layer's dust + bokeh, fighting the
    // mid-century editorial pillar this template carries.
    backgroundVariant: "light" as const,
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
    calculateMetadata={standardMetadata<DuelingFrameworksData>(12)}
    defaultProps={sampleData as { data: DuelingFrameworksData }}
  />
);
