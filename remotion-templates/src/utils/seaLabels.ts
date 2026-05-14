/**
 * seaLabels — hand-curated registry of major water-body labels for SVG
 * atlas plates (AtlasPlate, CartogramMap, ProportionalSymbolMap).
 *
 * Why this exists: an atlas plate without `PACIFIC OCEAN`, `MEDITERRANEAN`,
 * or `SOUTH CHINA SEA` arched across its waters reads as data-vis, not
 * as an editorial atlas. Bartholomew Times Atlas, FT Map Index, Reuters
 * Graphics, and NYT Upshot all consistently label major water bodies in
 * tracked uppercase along a geodesic arc. This module ships the curated
 * canonical set so authors don't have to source coordinates per episode.
 *
 * Pattern mirrors `disputedBoundaries.ts`:
 *   - Each entry has a `tag` (slug for opt-in filtering).
 *   - Each carries an `arc` polyline (the text follows this path).
 *   - `hierarchy` controls render weight ("primary" = ocean basins,
 *     "secondary" = named seas/gulfs).
 *   - The label always renders in tracked uppercase per atlas convention.
 *
 * Adding a new sea: append to SEA_LABELS below. Coordinate format: array
 * of [lon, lat] pairs forming the centerline along which the label sits.
 * Aim for the label's natural reading direction — Pacific reads
 * left-to-right (W → E), Atlantic likewise. For curved arcs (Atlantic
 * arcing under the equator, Indian Ocean wrapping south of Asia), 3-5
 * vertices give the text a natural-looking curve.
 *
 * Editorial register: the curated set deliberately stops at ~15 entries
 * — it covers the water bodies that appear in 95% of geopolitics shots
 * without cluttering "every body of water." Episodes that need a niche
 * label (e.g., Sea of Okhotsk, Andaman Sea) can pass an inline object
 * instead of a tag.
 */

export interface SeaLabel {
  /** Slug for editorial filtering (e.g., "pacific", "mediterranean"). */
  tag: string;
  /** Display text — rendered uppercase per atlas convention. */
  label: string;
  /**
   * Polyline as [lon, lat] pairs. The label text follows this path.
   * 3-5 vertices typical; more for gentle arcs across half the globe.
   */
  arc: [number, number][];
  /**
   * Visual register:
   * - `primary`: ocean basins (Pacific, Atlantic, Indian, Arctic,
   *   Southern). Larger type, tighter letterspacing.
   * - `secondary`: seas + gulfs (Mediterranean, Caribbean, S. China Sea,
   *   Persian Gulf). Smaller, lighter weight.
   */
  hierarchy: "primary" | "secondary";
}

// ── Curated set ──────────────────────────────────────────────────────────

