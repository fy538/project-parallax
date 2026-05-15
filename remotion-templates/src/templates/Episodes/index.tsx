/**
 * Episodes — Master sequence compositions for complete episodes.
 *
 * Each episode stitches all its clips into one continuous video using <Series>.
 * calculateMetadata sums all clip durations minus overlaps.
 *
 * Episodes are identified by slug (e.g., "silicon-trap"), not episode number.
 * Episode numbers are assigned at publish time via episodes/publish-order.json.
 */

import { Composition } from "remotion";
import { SiliconTrap } from "./SiliconTrap";
import { layout, sec } from "../../design/theme";

// Re-export the full-episode composition
export { SiliconTrapFullComposition } from "./SiliconTrapFull";

// Re-export manifest types for consumer files
export type { AssemblyManifest, ManifestSegment, TemplateInfo, NarrationInfo, BeatInfo } from "./FullEpisode";

// ── Duration calculation ──────────────────────────────────────────────────────

// silicon-trap: 15-frame overlaps between clips.
// Total = sum(all clip durations) - (27 overlaps × 15 frames)
// Duration is approximate — actual durations depend on data-driven calculations
// (e.g., ChoroplethMap phases, RouteAnimation phases, DualTimeline events).

const SILICON_TRAP_TOTAL_CLIP_SECONDS = 168;
const SILICON_TRAP_OVERLAP_COUNT = 27;
const SILICON_TRAP_OVERLAP_FRAMES_PER_CLIP = 15;
const SILICON_TRAP_TOTAL_OVERLAP_FRAMES = SILICON_TRAP_OVERLAP_COUNT * SILICON_TRAP_OVERLAP_FRAMES_PER_CLIP;
const SILICON_TRAP_TOTAL_OVERLAP_SECONDS = SILICON_TRAP_TOTAL_OVERLAP_FRAMES / layout.fps;
const SILICON_TRAP_FINAL_DURATION_SECONDS = SILICON_TRAP_TOTAL_CLIP_SECONDS - SILICON_TRAP_TOTAL_OVERLAP_SECONDS;

export const SiliconTrapComposition = () => (
  <Composition
    id="silicon-trap"
    component={SiliconTrap}
    calculateMetadata={() => ({
      durationInFrames: sec(SILICON_TRAP_FINAL_DURATION_SECONDS),
      fps: layout.fps,
      width: layout.width,
      height: layout.height,
    })}
  />
);
