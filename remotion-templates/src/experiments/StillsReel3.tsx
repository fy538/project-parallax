/**
 * StillsReel3 — the third test reel: the rest of the toolbox, including the
 * techniques the project had ruled out, so each has been seen once on this art.
 *
 * Made in code (no video model):
 *   rapid-cut montage · rack focus · type behind the figures · cut-out move ·
 *   line boil · colour isolation · unit chart from the picture's own figure ·
 *   push-through · wipe slider · strip recap · spot illustrations as diagram
 *   nodes · depth-map parallax (for comparison) · match dissolve
 * Made by a video model (MiniMax H3 Max, one take each):
 *   in-between of two poses · transition between two matched stills ·
 *   loop (first frame = last frame) · camera arc · a cut inside one clip
 *
 * Test only: nothing here is wired into an episode manifest. Catalogue and
 * verdict slots: project/VISUAL_TOOLBOX.md.
 */
import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  Loop,
  OffthreadVideo,
  Series,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { fonts, fontSizes, palette, sec } from "../design/theme";
import { CLAMP, CLAMP_DECELERATE, fadeIn, slideIn } from "../utils/animation";
import { type Line, type Shot, H, MOVE, NarrationStrip, Panel, Slate, StillShots, W, still } from "./StillsReel";
import { CONTACT, CUTOUT_SCALE, FULL_IMG, K, PANO_ASPECT, RATER_STRIPS, TRI } from "./StillsReel2";

const IN_OUT = { ...CLAMP, easing: Easing.inOut(Easing.cubic) };
const at = (frame: number, fromSec: number, toSec: number, ease: Parameters<typeof interpolate>[3] = CLAMP_DECELERATE) =>
  interpolate(frame, [sec(fromSec), sec(toSec)], [0, 1], ease);

// ── Rapid-cut montage ────────────────────────────────────────────────────────

const MONTAGE: Shot[] = [
  // "You've probably asked an AI whether your idea is good."
  { startSec: 0, endSec: 3.6, from: { cx: 0.5, cy: 0.5, zoom: 1.04 }, to: { cx: 0.52, cy: 0.5, zoom: 1.1 }, states: [{ src: still("desk-night-uhd") }] },
  // "The startup." "The essay." One picture per item, about a second each.
  { startSec: 3.6, endSec: 4.7, from: { cx: 0.5, cy: 0.5, zoom: 1.04 }, to: { cx: 0.5, cy: 0.5, zoom: 1.08 }, states: [{ src: still("montage-startup-hd") }] },
  { startSec: 4.7, endSec: 5.8, from: { cx: 0.5, cy: 0.5, zoom: 1.04 }, to: { cx: 0.5, cy: 0.5, zoom: 1.08 }, states: [{ src: still("montage-essay-hd") }] },
  // "The plan you haven't told anyone yet." The last item holds.
  { startSec: 5.8, endSec: 9.1, from: { cx: 0.5, cy: 0.5, zoom: 1.02 }, to: { cx: 0.56, cy: 0.52, zoom: 1.12 }, states: [{ src: still("montage-plan-hd") }] },
];

// ── Rack focus between two planes ────────────────────────────────────────────

const RackFocus: React.FC = () => {
  const frame = useCurrentFrame();
  // "…And you're about to act on it." Focus leaves the screen for the person.
  const pull = at(frame, 3.0, 4.3, IN_OUT);
  const push = interpolate(frame, [0, sec(7)], [0, 1], MOVE);
  const origin = `${CONTACT.x}px ${CONTACT.y}px`;
  return (
    <AbsoluteFill style={{ backgroundColor: palette.ink, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, transformOrigin: origin, transform: `scale(${1.03 + 0.02 * push})`, filter: `blur(${7 * pull}px)` }}>
        <Img src={still("desk-plate")} style={FULL_IMG} />
      </div>
      <div style={{ position: "absolute", inset: 0, transformOrigin: origin, transform: `scale(${1.03 + 0.045 * push})`, filter: `blur(${9 * (1 - pull)}px)` }}>
        <Img src={still("desk-figure", "png")} style={FULL_IMG} />
      </div>
    </AbsoluteFill>
  );
};

// ── The crowd as layers: wall, optional insert, ten cut-out figures ──────────

