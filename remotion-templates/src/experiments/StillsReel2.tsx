/**
 * StillsReel2 — the second test reel: seven more ways of working a generated
 * still, each cut against the narration of an ai-care-motives beat.
 *
 *   1. Build-up and marks   figures arrive one by one; code draws on their cards
 *   2. Panorama travel      one very wide still, travelled, labelled, then diagrammed
 *   3. Matched cuts         three scenes drawn to one composition; a triptych
 *   4. Layered depth        a still split into planes; a lit screen; type on the screen
 *   5. Video inside a still only the window moves; the same clip inside one panel
 *   6. Pose-to-pose         one event in four pictures
 *   7. Relight              the same frame, night to dawn
 *
 * Test only: nothing here is wired into an episode manifest. Pictures were made
 * with tools/ai-video/fal_edit.py (prompts in episodes/ai-care-motives/prompts/edit/)
 * and live in public/episodes/ai-care-motives/stills-test/. Shared pieces
 * (StillShots, Panel, the narration strip) come from StillsReel.tsx.
 */
import React from "react";
import { noise2D } from "@remotion/noise";
import {
  AbsoluteFill,
  Easing,
  Img,
  OffthreadVideo,
  Sequence,
  Series,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { fonts, fontSizes, palette, sec } from "../design/theme";
import { CLAMP, CLAMP_DECELERATE, fadeIn, slideIn } from "../utils/animation";
import {
  type Framing,
  type Line,
  type Rect,
  type Shot,
  H,
  MOVE,
  NarrationStrip,
  PANEL_ZOOM,
  Panel,
  QUAD,
  RowLabel,
  SLATE_SEC,
  Slate,
  StillShots,
  W,
  WIDE_ORIGIN,
  still,
} from "./StillsReel";

/** Pixels of the 1672-wide source stills → pixels of the frame. */
export const K = W / 1672;
export const FULL_IMG: React.CSSProperties = { position: "absolute", inset: 0, width: W, height: H, objectFit: "cover" };
export const FULL: Rect = { x: 0, y: 0, w: W, h: H };

// ── 1 · Build-up and marks on the picture ────────────────────────────────────

/** Column of the still each rater stands in (source pixels), left to right. */
export const RATER_STRIPS: [number, number][] = [
  [0, 172], [172, 321], [321, 480], [480, 621], [621, 782],
  [962, 1155], [1155, 1328], [1328, 1485], [1485, 1672],
];
/** Arrival order: outward from the figure being rated. */
const RATER_RANK = [4, 3, 2, 1, 0, 0, 1, 2, 3];
/** The blank cards, as x, y, w, h in source pixels (measured from the still). */
const CARDS: [number, number, number, number][] = [
  [48, 418, 99, 66], [202, 418, 98, 66], [355, 418, 98, 66], [508, 418, 96, 66], [653, 419, 102, 66],
  [1017, 420, 106, 66], [1191, 418, 99, 66], [1352, 418, 99, 66], [1517, 418, 100, 66],
];
/** Cut-outs were cropped from a 3344-wide copy, starting 400px down. */
export const CUTOUT_SCALE = W / 3344;

const crowdBuild = (arriveSec: number) => (frame: number) => (
  <>
    <Img src={still("crowd-alone")} style={FULL_IMG} />
    {RATER_STRIPS.map(([x0, x1], i) => {
      const at = sec(arriveSec + RATER_RANK[i] * 0.2);
      return (
        <Img
          key={i}
          src={still(`crowd-rater-${i + 1}`, "png")}
          style={{
            position: "absolute",
            left: x0 * K,
            top: 400 * CUTOUT_SCALE - 0.3,
            width: (x1 - x0) * K,
            height: 1482 * CUTOUT_SCALE,
            opacity: fadeIn(frame, at, sec(0.3)),
            transform: `translateY(${slideIn(frame, at, 18, sec(0.4))}px)`,
          }}
        />
      );
    })}
  </>
);

interface Mark {
  card: number;
  kind: "tick" | "cross";
  /** Seconds from the start of the section; omit for a mark that is already there. */
  atSec?: number;
  color?: string;
}

/** Ticks and crosses drawn on the cards, in the still's own space. */
const cardMarks = (marks: Mark[]) => (frame: number) => (
  <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
    {marks.map((m, i) => {
      const [cx, cy, cw, ch] = CARDS[m.card].map((v) => v * K);
      const p = m.atSec === undefined ? 1 : interpolate(frame, [sec(m.atSec), sec(m.atSec + 0.4)], [0, 1], CLAMP_DECELERATE);
      const at = (fx: number, fy: number) => `${cx + cw * fx} ${cy + ch * fy}`;
      const stroke = {
        fill: "none",
        stroke: m.color ?? palette.ink,
        strokeWidth: 5.5,
        strokeLinecap: "round" as const,
        strokeLinejoin: "round" as const,
        pathLength: 1,
        strokeDasharray: 1,
      };
      if (p <= 0) return null;
      if (m.kind === "tick") {
        return <path key={i} d={`M ${at(0.27, 0.52)} L ${at(0.43, 0.76)} L ${at(0.75, 0.24)}`} {...stroke} strokeDashoffset={1 - p} />;
      }
      const first = Math.min(1, p * 2);
      const second = Math.max(0, p * 2 - 1);
      return (
        <g key={i}>
          <path d={`M ${at(0.34, 0.26)} L ${at(0.66, 0.74)}`} {...stroke} strokeDashoffset={1 - first} />
          {second > 0 && <path d={`M ${at(0.66, 0.26)} L ${at(0.34, 0.74)}`} {...stroke} strokeDashoffset={1 - second} />}
        </g>
      );
    })}
  </svg>
);

/** Dim everything but a soft-edged ellipse (frame pixels, in the still's space). */
const spotlight = (hole: { cx: number; cy: number; rx: number; ry: number }, atSec: number, dim = 0.55) => (frame: number) => (
  <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
    <defs>
      <filter id="reel2-spot-blur" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="46" />
      </filter>
      <mask id="reel2-spot">
        <rect width={W} height={H} fill="white" />
        <ellipse {...hole} fill="black" filter="url(#reel2-spot-blur)" />
      </mask>
    </defs>
    <rect width={W} height={H} fill={palette.ink} opacity={dim * fadeIn(frame, sec(atSec), sec(0.8))} mask="url(#reel2-spot)" />
  </svg>
);

const CROWD = still("crowd-4k");
const CROWD_NOTICES = still("crowd-notices-4k");
const FIGURE: Framing = { cx: 0.529, cy: 0.385, zoom: 2.6 };
const PICKS: Mark[] = [
  { card: 0, kind: "tick", atSec: 4.3 },
  { card: 1, kind: "cross", atSec: 5.2 },
  { card: 2, kind: "tick", atSec: 6.1 },
  { card: 3, kind: "tick", atSec: 7.0 },
  { card: 4, kind: "cross", atSec: 7.9 },
];
const pairSpot = spotlight({ cx: 981 * K, cy: 420 * K, rx: 215 * K, ry: 330 * K }, 10.8);
const pairMarks = cardMarks([
  { card: 4, kind: "cross" },
  { card: 5, kind: "tick", atSec: 12.6, color: palette.goldText },
]);

const BUILD_UP: Shot[] = [
  // "So who shapes the assistant's behavior?" Alone against the wall.
  { startSec: 0, endSec: 2.4, from: { cx: 0.529, cy: 0.6, zoom: 1.5 }, to: { cx: 0.529, cy: 0.6, zoom: 1.58 }, states: [{ render: crowdBuild(2.4) }] },
  // "Start with its training." The raters arrive, outward from the figure.
  { startSec: 2.4, endSec: 4, from: { cx: 0.5, cy: 0.5, zoom: 1.06 }, to: { cx: 0.5, cy: 0.5, zoom: 1 }, states: [{ render: crowdBuild(2.4) }] },
  // "People compare its answers and pick the better ones…" Marks land on the cards.
  { startSec: 4, endSec: 10, from: { cx: 0.22, cy: 0.41, zoom: 2.3 }, to: { cx: 0.4, cy: 0.41, zoom: 2.3 }, ease: "glide", states: [{ src: CROWD }], overlay: cardMarks(PICKS) },
  // "The catch: … answers matching what the user already believed…" The pair, lit.
  {
    startSec: 10,
    endSec: 19,
    from: FIGURE,
    to: { ...FIGURE, zoom: 2.75 },
    states: [{ src: CROWD_NOTICES }],
    overlay: (frame) => (
      <>
        {pairSpot(frame)}
        {pairMarks(frame)}
      </>
    ),
  },
];

// ── 2 · Panorama travel with labels ──────────────────────────────────────────

export const PANO_ASPECT = 8256 / 2048;
/** Zoom 1 fits the strip's height to the frame; this fits its whole width. */
const PANO_WHOLE = W / H / PANO_ASPECT;

/** Accelerate, hold a steady speed, decelerate: a travel, not a swing. */
const travelEase = (u: number, ramp = 0.15): number => {
  if (u <= 0) return 0;
  if (u >= 1) return 1;
  const k = 1 / (2 * ramp * (1 - ramp));
  if (u < ramp) return k * u * u;
  if (u > 1 - ramp) return 1 - k * (1 - u) * (1 - u);
  return (u - ramp / 2) / (1 - ramp);
};

interface PanoKey extends Framing {
  atSec: number;
  ease?: (u: number) => number;
}
const inOut = Easing.inOut(Easing.cubic);
const PANO_KEYS: PanoKey[] = [
  { atSec: 0, cx: 0.152, cy: 0.56, zoom: 1.4 }, // the bakery
  { atSec: 4, cx: 0.152, cy: 0.56, zoom: 1.45 },
  { atSec: 5.6, cx: 0.245, cy: 0.5, zoom: 0.9, ease: inOut }, // "Picture the street:"
  { atSec: 10.6, cx: 0.755, cy: 0.5, zoom: 0.9, ease: travelEase }, // travel
  { atSec: 11.8, cx: 0.755, cy: 0.5, zoom: 0.9 },
  { atSec: 14, cx: 0.5, cy: 0.5, zoom: PANO_WHOLE, ease: inOut }, // the whole street
];

const panoCamera = (frame: number): Framing => {
  const t = frame / 30;
  const next = PANO_KEYS.findIndex((k) => k.atSec > t);
  if (next === 0) return PANO_KEYS[0];
  if (next === -1) return PANO_KEYS[PANO_KEYS.length - 1];
  const a = PANO_KEYS[next - 1];
  const b = PANO_KEYS[next];
  const u = (b.ease ?? ((v: number) => v))((t - a.atSec) / (b.atSec - a.atSec));
  return { cx: a.cx + (b.cx - a.cx) * u, cy: a.cy + (b.cy - a.cy) * u, zoom: a.zoom + (b.zoom - a.zoom) * u };
};

const PANO_LABELS = [
  { u: 0.345, v: 0.44, text: "Other customers", atSec: 6.8 },
  { u: 0.652, v: 0.46, text: "Neighbors", atSec: 8.4 },
  { u: 0.905, v: 0.41, text: "A competitor", atSec: 10 },
];
const PANO_HUB = { u: 0.133, v: 0.4 };
const LINKS_AT = 13.6;

const PanoTravel: React.FC = () => {
  const frame = useCurrentFrame();
  const cam = panoCamera(frame);
  const dispH = H * cam.zoom;
  const dispW = dispH * PANO_ASPECT;
  const left = dispW >= W ? Math.min(0, Math.max(W - dispW, W / 2 - cam.cx * dispW)) : (W - dispW) / 2;
  const top = dispH >= H ? Math.min(0, Math.max(H - dispH, H / 2 - cam.cy * dispH)) : (H - dispH) / 2;
  const project = (u: number, v: number) => ({ x: left + u * dispW, y: top + v * dispH });
  const hub = project(PANO_HUB.u, PANO_HUB.v);

  return (
    <AbsoluteFill style={{ backgroundColor: palette.ink, overflow: "hidden" }}>
      <Img
        src={still("street-pano")}
        style={{ position: "absolute", left: 0, top: 0, width: dispW, height: dispH, transform: `translate(${left}px, ${top}px)` }}
      />
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        {PANO_LABELS.map((l, i) => {
          const end = project(l.u, l.v);
          const at = sec(LINKS_AT + i * 0.45);
          const p = interpolate(frame, [at, at + sec(0.9)], [0, 1], CLAMP_DECELERATE);
          if (p <= 0) return null;
          // Elbow connector: up out of the picture, along the dark band, down onto the label.
          const rail = top - 44 - i * 30;
          const d = `M ${hub.x} ${hub.y - 8} L ${hub.x} ${rail} L ${end.x} ${rail} L ${end.x} ${end.y - 88}`;
          return (
            <path key={i} d={d} fill="none" stroke={palette.bone} strokeWidth={3} strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} />
          );
        })}
        <circle cx={hub.x} cy={hub.y - 8} r={7} fill={palette.gold} opacity={fadeIn(frame, sec(LINKS_AT - 0.3), sec(0.4))} />
      </svg>
      {PANO_LABELS.map((l, i) => {
        const p = project(l.u, l.v);
        const opacity = fadeIn(frame, sec(l.atSec), sec(0.45));
        return (
          <div key={i} style={{ position: "absolute", left: p.x, top: p.y, opacity, transform: `translateY(${slideIn(frame, sec(l.atSec), 10, sec(0.45))}px)` }}>
            <div style={{ position: "absolute", left: -1, top: -34, width: 2, height: 26, backgroundColor: palette.bone }} />
            <div
              style={{
                position: "absolute",
                bottom: 34,
                left: 0,
                transform: "translateX(-50%)",
                whiteSpace: "nowrap",
                padding: "8px 16px",
                backgroundColor: palette.ink,
                color: palette.bone,
                fontFamily: fonts.metadata,
                fontSize: fontSizes.readable,
                letterSpacing: 2.5,
                textTransform: "uppercase",
              }}
            >
              {l.text}
            </div>
          </div>
        );
      })}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 850,
          textAlign: "center",
          color: palette.bone,
          fontFamily: fonts.display,
          fontSize: 56,
          fontWeight: 500,
          opacity: fadeIn(frame, sec(15.8), sec(0.7)),
          transform: `translateY(${slideIn(frame, sec(15.8), 12, sec(0.7))}px)`,
        }}
      >
        A fact about his street
      </div>
    </AbsoluteFill>
  );
};

