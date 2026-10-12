/**
 * StillsReel — a test reel for getting more than one camera move out of a
 * generated still. Three techniques from reports/AI stills beyond Ken Burns.md,
 * each cut against the narration of the ai-care-motives beat it would replace:
 *
 *   1. Framed details — one still cut into framed details on the sentences,
 *      with one pose swap (the same frame, one figure changed).
 *   2. State swap — two registered frames swapped softly, then a cut-in.
 *   3. Four-panel build — one frame becomes two panels, then four.
 *
 * Test only: nothing here is wired into an episode manifest. The edited frames
 * were made with tools/ai-video/fal_edit.py and live in
 * public/episodes/ai-care-motives/stills-test/. The narration strip at the foot
 * of the frame is a review aid (there is no audio yet) and is not part of the look.
 */
import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  Series,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { fonts, fontSizes, layout, palette, sec } from "../design/theme";
import { CLAMP, CLAMP_DECELERATE, fadeIn, slideIn } from "../utils/animation";

export const W = layout.width;
export const H = layout.height;
const DIR = "episodes/ai-care-motives/stills-test";
export const still = (name: string, ext = "jpg") => staticFile(`${DIR}/${name}.${ext}`);

// ── Framed stills ────────────────────────────────────────────────────────────

/** Where the frame sits on the still: centre as a fraction of the image, and zoom. */
export interface Framing {
  cx: number;
  cy: number;
  zoom: number;
}

/** A registered state of the same still; swaps in at `atSec` after the shot starts. */
export interface ShotState {
  /** A picture, or `render` for anything drawn in the still's own 1920×1080 space. */
  src?: string;
  render?: (frame: number) => React.ReactNode;
  atSec?: number;
  /** Cross-fade length. Omit for a hard swap. */
  softSec?: number;
}

/** One camera move over one still. Shots cut hard to each other. */
export interface Shot {
  startSec: number;
  endSec: number;
  from: Framing;
  to?: Framing;
  states: ShotState[];
  /** Drawn over the still in its own 1920×1080 space, so it rides with the camera. */
  overlay?: (frame: number) => React.ReactNode;
  /** "settle" (default) arrives and slows; "glide" eases at both ends. */
  ease?: "settle" | "glide";
}

/** A slow move that is already under way at the cut and settles on its subject. */
export const MOVE = { ...CLAMP, easing: Easing.out(Easing.quad) };
export const GLIDE = { ...CLAMP, easing: Easing.inOut(Easing.sin) };

const framingTransform = (f: Framing): string => {
  const tx = Math.min(0, Math.max(W - W * f.zoom, W / 2 - f.cx * W * f.zoom));
  const ty = Math.min(0, Math.max(H - H * f.zoom, H / 2 - f.cy * H * f.zoom));
  return `translate(${tx}px, ${ty}px) scale(${f.zoom})`;
};