const FIGURE_STRIP: [number, number] = [782, 962];
const cutoutBox = ([x0, x1]: [number, number]): React.CSSProperties => ({
  position: "absolute",
  left: x0 * K,
  top: 400 * CUTOUT_SCALE - 0.3,
  width: (x1 - x0) * K,
  height: 1482 * CUTOUT_SCALE,
  // Figures pivot where they stand.
  transformOrigin: "50% 100%",
});

const CrowdLayers: React.FC<{
  /** Drawn on the wall, behind every figure. */
  onWall?: React.ReactNode;
  wallStyle?: React.CSSProperties;
  raterStyle?: (i: number) => React.CSSProperties;
  figuresStyle?: React.CSSProperties;
  zoom?: number;
}> = ({ onWall, wallStyle, raterStyle, figuresStyle, zoom = 1 }) => (
  <AbsoluteFill style={{ backgroundColor: palette.ink, overflow: "hidden" }}>
    <div style={{ position: "absolute", inset: 0, transform: `scale(${zoom})`, transformOrigin: "50% 45%" }}>
      <Img src={still("crowd-wall")} style={{ ...FULL_IMG, ...wallStyle }} />
      {onWall}
      <div style={{ position: "absolute", inset: 0, ...figuresStyle }}>
        {RATER_STRIPS.map((strip, i) => (
          <Img key={i} src={still(`crowd-rater-${i + 1}`, "png")} style={{ ...cutoutBox(strip), ...raterStyle?.(i) }} />
        ))}
        <Img src={still("crowd-figure", "png")} style={cutoutBox(FIGURE_STRIP)} />
      </div>
    </div>
  </AbsoluteFill>
);

/** "I call that question the Unwatched Test." Set on the wall, behind the heads. */
const TypeBehind: React.FC = () => {
  const frame = useCurrentFrame();
  const wipe = at(frame, 1.3, 2.3);
  return (
    <CrowdLayers
      zoom={1 + 0.04 * interpolate(frame, [0, sec(7)], [0, 1], MOVE)}
      onWall={
        <div
          style={{
            position: "absolute",
            left: 0,
            width: W,
            top: 222,
            textAlign: "center",
            fontFamily: fonts.display,
            fontWeight: 700,
            fontSize: 168,
            letterSpacing: -2,
            lineHeight: 1,
            color: palette.ink,
            opacity: 0.86,
            mixBlendMode: "multiply",
            clipPath: `inset(0 ${(1 - wipe) * 100}% 0 0)`,
          }}
        >
          THE UNWATCHED TEST
        </div>
      }
    />
  );
};

/** "Part of its training was the raters." Each cut-out leans toward the middle. */
const CutoutLean: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <CrowdLayers
      raterStyle={(i) => {
        const side = i < 5 ? 1 : -1; // left-hand raters lean right, and the reverse
        const rank = i < 5 ? 4 - i : i - 5; // nearest first
        const lean = at(frame, 3.6 + rank * 0.14, 4.6 + rank * 0.14, IN_OUT);
        return { transform: `rotate(${side * 3.2 * lean}deg)` };
      }}
    />
  );
};

/** A boil on the figures only: the outline shifts every fourth frame; the wall holds. */
const LineBoil: React.FC = () => {
  const frame = useCurrentFrame();
  const seed = Math.floor(frame / 4) % 5;
  return (
    <>
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <filter id="reel3-boil" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency={0.018} numOctaves={1} seed={seed + 1} result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale={7} xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>
      <CrowdLayers figuresStyle={{ filter: "url(#reel3-boil)" }} />
    </>
  );
};

/** "…one way for its assessors and another way elsewhere?" Colour stays on one figure. */
const ColourIsolation: React.FC = () => {
  const frame = useCurrentFrame();
  const drain = at(frame, 1.4, 3.0, IN_OUT);
  return (
    <CrowdLayers
      wallStyle={{ filter: `saturate(${1 - 0.9 * drain}) brightness(${1 - 0.25 * drain})` }}
      raterStyle={() => ({ filter: `grayscale(${drain}) brightness(${1 - 0.2 * drain})`, opacity: 1 - 0.55 * drain })}
    />
  );
};

// ── Unit chart built from the picture's own figure ───────────────────────────

const UNIT = { cols: 20, rows: 5, w: 30, h: 123, gapX: 6, gapY: 10 };
const BLOCK_W = UNIT.cols * (UNIT.w + UNIT.gapX) - UNIT.gapX;
const BLOCK_H = UNIT.rows * (UNIT.h + UNIT.gapY) - UNIT.gapY;