// ── 3 · Matched cuts and a triptych ──────────────────────────────────────────

const TRI_W = 592;
const TRI_H = 455;
export const TRI = (i: number): Rect => ({ x: 56 + i * (TRI_W + 16), y: (H - TRI_H) / 2 - 10, w: TRI_W, h: TRI_H });
export const MATCH = {
  model: 4.4, // "Now return to the machine."
  tri: 7.4, // "That's why one test isn't enough."
  unwatched: 19.4, // "…when it thinks no one is checking."
  end: 23,
};

/** A part of a 16:9 picture, as fractions of its width and height. */
interface Region {
  x: number;
  y: number;
  w: number;
}

/** One picture cropped to a region, with a second registered state over it. */
const Crop: React.FC<{ rect: Rect; region: Region; src: string; over?: { src: string; opacity: number } }> = ({ rect, region, src, over }) => {
  const width = rect.w / region.w;
  const height = (width * 9) / 16;
  const img: React.CSSProperties = { position: "absolute", left: -region.x * width, top: -region.y * height, width, height, maxWidth: "none" };
  return (
    <>
      <Img src={src} style={img} />
      {over && <Img src={over.src} style={{ ...img, opacity: over.opacity }} />}
    </>
  );
};

/** Three columns, two rows: who is watching, above who is watched. */
const CASE_W = 592;
const CASE_H = 462;
const CASE_RECT = (col: number, row: 0 | 1): Rect => ({ x: 56 + col * (CASE_W + 16), y: 70 + row * (CASE_H + 16), w: CASE_W, h: CASE_H });
const CASES = [
  { label: "Shopkeeper", picture: "shop", watchers: { x: 0.02, y: 0.12, w: 0.36 }, subject: { x: 0.5, y: 0.07, w: 0.36 } },
  { label: "Car", picture: "car", watchers: { x: 0, y: 0.14, w: 0.36 }, subject: { x: 0.4, y: 0.22, w: 0.52 } },
  { label: "Model", picture: "model", watchers: { x: 0, y: 0.14, w: 0.36 }, subject: { x: 0.4, y: 0.02, w: 0.44 } },
];

