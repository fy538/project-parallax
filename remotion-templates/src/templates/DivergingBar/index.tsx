import { Composition } from "remotion";
import { DivergingBar } from "./DivergingBar";
import { standardMetadata } from "../../utils/composition";
import { DivergingBarSchema } from "./schema";
import type { DivergingBarData } from "./types";

// Sample data: G7 + BRICS countries by net semiconductor trade position.
// Taiwan and South Korea dominate the surplus side (TSMC + Samsung/SK Hynix),
// while the USA — the world's largest fabless leader — runs a substantial
// deficit due to its outsourced manufacturing base. China's deficit is the
// editorial point: the gap it is racing to close.
export const divergingBarSampleData: DivergingBarData = {
  episode: "silicon-trap",
  title: "WHO RUNS A SURPLUS OR DEFICIT IN CHIPS",
  subtitle: "Net semiconductor trade balance, selected economies, 2023 est. ($B)",
  source: "UN Comtrade; OECD Trade in Value Added database",
  durationSec: 12,
  backgroundVariant: "light",
  sortOrder: "value-desc",
  axisLabel: "Net semiconductor trade position ($B)",
  positiveLabel: "Net exporter",
  negativeLabel: "Net importer",
  zeroLabel: "Balanced",
  items: [
    { label: "Taiwan", value: 142, sublabel: "TSMC-driven" },
    { label: "South Korea", value: 86, sublabel: "Samsung + SK Hynix" },
    { label: "Japan", value: 18 },
    { label: "Netherlands", value: 12, sublabel: "ASML exports" },
    { label: "Germany", value: 4 },
    { label: "France", value: -2 },
    { label: "India", value: -8 },
    { label: "Russia", value: -14, sublabel: "Sanctioned, ~90% imported" },
    { label: "Brazil", value: -12 },
    { label: "USA", value: -28, sublabel: "Fabless leader, net importer" },
    { label: "China", value: -38, sublabel: "Policy priority: close the gap" },
  ],
};

export const DivergingBarComposition = () => (
  <Composition
    id="DivergingBar"
    component={DivergingBar}
    schema={DivergingBarSchema}
    calculateMetadata={standardMetadata<DivergingBarData>(12)}
    defaultProps={{ data: divergingBarSampleData as DivergingBarData }}
  />
);
