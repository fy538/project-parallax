/**
 * FilmOverlayCascadeTestComp — Minimal test fixture for FilmOverlay cascade.
 *
 * NOT for production rendering. Registered as a composition solely so the
 * integration test in `src/__tests__/filmOverlay-cascade-integration.test.ts`
 * can render known-preset frames via `@remotion/renderer` and pixel-diff them.
 *
 * Manifest structure (6 s total, 30 fps = 180 frames):
 *
 *   frames 0–89   (0–2.99 s)  "seg-clean"
 *     KineticTypography, no segment override
 *     → resolves to episode default "clean" (grain only, intensity 0.3)
 *
 *   frames 90–179  (3–5.99 s)  "seg-dramatic"
 *     KineticTypography, filmOverlay: { preset: "dramatic", intensity: 0.8 }
 *     → resolves to dramatic (grain + vignette + flicker, intensity 0.8)
 *
 * The episode-level `filmOverlay: { preset: "clean" }` activates the cascade
 * gate in FullEpisode / SegmentFilmOverlay. Without it, all segments render
 * children directly with no FilmOverlay wrapping.
 */

import React from "react";
import { Composition } from "remotion";
import { FullEpisode, calculateFullEpisodeMetadata } from "./FullEpisode";
import type { AssemblyManifest } from "./FullEpisode";

// ── Inline fixture manifest ──────────────────────────────────────────────────

const FIXTURE_MANIFEST: AssemblyManifest = {
  version: "1.0",
  episode: "film-overlay-cascade-test",
  title: "FilmOverlay Cascade Integration Test Fixture",
  fps: 30,
  totalDurationSec: 6,
  mode: "estimate",
  narration: {
    totalDurationSec: 6,
  },
  /**
   * Episode-level filmOverlay: activates the cascade gate in SegmentFilmOverlay.
   * preset "clean" is the fallback that seg-clean resolves to (no segment override).
   */
  filmOverlay: { preset: "clean" },
  segments: [
    {
      id: "seg-clean",
      type: "TEMPLATE",
      startSec: 0,
      endSec: 3,
      layer: "foreground",
      template: {
        component: "KineticTypography",
        dataFile: "fixture-clean.json",
        // No filmOverlay override → resolves to episode default: "clean"
        // Expected: grain only, intensity 0.3 (from FILM_OVERLAY_PRESETS["clean"])
      },
    },
    {
      id: "seg-dramatic",
      type: "TEMPLATE",
      startSec: 3,
      endSec: 6,
      layer: "foreground",
      template: {
        component: "KineticTypography",
        dataFile: "fixture-dramatic.json",
        /**
         * Segment override: both preset AND intensity set explicitly.
         * Expected: "dramatic" = grain + vignette + flicker, intensity 0.8
         * The vignette creates a dark radial gradient at edges — directly
         * measurable with pixel comparison against the "clean" frame.
         */
        filmOverlay: { preset: "dramatic", intensity: 0.8 },
      },
    },
  ],
};

// ── Inline template data ─────────────────────────────────────────────────────
// Minimal KineticTypography "statistic" variant — no external assets needed.

const FIXTURE_TEMPLATE_DATA: Record<string, unknown> = {
  "fixture-clean.json": {
    variant: "statistic",
    statValue: "CLEAN",
    statLabel: "episode default: grain only",
    statContext: "FilmOverlay cascade level 4 → clean preset",
    durationSec: 3,
    backgroundVariant: "light",
  },
  "fixture-dramatic.json": {
    variant: "statistic",
    statValue: "DRAMATIC",
    statLabel: "segment override: dramatic @ 0.8",
    statContext: "FilmOverlay cascade level 1 → dramatic preset",
    durationSec: 3,
    backgroundVariant: "light",
  },
};

// ── Composition component ────────────────────────────────────────────────────

export const FilmOverlayCascadeTest: React.FC = () => (
  <FullEpisode
    manifest={FIXTURE_MANIFEST}
    templateData={FIXTURE_TEMPLATE_DATA as Record<string, any>}
  />
);

// ── Composition registration ─────────────────────────────────────────────────

export const FilmOverlayCascadeTestComposition = () => (
  <Composition
    id="film-overlay-cascade-test"
    component={FilmOverlayCascadeTest}
    calculateMetadata={() =>
      calculateFullEpisodeMetadata({
        props: {
          manifest: FIXTURE_MANIFEST,
          templateData: FIXTURE_TEMPLATE_DATA as Record<string, any>,
        },
      })
    }
  />
);