export const MatchAndTriptych: React.FC = () => {
  const frame = useCurrentFrame();
  const onModel = frame >= sec(MATCH.model);
  const inGrid = frame >= sec(MATCH.tri);
  const gone = (i: number) => interpolate(frame, [sec(MATCH.unwatched + i * 0.4), sec(MATCH.unwatched + i * 0.4 + 0.4)], [0, 1], CLAMP);
  const push = (fromSec: number, toSec: number) => 1 + 0.05 * interpolate(frame, [sec(fromSec), sec(toSec)], [0, 1], MOVE);
  const cell = (rect: Rect, atSec: number, children: React.ReactNode) => (
    <div
      style={{
        position: "absolute",
        left: rect.x,
        top: rect.y + slideIn(frame, sec(atSec), 14, sec(0.5)),
        width: rect.w,
        height: rect.h,
        overflow: "hidden",
        opacity: fadeIn(frame, sec(atSec), sec(0.5)),
        boxShadow: `0 0 0 1px ${palette.walnut}`,
      }}
    >
      {children}
    </div>
  );

  return (
    <AbsoluteFill style={{ backgroundColor: palette.ink }}>
      {/* The matched cut: car, then the model on the car's frame. */}
      {!inGrid && !onModel && <Panel rect={FULL} states={[{ src: still("car-watched-hd"), opacity: 1 }]} zoom={push(0, MATCH.model)} />}
      {!inGrid && onModel && <Panel rect={FULL} states={[{ src: still("model-watched-hd"), opacity: 1 }]} zoom={push(MATCH.model, MATCH.tri)} />}
      {/* Then all three cases, each as two details: the watchers above, the one watched below. */}
      {inGrid &&
        CASES.map((c, i) => {
          const atSec = MATCH.tri + 0.1 + i * 0.35;
          return (
            <React.Fragment key={c.label}>
              {cell(CASE_RECT(i, 1), atSec, (
                <>
                  <Crop rect={CASE_RECT(i, 1)} region={c.subject} src={still(`${c.picture}-watched-hd`)} />
                  <div style={{ position: "absolute", top: 20, left: 20, padding: "8px 16px", backgroundColor: palette.ink, color: palette.bone, fontFamily: fonts.metadata, fontSize: fontSizes.readable, letterSpacing: 3, textTransform: "uppercase" }}>
                    {c.label}
                  </div>
                </>
              ))}
              {cell(CASE_RECT(i, 0), atSec + 0.3, (
                <Crop rect={CASE_RECT(i, 0)} region={c.watchers} src={still(`${c.picture}-watched-hd`)} over={{ src: still(`${c.picture}-unwatched-hd`), opacity: gone(i) }} />
              ))}
            </React.Fragment>
          );
        })}
    </AbsoluteFill>
  );
};

