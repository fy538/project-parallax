import { Composition } from "remotion";
import { PricingWaterfall } from "./PricingWaterfall";
import { PricingWaterfallSchema } from "./schema";
import type { PricingWaterfallData } from "./types";
import { standardMetadata } from "../../utils/composition";
import { CATALOG_EPISODE } from "../../catalog/helpers";

const sampleData: PricingWaterfallData = {
  episode: CATALOG_EPISODE,
  title: "Where Your $5 Cup Goes",
  subtitle: "The coffee bean's journey from Yirgacheffe to Williamsburg",
  total: {
    value: "$5",
    label: "specialty coffee, retail",
  },
  stages: [
    { label: "Farm", share: 3, descriptor: "Yirgacheffe, Ethiopia", hero: true },
    { label: "Cooperative", share: 5, descriptor: "Wash & dry" },
    { label: "Exporter", share: 8, descriptor: "Addis Ababa" },
    { label: "Importer", share: 14, descriptor: "Hamburg" },
    { label: "Roaster", share: 25, descriptor: "Brooklyn" },
    { label: "Café", share: 45, descriptor: "Williamsburg" },
  ],
  source: "Specialty Coffee Association reports; representative figures",
  durationSec: 10,
  frame: {
    kicker: "VALUE CAPTURE",
    title: "The farmer gets three cents on the dollar.",
    dek: "Where each five-dollar specialty cup actually goes. The first link of the chain captures the smallest share.",
    heroStat: {
      value: "3%",
      placement: "left-rail",
      weight: "display",
      color: "#C4A747",
    },
    layout: "hero-split",
    splitRatio: [38, 62],
    chrome: "publication",
    source: "Specialty Coffee Association — penny breakdown reports (representative).",
    modeTag: "supply chain · catalog",
    legend: "suppressed",
  },
};

export const PricingWaterfallComposition: React.FC = () => (
  <Composition
    id="PricingWaterfall"
    component={PricingWaterfall}
    schema={PricingWaterfallSchema}
    calculateMetadata={standardMetadata<PricingWaterfallData>(10)}
    defaultProps={{ data: sampleData }}
  />
);
