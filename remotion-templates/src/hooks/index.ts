/**
 * Shared hooks — the standardized animation and theming contract for all templates.
 *
 * Every template should use:
 *   useCompositionAnimation() — for automatic Ken Burns + exit fade
 *   useThemeMode() — for mode-correct color tokens (dark/light)
 *   useVerticalLayout() — for 9:16 Shorts layout tokens
 *
 * These hooks enforce POLISH.md rules by default, so templates get
 * the right behavior without having to remember which utility to call.
 *
 * ── Camera hooks: which one to use ──────────────────────────────────────────
 *
 * Three camera hooks exist because they solve genuinely different geometric
 * problems. They are NOT redundant — each has its own interface tuned to its
 * domain. Don't try to unify them.
 *
 *   useTreeCamera       Tree / parent-child graphs (DecisionTree).
 *                       Inputs: node positions + parent map + camera path of
 *                       node IDs. Output: transform that pans/zooms between
 *                       nodes with ancestry-aware dimming.
 *
 *   useTimelineCamera   Horizontal 1D timelines (HorizontalTimeline).
 *                       Inputs: events with x-axis positions + camera steps.
 *                       Output: transform that scrolls horizontally with
 *                       focus isolation.
 *
 *   useNarratedCamera   Arbitrary 2D coordinate animation (DataChart,
 *                       NetworkDiagram, EscalationLadder).
 *                       Inputs: cameraPath of (x, y) targets or
 *                       element indices. Output: transform that zooms to
 *                       arbitrary points + per-element opacity/scale/blur.
 *
 * Decision: tree structure → useTreeCamera; one axis only → useTimelineCamera;
 * everything else (most cases) → useNarratedCamera.
 */

export { useCompositionAnimation } from "./useCompositionAnimation";
export { useThemeMode } from "./useThemeMode";
export type { ThemeTokens } from "./useThemeMode";
export { useVerticalLayout } from "./useVerticalLayout";
export type { VerticalLayoutTokens } from "./useVerticalLayout";
export { useTreeCamera, generateDefaultCameraPath, buildParentMap } from "./useTreeCamera";
export type { CameraTarget, UseTreeCameraOptions, TreeCameraState } from "./useTreeCamera";
export { useTimelineCamera, generateDefaultTimelineCameraPath } from "./useTimelineCamera";
export type { UseTimelineCameraOptions, TimelineCameraState } from "./useTimelineCamera";
export { useNarratedCamera, generateNarratedCameraPath } from "./useNarratedCamera";
export type {
  UseNarratedCameraOptions,
  NarratedCameraState,
  NarratedCameraStep,
  CameraElement,
  SyncPoint,
} from "./useNarratedCamera";
export { useBeatSync } from "./useBeatSync";
export type { UseBeatSyncOptions, BeatSyncState, BeatMarker } from "./useBeatSync";
export { useCameraStagger } from "./useCameraStagger";
export type { CameraStaggerOptions, CameraStaggerResult } from "./useCameraStagger";
export {
  useEpisodeColorEmphasis,
  EpisodeColorEmphasisProvider,
} from "./useEpisodeColorEmphasis";
export type { EpisodeColorEmphasisProviderProps } from "./useEpisodeColorEmphasis";