// ── 4 · Layered depth, a lit screen, type on the screen ──────────────────────

/** Where the typing hands meet the keyboard: both planes scale about this point. */
export const CONTACT = { x: 1200, y: 640 };
/** Corners of the laptop screen in frame pixels: TL, TR, BR, BL. */
const SCREEN: [number, number][] = [
  [903 * K, 363 * K], [1249 * K, 380 * K], [1216 * K, 598 * K], [862 * K, 576 * K],
];
const SCREEN_BOX = { w: 400, h: 250 };

/** CSS matrix3d that maps a w×h box onto four corners (TL, TR, BR, BL). */
const quadMatrix = (w: number, h: number, q: [number, number][]): string => {
  const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = q;
  const dx1 = x1 - x2;
  const dx2 = x3 - x2;
  const sx = x0 - x1 + x2 - x3;
  const dy1 = y1 - y2;
  const dy2 = y3 - y2;
  const sy = y0 - y1 + y2 - y3;
  const den = dx1 * dy2 - dx2 * dy1;
  const g = (sx * dy2 - dx2 * sy) / den;
  const k = (dx1 * sy - sx * dy1) / den;
  const a = x1 - x0 + g * x1;
  const b = x3 - x0 + k * x3;
  const d = y1 - y0 + g * y1;
  const e = y3 - y0 + k * y3;
  return `matrix3d(${a / w}, ${d / w}, 0, ${g / w}, ${b / h}, ${e / h}, 0, ${k / h}, 0, 0, 1, 0, ${x0}, ${y0}, 0, 1)`;
};

