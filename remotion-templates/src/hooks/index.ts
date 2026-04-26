/**
 * Animation hooks — the standardized animation contract for all templates.
 *
 * Every template should use:
 *   useCompositionAnimation() — for automatic Ken Burns + exit fade
 *   useEntrance() — for semantic element entrances
 *   useDivider() — for gradient divider animations
 *
 * These hooks enforce POLISH.md rules by default, so templates get
 * the right behavior without having to remember which utility to call.
 */

export { useCompositionAnimation } from "./useCompositionAnimation";
export { useEntrance, useStaggeredEntrance } from "./useEntrance";
export type { EntranceRole } from "./useEntrance";
export { useDivider } from "./useDivider";
