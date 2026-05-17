import { Composition } from "remotion";
import { Streamgraph } from "./Streamgraph";
import { standardMetadata } from "../../utils/composition";
import { palette } from "../../design/theme";
import { StreamgraphSchema } from "./schema";
import type { StreamgraphData, StreamSeries } from "./types";

// ── Sample data ──────────────────────────────────────────────────────────
// US oil imports by source country, 1970–2024. Decadal benchmarks from
// the editorial brief; intermediate years linearly interpolated so the
// monotone-cubic spline has enough x-resolution to produce a smooth
// river without overshooting the benchmark values.
const BENCHMARKS: Array<{
  x: number;
  sa: number;
  ca: number;
  mx: number;
  vz: number;
  other: number;
}> = [
  { x: 1970, sa: 6,  ca: 30, mx: 4,  vz: 28, other: 32 },
  { x: 1980, sa: 22, ca: 17, mx: 17, vz: 10, other: 34 },
  { x: 1990, sa: 25, ca: 16, mx: 17, vz: 16, other: 26 },
  { x: 2000, sa: 18, ca: 19, mx: 17, vz: 14, other: 32 },
  { x: 2010, sa: 16, ca: 25, mx: 16, vz: 11, other: 32 },
  { x: 2020, sa: 7,  ca: 51, mx: 14, vz: 1,  other: 27 },
  { x: 2024, sa: 5,  ca: 55, mx: 16, vz: 1,  other: 23 },
];

// Linearly interpolate each series to a denser x-grid. Resolution is
// chosen so we end up with 13 points total — one per benchmark plus 6
// midpoints — enough that the monotone-cubic spline reads smooth without
// overworking the geometry.
function buildSeries() {
  const points: Array<{
    x: number;
    sa: number;
    ca: number;
    mx: number;
    vz: number;
    other: number;
  }> = [];
  for (let i = 0; i < BENCHMARKS.length - 1; i++) {
    const a = BENCHMARKS[i];
    const b = BENCHMARKS[i + 1];
    points.push(a);
    // Insert one midpoint between consecutive benchmarks.
    points.push({
      x: Math.round((a.x + b.x) / 2),
      sa: (a.sa + b.sa) / 2,
      ca: (a.ca + b.ca) / 2,
      mx: (a.mx + b.mx) / 2,
      vz: (a.vz + b.vz) / 2,
      other: (a.other + b.other) / 2,
    });
  }
  points.push(BENCHMARKS[BENCHMARKS.length - 1]);
  return points;
}

const grid = buildSeries();
const xs = grid.map((p) => p.x);

const series: StreamSeries[] = [
  {
    id: "saudi",
    label: "Saudi Arabia",
    color: palette.rust,
    values: xs.map((x, i) => ({ x, value: grid[i].sa })),
  },
  {
    id: "canada",
    label: "Canada",
    color: palette.amber,
    values: xs.map((x, i) => ({ x, value: grid[i].ca })),
  },
  {
    id: "mexico",
    label: "Mexico",
    color: palette.bronze,
    values: xs.map((x, i) => ({ x, value: grid[i].mx })),
  },
  {
    id: "venezuela",
    label: "Venezuela",
    color: palette.olive,
    values: xs.map((x, i) => ({ x, value: grid[i].vz })),
  },
  {
    id: "other",
    label: "Other",
    color: palette.bone,
    values: xs.map((x, i) => ({ x, value: grid[i].other })),
  },
];

const sampleData: StreamgraphData = {
  episode: "catalog",
  title: "Where America Gets Its Oil",
  subtitle:
    "Imports by source, 1970–2024 — the Saudi era yields to the neighbors",
  series,
  xAxisLabel: "Year",
  offset: "silhouette",
  valueFormat: "percent",
  source: "EIA Monthly Energy Review",
  durationSec: 14,
};

export const StreamgraphComposition = () => (
  <Composition
    id="Streamgraph"
    component={Streamgraph}
    schema={StreamgraphSchema}
    calculateMetadata={standardMetadata<StreamgraphData>(12)}
    defaultProps={{ data: sampleData as StreamgraphData }}
  />
);
