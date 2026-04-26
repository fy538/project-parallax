import { Composition } from "remotion";
import { KineticTypography } from "./KineticTypography";
import { layout, sec } from "../../design/theme";
import { QuoteDataSchema } from "./schema";
import type { QuoteData } from "./types";
import sampleData from "../../../data/episodes/ep01/kinetic-morris-chang.json";

export const KineticTypographyComposition = () => (
  <Composition
    id="KineticTypography"
    component={KineticTypography}
    schema={QuoteDataSchema}
    calculateMetadata={({ props }) => ({
      durationInFrames: sec((props.data as QuoteData).durationSec || 6),
      fps: layout.fps,
      width: layout.width,
      height: layout.height,
    })}
    defaultProps={{ data: sampleData as QuoteData }}
  />
);
