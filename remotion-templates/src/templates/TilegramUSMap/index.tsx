import { Composition } from "remotion";
import { TilegramUSMap } from "./TilegramUSMap";
import { layout } from "../../design/theme";
import { standardMetadata } from "../../utils/composition";
import { TilegramUSMapSchema } from "./schema";
import type { TilegramUSMapData, USStateCode } from "./types";

// 2024 presidential electoral results — every state at equal weight.
// Encoding: value = -1 for Trump (R), +1 for Harris (D). With the
// `"diverging"` color scale, -1 maps to rust (semantic.china) and +1
// maps to muted blue (semantic.us); the bone midpoint is unreachable
// here by design — every state is one side or the other.
//
// `label` carries the state's electoral-vote count for the small
// numeric drop beneath the postal abbreviation. 538 total electoral
// votes, 270 to win.

// NB: New Hampshire went FOR Harris in 2024 (50.7% / 47.9%) — listed in
// HARRIS_STATES below. With NH in the correct column the EV totals match
// the actual 2024 result: Trump 312 / Harris 226 (total 538).
//
// Maine and Nebraska split by congressional district in real elections.
// For this sample we attribute each state's whole EV count to its
// statewide winner (ME → Harris; NE → Trump). ME-02 (1 EV → Trump in
// 2024) and NE-02 (1 EV → Harris in 2024) are therefore aggregated into
// their statewide majorities. A production-quality electoral template
// would need a district-level layout to capture this correctly.
const TRUMP_STATES: Record<string, number> = {
  AK: 3, AL: 9, AR: 6, AZ: 11, FL: 30, GA: 16, IA: 6, ID: 4, IN: 11,
  KS: 6, KY: 8, LA: 8, MI: 15, MO: 10, MS: 6, MT: 4, NC: 16, ND: 3,
  NE: 5, NV: 6, OH: 17, OK: 7, PA: 19, SC: 9, SD: 3, TN: 11,
  TX: 40, UT: 6, WI: 10, WV: 4, WY: 3,
};

const HARRIS_STATES: Record<string, number> = {
  CA: 54, CO: 10, CT: 7, DC: 3, DE: 3, HI: 4, IL: 19, MA: 11, MD: 10,
  ME: 4, MN: 10, NH: 4, NJ: 14, NM: 5, NY: 28, OR: 8, RI: 4, VA: 13, VT: 3,
  WA: 12,
};

const buildStates = (): TilegramUSMapData["states"] => {
  const out: TilegramUSMapData["states"] = [];
  for (const [code, ev] of Object.entries(TRUMP_STATES)) {
    out.push({
      state: code as USStateCode,
      value: -1,
      label: `${ev}`,
    });
  }
  for (const [code, ev] of Object.entries(HARRIS_STATES)) {
    out.push({
      state: code as USStateCode,
      value: 1,
      label: `${ev}`,
    });
  }
  return out;
};

const sampleData: TilegramUSMapData = {
  episode: "catalog",
  title: "2024 Presidential Electoral Map",
  subtitle:
    "Every state, equal weight — the map without geographic distortion",
  states: buildStates(),
  colorScale: "diverging",
  valueLabel: "2024 result (Trump ← → Harris)",
  source: "Associated Press final tally",
  durationSec: 12,
};

export const TilegramUSMapComposition = () => (
  <Composition
    id="TilegramUSMap"
    component={TilegramUSMap}
    schema={TilegramUSMapSchema}
    calculateMetadata={standardMetadata<TilegramUSMapData>(12)}
    defaultProps={{ data: sampleData as TilegramUSMapData }}
  />
);