const UnitBlock: React.FC<{ x: number; label: string; value: string; lit: number; countAtSec: number; inAtSec: number }> = ({
  x,
  label,
  value,
  lit,
  countAtSec,
  inAtSec,
}) => {
  const frame = useCurrentFrame();
  const counted = at(frame, countAtSec, countAtSec + 0.8, IN_OUT);
  const top = 300;
  return (
    <>
      <div style={{ position: "absolute", left: x, top: 150, width: BLOCK_W, color: palette.walnut, fontFamily: fonts.metadata, fontSize: fontSizes.readable, letterSpacing: 2, textTransform: "uppercase", opacity: fadeIn(frame, sec(inAtSec), sec(0.5)) }}>
        {label}
      </div>
      <div style={{ position: "absolute", left: x, top: 192, color: palette.ink, fontFamily: fonts.display, fontSize: 72, fontWeight: 600, opacity: fadeIn(frame, sec(countAtSec + 0.3), sec(0.5)) }}>
        {value}
      </div>
      {Array.from({ length: UNIT.cols * UNIT.rows }, (_, n) => {
        const col = n % UNIT.cols;
        const row = Math.floor(n / UNIT.cols);
        const appear = fadeIn(frame, sec(inAtSec) + col * 1.2 + row * 2, sec(0.3));
        return (
          <Img
            key={n}
            src={still("crowd-figure", "png")}
            style={{
              position: "absolute",
              left: x + col * (UNIT.w + UNIT.gapX),
              top: top + row * (UNIT.h + UNIT.gapY),
              width: UNIT.w,
              height: UNIT.h,
              // The counted ones keep their weight; the rest step back.
              opacity: appear * (n < lit ? 1 : 1 - 0.78 * counted),
            }}
          />
        );
      })}
    </>
  );
};

const UnitChart: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: palette.paper }}>
    <UnitBlock x={120} label="Believed it counted for training" value="about 14 in 100" lit={14} inAtSec={0.6} countAtSec={3.0} />
    <UnitBlock x={W - 120 - BLOCK_W} label="Believed it didn't" value="about 3 in 100" lit={3} inAtSec={1.2} countAtSec={7.0} />
    <div style={{ position: "absolute", left: 120, top: 300 + BLOCK_H + 34, color: palette.walnut, fontFamily: fonts.metadata, fontSize: fontSizes.readable, letterSpacing: 1 }}>
      Harmful requests answered, per 100 · Greenblatt et al., 2024
    </div>
  </AbsoluteFill>
);

// ── Push-through: in at the shop window, out on the street ───────────────────

/** The pane the camera goes through: clear glass between two window bars, in frame pixels. */
const PORTAL = { x: 0.132 * W, y: 0.32 * H };
const THROUGH = { fromSec: 2.2, toSec: 3.3 };
/** The two pictures share the screen for this long and no longer. */
const HANDOVER_SEC = 0.17;

export const PushThrough: React.FC = () => {
  const frame = useCurrentFrame();
  const drift = interpolate(frame, [0, sec(THROUGH.fromSec)], [0, 1], MOVE);
  const through = at(frame, THROUGH.fromSec, THROUGH.toSec, { ...CLAMP, easing: Easing.in(Easing.quad) });
  // Scale grows by a constant ratio per frame, so the speed looks steady; by the end
  // one pane of glass fills the frame, which is when the street takes over.
  const scale = (1 + 0.05 * drift) * Math.exp(Math.log(14) * through);
  const handover = at(frame, THROUGH.toSec - HANDOVER_SEC, THROUGH.toSec, CLAMP);
  // The street arrives still travelling forward, and settles.
  const zoom = 1.3 - 0.3 * at(frame, THROUGH.toSec - HANDOVER_SEC, THROUGH.toSec + 1.4);
  const cx = 0.33 + 0.04 * interpolate(frame, [sec(THROUGH.toSec), sec(6.5)], [0, 1], MOVE);
  const dispH = H * zoom;
  const dispW = dispH * PANO_ASPECT;
  const left = Math.min(0, Math.max(W - dispW, W / 2 - cx * dispW));
  const top = Math.min(0, Math.max(H - dispH, H / 2 - 0.55 * dispH));
  return (
    <AbsoluteFill style={{ backgroundColor: palette.ink, overflow: "hidden" }}>
      <Img src={still("street-pano")} style={{ position: "absolute", left: 0, top: 0, width: dispW, height: dispH, maxWidth: "none", transform: `translate(${left}px, ${top}px)` }} />
      <div
        style={{
          position: "absolute",
          inset: 0,
          transformOrigin: `${PORTAL.x}px ${PORTAL.y}px`,
          transform: `scale(${scale})`,
          filter: `blur(${5 * through * through}px)`,
          opacity: 1 - handover,
        }}
      >
        <Img src={still("shop-watched-uhd")} style={FULL_IMG} />
      </div>
    </AbsoluteFill>
  );
};

