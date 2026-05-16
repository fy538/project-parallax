/**
 * TextAnimationShowcase — side-by-side comparison of eight text-animation
 * techniques curated from the editorial-register research.
 *
 * Each technique is demonstrated on real-looking Parallax content in its
 * own row. Techniques are inlined here (not extracted as primitives) so we
 * can evaluate them visually before committing to abstractions. Once the
 * winners are chosen, they get pulled out into `hooks/` or `components/`
 * with proper APIs.
 *
 * Layout: 8 horizontal rows. Each row has a mono label column on the left
 * (technique name + one-line description) and the live demo on the right.
 * Techniques fire with overlapping stagger so the eye can track each one
 * in motion, then everything holds in its settled state from ~10s onward
 * for static review.
 *
 * The eight techniques:
 *   1. NumberTicker     — values that arrive, not appear
 *   2. TrackingIn       — letter-spacing collapse (mid-century editorial)
 *   3. RevealMask       — wipe-in from below (uncovered, not faded)
 *   4. UnderlineDraw    — emphasis without weight or color shift
 *   5. Typewriter       — archival quote register, with cursor + punct pauses
 *   6. Backspace        — the bounded-analogy correction beat
 *   7. Scramble         — hash → text (concealed → revealed)
 *   8. WordCascade      — current toolkit baseline (AnimatedText word mode)
 */

import React from "react";
import {
  AbsoluteFill,
  Composition,
  Sequence,
  useCurrentFrame,
  interpolate,
  Easing,
} from "remotion";
import { EditorialSurface } from "../components/EditorialSurface";
import { useCompositionAnimation } from "../hooks/useCompositionAnimation";
import { AnimatedText } from "../components/AnimatedText";
import { layout, palette, fonts, fontSizes, sec } from "../design/theme";
import { CLAMP, CLAMP_CUBIC, CLAMP_SINE } from "../utils/animation";
import { catalogId } from "./helpers";

// ── Shared palette / constants ──────────────────────────────────────────────

const INK = palette.ink;
const BODY_GREY = "#5C5046";
const HERO_COLOR = palette.gold;
const HAIRLINE = "rgba(28, 24, 20, 0.18)";

// Row layout
const ROW_HEIGHT = 108;
const ROW_GAP = 6;
const ROWS_TOP = 130;
const LABEL_COL_LEFT = 80;
const LABEL_COL_WIDTH = 320;
const DEMO_COL_LEFT = 420;
const DEMO_COL_RIGHT = layout.width - 80;

// Stagger of row reveals — each row starts ~30 frames after the previous,
// with longer-running techniques (5, 6) given more breathing room.
const ROW_STARTS = [
  sec(0.6),  // 1 NumberTicker
  sec(1.4),  // 2 TrackingIn
  sec(2.2),  // 3 RevealMask
  sec(3.0),  // 4 UnderlineDraw
  sec(3.8),  // 5 Typewriter
  sec(7.0),  // 6 Backspace (waits for Typewriter to mostly land)
  sec(10.0), // 7 Scramble
  sec(11.0), // 8 WordCascade
];

// ── Tiny helpers ────────────────────────────────────────────────────────────

const fadeIn = (frame: number, start: number, dur: number) =>
  interpolate(frame, [start, start + dur], [0, 1], CLAMP_SINE);

// ── Row scaffold ────────────────────────────────────────────────────────────

