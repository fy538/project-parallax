/**
 * Catalog — Typography category.
 *
 * KineticTypography × 4 (quote, definition, bilingual, statistic).
 * Subjects are channel-toned but episode-neutral.
 */

import { Composition } from "remotion";
import { KineticTypography } from "../templates/KineticTypography/KineticTypography";
import { QuoteDataSchema } from "../templates/KineticTypography/schema";
import type { QuoteData } from "../templates/KineticTypography/types";
import { layout, sec } from "../design/theme";
import { CATALOG_EPISODE, catalogId } from "./helpers";

const quoteHeraclitus: QuoteData = {
  episode: CATALOG_EPISODE,
  variant: "quote",
  text: "Character is destiny.",
  attribution: "Heraclitus",
  attributionContext: "Fragment B119, c. 500 BCE",
  accentColor: "#E5A544",
  durationSec: 7,
};

const definitionAnagnorisis: QuoteData = {
  episode: CATALOG_EPISODE,
  variant: "definition",
  term: "ἀναγνώρισις",
  termPinyin: "anagnōrisis",
  termTranslation: "Recognition / sudden discovery",
  definitionText: "The moment in a tragedy when a character realizes the true nature of their situation, often the cause of their downfall.",
  accentColor: "#C23B22",
  durationSec: 9,
};

const bilingualTianxia: QuoteData = {
  episode: CATALOG_EPISODE,
  variant: "bilingual",
  chineseText: "天下",
  englishText: "All under heaven",
  accentColor: "#6B1D1D",
  durationSec: 6,
};

const statisticLighthouse: QuoteData = {
  episode: CATALOG_EPISODE,
  variant: "statistic",
  statValue: "0.07%",
  statLabel: "of an empire's GDP",
  statContext: "What Rome spent on its postal system at peak operation — yet it held the empire together for centuries.",
  accentColor: "#3266AD",
  durationSec: 8,
};

const kineticComp = (id: string, data: QuoteData) => (
  <Composition
    id={id}
    component={KineticTypography}
    schema={QuoteDataSchema}
    calculateMetadata={({ props }) => ({
      durationInFrames: sec((props.data as QuoteData).durationSec || 6),
      fps: layout.fps,
      width: layout.width,
      height: layout.height,
    })}
    defaultProps={{ data }}
  />
);

export const CatalogQuoteHeraclitus = () => kineticComp(catalogId("KineticTypography", "quote"), quoteHeraclitus);
export const CatalogDefinitionAnagnorisis = () => kineticComp(catalogId("KineticTypography", "definition"), definitionAnagnorisis);
export const CatalogBilingualTianxia = () => kineticComp(catalogId("KineticTypography", "bilingual"), bilingualTianxia);
export const CatalogStatisticLighthouse = () => kineticComp(catalogId("KineticTypography", "statistic"), statisticLighthouse);

export const catalogTypographyData = {
  quoteHeraclitus, definitionAnagnorisis, bilingualTianxia, statisticLighthouse,
};
