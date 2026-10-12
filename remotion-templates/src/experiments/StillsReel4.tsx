/**
 * StillsReel4 — the fourth test reel. The first three kept one camera angle per
 * scene and pictures that show what the narration says. This one tries the
 * kinds that were missing:
 *
 *   Coverage           a reverse angle and an insert; a plan view with sightlines
 *   Picture as metaphor a shadow that does something else; giant watchers; an
 *                       x-ray; sketch to colour; double exposure; onion skin
 *   One sheet           a six-panel storyboard from a single generation
 *   Nested worlds       into the laptop screen and out in the shop
 *   Handmade motion     card flip; stepped time; scribbles; paper theatre;
 *                       picture through type; multiply; passing light; light-lapse
 *   Other machines      three video models on one shot; a morph with no video
 *                       model; stock footage restyled; a figure animated on green
 *
 * Test only: nothing here is wired into an episode manifest. Pictures and clips:
 * tools/ai-video/fal_edit.py and fal_i2v.py; prompts under
 * episodes/ai-care-motives/prompts/ (files starting r4-).
 */
import React from "react";
import { noise2D } from "@remotion/noise";
import {
  AbsoluteFill,
  Easing,
  Freeze,
  Img,
  Loop,
  OffthreadVideo,
  Sequence,
  Series,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { fonts, fontSizes, palette, sec } from "../design/theme";
import { CLAMP, CLAMP_DECELERATE, fadeIn, slideIn } from "../utils/animation";
import { type Line, type Shot, H, MOVE, NarrationStrip, Slate, StillShots, W, still } from "./StillsReel";
import { CONTACT, CUTOUT_SCALE, FULL_IMG, K, PANO_ASPECT, RATER_STRIPS } from "./StillsReel2";

type Ease = Parameters<typeof interpolate>[3];
const IN_OUT = { ...CLAMP, easing: Easing.inOut(Easing.cubic) };
const at = (frame: number, fromSec: number, toSec: number, ease: Ease = CLAMP_DECELERATE) =>
  interpolate(frame, [sec(fromSec), sec(toSec)], [0, 1], ease);
const clip = (name: string, ext = "mp4") => staticFile(`episodes/ai-care-motives/stills-test/${name}.${ext}`);
const INK_FILL: React.CSSProperties = { backgroundColor: palette.ink, overflow: "hidden" };

// ── Coverage ─────────────────────────────────────────────────────────────────

const COVERAGE: Shot[] = [
  // "Do you think less of him in the second version?"
  { startSec: 0, endSec: 3.2, from: { cx: 0.6, cy: 0.42, zoom: 1.25 }, to: { cx: 0.62, cy: 0.4, zoom: 1.32 }, states: [{ src: still("shop-watched-uhd") }] },
  // "Notice whether you do." The reverse angle: we are the ones looking in.
  { startSec: 3.2, endSec: 6.4, from: { cx: 0.5, cy: 0.5, zoom: 1 }, to: { cx: 0.5, cy: 0.47, zoom: 1.08 }, states: [{ src: still("r4-reverse") }] },
  // "The child was treated no worse." An insert no crop of the wide could give.
  { startSec: 6.4, endSec: 9.2, from: { cx: 0.5, cy: 0.5, zoom: 1 }, to: { cx: 0.47, cy: 0.5, zoom: 1.08 }, states: [{ src: still("r4-coin") }] },
  // "But something you admired just turned into arithmetic."
  { startSec: 9.2, endSec: 12.5, from: { cx: 0.68, cy: 0.33, zoom: 1.7 }, to: { cx: 0.68, cy: 0.33, zoom: 1.82 }, states: [{ src: still("shop-watched-uhd") }] },
];

/** Heads in the plan view, in frame pixels: three passers-by and the shopkeeper. */
const WATCHERS: [number, number][] = [[396, 176], [220, 456], [410, 756]];
const WATCHED: [number, number] = [1366, 390];

const sightlines = (frame: number) => (
  <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
    {WATCHERS.map(([ax, ay], i) => {
      const grow = at(frame, 2 + i * 0.5, 2.9 + i * 0.5);
      const gone = at(frame, 6.2, 7, CLAMP);
      if (grow <= 0) return null;
      const dx = (WATCHED[0] - ax) * grow;
      const dy = (WATCHED[1] - ay) * grow;
      const spread = 0.1; // half-angle of each cone, radians
      const edge = (a: number) => `${ax + dx * Math.cos(a) - dy * Math.sin(a)} ${ay + dx * Math.sin(a) + dy * Math.cos(a)}`;
      return (
        <g key={i} opacity={1 - gone}>
          <path d={`M ${ax} ${ay} L ${edge(-spread)} L ${edge(spread)} Z`} fill={palette.gold} opacity={0.22} />
          <line x1={ax} y1={ay} x2={ax + dx} y2={ay + dy} stroke={palette.bone} strokeWidth={3} strokeDasharray="14 10" />
        </g>
      );
    })}
  </svg>
);

const PLAN: Shot[] = [
  { startSec: 0, endSec: 9, from: { cx: 0.5, cy: 0.5, zoom: 1 }, to: { cx: 0.5, cy: 0.5, zoom: 1.04 }, states: [{ src: still("r4-plan") }], overlay: sightlines },
];

// ── Picture as metaphor ──────────────────────────────────────────────────────

const SHADOW: Shot[] = [
  { startSec: 0, endSec: 6.5, from: { cx: 0.5, cy: 0.5, zoom: 1 }, to: { cx: 0.5, cy: 0.38, zoom: 1.42 }, ease: "glide", states: [{ src: still("shop-watched-uhd") }, { src: still("r4-shadow"), atSec: 2.6, softSec: 0.9 }] },
];

const GIANTS: Shot[] = [
  { startSec: 0, endSec: 7.5, from: { cx: 0.5, cy: 0.5, zoom: 1 }, to: { cx: 0.4, cy: 0.45, zoom: 1.25 }, ease: "glide", states: [{ src: still("shop-watched-uhd") }, { src: still("r4-giants"), atSec: 3, softSec: 0.7 }] },
];

/** Left of the scan line the car is seen through; the line crosses the car. */
const scanX = (frame: number) => 0.36 + 0.62 * at(frame, 2, 4.8, IN_OUT);
const XRAY: Shot[] = [
  {
    startSec: 0,
    endSec: 7.5,
    from: { cx: 0.56, cy: 0.55, zoom: 1.12 },
    to: { cx: 0.6, cy: 0.56, zoom: 1.22 },
    states: [
      { src: still("r4-car") },
      { render: (frame) => <Img src={still("r4-xray")} style={{ ...FULL_IMG, clipPath: `inset(0 ${(1 - scanX(frame)) * 100}% 0 0)` }} /> },
    ],
    overlay: (frame) => (
      <div style={{ position: "absolute", left: scanX(frame) * W - 1.5, top: 0, width: 3, height: H, backgroundColor: palette.gold, opacity: at(frame, 1.8, 2.1, CLAMP) * (1 - at(frame, 4.8, 5.2, CLAMP)) }} />
    ),
  },
];

const SKETCH: Shot[] = [
  {
    startSec: 0,
    endSec: 6.5,
    from: { cx: 0.5, cy: 0.5, zoom: 1.02 },
    to: { cx: 0.5, cy: 0.5, zoom: 1.08 },
    states: [
      { src: still("r4-lineart") },
      {
        // Colour arrives behind a soft diagonal edge.
        render: (frame) => {
          const edge = -20 + 140 * at(frame, 1.4, 4.4, IN_OUT);
          const mask = `linear-gradient(105deg, black ${edge - 14}%, transparent ${edge}%)`;
          return <Img src={still("shop-watched-uhd")} style={{ ...FULL_IMG, WebkitMaskImage: mask, maskImage: mask }} />;
        },
      },
    ],
  },
];

const DOUBLE: Shot[] = [
  {
    startSec: 0,
    endSec: 6.5,
    from: { cx: 0.68, cy: 0.33, zoom: 1.6 },
    to: { cx: 0.68, cy: 0.33, zoom: 1.72 },
    states: [
      { src: still("shop-ownwork-uhd") },
      // Both versions of him at once, then one of them wins.
      { render: (frame) => <Img src={still("shop-watched-uhd")} style={{ ...FULL_IMG, opacity: 0.5 * at(frame, 1.2, 2.2) + 0.5 * at(frame, 4.4, 5.4) }} /> },
    ],
  },
];

const ONION: Shot[] = [
  {
    startSec: 0,
    endSec: 7.5,
    from: { cx: 0.5, cy: 0.5, zoom: 1 },
    to: { cx: 0.5, cy: 0.52, zoom: 1.06 },
    states: [
      {
        // Each pose stays behind as a ghost when the next arrives.
        render: (frame) => {
          const grasp = frame >= sec(2) ? 1 : 0;
          const pulled = frame >= sec(4) ? 1 : 0;
          return (
            <>
              <Img src={still("river-alone-uhd")} style={FULL_IMG} />
              <Img src={still("river-grasp-uhd")} style={{ ...FULL_IMG, opacity: grasp }} />
              <Img src={still("river-pulled-uhd")} style={{ ...FULL_IMG, opacity: pulled }} />
              <Img src={still("river-alone-uhd")} style={{ ...FULL_IMG, opacity: grasp * (pulled ? 0.22 : 0.38) }} />
              <Img src={still("river-grasp-uhd")} style={{ ...FULL_IMG, opacity: pulled * 0.4 }} />
            </>
          );
        },
      },
    ],
  },
];

// ── One sheet, six shots ─────────────────────────────────────────────────────

const SHEET_PAPER = "#F9EDDD"; // sampled from the generated sheet
const PANEL_ASPECT = 1648 / 1328;
/** When each panel takes the frame, in seconds. */
const PANEL_AT = [2.4, 4.4, 5.6, 6.8, 8.8, 14.8];
const SHEET_SEC = 17.5;

const Storyboard: React.FC = () => {
  const frame = useCurrentFrame();
  const current = PANEL_AT.filter((t) => frame >= sec(t)).length; // 0 = the whole sheet
  if (current === 0) {
    return (
      <AbsoluteFill style={{ backgroundColor: SHEET_PAPER, overflow: "hidden" }}>
        <Img src={still("r4-gyges-sheet")} style={{ ...FULL_IMG, objectFit: "contain", transform: `scale(${1 + 0.03 * at(frame, 0, PANEL_AT[0], CLAMP)})` }} />
      </AbsoluteFill>
    );
  }
  const from = PANEL_AT[current - 1];
  const to = PANEL_AT[current] ?? SHEET_SEC;
  const width = H * PANEL_ASPECT;
  return (
    <AbsoluteFill style={INK_FILL}>
      <Img
        src={still(`r4-gyges-${current}`)}
        style={{ position: "absolute", left: (W - width) / 2, top: 0, width, height: H, transform: `scale(${1 + 0.05 * interpolate(frame, [sec(from), sec(to)], [0, 1], MOVE)})` }}
      />
    </AbsoluteFill>
  );
};

// ── Nested worlds: into the screen ───────────────────────────────────────────

export type Pt = [number, number];
type M3 = [number, number, number, number, number, number, number, number, number];

/** The projective map taking the unit square onto a quad (TL, TR, BR, BL). */
const squareToQuad = ([[x0, y0], [x1, y1], [x2, y2], [x3, y3]]: Pt[]): M3 => {
  const dx1 = x1 - x2;
  const dx2 = x3 - x2;
  const sx = x0 - x1 + x2 - x3;
  const dy1 = y1 - y2;
  const dy2 = y3 - y2;
  const sy = y0 - y1 + y2 - y3;
  const den = dx1 * dy2 - dx2 * dy1;
  const g = (sx * dy2 - dx2 * sy) / den;
  const h = (dx1 * sy - sx * dy1) / den;
  return [x1 - x0 + g * x1, x3 - x0 + h * x3, x0, y1 - y0 + g * y1, y3 - y0 + h * y3, y0, g, h, 1];
};
const mul3 = (a: M3, b: M3): M3 =>
  [0, 1, 2].flatMap((r) => [0, 1, 2].map((c) => a[r * 3] * b[c] + a[r * 3 + 1] * b[3 + c] + a[r * 3 + 2] * b[6 + c])) as M3;
const inv3 = ([a, b, c, d, e, f, g, h, i]: M3): M3 => {
  const det = a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);
  return [e * i - f * h, c * h - b * i, b * f - c * e, f * g - d * i, a * i - c * g, c * d - a * f, d * h - e * g, b * g - a * h, a * e - b * d].map((v) => v / det) as M3;
};
/** CSS matrix3d that carries one quad onto another (transform-origin 0 0). */
export const quadToQuad = (src: Pt[], dst: Pt[]): string => {
  const [a, b, c, d, e, f, g, h, i] = mul3(squareToQuad(dst), inv3(squareToQuad(src)));
  return `matrix3d(${a / i}, ${d / i}, 0, ${g / i}, ${b / i}, ${e / i}, 0, ${h / i}, 0, 0, 1, 0, ${c / i}, ${f / i}, 0, 1)`;
};

