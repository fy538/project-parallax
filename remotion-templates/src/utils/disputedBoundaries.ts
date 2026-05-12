/**
 * disputedBoundaries — hand-curated polylines for the most editorially-
 * relevant geopolitical disputes.
 *
 * Why this exists: world-atlas TopoJSON only ships recognized borders.
 * For a geopolitics channel, the *disputed* line is often the editorial
 * point — Taiwan Strait, South China Sea nine-dash, Kashmir, Crimea. A
 * map that shows only recognized boundaries reads as politically taking
 * a side (usually US worldview's). A map that names the disputes
 * editorially is the Parallax doctrine in cartographic form.
 *
 * Curation principles:
 *   - Each dispute is NAMED with a `tag` field for editorial filtering
 *     (so a script about Taiwan can show JUST that line, not all 5).
 *   - Each carries a `notes` field for tooltip/dossier reference — what
 *     this line IS and who claims it.
 *   - Coordinates are simplified for clarity at video scale; not survey-
 *     grade. We are not a legal-cartographic authority.
 *   - Worldview: rendered as "this is the contested line"; the recognized
 *     border (from world-atlas) renders separately.
 *
 * Adding a new dispute: add an entry to DISPUTED_BOUNDARIES below.
 * Coordinate format: array of [lon, lat] pairs forming a polyline. For
 * disputed REGIONS (vs. lines), use multiple polylines to outline the
 * region (closed loop).
 *
 * References:
 *   - China's nine-dash line: 2009 PRC submission to UN CLCS;
 *     2016 PCA ruling declared it without legal basis.
 *   - Taiwan Strait median line: 1955 Davis Line, used as informal
 *     ROC-PRC separator until eroded post-2020.
 *   - Line of Actual Control (Kashmir): 1972 Simla Agreement.
 *   - Crimea: 2014 Russian annexation, unrecognized by UN majority.
 *   - Western Sahara: 1991 ceasefire line (Berm), Morocco-administered
 *     vs. SADR-claimed.
 */

export interface DisputedBoundary {
  /** Slug for editorial filtering (e.g., "nine-dash", "taiwan-strait"). */
  tag: string;
  /** Display name for the dossier / tooltip. */
  name: string;
  /** Two-sentence editorial note on what this line is. */
  notes: string;
  /** Polyline as [lon, lat] pairs. Single line; for multi-line disputes, add multiple entries with the same tag. */
  coords: [number, number][];
}

// ── Curated dispute set ───────────────────────────────────────────────────

export const DISPUTED_BOUNDARIES: readonly DisputedBoundary[] = [
  // ── Taiwan Strait median line (Davis Line, 1955) ──────────────────────
  // Informal ROC-PRC separator from the Korean War era. Held as a tacit
  // demilitarized buffer until ~2020, when PLA aircraft began routine
  // crossings. Simplified great-circle approximation.
  {
    tag: "taiwan-strait",
    name: "Taiwan Strait median line",
    notes:
      "The 1955 'Davis Line', informal ROC-PRC separator. Routinely " +
      "crossed by PLA aircraft post-2020, eroding the de facto buffer.",
    coords: [
      [120.5, 26.5],
      [120.3, 25.5],
      [119.8, 24.5],
      [119.3, 23.5],
      [119.0, 22.5],
      [118.7, 21.5],
    ],
  },

  // ── South China Sea: Nine-Dash Line (PRC claim) ───────────────────────
  // Each dash is rendered as a short segment forming the U-shape around
  // most of the South China Sea. Simplified; the actual line is dashed
  // (and never published with precise coordinates).
  {
    tag: "nine-dash",
    name: "South China Sea: nine-dash line (PRC claim)",
    notes:
      "PRC's territorial claim per 2009 UN CLCS submission. The 2016 " +
      "PCA arbitration ruled the line without basis in international law.",
    coords: [
      [121.0, 24.5],
      [122.5, 21.0],
      [120.0, 18.0],
      [117.5, 15.5],
      [115.5, 13.0],
      [113.0, 10.5],
      [112.0, 7.5],
      [110.5, 5.0],
      [109.0, 7.5],
      [108.5, 12.0],
      [108.0, 16.0],
      [108.5, 20.0],
      [110.0, 21.0],
    ],
  },

  // ── Kashmir: Line of Actual Control (LoC) ─────────────────────────────
  // The 1972 Simla Agreement line between India- and Pakistan-administered
  // Kashmir. Also the de facto border with PRC-administered Aksai Chin.
  {
    tag: "kashmir-loc",
    name: "Kashmir: Line of Control",
    notes:
      "1972 Simla Agreement line between India- and Pakistan-administered " +
      "Kashmir. Site of repeated armed incidents.",
    coords: [
      [73.8, 33.0],
      [74.0, 33.5],
      [74.3, 34.0],
      [74.8, 34.3],
      [75.3, 34.5],
      [75.8, 34.7],
      [76.3, 34.8],
      [76.8, 34.6],
    ],
  },

  // ── Crimea: post-2014 line ────────────────────────────────────────────
  // Russian annexation of Crimea (2014), unrecognized by UN majority.
  // The line follows the Perekop Isthmus (the land bridge between
  // Crimea and mainland Ukraine).
  {
    tag: "crimea",
    name: "Crimea: post-2014 administrative line",
    notes:
      "Russian-annexed Crimea (2014). Unrecognized by UN majority. " +
      "Line follows the Perekop Isthmus.",
    coords: [
      [33.7, 46.2],
      [33.9, 46.1],
      [34.2, 46.0],
      [34.5, 45.95],
      [34.8, 45.9],
    ],
  },

  // ── Western Sahara: the Berm (1991 ceasefire line) ────────────────────
  // 2700km sand wall built by Morocco during the Western Sahara conflict.
  // Separates Morocco-administered territory (west) from SADR-claimed
  // "Free Zone" (east). Simplified to ~8 vertices.
  {
    tag: "western-sahara-berm",
    name: "Western Sahara: the Berm (1991 ceasefire line)",
    notes:
      "Morocco's 2700km sand wall. Separates Morocco-administered " +
      "territory from Polisario-controlled 'Free Zone'.",
    coords: [
      [-8.7, 27.7],
      [-9.5, 27.3],
      [-10.5, 26.5],
      [-11.3, 25.7],
      [-12.0, 24.8],
      [-12.8, 23.8],
      [-13.5, 22.8],
      [-13.9, 21.5],
    ],
  },
];