export const SEA_LABELS: readonly SeaLabel[] = [
  // ── Ocean basins ────────────────────────────────────────────────────────
  {
    tag: "pacific",
    label: "PACIFIC OCEAN",
    // Arched across the eastern Pacific from south of Hawaii toward the
    // South American coast. Center on a region with no land underneath
    // for any standard projection.
    arc: [
      [-170, 10],
      [-150, 5],
      [-130, 0],
      [-110, -5],
    ],
    hierarchy: "primary",
  },
  {
    tag: "pacific-west",
    label: "PACIFIC OCEAN",
    // Western Pacific variant — for Asia-centric shots (East Asia /
    // Australia projections) where the eastern arc reads off-canvas.
    arc: [
      [150, 10],
      [165, 0],
      [175, -10],
    ],
    hierarchy: "primary",
  },
  {
    tag: "atlantic",
    label: "ATLANTIC OCEAN",
    // Arched mid-Atlantic between West Africa and South America.
    arc: [
      [-40, 20],
      [-30, 10],
      [-25, 0],
      [-20, -10],
    ],
    hierarchy: "primary",
  },
  {
    tag: "indian",
    label: "INDIAN OCEAN",
    // South of India, arched toward the Australian continent.
    arc: [
      [60, -15],
      [75, -20],
      [90, -22],
      [105, -20],
    ],
    hierarchy: "primary",
  },
  {
    tag: "arctic",
    label: "ARCTIC OCEAN",
    // Across the north polar region — for orthographic / polar shots.
    arc: [
      [-150, 80],
      [-90, 84],
      [0, 85],
      [90, 84],
    ],
    hierarchy: "primary",
  },
  {
    tag: "southern",
    label: "SOUTHERN OCEAN",
    // South of all continents, arched along ~60°S.
    arc: [
      [-60, -60],
      [0, -62],
      [60, -62],
      [120, -60],
    ],
    hierarchy: "primary",
  },

  // ── Major seas + gulfs ──────────────────────────────────────────────────
  {
    tag: "mediterranean",
    label: "MEDITERRANEAN SEA",
    arc: [
      [3, 38],
      [12, 37.5],
      [22, 36],
      [30, 34.5],
    ],
    hierarchy: "secondary",
  },
  {
    tag: "caribbean",
    label: "CARIBBEAN SEA",
    arc: [
      [-83, 16],
      [-75, 15],
      [-67, 14],
    ],
    hierarchy: "secondary",
  },
  {
    tag: "south-china-sea",
    label: "SOUTH CHINA SEA",
    arc: [
      [110, 17],
      [115, 14],
      [118, 11],
    ],
    hierarchy: "secondary",
  },
  {
    tag: "north-sea",
    label: "NORTH SEA",
    arc: [
      [2, 57],
      [4, 56],
      [6, 55],
    ],
    hierarchy: "secondary",
  },
  {
    tag: "baltic",
    label: "BALTIC SEA",
    arc: [
      [18, 58],
      [20, 57],
      [22, 56],
    ],
    hierarchy: "secondary",
  },
  {
    tag: "red-sea",
    label: "RED SEA",
    arc: [
      [37, 22],
      [39, 19],
      [41, 16],
    ],
    hierarchy: "secondary",
  },
  {
    tag: "persian-gulf",
    label: "PERSIAN GULF",
    arc: [
      [50, 27.5],
      [52, 26.5],
      [54, 25.5],
    ],
    hierarchy: "secondary",
  },
  {
    tag: "bay-of-bengal",
    label: "BAY OF BENGAL",
    arc: [
      [85, 16],
      [88, 14],
      [91, 12],
    ],
    hierarchy: "secondary",
  },
  {
    tag: "gulf-of-mexico",
    label: "GULF OF MEXICO",
    arc: [
      [-95, 26],
      [-90, 25],
      [-86, 24],
    ],
    hierarchy: "secondary",
  },
  {
    tag: "sea-of-japan",
    label: "SEA OF JAPAN",
    arc: [
      [133, 40],
      [136, 38],
      [139, 36],
    ],
    hierarchy: "secondary",
  },
];

// ── Lookup + resolver ─────────────────────────────────────────────────────

const BY_TAG = (() => {
  const m: Record<string, SeaLabel> = {};
  for (const s of SEA_LABELS) m[s.tag] = s;
  return m;
})();

/** All available tags — useful for dev-mode introspection. */
export const ALL_SEA_LABEL_TAGS: readonly string[] = Object.keys(BY_TAG);

/**
 * Resolve a mixed array of tags + inline SeaLabel objects to concrete
 * SeaLabel entries. Tag strings look up the curated registry; objects
 * pass through. Unknown tags are silently dropped (author error, not a
 * render-breaking condition).
 */
export type SeaLabelInput = string | SeaLabel;

export const resolveSeaLabels = (
  inputs: readonly SeaLabelInput[],
): SeaLabel[] => {
  const out: SeaLabel[] = [];
  for (const item of inputs) {
    if (typeof item === "string") {
      const found = BY_TAG[item];
      if (found) out.push(found);
    } else {
      out.push(item);
    }
  }
  return out;
};
