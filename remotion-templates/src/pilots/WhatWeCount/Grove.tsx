import React from "react";
import { palette } from "../../design/theme";
import { PineTree } from "../shared/scene";
import { samplePlanting } from "./timeline";

// Four original trees at the back; four new trees at the front. Every mark counts.
const SLOTS = [[120, 248], [203, 225], [296, 225], [381, 248], [84, 376], [194, 337], [306, 337], [416, 376]];

export const Grove: React.FC<{ state: ReturnType<typeof samplePlanting> }> = React.memo(function Grove({ state }) {
  return (
    <svg viewBox="0 0 500 500" width="100%" height="100%" aria-label="A grove with four original trees and up to four new trees">
      <rect width="500" height="500" fill={palette.bone} />
      <circle cx="300" cy="101" r="51" fill={palette.gold} opacity="0.5" />
      <path d="M0 235 L103 163 L208 212 L338 151 L500 221 V500 H0Z" fill={palette.sand} />
      <path d="M0 284 Q128 227 273 276 T500 263 V500 H0Z" fill={palette.taupe} opacity="0.68" />
      <path d="M0 367 Q119 302 272 355 T500 335 V500 H0Z" fill={palette.umber} opacity="0.22" />
      <path d="M250 244 Q210 307 263 376 T252 500 H337 Q279 429 299 374 T250 244Z" fill={palette.paper} opacity="0.65" />
      {SLOTS.map(([x, y], id) => {
        const active = state.active?.treeId === id;
        const planted = id < state.totalTrees;
        const lift = active ? (state.active?.kind === "new" ? 1 - state.progress : state.lift) : 0;
        return <g key={id}>
          <ellipse cx={x} cy={y + 9} rx="29" ry="8" fill={palette.walnut} opacity={planted || active ? 0.15 : 0.08} />
          {(planted || active) && <g transform={`translate(${x} ${y - lift * 65}) scale(0.58)`} opacity={active && state.active?.kind === "new" ? Math.min(1, state.progress * 4) : 1}>
            <PineTree color={id < 4 ? palette.walnut : palette.ink} opacity={id < 4 ? 0.65 : 0.9} />
          </g>}
          {active && state.active?.kind === "replant" && <ellipse cx={x} cy={y + 9} rx="36" ry="11" fill="none" stroke={palette.gold} strokeWidth="2.5" />}
        </g>;
      })}
    </svg>
  );
});
