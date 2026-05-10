/**
 * Shared SVG filter primitives that make geometric shapes read as
 * printed-on-paper rather than computer-rendered. Used by chart
 * templates (DataChart, SankeyFlow, TimeSeriesChart, PricingWaterfall,
 * NetworkDiagram) to escape the slide-deck feel without adding external
 * asset cost.
 *
 * Editorial principle: solid fills don't exist on paper — printed ink has
 * micro-density variation, edges bleed slightly, and paper grain shows
 * through. These filters introduce tiny amounts of each (5-12% intensity)
 * so the chart elements feel handmade without compromising data integrity.
 *
 * Usage:
 *   <svg>
 *     <TextureFilters />  // Inside <defs>; or render once per template.
 *     <rect ... filter="url(#tx-ink-wash)" />
 *     <path ... filter="url(#tx-edge-bleed)" />
 *   </svg>
 *
 * Filters provided:
 *   - tx-ink-wash    : micro-density variation on solid fills (subtle noise)
 *   - tx-edge-bleed  : subtle edge displacement so rectangles aren't crisp
 *   - tx-paper-grain : background overlay grain (use on a full-bleed rect)
 */

import React from "react";

/**
 * Drop-in <defs> contents — render once per SVG (or via a wrapper that
 * mounts a sibling SVG with `<defs>` and references the filters by id).
 */
export const TextureFilters: React.FC<{
  /** Filter intensity 0.0–1.0. Default 0.5 (subtle). 1.0 is heaviest. */
  intensity?: number;
  /** Random seed — different per composition keeps texture from feeling repeated. */
  seed?: number;
}> = ({ intensity = 0.5, seed = 7 }) => {
  const inkAlpha = 0.06 * intensity;
  const bleedScale = 0.5 + intensity * 1.2;
  const grainAlpha = 0.04 + intensity * 0.06;

  return (
    <>
      {/* Ink wash — multiplicative alpha noise over the source fill. The
          turbulence base frequency controls grain "size" — higher = finer.
          We layer two octaves so the noise has both fine and slightly
          coarser variation, like ink absorbed into paper fibers. */}
      <filter id="tx-ink-wash" x="-5%" y="-5%" width="110%" height="110%">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="1.4"
          numOctaves={3}
          seed={seed}
          result="noise"
        />
        <feColorMatrix
          in="noise"
          values={`0 0 0 0 0
                   0 0 0 0 0
                   0 0 0 0 0
                   0 0 0 ${inkAlpha} 0`}
          result="alphaNoise"
        />
        <feComposite in="alphaNoise" in2="SourceGraphic" operator="in" result="textureLayer" />
        <feComposite in="SourceGraphic" in2="textureLayer" operator="over" />
      </filter>

      {/* Edge bleed — micro-displacement of the source. Looks like ink
          slightly bleeding at the edges of a printed shape. Most effective
          on flat color blocks; less needed on text or fine strokes. */}
      <filter id="tx-edge-bleed" x="-5%" y="-5%" width="110%" height="110%">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.04"
          numOctaves={2}
          seed={seed + 1}
          result="bleedNoise"
        />
        <feDisplacementMap
          in="SourceGraphic"
          in2="bleedNoise"
          scale={bleedScale}
          xChannelSelector="R"
          yChannelSelector="G"
        />
      </filter>

      {/* Paper grain — full-tile turbulence at low alpha. Mount as a
          covering <rect> with this filter to lay paper grain over chart
          plot areas. Different from Background.tsx grain (which is at the
          composition root); this is for ZONE-LEVEL emphasis where the
          chart itself wants a slight paper character. */}
      <filter id="tx-paper-grain" x="0%" y="0%" width="100%" height="100%">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="2.5"
          numOctaves={2}
          seed={seed + 2}
          result="grain"
        />
        <feColorMatrix
          in="grain"
          values={`0 0 0 0 0.42
                   0 0 0 0 0.40
                   0 0 0 0 0.36
                   0 0 0 ${grainAlpha} 0`}
        />
      </filter>

      {/* Combined "printed" filter — uses feBlend multiply so the noise
          actually darkens portions of the source rather than masking
          (which the previous composite chain did, producing a no-op).
          Multiply is the canonical "ink on paper" blend mode: where
          noise is darker, source darkens; where noise is white, source
          unchanged. Calibrated so darkest noise reads as ~15% darkening. */}
      <filter id="tx-printed" x="-5%" y="-5%" width="110%" height="110%">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="1.2"
          numOctaves={3}
          seed={seed + 3}
          result="rawNoise"
        />
        {/* Map raw noise (RGB 0..1) into a soft mask: most pixels stay
            near-white (no darkening), occasional dark spots create the
            ink-density variation. */}
        <feColorMatrix
          in="rawNoise"
          values="0 0 0 0 0.85
                  0 0 0 0 0.85
                  0 0 0 0 0.85
                  0 0 0 4 -2.5"
          result="softNoise"
        />
        <feBlend in="SourceGraphic" in2="softNoise" mode="multiply" />
      </filter>

      {/* Pattern-based overlay — alternative for templates where filter
          chains don't render cleanly. Renders a separate <rect> filled
          with this pattern at low opacity over the source shape. */}
      <pattern
        id="tx-stipple"
        x="0"
        y="0"
        width="6"
        height="6"
        patternUnits="userSpaceOnUse"
      >
        <rect width="6" height="6" fill="transparent" />
        <circle cx="1.5" cy="1.5" r="0.5" fill="rgba(0,0,0,0.18)" />
        <circle cx="4.5" cy="3.5" r="0.4" fill="rgba(0,0,0,0.14)" />
        <circle cx="2.5" cy="5" r="0.35" fill="rgba(0,0,0,0.16)" />
      </pattern>
    </>
  );
};
