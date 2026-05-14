/**
 * Catalog — Maps category.
 *
 * AtlasPlate × 5 variants: cocom, cold-war-vintage, g7, cold-war-blocs, tordesillas
 * RouteAnimation × 4 variants: silk-road, magellan, chokepoints, rome-radial
 * ProportionalSymbolMap × 1 (fabs) · CartogramMap × 1 (eu) · DensityMap × 1 (fabs)
 * TilegramUSMap × 1 (electoral-2024)
 *
 * Subjects are historical/cartographic — Parallax-toned but not episode candidates.
 *
 * May 13, 2026 — G7 / Cold War Blocs / Tordesillas migrated from
 * ChoroplethMap (Mapbox) to AtlasPlate (pure SVG); ChoroplethMap is now
 * reserved for atmospheric / terrain-required shots per the
 * Mapbox→AtlasPlate doctrine. See MAP_TEMPLATE_SELECTOR.md.
 */

import { Composition } from "remotion";
import { RouteAnimation } from "../templates/RouteAnimation/RouteAnimation";
import { RouteAnimationSchema } from "../templates/RouteAnimation/schema";
import type { RouteAnimationData } from "../templates/RouteAnimation/types";
import { AtlasPlate } from "../templates/AtlasPlate/AtlasPlate";
import { AtlasPlateSchema } from "../templates/AtlasPlate/schema";
import type { AtlasPlateData } from "../templates/AtlasPlate/types";
import { atlasPlateSampleData } from "../templates/AtlasPlate";
import { ProportionalSymbolMap } from "../templates/ProportionalSymbolMap/ProportionalSymbolMap";
import { ProportionalSymbolMapSchema } from "../templates/ProportionalSymbolMap/schema";
import type { ProportionalSymbolMapData } from "../templates/ProportionalSymbolMap/types";
import { proportionalSymbolMapSampleData } from "../templates/ProportionalSymbolMap";
import { CartogramMap } from "../templates/CartogramMap/CartogramMap";
import { CartogramMapSchema } from "../templates/CartogramMap/schema";
import type { CartogramMapData } from "../templates/CartogramMap/types";
import { cartogramMapSampleData } from "../templates/CartogramMap";
import { DensityMap } from "../templates/DensityMap/DensityMap";
import { DensityMapSchema } from "../templates/DensityMap/schema";
import type { DensityMapData } from "../templates/DensityMap/types";
import { densityMapSampleData } from "../templates/DensityMap";
import { TilegramUSMap } from "../templates/TilegramUSMap/TilegramUSMap";
import { TilegramUSMapSchema } from "../templates/TilegramUSMap/schema";
import type { TilegramUSMapData, USStateCode } from "../templates/TilegramUSMap/types";
import { layout, mapConfig, sec } from "../design/theme";
import { CATALOG_EPISODE, catalogId } from "./helpers";

// ─── AtlasPlate variants (G7 / Tordesillas / Blocs) ─────────────────────────
//
// May 13, 2026 — these three were ported from ChoroplethMap (Mapbox) to
// AtlasPlate (pure SVG). The Mapbox version produced "rotating-paper-with-
// a-title" artifacts that fought the editorial register; AtlasPlate is the
// canonical NYT / FT / Bloomberg approach for static editorial maps. See:
// research memo + MAP_TEMPLATE_SELECTOR.md.
// Two-tier copy convention for single-phase AtlasPlate comps: composition
// title states the analytical CLAIM, phase title shows the SPECIFIC
// MOMENT / data. Matches the convention in `atlasPlateSampleData` (cocom):
// composition "The COCOM Members" / phase "Western signatories". Without
// this split, single-phase comps render the same string twice (top-left
// header + bottom-left big phase title) — visible dup in the May 13, 2026
// review.
const atlasG7: AtlasPlateData = {
  episode: CATALOG_EPISODE,
  title: "Wealth concentration",
  subtitle: "How seven industrialized economies command global output",
  projection: "naturalEarth",
  source: "IMF / World Bank",
  // Title floats at the corner with maximum clearance from highlighted
  // countries (auto-resolved each phase). Phase label sits in the opposite
  // corner.
  mapTitle: { placement: "auto" },
  phases: [
    {
      title: "Group of Seven",
      subtitle: "47% of global GDP, 10% of population",
      durationSec: 6,
      countries: [
        { iso3: "USA", fill: "#3266AD", label: "US" },
        { iso3: "CAN", fill: "#3266AD" },
        { iso3: "GBR", fill: "#3266AD" },
        { iso3: "FRA", fill: "#3266AD" },
        { iso3: "DEU", fill: "#3266AD" },
        { iso3: "ITA", fill: "#3266AD" },
        { iso3: "JPN", fill: "#3266AD", label: "Japan" },
      ],
    },
  ],
};