/** "The startup. The essay. The plan you haven't told anyone yet." */
const TYPED = [
  { atSec: 3.6, y: 58, w: 250 },
  { atSec: 4.6, y: 110, w: 190 },
  { atSec: 5.6, y: 162, w: 320 },
];
const DEPTH_SEC = 9.1;

const DeskDepth: React.FC = () => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [0, sec(DEPTH_SEC)], [0, 1], MOVE);
  const origin = `${CONTACT.x}px ${CONTACT.y}px`;
  const flicker = noise2D("screen", frame / 9, 0) * 0.5 + 0.5;
  const screenClip = `polygon(${SCREEN.map(([x, y]) => `${x}px ${y}px`).join(", ")})`;

  return (
    <AbsoluteFill style={{ backgroundColor: palette.ink, overflow: "hidden" }}>
      {/* Far plane: the room, the desk, the laptop. */}
      <div style={{ position: "absolute", inset: 0, transformOrigin: origin, transform: `scale(${1.02 + 0.02 * p})` }}>
        <Img src={still("desk-plate")} style={FULL_IMG} />
        {/* The screen's light, breathing a little. */}
        <div style={{ position: "absolute", inset: 0, filter: "blur(60px)", mixBlendMode: "screen", opacity: 0.2 + 0.14 * flicker }}>
          <div style={{ position: "absolute", inset: 0, clipPath: screenClip, backgroundColor: palette.bone }} />
        </div>
        {/* Lines of "typing", set in the plane of the screen. */}
        <div style={{ position: "absolute", left: 0, top: 0, ...SCREEN_BOX, transformOrigin: "0 0", transform: quadMatrix(SCREEN_BOX.w, SCREEN_BOX.h, SCREEN) }}>
          {TYPED.map((line, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: 40,
                top: line.y,
                height: 16,
                width: line.w * interpolate(frame, [sec(line.atSec), sec(line.atSec + 0.7)], [0, 1], CLAMP),
                backgroundColor: palette.walnut,
                opacity: 0.75,
              }}
            />
          ))}
        </div>
      </div>
      {/* Near plane: the figure and the chair, cut out by the layer split. */}
      <div style={{ position: "absolute", inset: 0, transformOrigin: origin, transform: `scale(${1.02 + 0.075 * p})` }}>
        <Img src={still("desk-figure", "png")} style={FULL_IMG} />
      </div>
    </AbsoluteFill>
  );
};

