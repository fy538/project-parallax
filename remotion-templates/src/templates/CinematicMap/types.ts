/**
 * CinematicMap — TypeScript types derived from the Zod schema.
 *
 * These are inferred from `CinematicMapDataSchema` in `schema.ts` so there
 * is a single source of truth. Import `CinematicMapData` in the component
 * and in the Composition registration.
 *
 * Editorial use case: camera pitched 30–75°, flying along terrain at
 * 200–10,000 m altitude. Terrain relief visible. No data layers. Pure
 * camera story. Examples: Khyber Pass approach, strait chokepoint reveal,
 * alpine border context.
 *
 * Doctrine: no title overlay — cinematic maps don't title.
 * See: references/template-research/cinematic-map.md
 */

import type { z } from "zod";
import type { CinematicMapDataSchema } from "./schema";

export type CinematicMapData = z.infer<typeof CinematicMapDataSchema>;

/**
 * A single keyframe in the sec-based camera path. `sec` is the time in
 * seconds (converted to frames in the template via `useVideoConfig().fps`).
 * Unlike `CameraKeyframe` in CinematicCamera.tsx — which is frame-based for
 * internal use — these are authored in seconds for human legibility.
 */
export type CinematicKeyframeInput = CinematicMapData["keyframes"][number];