const atlasBlocs: AtlasPlateData = {
  episode: CATALOG_EPISODE,
  title: "Bloc Architecture, 1955–1990",
  projection: "naturalEarth",
  source: "Allied / Soviet treaty archives, simplified",
  mapTitle: { placement: "auto" },
  phases: [
    {
      title: "Phase I — Founding NATO",
      subtitle: "April 1949",
      durationSec: 4,
      countries: [
        { iso3: "USA", fill: "#3266AD", label: "NATO" },
        { iso3: "CAN", fill: "#3266AD" },
        { iso3: "GBR", fill: "#3266AD" },
        { iso3: "FRA", fill: "#3266AD" },
        { iso3: "ITA", fill: "#3266AD" },
        { iso3: "BEL", fill: "#3266AD" },
        { iso3: "NLD", fill: "#3266AD" },
        { iso3: "NOR", fill: "#3266AD" },
        { iso3: "DNK", fill: "#3266AD" },
        { iso3: "PRT", fill: "#3266AD" },
        { iso3: "ISL", fill: "#3266AD" },
        { iso3: "LUX", fill: "#3266AD" },
      ],
    },
    {
      title: "Phase II — Warsaw Pact Forms",
      subtitle: "May 1955, response to West German rearmament",
      durationSec: 4,
      countries: [
        { iso3: "RUS", fill: "#C23B22", label: "Warsaw Pact" },
        { iso3: "POL", fill: "#C23B22" },
        { iso3: "CZE", fill: "#C23B22" }, // covers historical Czechoslovakia
        { iso3: "SVK", fill: "#C23B22" },
        { iso3: "HUN", fill: "#C23B22" },
        { iso3: "ROU", fill: "#C23B22" },
        { iso3: "BGR", fill: "#C23B22" },
        // NATO countries persist
        { iso3: "USA", fill: "#3266AD" },
        { iso3: "GBR", fill: "#3266AD" },
        { iso3: "FRA", fill: "#3266AD" },
        { iso3: "DEU", fill: "#3266AD", label: "FRG" }, // West Germany approximation
      ],
    },
    {
      title: "Phase III — Bipolar Equilibrium",
      subtitle: "By 1968, with non-aligned states visible",
      durationSec: 5,
      countries: [
        // Warsaw Pact
        { iso3: "RUS", fill: "#C23B22" },
        { iso3: "POL", fill: "#C23B22" },
        { iso3: "CZE", fill: "#C23B22" },
        { iso3: "HUN", fill: "#C23B22" },
        { iso3: "ROU", fill: "#C23B22" },
        { iso3: "BGR", fill: "#C23B22" },
        // NATO
        { iso3: "USA", fill: "#3266AD" },
        { iso3: "CAN", fill: "#3266AD" },
        { iso3: "GBR", fill: "#3266AD" },
        { iso3: "FRA", fill: "#3266AD" },
        { iso3: "ITA", fill: "#3266AD" },
        { iso3: "NOR", fill: "#3266AD" },
        // Non-aligned (gray)
        { iso3: "IND", fill: "#888780", label: "Non-aligned" },
        { iso3: "SRB", fill: "#888780" }, // covers historical Yugoslavia
        { iso3: "EGY", fill: "#888780" },
      ],
    },
  ],
};

const atlasTordesillas: AtlasPlateData = {
  episode: CATALOG_EPISODE,
  title: "The Treaty of Tordesillas, 1494",
  projection: "naturalEarth",
  source: "Treaty of Tordesillas, post-1494 claims (simplified)",
  phases: [
    {
      title: "Drawing a Line on the Atlantic",
      subtitle: "The world divided between Spain and Portugal",
      durationSec: 7,
      countries: [
        { iso3: "ESP", fill: "#E5A544", label: "Castile & León" },
        { iso3: "PRT", fill: "#6B1D1D", label: "Portugal" },
        // Approximate post-treaty claims
        { iso3: "BRA", fill: "#6B1D1D" },
        { iso3: "MEX", fill: "#E5A544" },
        { iso3: "PER", fill: "#E5A544" },
        { iso3: "COL", fill: "#E5A544" },
        { iso3: "ARG", fill: "#E5A544" },
        { iso3: "CHL", fill: "#E5A544" },
      ],
      focus: { center: [-30, 0], scaleHint: 1.4 },
    },
  ],
};

// ─── RouteAnimation variants ───────────────────────────────────────────────

