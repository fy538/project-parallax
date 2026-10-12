/**
 * StillsReel5 — the fifth test reel: the five things still unseen after round 4.
 *
 *   Three pinned frames in one clip   Pikaframes: three poses, one continuous shot
 *   A picture turned into a model     Trellis image-to-3D, filmed with a real orbit
 *   Real things in the drawn world    a document on the laptop; a portrait on the
 *                                     shop wall; drawn figures before a photograph
 *   Type in perspective               a quotation lettered on a receding wall
 *   Cut to a voice                    three beats re-cut on the word timings of a
 *                                     synthetic scratch read (a timing aid only,
 *                                     not the narration). These three have sound.
 *
 * Test only: nothing here is wired into an episode manifest.
 */
import React, { useEffect, useState } from "react";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import {
  AbsoluteFill,
  Audio,
  Easing,
  Img,
  OffthreadVideo,
  Sequence,
  Series,
  continueRender,
  delayRender,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { fonts, fontSizes, palette, sec } from "../design/theme";
import { CLAMP, CLAMP_DECELERATE, fadeIn } from "../utils/animation";
import { type Framing, type Line, type Shot, H, MOVE, NarrationStrip, Slate, StillShots, W, still } from "./StillsReel";
import { CUTOUT_SCALE, FULL_IMG, K, RATER_STRIPS } from "./StillsReel2";
import { type Pt, FRAME_QUAD, SCREEN, quadToQuad } from "./StillsReel4";

type Ease = Parameters<typeof interpolate>[3];
const IN_OUT = { ...CLAMP, easing: Easing.inOut(Easing.cubic) };
const at = (frame: number, fromSec: number, toSec: number, ease: Ease = CLAMP_DECELERATE) =>
  interpolate(frame, [sec(fromSec), sec(toSec)], [0, 1], ease);
const test = (name: string) => staticFile(`episodes/ai-care-motives/stills-test/${name}`);
const real = (name: string) => staticFile(`episodes/ai-care-motives/stills/${name}`);
const INK_FILL: React.CSSProperties = { backgroundColor: palette.ink, overflow: "hidden" };
const SHEET_PAPER = "#FBF1DF"; // the paper of the spot-illustration sheet

const Tag: React.FC<{ text: string }> = ({ text }) => (
  <div style={{ position: "absolute", left: 20, top: 20, padding: "8px 16px", backgroundColor: palette.ink, color: palette.bone, fontFamily: fonts.metadata, fontSize: fontSizes.readable, letterSpacing: 2, textTransform: "uppercase" }}>
    {text}
  </div>
);

// ── Three pinned frames in one clip ──────────────────────────────────────────

const KEYFRAME_SEC = 6;
const ThreeKeyframes: React.FC = () => (
  <AbsoluteFill style={INK_FILL}>
    <OffthreadVideo src={test("r5-clip-pika.mp4")} muted style={FULL_IMG} />
    <Tag text="Pikaframes · three keyframes · $0.36" />
  </AbsoluteFill>
);

// ── A picture turned into a model ────────────────────────────────────────────

/** Moves the camera round the model on a level circle. */
const Orbit: React.FC<{ angleDeg: number; distance: number; height: number }> = ({ angleDeg, distance, height }) => {
  const camera = useThree((s) => s.camera);
  const a = (angleDeg * Math.PI) / 180;
  camera.position.set(Math.sin(a) * distance, height, Math.cos(a) * distance);
  camera.lookAt(0, 0, 0);
  camera.updateProjectionMatrix();
  return null;
};

/**
 * Draws the scene once the model has arrived, then lets the frame be captured.
 * The canvas only redraws when the frame number changes, so a model that loads
 * mid-frame would otherwise be missing from that frame.
 */
const DrawThenRelease: React.FC<{ ready: boolean; handle: number }> = ({ ready, handle }) => {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  useEffect(() => {
    if (!ready) return;
    gl.render(scene, camera);
    continueRender(handle);
  }, [ready, handle, gl, scene, camera]);
  return null;
};

const Model: React.FC<{ file: string; fromDeg: number; toDeg: number; durationSec: number; turnDeg?: number }> = ({
  file,
  fromDeg,
  toDeg,
  durationSec,
  turnDeg = 0,
}) => {
  const frame = useCurrentFrame();
  const [loaded, setLoaded] = useState<{ scene: THREE.Object3D; floor: number } | null>(null);
  const [handle] = useState(() => delayRender(`Loading ${file}`));

  useEffect(() => {
    new GLTFLoader().load(
      test(file),
      (gltf) => {
        const root = gltf.scene;
        // Centre it and fit its longest side to the frame, whatever size it came in.
        const box = new THREE.Box3().setFromObject(root);
        const size = box.getSize(new THREE.Vector3());
        const centre = box.getCenter(new THREE.Vector3());
        root.position.sub(centre);
        const holder = new THREE.Group();
        holder.add(root);
        holder.scale.setScalar(Math.min(2 / size.y, 3.1 / Math.max(size.x, size.z)));
        // Unlit: the drawing's own flat colours, with no shading added by the renderer.
        root.traverse((node) => {
          const mesh = node as THREE.Mesh;
          if (!mesh.isMesh) return;
          const source = mesh.material as THREE.MeshStandardMaterial;
          mesh.material = new THREE.MeshBasicMaterial({ map: source.map ?? null, vertexColors: source.vertexColors });
        });
        setLoaded({ scene: holder, floor: -(size.y * holder.scale.y) / 2 - 0.01 });
      },
      undefined,
      () => continueRender(handle),
    );
  }, [file, handle]);


  const angle = fromDeg + (toDeg - fromDeg) * interpolate(frame, [0, sec(durationSec)], [0, 1], { ...CLAMP, easing: Easing.inOut(Easing.sin) });
  return (
    <AbsoluteFill style={{ backgroundColor: SHEET_PAPER }}>
      <ThreeCanvas width={W} height={H} flat camera={{ fov: 26, near: 0.1, far: 100 }}>
        <Orbit angleDeg={angle} distance={6.2} height={0.5} />
        {loaded && (
          <group rotation={[0, (turnDeg * Math.PI) / 180, 0]}>
            <primitive object={loaded.scene} />
          </group>
        )}
        <DrawThenRelease ready={loaded !== null} handle={handle} />
        {/* A soft contact shadow, so it stands on something. */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, loaded?.floor ?? -1.01, 0]}>
          <circleGeometry args={[1.25, 48]} />
          <meshBasicMaterial color={palette.walnut} transparent opacity={0.16} />
        </mesh>
      </ThreeCanvas>
      <Tag text="Trellis image-to-3D · $0.02" />
    </AbsoluteFill>
  );
};

