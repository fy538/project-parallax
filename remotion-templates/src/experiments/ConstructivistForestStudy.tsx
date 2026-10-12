/** Non-architectural subject rendered in the original Parallax constructivist idiom. */
import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { palette } from "../design/theme";

export const ConstructivistForestStudy: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: palette.paper }}>
    <Img
      src={staticFile("style-lab/constructivist-forest-score-v2.png")}
      style={{ width: "100%", height: "100%", objectFit: "cover" }}
    />
  </AbsoluteFill>
);
