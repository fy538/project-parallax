/**
 * textAnimation — extracted primitives for the canonical text-animation
 * techniques. See `project/TEXT_ANIMATION_REGISTER.md` for editorial
 * register, use cases, and anti-patterns.
 *
 * This file contains the standalone, reusable versions of techniques first
 * prototyped in `src/catalog/TextAnimationShowcase.tsx`. Production
 * components (DefinitionReveal, StatCaption, QuoteAttribution) compose
 * these primitives. Catalog explorations may continue to inline their own
 * variants — that's intentional, those are throwaway studies.
 *
 * Exports:
 *   - useNumberTicker(target, startFrame, options) — eased count-up hook
 *   - <Typewriter text startFrame cps cursor /> — char-by-char with cursor
 *   - useTrackingIn(startFrame, duration, fromPx, toPx) — letter-spacing collapse
 *   - <UnderlineDraw width startFrame ... /> — hairline grows under text
 *   - textFadeIn(frame, startFrame, durationFrames) — shared sine-eased fade helper
 *   - computeCharStarts(text, baseInterval, pauses) — char-onset frame array
 *     (exported so composites like QuoteAttribution can compute exact
 *     typewriter durations rather than estimating)
 */

import React from "react";
import { useCurrentFrame, interpolate, Easing } from "remotion";
import { palette, sec } from "../design/theme";
import { CLAMP, CLAMP_SINE } from "../utils/animation";

// Hoisted to module scope so every render reuses the same easing function
// reference (avoids per-frame allocation when callers don't pass an
// explicit easing). poly(4) out gives a strong "land" feel at settle.
const DEFAULT_TICKER_EASING = Easing.out(Easing.poly(4));

// ─── useNumberTicker ────────────────────────────────────────────────────────

export interface UseNumberTickerOptions {
  /** Total animation duration in frames. Default sec(1.2) ≈ 36 frames at 30fps. */
  durationFrames?: number;
  /** Easing applied to the value progression. Default: poly(4) ease-out (strong settle). */
  easing?: (t: number) => number;
  /** Number of decimal places. Default 0. */
  decimals?: number;
  /** Optional starting value. Default 0. */
  from?: number;
}

/**
 * Returns a numeric value that animates from `from` (default 0) to `target`
 * over `durationFrames` starting at `startFrame`. Eased deceleration by
 * default — value "lands" rather than coasts.
 *
 * Editorial register: stats that *arrive*, not appear. See doctrine doc
 * § 01 (Number Ticker) for use/avoid rules.
 */