export const FRAME_QUAD: Pt[] = [[0, 0], [W, 0], [W, H], [0, H]];
/** The laptop screen in the desk still, in frame pixels: TL, TR, BR, BL. */
export const SCREEN: Pt[] = [[903 * K, 363 * K], [1249 * K, 380 * K], [1216 * K, 598 * K], [862 * K, 576 * K]];

const IntoScreen: React.FC = () => {
  const frame = useCurrentFrame();
  const dive = at(frame, 2.2, 4.8, IN_OUT);
  // The screen's corners travel to the corners of the frame, and the room goes with them.
  const target = SCREEN.map(([x, y], n) => [x + (FRAME_QUAD[n][0] - x) * dive, y + (FRAME_QUAD[n][1] - y) * dive] as Pt);
  const settle = 1 + 0.05 * interpolate(frame, [sec(4.8), sec(8.5)], [0, 1], MOVE);
  return (
    <AbsoluteFill style={INK_FILL}>
      <div style={{ position: "absolute", left: 0, top: 0, width: W, height: H, transformOrigin: "0 0", transform: quadToQuad(SCREEN, target) }}>
        <Img src={still("desk-plate")} style={FULL_IMG} />
        <div style={{ position: "absolute", left: 0, top: 0, width: W, height: H, transformOrigin: "0 0", transform: quadToQuad(FRAME_QUAD, SCREEN), opacity: at(frame, 0.9, 1.6) }}>
          <Img src={still("shop-watched-uhd")} style={{ ...FULL_IMG, transform: `scale(${settle})` }} />
        </div>
        <Img src={still("desk-figure", "png")} style={FULL_IMG} />
      </div>
    </AbsoluteFill>
  );
};

