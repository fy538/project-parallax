/**
 * Catalog index — re-exports all catalog Composition entries grouped by
 * category. Imported by Root.tsx to populate the `Catalog/` folder in
 * Remotion Studio.
 *
 * To add a new template variant:
 *   1. Add the data + Composition export to the relevant category file
 *      (Maps.tsx, Data.tsx, Typography.tsx, Titles.tsx, Diagrams.tsx).
 *   2. Add the export to the right group below.
 *   3. (Optional) Add it to Showreel.tsx so it appears in the mega-reel.
 */

export {
  CatalogChoroplethG7,
  CatalogChoroplethBlocs,
  CatalogChoroplethTordesillas,
  CatalogRouteSilkRoad,
  CatalogRouteMagellan,
  CatalogRouteChokepoints,
} from "./Maps";

export {
  CatalogStatApollo,
  CatalogStatMariana,
  CatalogStatHabitable,
  CatalogChartMountains,
  CatalogChartSpaceRace,
  CatalogTsCO2,
  CatalogTsPopulation,
  CatalogGaugeWeather,
  CatalogGaugeScorecard,
  CatalogBayesVenice,
  CatalogRadarAthletes,
  CatalogSankeyEnergy,
} from "./Data";

export {
  CatalogQuoteHeraclitus,
  CatalogDefinitionAnagnorisis,
  CatalogBilingualTianxia,
  CatalogStatisticLighthouse,
} from "./Typography";

export {
  CatalogTitleEpisode,
  CatalogTitleSection,
  CatalogTitleEndCard,
} from "./Titles";

export {
  CatalogFwComparison,
  CatalogFwFlow,
  CatalogFwMatrix,
  CatalogNwHubSpoke,
  CatalogNwChain,
  CatalogSplitMaps,
  CatalogSplitTime,
} from "./Diagrams";

export { CatalogShowreel } from "./Showreel";
