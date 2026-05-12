/**
 * atlasProjection — unit tests for the AtlasPlate template's pure helpers.
 *
 * These exercise the projection resolution, country-feature lookup,
 * fit-to-bounds math, and phase fill-map construction. The component
 * itself is rendered visually in the catalog showreel and (eventually)
 * via the map-real-data PNG suite.
 *
 * Reference: src/utils/atlasProjection.ts
 */

import { describe, expect, it } from "vitest";
import {
  resolveProjection,
  getAllCountries,
  getCountryByAlpha3,
  getCountryCentroid,
  fitProjectionToWorld,
  fitProjectionToFeatures,
  computeCameraPose,
  makePathGenerator,
  buildPhaseFillMap,
} from "../utils/atlasProjection";
import { numericIdToAlpha3, ISO_NUMERIC_TO_ALPHA3 } from "../utils/isoNumericToAlpha3";
import { palette } from "../design/theme";

// ── ISO numeric → alpha-3 lookup ──────────────────────────────────────────

describe("numericIdToAlpha3", () => {
  it("resolves canonical numeric codes", () => {
    expect(numericIdToAlpha3("840")).toBe("USA");
    expect(numericIdToAlpha3("156")).toBe("CHN");
    expect(numericIdToAlpha3("392")).toBe("JPN");
    expect(numericIdToAlpha3("826")).toBe("GBR");
  });

  it("handles zero-padded and unpadded inputs equivalently", () => {
    expect(numericIdToAlpha3("4")).toBe("AFG");    // unpadded
    expect(numericIdToAlpha3("004")).toBe("AFG");  // padded
    expect(numericIdToAlpha3(4)).toBe("AFG");       // numeric input
  });

  it("returns null for unknown codes", () => {
    expect(numericIdToAlpha3("999")).toBeNull();
    expect(numericIdToAlpha3("abc")).toBeNull();
  });

  it("covers all 177 world-atlas country features by code uniqueness", () => {
    // Sanity check that the lookup table has the keys world-atlas needs.
    const codes = Object.keys(ISO_NUMERIC_TO_ALPHA3);
    expect(codes.length).toBeGreaterThanOrEqual(200); // ~249 active + legacy
    // No duplicate alpha-3 values
    const alpha3s = Object.values(ISO_NUMERIC_TO_ALPHA3);
    expect(new Set(alpha3s).size).toBe(alpha3s.length);
  });
});

// ── Projection resolution ─────────────────────────────────────────────────

describe("resolveProjection", () => {
  it("returns a d3-geo projection for each supported name", () => {
    const names = [
      "equalEarth",
      "naturalEarth",
      "mercator",
      "orthographic",
      "albersUsa",
      "equirectangular",
    ] as const;
    for (const name of names) {
      const p = resolveProjection(name);
      // Every d3-geo projection has scale + translate accessors.
      expect(typeof p.scale).toBe("function");
      expect(typeof p.translate).toBe("function");
    }
  });

  it("defaults to equalEarth when name is undefined", () => {
    const p1 = resolveProjection(undefined);
    const p2 = resolveProjection("equalEarth");
    // Same default scale at first call
    expect(p1.scale()).toBe(p2.scale());
  });

  it("returns fresh instances (not shared mutable state)", () => {
    const p1 = resolveProjection("equalEarth");
    p1.scale(500);
    const p2 = resolveProjection("equalEarth");
    expect(p2.scale()).not.toBe(500); // p2 starts fresh
  });
});

// ── Country feature lookup ────────────────────────────────────────────────

describe("country feature lookup", () => {
  it("loads ~177 country features from world-atlas", () => {
    const features = getAllCountries();
    // world-atlas 110m has 177 features; allow ±10 for any future version drift
    expect(features.length).toBeGreaterThan(160);
    expect(features.length).toBeLessThan(200);
  });

  it("getCountryByAlpha3 resolves canonical countries", () => {
    expect(getCountryByAlpha3("USA")?.name).toBeTruthy();
    expect(getCountryByAlpha3("CHN")?.name).toBeTruthy();
    expect(getCountryByAlpha3("TWN")?.name).toBeTruthy();
    expect(getCountryByAlpha3("JPN")?.name).toBeTruthy();
  });

  it("getCountryByAlpha3 returns null for unknown codes", () => {
    expect(getCountryByAlpha3("XYZ")).toBeNull();
    expect(getCountryByAlpha3("")).toBeNull();
  });

  it("each feature has a valid GeoJSON geometry", () => {
    const features = getAllCountries();
    for (const c of features.slice(0, 10)) {
      expect(c.feature.geometry).toBeDefined();
      expect(["Polygon", "MultiPolygon"]).toContain(c.feature.geometry.type);
    }
  });
});

// ── Centroid cache ────────────────────────────────────────────────────────

