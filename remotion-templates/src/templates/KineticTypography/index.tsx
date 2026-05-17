import { Composition } from "remotion";
import { KineticTypography } from "./KineticTypography";
import { standardMetadata } from "../../utils/composition";
import { QuoteDataSchema } from "./schema";
import type { QuoteData } from "./types";
import sampleData from "../../../data/episodes/silicon-trap/kinetic-morris-chang.json";

export const KineticTypographyComposition = () => (
  <Composition
    id="KineticTypography"
    component={KineticTypography}
    schema={QuoteDataSchema}
    calculateMetadata={standardMetadata<QuoteData>(6)}
    defaultProps={{ data: sampleData as QuoteData }}
  />
);
