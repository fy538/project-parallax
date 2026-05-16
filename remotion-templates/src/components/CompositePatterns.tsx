/**
 * CompositePatterns — high-level editorial choreography components.
 *
 * These compose the atomic text-animation primitives in `textAnimation.tsx`
 * into NAMED editorial patterns that the visual-spec skill thinks in:
 *
 *   <DefinitionReveal>   — term + pinyin + translation choreography
 *                          (Parallax's canonical 卡脖子 / 举国体制 pattern)
 *   <StatCaption>        — hero stat (NumberTicker) + caption beneath
 *   <QuoteAttribution>   — Typewriter quote + attribution fade-in
 *
 * Each pattern handles its own internal stagger, typography hierarchy, and
 * editorial defaults. Callers provide only content + a startFrame.
 *
 * Editorial register and use-case rules live in
 * `project/TEXT_ANIMATION_REGISTER.md` § "Combining techniques" and the
 * per-technique sections.
 *
 * These components are intentionally OPINIONATED — they encode the
 * channel's editorial defaults so segments don't reinvent the typography.
 * For one-off custom choreography, compose the atomic primitives directly.
 */

import React from "react";
import { useCurrentFrame } from "remotion";
import { fonts, palette, sec } from "../design/theme";
import { formatNumber } from "../utils/numberFormat";
import {
  useNumberTicker,
  useTrackingIn,
  Typewriter,
  textFadeIn,
  computeCharStarts,
} from "./textAnimation";
import { ConceptCallback } from "./ConceptCallback";

const BODY_GREY = "#5C5046";

// Conservative base interval for typewriter timing estimates (frames per
// char at 30fps for the default cps=22). Used by QuoteAttribution to
// compute the exact frame the typewriter completes via computeCharStarts.
const cpsToBaseInterval = (cps: number): number =>
  Math.max(1, Math.round(30 / cps));


// ════════════════════════════════════════════════════════════════════════════
// <DefinitionReveal>
// ════════════════════════════════════════════════════════════════════════════
//
// Pattern:
//   1. Term       — display weight, large; tracking-in style entrance
//   2. Pinyin     — Plex Mono, smaller, italic feel via spacing
//      (only rendered for Chinese terms — when `pinyin` prop is set)
//   3. Translation — Plex Serif italic, body size, BODY_GREY
//   4. Citation    — caption micro, optional, fades in last
//
// Internal stagger:
//   t=0      term entrance starts
//   t=0.4s   pinyin fades in  (or skipped → translation fades in)
//   t=0.8s   translation fades in  (or t=0.4s if no pinyin)
//   t=1.4s   citation fades in (if present)
//
// Concept callback integration: when `isCallback=true`, the TERM glyph
// gets wrapped in <ConceptCallback> so the pulse fires on arrival. The
// visual-spec skill sets isCallback based on registry lookup.

export interface DefinitionRevealProps {
  /** The term being defined. CJK or English. */
  term: string;
  /** Optional pinyin transcription for Chinese terms (e.g. "kǎ bózi"). */
  pinyin?: string;
  /** English gloss / translation. */
  translation: string;
  /** Optional source citation, shown smallest at the bottom. */
  citation?: string;
  /** Frame at which the reveal begins (relative to composition). */
  startFrame?: number;
  /** Accent color used for the callback pulse. Defaults to palette.gold. */
  accentColor?: string;
  /**
   * When true, the term arrives with a Concept Callback pulse signaling
   * cross-episode recurrence. Determined by visual-spec checking
   * `data/concepts.json` for prior appearances. Default false.
   */
  isCallback?: boolean;
  /** Per-element font-size overrides (rare). */
  sizes?: {
    term?: number;
    pinyin?: number;
    translation?: number;
    citation?: number;
  };
  /** Horizontal alignment. Default "left". */
  align?: "left" | "center";
}