const MODEL_SEC = 6.5;

// ── Real things in the drawn world ───────────────────────────────────────────

/** The EPA notice excerpt on a page: the crop is 2230×980. */
const PAGE = { cropW: 1680, cropH: (1680 * 980) / 2230 };
const PAGE_LEFT = (W - PAGE.cropW) / 2;
const PAGE_TOP = (H - PAGE.cropH) / 2;
/** The two phrases to mark, as percentages of the crop (from the episode's own card). */
const MARKS = [
  { x: 77.65, y: 53.2, w: 15.2, h: 4.8, atSec: 5.6 },
  { x: 5.39, y: 58.9, w: 64.1, h: 5, atSec: 6.1 },
];

const NoticePage: React.FC<{ frame: number }> = ({ frame }) => (
  <div style={{ position: "absolute", inset: 0, backgroundColor: palette.paper }}>
    <Img src={real("doc-epa-nov-p3.png")} style={{ position: "absolute", left: PAGE_LEFT, top: PAGE_TOP, width: PAGE.cropW, height: PAGE.cropH, mixBlendMode: "multiply" }} />
    {MARKS.map((m, i) => (
      <div
        key={i}
        style={{
          position: "absolute",
          left: PAGE_LEFT + (m.x / 100) * PAGE.cropW,
          top: PAGE_TOP + (m.y / 100) * PAGE.cropH,
          width: (m.w / 100) * PAGE.cropW,
          height: (m.h / 100) * PAGE.cropH,
          backgroundColor: palette.gold,
          opacity: 0.5,
          mixBlendMode: "multiply",
          transformOrigin: "0 50%",
          transform: `scaleX(${at(frame, m.atSec, m.atSec + 0.5)})`,
        }}
      />
    ))}
  </div>
);

