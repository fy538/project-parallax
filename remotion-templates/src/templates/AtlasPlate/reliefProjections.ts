/**
 * Shared canonical list of projections that the `atlas-relief` aesthetic
 * supports — read by:
 *
 *   • src/templates/AtlasPlate/ReliefUnderlay.tsx (runtime gate)
 *   • scripts/prepare-shaded-relief.mjs            (warp targets)
 *   • src/__tests__/reliefUnderlay.test.ts          (contract tests)
 *
 * Adding a new projection to atlas-relief means:
 *   1. Append the name here (must match ProjectionName from atlasProjection.ts).
 *   2. Map the name to a d3-geo projection factory inside the warp script's
 *      PROJECTIONS object.
 *   3. Re-run `node scripts/prepare-shaded-relief.mjs` to produce the warp.
 *
 * Why a string-typed array rather than `ProjectionName[]`: the warp script
 * is plain `.mjs` (no TS imports) and reads this file via a small parser
 * shim. Keeping the export as a plain `as const` string tuple lets both
 * sides agree on the list without a TS-build step in the warp pipeline.
 */

export const RELIEF_SUPPORTED_PROJECTIONS = [
  "equalEarth",
  "naturalEarth",
  "equirectangular",
] as const;

export type ReliefSupportedProjection =
  (typeof RELIEF_SUPPORTED_PROJECTIONS)[number];