const routeSilkRoad: RouteAnimationData = {
  episode: CATALOG_EPISODE,
  title: "The Silk Road",
  subtitle: "Trade corridor, c. 130 BCE – 1453 CE",
  // Greedy auto-placer handles label collision per-frame (May 14, 2026 —
  // see labelPlacement.ts). Authors can still pin a specific position by
  // adding `labelPosition` to any point — explicit values always win.
  points: [
    { name: "Chang'an", coordinates: [108.95, 34.27], label: "Chang'an", sublabel: "Tang capital" },
    { name: "Dunhuang", coordinates: [94.66, 40.14], label: "Dunhuang" },
    { name: "Samarkand", coordinates: [66.97, 39.65], label: "Samarkand" },
    { name: "Baghdad", coordinates: [44.36, 33.31], label: "Baghdad" },
    { name: "Damascus", coordinates: [36.30, 33.51], label: "Damascus" },
    { name: "Constantinople", coordinates: [28.97, 41.01], label: "Constantinople" },
    { name: "Venice", coordinates: [12.34, 45.44], label: "Venice" },
  ],
  segments: [
    { from: 0, to: 1, label: "Hexi Corridor" },
    { from: 1, to: 2, label: "Pamir crossing" },
    { from: 2, to: 3, label: "Persian highway" },
    { from: 3, to: 4 },
    { from: 4, to: 5, label: "Anatolia" },
    { from: 5, to: 6, label: "Adriatic" },
  ],
  phases: [
    {
      title: "East — Tang Dynasty Origin",
      durationSec: 3,
      activePoints: [0],
      activeSegments: [],
      camera: { longitude: 100, latitude: 36, zoom: 3.2, pitch: 20 },
    },
    {
      title: "Crossing Central Asia",
      subtitle: "Caravans, oasis cities, dangerous mountain passes",
      durationSec: 4,
      activePoints: [0, 1, 2],
      activeSegments: [0, 1],
      camera: { longitude: 80, latitude: 38, zoom: 2.8, pitch: 25 },
    },
    {
      title: "The Persian and Levantine Bridge",
      durationSec: 4,
      activePoints: [0, 1, 2, 3, 4],
      activeSegments: [0, 1, 2, 3],
      camera: { longitude: 55, latitude: 36, zoom: 2.6, pitch: 20 },
    },
    {
      title: "Reaching Europe",
      subtitle: "Goods arrive in Venice via Constantinople",
      durationSec: 5,
      activePoints: [0, 1, 2, 3, 4, 5, 6],
      activeSegments: [0, 1, 2, 3, 4, 5],
      camera: { longitude: 40, latitude: 38, zoom: 2.0, pitch: 15 },
    },
  ],
  routeColor: "#E5A544",
};

const routeMagellan: RouteAnimationData = {
  episode: CATALOG_EPISODE,
  title: "Magellan's Circumnavigation",
  subtitle: "1519–1522: the first voyage around the world",
  points: [
    { name: "Sanlúcar", coordinates: [-6.35, 36.78], label: "Sanlúcar", sublabel: "Sept 1519" },
    { name: "Rio de Janeiro", coordinates: [-43.17, -22.91], label: "Rio" },
    { name: "Strait of Magellan", coordinates: [-71.0, -54.0], label: "Strait" },
    { name: "Guam", coordinates: [144.78, 13.44], label: "Guam" },
    { name: "Cebu", coordinates: [123.89, 10.32], label: "Cebu", sublabel: "Magellan dies, 1521" },
    { name: "Cape of Good Hope", coordinates: [18.42, -34.36], label: "Cape" },
    { name: "Sanlúcar Return", coordinates: [-6.35, 36.78], label: "Return", sublabel: "Sept 1522" },
  ],
  segments: [
    { from: 0, to: 1, label: "Atlantic crossing" },
    { from: 1, to: 2 },
    { from: 2, to: 3, label: "Pacific (110 days)" },
    { from: 3, to: 4 },
    { from: 4, to: 5, label: "Indian Ocean" },
    { from: 5, to: 6, label: "Atlantic return" },
  ],
  phases: [
    {
      title: "Departure: 270 men, 5 ships",
      subtitle: "September 20, 1519",
      durationSec: 3,
      activePoints: [0],
      activeSegments: [],
      camera: { longitude: -10, latitude: 30, zoom: 2.0 },
    },
    {
      title: "Atlantic Crossing",
      durationSec: 4,
      activePoints: [0, 1, 2],
      activeSegments: [0, 1],
      camera: { longitude: -40, latitude: -15, zoom: 1.6 },
    },
    {
      title: "The Pacific — Larger Than Anyone Knew",
      subtitle: "110 days without making landfall",
      durationSec: 5,
      activePoints: [0, 1, 2, 3, 4],
      activeSegments: [0, 1, 2, 3],
      camera: { longitude: 180, latitude: -10, zoom: 1.4, pitch: 0 },
    },
    {
      title: "The Return: 18 men, 1 ship",
      subtitle: "September 6, 1522 — three years later",
      durationSec: 5,
      activePoints: [0, 1, 2, 3, 4, 5, 6],
      activeSegments: [0, 1, 2, 3, 4, 5],
      camera: { longitude: -10, latitude: 20, zoom: 1.5 },
    },
  ],
  routeColor: "#C23B22",
};

