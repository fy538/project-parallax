/**
 * Graticule — unit tests for geometry generation + config resolution.
 *
 * Visual rendering is exercised separately via the map-real-data PNG suite.
 * This suite covers the pure helpers — fast, no browser required.
 *
 * Reference: components/Graticule.tsx
 */

import { describe, expect, it } from "vitest";
import {
  buildGraticuleFeature,
  buildGraticuleLayers,
  resolveGraticuleConfig,
} from "../components/Graticule";
import { palette } from "../design/theme";

// ── resolveGraticuleConfig ────────────────────────────────────────────────

describe("resolveGraticuleConfig", () => {
  it("returns null when no config given", () => {
    expect(resolveGraticuleConfig(undefined, false)).toBeNull();
  });

  it("applies defaults for empty config", () => {
    const r = resolveGraticuleConfig({}, false);
    expect(r).toEqual({
      spacing: 10,
      opacity: 0.1,
      emphasize30: true,
      color: palette.ink,
    });
  });

  it("picks bone color in dark mode by default", () => {
    const r = resolveGraticuleConfig({}, true);
    expect(r?.color).toBe(palette.bone);
  });

  it("explicit color overrides theme color", () => {
    const r = resolveGraticuleConfig({ color: "#FF0000" }, true);
    expect(r?.color).toBe("#FF0000");
  });

  it("preserves user-specified spacing and opacity", () => {
    const r = resolveGraticuleConfig(
      { spacing: 5, opacity: 0.2, emphasize30: false },
      false,
    );
    expect(r).toEqual({
      spacing: 5,
      opacity: 0.2,
      emphasize30: false,
      color: palette.ink,
    });
  });
});

// ── buildGraticuleFeature ─────────────────────────────────────────────────

describe("buildGraticuleFeature", () => {
  it("returns a GeoJSON Feature wrapping a MultiLineString", () => {
    const feature = buildGraticuleFeature(10);
    expect(feature.type).toBe("Feature");
    expect(feature.geometry.type).toBe("MultiLineString");
    expect(Array.isArray(feature.geometry.coordinates)).toBe(true);
  });

  it("produces more lines at finer step", () => {
    const f10 = buildGraticuleFeature(10);
    const f30 = buildGraticuleFeature(30);
    // 10° spacing has ~3× the lines of 30° (in each axis); strictly more.
    expect(f10.geometry.coordinates.length).toBeGreaterThan(
      f30.geometry.coordinates.length,
    );
  });

  it("each line is a non-empty array of [lon, lat] pairs", () => {
    const feature = buildGraticuleFeature(30);
    for (const line of feature.geometry.coordinates) {
      expect(line.length).toBeGreaterThan(0);
      for (const point of line) {
        expect(point).toHaveLength(2);
        expect(typeof point[0]).toBe("number");
        expect(typeof point[1]).toBe("number");
      }
    }
  });
});

// ── buildGraticuleLayers ──────────────────────────────────────────────────

describe("buildGraticuleLayers", () => {
  it("returns empty array when config is undefined", () => {
    expect(buildGraticuleLayers(undefined)).toEqual([]);
  });

  it("returns 2 layers when emphasize30 is true (default) and spacing != 30", () => {
    const layers = buildGraticuleLayers({ spacing: 10 });
    expect(layers).toHaveLength(2);
    expect(layers[0].id).toBe("graticule-minor");
    expect(layers[1].id).toBe("graticule-major");
  });

  it("returns 1 layer when emphasize30 is false", () => {
    const layers = buildGraticuleLayers({ spacing: 10, emphasize30: false });
    expect(layers).toHaveLength(1);
    expect(layers[0].id).toBe("graticule-minor");
  });

  it("returns 1 layer when spacing == 30 (major would be redundant)", () => {
    const layers = buildGraticuleLayers({ spacing: 30 });
    expect(layers).toHaveLength(1);
  });

  it("major layer opacity is capped at 0.25 even when 2× minor exceeds cap", () => {
    // opacity 0.20 → 2× = 0.40 → cap to 0.25 → alpha 64
    const layers = buildGraticuleLayers({ spacing: 10, opacity: 0.2 });
    const major = layers[1] as any;
    const majorAlpha = major.props.getLineColor[3];
    expect(majorAlpha).toBeLessThanOrEqual(64); // 0.25 * 255 = 63.75 → 64
  });

  it("minor layer alpha matches opacity * 255", () => {
    const layers = buildGraticuleLayers({ spacing: 10, opacity: 0.1 });
    const minor = layers[0] as any;
    expect(minor.props.getLineColor[3]).toBe(Math.round(0.1 * 255));
  });
});
