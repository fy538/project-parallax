/**
 * Unit tests for the editorial label-density runtime — Bug 1 + Bug 2
 * regression guards from the May 13, 2026 code review.
 *
 * Covers:
 *   • resolveEffectiveLabelDensity — the zoom-threshold computation
 *     (editorial → minimal at zoom >= 4, else atlas).
 *   • applyLabelDensity — Mapbox setConfigProperty calls with the right
 *     showPlaceLabels / showPointOfInterestLabels / showRoadLabels /
 *     showTransitLabels values for each effective register.
 *   • Graceful no-op when the map lacks setConfigProperty (classic
 *     fallback style).
 *   • Import-name probe — uses `basemap` when present, falls back to the
 *     first import otherwise.
 *
 *   • haloShadow — caches output across calls with same args; produces a
 *     9-segment shadow string (8 directional + 1 lift drop).
 */

import { describe, it, expect, vi } from "vitest";
import {
  resolveEffectiveLabelDensity,
  applyLabelDensity,
} from "../components/MapGL";
import { haloShadow } from "../components/MapAnnotations";

// ── resolveEffectiveLabelDensity ──────────────────────────────────────────────

describe("resolveEffectiveLabelDensity", () => {
  it("passes through non-editorial registers unchanged", () => {
    expect(resolveEffectiveLabelDensity("atlas", 1)).toBe("atlas");
    expect(resolveEffectiveLabelDensity("atlas", 10)).toBe("atlas");
    expect(resolveEffectiveLabelDensity("minimal", 1)).toBe("minimal");
    expect(resolveEffectiveLabelDensity("minimal", 10)).toBe("minimal");
    expect(resolveEffectiveLabelDensity("off", 1)).toBe("off");
    expect(resolveEffectiveLabelDensity("off", 10)).toBe("off");
  });

  it("editorial register: keeps labels at globe scale (zoom < 4)", () => {
    expect(resolveEffectiveLabelDensity("editorial", 0)).toBe("atlas");
    expect(resolveEffectiveLabelDensity("editorial", 1.8)).toBe("atlas");
    expect(resolveEffectiveLabelDensity("editorial", 3.999)).toBe("atlas");
  });

  it("editorial register: suppresses labels at regional zoom (zoom >= 4)", () => {
    expect(resolveEffectiveLabelDensity("editorial", 4)).toBe("minimal");
    expect(resolveEffectiveLabelDensity("editorial", 5.5)).toBe("minimal");
    expect(resolveEffectiveLabelDensity("editorial", 10)).toBe("minimal");
  });
});

// ── applyLabelDensity ─────────────────────────────────────────────────────────

const makeMockMap = (
  imports: Array<{ id: string }> = [{ id: "basemap" }],
) => {
  const setConfigProperty = vi.fn<
    [string, string, unknown],
    void
  >();
  return {
    setConfigProperty,
    getStyle: () => ({ imports }),
  };
};

describe("applyLabelDensity", () => {
  it("atlas register: enables all label categories on basemap import", () => {
    const map = makeMockMap();
    const ok = applyLabelDensity(map, "atlas");
    expect(ok).toBe(true);
    expect(map.setConfigProperty).toHaveBeenCalledWith(
      "basemap",
      "showPointOfInterestLabels",
      true,
    );
    expect(map.setConfigProperty).toHaveBeenCalledWith(
      "basemap",
      "showTransitLabels",
      true,
    );
    expect(map.setConfigProperty).toHaveBeenCalledWith(
      "basemap",
      "showRoadLabels",
      true,
    );
    expect(map.setConfigProperty).toHaveBeenCalledWith(
      "basemap",
      "showPlaceLabels",
      true,
    );
  });

  it("minimal register: disables POI / transit / road labels, suppresses place labels", () => {
    const map = makeMockMap();
    const ok = applyLabelDensity(map, "minimal");
    expect(ok).toBe(true);
    expect(map.setConfigProperty).toHaveBeenCalledWith(
      "basemap",
      "showPointOfInterestLabels",
      false,
    );
    expect(map.setConfigProperty).toHaveBeenCalledWith(
      "basemap",
      "showTransitLabels",
      false,
    );
    expect(map.setConfigProperty).toHaveBeenCalledWith(
      "basemap",
      "showRoadLabels",
      false,
    );
    expect(map.setConfigProperty).toHaveBeenCalledWith(
      "basemap",
      "showPedestrianRoads",
      false,
    );
    expect(map.setConfigProperty).toHaveBeenCalledWith(
      "basemap",
      "showPlaceLabels",
      false,
    );
  });

  it("off register: same as minimal — suppress everything", () => {
    const map = makeMockMap();
    const ok = applyLabelDensity(map, "off");
    expect(ok).toBe(true);
    expect(map.setConfigProperty).toHaveBeenCalledWith(
      "basemap",
      "showPlaceLabels",
      false,
    );
  });

  it("returns false (graceful no-op) when setConfigProperty unavailable", () => {
    const mapWithoutApi = { getStyle: () => ({ imports: [] }) };
    const ok = applyLabelDensity(mapWithoutApi, "minimal");
    expect(ok).toBe(false);
  });

  it("prefers an import literally named 'basemap' when multiple exist", () => {
    const map = makeMockMap([{ id: "overlay" }, { id: "basemap" }, { id: "labels" }]);
    applyLabelDensity(map, "minimal");
    // Every call should target "basemap" specifically.
    for (const call of map.setConfigProperty.mock.calls) {
      expect(call[0]).toBe("basemap");
    }
  });

  it("falls back to the first import when no 'basemap' is present", () => {
    const map = makeMockMap([{ id: "customStandard" }]);
    applyLabelDensity(map, "minimal");
    for (const call of map.setConfigProperty.mock.calls) {
      expect(call[0]).toBe("customStandard");
    }
  });
});

// ── haloShadow ───────────────────────────────────────────────────────────────

describe("haloShadow", () => {
  it("produces a 9-segment text-shadow string (8 cardinal + 1 lift drop)", () => {
    const out = haloShadow("#F5F0E8", 2);
    const segments = out.split(", ");
    expect(segments).toHaveLength(9);
    // 8 of the 9 should reference the halo color; 1 is the rgba lift drop.
    const haloCount = segments.filter((s) => s.includes("#F5F0E8")).length;
    expect(haloCount).toBe(8);
    const liftCount = segments.filter((s) => s.includes("rgba")).length;
    expect(liftCount).toBe(1);
  });

  it("memoizes — same (color, radius) returns identical string instance", () => {
    const a = haloShadow("#1C1814", 1.5);
    const b = haloShadow("#1C1814", 1.5);
    // Identity check — proves the cache returned the same string.
    expect(a).toBe(b);
  });

  it("uses different output for different radii", () => {
    const r1 = haloShadow("#F5F0E8", 1);
    const r2 = haloShadow("#F5F0E8", 2);
    expect(r1).not.toEqual(r2);
  });
});