/** Build a lookup: tag → boundary entries (multiple per tag allowed). */
const BY_TAG = (() => {
  const m: Record<string, DisputedBoundary[]> = {};
  for (const b of DISPUTED_BOUNDARIES) {
    (m[b.tag] ??= []).push(b);
  }
  return m;
})();

/**
 * Resolve a tag (or array of tags) → boundaries. Empty array when no tags
 * match (silently — author error, not a render-breaking condition).
 */
export const getDisputedBoundaries = (
  tags: readonly string[] | true,
): DisputedBoundary[] => {
  if (tags === true) return [...DISPUTED_BOUNDARIES];
  const out: DisputedBoundary[] = [];
  for (const t of tags) {
    if (BY_TAG[t]) out.push(...BY_TAG[t]);
  }
  return out;
};

/** All available tags — useful for dev-mode introspection / dossier auto-generation. */
export const ALL_DISPUTE_TAGS: readonly string[] = Object.keys(BY_TAG);

/**
 * Densify a polyline by inserting intermediate vertices so no segment
 * spans more than `maxStepDeg` of arc (linear in lon/lat, not great-circle —
 * sufficient for dispute polylines that are mostly small regional spans).
 *
 * Why this exists (B1 audit fix): when an orthographic projection is
 * applied, d3-geo clips geometry to the visible hemisphere via its
 * internal sphere-clip algorithm. For LineStrings whose segments span
 * the day/night terminator, the clip needs enough vertex density to find
 * the crossing point. Sparse polylines (the nine-dash line has 13 verts
 * across a ~17° span = ~1.3°/seg, which is fine; Kashmir's 8 verts
 * across ~3° = ~0.4°/seg, also fine; but the Western Sahara berm has
 * 8 verts across ~6° = ~0.75°/seg, edge case) sometimes render with
 * visible artifacts at the terminator. Densifying to 1° max step
 * eliminates the artifacts at trivial cost (a 30° span goes from ~3
 * vertices to 30 — still hundreds of times cheaper than country paths).
 */
export const densifyPolyline = (
  coords: readonly [number, number][],
  maxStepDeg: number = 1,
): [number, number][] => {
  if (coords.length < 2) return coords as [number, number][];
  const out: [number, number][] = [coords[0]];
  for (let i = 1; i < coords.length; i++) {
    const [lon0, lat0] = coords[i - 1];
    const [lon1, lat1] = coords[i];
    // Shortest-arc longitude delta (handles antimeridian wrap)
    let lonDelta = lon1 - lon0;
    if (lonDelta > 180) lonDelta -= 360;
    if (lonDelta < -180) lonDelta += 360;
    const latDelta = lat1 - lat0;
    const arcDeg = Math.max(Math.abs(lonDelta), Math.abs(latDelta));
    const steps = Math.max(1, Math.ceil(arcDeg / maxStepDeg));
    for (let s = 1; s <= steps; s++) {
      const t = s / steps;
      const lon = lon0 + lonDelta * t;
      const lat = lat0 + latDelta * t;
      // Wrap longitude back into [-180, 180]
      const wrapped = ((lon + 540) % 360) - 180;
      out.push([wrapped, lat]);
    }
  }
  return out;
};
