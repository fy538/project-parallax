/**
 * Cascade resolver contract tests.
 *
 * Lock the 5 priority levels for `preset` and the 3 per-field cascades
 * for `effects` and `intensity`. If a future edit reorders the chain,
 * one of these explodes loudly.
 */

import { describe, it, expect } from "vitest";
import {
  resolveFilmOverlay,
  type FilmOverlayConfig,
  type BackdropPresetHint,
} from "../utils/resolveFilmOverlay";
import { FILM_OVERLAY_PRESETS, TEMPLATE_PRESET_MAP } from "../components/FilmOverlayPresets";

// Pull baselines so test expectations track preset definitions, not literals.
const CLEAN = FILM_OVERLAY_PRESETS["clean"];
const DOCUMENTARY = FILM_OVERLAY_PRESETS["documentary"];
const CINEMATIC = FILM_OVERLAY_PRESETS["cinematic"];
const ARCHIVAL = FILM_OVERLAY_PRESETS["archival"];

// ── preset cascade (5 levels) ───────────────────────────────────────────────

describe("resolveFilmOverlay — preset cascade (5 levels)", () => {
  it("level 1: segment override wins over everything else", () => {
    const result = resolveFilmOverlay(
      { preset: "archival" },                    // segment
      { recommendedPreset: "cinematic" },        // backdrop
      "DataChart",                               // template (map says clean)
      { preset: "documentary" },                 // episode
    );
    expect(result.preset).toBe("archival");
  });

  it("level 2: backdrop preset wins when no segment override", () => {
    const result = resolveFilmOverlay(
      null,
      { recommendedPreset: "cinematic" },
      "DataChart",                               // map says clean
      { preset: "documentary" },
    );
    expect(result.preset).toBe("cinematic");
  });

  it("level 3: TEMPLATE_PRESET_MAP wins when no segment or backdrop preset", () => {
    const result = resolveFilmOverlay(
      null,
      null,
      "DataChart",                               // map says clean
      { preset: "documentary" },
    );
    expect(result.preset).toBe("clean");
  });

  it("level 3: backdrop without recommendedPreset falls through to template map", () => {
    const result = resolveFilmOverlay(
      null,
      {},                                        // backdrop hint without field
      "KineticTypography",                       // map says cinematic
      null,
    );
    expect(result.preset).toBe("cinematic");
  });

  it("level 4: episode default applies when no segment/backdrop/template", () => {
    const result = resolveFilmOverlay(
      null,
      null,
      "",                                        // no template name → skip level 3
      { preset: "archival" },
    );
    expect(result.preset).toBe("archival");
  });

  it("level 4: unknown template name falls through to episode default", () => {
    const result = resolveFilmOverlay(
      null,
      null,
      "NonExistentTemplate",                     // not in TEMPLATE_PRESET_MAP
      { preset: "archival" },
    );
    expect(result.preset).toBe("archival");
  });

  it("level 5: documentary default when all cascade layers are empty", () => {
    const result = resolveFilmOverlay(null, null, "", null);
    expect(result.preset).toBe("documentary");
  });

  it("level 5: unknown template + episode with no preset → documentary", () => {
    const result = resolveFilmOverlay(
      null,
      null,
      "NonExistentTemplate",
      { intensity: 0.8 },                        // episode set, but no preset field
    );
    expect(result.preset).toBe("documentary");
  });

  it("invalid preset names are ignored (defensive against bad data)", () => {
    const result = resolveFilmOverlay(
      { preset: "totally-fake-preset" as unknown as never },
      null,
      "DataChart",
      null,
    );
    expect(result.preset).toBe("clean");  // falls through to template map
  });
});

// ── per-field cascade for effects + intensity ───────────────────────────────

describe("resolveFilmOverlay — per-field cascade (effects + intensity)", () => {
  it("effects: segment override wins", () => {
    const result = resolveFilmOverlay(
      { effects: ["grain", "vignette"] },
      null,
      "DataChart",
      { effects: ["scratch"], intensity: 0.5 },
    );
    expect(result.effects).toEqual(["grain", "vignette"]);
  });

  it("effects: episode override applies when segment is silent", () => {
    const result = resolveFilmOverlay(
      null,
      null,
      "DataChart",
      { effects: ["scratch"] },
    );
    expect(result.effects).toEqual(["scratch"]);
  });

  it("effects: falls through to preset's effects when neither override is set", () => {
    const result = resolveFilmOverlay(
      null,
      null,
      "DataChart",  // resolves to `clean`
      null,
    );
    expect(result.effects).toEqual(CLEAN.effects);
  });

  it("intensity: segment override wins", () => {
    const result = resolveFilmOverlay(
      { intensity: 0.9 },
      null,
      "DataChart",
      { intensity: 0.2 },
    );
    expect(result.intensity).toBe(0.9);
  });

  it("intensity: episode override applies when segment is silent", () => {
    const result = resolveFilmOverlay(null, null, "DataChart", { intensity: 0.2 });
    expect(result.intensity).toBe(0.2);
  });

  it("intensity: falls through to preset baseline when neither override is set", () => {
    const result = resolveFilmOverlay(
      null,
      null,
      "KineticTypography",  // resolves to `cinematic`
      null,
    );
    expect(result.intensity).toBe(CINEMATIC.intensity);
  });

  it("per-field independence: segment overrides intensity only, preset/effects from cascade", () => {
    const result = resolveFilmOverlay(
      { intensity: 0.55 },                  // segment overrides ONLY intensity
      { recommendedPreset: "archival" },    // backdrop drives preset
      "DataChart",
      null,
    );
    expect(result.preset).toBe("archival");
    expect(result.effects).toEqual(ARCHIVAL.effects);
    expect(result.intensity).toBe(0.55);
  });

  it("intensity: 0 is a valid override (not falsy-coerced)", () => {
    const result = resolveFilmOverlay(
      { intensity: 0 },
      null,
      "DataChart",
      null,
    );
    expect(result.intensity).toBe(0);
  });
});

// ── Sanity: TEMPLATE_PRESET_MAP entries actually resolve ────────────────────

describe("resolveFilmOverlay — TEMPLATE_PRESET_MAP integration", () => {
  it("every entry in TEMPLATE_PRESET_MAP resolves to a valid preset name", () => {
    for (const [template, presetName] of Object.entries(TEMPLATE_PRESET_MAP)) {
      expect(FILM_OVERLAY_PRESETS[presetName]).toBeDefined();
      const result = resolveFilmOverlay(null, null, template, null);
      expect(result.preset).toBe(presetName);
    }
  });
});
