import React from "react";
import { palette } from "../../design/theme";
import { PineTree } from "../shared/scene";

// Fixed geometry: no random seeds, generation service, or per-frame simulation.
const TREES = [
  [40, 323, 1.2], [91, 290, 0.78], [140, 300, 1], [200, 285, 0.62],
  [248, 280, 0.82], [306, 284, 0.74], [367, 297, 1.1], [428, 328, 1.38],
  [4, 430, 1.5], [69, 434, 1.34], [140, 416, 1.12], [349, 426, 1.25],
  [421, 456, 1.62], [477, 429, 1.28],
];

/** A swappable illustration, rendered from the same brand tokens as the diagram. */
export const Forest: React.FC = React.memo(function Forest() {
  return (
    <svg viewBox="0 0 500 500" width="100%" height="100%" aria-label="Illustrated forest">
      <rect width="500" height="500" fill={palette.bone} />
      <circle cx="306" cy="127" r="60" fill={palette.gold} opacity="0.55" />
      <path d="M0 255 L110 173 L213 243 L324 184 L500 257 V500 H0Z" fill={palette.sand} />
      <path d="M0 307 Q125 221 277 293 T500 278 V500 H0Z" fill={palette.taupe} />
      <path d="M0 370 Q170 273 320 336 T500 345 V500 H0Z" fill={palette.umber} opacity="0.55" />
      <path d="M250 283 C232 341 327 358 249 410 Q201 446 185 500 H335 Q254 438 310 402 C359 364 279 331 250 283Z" fill={palette.paper} opacity="0.75" />
      {TREES.map(([x, y, scale], i) => (
        <g key={i} transform={`translate(${x} ${y}) scale(${scale})`}>
          <PineTree color={i < 8 ? palette.walnut : palette.ink} opacity={i < 8 ? 0.65 : 0.86} />
        </g>
      ))}
      <path d="M0 469 Q70 441 135 477 M340 476 Q414 443 500 466" fill="none" stroke={palette.gold} strokeWidth="2" />
    </svg>
  );
});
