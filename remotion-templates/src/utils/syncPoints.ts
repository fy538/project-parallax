/**
 * Sync points are positional: `syncPoints[i]` is the narration cue for the
 * template's element i (POLISH.md D17, per-element reveal). A cue the
 * transcript could not resolve arrives with a null time.
 *
 * Dropping such a cue from the middle of the list would move every later cue
 * onto the wrong element (element 2 revealing on cue 3's word). So only the
 * resolved cues before the first gap are passed on; the elements after it
 * fall back to the template's own timing.
 */

export interface ManifestSyncPoint {
  word: string;
  /** Absolute episode time; null when the cue was not found in the recording. */
  timeSec: number | null;
  frame: number | null;
  confidence: number;
}

export type ResolvedSyncPoint = ManifestSyncPoint & { timeSec: number; frame: number };

const isResolved = (p: ManifestSyncPoint): p is ResolvedSyncPoint =>
  p.timeSec !== null && p.frame !== null;

/** The resolved cues up to, not including, the first unresolved one. */
export const resolvedSyncPrefix = (
  points: readonly ManifestSyncPoint[] | undefined,
): ResolvedSyncPoint[] => {
  const out: ResolvedSyncPoint[] = [];
  for (const p of points ?? []) {
    if (!isResolved(p)) break;
    out.push(p);
  }
  return out;
};

/** The first cue that did not resolve, for a warning; undefined if all did. */
export const firstUnresolvedSyncWord = (
  points: readonly ManifestSyncPoint[] | undefined,
): string | undefined => (points ?? []).find((p) => !isResolved(p))?.word;
