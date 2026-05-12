import { Composition } from "remotion";
import { CartogramMap } from "./CartogramMap";
import { layout, sec } from "../../design/theme";
import { CartogramMapSchema } from "./schema";
import type { CartogramMapData } from "./types";

/**
 * Default sample data: EU member-state population, 2024 (millions). The
 * canonical Dorling use case — dense, geographically clustered countries
 * (Europe) where ProportionalSymbolMap circles would overlap into a
 * jumble. Cartogram says "Germany is the biggest" without making it
 * visually dominate via land area.
 *
 * Source figures: Eurostat 2024 (approximate, rounded).
 */
export const cartogramMapSampleData: CartogramMapData = {
  episode: "_catalog",
  title: "European Union by population",
  subtitle: "EU-27 member states, 2024 (millions)",
  projection: "equalEarth",
  source: "Eurostat 2024 (approximate)",
  unit: "M",
  valueLabel: "Population",
  maxRadiusPx: 64,
  scaleType: "sqrt",
  symbolColor: "#4A7BA7",
  framePadding: 100,
  showCoastlines: true,
  phases: [
    {
      title: "Population weight",
      subtitle: "Each circle is a member state, sized by people",
      durationSec: 8,
      data: [
        // EU-27 by population (millions, 2024 estimates)
        { iso3: "DEU", value: 84.7, label: "DEU" },
        { iso3: "FRA", value: 68.4, label: "FRA" },
        { iso3: "ITA", value: 58.8, label: "ITA" },
        { iso3: "ESP", value: 48.6, label: "ESP" },
        { iso3: "POL", value: 36.8, label: "POL" },
        { iso3: "ROU", value: 19.0, label: "ROU" },
        { iso3: "NLD", value: 17.9, label: "NLD" },
        { iso3: "BEL", value: 11.7, label: "BEL" },
        { iso3: "CZE", value: 10.9, label: "CZE" },
        { iso3: "SWE", value: 10.5, label: "SWE" },
        { iso3: "PRT", value: 10.5, label: "PRT" },
        { iso3: "GRC", value: 10.4, label: "GRC" },
        { iso3: "HUN", value: 9.6, label: "HUN" },
        { iso3: "AUT", value: 9.1, label: "AUT" },
        { iso3: "BGR", value: 6.4, label: "BGR" },
        { iso3: "DNK", value: 5.9, label: "DNK" },
        { iso3: "FIN", value: 5.6, label: "FIN" },
        { iso3: "SVK", value: 5.4, label: "SVK" },
        { iso3: "IRL", value: 5.3, label: "IRL" },
        { iso3: "HRV", value: 3.9, label: "HRV" },
        { iso3: "LTU", value: 2.9 },
        { iso3: "SVN", value: 2.1 },
        { iso3: "LVA", value: 1.9 },
        { iso3: "EST", value: 1.4 },
        { iso3: "CYP", value: 0.9 },
        { iso3: "LUX", value: 0.7 },
        { iso3: "MLT", value: 0.5 },
      ],
    },
  ],
};

function totalDuration(data: CartogramMapData): number {
  return data.phases.reduce((sum, p) => sum + sec(p.durationSec), 0);
}

export const CartogramMapComposition = () => (
  <Composition
    id="CartogramMap"
    component={CartogramMap}
    schema={CartogramMapSchema}
    calculateMetadata={({ props }) => ({
      durationInFrames: totalDuration(props.data as CartogramMapData),
      fps: layout.fps,
      width: layout.width,
      height: layout.height,
    })}
    defaultProps={{ data: cartogramMapSampleData }}
  />
);