export const DefinitionReveal: React.FC<DefinitionRevealProps> = ({
  term,
  pinyin,
  translation,
  citation,
  startFrame = 0,
  accentColor = palette.gold,
  isCallback = false,
  sizes = {},
  align = "left",
}) => {
  const frame = useCurrentFrame();

  const termFontSize = sizes.term ?? 80;
  const pinyinFontSize = sizes.pinyin ?? 24;
  const translationFontSize = sizes.translation ?? 28;
  const citationFontSize = sizes.citation ?? 14;

  // Stagger offsets
  const TERM_START = startFrame;
  const PINYIN_START = startFrame + sec(0.4);
  const TRANSLATION_START = startFrame + (pinyin ? sec(0.8) : sec(0.4));
  const CITATION_START = startFrame + sec(1.4);

  // Term entrance: tracking-in (letter-spacing collapse + opacity fill).
  // This matches the doctrine's "composed typography" claim — letters find
  // their place rather than fading or scaling in. Magnitude scales with
  // font size (a 64pt term tracks from ~5px; a 120pt term from ~8px) so
  // the perceived collapse rate is consistent across sizes.
  const trackingFromPx = Math.max(4, Math.round(termFontSize * 0.07));
  const { letterSpacing: termLetterSpacing, opacity: termOpacity } =
    useTrackingIn(TERM_START, sec(0.7), trackingFromPx, 0);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: align === "center" ? "center" : "flex-start",
        gap: 0,
      }}
    >
      {/* Term */}
      <div
        style={{
          fontFamily: fonts.display,
          fontSize: termFontSize,
          fontWeight: 700,
          color: palette.ink,
          // Editorial baseline letter-spacing for display sans at large
          // sizes is roughly -1px. Tracking-in starts above this baseline
          // (loose) and settles to it. We add the animated offset to the
          // baseline so the *final* letter-spacing matches editorial spec.
          letterSpacing: `calc(-1px + ${termLetterSpacing})`,
          lineHeight: 1.05,
          opacity: termOpacity,
          marginBottom: 12,
        }}
      >
        <ConceptCallback
          isCallback={isCallback}
          accentColor={accentColor}
          startFrame={TERM_START}
        >
          {term}
        </ConceptCallback>
      </div>

      {/* Pinyin (only for Chinese terms) */}
      {pinyin && (
        <div
          style={{
            fontFamily: fonts.mono,
            fontSize: pinyinFontSize,
            color: BODY_GREY,
            letterSpacing: 1,
            opacity: textFadeIn(frame, PINYIN_START, sec(0.4)),
            marginBottom: 14,
          }}
        >
          {pinyin}
        </div>
      )}

      {/* Translation */}
      <div
        style={{
          fontFamily: fonts.serifBody,
          fontStyle: "italic",
          fontSize: translationFontSize,
          color: BODY_GREY,
          letterSpacing: -0.2,
          lineHeight: 1.3,
          opacity: textFadeIn(frame, TRANSLATION_START, sec(0.5)),
        }}
      >
        {translation}
      </div>

      {/* Citation (optional) */}
      {citation && (
        <div
          style={{
            fontFamily: fonts.mono,
            fontSize: citationFontSize,
            color: BODY_GREY,
            letterSpacing: 1.5,
            marginTop: 20,
            opacity: textFadeIn(frame, CITATION_START, sec(0.4)) * 0.7,
          }}
        >
          {citation}
        </div>
      )}
    </div>
  );
};


// ════════════════════════════════════════════════════════════════════════════
// <StatCaption>
// ════════════════════════════════════════════════════════════════════════════
//
// Pattern:
//   1. Hero number — Number Ticker, display bold, large
//      Unit (%, $, etc.) renders at smaller size next to the number
//   2. Caption — body size, fades in after the ticker lands
//   3. Source — caption micro, optional
//
// Editorial register: hero stat reveals. The number ARRIVES; the caption
// then explains what it means. The eye reads number first, caption second.
//
// Internal stagger:
//   t=0           ticker begins (uses NumberTicker eased deceleration)
//   t=duration    ticker settles
//   t=duration + 0.3s   caption fades in
//   t=duration + 0.9s   source fades in (if present)

