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
  // G7 / Blocs / Tordesillas migrated to AtlasPlate May 13, 2026.
  CatalogAtlasG7,
  CatalogAtlasBlocs,
  CatalogAtlasTordesillas,
  CatalogRouteSilkRoad,
  CatalogRouteSilkRoadToner,
  CatalogRouteRomeRadial,
  CatalogRouteMagellan,
  CatalogRouteChokepoints,
  CatalogAtlasCocom,
  CatalogAtlasColdWarVintage,
  CatalogAtlasReliefHimalaya,
  CatalogProportionalFabs,
  CatalogCartogramEU,
  CatalogDensityFabs,
  CatalogTilegramElectoral,
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
  CatalogBeeswarmMilitary,
  CatalogCalendarIsraelIran,
  CatalogCalendarFedRates,
  CatalogScatterPhillips,
  CatalogStreamgraphOil,
  CatalogStreamgraphFlags,
  CatalogRidgelineLifeExpectancy,
  CatalogMarimekkoEnergy,
  CatalogMarimekkoEnergyEmphasis,
  CatalogTernaryUN,
  CatalogHorizonBRICS,
  CatalogHorizonBRICSShared,
  CatalogDumbbellIncome,
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
  CatalogNwBipartite,
  CatalogSplitMaps,
  CatalogSplitTime,
  CatalogDuelingEmpireFall,
  CatalogDuelingBlockadesSubstrate,
  CatalogArcDiagram,
  CatalogStrategicLandscape,
  CatalogTernaryUKVoter,
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

// Exploratory editorial-direction compositions (A/B/C). Standalone
// compositions that bypass EditorialFrame + DataChart to evaluate three
// structural directions for moving the catalog out of PowerPoint register.
// Iteration set uses the Axelrod cooperation data (clean linear scale).
// Diffusion set stress-tests each direction against the 4 vs 890 skew.
export {
  CatalogEditorialDirectionA,
  CatalogEditorialDirectionB,
  CatalogEditorialDirectionC,
  CatalogEditorialDirectionADiffusion,
  CatalogEditorialDirectionBDiffusion,
  CatalogEditorialDirectionCDiffusion,
} from "./EditorialDirections";

// Text-animation reference showcase — eight techniques side-by-side on real
// Parallax content. Use this to pick which techniques to extract into
// reusable hooks/components after seeing them in motion.
export { CatalogTextAnimationShowcase } from "./TextAnimationShowcase";

// Composite editorial patterns — high-level choreography components that
// compose atomic text-animation primitives into named patterns the
// visual-spec skill thinks in (DefinitionReveal, StatCaption,
// QuoteAttribution + ConceptCallback pulse for cross-episode continuity).
export { CatalogCompositePatternsShowcase } from "./CompositePatternsShowcase";

// Hold-motion register showcase — 3×2 mosaic of the six drift presets on
// identical content. The visual-vocabulary card script writers consult
// before reaching for `DIR: drift(<preset>)`. See HOLD_MOTION_REGISTER.md
// + POLISH.md D20.
export { CatalogDriftRegisterShowcase } from "./DriftRegisterShowcase";

export { CatalogShowreel } from "./Showreel";
export { CatalogShowreelBackdrops } from "./ShowreelBackdrops";

export { CatalogEmphasisShowcase } from "./EmphasisShowcase";

export { CatalogTemplatePreview, PREVIEW_TEMPLATES } from "./TemplatePreview";
