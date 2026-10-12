import React from "react";
import { Img, staticFile } from "remotion";
import { palette } from "../design/theme";
import { samplePlanting } from "../pilots/WhatWeCount/timeline";

// Coordinates belong to this background plate. The four rear plants predate the
// counted sequence; the four front plants are added by the same event trace.
const SLOTS = [
  { x: 360, y: 377, height: 210, mirror: false },
  { x: 520, y: 370, height: 225, mirror: true },
  { x: 680, y: 363, height: 218, mirror: false },
  { x: 840, y: 356, height: 232, mirror: true },
  { x: 250, y: 439, height: 230, mirror: true },
  { x: 430, y: 432, height: 243, mirror: false },
  { x: 610, y: 425, height: 232, mirror: true },
  { x: 790, y: 418, height: 251, mirror: false },
];

/** Raster pieces retain their drawn silhouette; only placement changes by frame. */
export const IllustratedGrove: React.FC<{ state: ReturnType<typeof samplePlanting> }> = React.memo(function IllustratedGrove({ state }) {
  return <div style={{ position: "absolute", inset: 0 }}>
    <Img src={staticFile("style-lab/forest-empty-ground-v1.png")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
    {SLOTS.map(({ x, y, height, mirror }, id) => {
      const active = state.active?.treeId === id;
      if (id >= state.totalTrees && !active) return null;
      const progress = state.progress;
      const settling = 1 - (1 - progress) ** 3;
      const lift = active ? (state.active?.kind === "new" ? 1 - settling : state.lift) : 0;
      const opacity = active && state.active?.kind === "new" ? Math.min(1, progress * 5) : 1;
      const width = height * 0.67;
      return <React.Fragment key={id}>
        <div style={{ position: "absolute", left: x - 27, top: y - 5, width: 54, height: 12, borderRadius: "50%", backgroundColor: palette.ink, opacity: opacity * (0.21 - lift * 0.08), filter: "blur(3px)" }} />
        {/* Bury the lower root ball beneath the soil; it emerges when lifted. */}
        <div style={{ position: "absolute", inset: 0, clipPath: `inset(0 0 ${608 - y}px 0)` }}>
          <Img src={staticFile("style-lab/forest-sapling-cutout-v1.png")} style={{
            position: "absolute", left: x - width / 2, top: y - height * 0.83 - lift * 64,
            width, height, objectFit: "contain", opacity,
            transformOrigin: "50% 83%", transform: `rotate(${lift * -4}deg) scaleX(${mirror ? -1 : 1})`,
          }} />
        </div>
      </React.Fragment>;
    })}
  </div>;
});