export interface StatCaptionProps {
  /** Target numeric value. */
  value: number;
  /** Optional unit suffix (e.g. "%", "$"). Rendered at smaller size. */
  unit?: string;
  /** Editorial caption beneath the number. */
  caption: string;
  /** Optional source citation. */
  source?: string;
  startFrame?: number;
  /** Ticker duration in frames. Default sec(1.2). */
  tickerDurationFrames?: number;
  /** Hero color for the unit suffix (and optional value glow). */
  accentColor?: string;
  sizes?: {
    value?: number;
    unit?: number;
    caption?: number;
    source?: number;
  };
  align?: "left" | "center";
  /** Decimal places for the ticked value. */
  decimals?: number;
}

export const StatCaption: React.FC<StatCaptionProps> = ({
  value,
  unit,
  caption,
  source,
  startFrame = 0,
  tickerDurationFrames = sec(1.2),
  accentColor = palette.gold,
  sizes = {},
  align = "left",
  decimals = 0,
}) => {
  const frame = useCurrentFrame();

  const valueFontSize = sizes.value ?? 120;
  const unitFontSize = sizes.unit ?? valueFontSize * 0.55;
  const captionFontSize = sizes.caption ?? 22;
  const sourceFontSize = sizes.source ?? 13;

  const tickedValue = useNumberTicker(value, startFrame, {
    durationFrames: tickerDurationFrames,
    decimals,
  });

  const CAPTION_START = startFrame + tickerDurationFrames + sec(0.3);
  const SOURCE_START = startFrame + tickerDurationFrames + sec(0.9);

  // Subtle settle glow on the value once the ticker completes
  const settled = frame >= startFrame + tickerDurationFrames;
  const glow = settled ? `0 0 24px ${accentColor}33` : "none";

  // Format with explicit en-US locale (avoids locale-dependent rendering
  // in headless Chromium during MP4 renders — e.g. "1.500" vs "1,500" vs
  // "1 500"). The formatNumber utility centralises this behaviour.
  const formattedValue = formatNumber(tickedValue, { decimals });

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: align === "center" ? "center" : "flex-start",
        gap: 0,
      }}
    >
      {/* Hero number */}
      <div
        style={{
          fontFamily: fonts.display,
          fontSize: valueFontSize,
          fontWeight: 700,
          color: palette.ink,
          letterSpacing: -2,
          lineHeight: 1.0,
          textShadow: glow,
          marginBottom: 16,
        }}
      >
        {formattedValue}
        {unit && (
          <span
            style={{
              fontSize: unitFontSize,
              color: BODY_GREY,
              marginLeft: 6,
              fontWeight: 600,
            }}
          >
            {unit}
          </span>
        )}
      </div>

      {/* Caption */}
      <div
        style={{
          fontFamily: fonts.body,
          fontSize: captionFontSize,
          color: BODY_GREY,
          lineHeight: 1.4,
          maxWidth: 600,
          opacity: textFadeIn(frame, CAPTION_START, sec(0.5)),
          textAlign: align,
        }}
      >
        {caption}
      </div>

      {/* Source */}
      {source && (
        <div
          style={{
            fontFamily: fonts.mono,
            fontSize: sourceFontSize,
            color: BODY_GREY,
            letterSpacing: 1.5,
            marginTop: 16,
            opacity: textFadeIn(frame, SOURCE_START, sec(0.4)) * 0.7,
          }}
        >
          {source}
        </div>
      )}
    </div>
  );
};


// ════════════════════════════════════════════════════════════════════════════
// <QuoteAttribution>
// ════════════════════════════════════════════════════════════════════════════
//
// Pattern:
//   1. Opening quotation mark — solid, slightly larger, ink
//   2. Quote text — Typewriter, character-by-character, with cursor
//   3. Attribution — serif italic, fades in 0.4s after quote completes
//
// Editorial register: archival / transcribed speech. Quoted statement from
// a named figure. The Typewriter carries the "transcribed" claim; the
// attribution arrival signals "and here is who said it."
//
// Editorial defaults:
//   - Cursor blinks during typing, persists ~1s after, then fades
//   - Quote text uses display sans (NOT mono) by default for video legibility,
//     unless `archival=true` which switches to mono for a memo-like register
//   - Attribution is right-aligned by convention, italic, grey

