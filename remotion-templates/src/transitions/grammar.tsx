/**
 * Grammar transitions — production `@remotion/transitions` presentation library
 * mapped 1:1 to the TRANSITION_GRAMMAR.md tokens.
 *
 * WHY THIS EXISTS (vs. components/Transitions.tsx):
 *   `TransitionWrapper` (components/Transitions.tsx) applies an entry/exit
 *   transition to ONE segment via CSS opacity/transform. It cannot truly
 *   OVERLAP two segments — a real cross-dissolve needs the outgoing scene
 *   fading out *while* the incoming fades in over the same frames. This module
 *   uses `<TransitionSeries>`, which overlaps the two segments correctly.
 *
 * WHERE EACH BELONGS (architectural boundary — read before "adopting" this):
 *   · TransitionSeries (this file) → SEQUENTIAL contexts: showcase reels,
 *     and multi-beat templates that already use `<Series>` internally. It
 *     computes each segment's start by summing prior durations minus transition
 *     overlaps.
 *   · TransitionWrapper → the manifest-driven FullEpisode timeline, where every
 *     segment is placed at an ABSOLUTE `from={startSec*fps}` aligned to the
 *     Whisper word timestamps, in layered background + foreground tracks.
 *   Do NOT replace FullEpisode's per-segment wrappers with a TransitionSeries:
 *   the sequential model would drift off the narration-aligned absolute
 *   timestamps and desync the audio. The two coexist by design; this file is
 *   the canonical visual source of truth (durations + look) that both consume.
 *
 * Maps the six canonical grammar transitions to presentations:
 *   cut             → no <Transition> node (back-to-back sequences)
 *   fade            → fadeThrough(ink)   — fade-through-black, new chapter
 *   dissolve        → dissolve()         — opacity + 2% scale, gentler delivery
 *   color-wash      → fadeThrough(amber) — register shift through brand amber
 *   iris            → iris()             — built-in circular reveal
 *   match-cut       → matchCutZoom()     — synced 1.12× zoom, same subject
 *   match-cut-still → fade()             — built-in opacity-only crossfade
 *
 * Deprecated tokens resolve to their TRANSITION_GRAMMAR replacement.
 * Easing is decelerate (never linear, never overshoot) per the channel register.
 */

import React from "react";
import { AbsoluteFill, Easing } from "remotion";
import {
  TransitionSeries,
  linearTiming,
  type TransitionPresentation,
  type TransitionPresentationComponentProps,
  type TransitionTiming,
} from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { iris } from "@remotion/transitions/iris";
import { palette, easing as easingTokens } from "../design/theme";
import {
  TRANSITION_CATALOG,
  isDeprecatedTransition,
  DEPRECATED_TRANSITIONS,
  type TransitionType,
} from "../components/Transitions";

const decelerate = Easing.bezier(...easingTokens.decelerate);

// ── Custom presentation: fade-through-a-color ───────────────────────────────
// Generalizes fade-through-black (color = ink) and color-wash (color = amber).
// Exiting scene fades out in the first half under a rising color flood; the
// flood falls away in the second half as the entering scene fades up.
type FadeThroughProps = { color: string; peak: number };

const FadeThroughComponent: React.FC<
  TransitionPresentationComponentProps<FadeThroughProps> & { children?: React.ReactNode }
> = ({ children, presentationProgress: p, presentationDirection: dir, passedProps }) => {
  const sceneOpacity = dir === "exiting" ? Math.max(0, 1 - p * 2) : Math.max(0, p * 2 - 1);
  const flood = (1 - Math.abs(p - 0.5) * 2) * passedProps.peak; // triangle 0→peak→0
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ opacity: sceneOpacity }}>{children}</AbsoluteFill>
      {dir === "exiting" && flood > 0.001 && (
        <AbsoluteFill style={{ backgroundColor: passedProps.color, opacity: flood }} />
      )}
    </AbsoluteFill>
  );
};

export const fadeThrough = (
  props: Partial<FadeThroughProps> = {},
): TransitionPresentation<FadeThroughProps> => ({
  component: FadeThroughComponent,
  props: { color: props.color ?? palette.ink, peak: props.peak ?? 1 },
});

/** Register-shift flood through brand amber. */
export const colorWash = (color: string = palette.amber): TransitionPresentation<FadeThroughProps> =>
  fadeThrough({ color, peak: 0.92 });

// ── Custom presentation: dissolve (opacity + subtle scale) ──────────────────
// Crossfade where the entering scene settles down from +2% and the exiting
// scene recedes to −2% — the "gentler delivery / same thought" register.
type DissolveProps = Record<string, never>;

const DissolveComponent: React.FC<
  TransitionPresentationComponentProps<DissolveProps> & { children?: React.ReactNode }
> = ({ children, presentationProgress: p, presentationDirection: dir }) => {
  const opacity = dir === "exiting" ? 1 - p : p;
  const scale = dir === "exiting" ? 1 - 0.02 * p : 1 + 0.02 * (1 - p);
  return <AbsoluteFill style={{ opacity, transform: `scale(${scale})` }}>{children}</AbsoluteFill>;
};

export const dissolve = (): TransitionPresentation<DissolveProps> => ({
  component: DissolveComponent,
  props: {},
});

// ── Custom presentation: match-cut zoom ─────────────────────────────────────
// Synced zoom for "same subject, different scale": the exiting scene pushes in
// (1 → 1.15×) while the entering scene pulls out (1.15× → 1), so the subject
// appears continuous across the seam. Scale shift (0.15) matches the
// established TransitionWrapper match-cut so the look is identical across both
// timing models.
type MatchCutProps = { scale: number };

