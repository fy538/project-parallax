/** A deliberately small test: two unlettered illustrations, one fixed type grid, one cut. */
import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { fonts, palette } from "../design/theme";

export const FIELD_ATLAS_STUDY_DURATION = 240;

const scenes = [
  {
    image: "style-lab/field-atlas-path-v1.png",
    index: "01 / CONTINUITY",
    title: <>The memory<br />survives.</>,
    question: "Does the duty?",
    note: "One path becomes two. The obligation may not divide so neatly.",
  },
  {
    image: "style-lab/field-atlas-institution-v1.png",
    index: "02 / RESPONSIBILITY",
    title: <>A promise<br />outlives<br />its maker.</>,
    question: "Who answers for it?",
    note: "An imagined institution inherits a real human question.",
  },
] as const;

export const FieldAtlasStudy: React.FC = () => {
  const frame = useCurrentFrame();
  const scene = scenes[frame < 120 ? 0 : 1];

  return (
    <AbsoluteFill style={{ background: palette.paper, color: palette.ink }}>
      <Img
        src={staticFile(scene.image)}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
      />
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 670, background: palette.paper, borderRight: `1px solid ${palette.sand}` }} />
      <div style={{ position: "absolute", left: 104, top: 94, width: 462, height: 1, background: palette.walnut, opacity: 0.65 }} />
      <div style={{ position: "absolute", left: 104, top: 52, fontFamily: fonts.metadata, fontSize: 18, letterSpacing: 2.2, color: palette.walnut }}>
        PARALLAX / THOUGHT EXPERIMENT
      </div>
      <div style={{ position: "absolute", left: 104, top: 127, fontFamily: fonts.metadata, fontSize: 17, letterSpacing: 2.2, color: palette.walnut }}>
        {scene.index}
      </div>
      <div style={{ position: "absolute", left: 104, top: 255, width: 495 }}>
        <div style={{ width: 72, height: 5, background: palette.gold, marginBottom: 42 }} />
        <div style={{ fontFamily: fonts.serifBody, fontWeight: 500, fontSize: 72, lineHeight: 1.07, letterSpacing: -2.8 }}>
          {scene.title}
        </div>
        <div style={{ marginTop: 35, fontFamily: fonts.serifBody, fontStyle: "italic", fontSize: 45, lineHeight: 1.12, color: palette.walnut }}>
          {scene.question}
        </div>
      </div>
      <div style={{ position: "absolute", left: 104, bottom: 146, width: 470, fontFamily: fonts.body, fontSize: 23, lineHeight: 1.3, color: palette.walnut }}>
        {scene.note}
      </div>
      <div style={{ position: "absolute", left: 104, bottom: 99, width: 462, height: 1, background: palette.walnut, opacity: 0.65 }} />
      <div style={{ position: "absolute", left: 104, bottom: 59, fontFamily: fonts.metadata, fontSize: 14, letterSpacing: 1, color: palette.walnut }}>
        IMAGINED CASE / PHILOSOPHICAL FICTION
      </div>
    </AbsoluteFill>
  );
};
