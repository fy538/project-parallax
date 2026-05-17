import { Composition } from "remotion";
import { TernaryPlot } from "./TernaryPlot";
import { standardMetadata } from "../../utils/composition";
import { TernaryPlotSchema } from "./schema";
import type { TernaryPlotData } from "./types";

// ── Sample data ─────────────────────────────────────────────────────────
// Illustrative aggregation: ~30 UN Security Council resolutions plotted
// by which bloc they aligned with. (a) US bloc support, (b) China bloc,
// (c) Russia bloc — each row sums to 100. Three clusters + a handful of
// centrist resolutions clustering near the centroid demonstrate the
// editorial use case: "most resolutions live near one corner; the
// interesting ones are the few that split three ways."
//
// Data is illustrative, not from any real tally — used only to exercise
// the template.
const sampleData: TernaryPlotData = {
  episode: "EP00",
  title: "UN Security Council Vote Alignment, 2020–2024",
  subtitle: "Each resolution as a point — Washington, Beijing, Moscow",
  axisLabels: {
    a: "US bloc",
    b: "China bloc",
    c: "Russia bloc",
  },
  points: [
    // ── Pro-US cluster (high a) ──
    { id: "ukraine-invasion", label: "Ukraine invasion", a: 80, b: 10, c: 10, highlight: true },
    { id: "taiwan-strait", label: "Taiwan strait stability", a: 70, b: 20, c: 10, highlight: true },
    { id: "myanmar-junta", a: 78, b: 12, c: 10 },
    { id: "venezuela-elections", a: 75, b: 13, c: 12 },
    { id: "belarus-rights", a: 82, b: 8, c: 10 },
    { id: "moldova-sovereignty", a: 76, b: 14, c: 10 },
    { id: "uyghur-rights", a: 74, b: 16, c: 10 },
    { id: "hong-kong-law", a: 72, b: 18, c: 10 },
    { id: "north-korea-launches", a: 68, b: 22, c: 10 },
    { id: "sanctions-russia", label: "Sanctions vote", a: 60, b: 15, c: 25, highlight: true },

    // ── Pro-China cluster (high b) ──
    { id: "south-china-sea", a: 18, b: 70, c: 12 },
    { id: "taiwan-arms-block", a: 15, b: 75, c: 10 },
    { id: "huawei-procurement", a: 12, b: 78, c: 10 },
    { id: "bri-financing", a: 14, b: 74, c: 12 },
    { id: "wto-tech-rules", a: 20, b: 68, c: 12 },
    { id: "rcep-coordination", a: 22, b: 65, c: 13 },

    // ── Pro-Russia cluster (high c) ──
    { id: "syria-mandate", a: 15, b: 20, c: 65 },
    { id: "wagner-cmma", a: 12, b: 18, c: 70 },
    { id: "crimea-status", a: 10, b: 15, c: 75 },
    { id: "central-asia-bases", a: 14, b: 22, c: 64 },
    { id: "donbass-monitor", a: 16, b: 19, c: 65 },

    // ── Three-way splits (centrist cluster) ──
    { id: "iran-nuclear", label: "Iran nuclear deal", a: 50, b: 30, c: 20, highlight: true },
    { id: "climate-paris-followon", label: "Climate financing", a: 40, b: 40, c: 20, highlight: true },
    { id: "afghanistan-aid", a: 38, b: 35, c: 27 },
    { id: "sahel-peacekeeping", a: 42, b: 30, c: 28 },
    { id: "haiti-mission", a: 45, b: 32, c: 23 },
    { id: "sudan-rapid-support", a: 36, b: 38, c: 26 },
    { id: "yemen-ceasefire", a: 41, b: 34, c: 25 },
    { id: "pandemic-treaty", a: 44, b: 33, c: 23 },
    { id: "ai-governance", a: 47, b: 31, c: 22 },
  ],
  gridlines: true,
  centroid: true,
  source: "UN General Assembly voting records 2020–2024; illustrative aggregation",
  durationSec: 14,
};

export const TernaryPlotComposition = () => (
  <Composition
    id="TernaryPlot"
    component={TernaryPlot}
    schema={TernaryPlotSchema}
    calculateMetadata={standardMetadata<TernaryPlotData>(14)}
    defaultProps={{ data: sampleData }}
  />
);