const DocumentOnScreen: React.FC = () => {
  const frame = useCurrentFrame();
  const dive = at(frame, 2.2, 4.8, IN_OUT);
  const target = SCREEN.map(([x, y], n) => [x + (FRAME_QUAD[n][0] - x) * dive, y + (FRAME_QUAD[n][1] - y) * dive] as Pt);
  return (
    <AbsoluteFill style={INK_FILL}>
      <div style={{ position: "absolute", left: 0, top: 0, width: W, height: H, transformOrigin: "0 0", transform: quadToQuad(SCREEN, target) }}>
        <Img src={still("desk-plate")} style={FULL_IMG} />
        <div style={{ position: "absolute", left: 0, top: 0, width: W, height: H, transformOrigin: "0 0", transform: quadToQuad(FRAME_QUAD, SCREEN), opacity: at(frame, 0.8, 1.4) }}>
          <NoticePage frame={frame} />
        </div>
        <Img src={still("desk-figure", "png")} style={FULL_IMG} />
      </div>
    </AbsoluteFill>
  );
};

/** Kant's engraved portrait, framed and hung on the shop's pale wall (frame pixels). */
const FRAME_ON_WALL = { x: 690, y: 176, w: 150, h: 232 };
const portraitOnWall = (frame: number) => (
  <div
    style={{
      position: "absolute",
      left: FRAME_ON_WALL.x,
      top: FRAME_ON_WALL.y,
      width: FRAME_ON_WALL.w,
      height: FRAME_ON_WALL.h,
      border: `7px solid ${palette.midnight}`,
      boxShadow: `5px 8px 10px ${palette.ink}`,
      backgroundColor: palette.sand,
      overflow: "hidden",
      opacity: fadeIn(frame, sec(1.2), sec(0.8)),
    }}
  >
    <Img src={real("arch-kant.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover", filter: "sepia(0.35) brightness(0.86)" }} />
    {/* The wall's own diagonal light falls across the glass. */}
    <div style={{ position: "absolute", inset: 0, background: `linear-gradient(135deg, transparent 35%, ${palette.ink} 130%)`, opacity: 0.55 }} />
  </div>
);
const PORTRAIT: Shot[] = [
  { startSec: 0, endSec: 7, from: { cx: 0.5, cy: 0.5, zoom: 1 }, to: { cx: 0.42, cy: 0.3, zoom: 2.2 }, ease: "glide", states: [{ src: still("shop-watched-uhd") }], overlay: portraitOnWall },
];

/** The drawn raters, standing in front of a photograph of the plant. */
const Collage: React.FC = () => {
  const frame = useCurrentFrame();
  const push = interpolate(frame, [0, sec(7.5)], [0, 1], MOVE);
  const scale = 0.82;
  const rowWidth = W * scale;
  const left = (W - rowWidth) / 2;
  const top = H - 1482 * CUTOUT_SCALE * scale - 30;
  const strips: [number, number][] = [...RATER_STRIPS.slice(0, 5), [782, 962], ...RATER_STRIPS.slice(5)];
  const files = ["crowd-rater-1", "crowd-rater-2", "crowd-rater-3", "crowd-rater-4", "crowd-rater-5", "crowd-figure", "crowd-rater-6", "crowd-rater-7", "crowd-rater-8", "crowd-rater-9"];
  return (
    <AbsoluteFill style={INK_FILL}>
      <Img src={real("arch-vw-wolfsburg.jpg")} style={{ ...FULL_IMG, filter: "sepia(0.45) saturate(0.75) brightness(0.82)", transform: `scale(${1.02 + 0.06 * push})`, transformOrigin: "40% 45%" }} />
      <div style={{ position: "absolute", inset: 0, transform: `scale(${1 + 0.02 * push})`, transformOrigin: "50% 100%", filter: `drop-shadow(0px 10px 14px ${palette.ink})` }}>
        {strips.map(([x0, x1], i) => (
          <Img
            key={files[i]}
            src={still(files[i], "png")}
            style={{ position: "absolute", left: left + x0 * K * scale, top, width: (x1 - x0) * K * scale, height: 1482 * CUTOUT_SCALE * scale, opacity: fadeIn(frame, sec(0.6 + Math.abs(i - 4.5) * 0.12), sec(0.5)) }}
          />
        ))}
      </div>
    </AbsoluteFill>
  );
};