// ── Wipe slider: two registered states either side of a moving line ──────────

const SLIDER = { fromSec: 3.2, toSec: 5.2, fromX: 0.02, toX: 0.36 };
const sliderX = (frame: number) => SLIDER.fromX + (SLIDER.toX - SLIDER.fromX) * at(frame, SLIDER.fromSec, SLIDER.toSec, IN_OUT);

const WIPE_SLIDER: Shot[] = [
  {
    startSec: 0,
    endSec: 7,
    from: { cx: 0.25, cy: 0.42, zoom: 1.9 },
    to: { cx: 0.25, cy: 0.42, zoom: 2 },
    states: [
      { src: still("shop-watched-uhd") },
      // Left of the line: the street with nobody on it.
      { render: (frame) => <Img src={still("shop-unwatched-uhd")} style={{ ...FULL_IMG, clipPath: `inset(0 ${(1 - sliderX(frame)) * 100}% 0 0)` }} /> },
    ],
    overlay: (frame) => (
      <div style={{ position: "absolute", left: sliderX(frame) * W - 1, top: 0, width: 2, height: H, backgroundColor: palette.bone, opacity: fadeIn(frame, sec(SLIDER.fromSec - 0.4), sec(0.3)) }}>
        <div style={{ position: "absolute", left: -9, top: 0.4 * H, width: 20, height: 20, borderRadius: 10, backgroundColor: palette.bone }} />
      </div>
    ),
  },
];

// ── Strip recap: earlier pictures stay on screen while the next arrives ──────

const RECAP = [
  { picture: "river-bank-uhd", focus: "38% 50%", text: "The help is real.", atSec: 1.2 },
  { picture: "shop-watched-hd", focus: "72% 50%", text: "Does it deserve admiration? A separate question.", atSec: 3.6 },
  { picture: "desk-night-uhd", focus: "40% 50%", text: "Will the help last? Still open.", atSec: 7.4, key: true },
];

const StripRecap: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ backgroundColor: palette.ink }}>
      <div style={{ position: "absolute", left: 56, top: 190, color: palette.taupe, fontFamily: fonts.metadata, fontSize: fontSizes.readable, letterSpacing: 3, textTransform: "uppercase", opacity: fadeIn(frame, sec(0.2), sec(0.5)) }}>
        Where we are
      </div>
      {RECAP.map((item, i) => {
        const rect = TRI(i);
        const shown = fadeIn(frame, sec(item.atSec), sec(0.5));
        return (
          <React.Fragment key={i}>
            <Panel rect={rect} focus={item.focus} states={[{ src: still(item.picture), opacity: 1 }]} opacity={shown} rise={slideIn(frame, sec(item.atSec), 14, sec(0.5))} accent={item.key ? fadeIn(frame, sec(item.atSec + 0.8), sec(0.6)) : 0} />
            <div style={{ position: "absolute", left: rect.x, top: rect.y + rect.h + 26, width: rect.w, color: palette.bone, fontFamily: fonts.serifBody, fontSize: 36, lineHeight: 1.25, opacity: fadeIn(frame, sec(item.atSec + 0.3), sec(0.5)) }}>
              {item.text}
            </div>
          </React.Fragment>
        );
      })}
    </AbsoluteFill>
  );
};

// ── Spot illustrations as the nodes of a diagram ─────────────────────────────

/** The paper of the generated sheet, sampled from it, so the spots have no visible edge. */
const SHEET_PAPER = "#FBF1DF";
const CHECKS = [
  { helper: "doctor", helperLabel: "Doctor", checker: "board", checkerLabel: "Licensing board", atSec: [4.0, 5.4] },
  { helper: "bank", helperLabel: "Bank", checker: "inspectors", checkerLabel: "Regulators", atSec: [8.4, 9.6] },
  { helper: "shopkeeper", helperLabel: "Shopkeeper", checker: "street", checkerLabel: "The street", atSec: [12.2, 13.2], key: true },
];
// Each spot is cropped to its own drawing, so it is fitted inside its box, not cropped again.
const SPOT = { w: 360, h: 270, rowGap: 22, top: 84, helperX: 430, checkerX: 1130 };