// ── 5 · Video inside a still, and inside one panel ───────────────────────────

const STREET_CLIP = staticFile("episodes/ai-care-motives/clips/aigen-03-unwatched.mp4");
/** The window opening, in frame pixels: only this part of the clip is used. */
const WINDOW_CLIP = `polygon(0px 0px, ${530 * K}px 0px, ${530 * K}px ${470 * K}px, 0px ${553 * K}px)`;

/**
 * The still, sharp, with the clip showing through the window only. The clip is
 * a 1.3% enlargement of the still about the centre (measured), so it is scaled
 * back to sit on the same pixels.
 */
const ShopLive: React.FC<{ picture: string; clipFromSec?: number }> = ({ picture, clipFromSec = 0 }) => (
  <>
    <Img src={still(picture)} style={FULL_IMG} />
    <div style={{ position: "absolute", inset: 0, clipPath: WINDOW_CLIP }}>
      <Sequence from={sec(clipFromSec)} layout="none">
        <OffthreadVideo
          src={STREET_CLIP}
          muted
          style={{ position: "absolute", left: 0, top: 0, width: W, height: H, transformOrigin: "960px 540px", transform: "translateY(-1px) scale(0.987)" }}
        />
      </Sequence>
    </div>
  </>
);

const LIVE_STILL: Shot[] = [
  {
    startSec: 0,
    endSec: 10.2,
    from: { cx: 0.5, cy: 0.5, zoom: 1 },
    to: { cx: 0.41, cy: 0.47, zoom: 1.22 },
    ease: "glide",
    states: [{ render: () => <ShopLive picture="shop-watched-uhd" /> }],
  },
];

