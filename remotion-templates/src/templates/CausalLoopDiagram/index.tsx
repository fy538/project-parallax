import { Composition } from "remotion";
import { CausalLoopDiagram } from "./CausalLoopDiagram";
import { standardMetadata } from "../../utils/composition";
import { CausalLoopDiagramSchema } from "./schema";
import type { CausalLoopDiagramData } from "./types";

// Default props — security-dilemma arms race (the textbook CLD example).
// US arms buildup → China threat perception → China arms buildup → US threat
// perception → back to US arms buildup. Reinforcing loop = no equilibrium.
export const causalLoopDiagramSampleData: CausalLoopDiagramData = {
  episode: "security-dilemma",
  title: "THE SECURITY DILEMMA",
  subtitle: "How defensive moves become arms races",
  nodes: [
    {
      id: "us-arms",
      label: "US arms\nbuildup",
      position: { x: 22, y: 32 },
      emphasis: "primary",
    },
    {
      id: "china-threat",
      label: "China's threat\nperception",
      position: { x: 78, y: 32 },
    },
    {
      id: "china-arms",
      label: "China arms\nbuildup",
      position: { x: 78, y: 72 },
    },
    {
      id: "us-threat",
      label: "US threat\nperception",
      position: { x: 22, y: 72 },
    },
  ],
  edges: [
    { from: "us-arms", to: "china-threat", polarity: "+", curve: "right" },
    { from: "china-threat", to: "china-arms", polarity: "+", delay: true, curve: "right" },
    { from: "china-arms", to: "us-threat", polarity: "+", curve: "right" },
    { from: "us-threat", to: "us-arms", polarity: "+", delay: true, curve: "right" },
  ],
  loops: [
    {
      id: "R1",
      nodeIds: ["us-arms", "china-threat", "china-arms", "us-threat"],
      type: "R",
      label: "Arms race spiral",
      rotation: "cw",
    },
  ],
  source: "Jervis 1978; Herz 1950",
  durationSec: 12,
};

export const CausalLoopDiagramComposition = () => (
  <Composition
    id="CausalLoopDiagram"
    component={CausalLoopDiagram}
    schema={CausalLoopDiagramSchema}
    calculateMetadata={standardMetadata<CausalLoopDiagramData>(12)}
    defaultProps={{ data: causalLoopDiagramSampleData as CausalLoopDiagramData }}
  />
);
