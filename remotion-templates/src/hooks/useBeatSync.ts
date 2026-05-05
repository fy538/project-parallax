/**
 * useBeatSync — optional audio-reactive timing for camera hooks.
 *
 * Accepts an array of beat marker timestamps (in seconds) and provides
 * frame-accurate pulse/snap signals that camera hooks can consume to
 * synchronize zoom pulses, focus snaps, or shake with audio beats.
 *
 * Degrades gracefully: if no markers are provided, all signals return
 * neutral values (no effect on animation).
 *
 * Usage:
 *   const beat = useBeatSync({
 *     markers: [1.2, 3.5, 5.8, 8.1], // seconds where beats land
 *     pulseDecay: 0.3, // how fast pulse fades (seconds)
 *   });
 *
 *   // In camera or animation:
 *   const zoomBoost = 1 + beat.pulse * 0.05; // 5% zoom on beat
 *   const shakeOnBeat = beat.pulse * 0.2; // shake proportional to beat
 *
 * Beat markers can come from:
 *   - Assembly manifest `beatMarkers` field (manual or auto-detected)
 *   - Audio analysis tool output
 *   - Manually placed in JSON data files
 */

import { useMemo } from "react";
import { useCurrentFrame } from "remotion";
import { sec } from "../design/theme";

// ── Types ──────────────────────────────────────────────────────────────────

export interface BeatMarker {
  /** Time in seconds */
  time: number;
  /** Intensity 0-1 (default: 1.0) — allows for strong/weak beats */
  intensity?: number;
  /** Optional label for this beat (e.g., "drop", "accent", "transition") */
  type?: string;
}

export interface UseBeatSyncOptions {
  /** Beat timestamps. Can be simple number[] (seconds) or BeatMarker[] with intensity. */
  markers: (number | BeatMarker)[];
  /** How fast the pulse decays after a beat (seconds, default: 0.25) */
  pulseDecay?: number;
  /** Whether to anticipate beats slightly for visual-leads-audio feel (frames, default: 2) */
  anticipationFrames?: number;
}

export interface BeatSyncState {
  /** Current pulse value (0 = no beat, 1 = on beat). Decays exponentially. */
  pulse: number;
  /** Whether we're currently within a beat window (boolean snap signal) */
  isOnBeat: boolean;
  /** Frames since last beat (useful for timing responses) */
  framesSinceLastBeat: number;
  /** Frames until next beat (-1 if no more beats) */
  framesUntilNextBeat: number;
  /** Index of the most recent beat (-1 if none yet) */
  lastBeatIndex: number;
  /** The nearest beat's intensity (0-1) */
  currentIntensity: number;
  /** The nearest beat's type label */
  currentBeatType: string | undefined;
}

// ── Hook ───────────────────────────────────────────────────────────────────

export const useBeatSync = (opts: UseBeatSyncOptions): BeatSyncState => {
  const { markers, pulseDecay = 0.25, anticipationFrames = 2 } = opts;
  const frame = useCurrentFrame();

  // Normalize markers to BeatMarker[]
  const normalizedMarkers = useMemo(() => {
    return markers.map((m) =>
      typeof m === "number" ? { time: m, intensity: 1.0 } : m
    );
  }, [markers]);

  // Convert to frame positions (memoized)
  const beatFrames = useMemo(() => {
    return normalizedMarkers.map((m) => ({
      frame: sec(m.time) - anticipationFrames,
      intensity: m.intensity ?? 1.0,
      type: m.type,
    }));
  }, [normalizedMarkers, anticipationFrames]);

  // If no markers, return neutral state
  if (beatFrames.length === 0) {
    return {
      pulse: 0,
      isOnBeat: false,
      framesSinceLastBeat: Infinity,
      framesUntilNextBeat: -1,
      lastBeatIndex: -1,
      currentIntensity: 0,
      currentBeatType: undefined,
    };
  }

  // Find last beat before current frame
  let lastBeatIndex = -1;
  for (let i = 0; i < beatFrames.length; i++) {
    if (frame >= beatFrames[i].frame) {
      lastBeatIndex = i;
    }
  }

  // Frames since last beat
  const framesSinceLastBeat =
    lastBeatIndex >= 0 ? frame - beatFrames[lastBeatIndex].frame : Infinity;

  // Frames until next beat
  const nextBeatIndex = lastBeatIndex + 1;
  const framesUntilNextBeat =
    nextBeatIndex < beatFrames.length
      ? beatFrames[nextBeatIndex].frame - frame
      : -1;

  // Pulse: exponential decay from 1.0 at beat, with intensity scaling
  const decayFrames = sec(pulseDecay);
  const intensity =
    lastBeatIndex >= 0 ? beatFrames[lastBeatIndex].intensity : 0;
  const pulse =
    lastBeatIndex >= 0 && framesSinceLastBeat <= decayFrames * 3
      ? intensity * Math.exp(-framesSinceLastBeat / decayFrames)
      : 0;

  // On-beat: true for a small window around the beat
  const beatWindowFrames = 3; // ~100ms at 30fps
  const isOnBeat =
    lastBeatIndex >= 0 && framesSinceLastBeat <= beatWindowFrames;

  const currentBeatType =
    lastBeatIndex >= 0 ? beatFrames[lastBeatIndex].type : undefined;

  return {
    pulse,
    isOnBeat,
    framesSinceLastBeat,
    framesUntilNextBeat,
    lastBeatIndex,
    currentIntensity: intensity,
    currentBeatType,
  };
};
