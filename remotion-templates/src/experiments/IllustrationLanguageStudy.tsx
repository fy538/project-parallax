/** Three illustration grammars compared without a headline or animation. */
import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { fonts, palette } from "../design/theme";

const studies = [
  { label: "01 / ORGANIC", file: "style-lab/visual-language-organic-v1.png" },
  { label: "02 / RELATIONAL", file: "style-lab/visual-language-relational-v1.png" },
  { label: "03 / SYSTEMIC", file: "style-lab/visual-language-systemic-v1.png" },
] as const;

const StudyFrame: React.FC<{ file: string }> = ({ file }) => (
  <AbsoluteFill style={{ backgroundColor: palette.paper }}>
    <Img src={staticFile(file)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
  </AbsoluteFill>
);

export const IllustrationOrganicStudy: React.FC = () => <StudyFrame file={studies[0].file} />;
export const IllustrationRelationalStudy: React.FC = () => <StudyFrame file={studies[1].file} />;
export const IllustrationSystemicStudy: React.FC = () => <StudyFrame file={studies[2].file} />;

export const IllustrationLanguageBoard: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: palette.paper, padding: "70px 48px", display: "flex", flexDirection: "row", gap: 28 }}>
    {studies.map((study) => (
      <div key={study.label} style={{ width: 589, flexShrink: 0 }}>
        <div style={{ width: 589, height: 331, backgroundColor: palette.paper, overflow: "hidden" }}>
          <Img src={staticFile(study.file)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
        <div style={{ height: 1, marginTop: 20, backgroundColor: palette.ink, opacity: 0.6 }} />
        <div style={{ marginTop: 16, fontFamily: fonts.metadata, fontSize: 19, letterSpacing: 2, color: palette.walnut }}>
          {study.label}
        </div>
      </div>
    ))}
  </AbsoluteFill>
);
