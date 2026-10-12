import { Composition } from "remotion";
import { VennDiagram } from "./VennDiagram";
import { standardMetadata } from "../../utils/composition";
import { VennDiagramSchema } from "./schema";
import type { VennDiagramData } from "./types";

// Catalog fixture — EU/NATO overlapping sovereignty.
// The editorial point: 21 of 27 EU states are ALSO NATO members, creating
// dual commitments (Art. 5 + EU solidarity clause, defense budget dual-key,
// "strategic autonomy" vs. transatlantic burden-sharing tension).
export const vennDiagramSampleData: VennDiagramData = {
  episode: "catalog",
  title: "OVERLAPPING SOVEREIGNTY",
  subtitle: "Where EU membership, NATO membership, and EFTA diverge",
  source: "European Council; NATO; EFTA Secretariat (2024)",
  durationSec: 14,
  backgroundVariant: "dark",
  sets: [
    {
      id: "eu",
      label: "EU Member",
      color: "#4A7BA7",
      items: [
        "Common agriculture policy",
        "Euro (or obligation to adopt)",
        "Free movement of persons",
        "EU Court of Justice jurisdiction",
      ],
    },
    {
      id: "nato",
      label: "NATO Member",
      color: "#C4A747",
      items: [
        "Art. 5 collective defense",
        "Integrated military command",
        "Defense spending commitments",
        "Nuclear umbrella",
      ],
    },
  ],
  intersections: [
    {
      setIds: ["eu", "nato"],
      label: "EU + NATO",
      items: [
        "21 of 27 EU states",
        "Germany, France, Poland",
        "Strategic autonomy tension",
        "Dual-key commitments",
      ],
    },
  ],
};

export const VennDiagramComposition = () => (
  <Composition
    id="VennDiagram"
    component={VennDiagram}
    schema={VennDiagramSchema}
    calculateMetadata={standardMetadata<VennDiagramData>(14)}
    defaultProps={{ data: vennDiagramSampleData as VennDiagramData }}
  />
);
