import { Composition } from "remotion";
import { ArcDiagram } from "./ArcDiagram";
import { layout, sec } from "../../design/theme";
import { ArcDiagramSchema } from "./schema";
import type { ArcDiagramData } from "./types";

// Sample data: the intellectual lineage of American grand strategy.
// Five strategic thinkers across ~80 years, with arcs encoding how
// each generation extended, rebutted, or synthesized the last. The
// non-adjacent arc (Mahan → Spykman, skipping Mackinder) is the
// editorial point: rim-land theory recovered the sea-power thesis
// after Mackinder's continentalist detour.
const sampleData: ArcDiagramData = {
  episode: "catalog",
  title: "The Lineage of American Grand Strategy",
  subtitle:
    "Five strategic thinkers, eighty years — each generation extending, rebutting, or recovering the last",
  nodes: [
    {
      id: "mahan",
      label: "Mahan",
      sublabel: "Sea Power",
      axisStamp: "1890",
      importance: "primary",
    },
    {
      id: "mackinder",
      label: "Mackinder",
      sublabel: "Heartland",
      axisStamp: "1904",
    },
    {
      id: "spykman",
      label: "Spykman",
      sublabel: "Rimland",
      axisStamp: "1942",
    },
    {
      id: "kennan",
      label: "Kennan",
      sublabel: "Containment",
      axisStamp: "1947",
      importance: "primary",
      color: "accent",
    },
    {
      id: "brzezinski",
      label: "Brzezinski",
      sublabel: "Grand Chessboard",
      axisStamp: "1997",
    },
  ],
  connections: [
    { from: "mahan", to: "mackinder", label: "inverted", strength: 0.7, emphasis: "accent" },
    { from: "mackinder", to: "spykman", label: "rebutted", strength: 0.8, style: "dashed", emphasis: "muted" },
    { from: "mahan", to: "spykman", label: "recovered", strength: 0.9 },
    { from: "spykman", to: "kennan", label: "operationalized", strength: 1.0, color: "accent" },
    { from: "kennan", to: "brzezinski", label: "extended", strength: 0.8 },
    { from: "mackinder", to: "brzezinski", label: "rehabilitated", strength: 0.6, style: "dashed" },
  ],
  eras: [
    {
      label: "Sea Power Era",
      range: [0, 1],
      color: "#E5A544",
    },
    {
      label: "Containment Era",
      range: [2, 3],
      color: "#C23B22",
    },
  ],
  axisTitle: "Century",
  source: "Standard surveys of strategic-studies historiography",
  durationSec: 14,
};

export const ArcDiagramComposition = () => (
  <Composition
    id="ArcDiagram"
    component={ArcDiagram}
    schema={ArcDiagramSchema}
    calculateMetadata={({ props }) => ({
      durationInFrames: sec((props.data as ArcDiagramData).durationSec ?? 12),
      fps: layout.fps,
      width: layout.width,
      height: layout.height,
    })}
    defaultProps={{ data: sampleData as ArcDiagramData }}
  />
);
