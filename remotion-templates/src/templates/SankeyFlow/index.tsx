import { Composition } from "remotion";
import { SankeyFlow } from "./SankeyFlow";
import { standardMetadata } from "../../utils/composition";
import { SankeyFlowSchema } from "./schema";
import type { SankeyFlowData } from "./types";

const sampleData: SankeyFlowData = {
  episode: "silicon-trap",
  title: "CHIPS ACT FUNDING FLOW",
  subtitle: "From authorization to disbursement",
  nodes: [
    { id: "authorized", label: "Authorized", value: 52.7, column: 0, color: "#E5A544" },
    { id: "awarded", label: "Awarded", value: 30.9, column: 1, color: "#E5A544" },
    { id: "disbursed", label: "Disbursed", value: 6, column: 2, color: "#C23B22" },
    { id: "unawarded", label: "Not Yet Awarded", value: 21.8, column: 1, color: "#6A6458" },
    { id: "undisbursed", label: "Awarded, Not Disbursed", value: 24.9, column: 2, color: "#6A6458" },
  ],
  links: [
    { from: "authorized", to: "awarded", value: 30.9 },
    { from: "authorized", to: "unawarded", value: 21.8, color: "#6A6458" },
    { from: "awarded", to: "disbursed", value: 6 },
    { from: "awarded", to: "undisbursed", value: 24.9, color: "#6A6458" },
  ],
  valuePrefix: "$",
  valueSuffix: "B",
  source: "CHIPS for America, U.S. Department of Commerce",
  durationSec: 8,
};

export const SankeyFlowComposition = () => (
  <Composition
    id="SankeyFlow"
    component={SankeyFlow}
    schema={SankeyFlowSchema}
    calculateMetadata={standardMetadata<SankeyFlowData>(8)}
    defaultProps={{ data: sampleData as SankeyFlowData }}
  />
);
