import { Composition } from "remotion";
import { NetworkDiagram } from "./NetworkDiagram";
import { layout, sec } from "../../design/theme";
import { NetworkDiagramSchema } from "./schema";
import type { NetworkDiagramData } from "./types";

// Sample data for Remotion Studio preview
const sampleData: NetworkDiagramData = {
  episode: "silicon-trap",
  title: "SEMICONDUCTOR SUPPLY CHAIN",
  subtitle: "No country can replicate this alone",
  layout: "horizontal-chain",
  nodes: [
    // Chain has no editorial hub — every node renders at the uniform
    // satellite size. `importance: "primary"` is reserved for the
    // hub-spoke layout's chokepoint node (see CircleNode for what blooms).
    {
      id: "us",
      label: "USA",
      sublabel: "EDA Software",
      type: "nation",
      color: "#3266AD", // episode-specific — not a brand token
    },
    {
      id: "nl",
      label: "Netherlands",
      sublabel: "ASML (EUV)",
      type: "nation",
      color: "#E5A544", // episode-specific — not a brand token
    },
    {
      id: "tw",
      label: "Taiwan",
      sublabel: "TSMC (Fab)",
      type: "nation",
      color: "#E5A544", // episode-specific — not a brand token
    },
    {
      id: "jp",
      label: "Japan",
      sublabel: "Photoresist",
      type: "nation",
      color: "#E5A544", // episode-specific — not a brand token
    },
    {
      id: "cn",
      label: "China",
      sublabel: "Assembly + Rare Earths",
      type: "nation",
      color: "#C23B22", // episode-specific — not a brand token
    },
  ],
  edges: [
    {
      from: "us",
      to: "nl",
      style: "solid",
      label: "Design tools",
    },
    {
      from: "nl",
      to: "tw",
      style: "solid",
      label: "EUV machines",
    },
    {
      from: "jp",
      to: "tw",
      style: "solid",
      label: "Materials",
    },
    {
      from: "tw",
      to: "cn",
      style: "dashed",
      label: "Restricted",
    },
  ],
  controls: [
    {
      edge: ["tw", "cn"],
      label: "EXPORT CONTROLS",
      color: "#C23B22", // episode-specific — not a brand token
    },
  ],
  callouts: [
    {
      value: "$1T",
      label: "Estimated cost of full self-sufficiency",
      position: "bottom-right",
    },
  ],
  source: "CSIS, SEMI, company filings",
  durationSec: 12,
};

export const NetworkDiagramComposition = () => (
  <Composition
    id="NetworkDiagram"
    component={NetworkDiagram}
    schema={NetworkDiagramSchema}
    calculateMetadata={({ props }) => ({
      durationInFrames: sec((props.data as NetworkDiagramData).durationSec || 10),
      fps: layout.fps,
      width: layout.width,
      height: layout.height,
    })}
    defaultProps={{ data: sampleData as NetworkDiagramData }}
  />
);