const routeChokepoints: RouteAnimationData = {
  episode: CATALOG_EPISODE,
  title: "The World's Maritime Chokepoints",
  subtitle: "Six narrow passages through which most global trade must pass",
  // No explicit labelPosition — the greedy auto-placer (May 14, 2026,
  // labelPlacement.ts) picks a non-colliding cardinal direction per point
  // based on the live camera projection. Authors can still pin a specific
  // position by adding `labelPosition: "above" | "below" | "left" | "right"`
  // on any point — explicit values always win over auto.
  points: [
    { name: "Strait of Hormuz", coordinates: [56.25, 26.57], label: "Hormuz", sublabel: "21% of oil" },
    { name: "Bab-el-Mandeb", coordinates: [43.32, 12.58], label: "Bab-el-Mandeb" },
    { name: "Suez Canal", coordinates: [32.55, 30.04], label: "Suez", sublabel: "12% of trade" },
    { name: "Bosphorus", coordinates: [29.0, 41.1], label: "Bosphorus" },
    { name: "Strait of Malacca", coordinates: [100.6, 2.5], label: "Malacca", sublabel: "30% of trade" },
    { name: "Panama Canal", coordinates: [-79.52, 9.08], label: "Panama" },
  ],
  // Tour-style connections — not real shipping routes, just a visual sequence
  // linking the six chokepoints around the world.
  segments: [
    { from: 0, to: 1, dashed: true },
    { from: 1, to: 2, dashed: true },
    { from: 2, to: 3, dashed: true },
    { from: 0, to: 4, dashed: true },
    { from: 4, to: 5, dashed: true },
  ],
  // Phased narrative reveal — Layer C of the label-collision defense.
  // Three beats: Middle East corridor → European entry → Asian gateway +
  // Americas. Spreads the 6 labels across 3 phases instead of cramming
  // them all on frame 60 (which produced the May 13 visual-review bunch).
  phases: [
    {
      title: "Middle East Corridor",
      subtitle: "Where oil leaves the Gulf and trade enters the Red Sea",
      durationSec: 3,
      activePoints: [0, 1, 2], // Hormuz + Bab-el-Mandeb + Suez
      activeSegments: [0, 1],
    },
    {
      title: "European Entry",
      subtitle: "Bosphorus carries grain from the Black Sea steppe",
      durationSec: 2.5,
      activePoints: [0, 1, 2, 3], // + Bosphorus
      activeSegments: [0, 1, 2],
    },
    {
      title: "Six Narrow Passages",
      subtitle: "The geography of global trade dependence",
      durationSec: 4,
      activePoints: [0, 1, 2, 3, 4, 5], // + Malacca + Panama
      activeSegments: [0, 1, 2, 3, 4],
    },
  ],
  routeColor: "#E5A544",
  // Parallels-and-meridians overlay — reads as atlas plate. 15° spacing for
  // a world-scale view; the 30° emphasis lands on the Equator and Tropics.
  graticule: {
    spacing: 15,
    opacity: 0.12,
    emphasize30: true,
  },
  // Locator inset — top-left corner, framed, ~12% of frame width.
  inset: {
    show: true,
    position: "tl",
  },
  // Editorial annotation layer — demonstrates all three hierarchies + leader
  // line + emphasis. Region labels (primary), water-body labels (secondary),
  // source-note (tertiary, mute). See: references/template-research/map-annotations.md
  annotations: [
    {
      at: [45, 24],
      label: "Middle East",
      hierarchy: "primary",
    },
    {
      at: [105, 10],
      label: "Southeast Asia",
      hierarchy: "primary",
    },
    {
      at: [73, -8],
      label: "Indian Ocean",
      hierarchy: "secondary",
      leader: { dx: -80, dy: 40 },
      align: "left",
    },
    {
      at: [-40, 5],
      label: "Atlantic",
      hierarchy: "secondary",
      emphasis: "mute",
    },
    {
      at: [-160, -25],
      label: "Source: UNCTAD 2024",
      hierarchy: "tertiary",
      emphasis: "mute",
    },
  ],
};

