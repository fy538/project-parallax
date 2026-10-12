import { Composition } from "remotion";
import { DotPlot } from "./DotPlot";
import { standardMetadata } from "../../utils/composition";
import { DotPlotSchema } from "./schema";
import type { DotPlotData } from "./types";

/**
 * Sample data — NATO military spending as % GDP, 2024 estimates.
 * NATO 2% target shown as a reference line.
 *
 * Editorial use case: "NATO Burden-Sharing: Who Hits the Target"
 * — 17 member states on a single axis, reference line at 2%.
 */
export const dotPlotSampleData: DotPlotData = {
  episode: "nato-burden-sharing",
  title: "NATO BURDEN-SHARING: WHO HITS THE TARGET",
  subtitle: "Defense spending as % GDP, 2024 estimates. NATO 2% target shown.",
  source: "NATO Secretary General's Annual Report 2024",
  durationSec: 12,
  backgroundVariant: "light",
  axisLabel: "Defense spending (% of GDP)",
  axisMin: 0,
  axisMax: 5,
  axisTickCount: 6,
  axisFormat: "%.1f%%",
  revealOrder: "left-to-right",
  referenceLines: [
    { value: 2, label: "NATO 2% target", style: "dashed" },
  ],
  entities: [
    { id: "pol", label: "Poland",      value: 4.1, emphasis: "primary" },
    { id: "est", label: "Estonia",     value: 3.4 },
    { id: "usa", label: "USA",         value: 3.4 },
    { id: "lva", label: "Latvia",      value: 2.8 },
    { id: "ltu", label: "Lithuania",   value: 2.7 },
    { id: "gbr", label: "UK",          value: 2.3 },
    { id: "dnk", label: "Denmark",     value: 2.2 },
    { id: "gre", label: "Greece",      value: 2.1 },
    { id: "nor", label: "Norway",      value: 2.0 },
    { id: "deu", label: "Germany",     value: 2.1 },
    { id: "nld", label: "Netherlands", value: 2.1 },
    { id: "svk", label: "Slovakia",    value: 1.8 },
    { id: "fra", label: "France",      value: 1.9 },
    { id: "ita", label: "Italy",       value: 1.5 },
    { id: "esp", label: "Spain",       value: 1.3, emphasis: "secondary" },
    { id: "bel", label: "Belgium",     value: 1.3, emphasis: "secondary" },
    { id: "can", label: "Canada",      value: 1.4, emphasis: "secondary" },
  ],
};

export const DotPlotComposition = () => (
  <Composition
    id="DotPlot"
    component={DotPlot}
    schema={DotPlotSchema}
    calculateMetadata={standardMetadata<DotPlotData>(12)}
    defaultProps={{ data: dotPlotSampleData }}
  />
);
