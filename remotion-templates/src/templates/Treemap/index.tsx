import { Composition } from "remotion";
import { Treemap } from "./Treemap";
import { standardMetadata } from "../../utils/composition";
import { TreemapSchema } from "./schema";
import type { TreemapData } from "./types";

// Catalog fixture: U.S. defense budget by service branch, FY2024.
// The treemap tells the story of "where the $886B goes" in a single glance —
// Navy and Air Force are nearly equal at the top, Army just behind, and
// Defense-Wide (intelligence, logistics, cyber) is the surprise: larger than
// R&D. Army is highlighted to draw the eye as the narrator names land forces.
export const treemapSampleData: TreemapData = {
  episode: "catalog",
  title: "WHERE THE $886 BILLION GOES",
  subtitle: "U.S. defense budget by service branch, 2024",
  source:
    "Office of the Undersecretary of Defense (Comptroller) FY2024",
  durationSec: 12,
  backgroundVariant: "dark",
  valuePrefix: "$",
  valueSuffix: "B",
  showValues: true,
  highlightLabel: "Army",
  items: [
    { label: "Army", value: 185, sublabel: "Land forces, readiness" },
    { label: "Navy", value: 215, sublabel: "Fleet, submarines, Marines" },
    { label: "Air Force", value: 198, sublabel: "Airpower, space systems" },
    {
      label: "Defense-Wide",
      value: 164,
      sublabel: "Intelligence, logistics, cyber",
    },
    { label: "R&D", value: 145, sublabel: "Next-gen weapons, DARPA" },
    { label: "MILCON", value: 17, sublabel: "Military construction" },
    { label: "Revolving", value: 4, sublabel: "Working capital funds" },
    { label: "Other", value: 8, sublabel: "Misc. programs" },
  ],
};

export const TreemapComposition = () => (
  <Composition
    id="Treemap"
    component={Treemap}
    schema={TreemapSchema}
    calculateMetadata={standardMetadata<TreemapData>(12)}
    defaultProps={{ data: treemapSampleData as TreemapData }}
  />
);