// ─── Composition registrations ─────────────────────────────────────────────

const routeDuration = (data: RouteAnimationData): number =>
  sec((data.phases.length > 0 ? data.phases.reduce((sum, p) => sum + p.durationSec, 0) : (data.durationSec ?? 8)) + 1);

// Radial-mode catalog sample — "All roads led to Rome."
// One hub (Rome) + N destinations across the Mediterranean Roman network.
// Demonstrates the dossier's hub-with-radial-routes use case.
// See: references/template-research/route-animation.md § 6.1
const routeRomeRadial: RouteAnimationData = {
  episode: CATALOG_EPISODE,
  title: "All Roads Led to Rome",
  subtitle: "Major routes of the late Roman Republic, c. 100 BCE",
  points: [
    { name: "Rome", coordinates: [12.4964, 41.9028], label: "Roma" },
    { name: "Lugdunum", coordinates: [4.8357, 45.7640], label: "Lugdunum" },     // Lyon
    { name: "Tarraco", coordinates: [1.2445, 41.1189], label: "Tarraco" },        // Tarragona
    { name: "Carthago Nova", coordinates: [-0.9866, 37.6051], label: "Carthago Nova" },
    { name: "Carthago", coordinates: [10.3239, 36.8528], label: "Carthago" },
    { name: "Alexandria", coordinates: [29.9187, 31.2001], label: "Alexandria" },
    { name: "Antioch", coordinates: [36.1604, 36.2021], label: "Antiocheia" },
    { name: "Byzantium", coordinates: [28.9784, 41.0082], label: "Byzantium" },
    { name: "Aquileia", coordinates: [13.3700, 45.7700], label: "Aquileia" },
  ],
  segments: [], // auto-generated by radial mode
  phases: [],   // auto-generated by radial mode
  radial: {
    hubIndex: 0,
    staggerSec: 0.18,
  },
  durationSec: 9,
  routeColor: "#C23B22",
  backgroundVariant: "light",
  source: "Smith's Atlas of Ancient & Classical Geography (1872), simplified",
};

// G7 / Blocs / Tordesillas — migrated from ChoroplethMap (Mapbox) to
// AtlasPlate (pure SVG) on May 13, 2026. Mapbox produced unwanted
// "rotating-paper" / "title-plate cutting into map" artifacts; AtlasPlate
// is the canonical industry approach for static editorial choropleths
// (NYT graphics, FT visual journalism, Bloomberg Opinion, Reuters, the
// Economist — all use D3 + TopoJSON SVG, which is what AtlasPlate is).
// Exports renamed to `CatalogAtlas*` + catalog IDs to `catalog-atlas-plate-*`
// to reflect the underlying template. See MAP_TEMPLATE_SELECTOR.md
// "Mapbox → AtlasPlate doctrine" section.
export const CatalogAtlasG7 = () => (
  <Composition
    id={catalogId("AtlasPlate", "g7")}
    component={AtlasPlate}
    schema={AtlasPlateSchema}
    calculateMetadata={({ props }) => ({
      durationInFrames: atlasDuration(props.data as AtlasPlateData),
      fps: layout.fps,
      width: layout.width,
      height: layout.height,
    })}
    defaultProps={{ data: atlasG7 as unknown as AtlasPlateData }}
  />
);

export const CatalogAtlasBlocs = () => (
  <Composition
    id={catalogId("AtlasPlate", "cold-war-blocs")}
    component={AtlasPlate}
    schema={AtlasPlateSchema}
    calculateMetadata={({ props }) => ({
      durationInFrames: atlasDuration(props.data as AtlasPlateData),
      fps: layout.fps,
      width: layout.width,
      height: layout.height,
    })}
    defaultProps={{ data: atlasBlocs as unknown as AtlasPlateData }}
  />
);

export const CatalogAtlasTordesillas = () => (
  <Composition
    id={catalogId("AtlasPlate", "tordesillas")}
    component={AtlasPlate}
    schema={AtlasPlateSchema}
    calculateMetadata={({ props }) => ({
      durationInFrames: atlasDuration(props.data as AtlasPlateData),
      fps: layout.fps,
      width: layout.width,
      height: layout.height,
    })}
    defaultProps={{ data: atlasTordesillas as unknown as AtlasPlateData }}
  />
);

