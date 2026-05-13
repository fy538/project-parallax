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
  CatalogRouteRomeRadial,
  CatalogRouteMagellan,
  CatalogRouteChokepoints,
  CatalogAtlasCocom,
  CatalogAtlasColdWarVintage,
  CatalogProportionalFabs,
  CatalogCartogramEU,
  CatalogDensityFabs,
} from "./Maps";

export {
  CatalogStatApollo,
  CatalogStatMariana,
  CatalogStatHabitable,
  CatalogChartMountains,
  CatalogChartSpaceRace,
  CatalogChartAxelrodLollipop,
  CatalogChartOlympicsSmallMultiples,
  CatalogTsCO2,
  CatalogTsPopulation,
  CatalogTsLifeExpectancySlope,
  CatalogTsPopulationSmallMultiples,
  CatalogGaugeWeather,
  CatalogGaugeScorecard,
  CatalogBayesVenice,
  CatalogRadarAthletes,
  CatalogSankeyEnergy,
  CatalogWaterfallCoffee,
  CatalogIsotypeChips,
  CatalogWaterfallMotionStill,
  CatalogWaterfallMotionBriefing,
  CatalogWaterfallMotionDocumentary,
  CatalogBumpGDP,
  CatalogPyramidChina,
  CatalogRankChangeSemiconductors,
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
  CatalogTitleEditorial,
} from "./Titles";

export {
  CatalogFwComparison,
  CatalogFwFlow,
  CatalogFwMatrix,
  CatalogNwHubSpoke,
  CatalogSplitMaps,
  CatalogSplitTime,
  CatalogDuelingEmpireFall,
  CatalogDuelingBlockadesSubstrate,
} from "./Diagrams";

export {
  CatalogTimelineComputers,
  CatalogTimelineDualPandemics,
  CatalogTimelineDualRevolutionsPhase,
  CatalogLadderColdWar,
  CatalogLadderArms,
  CatalogTimelineComparisonRevolutions,
  CatalogDualImperialTransitions,
  // CatalogMorphBlockades retired May 13, 2026 — migrated to
  // CatalogDuelingBlockadesSubstrate (exported above from Diagrams).
} from "./Timelines";

export {
  CatalogImageArchive,
  CatalogMontageTreatments,
  CatalogAnnotatedDemo,
} from "./Cinematic";

export {
  CatalogTreeChess,
  CatalogTreeExCommLadder,
  CatalogGameChess,
  CatalogGamePayoff,
  CatalogGamePDCanonical,
  CatalogGameIteratedPD,
  // CatalogBifurcationCocom removed May 13, 2026 with BifurcationRoute template.
} from "./Scenarios";

export {
  CatalogEditorialHero,
  CatalogEditorialAside,
  CatalogEditorialMinimal,
} from "./Editorial";

export { CatalogShowreel } from "./Showreel";

export { CatalogEmphasisShowcase } from "./EmphasisShowcase";

export { CatalogTemplatePreview, PREVIEW_TEMPLATES } from "./TemplatePreview";
