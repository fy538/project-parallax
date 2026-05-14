/**
 * Unit tests for the Mapbox Standard `lightPreset` runtime — covers the
 * setConfigProperty call shape, the import-name probe (basemap default,
 * fallback to first import), and graceful no-op for classic styles.
 *
 * Companion to labelDensity.test.ts — both prove the
 * Mapbox-Standard-config-property family is wired correctly.
 */

import { describe, it, expect, vi } from "vitest";
import { applyLightPreset } from "../components/MapGL";
import { LightPresetSchema } from "../components/MapGL.types";

const makeMockMap = (
  imports: Array<{ id: string }> = [{ id: "basemap" }],
) => {
  const setConfigProperty = vi.fn<[string, string, unknown], void>();
  return {
    setConfigProperty,
    getStyle: () => ({ imports }),
  };
};

describe("LightPresetSchema", () => {
  it("accepts the four canonical presets", () => {
    expect(LightPresetSchema.parse("day")).toBe("day");
    expect(LightPresetSchema.parse("dawn")).toBe("dawn");
    expect(LightPresetSchema.parse("dusk")).toBe("dusk");
    expect(LightPresetSchema.parse("night")).toBe("night");
  });

  it("rejects unknown presets", () => {
    expect(() => LightPresetSchema.parse("twilight")).toThrow();
    expect(() => LightPresetSchema.parse("noon")).toThrow();
  });
});

describe("applyLightPreset", () => {
  it("calls setConfigProperty('basemap', 'lightPreset', value)", () => {
    const map = makeMockMap();
    const ok = applyLightPreset(map, "dusk");
    expect(ok).toBe(true);
    expect(map.setConfigProperty).toHaveBeenCalledWith(
      "basemap",
      "lightPreset",
      "dusk",
    );
  });

  it("handles every preset value", () => {
    for (const preset of ["day", "dawn", "dusk", "night"] as const) {
      const map = makeMockMap();
      const ok = applyLightPreset(map, preset);
      expect(ok).toBe(true);
      expect(map.setConfigProperty).toHaveBeenCalledWith(
        "basemap",
        "lightPreset",
        preset,
      );
    }
  });

  it("returns false (no-op) when setConfigProperty is missing", () => {
    const mapWithoutApi = { getStyle: () => ({ imports: [] }) };
    const ok = applyLightPreset(mapWithoutApi, "dawn");
    expect(ok).toBe(false);
  });

  it("prefers 'basemap' when multiple imports exist", () => {
    const map = makeMockMap([
      { id: "overlay" },
      { id: "basemap" },
      { id: "labels" },
    ]);
    applyLightPreset(map, "night");
    expect(map.setConfigProperty.mock.calls[0][0]).toBe("basemap");
  });

  it("falls back to the first import when no 'basemap' is present", () => {
    const map = makeMockMap([{ id: "customStandard" }]);
    applyLightPreset(map, "dawn");
    expect(map.setConfigProperty.mock.calls[0][0]).toBe("customStandard");
  });

  it("returns false when setConfigProperty throws", () => {
    const map = {
      setConfigProperty: vi.fn(() => {
        throw new Error("style not loaded");
      }),
      getStyle: () => ({ imports: [{ id: "basemap" }] }),
    };
    const ok = applyLightPreset(map, "dusk");
    expect(ok).toBe(false);
  });
});