export const CatalogRouteSilkRoad = () => (
  <Composition
    id={catalogId("RouteAnimation", "silk-road")}
    component={RouteAnimation}
    schema={RouteAnimationSchema}
    calculateMetadata={({ props }) => ({
      durationInFrames: routeDuration(props.data as RouteAnimationData),
      fps: layout.fps,
      width: layout.width,
      height: layout.height,
    })}
    defaultProps={{ data: routeSilkRoad as unknown as RouteAnimationData }}
  />
);

export const CatalogRouteMagellan = () => (
  <Composition
    id={catalogId("RouteAnimation", "magellan")}
    component={RouteAnimation}
    schema={RouteAnimationSchema}
    calculateMetadata={({ props }) => ({
      durationInFrames: routeDuration(props.data as RouteAnimationData),
      fps: layout.fps,
      width: layout.width,
      height: layout.height,
    })}
    defaultProps={{ data: routeMagellan as unknown as RouteAnimationData }}
  />
);

export const CatalogRouteRomeRadial = () => (
  <Composition
    id={catalogId("RouteAnimation", "rome-radial")}
    component={RouteAnimation}
    schema={RouteAnimationSchema}
    calculateMetadata={({ props }) => ({
      durationInFrames: routeDuration(props.data as RouteAnimationData),
      fps: layout.fps,
      width: layout.width,
      height: layout.height,
    })}
    defaultProps={{ data: routeRomeRadial as unknown as RouteAnimationData }}
  />
);

export const CatalogRouteChokepoints = () => (
  <Composition
    id={catalogId("RouteAnimation", "chokepoints")}
    component={RouteAnimation}
    schema={RouteAnimationSchema}
    calculateMetadata={({ props }) => ({
      durationInFrames: routeDuration(props.data as RouteAnimationData),
      fps: layout.fps,
      width: layout.width,
      height: layout.height,
    })}
    defaultProps={{ data: routeChokepoints as unknown as RouteAnimationData }}
  />
);

// ─── AtlasPlate variants (COCOM / Cold War vintage) ────────────────────────
//
// AtlasPlate is the pure-SVG editorial cartography template (no Mapbox).
// Catalog samples show the Tufte/Fortune register: flat, high-contrast,
// brand-typed labels, no atmosphere. (G7 / Tordesillas / Blocs also use
// AtlasPlate now — see the AtlasPlate-G7/Tordesillas/Blocs section above.)

// Re-use the published sample data for the catalog showreel; tag with the
// CATALOG_EPISODE so HeaderStrip reads "_catalog" alongside other showreel
// items rather than the AtlasPlate-default episode tag.
const atlasCocom: AtlasPlateData = {
  ...atlasPlateSampleData,
  episode: CATALOG_EPISODE,
  // Smart placement: count highlighted-country centroids inside each
  // ~640×140px corner region and float the title at the LEAST populated
  // corner (tie-break favors top-left for editorial reading order). Phase
  // label renders in the opposite corner.
  mapTitle: { placement: "auto" },
};

const atlasDuration = (data: AtlasPlateData): number =>
  data.phases.reduce((sum, p) => sum + sec(p.durationSec), 0);

export const CatalogAtlasCocom = () => (
  <Composition
    id={catalogId("AtlasPlate", "cocom")}
    component={AtlasPlate}
    schema={AtlasPlateSchema}
    calculateMetadata={({ props }) => ({
      durationInFrames: atlasDuration(props.data as AtlasPlateData),
      fps: layout.fps,
      width: layout.width,
      height: layout.height,
    })}
    defaultProps={{ data: atlasCocom as unknown as AtlasPlateData }}
  />
);

// Vintage variant — Cold War NATO vs Warsaw Pact, period-atlas register.
// The same content as a modern Atlas plate would look different — tea-
// stained paper, brown borders, paper-grain texture, faded political
// fills. Closest match to a 1962 Bartholomew or Soviet Atlas Mira plate.
// Direct editorial fit for any Cold War / deterrence / prisoners-dilemma
// analogy episode.
//
// Fill colors pull from mapConfig.vintageStyleColors so the editorial
// register stays consistent if those tokens are tuned later (single
// source of truth for the vintage palette).
const VINTAGE_WEST = mapConfig.vintageStyleColors.westernHighlight;
const VINTAGE_EAST = mapConfig.vintageStyleColors.easternHighlight;

