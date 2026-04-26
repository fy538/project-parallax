/**
 * DecisionTree template registration.
 *
 * Sample composition for branching scenario/decision tree diagrams.
 * Demonstrates a Taiwan Strait crisis decision tree with probabilities
 * and a highlighted path showing one possible escalation sequence.
 */

import { Composition } from "remotion";
import { DecisionTree } from "./DecisionTree";
import { layout, sec } from "../../design/theme";
import { DecisionTreeSchema } from "./schema";
import type { DecisionTreeData } from "./types";

const sampleData: DecisionTreeData = {
  episode: "EP00",
  title: "Taiwan Strait Crisis — Decision Tree",
  subtitle: "What happens if tensions escalate?",
  rootId: "root",
  nodes: [
    {
      id: "root",
      label: "Status Quo\nTensions Rise",
      children: ["blockade", "negotiate"],
    },
    {
      id: "blockade",
      label: "China Declares\nBlockade",
      probability: "25%",
      children: ["us-respond", "us-sanction"],
      highlighted: true,
    },
    {
      id: "negotiate",
      label: "Diplomatic\nChannel Opens",
      probability: "75%",
      children: ["deal", "stall"],
    },
    {
      id: "us-respond",
      label: "US Naval\nEscort",
      probability: "40%",
      highlighted: true,
      active: true,
      marketPrice: "72.5",
    },
    {
      id: "us-sanction",
      label: "US Sanctions\nOnly",
      probability: "60%",
    },
    {
      id: "deal",
      label: "Framework\nAgreement",
    },
    {
      id: "stall",
      label: "Talks Stall",
    },
  ],
  highlightedPath: ["root", "blockade", "us-respond"],
  highlightColor: "#E5A544",
  source: "Scenario analysis — illustrative only",
  durationSec: 12,
};

export const DecisionTreeComposition = () => (
  <Composition
    id="DecisionTree"
    component={DecisionTree}
    schema={DecisionTreeSchema}
    calculateMetadata={({ props }) => ({
      durationInFrames: sec((props.data as DecisionTreeData).durationSec || 12),
      fps: layout.fps,
      width: layout.width,
      height: layout.height,
    })}
    defaultProps={{ data: sampleData }}
  />
);