export const StillShots: React.FC<{ shots: Shot[] }> = ({ shots }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ backgroundColor: palette.ink, overflow: "hidden" }}>
      {shots.map((shot, i) => {
        const start = sec(shot.startSec);
        const end = sec(shot.endSec);
        const isLast = i === shots.length - 1;
        const active = frame >= start && (isLast || frame < end);
        const p = interpolate(frame, [start, end], [0, 1], shot.ease === "glide" ? GLIDE : MOVE);
        const to = shot.to ?? shot.from;
        const framing: Framing = {
          cx: shot.from.cx + (to.cx - shot.from.cx) * p,
          cy: shot.from.cy + (to.cy - shot.from.cy) * p,
          zoom: shot.from.zoom + (to.zoom - shot.from.zoom) * p,
        };
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: W,
              height: H,
              transformOrigin: "0 0",
              transform: framingTransform(framing),
              opacity: active ? 1 : 0,
            }}
          >
            {shot.states.map((state, k) => {
              const at = start + sec(state.atSec ?? 0);
              const opacity =
                k === 0
                  ? 1
                  : state.softSec
                    ? interpolate(frame, [at, at + sec(state.softSec)], [0, 1], CLAMP)
                    : frame >= at
                      ? 1
                      : 0;
              if (state.render) {
                return (
                  <div key={k} style={{ position: "absolute", inset: 0, opacity }}>
                    {active || opacity > 0 ? state.render(frame) : null}
                  </div>
                );
              }
              return (
                <Img
                  key={k}
                  src={state.src ?? ""}
                  style={{ position: "absolute", inset: 0, width: W, height: H, objectFit: "cover", opacity }}
                />
              );
            })}
            {active && shot.overlay ? shot.overlay(frame) : null}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// 1 · Framed details: the rating-cards still over its 20 seconds of narration.
const CROWD = still("crowd-4k");
const CROWD_NOTICES = still("crowd-notices-4k");
const FIGURE: Framing = { cx: 0.529, cy: 0.385, zoom: 2.6 };

export const FRAMED_DETAILS: Shot[] = [
  // "There's another complication."
  { startSec: 0, endSec: 1.6, from: { cx: 0.5, cy: 0.5, zoom: 1 }, to: { cx: 0.5, cy: 0.48, zoom: 1.04 }, states: [{ src: CROWD }] },
  // "When a lab says a model behaves well, that's a test result." Along the cards.
  { startSec: 1.6, endSec: 6.4, from: { cx: 0.22, cy: 0.41, zoom: 2.3 }, to: { cx: 0.4, cy: 0.41, zoom: 2.3 }, states: [{ src: CROWD }] },
  // "And researchers have found that AI models can distinguish…" The one being rated.
  { startSec: 6.4, endSec: 9.7, from: FIGURE, to: { ...FIGURE, zoom: 2.7 }, states: [{ src: CROWD }] },
  // "…test conversations from real ones…" It is looking back at a rater. The changed
  // pose arrives on a cut to a closer framing; swapped in the same framing it popped.
  { startSec: 9.7, endSec: 13.2, from: { cx: 0.585, cy: 0.37, zoom: 3 }, to: { cx: 0.585, cy: 0.37, zoom: 3.12 }, states: [{ src: CROWD_NOTICES }] },
  // "So what does a good result mean if the system can recognize the test?" Pull out.
  { startSec: 13.2, endSec: 20, from: { cx: 0.529, cy: 0.4, zoom: 1.6 }, to: { cx: 0.5, cy: 0.5, zoom: 1 }, states: [{ src: CROWD_NOTICES }] },
];

// 2 · State swap: the street empties, then a cut-in on the shopkeeper.
export const STATE_SWAP: Shot[] = [
  // "The question is simple. Take away the watching." Soft swap on "away".
  {
    startSec: 0,
    endSec: 5.8,
    from: { cx: 0.5, cy: 0.5, zoom: 1 },
    to: { cx: 0.41, cy: 0.47, zoom: 1.22 },
    states: [{ src: still("shop-watched-uhd") }, { src: still("shop-unwatched-uhd"), atSec: 3.5, softSec: 0.4 }],
  },
  // "What happens to the behavior?" He has turned back to the loaf.
  {
    startSec: 5.8,
    endSec: 10.2,
    from: { cx: 0.68, cy: 0.33, zoom: 1.75 },
    to: { cx: 0.68, cy: 0.33, zoom: 1.88 },
    states: [{ src: still("shop-ownwork-unwatched-uhd") }],
  },
];

// ── Four-panel build ─────────────────────────────────────────────────────────

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

const GUTTER = 16;
/** Left band that holds the row labels once the frame is four panels. */
const BAND = 264;
const EDGE = 56;
const QUAD_W = (W - BAND - EDGE - GUTTER) / 2;
const QUAD_H = (QUAD_W * 9) / 16;
const GRID_H = QUAD_H * 2 + GUTTER;
const GRID_Y = (H - GRID_H) / 2;
const TWO_W = (W - EDGE * 2 - GUTTER) / 2;

const FULL: Rect = { x: 0, y: 0, w: W, h: H };
const TWO_LEFT: Rect = { x: EDGE, y: GRID_Y, w: TWO_W, h: GRID_H };
const TWO_RIGHT: Rect = { x: EDGE + TWO_W + GUTTER, y: GRID_Y, w: TWO_W, h: GRID_H };
export const QUAD = (col: 0 | 1, row: 0 | 1): Rect => ({
  x: BAND + col * (QUAD_W + GUTTER),
  y: GRID_Y + row * (QUAD_H + GUTTER),
  w: QUAD_W,
  h: QUAD_H,
});

/** Beat times, in seconds from the start of the build. */
const BUILD = {
  split: 3.2, // "There are two versions."
  duty: 4.6, // "In the first, he thinks cheating a child is wrong."
  prudence: 10.4, // "In the second, he's careful."
  glance: 11.4, // …and in that version he is watching the street
  same: 21.2, // "Same bread. Same price. Same change."
  quad: 25.0, // "Take away the watching."
  unwatchedDuty: 26.2,
  unwatchedPrudence: 27.4, // "What happens to the behavior?"
  end: 33,
};
export const RESHAPE_SEC = 0.8;
/**
 * Every panel is zoomed a little inside its frame so the lower third of the
 * still (the dark counter front) is cropped away and what differs between the
 * panels is larger: the shopkeeper in a tall panel; the window and the
 * shopkeeper once the panel is 16:9.
 */
export const PANEL_ZOOM = 1.3;
const TALL_ORIGIN = { x: 50, y: 22 };
export const WIDE_ORIGIN = { x: 20.7, y: 0 };
export const RESHAPE = { ...CLAMP, easing: Easing.inOut(Easing.cubic) };
const VEIL = 0.5;

export const mixRect = (a: Rect, b: Rect, t: number): Rect => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
  w: a.w + (b.w - a.w) * t,
  h: a.h + (b.h - a.h) * t,
});

