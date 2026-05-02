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

// EP01 data — AI timeline branching scenario
import sampleData from "../../../data/episodes/ep01/decisiontree-ai-timeline.json";

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
    defaultProps={{ data: sampleData as unknown as DecisionTreeData }}
  />
);