const atlasColdWarVintage: AtlasPlateData = {
  episode: CATALOG_EPISODE,
  title: "Two blocs, 1962",
  subtitle: "NATO + signatories vs. Warsaw Pact + allies",
  projection: "naturalEarth",
  aesthetic: "vintage",
  source: "Cold War archives, simplified",
  framePadding: 100,
  graticule: {
    spacing: 15,
    opacity: 0.08,
    emphasize30: true,
  },
  phases: [
    {
      title: "The blocs",
      subtitle: "Aligned states, 1962",
      durationSec: 9,
      countries: [
        // NATO + Western-bloc signatories — muted navy (vintage token)
        { iso3: "USA", fill: VINTAGE_WEST },
        { iso3: "CAN", fill: VINTAGE_WEST },
        { iso3: "GBR", fill: VINTAGE_WEST },
        { iso3: "FRA", fill: VINTAGE_WEST },
        { iso3: "DEU", fill: VINTAGE_WEST }, // West Germany (TopoJSON has unified DEU)
        { iso3: "ITA", fill: VINTAGE_WEST },
        { iso3: "NLD", fill: VINTAGE_WEST },
        { iso3: "BEL", fill: VINTAGE_WEST },
        { iso3: "DNK", fill: VINTAGE_WEST },
        { iso3: "NOR", fill: VINTAGE_WEST },
        { iso3: "PRT", fill: VINTAGE_WEST },
        { iso3: "LUX", fill: VINTAGE_WEST },
        { iso3: "TUR", fill: VINTAGE_WEST },
        { iso3: "GRC", fill: VINTAGE_WEST },
        { iso3: "JPN", fill: VINTAGE_WEST },
        { iso3: "AUS", fill: VINTAGE_WEST },
        { iso3: "NZL", fill: VINTAGE_WEST },
        // Warsaw Pact + Soviet-bloc allies — faded oxblood (vintage token)
        { iso3: "RUS", fill: VINTAGE_EAST },
        { iso3: "POL", fill: VINTAGE_EAST },
        { iso3: "CZE", fill: VINTAGE_EAST }, // covers historical Czechoslovakia
        { iso3: "HUN", fill: VINTAGE_EAST },
        { iso3: "ROU", fill: VINTAGE_EAST },
        { iso3: "BGR", fill: VINTAGE_EAST },
        { iso3: "CHN", fill: VINTAGE_EAST },
        { iso3: "PRK", fill: VINTAGE_EAST },
        { iso3: "MNG", fill: VINTAGE_EAST },
        { iso3: "CUB", fill: VINTAGE_EAST },
        { iso3: "VNM", fill: VINTAGE_EAST }, // North Vietnam approximation
      ],
    },
  ],
};

export const CatalogAtlasColdWarVintage = () => (
  <Composition
    id={catalogId("AtlasPlate", "cold-war-vintage")}
    component={AtlasPlate}
    schema={AtlasPlateSchema}
    calculateMetadata={({ props }) => ({
      durationInFrames: atlasDuration(props.data as AtlasPlateData),
      fps: layout.fps,
      width: layout.width,
      height: layout.height,
    })}
    defaultProps={{ data: atlasColdWarVintage as unknown as AtlasPlateData }}
  />
);

// ─── ProportionalSymbolMap variants ───────────────────────────────────────
//
// Country-anchored circles sized by a numeric value. The right form for
// COUNT data — fabs, bases, GDP, anything where filling whole countries
// would over-emphasize area at the expense of the actual number.

const proportionalFabs: ProportionalSymbolMapData = {
  ...proportionalSymbolMapSampleData,
  episode: CATALOG_EPISODE,
};

const proportionalDuration = (data: ProportionalSymbolMapData): number =>
  data.phases.reduce((sum, p) => sum + sec(p.durationSec), 0);

export const CatalogProportionalFabs = () => (
  <Composition
    id={catalogId("ProportionalSymbolMap", "fabs")}
    component={ProportionalSymbolMap}
    schema={ProportionalSymbolMapSchema}
    calculateMetadata={({ props }) => ({
      durationInFrames: proportionalDuration(props.data as ProportionalSymbolMapData),
      fps: layout.fps,
      width: layout.width,
      height: layout.height,
    })}
    defaultProps={{ data: proportionalFabs as unknown as ProportionalSymbolMapData }}
  />
);

// ─── CartogramMap variants ────────────────────────────────────────────────
//
// Dorling cartogram — country circles, force-decollided, abstract register.
// The right form for dense data (EU-27, sub-Saharan Africa) where
// ProportionalSymbolMap circles would overlap into illegibility.

const cartogramEU: CartogramMapData = {
  ...cartogramMapSampleData,
  episode: CATALOG_EPISODE,
};

const cartogramDuration = (data: CartogramMapData): number =>
  data.phases.reduce((sum, p) => sum + sec(p.durationSec), 0);

