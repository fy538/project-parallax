import { Composition } from "remotion";
import { SmallMultiples } from "./SmallMultiples";
import { standardMetadata } from "../../utils/composition";
import { SmallMultiplesSchema } from "./schema";
import type { SmallMultiplesData } from "./types";

// Default props — military spending as % of GDP across 6 great powers,
// 1995–2023. Post-Cold-War era — skips the 1990 Soviet-era data point
// (Russia at 12% would dominate the shared y-axis and compress every
// other cell to a flat smudge). The post-1995 window is also editorially
// cleaner: "in the unipolar era and after, here's who's been arming."
export const smallMultiplesSampleData: SmallMultiplesData = {
  episode: "great-power-arms",
  title: "MILITARY BUDGETS, % OF GDP, 1995 – 2023",
  subtitle: "Post-Cold-War spending discipline, by great power.",
  cells: [
    {
      title: "United States",
      data: [
        { x: 1995, y: 3.8 }, { x: 2000, y: 3.0 }, { x: 2005, y: 4.0 },
        { x: 2010, y: 4.7 }, { x: 2015, y: 3.5 }, { x: 2020, y: 3.7 },
        { x: 2023, y: 3.4 },
      ],
      highlight: { x: 2010, label: "Iraq/Afghan peak" },
      badge: "−11%",
    },
    {
      title: "China",
      accent: true,
      data: [
        { x: 1995, y: 1.7 }, { x: 2000, y: 1.9 }, { x: 2005, y: 2.0 },
        { x: 2010, y: 1.9 }, { x: 2015, y: 1.9 }, { x: 2020, y: 1.7 },
        { x: 2023, y: 1.7 },
      ],
      highlight: { x: 2023, label: "$296B" },
      badge: "Flat %, 14× $",
    },
    {
      title: "Russia",
      data: [
        { x: 1995, y: 4.4 }, { x: 2000, y: 3.6 }, { x: 2005, y: 3.3 },
        { x: 2010, y: 3.6 }, { x: 2015, y: 4.9 }, { x: 2020, y: 3.8 },
        { x: 2023, y: 5.9 },
      ],
      highlight: { x: 2023, label: "Ukraine surge" },
      badge: "+34%",
    },
    {
      title: "United Kingdom",
      data: [
        { x: 1995, y: 2.9 }, { x: 2000, y: 2.3 }, { x: 2005, y: 2.3 },
        { x: 2010, y: 2.4 }, { x: 2015, y: 1.9 }, { x: 2020, y: 2.2 },
        { x: 2023, y: 2.3 },
      ],
      badge: "−21%",
    },
    {
      title: "France",
      data: [
        { x: 1995, y: 2.9 }, { x: 2000, y: 2.5 }, { x: 2005, y: 2.4 },
        { x: 2010, y: 2.0 }, { x: 2015, y: 2.0 }, { x: 2020, y: 2.1 },
        { x: 2023, y: 2.1 },
      ],
      badge: "−28%",
    },
    {
      title: "Germany",
      data: [
        { x: 1995, y: 1.6 }, { x: 2000, y: 1.4 }, { x: 2005, y: 1.3 },
        { x: 2010, y: 1.3 }, { x: 2015, y: 1.2 }, { x: 2020, y: 1.4 },
        { x: 2023, y: 1.5 },
      ],
      highlight: { x: 2023, label: "Zeitenwende" },
      badge: "−6%",
    },
  ],
  grid: { cols: 3, rows: 2 },
  xLabel: "Year",
  yLabel: "% of GDP",
  yUnit: "%",
  source: "SIPRI Military Expenditure Database",
  durationSec: 14,
};

export const SmallMultiplesComposition = () => (
  <Composition
    id="SmallMultiples"
    component={SmallMultiples}
    schema={SmallMultiplesSchema}
    calculateMetadata={standardMetadata<SmallMultiplesData>(12)}
    defaultProps={{ data: smallMultiplesSampleData as SmallMultiplesData }}
  />
);