const SpotDiagram: React.FC = () => {
  const frame = useCurrentFrame();
  const label: React.CSSProperties = { position: "absolute", color: palette.ink, fontFamily: fonts.metadata, fontSize: fontSizes.readable, letterSpacing: 2.5, textTransform: "uppercase", whiteSpace: "nowrap" };
  return (
    <AbsoluteFill style={{ backgroundColor: SHEET_PAPER }}>
      {CHECKS.map((row, i) => {
        const y = SPOT.top + i * (SPOT.h + SPOT.rowGap);
        const [tHelper, tChecker] = row.atSec;
        const a = fadeIn(frame, sec(tHelper), sec(0.5));
        const b = fadeIn(frame, sec(tChecker), sec(0.5));
        const arrow = at(frame, tChecker - 0.5, tChecker);
        const x0 = SPOT.helperX + SPOT.w + 30;
        const x1 = SPOT.checkerX - 30;
        const tip = x0 + (x1 - x0) * arrow;
        const mid = y + SPOT.h / 2;
        const color = row.key ? palette.goldText : palette.walnut;
        return (
          <React.Fragment key={i}>
            <Img src={still(`spot-${row.helper}`)} style={{ position: "absolute", left: SPOT.helperX, top: y, width: SPOT.w, height: SPOT.h, objectFit: "contain", opacity: a }} />
            <div style={{ ...label, right: W - SPOT.helperX - 6, top: mid - 16, opacity: a }}>{row.helperLabel}</div>
            <Img src={still(`spot-${row.checker}`)} style={{ position: "absolute", left: SPOT.checkerX, top: y, width: SPOT.w, height: SPOT.h, objectFit: "contain", opacity: b }} />
            <div style={{ ...label, left: SPOT.checkerX + SPOT.w + 6, top: mid - 16, opacity: b, color: row.key ? palette.goldText : palette.ink }}>{row.checkerLabel}</div>
            {arrow > 0 && (
              <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
                <line x1={x0} y1={mid} x2={tip} y2={mid} stroke={color} strokeWidth={3} strokeLinecap="round" />
                <path d={`M ${tip - 12} ${mid - 9} L ${tip} ${mid} L ${tip - 12} ${mid + 9}`} fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" opacity={arrow} />
              </svg>
            )}
          </React.Fragment>
        );
      })}
    </AbsoluteFill>
  );
};

// ── Depth-map parallax, for comparison ───────────────────────────────────────

const DepthParallax: React.FC = () => {
  const frame = useCurrentFrame();
  const sway = Math.sin((frame / sec(5)) * Math.PI * 2) * 46;
  return (
    <AbsoluteFill style={{ backgroundColor: palette.ink, overflow: "hidden" }}>
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <filter id="reel3-depth" filterUnits="userSpaceOnUse" primitiveUnits="userSpaceOnUse" x={0} y={0} width={W} height={H}>
          <feImage href={still("desk-depth", "png")} x={0} y={0} width={W} height={H} preserveAspectRatio="none" result="depth" />
          <feDisplacementMap in="SourceGraphic" in2="depth" scale={sway} xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>
      {/* Mounted so the depth picture is loaded before the filter asks for it. */}
      <Img src={still("desk-depth", "png")} style={{ position: "absolute", width: 1, height: 1, opacity: 0 }} />
      <div style={{ position: "absolute", inset: 0, transform: "scale(1.06)", filter: "url(#reel3-depth)" }}>
        <Img src={still("desk-night-uhd")} style={FULL_IMG} />
      </div>
    </AbsoluteFill>
  );
};

// ── Match dissolve ───────────────────────────────────────────────────────────

const MATCH_DISSOLVE: Shot[] = [
  {
    startSec: 0,
    endSec: 7.5,
    from: { cx: 0.5, cy: 0.5, zoom: 1 },
    to: { cx: 0.5, cy: 0.5, zoom: 1.06 },
    states: [
      { src: still("shop-watched-hd") },
      { src: still("car-watched-hd"), atSec: 2.2, softSec: 0.9 },
      { src: still("model-watched-hd"), atSec: 4.8, softSec: 0.9 },
    ],
  },
];