const Row: React.FC<{
  index: number;
  label: string;
  caption: string;
  children: React.ReactNode;
  startFrame: number;
  frame: number;
}> = ({ index, label, caption, children, startFrame, frame }) => {
  const y = ROWS_TOP + (index - 1) * (ROW_HEIGHT + ROW_GAP);
  const labelOpacity = fadeIn(frame, startFrame - sec(0.2), sec(0.3)) * 0.85;

  return (
    <>
      {/* Hairline divider above each row (except first) */}
      {index > 1 && (
        <div
          style={{
            position: "absolute",
            top: y - ROW_GAP / 2,
            left: LABEL_COL_LEFT,
            right: 80,
            height: 1,
            background: HAIRLINE,
            opacity: 0.5,
          }}
        />
      )}

      {/* Label column */}
      <div
        style={{
          position: "absolute",
          top: y + (ROW_HEIGHT - 60) / 2,
          left: LABEL_COL_LEFT,
          width: LABEL_COL_WIDTH,
          opacity: labelOpacity,
        }}
      >
        <div
          style={{
            fontFamily: fonts.mono,
            fontSize: fontSizes.caption,
            fontWeight: 700,
            letterSpacing: 2.5,
            textTransform: "uppercase",
            color: INK,
            marginBottom: 6,
          }}
        >
          {String(index).padStart(2, "0")} · {label}
        </div>
        <div
          style={{
            fontFamily: fonts.mono,
            fontSize: 12,
            letterSpacing: 0.5,
            color: BODY_GREY,
            lineHeight: 1.35,
          }}
        >
          {caption}
        </div>
      </div>

      {/* Demo container */}
      <div
        style={{
          position: "absolute",
          top: y,
          left: DEMO_COL_LEFT,
          width: DEMO_COL_RIGHT - DEMO_COL_LEFT,
          height: ROW_HEIGHT,
          display: "flex",
          alignItems: "center",
        }}
      >
        {children}
      </div>
    </>
  );
};