export const CatalogCartogramEU = () => (
  <Composition
    id={catalogId("CartogramMap", "eu-population")}
    component={CartogramMap}
    schema={CartogramMapSchema}
    calculateMetadata={({ props }) => ({
      durationInFrames: cartogramDuration(props.data as CartogramMapData),
      fps: layout.fps,
      width: layout.width,
      height: layout.height,
    })}
    defaultProps={{ data: cartogramEU as unknown as CartogramMapData }}
  />
);

// ─── DensityMap variants ──────────────────────────────────────────────────
//
// Point-density on Mapbox basemap. For "where things concentrate" stories
// where individual points are the unit of analysis (fabs, bases, events).

const densityFabs: DensityMapData = {
  ...densityMapSampleData,
  episode: CATALOG_EPISODE,
};

const densityDuration = (data: DensityMapData): number =>
  data.phases.reduce((sum, p) => sum + sec(p.durationSec), 0);

export const CatalogDensityFabs = () => (
  <Composition
    id={catalogId("DensityMap", "fab-sites")}
    component={DensityMap}
    schema={DensityMapSchema}
    calculateMetadata={({ props }) => ({
      durationInFrames: densityDuration(props.data as DensityMapData),
      fps: layout.fps,
      width: layout.width,
      height: layout.height,
    })}
    defaultProps={{ data: densityFabs as unknown as DensityMapData }}
  />
);

// ─── TilegramUSMap variants ───────────────────────────────────────────────
//
// Equal-weight U.S. tilegram — every state as a same-size hex/tile. The
// right form when the editorial point is "who counted, not where they
// lived" (electoral votes, state-level votes, ratification status).

const TRUMP_STATES_2024: Record<string, number> = {
  AK: 3, AL: 9, AR: 6, AZ: 11, FL: 30, GA: 16, IA: 6, ID: 4, IN: 11,
  KS: 6, KY: 8, LA: 8, MI: 15, MO: 10, MS: 6, MT: 4, NC: 16, ND: 3,
  NE: 5, NV: 6, OH: 17, OK: 7, PA: 19, SC: 9, SD: 3, TN: 11,
  TX: 40, UT: 6, WI: 10, WV: 4, WY: 3,
};

const HARRIS_STATES_2024: Record<string, number> = {
  CA: 54, CO: 10, CT: 7, DC: 3, DE: 3, HI: 4, IL: 19, MA: 11, MD: 10,
  ME: 4, MN: 10, NH: 4, NJ: 14, NM: 5, NY: 28, OR: 8, RI: 4, VA: 13, VT: 3,
  WA: 12,
};

const buildTilegramElectoralStates = (): TilegramUSMapData["states"] => {
  const out: TilegramUSMapData["states"] = [];
  for (const [code, ev] of Object.entries(TRUMP_STATES_2024)) {
    out.push({ state: code as USStateCode, value: -1, label: `${ev}` });
  }
  for (const [code, ev] of Object.entries(HARRIS_STATES_2024)) {
    out.push({ state: code as USStateCode, value: 1, label: `${ev}` });
  }
  return out;
};

const tilegramElectoral2024: TilegramUSMapData = {
  episode: CATALOG_EPISODE,
  title: "2024 Presidential Electoral Map",
  subtitle:
    "Every state, equal weight — the map without geographic distortion",
  states: buildTilegramElectoralStates(),
  colorScale: "diverging",
  valueLabel: "2024 result (Trump ← → Harris)",
  source: "Associated Press final tally",
  durationSec: 12,
};

export const CatalogTilegramElectoral = () => (
  <Composition
    id={catalogId("TilegramUSMap", "electoral-2024")}
    component={TilegramUSMap}
    schema={TilegramUSMapSchema}
    calculateMetadata={({ props }) => ({
      durationInFrames: sec((props.data as TilegramUSMapData).durationSec ?? 12),
      fps: layout.fps,
      width: layout.width,
      height: layout.height,
    })}
    defaultProps={{ data: tilegramElectoral2024 as unknown as TilegramUSMapData }}
  />
);

// Catalog data exports for Showreel composition
export const catalogMapsData = {
  // ChoroplethMap-shaped comps migrated to AtlasPlate May 13, 2026.
  atlasG7,
  atlasBlocs,
  atlasTordesillas,
  routeSilkRoad,
  routeMagellan,
  routeChokepoints,
  routeRomeRadial,
  atlasCocom,
  atlasColdWarVintage,
  proportionalFabs,
  cartogramEU,
  densityFabs,
  tilegramElectoral2024,
};
