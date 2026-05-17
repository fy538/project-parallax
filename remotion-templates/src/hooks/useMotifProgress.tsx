/**
 * useMotifProgress — Visual motif system for Parallax episodes.
 *
 * A visual motif is a recurring geometric element that evolves across the
 * episode, giving the central concept a visual identity that deepens as the
 * argument builds. The same component renders differently at state 0 (simple,
 * open) vs. state 3 (dense, inescapable) — VISUAL_LANGUAGE.md § "Visual Motifs".
 *
 * Architecture:
 *   Two contexts, two providers, one hook.
 *
 *   EpisodeMotifProvider (episode-level, FullEpisode.tsx)
 *     ↓ provides { motif, totalDurationSec }
 *   SegmentMotifProgressProvider (segment-level, ForegroundSegment)
 *     ↓ provides { stateIndex, stateProgress, episodeProgress, motif }
 *   useMotifProgress() (template call site)
 *     ↓ returns MotifProgressValue | null
 *
 * The two-context design keeps ForegroundSegment's React.memo optimization
 * intact. The progress value is computed once per segment start (not per
 * frame) because the state boundary is a property of the segment's position
 * in the episode, not of the current playback frame.
 *
 * Usage in a template:
 *   const motif = useMotifProgress();
 *   if (!motif) return <DefaultRender />;
 *
 *   // motif.motif.visual  → "net" | "spiral" | "matrix" | ...
 *   // motif.stateIndex    → 0 = intro, 1 = building, 2 = peak, 3 = resolution
 *   // motif.stateProgress → 0→1 within the current state
 *   // motif.episodeProgress → 0→1 across the whole episode
 *   // motif.stateCount    → total number of states (evolutionSec.length + 1)
 *
 * Manifest field: `manifest.episodeMotif` (optional — episodes without a motif
 *   get null from the hook, which is the correct "no motif" signal).
 *
 * See VISUAL_LANGUAGE.md § "Visual Motifs" for editorial doctrine.
 *
 * Created: May 16, 2026 (Phase 10 — visual polish gap closure)
 */

import React, { createContext, useContext, useMemo, type ReactNode } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

/**
 * Visual motif configuration for a single episode.
 * Set in assembly-manifest.json as `episodeMotif`.
 */
export interface EpisodeMotif {
  /** Human-readable name of the episode's central concept (e.g., "Silicon Trap") */
  concept: string;
  /**
   * Visual form keyword — templates dispatch on this to know which geometry to
   * draw. Keeps the manifest agnostic of component names while giving templates
   * a semantic switch axis. Canonical values: "net", "spiral", "matrix",
   * "ladder", "web", "fracture", "pulse". Open-ended: add new values as
   * episodes need them — templates that don't recognize a value render their
   * default state.
   */
  visual: string;
  /**
   * Episode-absolute seconds at which the motif transitions between evolution
   * states. Array of N thresholds defines N+1 states:
   *   - state 0: timeSec < evolutionSec[0]
   *   - state k: evolutionSec[k-1] ≤ timeSec < evolutionSec[k]
   *   - state N: timeSec ≥ evolutionSec[N-1]
   *
   * Typically 2–3 thresholds → 3–4 states. Mirror the episode's narrative arc:
   *   evolutionSec[0] = end of setup / first act break
   *   evolutionSec[1] = midpoint complication
   *   evolutionSec[2] = climax / resolution
   */
  evolutionSec: readonly number[];
  /**
   * Human-readable labels for each state. Length must be evolutionSec.length + 1.
   * Optional — purely for editorial reference and Studio overlay display.
   * Example: ["simple", "tightening", "inescapable", "resolved"]
   */
  states?: readonly string[];
  /**
   * Override accent color for motif rendering. When absent, templates should
   * fall back to the episode's primaryAccent via useEpisodeColorEmphasis().
   * Use when the motif needs a specific palette token that differs from the
   * general episode accent.
   */
  color?: string;
}

/**
 * Per-segment motif progress value. Consumed by useMotifProgress() inside
 * templates. Static per segment (does not change frame-to-frame within a
 * segment unless the segment spans an evolution boundary — in that case the
 * ENTERING state applies for the whole segment).
 */
export interface MotifProgressValue {
  /** The motif configuration. */
  motif: EpisodeMotif;
  /** Current evolution state index (0-based). */
  stateIndex: number;
  /** Total number of evolution states (evolutionSec.length + 1). */
  stateCount: number;
  /**
   * Progress within the current state (0→1).
   * 0 = state just entered, 1 = immediately before the next state boundary
   * (or end of episode). Based on segment.startSec — static per segment.
   * Use as the `t` parameter for interpolating motif visual properties across
   * a state's duration (e.g., "grow complexity from 3 to 7 nodes as t → 1").
   */
  stateProgress: number;
  /**
   * Normalized episode position: segment.startSec / totalDurationSec (0→1).
   * Use for global gradients across the full episode — e.g., overall network
   * density, color warmth, opacity of a recurring overlay.
   */
  episodeProgress: number;
}

// ── Helpers (pure, testable) ──────────────────────────────────────────────────