// ── Type in perspective ──────────────────────────────────────────────────────

/** The panelled wall under the shop window, in frame pixels: TL, TR, BR, BL. */
const WALL: Pt[] = [[24, 650], [596, 566], [580, 800], [24, 968]];
const LETTERING = { w: 1100, h: 400 };
const wallLettering = (frame: number) => (
  <div style={{ position: "absolute", left: 0, top: 0, width: LETTERING.w, height: LETTERING.h, transformOrigin: "0 0", transform: quadToQuad([[0, 0], [LETTERING.w, 0], [LETTERING.w, LETTERING.h], [0, LETTERING.h]], WALL) }}>
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: 18,
        paddingLeft: 50,
        color: palette.bone,
        opacity: 0.8,
        fontFamily: fonts.display,
        fontWeight: 600,
        fontSize: 82,
        letterSpacing: 5,
        lineHeight: 1,
        clipPath: `inset(0 ${(1 - at(frame, 2.6, 4.4, IN_OUT)) * 100}% 0 0)`,
      }}
    >
      <div>A CHILD BUYS OF HIM</div>
      <div>AS WELL AS ANY OTHER</div>
    </div>
  </div>
);
const WALL_TYPE: Shot[] = [
  { startSec: 0, endSec: 8.5, from: { cx: 0.5, cy: 0.5, zoom: 1 }, to: { cx: 0.3, cy: 0.66, zoom: 1.75 }, ease: "glide", states: [{ src: still("shop-watched-uhd") }], overlay: wallLettering },
];

// ── Cut to a voice ───────────────────────────────────────────────────────────
// Cut times below come from the word timings of the scratch read
// (episodes/ai-care-motives/assets/scratch-voice/words.json), plus the 0.3 s the
// voice waits before it starts. A cut lands a tenth of a second before its word.

const VOICE_LEAD = 0.3;
const Voice: React.FC<{ name: string }> = ({ name }) => (
  <Sequence from={sec(VOICE_LEAD)} layout="none">
    <Audio src={test(`r5-voice-${name}.mp3`)} />
  </Sequence>
);
const ScratchNote: React.FC = () => (
  <div style={{ position: "absolute", right: 20, top: 20, padding: "8px 16px", backgroundColor: palette.ink, color: palette.taupe, fontFamily: fonts.metadata, fontSize: 22, letterSpacing: 1.5 }}>
    SYNTHETIC SCRATCH VOICE · TIMING ONLY
  </div>
);

// "You've probably asked an AI whether your idea is good. The startup. The essay. The plan…"
const VOICE_OPEN: Shot[] = [
  { startSec: 0, endSec: 3.66, from: { cx: 0.5, cy: 0.5, zoom: 1.04 }, to: { cx: 0.52, cy: 0.5, zoom: 1.1 }, states: [{ src: still("desk-night-uhd") }] },
  { startSec: 3.66, endSec: 4.74, from: { cx: 0.5, cy: 0.5, zoom: 1.04 }, to: { cx: 0.5, cy: 0.5, zoom: 1.08 }, states: [{ src: still("montage-startup-hd") }] }, // "The startup." at 3.46
  { startSec: 4.74, endSec: 5.88, from: { cx: 0.5, cy: 0.5, zoom: 1.04 }, to: { cx: 0.5, cy: 0.5, zoom: 1.08 }, states: [{ src: still("montage-essay-hd") }] }, // "The essay." at 4.54
  { startSec: 5.88, endSec: 8.6, from: { cx: 0.5, cy: 0.5, zoom: 1.02 }, to: { cx: 0.56, cy: 0.52, zoom: 1.12 }, states: [{ src: still("montage-plan-hd") }] }, // "The plan…" at 5.68
];

