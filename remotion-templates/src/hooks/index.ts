/**
 * Shared hooks — the standardized animation and theming contract for all templates.
 *
 * Every template should use:
 *   useCompositionAnimation() — for automatic Ken Burns + exit fade
 *   useEntrance() — for semantic element entrances
 *   useThemeMode() — for mode-correct color tokens (dark/light)
 *   useVerticalLayout() — for 9:16 Shorts layout tokens
 *
 * These hooks enforce POLISH.md rules by default, so templates get
 * the right behavior without having to remember which utility to call.
 */

export { useCompositionAnimation } from "./useCompositionAnimation";
export { useEntrance, useStaggeredEntrance } from "./useEntrance";
export type { EntranceRole } from "./useEntrance";
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
export {
  useEpisodeColorEmphasis,
  EpisodeColorEmphasisProvider,
} from "./useEpisodeColorEmphasis";
export type { EpisodeColorEmphasisProviderProps } from "./useEpisodeColorEmphasis";