// ── The crowd as layers ──────────────────────────────────────────────────────

const FIGURE_STRIP: [number, number] = [782, 962];
const CARDS: [number, number, number, number][] = [
  [48, 418, 99, 66], [202, 418, 98, 66], [355, 418, 98, 66], [508, 418, 96, 66], [653, 419, 102, 66],
  [1017, 418, 106, 66], [1191, 418, 99, 66], [1352, 418, 99, 66], [1517, 418, 100, 66],
];
const cutout = ([x0, x1]: [number, number]): React.CSSProperties => ({
  position: "absolute",
  left: x0 * K,
  top: 400 * CUTOUT_SCALE - 0.3,
  width: (x1 - x0) * K,
  height: 1482 * CUTOUT_SCALE,
  transformOrigin: "50% 100%",
});
const Raters: React.FC<{ style?: (i: number) => React.CSSProperties }> = ({ style }) => (
  <>
    {RATER_STRIPS.map((strip, i) => (
      <Img key={i} src={still(`crowd-rater-${i + 1}`, "png")} style={{ ...cutout(strip), ...style?.(i) }} />
    ))}
  </>
);
const Figure: React.FC<{ style?: React.CSSProperties }> = ({ style }) => (
  <Img src={still("crowd-figure", "png")} style={{ ...cutout(FIGURE_STRIP), ...style }} />
);