export const Badge: React.FC<{ label: string; opacity: number }> = ({ label, opacity }) => (
  <div
    style={{
      position: "absolute",
      top: 20,
      left: 20,
      padding: "8px 16px",
      backgroundColor: palette.ink,
      color: palette.bone,
      fontFamily: fonts.metadata,
      fontSize: fontSizes.readable,
      letterSpacing: 3,
      textTransform: "uppercase",
      opacity,
    }}
  >
    {label}
  </div>
);

export const Panel: React.FC<{
  rect: Rect;
  /** Registered states, stacked; `opacities[k]` is the opacity of state k. */
  states: { src: string; opacity: number }[];
  /** Where a tall or narrow panel looks on the still (CSS object-position). */
  focus?: string;
  /** Instead of `states`: anything drawn in 1920×1080 space, scaled to a 16:9 panel. */
  content?: React.ReactNode;
  veil?: number;
  opacity?: number;
  rise?: number;
  badge?: { label: string; opacity: number };
  accent?: number;
  /** Zoom inside the panel, about `origin` (a CSS transform-origin). */
  zoom?: number;
  origin?: string;
}> = ({ rect, states, focus = "88% 50%", content, veil = 0, opacity = 1, rise = 0, badge, accent = 0, zoom = 1, origin = "50% 50%" }) => (
  <div
    style={{
      position: "absolute",
      left: rect.x,
      top: rect.y + rise,
      width: rect.w,
      height: rect.h,
      overflow: "hidden",
      opacity,
      // The edge has to stay visible against a dark ground.
      boxShadow: `0 0 0 1px ${palette.walnut}`,
    }}
  >
    {states.map((s, k) => (
      <Img
        key={k}
        src={s.src}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          // Keeps the shopkeeper in a tall panel; no effect once the panel is 16:9.
          objectPosition: focus,
          transform: `scale(${zoom})`,
          transformOrigin: origin,
          opacity: s.opacity,
        }}
      />
    ))}
    {content ? (
      <div style={{ position: "absolute", inset: 0, transform: `scale(${zoom})`, transformOrigin: origin }}>
        <div style={{ width: W, height: H, transform: `scale(${rect.w / W})`, transformOrigin: "0 0" }}>{content}</div>
      </div>
    ) : null}
    <div style={{ position: "absolute", inset: 0, backgroundColor: palette.ink, opacity: veil }} />
    {badge && <Badge {...badge} />}
    <div
      style={{
        position: "absolute",
        inset: 0,
        boxShadow: `inset 0 0 0 4px ${palette.gold}`,
        opacity: accent,
      }}
    />
  </div>
);

