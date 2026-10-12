/** Same idea and type grid; only the illustration treatment changes. */
import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { fonts, palette } from "../design/theme";

export const CLEAN_ILLUSTRATION_STUDY_DURATION = 240;

const candidates = [
  { image: "style-lab/promise-threshold-graphic-v1.png", label: "01 / GRAPHIC SILHOUETTE" },
  { image: "style-lab/promise-threshold-collage-v1.png", label: "02 / LAYERED COLLAGE" },
] as const;

export const CleanIllustrationStudy: React.FC = () => {
  const frame = useCurrentFrame();
  const candidate = candidates[frame < 120 ? 0 : 1];

  return (
    <AbsoluteFill style={{ background: palette.paper, color: palette.ink }}>
      <Img src={staticFile(candidate.image)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 560, background: palette.paper, borderRight: `1px solid ${palette.sand}` }} />
      <div style={{ position: "absolute", left: 80, top: 58, fontFamily: fonts.metadata, fontSize: 17, letterSpacing: 2, color: palette.walnut }}>
        PARALLAX / VISUAL STUDY
      </div>
      <div style={{ position: "absolute", left: 80, top: 99, width: 400, height: 1, background: palette.walnut }} />
      <div style={{ position: "absolute", left: 80, top: 137, fontFamily: fonts.metadata, fontSize: 16, letterSpacing: 1.6, color: palette.walnut }}>
        {candidate.label}
      </div>
      <div style={{ position: "absolute", left: 80, top: 310, width: 420 }}>
        <div style={{ width: 64, height: 5, background: palette.gold, marginBottom: 38 }} />
        <div style={{ fontFamily: fonts.serifBody, fontSize: 65, lineHeight: 1.06, letterSpacing: -2.3, fontWeight: 500 }}>
          The memory<br />survives.
        </div>
        <div style={{ marginTop: 39, fontFamily: fonts.serifBody, fontSize: 44, lineHeight: 1.12, fontStyle: "italic", color: palette.walnut }}>
          Does the duty?
        </div>
      </div>
      <div style={{ position: "absolute", left: 80, bottom: 98, width: 400, height: 1, background: palette.walnut }} />
      <div style={{ position: "absolute", left: 80, bottom: 61, fontFamily: fonts.metadata, fontSize: 14, letterSpacing: 1, color: palette.walnut }}>
        IMAGINED CASE / PHILOSOPHICAL FICTION
      </div>
    </AbsoluteFill>
  );
};