const LIVE_PANEL_SEC = 8;
const QuadLive: React.FC = () => {
  const frame = useCurrentFrame();
  const origin = `${WIDE_ORIGIN.x}% ${WIDE_ORIGIN.y}%`;
  const fixed = { zoom: PANEL_ZOOM, origin };
  return (
    <AbsoluteFill style={{ backgroundColor: palette.ink }}>
      <Panel rect={QUAD(0, 0)} states={[{ src: still("shop-ownwork-hd"), opacity: 1 }]} badge={{ label: "Duty", opacity: 1 }} {...fixed} />
      <Panel rect={QUAD(1, 0)} states={[{ src: still("shop-watched-hd"), opacity: 1 }]} badge={{ label: "Prudence", opacity: 1 }} {...fixed} />
      <Panel rect={QUAD(0, 1)} states={[{ src: still("shop-ownwork-unwatched-hd"), opacity: 1 }]} {...fixed} />
      {/* The one panel that moves: the street empties while the others hold. */}
      <Panel
        rect={QUAD(1, 1)}
        states={[]}
        content={<ShopLive picture="shop-watched-hd" clipFromSec={1.2} />}
        accent={fadeIn(frame, sec(1.2), sec(0.6))}
        {...fixed}
      />
      <RowLabel row={0} label="Watched" opacity={1} />
      <RowLabel row={1} label="Unwatched" opacity={1} />
    </AbsoluteFill>
  );
};

// ── 6 · Pose-to-pose ─────────────────────────────────────────────────────────

export const RESCUE: Shot[] = [
  // "Now you're the one in the water."
  { startSec: 0, endSec: 2.8, from: { cx: 0.62, cy: 0.62, zoom: 1.5 }, to: { cx: 0.61, cy: 0.61, zoom: 1.62 }, states: [{ src: still("river-alone-uhd") }] },
  // "A stranger pulls you out of the river." The grasp, then the pull: same frame.
  {
    startSec: 2.8,
    endSec: 6,
    from: { cx: 0.5, cy: 0.5, zoom: 1 },
    to: { cx: 0.5, cy: 0.52, zoom: 1.08 },
    states: [{ src: still("river-grasp-uhd") }, { src: still("river-pulled-uhd"), atSec: 1.7 }],
  },
  // "Later you find out he jumped in hoping for a reward." He is already leaving.
  { startSec: 6, endSec: 12, from: { cx: 0.55, cy: 0.5, zoom: 1 }, to: { cx: 0.42, cy: 0.42, zoom: 1.35 }, ease: "glide", states: [{ src: still("river-bank-uhd") }] },
];

// ── 7 · Relight ──────────────────────────────────────────────────────────────

const RELIGHT: Shot[] = [
  {
    startSec: 0,
    endSec: 9,
    from: { cx: 0.5, cy: 0.5, zoom: 1.12 },
    to: { cx: 0.5, cy: 0.5, zoom: 1 },
    ease: "glide",
    states: [{ src: still("desk-night-uhd") }, { src: still("desk-dawn-uhd"), atSec: 2.2, softSec: 2.6 }],
  },
];

// ── The reel ─────────────────────────────────────────────────────────────────

interface Part {
  durationSec: number;
  body: React.ReactNode;
  lines: Line[];
  linesEndSec: number;
}

