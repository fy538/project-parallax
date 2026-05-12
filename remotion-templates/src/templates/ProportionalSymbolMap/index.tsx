import { Composition } from "remotion";
import { ProportionalSymbolMap } from "./ProportionalSymbolMap";
import { layout, sec } from "../../design/theme";
import { ProportionalSymbolMapSchema } from "./schema";
import type { ProportionalSymbolMapData } from "./types";

/**
 * Default sample data: global semiconductor wafer fabrication capacity by
 * country, c. 2024. Each circle's AREA is proportional to monthly wafer
 * starts (millions, 8-inch equivalent). Editorially adjacent to the
 * silicon-trap episode and demonstrates the canonical use case — count
 * data on a world map where choropleth (which fills entire countries)
 * would over-emphasize geographic area at the expense of the actual
 * capacity story.
 *
 * Source figures: SEMI Industry Statistics, 2024.
 */
export const proportionalSymbolMapSampleData: ProportionalSymbolMapData = {
  episode: "_catalog",
  title: "Where Chips Are Made",
  subtitle: "Monthly wafer-fab capacity by country, 2024",
  projection: "equalEarth",
  source: "SEMI Industry Statistics 2024 (approximate)",
  unit: "M wafers/mo",
  valueLabel: "Wafer-fab capacity",
  maxRadiusPx: 56,
  scaleType: "sqrt",
  symbolColor: "#C23B22",
  framePadding: 100,
  graticule: {
    spacing: 15,
    opacity: 0.1,
    emphasize30: true,
  },
  phases: [
    {
      title: "Concentrated production",
      subtitle: "Top six fab nations",
      durationSec: 8,
      symbols: [
        // Approximate monthly 200mm-equivalent wafer starts (millions).
        // Numbers chosen for plausible relative scale — not source-perfect.
        { iso3: "TWN", value: 5.4, label: "TWN" },
        { iso3: "KOR", value: 4.8, label: "KOR" },
        { iso3: "JPN", value: 3.2, label: "JPN" },
        { iso3: "CHN", value: 3.0, label: "CHN" },
        { iso3: "USA", value: 1.8, label: "USA" },
        { iso3: "DEU", value: 0.6, label: "DEU" },
        { iso3: "IRL", value: 0.3 },
        { iso3: "ISR", value: 0.3 },
        { iso3: "SGP", value: 0.5 },
      ],
    },
  ],
};

function totalDuration(data: ProportionalSymbolMapData): number {
  return data.phases.reduce((sum, p) => sum + sec(p.durationSec), 0);
}

export const ProportionalSymbolMapComposition = () => (
  <Composition
    id="ProportionalSymbolMap"
    component={ProportionalSymbolMap}
    schema={ProportionalSymbolMapSchema}
    calculateMetadata={({ props }) => ({
      durationInFrames: totalDuration(props.data as ProportionalSymbolMapData),
      fps: layout.fps,
      width: layout.width,
      height: layout.height,
    })}
    defaultProps={{ data: proportionalSymbolMapSampleData }}
  />
);
