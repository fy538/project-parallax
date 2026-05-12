/**
 * disputedBoundaries — unit tests for the curated dispute lookup +
 * geometry sanity.
 *
 * Reference: src/utils/disputedBoundaries.ts
 */

import { describe, expect, it } from "vitest";
import {
  DISPUTED_BOUNDARIES,
  ALL_DISPUTE_TAGS,
  getDisputedBoundaries,
  densifyPolyline,
} from "../utils/disputedBoundaries";

describe("DISPUTED_BOUNDARIES curated set", () => {
  it("contains the 5 minimum geopolitical disputes", () => {
    const tags = new Set(DISPUTED_BOUNDARIES.map((b) => b.tag));
    expect(tags.has("taiwan-strait")).toBe(true);
    expect(tags.has("nine-dash")).toBe(true);
    expect(tags.has("kashmir-loc")).toBe(true);
    expect(tags.has("crimea")).toBe(true);
    expect(tags.has("western-sahara-berm")).toBe(true);
  });

  it("each entry has a name, notes, and >=2 coordinate pairs", () => {
    for (const b of DISPUTED_BOUNDARIES) {
      expect(b.name).toBeTruthy();
      expect(b.notes).toBeTruthy();
      expect(b.coords.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("all coordinates are valid lon/lat pairs", () => {
    for (const b of DISPUTED_BOUNDARIES) {
      for (const [lon, lat] of b.coords) {
        expect(lon).toBeGreaterThanOrEqual(-180);
        expect(lon).toBeLessThanOrEqual(180);
        expect(lat).toBeGreaterThanOrEqual(-90);
        expect(lat).toBeLessThanOrEqual(90);
      }
    }
  });

  it("ALL_DISPUTE_TAGS matches the tag set on the curated entries", () => {
    const tagsFromData = new Set(DISPUTED_BOUNDARIES.map((b) => b.tag));
    const tagsFromExport = new Set(ALL_DISPUTE_TAGS);
    expect(tagsFromExport).toEqual(tagsFromData);
  });
});

describe("getDisputedBoundaries", () => {
  it("returns all boundaries when called with `true`", () => {
    const all = getDisputedBoundaries(true);
    expect(all.length).toBe(DISPUTED_BOUNDARIES.length);
  });

  it("returns only requested tags when called with an array", () => {
    const subset = getDisputedBoundaries(["taiwan-strait", "nine-dash"]);
    expect(subset.length).toBe(2);
    expect(new Set(subset.map((b) => b.tag))).toEqual(
      new Set(["taiwan-strait", "nine-dash"]),
    );
  });

  it("returns empty array for unknown tags (silent, not throwing)", () => {
    expect(getDisputedBoundaries(["nonexistent-dispute"])).toEqual([]);
  });

  it("returns empty array for empty input", () => {
    expect(getDisputedBoundaries([])).toEqual([]);
  });

  it("preserves duplicates when same tag listed twice (rare but defensible)", () => {
    // Authors might double-list by accident; the function trusts input.
    const dupes = getDisputedBoundaries(["crimea", "crimea"]);
    expect(dupes.length).toBe(2);
  });
});

// ── densifyPolyline (B1 audit fix) ────────────────────────────────────────

describe("densifyPolyline", () => {
  it("returns the input unchanged when <2 points (degenerate input)", () => {
    expect(densifyPolyline([], 1)).toEqual([]);
    expect(densifyPolyline([[0, 0]], 1)).toEqual([[0, 0]]);
  });

  it("preserves endpoints exactly", () => {
    const out = densifyPolyline([[0, 0], [10, 5]], 1);
    expect(out[0]).toEqual([0, 0]);
    expect(out[out.length - 1]).toEqual([10, 5]);
  });

  it("inserts intermediate points so no segment exceeds maxStepDeg", () => {
    // 30° lon span at 1° max step → at least 30 segments.
    const out = densifyPolyline([[0, 0], [30, 0]], 1);
    expect(out.length).toBeGreaterThanOrEqual(31); // start + ≥30 intermediate
    // Check that no consecutive segment spans more than ~maxStepDeg
    // (with floating-point slack).
    for (let i = 1; i < out.length; i++) {
      const dLon = Math.abs(out[i][0] - out[i - 1][0]);
      const dLat = Math.abs(out[i][1] - out[i - 1][1]);
      expect(Math.max(dLon, dLat)).toBeLessThanOrEqual(1.01);
    }
  });

  it("handles antimeridian crossing via shortest-arc lon delta", () => {
    // 170° → -170° should densify the SHORT WAY (20° span across the
    // antimeridian) rather than the long way (340° around the globe).
    const out = densifyPolyline([[170, 0], [-170, 0]], 1);
    // 20° span / 1°-step → ~20 intermediate points + endpoints = ~21 total.
    expect(out.length).toBeGreaterThanOrEqual(20);
    expect(out.length).toBeLessThanOrEqual(30);
  });

  it("does NOT alter polylines already finer than maxStepDeg", () => {
    // 0.5° step in input < 1° max → no densification.
    const input: [number, number][] = [[0, 0], [0.5, 0.5], [1.0, 1.0]];
    const out = densifyPolyline(input, 1);
    expect(out).toEqual(input);
  });
});
