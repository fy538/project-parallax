/**
 * DecisionTree template registration.
 *
 * Sample composition for branching scenario/decision tree diagrams.
 * Demonstrates a Taiwan Strait crisis decision tree with probabilities
 * and a highlighted path showing one possible escalation sequence.
 */

import { Composition } from "remotion";
import { DecisionTree } from "./DecisionTree";
import { standardMetadata } from "../../utils/composition";
import { DecisionTreeSchema } from "./schema";
import type { DecisionTreeData } from "./types";

// silicon-trap data — AI timeline branching scenario
import sampleData from "../../../data/episodes/silicon-trap/decisiontree-ai-timeline.json";

export const DecisionTreeComposition = () => (
  <Composition
    id="DecisionTree"
    component={DecisionTree}
    schema={DecisionTreeSchema}
    calculateMetadata={standardMetadata<DecisionTreeData>(12)}
    defaultProps={{ data: sampleData as DecisionTreeData }}
  />
);