// ── Clips made by a video model ──────────────────────────────────────────────

const CLIP_SEC = 5;
const Clip: React.FC<{ name: string; loop?: boolean }> = ({ name, loop }) => {
  const video = (
    <OffthreadVideo
      src={staticFile(`episodes/ai-care-motives/stills-test/clip-${name}.mp4`)}
      muted
      // The first few frames of every clip carry a brightness pop.
      startFrom={3}
      style={{ ...FULL_IMG }}
    />
  );
  return (
    <AbsoluteFill style={{ backgroundColor: palette.ink }}>
      {loop ? <Loop durationInFrames={sec(CLIP_SEC)}>{video}</Loop> : video}
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
    title: "Rapid-cut montage",
    today: "A list read quickly: one picture per item, about a second each. Three new pictures.",
    durationSec: 9.1,
    body: <StillShots shots={MONTAGE} />,
    lines: [
      { atSec: 0.3, text: "You've probably asked an AI whether your idea is good." },
      { atSec: 3.6, text: "The startup." },
      { atSec: 4.7, text: "The essay." },
      { atSec: 5.8, text: "The plan you haven't told anyone yet." },
    ],
    linesEndSec: 8.4,
  },
  {
    title: "Rack focus",
    today: "Focus moves from the screen to the person. Uses the layers split from the desk still.",
    durationSec: 7,
    body: <RackFocus />,
    lines: [
      { atSec: 0.3, text: "A reassuring answer doesn't settle that." },
      { atSec: 3.0, text: "And you're about to act on it." },
    ],
    linesEndSec: 5.6,
  },
  {
    title: "Type behind the figures",
    today: "The title set on the wall, with the figures standing in front of it. No new picture.",
    durationSec: 7,
    body: <TypeBehind />,
    lines: [
      { atSec: 0.3, text: "I call that question the Unwatched Test." },
      { atSec: 3.6, text: "It starts with a shopkeeper." },
    ],
    linesEndSec: 5.8,
  },
  {
    title: "Cut-out move",
    today: "Each figure is its own piece and leans toward the middle. Rejected once before; shown again with clean cut-outs.",
    durationSec: 7.5,
    body: <CutoutLean />,
    lines: [
      { atSec: 0.3, text: "Nobody has to claim the machine craves applause." },
      { atSec: 3.6, text: "Part of its training was the raters." },
    ],
    linesEndSec: 6.4,
  },
  {
    title: "Line boil",
    today: "The figures' outlines shift every fourth frame; the wall holds still.",
    durationSec: 5,
    body: <LineBoil />,
    lines: one("In that research, agreement helped an answer win approval."),
    linesEndSec: 4.4,
  },
  {
    title: "Colour isolation",
    today: "Colour drains from everything but one figure.",
    durationSec: 6.5,
    body: <ColourIsolation />,
    lines: one("But what happens when a system behaves one way for its assessors and another way elsewhere?"),
    linesEndSec: 6,
  },
  {
    title: "Unit chart from the picture",
    today: "A statistic counted out in the episode's own figure. In the episode today: an if/then card.",
    durationSec: 10.5,
    body: <UnitChart />,
    lines: [
      { atSec: 0.4, text: "It answered harmful requests about fourteen percent of the time when it believed the conversation counted for training," },
      { atSec: 6.6, text: "and almost never when it believed it didn't." },
    ],
    linesEndSec: 9.6,
  },
  {
    title: "Push-through",
    today: "In through the shop window, out on the street. The transition grammar currently rules zoom moves out.",
    durationSec: 6.5,
    body: <PushThrough />,
    lines: [
      { atSec: 0.3, text: "Go back to the shop." },
      { atSec: 2.4, text: "Picture the street: other customers compare notes." },
    ],
    linesEndSec: 6,
  },
  {
    title: "Wipe slider",
    today: "Two registered states either side of a moving line.",
    durationSec: 7,
    body: <StillShots shots={WIPE_SLIDER} />,
    lines: [
      { atSec: 1.2, text: "The question is simple." },
      { atSec: 3.2, text: "Take away the watching." },
    ],
    linesEndSec: 6,
  },
  {
    title: "Strip recap",
    today: "Earlier pictures stay on screen as the claims add up. In the episode today: a text list.",
    durationSec: 12,
    body: <StripRecap />,
    lines: [
      { atSec: 0.2, text: "Here's where we are. The help is real." },
      { atSec: 3.6, text: "Whether it deserves your admiration is a separate question." },
      { atSec: 7.4, text: "Neither the help nor the admiration tells you, on its own, what the machine will do next time." },
    ],
    linesEndSec: 11.4,
  },
  {
    title: "Spot illustrations as diagram nodes",
    today: "Six small pictures from one generated sheet. In the episode today: text rows with arrows.",
    durationSec: 16.5,
    body: <SpotDiagram />,
    lines: [
      { atSec: 0.3, text: "That is part of how you trust people you don't know well." },
      { atSec: 4.0, text: "Your doctor has a licensing board that can pull her license." },
      { atSec: 8.4, text: "Your bank gets examined by regulators." },
      { atSec: 11.2, text: "You have never read anyone's mind. You've leaned on the people checking them." },
    ],
    linesEndSec: 16,
  },
  {
    title: "Depth-map parallax",
    today: "For comparison only: the automatic 3D-photo effect the project blacklisted.",
    durationSec: 5,
    body: <DepthParallax />,
    lines: [],
    linesEndSec: 0,
  },
  {
    title: "Match dissolve",
    today: "The matched pictures from reel 2, dissolved instead of cut.",
    durationSec: 7.5,
    body: <StillShots shots={MATCH_DISSOLVE} />,
    lines: [
      { atSec: 0.3, text: "The shopkeeper." },
      { atSec: 2.2, text: "The car." },
      { atSec: 4.8, text: "The machine." },
    ],
    linesEndSec: 7,
  },
  {
    title: "AI video: in-between of two poses",
    today: "The grasp and the pull from reel 2, pinned as first and last frame. One take.",
    durationSec: 6.4,
    body: <Clip name="aigen-04-inbetween" />,
    lines: one("A stranger pulls you out of the river.", 1.0),
    linesEndSec: 5,
  },
  {
    title: "AI video: transition between matched stills",
    today: "Shop pinned as the first frame, car as the last. One take.",
    durationSec: 5.2,
    body: <Clip name="aigen-03-to-car" />,
    lines: one("That ring is a thought experiment. Here's a real case."),
    linesEndSec: 4.6,
  },
  {
    title: "AI video: loop",
    today: "First frame and last frame are the same picture. Played twice; watch the join at five seconds.",
    durationSec: 9.8,
    body: <Clip name="aigen-05-loop" loop />,
    lines: one("Do you admire him less? Did the rescue give you less? You're alive."),
    linesEndSec: 8,
  },
  {
    title: "AI video: camera arc",
    today: "The model moves the camera around the figure. The older tests blacklisted this on flat art.",
    durationSec: 5.2,
    body: <Clip name="aigen-10-arc" />,
    lines: one("You've probably asked an AI whether your idea is good."),
    linesEndSec: 4.6,
  },
  {
    title: "AI video: a cut inside the clip",
    today: "One prompt, two shots: the wide still, then a close-up the model draws itself.",
    durationSec: 5.2,
    body: <Clip name="aigen-06-two-shots" />,
    lines: one("So what does a good result mean if the system can recognize the test?"),
    linesEndSec: 4.8,
  },
];

const SLATE_3_SEC = 2;

export const STILLS_REEL_3_DURATION = SECTIONS.reduce((total, s) => total + sec(SLATE_3_SEC) + sec(s.durationSec), 0);

export const StillsReel3: React.FC = () => (
  <Series>
    {SECTIONS.flatMap((s, i) => [
      <Series.Sequence key={`slate-${i}`} durationInFrames={sec(SLATE_3_SEC)}>
        <Slate index={i + 1} of={SECTIONS.length} title={s.title} today={s.today} />
      </Series.Sequence>,
      <Series.Sequence key={`body-${i}`} durationInFrames={sec(s.durationSec)}>
        {s.body}
        <NarrationStrip lines={s.lines} endSec={s.linesEndSec} />
      </Series.Sequence>,
    ])}
  </Series>
);

/** Section start times in seconds, for cutting catalogue clips. */
export const STILLS_REEL_3_INDEX = SECTIONS.reduce<{ title: string; startSec: number; durationSec: number }[]>((acc, s) => {
  const prev = acc[acc.length - 1];
  const startSec = (prev ? prev.startSec + prev.durationSec : 0) + SLATE_3_SEC;
  return [...acc, { title: s.title, startSec, durationSec: s.durationSec }];
}, []);