// ── Handmade motion ──────────────────────────────────────────────────────────

const CARD_PAPER = "#F3D6A4"; // sampled from the cards in the still
const FLIPS = [
  { card: 0, tick: true }, { card: 1, tick: false }, { card: 2, tick: true }, { card: 3, tick: true }, { card: 4, tick: false },
];
const cardFlip = (frame: number) => (
  <>
    {FLIPS.map(({ card, tick }, n) => {
      const [x, y, w, h] = CARDS[card].map((v) => v * K);
      const turn = 180 * at(frame, 1.2 + n * 0.75, 1.9 + n * 0.75, IN_OUT);
      const face: React.CSSProperties = { position: "absolute", inset: 0, backgroundColor: CARD_PAPER, backfaceVisibility: "hidden" };
      return (
        <div key={card} style={{ position: "absolute", left: x, top: y, width: w, height: h, perspective: 500 }}>
          <div style={{ position: "absolute", inset: 0, transformStyle: "preserve-3d", transform: `rotateX(${turn}deg)` }}>
            <div style={face} />
            <div style={{ ...face, transform: "rotateX(180deg)" }}>
              <svg viewBox="0 0 100 68" width="100%" height="100%">
                <path
                  d={tick ? "M 27 35 L 43 52 L 75 16" : "M 34 17 L 66 51 M 66 17 L 34 51"}
                  fill="none"
                  stroke={palette.ink}
                  strokeWidth={5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        </div>
      );
    })}
  </>
);
const CARD_FLIP: Shot[] = [
  { startSec: 0, endSec: 7, from: { cx: 0.24, cy: 0.43, zoom: 2.1 }, to: { cx: 0.36, cy: 0.43, zoom: 2.1 }, ease: "glide", states: [{ src: still("crowd-4k") }], overlay: cardFlip },
];

/** The same four seconds twice: every frame new, then a new picture every fourth frame. */
const STEP_HALF = 3.8;
const Stepped: React.FC = () => {
  const frame = useCurrentFrame();
  const second = frame >= sec(STEP_HALF);
  const local = second ? Math.floor((frame - sec(STEP_HALF)) / 4) * 4 : frame;
  return (
    <AbsoluteFill style={INK_FILL}>
      <Img src={still("crowd-wall")} style={FULL_IMG} />
      <Raters
        style={(i) => {
          const rank = i < 5 ? 4 - i : i - 5;
          const arrive = sec(0.3 + rank * 0.18);
          const lean = interpolate(local, [sec(1.9 + rank * 0.12), sec(2.7 + rank * 0.12)], [0, 1], IN_OUT);
          return {
            opacity: fadeIn(local, arrive, sec(0.3)),
            transform: `translateY(${slideIn(local, arrive, 22, sec(0.4))}px) rotate(${(i < 5 ? 1 : -1) * 3.2 * lean}deg)`,
          };
        }}
      />
      <Figure />
    </AbsoluteFill>
  );
};

/** A wobbly closed loop around a point, redrawn slightly differently every fourth frame. */
const scribbleLoop = (cx: number, cy: number, rx: number, ry: number, boil: number): string => {
  const pts: string[] = [];
  for (let n = 0; n <= 46; n++) {
    const a = (n / 42) * Math.PI * 2 - 1.2;
    const wobble = 1 + 0.07 * noise2D(`loop${boil}`, n * 0.33, 0);
    pts.push(`${cx + Math.cos(a) * rx * wobble} ${cy + Math.sin(a) * ry * wobble}`);
  }
  return `M ${pts.join(" L ")}`;
};
const scribble = (frame: number) => {
  const boil = Math.floor(frame / 4) % 4;
  const j = (n: number) => 5 * noise2D(`arrow${boil}`, n, 0);
  const pen = { fill: "none", stroke: palette.ink, strokeWidth: 6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, pathLength: 1, strokeDasharray: 1 };
  const loop = at(frame, 0.9, 1.9, IN_OUT);
  const arrow = at(frame, 2.3, 3.1, IN_OUT);
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
      {loop > 0 && <path d={scribbleLoop(1068 * K, 318 * K, 62 * K, 72 * K, boil)} {...pen} strokeDashoffset={1 - loop} />}
      {arrow > 0 && (
        <>
          <path d={`M ${1000 * K + j(1)} ${255 * K + j(2)} Q ${950 * K + j(3)} ${205 * K + j(4)} ${905 * K + j(5)} ${262 * K + j(6)}`} {...pen} strokeDashoffset={1 - arrow} />
          {arrow >= 1 && <path d={`M ${925 * K + j(7)} ${238 * K} L ${905 * K + j(5)} ${262 * K + j(6)} L ${934 * K} ${268 * K + j(8)}`} {...pen} strokeDashoffset={0} />}
        </>
      )}
    </svg>
  );
};
const SCRIBBLE: Shot[] = [
  { startSec: 0, endSec: 6, from: { cx: 0.56, cy: 0.42, zoom: 1.7 }, to: { cx: 0.57, cy: 0.42, zoom: 1.78 }, states: [{ src: still("crowd-4k") }], overlay: scribble },
];

