/**
 * Episodes — Master sequence compositions for complete episodes.
 *
 * Each episode stitches all its clips into one continuous video using <Series>.
 * calculateMetadata sums all clip durations minus overlaps.
 */

import { Composition } from "remotion";
import { EP01 } from "./EP01";
import { layout, sec } from "../../design/theme";

// Re-export the full-episode composition
export { EP01FullComposition } from "./EP01Full";

// ── Duration calculation ──────────────────────────────────────────────────────

// EP01 has 24 clips with 15-frame overlaps between them.
// Total = sum(all clip durations) - (23 overlaps × 15 frames)
//
// From SEQUENCE.md:
// - title-episode: 5s
// - title-section-act1: 3s, choropleth-reshoring: 14s, kinetic-7pct: 5s
// - title-section-denial: 3s, timeline-oil-chips: 13s, chart-export-controls: 7s, framework-cocom-china: 12s
// - title-section-wall: 3s, kinetic-kabozi: 8s, chart-pen-contrast: 7s, kinetic-juguo: 8s, chart-lithography: 8s, chart-kirin-teardown: 6s, timeline-deepseek: 9s
// - title-section-trap: 3s, framework-chess-go: 12s, route-chip-supply: 18s, choropleth-supply-chain: 21s, kinetic-morris-chang: 7s, choropleth-bifurcation: 15s
// - title-section-chips: 3s, chart-chips-everywhere: 7s
// - title-endcard: 6s
//
// Total clip time: 5+3+14+5+3+13+7+12+3+8+7+8+8+6+9+3+12+18+21+7+15+3+7+6 = 203 seconds
// Overlaps: 23 × 15 frames = 345 frames = 11.5s at 30fps
// Final: 203s - 11.5s = 191.5s

const EP01_TOTAL_CLIP_SECONDS = 203;
const EP01_OVERLAP_COUNT = 23;
const EP01_OVERLAP_FRAMES_PER_CLIP = 15;
const EP01_TOTAL_OVERLAP_FRAMES = EP01_OVERLAP_COUNT * EP01_OVERLAP_FRAMES_PER_CLIP;
const EP01_TOTAL_OVERLAP_SECONDS = EP01_TOTAL_OVERLAP_FRAMES / layout.fps;
const EP01_FINAL_DURATION_SECONDS = EP01_TOTAL_CLIP_SECONDS - EP01_TOTAL_OVERLAP_SECONDS;

export const EP01Composition = () => (
  <Composition
    id="EP01"
    component={EP01}
    calculateMetadata={() => ({
      durationInFrames: sec(EP01_FINAL_DURATION_SECONDS),
      fps: layout.fps,
      width: layout.width,
      height: layout.height,
    })}
  />
);