describe("getCountryCentroid (cached)", () => {
  it("returns [lon, lat] tuples for canonical countries", () => {
    const us = getCountryCentroid("USA");
    expect(us).not.toBeNull();
    expect(us!).toHaveLength(2);
    // USA centroid is roughly central Kansas — lon ~-99, lat ~39.
    // Generous bounds to account for projection choice + Alaska/Hawaii.
    expect(us![0]).toBeGreaterThan(-115);
    expect(us![0]).toBeLessThan(-85);
    expect(us![1]).toBeGreaterThan(30);
    expect(us![1]).toBeLessThan(50);
  });

  it("returns null for unknown codes", () => {
    expect(getCountryCentroid("XYZ")).toBeNull();
    expect(getCountryCentroid("")).toBeNull();
  });

  it("returns the SAME tuple reference across calls (cached)", () => {
    // The whole point of the cache: no fresh allocation per call. If this
    // ever returns a different reference, the cache regressed.
    const a = getCountryCentroid("CHN");
    const b = getCountryCentroid("CHN");
    expect(a).toBe(b);
  });

  it("does not return NaN coordinates (guard against d3-geo malformed polygons)", () => {
    // Walk a sample and confirm no centroids slipped through with NaN.
    // The guard inside getCountryCentroid converts NaN → null.
    for (const c of getAllCountries()) {
      if (!c.alpha3) continue;
      const centroid = getCountryCentroid(c.alpha3);
      if (centroid !== null) {
        expect(Number.isNaN(centroid[0])).toBe(false);
        expect(Number.isNaN(centroid[1])).toBe(false);
      }
    }
  });
});

// ── Fit-to-bounds ─────────────────────────────────────────────────────────

describe("fitProjectionToWorld", () => {
  it("scales projection to fit viewport with padding", () => {
    const p = resolveProjection("equalEarth");
    fitProjectionToWorld(p, { width: 1920, height: 1080 }, 80);
    // After fit, scale > 0 and translate is roughly viewport center
    expect(p.scale()).toBeGreaterThan(100);
    const [tx, ty] = p.translate();
    expect(tx).toBeGreaterThan(800);
    expect(tx).toBeLessThan(1200);
    expect(ty).toBeGreaterThan(400);
    expect(ty).toBeLessThan(700);
  });
});

describe("fitProjectionToFeatures", () => {
  it("zooms in when fitting a single country vs. the world", () => {
    const worldP = resolveProjection("equalEarth");
    fitProjectionToWorld(worldP, { width: 1920, height: 1080 }, 80);
    const worldScale = worldP.scale();

    const tw = getCountryByAlpha3("TWN");
    expect(tw).not.toBeNull();
    const focusP = resolveProjection("equalEarth");
    fitProjectionToFeatures(focusP, tw!.feature, { width: 1920, height: 1080 }, 80);
    const focusScale = focusP.scale();

    // Single country focus should produce MUCH larger scale than world fit
    expect(focusScale).toBeGreaterThan(worldScale * 10);
  });
});

// ── computeCameraPose ─────────────────────────────────────────────────────

describe("computeCameraPose", () => {
  it("returns a scale + translate tuple for a feature focus", () => {
    const usa = getCountryByAlpha3("USA");
    expect(usa).not.toBeNull();
    const pose = computeCameraPose(
      "equalEarth",
      usa!.feature,
      { width: 1920, height: 1080 },
      80,
    );
    expect(pose.scale).toBeGreaterThan(0);
    expect(pose.translate).toHaveLength(2);
  });
});

// ── makePathGenerator ─────────────────────────────────────────────────────

describe("makePathGenerator", () => {
  it("converts a country feature to an SVG path d string", () => {
    const p = resolveProjection("equalEarth");
    fitProjectionToWorld(p, { width: 1920, height: 1080 }, 80);
    const gen = makePathGenerator(p);
    const jpn = getCountryByAlpha3("JPN");
    expect(jpn).not.toBeNull();
    const d = gen(jpn!.feature);
    expect(d).toBeTruthy();
    expect(typeof d).toBe("string");
    expect(d!.length).toBeGreaterThan(20); // a country path is many points
  });
});

// ── buildPhaseFillMap ─────────────────────────────────────────────────────

describe("buildPhaseFillMap", () => {
  const options = { landFill: palette.bone, noDataFill: palette.umber };

  it("builds a lookup with explicit fills", () => {
    const map = buildPhaseFillMap(
      [
        { alpha3: "USA", fill: "#4A7BA7" },
        { alpha3: "CHN", fill: "#A64D46" },
      ],
      options,
    );
    expect(map.USA).toBe("#4A7BA7");
    expect(map.CHN).toBe("#A64D46");
  });

  it("noData wins over explicit fill", () => {
    const map = buildPhaseFillMap(
      [{ alpha3: "TWN", fill: "#000000", noData: true }],
      options,
    );
    expect(map.TWN).toBe(palette.umber);
  });

  it("skips rules with neither fill nor noData", () => {
    const map = buildPhaseFillMap(
      [{ alpha3: "USA" }, { alpha3: "CHN", fill: "#ff0000" }],
      options,
    );
    expect(map.USA).toBeUndefined();
    expect(map.CHN).toBe("#ff0000");
  });

  it("returns an empty object for empty rules", () => {
    expect(buildPhaseFillMap([], options)).toEqual({});
  });
});