export function useNumberTicker(
  target: number,
  startFrame: number,
  options: UseNumberTickerOptions = {},
): number {
  const frame = useCurrentFrame();
  const {
    durationFrames = sec(1.2),
    easing = DEFAULT_TICKER_EASING,
    decimals = 0,
    from = 0,
  } = options;

  const progress = interpolate(
    frame,
    [startFrame, startFrame + durationFrames],
    [0, 1],
    {
      easing,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  const raw = from + (target - from) * progress;
  if (decimals > 0) {
    const factor = 10 ** decimals;
    return Math.round(raw * factor) / factor;
  }
  return Math.round(raw);
}


// ─── Typewriter ────────────────────────────────────────────────────────────

export interface TypewriterProps {
  text: string;
  startFrame: number;
  /** Characters per second. Default 22 — slower than real typing, emphasises deliberation. */
  cps?: number;
  /** Cursor treatment. Default "blink". */
  cursor?: "blink" | "solid" | "none";
  /** Cursor color; defaults to style.color or palette.ink. */
  cursorColor?: string;
  /**
   * Punctuation pause table (frames added after each char). Defaults to the
   * canonical Parallax cadence (commas pause less than periods, etc.).
   */
  punctuationPauses?: Record<string, number>;
  style?: React.CSSProperties;
  className?: string;
}

const DEFAULT_PUNCT_PAUSES: Record<string, number> = {
  ",": 6,
  ";": 10,
  ":": 10,
  ".": 14,
  "?": 14,
  "!": 14,
  "—": 8,
};

/**
 * Compute the frame offset (relative to startFrame) at which each character
 * of `text` becomes visible. Exported so callers (notably QuoteAttribution
 * which needs to know when typewriter completes) can derive exact timing
 * instead of estimating.
 *
 * The returned array length equals text.length; each entry is the frame
 * offset for that character. The total typewriter duration is roughly
 * `result[result.length - 1] + baseInterval` (the final char's settle).
 */
export function computeCharStarts(
  text: string,
  baseInterval: number,
  punctuationPauses: Record<string, number> = DEFAULT_PUNCT_PAUSES,
): number[] {
  const starts: number[] = [];
  let cursor = 0;
  for (let i = 0; i < text.length; i++) {
    starts.push(cursor);
    cursor += baseInterval;
    const pause = punctuationPauses[text[i]];
    if (pause) cursor += pause;
  }
  return starts;
}

/**
 * Binary search for the largest index i such that starts[i] <= localFrame.
 * O(log n) per frame, replacing the previous O(n) linear scan. Matters
 * once typewriter quotes exceed ~50 characters or multiple typewriters
 * run concurrently. `starts` MUST be monotonically non-decreasing
 * (computeCharStarts guarantees this).
 *
 * Returns 0 if no character has started yet (localFrame < starts[0]).
 */
function visibleCountAt(starts: number[], localFrame: number): number {
  if (starts.length === 0 || localFrame < starts[0]) return 0;
  let lo = 0;
  let hi = starts.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (starts[mid] <= localFrame) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

/**
 * Character-by-character text reveal with optional blinking cursor and
 * punctuation pauses. Editorial register: transcribed text (quotes,
 * archival, first-person written). See doctrine doc § 05.
 */
export const Typewriter: React.FC<TypewriterProps> = ({
  text,
  startFrame,
  cps = 22,
  cursor = "blink",
  cursorColor,
  punctuationPauses = DEFAULT_PUNCT_PAUSES,
  style,
  className,
}) => {
  const frame = useCurrentFrame();
  // At 30fps, baseInterval = round(30 / cps). Clamp to ≥1 so we always
  // advance at least one frame per character.
  const baseInterval = Math.max(1, Math.round(30 / cps));

  const starts = React.useMemo(
    () => computeCharStarts(text, baseInterval, punctuationPauses),
    [text, baseInterval, punctuationPauses],
  );

  const localFrame = frame - startFrame;
  const visibleCount = visibleCountAt(starts, localFrame);
  const visible = text.slice(0, visibleCount);

  // Frame at which typing completes (last char start + base interval).
  const doneFrame = startFrame + (starts[starts.length - 1] ?? 0) + baseInterval;

  // Cursor opacity: persists while typing + 1s after, then fades over 0.3s.
  const cursorBlink = Math.floor(frame / 15) % 2 === 0; // 2Hz blink
  let cursorOpacity = 0;
  if (cursor !== "none" && frame >= startFrame) {
    if (frame < doneFrame + sec(1.0)) {
      cursorOpacity = cursor === "solid" ? 1 : cursorBlink ? 1 : 0;
    } else {
      cursorOpacity = interpolate(
        frame,
        [doneFrame + sec(1.0), doneFrame + sec(1.3)],
        [1, 0],
        CLAMP,
      );
    }
  }

  // Resolve cursor color
  const resolvedCursorColor =
    cursorColor ??
    (style?.color as string | undefined) ??
    palette.ink;

  return (
    <span style={style} className={className}>
      {visible}
      {cursor !== "none" && (
        // Solid cursor block — background + width + height does the work.
        // (Previously this rendered a ▌ glyph behind matching background/
        // color, which over-specified the visual.)
        <span
          aria-hidden
          style={{
            opacity: cursorOpacity,
            display: "inline-block",
            width: "0.5em",
            height: "1em",
            background: resolvedCursorColor,
            marginLeft: 2,
            verticalAlign: "text-bottom",
          }}
        />
      )}
    </span>
  );
};


// ─── useTrackingIn ─────────────────────────────────────────────────────────

export interface UseTrackingInResult {
  letterSpacing: string;
  opacity: number;
}

/**
 * Returns letter-spacing and opacity values for a tracking-in headline
 * (letter-spacing collapses from `fromSpacingPx` to `toSpacingPx` while
 * opacity fills in). Editorial register: composed typography (mid-century
 * editorial lineage). See doctrine doc § 02.
 */
export function useTrackingIn(
  startFrame: number,
  durationFrames: number = sec(1.0),
  fromSpacingPx: number = 10,
  toSpacingPx: number = 0,
): UseTrackingInResult {
  const frame = useCurrentFrame();
  const tracking = interpolate(
    frame,
    [startFrame, startFrame + durationFrames],
    [fromSpacingPx, toSpacingPx],
    {
      easing: Easing.out(Easing.cubic),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );
  // Opacity fills in slightly faster than tracking — letters "appear in place"
  const opacity = interpolate(
    frame,
    [startFrame, startFrame + Math.min(durationFrames, sec(0.5))],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  return { letterSpacing: `${tracking}px`, opacity };
}


// ─── UnderlineDraw ─────────────────────────────────────────────────────────

export interface UnderlineDrawProps {
  /** Width of the underline in pixels (typically the rendered width of the emphasized phrase). */
  width: number;
  startFrame: number;
  durationFrames?: number;
  color?: string;
  thickness?: number;
  /** Show a small endpoint dot when the underline completes. */
  endpointDot?: boolean;
  style?: React.CSSProperties;
}

/**
 * SVG hairline that draws beneath a phrase, left-to-right, over
 * `durationFrames`. Editorial register: inline emphasis without weight or
 * color shift. See doctrine doc § 04.
 */
export const UnderlineDraw: React.FC<UnderlineDrawProps> = ({
  width,
  startFrame,
  durationFrames = sec(0.9),
  color = palette.gold,
  thickness = 2,
  endpointDot = true,
  style,
}) => {
  const frame = useCurrentFrame();
  const progress = interpolate(
    frame,
    [startFrame, startFrame + durationFrames],
    [0, 1],
    {
      easing: Easing.out(Easing.cubic),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );
  // Svg height scales with thickness so thick underlines don't clip
  // against a fixed 8px viewport. Endpoint dot radius (3px) also bounded.
  const svgHeight = Math.max(8, thickness * 2 + 4);
  const lineY = svgHeight / 2;
  const dotRadius = Math.max(3, thickness * 1.25);
  return (
    <svg
      style={{
        width,
        height: svgHeight,
        overflow: "visible",
        ...style,
      }}
    >
      <line
        x1={0}
        y1={lineY}
        x2={width}
        y2={lineY}
        stroke={color}
        strokeWidth={thickness}
        strokeDasharray={width}
        strokeDashoffset={width * (1 - progress)}
      />
      {endpointDot && (
        <circle
          cx={width}
          cy={lineY}
          r={dotRadius}
          fill={color}
          opacity={progress > 0.95 ? 1 : 0}
        />
      )}
    </svg>
  );
};


// ─── Small shared helper (used by composite patterns) ──────────────────────

export const textFadeIn = (frame: number, startFrame: number, durationFrames: number): number =>
  interpolate(
    frame,
    [startFrame, startFrame + durationFrames],
    [0, 1],
    CLAMP_SINE,
  );