export const RowLabel: React.FC<{ row: 0 | 1; label: string; opacity: number }> = ({ row, label, opacity }) => {
  const rect = QUAD(0, row);
  return (
    <div
      style={{
        position: "absolute",
        left: layout.safeArea.left,
        width: BAND - layout.safeArea.left - 20,
        top: rect.y,
        height: rect.h,
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        color: palette.bone,
        fontFamily: fonts.metadata,
        fontSize: fontSizes.readable,
        letterSpacing: 2,
        textTransform: "uppercase",
        opacity,
      }}
    >
      {label}
    </div>
  );
};

const PanelBuild: React.FC = () => {
  const frame = useCurrentFrame();
  const at = (s: number) => sec(s);
  const ramp = (s: number, lenSec = 0.5) => fadeIn(frame, at(s), sec(lenSec));

  const toTwo = interpolate(frame, [at(BUILD.split), at(BUILD.split + RESHAPE_SEC)], [0, 1], RESHAPE);
  const toQuad = interpolate(frame, [at(BUILD.quad), at(BUILD.quad + RESHAPE_SEC)], [0, 1], RESHAPE);

  const leftRect = mixRect(mixRect(FULL, TWO_LEFT, toTwo), QUAD(0, 0), toQuad);
  const rightRect = mixRect(TWO_RIGHT, QUAD(1, 0), toQuad);

  // One panel holds the eye at a time: the other is veiled while its sentence waits.
  const rightVeil = VEIL * (1 - ramp(BUILD.prudence));
  const leftVeil = 0.3 * ramp(BUILD.prudence) * (1 - ramp(BUILD.same - 0.4));
  const glanced = frame >= at(BUILD.glance) ? 1 : 0;

  const lower = (s: number) => ({
    opacity: ramp(s),
    rise: slideIn(frame, at(s), 14, sec(0.5)),
    zoom: PANEL_ZOOM,
    origin: `${WIDE_ORIGIN.x}% ${WIDE_ORIGIN.y}%`,
  });
  // The top panels start tall and end 16:9; their zoom centre travels with them.
  const upperOrigin = `${TALL_ORIGIN.x + (WIDE_ORIGIN.x - TALL_ORIGIN.x) * toQuad}% ${
    TALL_ORIGIN.y + (WIDE_ORIGIN.y - TALL_ORIGIN.y) * toQuad
  }%`;

  const ownWork = still("shop-ownwork-hd");
  return (
    <AbsoluteFill style={{ backgroundColor: palette.ink }}>
      <Panel
        rect={rightRect}
        states={[
          { src: ownWork, opacity: 1 },
          { src: still("shop-watched-hd"), opacity: glanced },
        ]}
        veil={rightVeil}
        zoom={PANEL_ZOOM}
        origin={upperOrigin}
        opacity={interpolate(frame, [at(BUILD.split + 0.2), at(BUILD.split + RESHAPE_SEC)], [0, 1], CLAMP_DECELERATE)}
        badge={{ label: "Prudence", opacity: ramp(BUILD.prudence) }}
      />
      <Panel
        rect={QUAD(0, 1)}
        states={[{ src: still("shop-ownwork-unwatched-hd"), opacity: 1 }]}
        {...lower(BUILD.unwatchedDuty)}
      />
      <Panel
        rect={QUAD(1, 1)}
        states={[{ src: still("shop-unwatched-hd"), opacity: 1 }]}
        accent={ramp(BUILD.unwatchedPrudence + 0.6, 0.6)}
        {...lower(BUILD.unwatchedPrudence)}
      />
      <Panel
        rect={leftRect}
        states={[{ src: ownWork, opacity: 1 }]}
        veil={leftVeil}
        zoom={1 + (PANEL_ZOOM - 1) * toTwo}
        origin={upperOrigin}
        badge={{ label: "Duty", opacity: ramp(BUILD.duty) }}
      />
      <RowLabel row={0} label="Watched" opacity={ramp(BUILD.quad + 0.6)} />
      <RowLabel row={1} label="Unwatched" opacity={ramp(BUILD.unwatchedDuty)} />
    </AbsoluteFill>
  );
};

// ── Review aids: narration strip and slates ──────────────────────────────────

export interface Line {
  atSec: number;
  text: string;
}