/** The picture as a toy theatre: wall, type, raters and figure on separate planes. */
const PaperTheatre: React.FC = () => {
  const frame = useCurrentFrame();
  const swing = -7 + 14 * interpolate(frame, [0, sec(7)], [0, 1], { ...CLAMP, easing: Easing.inOut(Easing.sin) });
  const plane = (z: number, scale = 1): React.CSSProperties => ({ position: "absolute", inset: 0, transform: `translateZ(${z}px) scale(${scale})` });
  return (
    <AbsoluteFill style={{ ...INK_FILL, perspective: 1500 }}>
      <div style={{ position: "absolute", inset: 0, transformStyle: "preserve-3d", transform: `rotateY(${swing}deg) scale(1.04)` }}>
        <div style={plane(-320, 1.34)}>
          <Img src={still("crowd-wall")} style={FULL_IMG} />
          <div style={{ position: "absolute", left: 0, width: W, top: 246, textAlign: "center", fontFamily: fonts.display, fontWeight: 700, fontSize: 128, letterSpacing: -1, lineHeight: 1, color: palette.ink, opacity: 0.86, mixBlendMode: "multiply" }}>
            THE UNWATCHED TEST
          </div>
        </div>
        <div style={plane(0)}>
          <Raters />
        </div>
        <div style={plane(110, 0.95)}>
          <Figure />
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** The empty street, seen only through the letters of the word. */
const ThroughType: React.FC = () => {
  const frame = useCurrentFrame();
  const drift = interpolate(frame, [0, sec(6)], [0, 1], MOVE);
  return (
    <AbsoluteFill style={{ ...INK_FILL, isolation: "isolate" }}>
      <Img src={still("shop-unwatched-uhd")} style={{ ...FULL_IMG, transformOrigin: "16% 34%", transform: `scale(${2.3 + 0.25 * drift}) translateX(${-30 * drift}px)` }} />
      {/* Multiply keeps the picture inside the white letters and blacks out the rest. */}
      <div style={{ position: "absolute", inset: 0, backgroundColor: "black", mixBlendMode: "multiply", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "white", fontFamily: fonts.display, fontWeight: 700, fontSize: 258, letterSpacing: -5, transform: `scale(${1 + 0.03 * drift})` }}>UNWATCHED</div>
      </div>
      {/* Lighten lifts that black to the page's ink. */}
      <div style={{ position: "absolute", inset: 0, backgroundColor: palette.ink, mixBlendMode: "lighten" }} />
    </AbsoluteFill>
  );
};

/** One figure, then rows of it: each row smaller, higher and fainter. */
const ROWS = [{ n: 1, atSec: 0 }, { n: 5, atSec: 1.6 }, { n: 11, atSec: 2.8 }, { n: 21, atSec: 3.8 }];
const Multiply: React.FC = () => {
  const frame = useCurrentFrame();
  const baseH = 1482 * CUTOUT_SCALE * 0.95;
  const aspect = (FIGURE_STRIP[1] - FIGURE_STRIP[0]) * K / (1482 * CUTOUT_SCALE);
  return (
    <AbsoluteFill style={INK_FILL}>
      <Img src={still("crowd-wall")} style={FULL_IMG} />
      {[...ROWS].reverse().map((row, r) => {
        const depth = ROWS.length - 1 - r; // 0 = the front figure
        const scale = Math.pow(0.66, depth);
        const h = baseH * scale;
        const w = h * aspect;
        const shown = fadeIn(frame, sec(row.atSec), sec(0.5));
        return Array.from({ length: row.n }, (_, n) => (
          <Img
            key={`${depth}-${n}`}
            src={still("crowd-figure", "png")}
            style={{
              position: "absolute",
              left: W / 2 + (n - (row.n - 1) / 2) * w * 1.25 - w / 2,
              top: 990 - h - depth * 46,
              width: w,
              height: h,
              opacity: shown * (1 - depth * 0.2),
              transform: `translateY(${slideIn(frame, sec(row.atSec), 16, sec(0.5))}px)`,
            }}
          />
        ));
      })}
    </AbsoluteFill>
  );
};

/** Light from a passing car crosses the wall behind him. */
const PassingLight: React.FC = () => {
  const frame = useCurrentFrame();
  const x = -700 + 2900 * at(frame, 1.2, 4.6, { ...CLAMP, easing: Easing.inOut(Easing.quad) });
  const origin = `${CONTACT.x}px ${CONTACT.y}px`;
  const push = 1.02 + 0.03 * interpolate(frame, [0, sec(6.5)], [0, 1], MOVE);
  return (
    <AbsoluteFill style={INK_FILL}>
      <div style={{ position: "absolute", inset: 0, transformOrigin: origin, transform: `scale(${push})` }}>
        <Img src={still("desk-plate")} style={FULL_IMG} />
        <div style={{ position: "absolute", left: 0, top: 0, width: W, height: 600, overflow: "hidden", mixBlendMode: "screen", filter: "blur(10px)" }}>
          <div style={{ position: "absolute", left: x, top: 40, display: "flex", gap: 26, transform: "skewX(-24deg)" }}>
            {[0, 1, 2].map((pane) => (
              <div key={pane} style={{ width: 170, height: 420, backgroundColor: palette.gold, opacity: 0.26 }} />
            ))}
          </div>
        </div>
      </div>
      <div style={{ position: "absolute", inset: 0, transformOrigin: origin, transform: `scale(${push})` }}>
        <Img src={still("desk-figure", "png")} style={FULL_IMG} />
      </div>
    </AbsoluteFill>
  );
};

const LIGHT_LAPSE: Shot[] = [
  {
    startSec: 0,
    endSec: 9.5,
    from: { cx: 0.5, cy: 0.5, zoom: 1 },
    to: { cx: 0.5, cy: 0.5, zoom: 1.06 },
    ease: "glide",
    states: [{ src: still("r4-noon") }, { src: still("shop-watched-uhd"), atSec: 2.4, softSec: 1.6 }, { src: still("r4-night"), atSec: 5.6, softSec: 1.6 }],
  },
];

const WINDOW_VIEW = { cx: 0.2, cy: 0.42, zoom: 1.9 };
/** Four pictures of the walkers, each edited from the one before, cycled twice a second. */
const STEP_WALK: Shot[] = [
  {
    startSec: 0,
    endSec: 5,
    from: WINDOW_VIEW,
    states: [
      {
        render: (frame) => {
          const step = Math.floor(frame / sec(0.5)) % 4;
          return (
            <>
              {["shop-watched-uhd", "r4-walk1", "r4-walk2", "r4-walk3"].map((name, n) => (
                <Img key={name} src={still(name)} style={{ ...FULL_IMG, opacity: n === step ? 1 : 0 }} />
              ))}
            </>
          );
        },
      },
    ],
  },
];

const STREET_CLIP = staticFile("episodes/ai-care-motives/clips/aigen-03-unwatched.mp4");
const WINDOW_CLIP = `polygon(0px 0px, ${530 * K}px 0px, ${530 * K}px ${470 * K}px, 0px ${553 * K}px)`;
/** The AI clip in the window, held so it changes only every fifth frame. */
const STEPPED_CLIP: Shot[] = [
  {
    startSec: 0,
    endSec: 6.5,
    from: WINDOW_VIEW,
    states: [
      {
        render: (frame) => (
          <>
            <Img src={still("shop-watched-uhd")} style={FULL_IMG} />
            <div style={{ position: "absolute", inset: 0, clipPath: WINDOW_CLIP }}>
              <Freeze frame={Math.floor(frame / 5) * 5}>
                <OffthreadVideo src={STREET_CLIP} muted style={{ position: "absolute", left: 0, top: 0, width: W, height: H, transformOrigin: "960px 540px", transform: "translateY(-1px) scale(0.987)" }} />
              </Freeze>
            </div>
          </>
        ),
      },
    ],
  },
];

// ── Other machines ───────────────────────────────────────────────────────────

const Tag: React.FC<{ text: string; left?: number; top?: number }> = ({ text, left = 20, top = 20 }) => (
  <div style={{ position: "absolute", left, top, padding: "8px 16px", backgroundColor: palette.ink, color: palette.bone, fontFamily: fonts.metadata, fontSize: fontSizes.readable, letterSpacing: 2, textTransform: "uppercase" }}>
    {text}
  </div>
);
const Video: React.FC<{ name: string; style?: React.CSSProperties; loopSec?: number }> = ({ name, style, loopSec }) => {
  const video = <OffthreadVideo src={clip(name)} muted startFrom={3} style={{ ...FULL_IMG, ...style }} />;
  return loopSec ? <Loop durationInFrames={sec(loopSec)}>{video}</Loop> : video;
};

const MODELS = [
  { name: "clip-aigen-10-arc", label: "MiniMax H3 Max · $0.48" },
  { name: "r4-clip-arc-kling", label: "Kling 3.0 Pro · $0.56" },
  { name: "r4-clip-arc-veo", label: "Veo 3.1 Lite · $0.30" },
];
const MODEL_SEC = 5;
const ThreeModels: React.FC = () => (
  <Series>
    {MODELS.map((m) => (
      <Series.Sequence key={m.name} durationInFrames={sec(MODEL_SEC)}>
        <AbsoluteFill style={INK_FILL}>
          <Video name={m.name} />
          <Tag text={m.label} />
        </AbsoluteFill>
      </Series.Sequence>
    ))}
  </Series>
);

const MORPHS = [
  { name: "r4-clip-turn-film", label: "FILM · about 2 cents" },
  { name: "r4-clip-turn-rife", label: "RIFE · about 18 cents" },
];
const MORPH_SEC = 4.2;
const Morphs: React.FC = () => (
  <Series>
    {MORPHS.map((m) => (
      <Series.Sequence key={m.name} durationInFrames={sec(MORPH_SEC)}>
        <AbsoluteFill style={INK_FILL}>
          <Img src={still("r4-turn-a")} style={FULL_IMG} />
          {/* Hold the first picture, play the one-second morph, hold the last. */}
          <Sequence from={sec(1.2)} layout="none">
            <OffthreadVideo src={clip(m.name)} muted style={FULL_IMG} />
          </Sequence>
          <Tag text={m.label} />
        </AbsoluteFill>
      </Series.Sequence>
    ))}
  </Series>
);

const RESTYLE_SEC = 4.8;
const Restyle: React.FC = () => {
  const half: React.CSSProperties = { position: "absolute", top: (H - 529) / 2, width: 940, height: 529, overflow: "hidden" };
  return (
    <Series>
      <Series.Sequence durationInFrames={sec(RESTYLE_SEC)}>
        <AbsoluteFill style={INK_FILL}>
          <div style={{ ...half, left: 12 }}>
            <OffthreadVideo src={clip("r4-clip-dyno-src")} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            <Tag text="Stock footage" />
          </div>
          <div style={{ ...half, left: 968 }}>
            <OffthreadVideo src={clip("r4-clip-dyno-restyle")} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            <Tag text="Restyled · $0.84" />
          </div>
        </AbsoluteFill>
      </Series.Sequence>
      <Series.Sequence durationInFrames={sec(RESTYLE_SEC)}>
        <AbsoluteFill style={INK_FILL}>
          <OffthreadVideo src={clip("r4-clip-dyno-restyle")} muted style={FULL_IMG} />
        </AbsoluteFill>
      </Series.Sequence>
    </Series>
  );
};

/** A figure animated on green, keyed, and walked along the wide street by code. */
const WALK_SEC = 5;
const GreenActor: React.FC = () => {
  const frame = useCurrentFrame();
  const zoom = 0.9;
  const dispH = H * zoom;
  const dispW = dispH * PANO_ASPECT;
  const left = W / 2 - 0.5 * dispW;
  const top = (H - dispH) / 2;
  // The clip frames him small; this height makes him as tall as the street's own figures.
  const height = 540;
  const x = interpolate(frame, [0, sec(WALK_SEC)], [-320, 1380]);
  return (
    <AbsoluteFill style={INK_FILL}>
      <Img src={still("street-pano")} style={{ position: "absolute", left: 0, top: 0, width: dispW, height: dispH, transform: `translate(${left}px, ${top}px)` }} />
      <OffthreadVideo src={clip("r4-clip-walker", "webm")} muted transparent style={{ position: "absolute", left: x, top: top + dispH * 0.895 - height * 0.93, height, width: (height * 1344) / 768 }} />
    </AbsoluteFill>
  );
};

// ── The reel ─────────────────────────────────────────────────────────────────

interface Section {
  title: string;
  today: string;
  durationSec: number;
  body: React.ReactNode;
  lines: Line[];
  linesEndSec: number;
}
const one = (text: string, atSec = 0.4): Line[] => [{ atSec, text }];

const SECTIONS: Section[] = [
  {
    title: "Reverse angle and insert",
    today: "Coverage: the same moment from the street, then a close-up no crop could give. Two new pictures.",
    durationSec: 12.5,
    body: <StillShots shots={COVERAGE} />,
    lines: [
      { atSec: 0.3, text: "Do you think less of him in the second version?" },
      { atSec: 3.2, text: "Notice whether you do." },
      { atSec: 6.4, text: "The child was treated no worse." },
      { atSec: 9.2, text: "But something you admired just turned into arithmetic." },
    ],
    linesEndSec: 12,
  },
  {
    title: "Plan view with sightlines",
    today: "The scene from above, with who can see whom drawn on it. One new picture.",
    durationSec: 9,
    body: <StillShots shots={PLAN} />,
    lines: [
      { atSec: 0.3, text: "His honesty was never only a fact about his heart. It was a fact about his street." },
      { atSec: 6.0, text: "Take away the watching." },
    ],
    linesEndSec: 8.4,
  },
  {
    title: "The shadow does something else",
    today: "A metaphor state: only his shadow changes. One edit.",
    durationSec: 6.5,
    body: <StillShots shots={SHADOW} />,
    lines: one("But something you admired just turned into arithmetic."),
    linesEndSec: 6,
  },
  {
    title: "Giant watchers",
    today: "A metaphor state: the passers-by become what they feel like. One edit.",
    durationSec: 7.5,
    body: <StillShots shots={GIANTS} />,
    lines: [
      { atSec: 0.3, text: "Children have parents. Parents talk." },
      { atSec: 3.0, text: "A reputation for honesty is worth more than a few extra coins today." },
    ],
    linesEndSec: 7,
  },
  {
    title: "X-ray",
    today: "A see-inside state behind a scan line. One edit.",
    durationSec: 7.5,
    body: <StillShots shots={XRAY} />,
    lines: one("Its diesel cars carried software designed to recognize an official test."),
    linesEndSec: 6.6,
  },
  {
    title: "Sketch to colour",
    today: "The picture as a line drawing, then colour arrives. One edit.",
    durationSec: 6.5,
    body: <StillShots shots={SKETCH} />,
    lines: one("A child walks into a shop to buy bread."),
    linesEndSec: 5,
  },
  {
    title: "Double exposure",
    today: "Two registered versions on screen at once, then one of them wins.",
    durationSec: 6.5,
    body: <StillShots shots={DOUBLE} />,
    lines: one("Now I'll tell you why he did it. There are two versions."),
    linesEndSec: 5.4,
  },
  {
    title: "Onion skin",
    today: "Each pose stays behind as a ghost, so one picture holds the whole action.",
    durationSec: 7.5,
    body: <StillShots shots={ONION} />,
    lines: one("A stranger pulls you out of the river.", 1.6),
    linesEndSec: 6,
  },
  {
    title: "One sheet, six shots",
    today: "A six-panel storyboard from a single generation, with the same character in every panel.",
    durationSec: SHEET_SEC,
    body: <Storyboard />,
    lines: [
      { atSec: 0.3, text: "Plato explores a related question through a man named Glaucon." },
      { atSec: 2.4, text: "A shepherd finds a ring." },
      { atSec: 5.6, text: "Turn it, and you vanish." },
      { atSec: 8.8, text: "“No man would keep his hands off what was not his own when he could safely take what he liked out of the market.”" },
    ],
    linesEndSec: 15.2,
  },
  {
    title: "Into the screen",
    today: "The laptop shows the next scene; the camera goes in and arrives there.",
    durationSec: 8.5,
    body: <IntoScreen />,
    lines: [
      { atSec: 0.3, text: "I call that question the Unwatched Test." },
      { atSec: 2.6, text: "It starts with a shopkeeper." },
      { atSec: 5.2, text: "A child walks into a shop to buy bread." },
    ],
    linesEndSec: 8,
  },
  {
    title: "Card flip",
    today: "The blank cards turn over, one at a time, to show the marks.",
    durationSec: 7,
    body: <StillShots shots={CARD_FLIP} />,
    lines: one("People compare its answers and pick the better ones, and those judgments shape further training."),
    linesEndSec: 6.4,
  },
  {
    title: "Stepped time",
    today: "The same move twice: every frame new, then a new picture every fourth frame.",
    durationSec: STEP_HALF * 2,
    body: <Stepped />,
    lines: [
      { atSec: 0, text: "[smooth: every frame is new]" },
      { atSec: STEP_HALF, text: "[stepped: a new picture every fourth frame]" },
    ],
    linesEndSec: STEP_HALF * 2,
  },
  {
    title: "Scribble",
    today: "Annotation drawn as if by hand, redrawn every fourth frame so it lives.",
    durationSec: 6,
    body: <StillShots shots={SCRIBBLE} />,
    lines: one("Part of its training was the raters."),
    linesEndSec: 5,
  },
  {
    title: "Paper theatre",
    today: "Wall, type, raters and figure on separate planes, swung in real perspective.",
    durationSec: 7,
    body: <PaperTheatre />,
    lines: one("I call that question the Unwatched Test."),
    linesEndSec: 5,
  },
  {
    title: "Picture through type",
    today: "The empty street, visible only inside the letters.",
    durationSec: 6,
    body: <ThroughType />,
    lines: one("That's the Unwatched Test."),
    linesEndSec: 4.6,
  },
  {
    title: "Multiply",
    today: "One figure becomes rows of it. No line in the script yet calls for this.",
    durationSec: 6,
    body: <Multiply />,
    lines: [],
    linesEndSec: 0,
  },
  {
    title: "Passing light",
    today: "Light from a passing car crosses the wall. Made in code.",
    durationSec: 6.5,
    body: <PassingLight />,
    lines: one("You've probably asked an AI whether your idea is good."),
    linesEndSec: 5,
  },
  {
    title: "Light-lapse",
    today: "Noon, evening, night on one frame. Two relighting edits.",
    durationSec: 9.5,
    body: <StillShots shots={LIGHT_LAPSE} />,
    lines: one("A reputation for honesty is worth more than a few extra coins today.", 2.4),
    linesEndSec: 7,
  },
  {
    title: "Stepped walk from edits",
    today: "Each picture edited from the one before, cycled. The figures do not hold: shown as a failure.",
    durationSec: 5,
    body: <StillShots shots={STEP_WALK} />,
    lines: [],
    linesEndSec: 0,
  },
  {
    title: "AI clip, stepped",
    today: "The existing street clip held on every fifth frame, so it moves like a drawing.",
    durationSec: 6.5,
    body: <StillShots shots={STEPPED_CLIP} />,
    lines: one("Take away the watching.", 2.4),
    linesEndSec: 5,
  },
  {
    title: "Three video models, one shot",
    today: "The same camera move and prompt on three models, one take each.",
    durationSec: MODEL_SEC * MODELS.length,
    body: <ThreeModels />,
    lines: [],
    linesEndSec: 0,
  },
  {
    title: "Morph without a video model",
    today: "Frame interpolation between two registered states: the head turn in one second.",
    durationSec: MORPH_SEC * MORPHS.length,
    body: <Morphs />,
    lines: [],
    linesEndSec: 0,
  },
  {
    title: "Stock footage restyled",
    today: "The episode's dynamometer clip, redrawn by a video-edit model with a house picture as reference.",
    durationSec: RESTYLE_SEC * 2,
    body: <Restyle />,
    lines: one("The testers were real. The tests were real.", RESTYLE_SEC + 0.4),
    linesEndSec: RESTYLE_SEC * 2 - 0.4,
  },
  {
    title: "A figure animated on green",
    today: "One spot illustration, animated on a green ground, keyed, and walked through the wide street.",
    durationSec: WALK_SEC,
    body: <GreenActor />,
    lines: [],
    linesEndSec: 0,
  },
];

const SLATE_4_SEC = 1.8;

export const STILLS_REEL_4_DURATION = SECTIONS.reduce((total, s) => total + sec(SLATE_4_SEC) + sec(s.durationSec), 0);

export const StillsReel4: React.FC = () => (
  <Series>
    {SECTIONS.flatMap((s, i) => [
      <Series.Sequence key={`slate-${i}`} durationInFrames={sec(SLATE_4_SEC)}>
        <Slate index={i + 1} of={SECTIONS.length} title={s.title} today={s.today} />
      </Series.Sequence>,
      <Series.Sequence key={`body-${i}`} durationInFrames={sec(s.durationSec)}>
        {s.body}
        <NarrationStrip lines={s.lines} endSec={s.linesEndSec} />
      </Series.Sequence>,
    ])}
  </Series>
);