const SECTIONS: { title: string; today: string; parts: Part[] }[] = [
  {
    title: "Build-up and marks",
    today: "The crowd still, 19 seconds. Figures arrive; code draws on their cards. In the episode today: one slow push.",
    parts: [
      {
        durationSec: 19,
        body: <StillShots shots={BUILD_UP} />,
        lines: [
          { atSec: 0, text: "So who shapes the assistant's behavior?" },
          { atSec: 2.4, text: "Start with its training." },
          { atSec: 4, text: "People compare its answers and pick the better ones, and those judgments shape further training." },
          { atSec: 10, text: "The catch: researchers found that answers matching what the user already believed were more likely to be picked." },
        ],
        linesEndSec: 17.4,
      },
    ],
  },
  {
    title: "Panorama travel",
    today: "The street, 20 seconds: one very wide picture, travelled and labelled. In the episode today: a diagram on paper.",
    parts: [
      {
        durationSec: 20,
        body: <PanoTravel />,
        lines: [
          { atSec: 0, text: "Why does Kant's dealer charge everyone the same?" },
          { atSec: 3.2, text: "Kant's word for him is prudent." },
          { atSec: 5.6, text: "Picture the street: other customers compare notes." },
          { atSec: 8.4, text: "Neighbors talk. A competitor would love the story." },
          { atSec: 11.8, text: "His honesty was never only a fact about his heart." },
          { atSec: 15.8, text: "It was a fact about his street." },
        ],
        linesEndSec: 18.6,
      },
    ],
  },
  {
    title: "Matched cuts and a triptych",
    today: "Car, model and shopkeeper drawn to one composition. In the episode today: stock footage and unrelated stills.",
    parts: [
      {
        durationSec: MATCH.end,
        body: <MatchAndTriptych />,
        lines: [
          { atSec: 0, text: "The lab result had concealed a difference that road testing exposed." },
          { atSec: MATCH.model, text: "Now return to the machine." },
          { atSec: MATCH.tri, text: "That's why one test isn't enough.   [line borrowed from later in the beat]" },
          { atSec: 9.8, text: "A reassuring answer, a plausible explanation and a good test score each give us something to examine." },
          { atSec: 16.6, text: "None shows what the system does when it thinks no one is checking." },
        ],
        linesEndSec: 21.8,
      },
    ],
  },
  {
    title: "Layered depth",
    today: "The opening shot, 9 seconds: the still split into planes, the screen lit, lines typed on it. In the episode today: one slow push.",
    parts: [
      {
        durationSec: DEPTH_SEC,
        body: <DeskDepth />,
        lines: [
          { atSec: 0.3, text: "You've probably asked an AI whether your idea is good." },
          { atSec: 3.6, text: "The startup. The essay. The plan you haven't told anyone yet." },
        ],
        linesEndSec: 8.4,
      },
    ],
  },
  {
    title: "Video inside a still",
    today: "Only the window moves; then the same clip inside one panel. In the episode today: the clip fills the frame.",
    parts: [
      {
        durationSec: 10.2,
        body: <StillShots shots={LIVE_STILL} />,
        lines: [
          { atSec: 1.4, text: "The question is simple." },
          { atSec: 3.2, text: "Take away the watching." },
          { atSec: 5.8, text: "What happens to the behavior?" },
        ],
        linesEndSec: 7.8,
      },
      {
        durationSec: LIVE_PANEL_SEC,
        body: <QuadLive />,
        lines: [
          { atSec: 1.2, text: "Take away the watching." },
          { atSec: 3.6, text: "What happens to the behavior?" },
        ],
        linesEndSec: 6,
      },
    ],
  },
  {
    title: "Pose-to-pose",
    today: "The rescue in four pictures, 12 seconds. In the episode today: one still.",
    parts: [
      {
        durationSec: 12,
        body: <StillShots shots={RESCUE} />,
        lines: [
          { atSec: 0, text: "Now you're the one in the water." },
          { atSec: 2.8, text: "A stranger pulls you out of the river." },
          { atSec: 6, text: "Later you find out he jumped in hoping for a reward." },
        ],
        linesEndSec: 10.4,
      },
    ],
  },
  {
    title: "Relight",
    today: "The same frame, night to dawn. In the episode today: two separate stills, minutes apart.",
    parts: [
      {
        durationSec: 9,
        body: <StillShots shots={RELIGHT} />,
        lines: [{ atSec: 0.6, text: "So when it tells you your idea is good, ask what supports that judgment beyond how reassuring it sounds." }],
        linesEndSec: 8,
      },
    ],
  },
];

export const STILLS_REEL_2_DURATION = SECTIONS.reduce(
  (total, s) => total + sec(SLATE_SEC) + s.parts.reduce((t, p) => t + sec(p.durationSec), 0),
  0,
);

export const StillsReel2: React.FC = () => (
  <Series>
    {SECTIONS.flatMap((s, i) => [
      <Series.Sequence key={`slate-${i}`} durationInFrames={sec(SLATE_SEC)}>
        <Slate index={i + 1} of={SECTIONS.length} title={s.title} today={s.today} />
      </Series.Sequence>,
      ...s.parts.map((part, j) => (
        <Series.Sequence key={`body-${i}-${j}`} durationInFrames={sec(part.durationSec)}>
          {part.body}
          <NarrationStrip lines={part.lines} endSec={part.linesEndSec} />
        </Series.Sequence>
      )),
    ])}
  </Series>
);
