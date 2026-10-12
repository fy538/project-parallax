/**
 * A static comparison plate for the philosophy channel's illustration grammar.
 * Deliberately separate from the pilot: reviewing a style must not change its film.
 */
import React from "react";
import { Img, staticFile } from "remotion";
import { loadFont as loadNewsreader } from "@remotion/google-fonts/Newsreader";
import { fonts, palette } from "../design/theme";
import { Mind } from "../pilots/shared/scene";

const { fontFamily: newsreader } = loadNewsreader("normal", {
  weights: ["400", "600"],
  subsets: ["latin"],
  ignoreTooManyRequestsWarning: true,
});

type Direction = {
  key: string;
  title: string;
  image: string;
  mark: "chip" | "contour" | "branch";
  headlineFont: string;
  labelFont: string;
  noteFont: string;
  typeNote: string;
  rationale: string;
};

const DIRECTIONS: Direction[] = [
  {
    key: "01 / CURRENT · EDITORIAL LANDSCAPE",
    title: "Who inherits a promise?",
    image: "pilots/promise-and-copy/forest-generated-v1.png",
    mark: "chip",
    headlineFont: fonts.serifBody,
    labelFont: fonts.body,
    noteFont: fonts.metadata,
    typeNote: "PLEX SERIF / SANS / MONO",
    rationale: "A vivid world; a generic machine.",
  },
  {
    key: "02 / ATLAS · ENGRAVED CONTINUITY",
    title: "Who inherits a promise?",
    image: "style-lab/forest-atlas-v1.png",
    mark: "contour",
    headlineFont: newsreader,
    labelFont: newsreader,
    noteFont: fonts.metadata,
    typeNote: "NEWSREADER / PLEX MONO",
    rationale: "One etched language across forms.",
  },
  {
    key: "03 / PRINT · LAYERED POSSIBILITY",
    title: "Who inherits a promise?",
    image: "style-lab/forest-riso-v1.png",
    mark: "branch",
    headlineFont: fonts.serifBody,
    labelFont: fonts.body,
    noteFont: fonts.body,
    typeNote: "PLEX SERIF / PLEX SANS",
    rationale: "Fewer shapes; a visible choice.",
  },
];

const ContourMark: React.FC = () => (
  <g fill="none" strokeLinecap="round" strokeLinejoin="round">
    <circle r="76" stroke={palette.taupe} strokeWidth="1.5" />
    <path d="M-54,-18 C-44,-46 -10,-62 18,-51 C48,-39 60,-14 49,14 C38,42 13,55 -14,47 C-39,41 -56,21 -54,-18Z" stroke={palette.walnut} strokeWidth="2" />
    <path d="M-40,-15 C-30,-36 -6,-47 16,-38 C38,-29 45,-10 36,12 C27,32 8,41 -12,35 C-31,29 -43,9 -40,-15Z" stroke={palette.umber} strokeWidth="1.6" />
    <path d="M-25,-11 C-20,-24 -5,-31 9,-25 C25,-20 29,-6 23,10 C16,23 3,27 -9,23 C-22,17 -30,2 -25,-11Z" stroke={palette.walnut} strokeWidth="1.7" />
    <path d="M-67,26 C-43,22 -36,-9 -13,-10 C12,-11 8,25 32,25 C47,25 55,13 67,2" stroke={palette.gold} strokeWidth="3.5" />
    <circle cx="-67" cy="26" r="4" fill={palette.gold} stroke="none" />
    <circle cx="67" cy="2" r="4" fill={palette.gold} stroke="none" />
    <circle cx="-7" cy="-8" r="5" fill={palette.walnut} stroke="none" />
    <path d="M-48,-54 l-10,-9 M50,-48 l10,-8 M-56,50 l-8,8 M53,48 l8,8" stroke={palette.taupe} strokeWidth="1.5" />
  </g>
);

