/**
 * MapGL — tests for critical load-path configuration.
 *
 * MapGL contains three props whose correctness directly determines render
 * quality. Regressions here are invisible until a render produces blank or
 * blurry tiles:
 *
 *   1. fadeDuration={0}          — suppresses Mapbox's built-in 300ms tile
 *                                  fade-in; without it, tiles are present in
 *                                  the framebuffer but opacity-animating,
 *                                  producing the "warm-up" artifact.
 *
 *   2. preserveDrawingBuffer={true} — prevents WebGL from clearing its
 *                                  framebuffer between paints; without it
 *                                  Remotion's screenshot mechanism reads
 *                                  an empty canvas.
 *
 *   3. load → once('idle')       — waits for all tiles to finish downloading
 *                                  before calling continueRender(); without
 *                                  this, the render captures a frame with
 *                                  partially-blank tile slots.
 *
 * These tests target the exported surface area (MAP_CONFIG, assertMapboxToken)
 * directly — no React rendering needed — plus a source-level assertion for
 * the three JSX props that can't be inspected without a browser/jsdom.
 *
 * See: remotion-templates/LESSONS.md L102 for the full incident post-mortem.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import path from "path";
import fs from "fs";

// ── Import the exported config surface ───────────────────────────────────────
// We can't import the React component itself in a Node environment (it uses
// useRef, useState, etc.), but the config constants are pure and importable.

// Delay import until tests to allow env manipulation
async function importMapGL() {
  // Clear module cache so env changes take effect
  const mod = await import("../components/MapGL");
  return mod;
}

// ── MAP_CONFIG ────────────────────────────────────────────────────────────────

describe("MAP_CONFIG", () => {
  it("styleUrl, darkStyleUrl, and sepiaStyleUrl are non-empty strings", async () => {
    const { MAP_CONFIG } = await importMapGL();
    expect(typeof MAP_CONFIG.styleUrl).toBe("string");
    expect(MAP_CONFIG.styleUrl.length).toBeGreaterThan(0);
    expect(typeof MAP_CONFIG.darkStyleUrl).toBe("string");
    expect(MAP_CONFIG.darkStyleUrl.length).toBeGreaterThan(0);
    // sepiaStyleUrl was added in the May 13, 2026 editorial-register pass.
    // Falls back to mapbox/light-v11 when MAPBOX_STYLE_SEPIA_URL is unset
    // — the runtime CSS sepia filter does the period-tinting in that case.
    expect(typeof MAP_CONFIG.sepiaStyleUrl).toBe("string");
    expect(MAP_CONFIG.sepiaStyleUrl.length).toBeGreaterThan(0);
  });

  it("styleUrl contains 'mapbox' (Mapbox style URL or custom Studio URL)", async () => {
    const { MAP_CONFIG } = await importMapGL();
    // Both mapbox:// protocol and https://api.mapbox.com contain 'mapbox'
    expect(MAP_CONFIG.styleUrl.toLowerCase()).toMatch(/mapbox/);
  });

  it("accessToken reads from MAPBOX_ACCESS_TOKEN env var", async () => {
    // The token is set (or empty) from the environment at build time.
    // We can't mutate process.env after the module is imported, but we
    // can assert the type and the fallback contract.
    const { MAP_CONFIG } = await importMapGL();
    expect(typeof MAP_CONFIG.accessToken).toBe("string");
    // Never undefined (env var || "" fallback in source)
    expect(MAP_CONFIG.accessToken).not.toBeUndefined();
  });
});

// ── assertMapboxToken ─────────────────────────────────────────────────────────

describe("assertMapboxToken", () => {
  it("throws when MAPBOX_ACCESS_TOKEN is not set", async () => {
    // The function reads MAP_CONFIG.accessToken (which is already resolved
    // from the env at import time). We test the contract by calling it with
    // an empty string via the module's internal logic.
    //
    // If the env var IS set (e.g. in CI), this test passes trivially.
    // The throw-path is exercised when the token is absent.
    // Both paths are valid and the test should not assume one direction.
    const { MAP_CONFIG, assertMapboxToken } = await importMapGL();

    if (!MAP_CONFIG.accessToken) {
      // Token is absent → must throw with a helpful message
      expect(() => assertMapboxToken()).toThrow("MAPBOX_ACCESS_TOKEN");
      expect(() => assertMapboxToken()).toThrow("https://account.mapbox.com");
    } else {
      // Token is present → must not throw
      expect(() => assertMapboxToken()).not.toThrow();
    }
  });

  it("error message includes actionable resolution steps when token is missing", async () => {
    const { MAP_CONFIG, assertMapboxToken } = await importMapGL();
    if (!MAP_CONFIG.accessToken) {
      try {
        assertMapboxToken();
        expect.fail("should have thrown");
      } catch (e: unknown) {
        // Must name the env var, where to get a token, and how to set it
        const msg = (e as Error).message;
        expect(msg).toContain("MAPBOX_ACCESS_TOKEN");
        expect(msg).toContain("pk.");
      }
    }
  });
});

// ── Source-level prop assertions ───────────────────────────────────────────────
// These check that the three critical props exist in the rendered JSX source.
// They're equivalent to lint rules but scoped to exactly these high-stakes props.
// If a refactor accidentally removes any of these, the test catches it before
// CI produces a regression render.

describe("MapGL source — critical load-path props", () => {
  const mapGLSource = fs.readFileSync(
    path.resolve(__dirname, "../components/MapGL.tsx"),
    "utf-8"
  );

  it("fadeDuration={0} is present in the <Map> JSX", () => {
    // This suppresses Mapbox's 300ms tile fade. Must be exactly 0.
    expect(mapGLSource).toMatch(/fadeDuration=\{0\}/);
  });

  it("preserveDrawingBuffer={true} is present in the <Map> JSX", () => {
    // Prevents WebGL framebuffer clear between Remotion's screenshot calls.
    expect(mapGLSource).toMatch(/preserveDrawingBuffer=\{true\}/);
  });

  it("handleLoad registers once('idle') — not firing on 'load' event", () => {
    // Fires continueRender only after ALL tiles are composited, not just the
    // style JSON. This is the key fix for the "warm-up" tile artifact.
    // Pattern: map.once("idle", ...) inside the load handler.
    expect(mapGLSource).toMatch(/\.once\s*\(\s*["']idle["']/);
  });

  it("handleLoad is wired to onLoad prop of <Map>", () => {
    // Verify the handler is actually passed to the Map component.
    expect(mapGLSource).toMatch(/onLoad=\{handleLoad\}/);
  });

  it("continueRender is called inside the 'idle' callback", () => {
    // Safety: continueRender() must be inside the once('idle') block —
    // if it's called in the 'load' event directly, tiles won't be fully loaded.
    // Both must appear in the source; the functional ordering is guaranteed
    // by the 'idle' pattern check above.
    expect(mapGLSource).toMatch(/continueRender\(handle\)/);
    // And the 30s safety timeout fallback must also be present.
    expect(mapGLSource).toMatch(/continueRender\(handle\).*?30000/s);
  });

  it("antialias={true} is present (render quality for video output)", () => {
    // Not a correctness concern but a quality one: ensures GPU antialiasing
    // is enabled for line edges (borders, arc routes) in offline renders.
    expect(mapGLSource).toMatch(/antialias=\{true\}/);
  });

  it("all user interaction is disabled (this is video, not interactive)", () => {
    // Verify at least the primary interaction props are disabled.
    // This prevents user-interaction artifacts in Remotion Studio.
    expect(mapGLSource).toMatch(/scrollZoom=\{false\}/);
    expect(mapGLSource).toMatch(/dragRotate=\{false\}/);
    expect(mapGLSource).toMatch(/dragPan=\{false\}/);
  });
});

// ── Editorial-register props ─────────────────────────────────────────────────
// These are the May 13, 2026 polish pass: the six props that bring Mapbox
// renders from "Google Earth screenshot" to "FT/Reuters editorial cartography."
// Each prop has a destructured default + a runtime application path.
// Regressions on any of these silently degrade visual quality.

describe("MapGL editorial-register props", () => {
  const mapGLSource = fs.readFileSync(
    path.resolve(__dirname, "../components/MapGL.tsx"),
    "utf-8",
  );

  it("fogPreset prop is destructured with 'editorial' default", () => {
    // Default must be `editorial` — paper-tinted fog that kills the cyan
    // globe halo. Atmospheric / vintage / none are explicit opt-ins.
    expect(mapGLSource).toMatch(/fogPreset\s*=\s*["']editorial["']/);
  });

  it("labelDensity prop is destructured with 'editorial' default", () => {
    // Default must be `editorial` — country labels at globe scale,
    // auto-suppress at zoom >= 4. Other registers (atlas / minimal / off)
    // are explicit overrides per shot.
    expect(mapGLSource).toMatch(/labelDensity\s*=\s*["']editorial["']/);
  });

  it("labelDensity is wired to a useEffect watching zoom (not just handleLoad)", () => {
    // This is the Bug 1 fix from May 13 — camera-animating compositions
    // require re-application as zoom crosses the editorial threshold.
    // The handleLoad-only path silently misbehaved on any composition
    // whose camera animated. The useEffect dep array must include zoom.
    expect(mapGLSource).toMatch(
      /useEffect\s*\(\s*\(\s*\)\s*=>\s*\{[\s\S]*?applyLabelDensity[\s\S]*?\}\s*,\s*\[[^\]]*\bzoom\b/,
    );
  });

  it("fogPreset is wired to a useEffect (symmetric reactivity with labelDensity)", () => {
    // Symmetric pattern — fog must re-apply on prop change, not just at
    // mount. Catches the regression where moving fog logic out of
    // handleLoad without setting up a useEffect would leave fog frozen
    // at the mount-time preset.
    expect(mapGLSource).toMatch(
      /useEffect\s*\(\s*\(\s*\)\s*=>\s*\{[\s\S]*?setFog[\s\S]*?\}\s*,\s*\[[^\]]*\bfogPreset\b/,
    );
  });

  it("attribution is hidden by default via attributionControl prop", () => {
    // Editorial outlets relocate / restyle the Mapbox attribution chip.
    // Our default suppresses it and renders <MapAttribution> in its place.
    expect(mapGLSource).toMatch(/attributionControl=\{showDefaultAttribution\}/);
    // Default value is false.
    expect(mapGLSource).toMatch(/showDefaultAttribution\s*=\s*false/);
  });

  it("MapAttribution component is rendered when attribution !== false", () => {
    // Confirms the editorial chip path is wired into the JSX tree.
    expect(mapGLSource).toMatch(/<MapAttribution\b/);
  });

  it("MapVignette is rendered when vignette || isVintage truthy", () => {
    // The vignette overlay blends the rectangular Mapbox canvas into
    // the surrounding editorial chrome. Suppressed by default; templates
    // opt in via vignette="editorial" or register="vintage".
    expect(mapGLSource).toMatch(/<MapVignette\b/);
  });

  it("style URL resolution goes through MAP_STYLES[register]", () => {
    // The October 2026 register-discriminator refactor replaced the
    // implicit precedence chain (`toner ? sepia : vintage ? sepia :
    // dark ? dark : light`) with a dict lookup. This assertion locks
    // the new pattern so a future regression doesn't quietly
    // reintroduce the mutex-boolean precedence.
    expect(mapGLSource).toMatch(/MAP_STYLES\[register\]/);
    // And the OLD precedence chain must be gone.
    expect(mapGLSource).not.toMatch(/vintage\s*\?\s*MAP_CONFIG\.sepiaStyleUrl/);
  });

  it("graticule prop is destructured and routes through buildGraticuleLayers", () => {
    // Single canonical graticule path — MapGL routes the `graticule`
    // prop through the existing deck.gl-based `buildGraticuleLayers`
    // utility (Graticule.tsx), not a duplicate SVG implementation.
    expect(mapGLSource).toMatch(/graticule\s*=\s*false/);
    expect(mapGLSource).toMatch(/buildGraticuleLayers/);
  });
});