// "There's another complication. When a lab says… And researchers have found… So what does…"
const CROWD = still("crowd-4k");
const CROWD_NOTICES = still("crowd-notices-4k");
const FIGURE: Framing = { cx: 0.529, cy: 0.385, zoom: 2.6 };
const VOICE_DETAILS: Shot[] = [
  { startSec: 0, endSec: 2.13, from: { cx: 0.5, cy: 0.5, zoom: 1 }, to: { cx: 0.5, cy: 0.48, zoom: 1.04 }, states: [{ src: CROWD }] },
  { startSec: 2.13, endSec: 5.87, from: { cx: 0.22, cy: 0.41, zoom: 2.3 }, to: { cx: 0.4, cy: 0.41, zoom: 2.3 }, states: [{ src: CROWD }] }, // "When" at 1.93
  // "And" at 5.67; the head turns on "distinguish" at 8.20
  { startSec: 5.87, endSec: 12.42, from: FIGURE, to: { ...FIGURE, zoom: 2.75 }, states: [{ src: CROWD }, { src: CROWD_NOTICES, atSec: 8.5 - 5.87 }] },
  { startSec: 12.42, endSec: 17.2, from: { cx: 0.529, cy: 0.4, zoom: 1.6 }, to: { cx: 0.5, cy: 0.5, zoom: 1 }, states: [{ src: CROWD_NOTICES }] }, // "So" at 12.22
];

