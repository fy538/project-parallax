import { Composition } from "remotion";
import { FrameworkDiagram } from "./FrameworkDiagram";
import { standardMetadata } from "../../utils/composition";
import { FrameworkDiagramSchema } from "./schema";
import type { FrameworkDiagramData } from "./types";
import sampleData from "../../../data/episodes/silicon-trap/framework-cocom-china.json";

export const FrameworkDiagramComposition = () => (
  <Composition
    id="FrameworkDiagram"
    component={FrameworkDiagram}
    schema={FrameworkDiagramSchema}
    calculateMetadata={standardMetadata<FrameworkDiagramData>(10)}
    defaultProps={{ data: sampleData as FrameworkDiagramData }}
  />
);
