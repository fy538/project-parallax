/**
 * Unit tests for the ReliefUnderlay component — pins:
 *
 *   • asset-URL convention (must match the prep script's output path)
 *   • supported-projection enumeration (shared source of truth)
 *   • cache-reset helper behavior (actually clears the dedupe state)
 *
 * The DOM render path is covered by the catalog visual-regression tests
 * (see __tests__/maps-visual.test.ts after the prepare-shaded-relief
 * script has been run); here we test the pure functional surface.
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  reliefAssetUrl,
  __resetReliefCachesForTest,
  __hasFailedForTest,
  __markFailedForTest,
} from "../templates/AtlasPlate/ReliefUnderlay";
import { RELIEF_SUPPORTED_PROJECTIONS } from "../templates/AtlasPlate/reliefProjections";

describe("reliefAssetUrl", () => {
  // The helper routes through Remotion's `staticFile()` which returns an
  // absolute URL with the dev server's origin (e.g.
  // "http://localhost:3000/geo/relief/equalEarth.png" under Studio, or
  // the per-render base path under Lambda). We assert the SUFFIX rather
  // than the full URL so the test stays portable across environments.
  it("emits the canonical geo/relief/<projection>.png path", () => {
    expect(reliefAssetUrl("equalEarth")).toMatch(
      /geo\/relief\/equalEarth\.png$/,
    );
    expect(reliefAssetUrl("naturalEarth")).toMatch(
      /geo\/relief\/naturalEarth\.png$/,
    );
    expect(reliefAssetUrl("equirectangular")).toMatch(
      /geo\/relief\/equirectangular\.png$/,
    );
  });

  it("returns a URL even for unsupported projections (component decides what to do)", () => {
    expect(reliefAssetUrl("orthographic")).toMatch(
      /geo\/relief\/orthographic\.png$/,
    );
    expect(reliefAssetUrl("albersUsa")).toMatch(
      /geo\/relief\/albersUsa\.png$/,
    );
  });
});

describe("RELIEF_SUPPORTED_PROJECTIONS", () => {
  it("includes exactly the v1 projection set", () => {
    expect([...RELIEF_SUPPORTED_PROJECTIONS]).toEqual([
      "equalEarth",
      "naturalEarth",
      "equirectangular",
    ]);
  });

  // If a future commit adds a 4th projection, the test above will fail
  // and force the author to also update the warp script's PROJECTIONS
  // dict (the script's start-up assertion errors loudly on drift). This
  // is the cross-file contract — the test guards the runtime side.
});

describe("__resetReliefCachesForTest", () => {
  beforeEach(() => {
    __resetReliefCachesForTest();
  });

  it("clears the failed-asset cache so a projection is no longer flagged", () => {
    expect(__hasFailedForTest("equalEarth")).toBe(false);
    __markFailedForTest("equalEarth");
    expect(__hasFailedForTest("equalEarth")).toBe(true);
    __resetReliefCachesForTest();
    expect(__hasFailedForTest("equalEarth")).toBe(false);
  });

  it("is idempotent — calling multiple times in a row stays clear", () => {
    __resetReliefCachesForTest();
    __resetReliefCachesForTest();
    expect(__hasFailedForTest("equalEarth")).toBe(false);
  });
});