// "A shepherd finds a ring. Turn it, and you vanish. … 'No man would keep his hands off…'"
const PANEL_ASPECT = 1648 / 1328;
const PANEL_CUTS = [0, 1.05, 1.84, 2.75, 11.26, 16.4]; // ring. · Turn · vanish. · No man… · market.
const GYGES_SEC = 18.2;
const VoiceStoryboard: React.FC = () => {
  const frame = useCurrentFrame();
  const current = PANEL_CUTS.filter((t) => frame >= sec(t)).length;
  const from = PANEL_CUTS[current - 1];
  const to = PANEL_CUTS[current] ?? GYGES_SEC;
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
const spoken = (words: [number, string][]): Line[] => words.map(([t, text]) => ({ atSec: t + VOICE_LEAD, text }));

const SECTIONS: Section[] = [
  {
    title: "Three pinned frames in one clip",
    today: "Alone in the water, the grasp, the pull: three pictures given to one model as keyframes. One take.",
    durationSec: KEYFRAME_SEC,
    body: <ThreeKeyframes />,
    lines: one("Now you're the one in the water. A stranger pulls you out of the river."),
    linesEndSec: 5.6,
  },
  {
    title: "A picture turned into a model",
    today: "The shopkeeper spot illustration, made into a 3D model and filmed with a real orbit.",
    durationSec: MODEL_SEC,
    body: <Model file="r5-shopkeeper.glb" fromDeg={-50} toDeg={50} durationSec={MODEL_SEC} />,
    lines: [],
    linesEndSec: 0,
  },
  {
    title: "A picture turned into a model, again",
    today: "The car, cropped from its scene. The model has to invent every side the picture does not show.",
    durationSec: MODEL_SEC,
    body: <Model file="r5-car.glb" fromDeg={-70} toDeg={70} durationSec={MODEL_SEC} />,
    lines: [],
    linesEndSec: 0,
  },
  {
    title: "A real document on the screen",
    today: "The EPA notice itself sits on the drawn laptop; the camera goes in and the evidence takes the frame.",
    durationSec: 10,
    body: <DocumentOnScreen />,
    lines: one("Its diesel cars carried software designed to recognize an official test."),
    linesEndSec: 8,
  },
  {
    title: "A real portrait on the wall",
    today: "The 1791 engraving of Kant, framed and hung in the drawn shop.",
    durationSec: 7,
    body: <StillShots shots={PORTRAIT} />,
    lines: one("Immanuel Kant described a shop like this.", 1.4),
    linesEndSec: 5.4,
  },
  {
    title: "Drawn figures, real photograph",
    today: "The cut-out raters stand in front of a photograph of the Wolfsburg plant.",
    durationSec: 7.5,
    body: <Collage />,
    lines: one("The testers were real. The tests were real. Engineers built the software to beat them on purpose."),
    linesEndSec: 7,
  },
  {
    title: "Type in perspective",
    today: "Kant's phrase lettered on the receding wall under the window.",
    durationSec: 8.5,
    body: <StillShots shots={WALL_TYPE} />,
    lines: one("His dealer charges everyone the same, “so that a child buys of him as well as any other.”"),
    linesEndSec: 7.6,
  },
  {
    title: "Cut to a voice: a list",
    today: "With sound. The montage from reel 3, re-cut on the word timings of a synthetic scratch read.",
    durationSec: 8.6,
    body: (
      <>
        <StillShots shots={VOICE_OPEN} />
        <Voice name="open" />
        <ScratchNote />
      </>
    ),
    lines: spoken([[0.06, "You've probably asked an AI whether your idea is good."], [3.46, "The startup."], [4.54, "The essay."], [5.68, "The plan you haven't told anyone yet."]]),
    linesEndSec: 8.2,
  },
  {
    title: "Cut to a voice: framed details",
    today: "With sound. The crowd still from reel 1; every cut and the head turn now land on spoken words.",
    durationSec: 17.2,
    body: (
      <>
        <StillShots shots={VOICE_DETAILS} />
        <Voice name="test" />
        <ScratchNote />
      </>
    ),
    lines: spoken([
      [0.05, "There's another complication."],
      [1.93, "When a lab says a model behaves well, that's a test result."],
      [5.67, "And researchers have found that AI models can distinguish test conversations from real ones better than chance."],
      [12.22, "So what does a good result mean if the system can recognize the test?"],
    ]),
    linesEndSec: 16.4,
  },
  {
    title: "Cut to a voice: the storyboard",
    today: "With sound. The six Gyges panels, each cut on its word.",
    durationSec: GYGES_SEC,
    body: (
      <>
        <VoiceStoryboard />
        <Voice name="gyges" />
        <ScratchNote />
      </>
    ),
    lines: spoken([
      [0.05, "A shepherd finds a ring."],
      [1.64, "Turn it, and you vanish."],
      [3.59, "Glaucon asks us to imagine giving one ring to a just man and another to an unjust man."],
      [8.8, "He argues they would behave alike."],
      [11.06, "“No man would keep his hands off what was not his own when he could safely take what he liked out of the market.”"],
    ]),
    linesEndSec: 17.2,
  },
];

const SLATE_5_SEC = 2;

export const STILLS_REEL_5_DURATION = SECTIONS.reduce((total, s) => total + sec(SLATE_5_SEC) + sec(s.durationSec), 0);

export const StillsReel5: React.FC = () => (
  <Series>
    {SECTIONS.flatMap((s, i) => [
      <Series.Sequence key={`slate-${i}`} durationInFrames={sec(SLATE_5_SEC)}>
        <Slate index={i + 1} of={SECTIONS.length} title={s.title} today={s.today} />
      </Series.Sequence>,
      <Series.Sequence key={`body-${i}`} durationInFrames={sec(s.durationSec)}>
        {s.body}
        <NarrationStrip lines={s.lines} endSec={s.linesEndSec} />
      </Series.Sequence>,
    ])}
  </Series>
);