const MatchCutComponent: React.FC<
  TransitionPresentationComponentProps<MatchCutProps> & { children?: React.ReactNode }
> = ({ children, presentationProgress: p, presentationDirection: dir, passedProps }) => {
  const z = passedProps.scale;
  const opacity = dir === "exiting" ? 1 - p : p;
  const scale = dir === "exiting" ? 1 + (z - 1) * p : z - (z - 1) * p;
  return <AbsoluteFill style={{ opacity, transform: `scale(${scale})` }}>{children}</AbsoluteFill>;
};

export const matchCutZoom = (scale: number = 1.15): TransitionPresentation<MatchCutProps> => ({
  component: MatchCutComponent,
  props: { scale },
});

// ── Token → presentation + timing ───────────────────────────────────────────

export interface GrammarTransitionOptions {
  /** Seconds for the seam; defaults to the grammar catalog duration for the token. */
  durationSec?: number;
  fps: number;
  /** Canvas dimensions — required for the iris presentation. */
  width?: number;
  height?: number;
  /** Override the color-wash flood color (default brand amber). */
  washColor?: string;
}

export interface ResolvedGrammarTransition {
  presentation: TransitionPresentation<Record<string, unknown>>;
  timing: TransitionTiming;
}

/** Collapse a deprecated token to its canonical replacement; pass others through. */
export const resolveTransitionToken = (type: TransitionType): TransitionType =>
  isDeprecatedTransition(type) ? DEPRECATED_TRANSITIONS[type].replacement : type;

/**
 * Build the `@remotion/transitions` presentation + timing for a grammar token.
 * Returns `null` for `cut` (no <Transition> node — sequences sit back-to-back).
 */
export function grammarTransition(
  type: TransitionType,
  opts: GrammarTransitionOptions,
): ResolvedGrammarTransition | null {
  const resolved = resolveTransitionToken(type);
  if (resolved === "cut") return null;

  const { fps, width = 1920, height = 1080, washColor = palette.amber } = opts;
  const durationSec = opts.durationSec ?? TRANSITION_CATALOG[resolved].defaultDurationSec;
  const durationInFrames = Math.max(1, Math.round(durationSec * fps));

  // Erase the heterogeneous prop types to the generic shape TransitionSeries
  // .Transition consumes (each presentation carries its own props internally).
  const asGeneric = (p: unknown) => p as TransitionPresentation<Record<string, unknown>>;

  switch (resolved) {
    case "fade":
      return {
        presentation: asGeneric(fadeThrough({ color: palette.ink, peak: 1 })),
        timing: linearTiming({ durationInFrames }),
      };
    case "color-wash":
      return {
        presentation: asGeneric(colorWash(washColor)),
        timing: linearTiming({ durationInFrames }),
      };
    case "dissolve":
      return {
        presentation: asGeneric(dissolve()),
        timing: linearTiming({ durationInFrames, easing: decelerate }),
      };
    case "match-cut":
      return {
        presentation: asGeneric(matchCutZoom()),
        timing: linearTiming({ durationInFrames, easing: decelerate }),
      };
    case "match-cut-still":
      return {
        presentation: asGeneric(fade()),
        timing: linearTiming({ durationInFrames }),
      };
    case "iris":
      return {
        presentation: asGeneric(iris({ width, height })),
        timing: linearTiming({ durationInFrames, easing: decelerate }),
      };
    default:
      // Any remaining token (shouldn't happen post-resolve) → plain crossfade.
      return {
        presentation: asGeneric(fade()),
        timing: linearTiming({ durationInFrames }),
      };
  }
}

// ── Convenience component: a grammar-driven TransitionSeries ─────────────────

export interface GrammarSegment {
  content: React.ReactNode;
  durationInFrames: number;
}

export interface GrammarSeam {
  transition: TransitionType;
  durationSec?: number;
}

interface GrammarTransitionSeriesProps {
  segments: GrammarSegment[];
  /** seams[i] is the transition INTO segments[i+1]; length = segments.length − 1. */
  seams: GrammarSeam[];
  fps: number;
  width?: number;
  height?: number;
  washColor?: string;
}

/**
 * Render a list of segments joined by grammar transitions as one
 * `<TransitionSeries>` with true two-segment overlap. `cut` seams produce no
 * transition node (segments sit back-to-back = hard cut).
 *
 * CONSTRAINT: each segment must be at least as long as the SUM of its two
 * adjacent transitions, or the seams overlap (e.g. a color-wash bleeds into the
 * next iris). A middle segment between a 0.7s and a 0.8s seam needs ≥ 1.5s at
 * 30fps (45 frames). Keep seam durations short relative to segment holds.
 */
export const GrammarTransitionSeries: React.FC<GrammarTransitionSeriesProps> = ({
  segments,
  seams,
  fps,
  width,
  height,
  washColor,
}) => (
  <TransitionSeries>
    {segments.map((seg, i) => {
      const seam = i > 0 ? seams[i - 1] : null;
      const resolved = seam
        ? grammarTransition(seam.transition, { fps, width, height, washColor, durationSec: seam.durationSec })
        : null;
      return (
        <React.Fragment key={i}>
          {resolved && (
            <TransitionSeries.Transition presentation={resolved.presentation} timing={resolved.timing} />
          )}
          <TransitionSeries.Sequence durationInFrames={seg.durationInFrames}>
            {seg.content}
          </TransitionSeries.Sequence>
        </React.Fragment>
      );
    })}
  </TransitionSeries>
);