/**
 * Compute the motif state and progress for a given episode time.
 * Pure function — no React dependency; safe to call in unit tests.
 *
 * @param motif       Episode motif configuration
 * @param timeSec     Episode-absolute time to evaluate (typically segment.startSec)
 * @param totalDurationSec Episode total duration for computing episodeProgress
 */
export function computeMotifStateAt(
  motif: EpisodeMotif,
  timeSec: number,
  totalDurationSec: number,
): Omit<MotifProgressValue, "motif"> {
  const thresholds = motif.evolutionSec;
  const stateCount = thresholds.length + 1;

  // Find which state the time falls into (linear scan — N is always small)
  let stateIndex = 0;
  for (let i = 0; i < thresholds.length; i++) {
    if (timeSec >= thresholds[i]) {
      stateIndex = i + 1;
    } else {
      break;
    }
  }

  // State boundaries
  const stateStart = stateIndex === 0 ? 0 : thresholds[stateIndex - 1];
  const stateEnd =
    stateIndex < thresholds.length ? thresholds[stateIndex] : totalDurationSec;

  const stateProgress =
    stateEnd > stateStart
      ? Math.min(1, Math.max(0, (timeSec - stateStart) / (stateEnd - stateStart)))
      : 1;

  const episodeProgress =
    totalDurationSec > 0
      ? Math.min(1, Math.max(0, timeSec / totalDurationSec))
      : 0;

  return { stateIndex, stateCount, stateProgress, episodeProgress };
}

// ── Config context (episode-level, set once) ──────────────────────────────────

interface MotifConfigContextValue {
  motif: EpisodeMotif | null;
  totalDurationSec: number;
}

const MotifConfigContext = createContext<MotifConfigContextValue>({
  motif: null,
  totalDurationSec: 0,
});
MotifConfigContext.displayName = "MotifConfigContext";

// ── Progress context (segment-level, set per segment) ─────────────────────────

const MotifProgressContext = createContext<MotifProgressValue | null>(null);
MotifProgressContext.displayName = "MotifProgressContext";

// ── Providers ─────────────────────────────────────────────────────────────────

/**
 * Episode-level provider. Place once in FullEpisode.tsx, outside the segment
 * render loops. Provides the motif config and episode duration to all child
 * contexts. Pass `undefined` when the episode has no motif — the hook will
 * return null, which is the correct "no motif" signal for templates.
 *
 * Usage:
 *   <EpisodeMotifProvider motif={manifest.episodeMotif} totalDurationSec={manifest.totalDurationSec}>
 *     {children}
 *   </EpisodeMotifProvider>
 */
export const EpisodeMotifProvider: React.FC<{
  motif: EpisodeMotif | undefined | null;
  totalDurationSec: number;
  children: ReactNode;
}> = ({ motif, totalDurationSec, children }) => {
  const ctx = useMemo<MotifConfigContextValue>(
    () => ({ motif: motif ?? null, totalDurationSec }),
    [motif, totalDurationSec],
  );
  return (
    <MotifConfigContext.Provider value={ctx}>
      {children}
    </MotifConfigContext.Provider>
  );
};

/**
 * Segment-level provider. Place in ForegroundSegment (FullEpisode.tsx) for
 * each template segment. Derives stateIndex and stateProgress from the
 * segment's startSec relative to the episode motif's evolutionSec thresholds.
 *
 * No frame dependency — the computed value is static per segment start time.
 * ForegroundSegment is React.memo'd; this design preserves that optimization
 * (the context value only changes when the motif config or segment position
 * changes, not on every frame).
 *
 * Usage (inside ForegroundSegment):
 *   <SegmentMotifProgressProvider segmentStartSec={segment.startSec}>
 *     {children}
 *   </SegmentMotifProgressProvider>
 */
export const SegmentMotifProgressProvider: React.FC<{
  segmentStartSec: number;
  children: ReactNode;
}> = ({ segmentStartSec, children }) => {
  const { motif, totalDurationSec } = useContext(MotifConfigContext);

  const value = useMemo<MotifProgressValue | null>(() => {
    if (!motif) return null;
    const state = computeMotifStateAt(motif, segmentStartSec, totalDurationSec);
    return { ...state, motif };
  }, [motif, segmentStartSec, totalDurationSec]);

  return (
    <MotifProgressContext.Provider value={value}>
      {children}
    </MotifProgressContext.Provider>
  );
};

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * Returns the motif progress state for the current segment.
 * Returns null when the episode has no motif configured — templates should
 * treat null as "render default state, no motif overlay."
 *
 * Must be called inside a SegmentMotifProgressProvider (i.e., inside a
 * ForegroundSegment rendered by FullEpisode). In standalone composition
 * renders outside FullEpisode, it will return null.
 *
 * @example
 *   const motif = useMotifProgress();
 *   if (!motif) return <DefaultLayout />;
 *
 *   const nodeCount = 3 + Math.round(motif.stateProgress * 9);  // 3 → 12 nodes
 *   const lineOpacity = 0.2 + motif.episodeProgress * 0.6;      // grows over episode
 *
 *   return <MotifNetOverlay nodes={nodeCount} opacity={lineOpacity} visual={motif.motif.visual} />;
 */
export function useMotifProgress(): MotifProgressValue | null {
  return useContext(MotifProgressContext);
}
