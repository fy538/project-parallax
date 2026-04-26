import { Composition } from "remotion";
import { FrameworkDiagram } from "./FrameworkDiagram";
import { layout, sec } from "../../design/theme";
import { FrameworkDiagramSchema } from "./schema";
import type { FrameworkDiagramData } from "./types";
import sampleData from "../../../data/episodes/ep01/framework-chess-go.json";

export const FrameworkDiagramComposition = () => (
  <Composition
    id="FrameworkDiagram"
    component={FrameworkDiagram}
    schema={FrameworkDiagramSchema}
    calculateMetadata={({ props }) => ({
      durationInFrames: sec((props.data as FrameworkDiagramData).durationSec || 10),
      fps: layout.fps,
      width: layout.width,
      height: layout.height,
    })}
    defaultProps={{ data: sampleData as FrameworkDiagramData }}
  />
);
