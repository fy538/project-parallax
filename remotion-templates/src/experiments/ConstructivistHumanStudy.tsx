/** Human/social counterpart to the non-architectural forest style study. */
import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { fonts, palette } from "../design/theme";

const humanFile = "style-lab/constructivist-human-cost-v2.png";
const forestFile = "style-lab/constructivist-forest-score-v2.png";

export const ConstructivistHumanStudy: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: palette.paper }}>
    <Img src={staticFile(humanFile)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
  </AbsoluteFill>
);

export const ConstructivistRangeBoard: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: palette.paper, display: "flex", flexDirection: "row", gap: 40, padding: "48px 40px" }}>
    {[
      { file: forestFile, label: "01 / FOREST SCORE" },
      { file: humanFile, label: "02 / HIDDEN HUMAN COST" },
    ].map(({ file, label }) => (
      <div key={label} style={{ width: 900, flexShrink: 0 }}>
        <div style={{ width: 900, height: 506, overflow: "hidden", backgroundColor: palette.paper }}>
          <Img src={staticFile(file)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
        <div style={{ height: 1, marginTop: 20, backgroundColor: palette.ink, opacity: 0.6 }} />
        <div style={{ marginTop: 17, fontFamily: fonts.metadata, color: palette.walnut, fontSize: 18, letterSpacing: 2 }}>
          {label}
        </div>
      </div>
    ))}
  </AbsoluteFill>
);