export interface QuoteAttributionProps {
  /** The quoted text (without opening/closing quotation marks). */
  text: string;
  /** Speaker attribution (e.g. "— Nash, 1950" or "Morris Chang, TSMC Founder"). */
  attribution: string;
  startFrame?: number;
  /** Characters per second for the Typewriter. Default 22. */
  cps?: number;
  /**
   * Archival register — use Plex Mono for the quote (default false uses
   * Plex Sans display). Set true for document reproductions / memo
   * transcriptions where a mono register reads as more historically apt.
   */
  archival?: boolean;
  /** Optional year/date — rendered alongside or beneath the attribution. */
  year?: string;
  sizes?: {
    quote?: number;
    attribution?: number;
  };
  /** Quote text color. Default palette.ink. */
  color?: string;
  align?: "left" | "center";
}

export const QuoteAttribution: React.FC<QuoteAttributionProps> = ({
  text,
  attribution,
  startFrame = 0,
  cps = 22,
  archival = false,
  year,
  sizes = {},
  color = palette.ink,
  align = "left",
}) => {
  const frame = useCurrentFrame();

  const quoteFontSize = sizes.quote ?? (archival ? 24 : 32);
  const attributionFontSize = sizes.attribution ?? 20;

  // Compute the EXACT frame at which the typewriter completes by running
  // the same char-onset table the Typewriter component uses internally.
  // (Previously this was an estimate using avg-punct-pause × punct-count,
  // which could drift by 10–20 frames either way for quotes with many
  // periods or many commas.) Memoised on text+cps so we recompute only
  // when those change.
  const baseInterval = cpsToBaseInterval(cps);
  const starts = React.useMemo(
    () => computeCharStarts(text, baseInterval),
    [text, baseInterval],
  );
  const lastCharOnset = starts[starts.length - 1] ?? 0;
  const typewriterDuration = lastCharOnset + baseInterval;
  const ATTRIBUTION_START = startFrame + typewriterDuration + sec(0.4);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: align === "center" ? "center" : "flex-start",
        gap: 0,
        maxWidth: 1000,
      }}
    >
      {/* Quote with typewriter */}
      <div
        style={{
          fontFamily: archival ? fonts.mono : fonts.display,
          fontSize: quoteFontSize,
          color,
          letterSpacing: archival ? 0 : -0.2,
          lineHeight: 1.4,
          fontWeight: archival ? 400 : 500,
          marginBottom: 24,
          textAlign: align,
        }}
      >
        <span style={{ marginRight: 2 }}>&ldquo;</span>
        <Typewriter
          text={text}
          startFrame={startFrame}
          cps={cps}
          cursor="blink"
          style={{
            fontFamily: archival ? fonts.mono : fonts.display,
            color,
          }}
        />
        <span style={{ marginLeft: 2 }}>&rdquo;</span>
      </div>

      {/* Attribution + optional year */}
      <div
        style={{
          fontFamily: fonts.serifBody,
          fontStyle: "italic",
          fontSize: attributionFontSize,
          color: BODY_GREY,
          opacity: textFadeIn(frame, ATTRIBUTION_START, sec(0.5)),
          alignSelf: align === "center" ? "center" : "flex-end",
          textAlign: align === "center" ? "center" : "right",
        }}
      >
        {attribution}
        {year && (
          <span style={{ marginLeft: 12, fontFamily: fonts.mono, fontStyle: "normal", fontSize: attributionFontSize * 0.85, letterSpacing: 1.5 }}>
            {year}
          </span>
        )}
      </div>
    </div>
  );
};
