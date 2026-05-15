/**
 * MapGL — shared types + Zod schemas for the editorial Mapbox layer.
 *
 * Extracted so RouteAnimation / ChoroplethMap / DensityMap / etc. all import
 * a SINGLE source-of-truth for `labelDensity` (and any future MapGL config
 * knobs). Previously the enum was duplicated across three template
 * schemas, with drift risk every time a register was added or renamed.
 *
 * MapGL.tsx itself imports the TypeScript type only; the Zod schema lives
 * here so it can be composed into each map template's top-level schema
 * via `LabelDensitySchema.optional()` without dragging in the React render
 * code at validation time.
 */

import { z } from "zod";

/**
 * Label-density register — controls how aggressively Mapbox's automatic
 * place/road/transit labels are suppressed so editorial annotations
 * (MapAnnotations, MapTextArc) win the typographic hierarchy.
 *
 * Implemented via Mapbox Standard's `setConfigProperty` runtime API +
 * a zoom-watching effect in MapGL that re-applies as the camera animates.
 *
 *   • atlas      — full Mapbox defaults at every zoom. Orientation register.
 *   • editorial  — DEFAULT — country labels at globe scale (zoom < 4),
 *                  auto-suppress at regional zoom (zoom >= 4) so editorial
 *                  MapAnnotations dominate. FT supply-chain idiom.
 *   • minimal    — hide ALL Mapbox-generated text labels regardless of
 *                  zoom (country, region, settlement, road, POI, transit,
 *                  AND water-body / ocean labels). Verified empirically
 *                  May 13, 2026 at zoom 5. Pair with explicit
 *                  MapAnnotations for named points + MapTextArc for
 *                  ocean / sea names along an arc — the NYT / National
 *                  Geographic canonical workflow.
 *   • off        — total suppression. Functionally equivalent to
 *                  `minimal` today; reserved for future granular registers.
 *
 * Reference: references/template-research/map-annotations.md;
 * MAP_TEMPLATE_SELECTOR.md § "Label-density register."
 */
export const LabelDensitySchema = z.enum([
  "atlas",
  "editorial",
  "minimal",
  "off",
]);

export type LabelDensity = z.infer<typeof LabelDensitySchema>;

/**
 * Mapbox Standard scene lighting preset. Shifts sun angle, ambient color,
 * shadow direction across the entire basemap. Applied at runtime via
 * `setConfigProperty('basemap', 'lightPreset', value)` in MapGL.
 *
 *   • day   — neutral analytical light (default for Meridian Light)
 *   • dawn  — warm low-angle, long shadows; cold-open / "at first light"
 *   • dusk  — twilight register; matches `fogPreset: "atmospheric"` well
 *   • night — diegetic late-hour register (use with Meridian Dark)
 *
 * No-op on non-Standard styles. See MapGL.tsx § "Light presets".
 */
export const LightPresetSchema = z.enum(["day", "dawn", "dusk", "night"]);

export type LightPreset = z.infer<typeof LightPresetSchema>;

/**
 * Visual register — discriminated alternative to the previous mutex
 * booleans (`dark`, `vintage`, `toner`). One register at a time:
 *
 *   • `light`   — default Meridian Light atlas register (FALLBACK: stock light-v11)
 *   • `dark`    — Meridian Dark (FALLBACK: stock dark-v11)
 *   • `vintage` — Meridian Sepia for period episodes (FALLBACK: light-v11 + warm CSS tint)
 *   • `toner`   — Stadia × Stamen Toner for atmospheric atlas
 *                 (FALLBACK: light-v11 + grayscale CSS filter)
 *
 * Picking ONE register at a time prevents the bug where a caller passes
 * `dark: true, vintage: true` and the precedence resolution is implicit
 * in the component body. The mutex is enforced by the type system.
 *
 * Orthogonal modulators stay separate props on MapGL:
 *   • `fogPreset`   — atmosphere halo (editorial / atmospheric / vintage / none)
 *   • `lightPreset` — Mapbox Standard scene lighting (day / dawn / dusk / night)
 *   • `labelDensity` — Mapbox label suppression register
 * These compose ON TOP of the register choice. A `vintage` register can
 * still have `lightPreset: "dusk"`.
 */
export const RegisterSchema = z.enum(["light", "dark", "vintage", "toner"]);
export type Register = z.infer<typeof RegisterSchema>;
