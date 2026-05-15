import { Composition } from "remotion";
import { AtlasPlate } from "./AtlasPlate";
import { layout, sec } from "../../design/theme";
import { AtlasPlateSchema } from "./schema";
import type { AtlasPlateData } from "./types";

// Sample data — exported so the catalog and tests can reference the same
// canonical-looking AtlasPlate composition. Keeps the default-props path
// out of dependence on any episode JSON.
export const atlasPlateSampleData: AtlasPlateData = {
  episode: "_catalog",
  title: "The COCOM Members",
  subtitle: "1949–1994 — Western export-control regime against the Soviet bloc",
  projection: "equalEarth",
  source: "Mastanduno (1992); COCOM records",
  framePadding: 100,
  graticule: {
    spacing: 15,
    opacity: 0.1,
    emphasize30: true,
  },
  phases: [
    {
      title: "Western signatories",
      subtitle: "17 nations, NATO + Japan",
      durationSec: 6,
      countries: [
        // NATO core
        { iso3: "USA", fill: "#4A7BA7" }, // episode-specific — not a brand token
        { iso3: "GBR", fill: "#4A7BA7" }, // episode-specific — not a brand token
        { iso3: "FRA", fill: "#4A7BA7" }, // episode-specific — not a brand token
        { iso3: "DEU", fill: "#4A7BA7" }, // episode-specific — not a brand token
        { iso3: "ITA", fill: "#4A7BA7" }, // episode-specific — not a brand token
        { iso3: "CAN", fill: "#4A7BA7" }, // episode-specific — not a brand token
        { iso3: "BEL", fill: "#4A7BA7" }, // episode-specific — not a brand token
        { iso3: "NLD", fill: "#4A7BA7" }, // episode-specific — not a brand token
        { iso3: "DNK", fill: "#4A7BA7" }, // episode-specific — not a brand token
        { iso3: "NOR", fill: "#4A7BA7" }, // episode-specific — not a brand token
        { iso3: "PRT", fill: "#4A7BA7" }, // episode-specific — not a brand token
        { iso3: "LUX", fill: "#4A7BA7" }, // episode-specific — not a brand token
        { iso3: "TUR", fill: "#4A7BA7" }, // episode-specific — not a brand token
        { iso3: "GRC", fill: "#4A7BA7" }, // episode-specific — not a brand token
        { iso3: "ESP", fill: "#4A7BA7" }, // episode-specific — not a brand token
        // Asia
        { iso3: "JPN", fill: "#4A7BA7" }, // episode-specific — not a brand token
        // Australia joined later but in the family for visual completeness
        { iso3: "AUS", fill: "#4A7BA7" }, // episode-specific — not a brand token
      ],
    },
    {
      title: "The Soviet bloc",
      subtitle: "What was being contained",
      durationSec: 5,
      countries: [
        // Western highlights faded
        { iso3: "USA", fill: "#4A7BA7" }, // episode-specific — not a brand token
        { iso3: "JPN", fill: "#4A7BA7" }, // episode-specific — not a brand token
        { iso3: "DEU", fill: "#4A7BA7" }, // episode-specific — not a brand token
        { iso3: "GBR", fill: "#4A7BA7" }, // episode-specific — not a brand token
        // Soviet bloc highlighted
        { iso3: "RUS", fill: "#A64D46" }, // episode-specific — not a brand token
        { iso3: "POL", fill: "#A64D46" }, // episode-specific — not a brand token
        { iso3: "CZE", fill: "#A64D46" }, // episode-specific — not a brand token
        { iso3: "HUN", fill: "#A64D46" }, // episode-specific — not a brand token
        { iso3: "ROU", fill: "#A64D46" }, // episode-specific — not a brand token
        { iso3: "BGR", fill: "#A64D46" }, // episode-specific — not a brand token
        { iso3: "CHN", fill: "#A64D46" }, // episode-specific — not a brand token
      ],
      focus: { center: [50, 45], scaleHint: 1.6 },
    },
  ],
};

function totalDuration(data: AtlasPlateData): number {
  return data.phases.reduce((sum, p) => sum + sec(p.durationSec), 0);
}

export const AtlasPlateComposition = () => (
  <Composition
    id="AtlasPlate"
    component={AtlasPlate}
    schema={AtlasPlateSchema}
    calculateMetadata={({ props }) => ({
      durationInFrames: totalDuration(props.data as AtlasPlateData),
      fps: layout.fps,
      width: layout.width,
      height: layout.height,
    })}
    defaultProps={{ data: atlasPlateSampleData }}
  />
);