export const NarrationStrip: React.FC<{ lines: Line[]; endSec: number }> = ({ lines, endSec }) => {
  const frame = useCurrentFrame();
  const current = [...lines].reverse().find((l) => frame >= sec(l.atSec));
  if (!current || frame >= sec(endSec)) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        padding: "12px 80px 14px",
        backgroundColor: palette.ink,
        opacity: 0.86,
        color: palette.bone,
        fontFamily: fonts.display,
        fontSize: 24,
        lineHeight: 1.3,
        textAlign: "center",
      }}
    >
      {current.text}
    </div>
  );
};

export const Slate: React.FC<{ index: number; of?: number; title: string; today: string }> = ({
  index,
  of = 3,
  title,
  today,
}) => (
  <AbsoluteFill
    style={{
      backgroundColor: palette.paper,
      justifyContent: "center",
      paddingLeft: layout.safeAreaTier.generous.left,
      paddingRight: layout.safeAreaTier.generous.right,
    }}
  >
    <div style={{ fontFamily: fonts.metadata, fontSize: fontSizes.readable, letterSpacing: 3, color: palette.walnut }}>
      TEST REEL · {index} OF {of}
    </div>
    <div style={{ marginTop: 20, fontFamily: fonts.display, fontSize: 84, fontWeight: 600, color: palette.ink }}>
      {title}
    </div>
    <div style={{ marginTop: 20, fontFamily: fonts.display, fontSize: 34, color: palette.walnut }}>{today}</div>
  </AbsoluteFill>
);

export const SLATE_SEC = 2.4;

const SECTIONS: {
  title: string;
  today: string;
  durationSec: number;
  body: React.ReactNode;
  lines: Line[];
  linesEndSec: number;
}[] = [
  {
    title: "Framed details",
    today: "The crowd still, 20 seconds. In the episode today: one slow push.",
    durationSec: 20,
    body: <StillShots shots={FRAMED_DETAILS} />,
    lines: [
      { atSec: 0, text: "There's another complication." },
      { atSec: 1.6, text: "When a lab says a model behaves well, that's a test result." },
      { atSec: 6.4, text: "And researchers have found that AI models can distinguish test conversations from real ones better than chance." },
      { atSec: 13.2, text: "So what does a good result mean if the system can recognize the test?" },
    ],
    linesEndSec: 18.8,
  },
  {
    title: "State swap",
    today: "The street empties. In the episode today: a 10-second AI video clip.",
    durationSec: 10.2,
    body: <StillShots shots={STATE_SWAP} />,
    lines: [
      { atSec: 1.4, text: "The question is simple." },
      { atSec: 3.2, text: "Take away the watching." },
      { atSec: 5.8, text: "What happens to the behavior?" },
    ],
    linesEndSec: 7.8,
  },
  {
    title: "Four-panel build",
    today: "Duty and Prudence, watched and unwatched. In the episode today: one still in two panes.",
    durationSec: BUILD.end,
    body: <PanelBuild />,
    lines: [
      { atSec: 0, text: "Now I'll tell you why he did it." },
      { atSec: BUILD.split, text: "There are two versions." },
      { atSec: 4.8, text: "In the first, he thinks cheating a child is wrong. That's reason enough." },
      { atSec: BUILD.prudence, text: "In the second, he's careful. Children have parents. Parents talk." },
      { atSec: 15.6, text: "A reputation for honesty is worth more than a few extra coins today." },
      { atSec: BUILD.same, text: "Same bread. Same price. Same change." },
      { atSec: BUILD.quad, text: "Take away the watching.   [line borrowed from Beat 5 for this test]" },
      { atSec: 27.0, text: "What happens to the behavior?" },
    ],
    linesEndSec: 29.2,
  },
];

export const STILLS_REEL_DURATION = SECTIONS.reduce(
  (total, s) => total + sec(SLATE_SEC) + sec(s.durationSec),
  0,
);

export const StillsReel: React.FC = () => (
  <Series>
    {SECTIONS.flatMap((s, i) => [
      <Series.Sequence key={`slate-${i}`} durationInFrames={sec(SLATE_SEC)}>
        <Slate index={i + 1} title={s.title} today={s.today} />
      </Series.Sequence>,
      <Series.Sequence key={`body-${i}`} durationInFrames={sec(s.durationSec)}>
        {s.body}
        <NarrationStrip lines={s.lines} endSec={s.linesEndSec} />
      </Series.Sequence>,
    ])}
  </Series>
);
