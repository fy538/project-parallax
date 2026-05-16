/**
 * ConceptCallback — visual pulse for cross-episode concept recurrence.
 *
 * Leverages the existing `data/concepts.json` registry. When a term that
 * was introduced in a prior episode (per `concept.introduced.episode`)
 * appears again in a later episode (per `concept.appearances[].episode`),
 * its rendering can be wrapped in <ConceptCallback isCallback> to trigger
 * a brief pulse on arrival — color shift to the concept's `accentColor`
 * plus a hairline underline flash plus an optional indicator dot.
 *
 * Editorial intent: cross-episode continuity. The viewer who's followed
 * the channel gets a subtle "you've seen this before" cue without breaking
 * comprehension for new viewers. Compounding production at the visual
 * layer.
 *
 * The component is a wrapper — it does NOT look up the registry itself.
 * The visual-spec skill is the authority on cross-episode state and
 * decides `isCallback` at spec-generation time. This keeps the runtime
 * free of registry I/O.
 *
 * Usage:
 *   <ConceptCallback isCallback={true} accentColor="#C23B22" startFrame={30}>
 *     卡脖子
 *   </ConceptCallback>
 *
 * When isCallback is false, the wrapper is a transparent passthrough — no
 * visual effect, no DOM overhead. Safe to use unconditionally.
 *
 * IMPORTANT: `children` is rendered TWICE in the DOM when isCallback=true
 * (once as the base layer, once as an aria-hidden color overlay). This is
 * safe for plain text and simple inline elements. AVOID passing children
 * with side effects, event handlers, refs, or stateful components — they
 * would mount twice. The component's contract is "wrap a text-typesetting
 * fragment," not "wrap arbitrary React subtrees."
 *
 * Related: project/TEXT_ANIMATION_REGISTER.md § Tier 1.B (Concept Callback Pulse).
 */

import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { palette, sec } from "../design/theme";
import { CLAMP, CLAMP_SINE } from "../utils/animation";

export interface ConceptCallbackProps {
  /**
   * Whether this concept is a callback (true) or a first introduction
   * (false). Defaults to false; pass-through render when false. Determined
   * at visual-spec time by checking `data/concepts.json` for prior
   * `appearances[]` referencing earlier episodes.
   */
  isCallback?: boolean;
  /**
   * Concept accent color — usually from `concept.introduced.accentColor`
   * in the registry. Falls back to palette.gold.
   */
  accentColor?: string;
  /**
   * Frame at which the callback pulse begins (relative to composition).
   * The pulse runs for ~sec(0.6).
   */
  startFrame?: number;
  /**
   * Show a small dot indicator near the term (upper-right) signaling
   * callback status. Default true. Set false for ultra-subtle treatments.
   */
  showIndicator?: boolean;
  children: React.ReactNode;
}

/**
 * Pulse animation duration components (frames). Total ~sec(0.6).
 *
 *   color overlay:    0 → 1 → 0   (rise + decay)
 *   underline flash:  0 → 0.8 → 0 (slightly delayed)
 *   indicator dot:    0 → 1 → 0.5 (appears, settles to faint badge)
 */
const PULSE_DURATION = sec(0.6);

export const ConceptCallback: React.FC<ConceptCallbackProps> = ({
  isCallback = false,
  accentColor = palette.gold,
  startFrame = 0,
  showIndicator = true,
  children,
}) => {
  const frame = useCurrentFrame();

  // Passthrough when not a callback — zero overhead.
  if (!isCallback) {
    return <>{children}</>;
  }

  // Color overlay opacity: 0 → 0.75 → 0 over PULSE_DURATION.
  // Peak at ~35% into the pulse so the rise feels eager and the decay
  // settles slowly. Peak capped at 0.75 (not 1.0) so the ink baseline
  // always partially shows through — the doctrine doc calls for a
  // "subtle" recognition signal, not a full color swap.
  const colorOverlayOpacity = interpolate(
    frame,
    [
      startFrame,
      startFrame + PULSE_DURATION * 0.35,
      startFrame + PULSE_DURATION,
    ],
    [0, 0.75, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  // Hairline underline flash — slightly delayed, slightly faster decay.
  const underlineOpacity = interpolate(
    frame,
    [
      startFrame + sec(0.1),
      startFrame + sec(0.3),
      startFrame + sec(0.6),
    ],
    [0, 0.8, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  // Indicator dot — appears with the pulse and settles to a faint badge
  // (50% opacity) afterward, lingering as a recognition signal.
  const indicatorOpacity = showIndicator
    ? interpolate(
        frame,
        [
          startFrame,
          startFrame + sec(0.3),
          startFrame + sec(2.0),
        ],
        [0, 1, 0.5],
        CLAMP_SINE,
      )
    : 0;

  return (
    <span
      style={{
        position: "relative",
        display: "inline-block",
      }}
    >
      {/* Base render — children at default ink/inherit color */}
      <span style={{ position: "relative", zIndex: 1 }}>{children}</span>

      {/* Color overlay — renders children again on top, in accent color,
          with the pulse opacity. This avoids interpolating colors and
          works regardless of children's text content. */}
      <span
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          color: accentColor,
          opacity: colorOverlayOpacity,
          pointerEvents: "none",
          zIndex: 2,
          // Match base text styling — inherits font from parent
        }}
      >
        {children}
      </span>

      {/* Hairline underline flash */}
      <span
        aria-hidden
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: -4,
          height: 1.5,
          background: accentColor,
          opacity: underlineOpacity,
          pointerEvents: "none",
        }}
      />

      {/* Indicator dot — appears in upper-right, persists as faint badge */}
      {showIndicator && (
        <span
          aria-hidden
          style={{
            position: "absolute",
            top: "-0.45em",
            right: "-0.5em",
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: accentColor,
            opacity: indicatorOpacity,
            pointerEvents: "none",
          }}
        />
      )}
    </span>
  );
};