// ════════════════════════════════════════════════════════════════════════════
// TECHNIQUE 1 — NUMBER TICKER
// ════════════════════════════════════════════════════════════════════════════
const NumberTicker: React.FC<{ frame: number; startFrame: number }> = ({
  frame,
  startFrame,
}) => {
  const dur = sec(1.2);
  // Eased deceleration — value rushes up then settles into target
  const progress = interpolate(frame, [startFrame, startFrame + dur], [0, 1], {
    easing: Easing.out(Easing.poly(4)),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const value = Math.round(82 * progress);
  const opacity = fadeIn(frame, startFrame, sec(0.2));

  return (
    <div
      style={{
        fontFamily: fonts.display,
        fontSize: 90,
        fontWeight: 700,
        color: INK,
        letterSpacing: -2,
        opacity,
        // Hero color flash at settle — subtle reward for the eye
        textShadow: value === 82 ? `0 0 24px ${HERO_COLOR}40` : "none",
      }}
    >
      {value}
      <span style={{ fontSize: 60, color: BODY_GREY, marginLeft: 4 }}>%</span>
    </div>
  );
};


// ════════════════════════════════════════════════════════════════════════════
// TECHNIQUE 2 — TRACKING-IN (letter-spacing collapse)
// ════════════════════════════════════════════════════════════════════════════
const TrackingIn: React.FC<{ frame: number; startFrame: number }> = ({
  frame,
  startFrame,
}) => {
  const dur = sec(1.0);
  const trackingPx = interpolate(frame, [startFrame, startFrame + dur], [10, 0], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const opacity = fadeIn(frame, startFrame, sec(0.5));

  return (
    <div
      style={{
        fontFamily: fonts.display,
        fontSize: 44,
        fontWeight: 700,
        color: INK,
        letterSpacing: `${trackingPx}px`,
        opacity,
        whiteSpace: "nowrap",
      }}
    >
      Even round one breaks the model.
    </div>
  );
};


// ════════════════════════════════════════════════════════════════════════════
// TECHNIQUE 3 — REVEAL MASK (wipe-in from below)
// ════════════════════════════════════════════════════════════════════════════
const RevealMask: React.FC<{ frame: number; startFrame: number }> = ({
  frame,
  startFrame,
}) => {
  const dur = sec(0.7);
  // The clip rect grows upward over the text. Progress 0 = no text visible
  // (rect at bottom of text bounding box), 1 = full text visible.
  const progress = interpolate(frame, [startFrame, startFrame + dur], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Text geometry — sized to match the row.
  const textHeight = 60;
  const textWidth = 480;

  return (
    <svg width={textWidth + 20} height={textHeight + 20} style={{ overflow: "visible" }}>
      <defs>
        <clipPath id="reveal-mask-clip">
          <rect
            x={0}
            y={textHeight - textHeight * progress}
            width={textWidth + 20}
            height={textHeight * progress + 4}
          />
        </clipPath>
      </defs>
      <text
        x={0}
        y={textHeight - 6}
        clipPath="url(#reveal-mask-clip)"
        fontFamily={fonts.mono}
        fontSize={32}
        fontWeight={700}
        fill={INK}
        letterSpacing={4}
      >
        COOPERATION THEORY
      </text>
      {/* Hairline rule beneath the text to anchor it — only after reveal completes */}
      <line
        x1={0}
        y1={textHeight + 2}
        x2={textWidth * Math.max(0, (progress - 0.7) / 0.3)}
        y2={textHeight + 2}
        stroke={HERO_COLOR}
        strokeWidth={1.5}
      />
    </svg>
  );
};


// ════════════════════════════════════════════════════════════════════════════
// TECHNIQUE 4 — UNDERLINE DRAW (emphasis without weight shift)
// ════════════════════════════════════════════════════════════════════════════
const UnderlineDraw: React.FC<{ frame: number; startFrame: number }> = ({
  frame,
  startFrame,
}) => {
  const textOpacity = fadeIn(frame, startFrame, sec(0.4));
  // Underline starts drawing AFTER the text is fully readable
  const underlineStart = startFrame + sec(0.6);
  const underlineDur = sec(0.9);
  const underlineProgress = interpolate(
    frame,
    [underlineStart, underlineStart + underlineDur],
    [0, 1],
    { easing: Easing.out(Easing.cubic), extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  // Emphasis span width — measured eyeballed; in production would auto-measure
  const emphasisWidth = 470;

  return (
    <div style={{ position: "relative", display: "inline-block", opacity: textOpacity }}>
      <div
        style={{
          fontFamily: fonts.body,
          fontSize: 30,
          fontWeight: 500,
          color: INK,
          letterSpacing: -0.2,
          lineHeight: 1.3,
          whiteSpace: "nowrap",
        }}
      >
        The model{" "}
        <span style={{ position: "relative", display: "inline-block" }}>
          failed on its own first iteration
          {/* Underline grows beneath this span */}
          <svg
            style={{
              position: "absolute",
              left: 0,
              bottom: -10,
              width: emphasisWidth,
              height: 8,
              overflow: "visible",
            }}
          >
            <line
              x1={0}
              y1={4}
              x2={emphasisWidth}
              y2={4}
              stroke={HERO_COLOR}
              strokeWidth={2}
              strokeDasharray={emphasisWidth}
              strokeDashoffset={emphasisWidth * (1 - underlineProgress)}
            />
            {/* Endpoint dot — appears at the right edge when underline completes */}
            <circle
              cx={emphasisWidth}
              cy={4}
              r={3}
              fill={HERO_COLOR}
              opacity={underlineProgress > 0.95 ? 1 : 0}
            />
          </svg>
        </span>
        .
      </div>
    </div>
  );
};


// ════════════════════════════════════════════════════════════════════════════
// TECHNIQUE 5 — TYPEWRITER (with cursor + punctuation pauses)
// ════════════════════════════════════════════════════════════════════════════
const NASH_QUOTE = "They would have been more rational if they couldn't see each other.";
const NASH_ATTRIBUTION = "— Nash, 1950";

// Per-character timing: base interval + pause after punctuation
function typewriterCharStarts(text: string, baseInterval: number): number[] {
  const starts: number[] = [];
  let cursor = 0;
  const punctPause: Record<string, number> = {
    ",": 6,
    ".": 14,
    "?": 14,
    "!": 14,
    ";": 10,
    ":": 10,
  };
  for (let i = 0; i < text.length; i++) {
    starts.push(cursor);
    cursor += baseInterval;
    const ch = text[i];
    if (ch in punctPause) cursor += punctPause[ch];
  }
  return starts;
}

const Typewriter: React.FC<{ frame: number; startFrame: number }> = ({
  frame,
  startFrame,
}) => {
  // ~22 characters per second → frames per char at 30fps ≈ 1.36 → integer 2
  const baseInterval = 2;
  const starts = React.useMemo(
    () => typewriterCharStarts(NASH_QUOTE, baseInterval),
    [],
  );

  // How many chars are currently revealed?
  let visibleCount = 0;
  const localFrame = frame - startFrame;
  for (let i = 0; i < starts.length; i++) {
    if (localFrame >= starts[i]) visibleCount = i + 1;
  }
  const visible = NASH_QUOTE.slice(0, visibleCount);
  const quoteDoneFrame = startFrame + (starts[starts.length - 1] + baseInterval);

  // Cursor blinks at 2Hz (every 15 frames at 30fps). Persists while typing,
  // continues blinking briefly after, then fades out.
  const cursorBlink = Math.floor(frame / 15) % 2 === 0;
  const cursorOpacity =
    frame < startFrame
      ? 0
      : frame < quoteDoneFrame + sec(1.0)
        ? cursorBlink ? 1 : 0
        : interpolate(frame, [quoteDoneFrame + sec(1.0), quoteDoneFrame + sec(1.3)], [1, 0], CLAMP);

  // Attribution fades in after the quote completes
  const attribOpacity = fadeIn(frame, quoteDoneFrame + sec(0.4), sec(0.5));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div
        style={{
          fontFamily: fonts.mono,
          fontSize: 22,
          color: INK,
          letterSpacing: 0,
          lineHeight: 1.35,
          maxWidth: 920,
        }}
      >
        "{visible}
        <span
          style={{
            opacity: cursorOpacity,
            display: "inline-block",
            width: "0.45em",
            background: INK,
            color: INK,
            marginLeft: 2,
          }}
        >
          ▌
        </span>
      </div>
      <div
        style={{
          fontFamily: fonts.serifBody,
          fontStyle: "italic",
          fontSize: 18,
          color: BODY_GREY,
          opacity: attribOpacity,
        }}
      >
        {NASH_ATTRIBUTION}
      </div>
    </div>
  );
};


// ════════════════════════════════════════════════════════════════════════════
// TECHNIQUE 6 — BACKSPACE / RETYPE  (the bounded-analogy beat)
// ════════════════════════════════════════════════════════════════════════════
const BASE_TEXT = "The model predicts ";
const WRONG = "defection";
const RIGHT = "cooperation";

const Backspace: React.FC<{ frame: number; startFrame: number }> = ({
  frame,
  startFrame,
}) => {
  // Phases (frame offsets from startFrame):
  //   1) Type BASE_TEXT + WRONG     — at 2 frames per char
  //   2) Pause                       — 18 frames so the eye reads it
  //   3) Backspace WRONG             — at 2 frames per char (slightly faster)
  //   4) Type RIGHT                  — at 2 frames per char
  const phase1 = (BASE_TEXT + WRONG).length * 2; // ~58
  const pauseFrames = 18;
  const phase2End = phase1 + pauseFrames;
  const phase3 = WRONG.length * 2; // ~18
  const phase3End = phase2End + phase3;
  const phase4 = RIGHT.length * 2;
  const phase4End = phase3End + phase4;

  const localFrame = frame - startFrame;
  let visible = "";
  let isCorrect = false;

  if (localFrame < 0) {
    visible = "";
  } else if (localFrame < phase1) {
    // Typing the wrong version
    const idx = Math.min((BASE_TEXT + WRONG).length, Math.floor(localFrame / 2));
    visible = (BASE_TEXT + WRONG).slice(0, idx);
  } else if (localFrame < phase2End) {
    visible = BASE_TEXT + WRONG;
  } else if (localFrame < phase3End) {
    // Backspacing through WRONG
    const removed = Math.min(WRONG.length, Math.floor((localFrame - phase2End) / 2));
    visible = BASE_TEXT + WRONG.slice(0, WRONG.length - removed);
  } else if (localFrame < phase4End) {
    // Typing RIGHT
    const idx = Math.min(RIGHT.length, Math.floor((localFrame - phase3End) / 2));
    visible = BASE_TEXT + RIGHT.slice(0, idx);
    isCorrect = idx > 0;
  } else {
    visible = BASE_TEXT + RIGHT;
    isCorrect = true;
  }

  // Cursor — same blink pattern, persists throughout
  const cursorBlink = Math.floor(frame / 15) % 2 === 0;
  const cursorOpacity = localFrame >= 0 && localFrame < phase4End + sec(0.8) ? (cursorBlink ? 1 : 0) : 0;

  // Color treatment: the appended word becomes gold (the correction) after it completes
  const baseSlice = visible.slice(0, BASE_TEXT.length);
  const tailSlice = visible.slice(BASE_TEXT.length);
  const tailColor = isCorrect && localFrame >= phase4End ? HERO_COLOR : INK;

  return (
    <div
      style={{
        fontFamily: fonts.mono,
        fontSize: 24,
        color: INK,
        letterSpacing: 0,
      }}
    >
      {baseSlice}
      <span style={{ color: tailColor, fontWeight: isCorrect && localFrame >= phase4End ? 700 : 400 }}>
        {tailSlice}
      </span>
      <span
        style={{
          opacity: cursorOpacity,
          display: "inline-block",
          width: "0.5em",
          background: INK,
          color: INK,
          marginLeft: 2,
        }}
      >
        ▌
      </span>
    </div>
  );
};


// ════════════════════════════════════════════════════════════════════════════
// TECHNIQUE 7 — SCRAMBLE (hash → text)
// ════════════════════════════════════════════════════════════════════════════
const SCRAMBLE_TEXT = "RAND MEMO RM-789-1, JAN 1950";

const Scramble: React.FC<{ frame: number; startFrame: number }> = ({
  frame,
  startFrame,
}) => {
  // Each character resolves left-to-right over `resolveDur` frames. Before
  // resolution: render █ (block). After: render real character.
  const resolveDur = sec(1.0);
  const chars = SCRAMBLE_TEXT.split("");

  return (
    <div
      style={{
        fontFamily: fonts.mono,
        fontSize: 28,
        color: INK,
        letterSpacing: 2,
        fontWeight: 700,
      }}
    >
      {chars.map((c, i) => {
        const resolveAt = startFrame + (i / chars.length) * resolveDur;
        const resolved = frame >= resolveAt;
        return (
          <span key={i} style={{ color: resolved ? INK : `${INK}80` }}>
            {resolved ? c : c === " " ? " " : "█"}
          </span>
        );
      })}
    </div>
  );
};


// ════════════════════════════════════════════════════════════════════════════
// TECHNIQUE 8 — WORD CASCADE (baseline — existing AnimatedText)
// ════════════════════════════════════════════════════════════════════════════
const WordCascade: React.FC<{ startFrame: number }> = ({ startFrame }) => {
  return (
    <Sequence from={startFrame} layout="none">
      <div
        style={{
          fontFamily: fonts.display,
          fontSize: 28,
          color: INK,
          maxWidth: 920,
        }}
      >
        <AnimatedText
          text="Each word arrives in sequence with eased settle."
          startFrame={0}
          mode="word"
          framesPerUnit={3}
          fontSize={28}
          fontFamily={fonts.display}
          color={INK}
          fontWeight={600}
        />
      </div>
    </Sequence>
  );
};


// ════════════════════════════════════════════════════════════════════════════
// COMPOSITION
// ════════════════════════════════════════════════════════════════════════════

const TextAnimationShowcase: React.FC = () => {
  const frame = useCurrentFrame();
  useCompositionAnimation({ noDrift: true });

  return (
    <AbsoluteFill>
      <EditorialSurface intensity={0.4}>
        {/* Header */}
        <div
          style={{
            position: "absolute",
            top: 50,
            left: LABEL_COL_LEFT,
            right: 80,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            opacity: fadeIn(frame, 0, sec(0.5)),
          }}
        >
          <div
            style={{
              fontFamily: fonts.display,
              fontSize: 36,
              fontWeight: 700,
              color: INK,
              letterSpacing: -1,
            }}
          >
            Editorial text animations
          </div>
          <div
            style={{
              fontFamily: fonts.mono,
              fontSize: fontSizes.caption,
              color: BODY_GREY,
              letterSpacing: 2,
              textTransform: "uppercase",
            }}
          >
            eight techniques · side-by-side
          </div>
        </div>

        {/* The eight rows */}
        <Row
          index={1}
          label="Number ticker"
          caption="Counts up to target with eased deceleration. Stats that arrive, not appear."
          startFrame={ROW_STARTS[0]}
          frame={frame}
        >
          <NumberTicker frame={frame} startFrame={ROW_STARTS[0]} />
        </Row>

        <Row
          index={2}
          label="Tracking-in"
          caption="Letter-spacing collapses from wide to normal. Mid-century editorial register."
          startFrame={ROW_STARTS[1]}
          frame={frame}
        >
          <TrackingIn frame={frame} startFrame={ROW_STARTS[1]} />
        </Row>

        <Row
          index={3}
          label="Reveal mask"
          caption="Wipe-in from below via clip-path. Uncovered, not faded — feels cinematic."
          startFrame={ROW_STARTS[2]}
          frame={frame}
        >
          <RevealMask frame={frame} startFrame={ROW_STARTS[2]} />
        </Row>

        <Row
          index={4}
          label="Underline draw"
          caption="Hairline grows under a phrase. Inline emphasis without weight/color shifts."
          startFrame={ROW_STARTS[3]}
          frame={frame}
        >
          <UnderlineDraw frame={frame} startFrame={ROW_STARTS[3]} />
        </Row>

        <Row
          index={5}
          label="Typewriter"
          caption="Character-by-character, blinking cursor, punctuation pauses. Archival quote register."
          startFrame={ROW_STARTS[4]}
          frame={frame}
        >
          <Typewriter frame={frame} startFrame={ROW_STARTS[4]} />
        </Row>

        <Row
          index={6}
          label="Backspace"
          caption='Type → backspace → retype the correction. The "bounded analogy" beat.'
          startFrame={ROW_STARTS[5]}
          frame={frame}
        >
          <Backspace frame={frame} startFrame={ROW_STARTS[5]} />
        </Row>

        <Row
          index={7}
          label="Scramble"
          caption="Hash blocks resolve to characters left-to-right. Concealed → revealed."
          startFrame={ROW_STARTS[6]}
          frame={frame}
        >
          <Scramble frame={frame} startFrame={ROW_STARTS[6]} />
        </Row>

        <Row
          index={8}
          label="Word cascade"
          caption="Existing AnimatedText baseline — word-by-word fade-up with eased settle."
          startFrame={ROW_STARTS[7]}
          frame={frame}
        >
          <WordCascade startFrame={ROW_STARTS[7]} />
        </Row>

        {/* Footer */}
        <div
          style={{
            position: "absolute",
            bottom: 40,
            left: LABEL_COL_LEFT,
            right: 80,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            opacity: fadeIn(frame, sec(0.5), sec(0.5)) * 0.6,
          }}
        >
          <div
            style={{
              fontFamily: fonts.mono,
              fontSize: fontSizes.caption,
              color: BODY_GREY,
              letterSpacing: 2,
            }}
          >
            ∴ parallax · editorial register · text-animation showcase
          </div>
          <div
            style={{
              fontFamily: fonts.mono,
              fontSize: fontSizes.caption,
              color: BODY_GREY,
              letterSpacing: 2,
            }}
          >
            scrub to compare · hold from 14s
          </div>
        </div>
      </EditorialSurface>
    </AbsoluteFill>
  );
};


// ── Composition registration ────────────────────────────────────────────────

export const CatalogTextAnimationShowcase = () => (
  <Composition
    id={catalogId("TextAnimation", "showcase")}
    component={TextAnimationShowcase}
    width={layout.width}
    height={layout.height}
    fps={layout.fps}
    durationInFrames={sec(18)}
    defaultProps={{}}
  />
);