const BranchMark: React.FC = () => (
  <g strokeLinecap="round" strokeLinejoin="round">
    <circle r="77" fill={palette.bone} stroke={palette.taupe} strokeWidth="1.5" />
    <path d="M-62,-31 C-25,-57 22,-50 54,-64 L64,-32 C21,-17 -5,-23 -44,3Z" fill={palette.sand} />
    <path d="M-62,25 C-18,51 20,42 58,58 L70,28 C27,13 2,17 -45,-7Z" fill={palette.taupe} />
    <path d="M-55,1 H-12 M-12,1 C13,1 22,-24 53,-35 M-12,1 C13,1 22,23 53,35" fill="none" stroke={palette.walnut} strokeWidth="6" />
    <circle cx="-12" cy="1" r="10" fill={palette.gold} stroke={palette.paper} strokeWidth="3" />
    <circle cx="53" cy="-35" r="7" fill={palette.walnut} />
    <circle cx="53" cy="35" r="7" fill={palette.walnut} />
    <path d="M-69,-65 h22 M47,65 h22" stroke={palette.walnut} strokeWidth="2" />
  </g>
);

const Panel: React.FC<{ direction: Direction; x: number }> = ({ direction, x }) => {
  const imageLeft = 288;
  return (
    <div style={{ position: "absolute", left: x, top: 250, width: 570, height: 716, border: `1px solid ${palette.sand}`, background: palette.paper }}>
      <div style={{ position: "absolute", left: 30, top: 28, fontFamily: fonts.metadata, fontSize: 17, letterSpacing: 2, color: palette.umber }}>{direction.key}</div>
      <div style={{ position: "absolute", left: 30, top: 71, fontFamily: direction.headlineFont, fontSize: 42, fontWeight: 600, letterSpacing: -1, color: palette.ink }}>{direction.title}</div>
      <div style={{ position: "absolute", left: imageLeft, top: 222, width: 252, height: 252, overflow: "hidden", borderRadius: "50%", outline: `1px solid ${palette.taupe}`, outlineOffset: 7 }}>
        <Img src={staticFile(direction.image)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
      <svg width="570" height="405" style={{ position: "absolute", top: 202, left: 0, overflow: "visible" }}>
        <path d="M222 146 C246 146 254 148 275 148" fill="none" stroke={palette.gold} strokeWidth="2" />
        {direction.mark === "chip" ? (
          <Mind position={{ x: 144, y: 146 }} label="Successor A" note="remembers the promise" opacity={1} accent={palette.walnut} />
        ) : (
          <>
            <g transform="translate(144 146)">
              {direction.mark === "contour" ? <ContourMark /> : <BranchMark />}
            </g>
            <text x="144" y="271" textAnchor="middle" fontFamily={direction.labelFont} fontSize="32" fontWeight="600" fill={palette.ink}>Successor A</text>
            <text x="144" y="305" textAnchor="middle" fontFamily={direction.noteFont} fontSize="18" fill={palette.umber}>remembers the promise</text>
          </>
        )}
      </svg>
      <div style={{ position: "absolute", left: 30, right: 30, bottom: 71, borderTop: `1px solid ${palette.sand}`, paddingTop: 16, color: palette.umber, fontFamily: fonts.metadata, fontSize: 16, letterSpacing: 1 }}>{direction.typeNote}</div>
      <div style={{ position: "absolute", left: 30, right: 30, bottom: 26, fontFamily: fonts.body, fontSize: 22, color: palette.walnut }}>{direction.rationale}</div>
    </div>
  );
};

export const PhilosophyStyleLab: React.FC = () => (
  <div style={{ position: "absolute", inset: 0, background: palette.paper, color: palette.ink }}>
    <div style={{ position: "absolute", left: 80, top: 50, fontFamily: fonts.metadata, fontSize: 19, letterSpacing: 2, color: palette.umber }}>PARALLAX / VISUAL GRAMMAR STUDY 001</div>
    <div style={{ position: "absolute", right: 80, top: 50, fontFamily: fonts.metadata, fontSize: 19, letterSpacing: 2, color: palette.umber }}>ONE FOREST · THREE SYSTEMS</div>
    <div style={{ position: "absolute", left: 80, top: 97, fontFamily: fonts.serifBody, fontSize: 72, letterSpacing: -2 }}>What should a machine mind look like?</div>
    {DIRECTIONS.map((direction, i) => <Panel key={direction.key} direction={direction} x={80 + i * 594} />)}
    <div style={{ position: "absolute", left: 80, bottom: 35, fontFamily: fonts.metadata, fontSize: 16, color: palette.umber }}>FICTIONAL PHILOSOPHY · STATIC STYLE TEST · NO CLAIM ABOUT AI EXPERIENCE</div>
  </div>
);

const MarkComparisonPanel: React.FC<{ x: number; generated: boolean }> = ({ x, generated }) => (
  <div style={{ position: "absolute", left: x, top: 240, width: 830, height: 744, border: `1px solid ${palette.sand}`, background: palette.paper }}>
    <div style={{ position: "absolute", left: 38, top: 28, fontFamily: fonts.metadata, fontSize: 18, letterSpacing: 2, color: palette.umber }}>
      {generated ? "02 / GENERATED CUT-PAPER MARK" : "01 / CODE-DRAWN SVG MARK"}
    </div>
    <div style={{ position: "absolute", left: 38, top: 82, fontFamily: fonts.serifBody, fontSize: 48, fontWeight: 600, color: palette.ink }}>
      Who inherits a promise?
    </div>
    <div style={{ position: "absolute", left: 500, top: 225, width: 275, height: 275, overflow: "hidden", borderRadius: "50%", outline: `1px solid ${palette.taupe}`, outlineOffset: 7 }}>
      <Img src={staticFile("style-lab/forest-riso-v1.png")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
    </div>
    <svg width="830" height="290" style={{ position: "absolute", top: 230, left: 0, overflow: "visible" }}>
      <path d="M300 135 C380 135 400 137 470 137" fill="none" stroke={palette.gold} strokeWidth="2" />
      {!generated && <g transform="translate(190 135)"><BranchMark /></g>}
    </svg>
    {generated && <Img src={staticFile("style-lab/successor-branch-generated-v1.png")} style={{ position: "absolute", left: 98, top: 275, width: 184, height: 184, objectFit: "contain" }} />}
    <div style={{ position: "absolute", left: 70, top: 530, width: 240, textAlign: "center", fontFamily: fonts.body, fontSize: 32, fontWeight: 600, color: palette.ink }}>Successor A</div>
    <div style={{ position: "absolute", left: 70, top: 572, width: 240, textAlign: "center", fontFamily: fonts.body, fontSize: 19, color: palette.umber }}>remembers the promise</div>
    <div style={{ position: "absolute", left: 38, right: 38, bottom: 75, borderTop: `1px solid ${palette.sand}`, paddingTop: 18, fontFamily: fonts.metadata, fontSize: 17, color: palette.umber }}>
      {generated ? "GENERATED ARTWORK · REMOTION LAYOUT" : "SVG ARTWORK · REMOTION LAYOUT"}
    </div>
    <div style={{ position: "absolute", left: 38, right: 38, bottom: 26, fontFamily: fonts.body, fontSize: 23, color: palette.walnut }}>
      {generated ? "Material and silhouette carry the idea." : "Readable structure, but little visual character."}
    </div>
  </div>
);

export const PhilosophyMarkLab: React.FC = () => (
  <div style={{ position: "absolute", inset: 0, background: palette.paper, color: palette.ink }}>
    <div style={{ position: "absolute", left: 80, top: 50, fontFamily: fonts.metadata, fontSize: 19, letterSpacing: 2, color: palette.umber }}>PARALLAX / VISUAL GRAMMAR STUDY 002</div>
    <div style={{ position: "absolute", right: 80, top: 50, fontFamily: fonts.metadata, fontSize: 19, letterSpacing: 2, color: palette.umber }}>ONE SCENE · TWO MARKS</div>
    <div style={{ position: "absolute", left: 80, top: 97, fontFamily: fonts.serifBody, fontSize: 72, letterSpacing: -2 }}>Should this be an image?</div>
    <MarkComparisonPanel x={80} generated={false} />
    <MarkComparisonPanel x={1010} generated />
    <div style={{ position: "absolute", left: 80, bottom: 35, fontFamily: fonts.metadata, fontSize: 16, color: palette.umber }}>FICTIONAL PHILOSOPHY · STATIC STYLE TEST · NO CLAIM ABOUT AI EXPERIENCE</div>
  </div>
);
