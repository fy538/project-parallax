/**
 * ReliefUnderlay — Tom Patterson hand-painted shaded-relief raster
 * underlay for AtlasPlate.
 *
 * The canonical National Geographic / atlas register: country strokes
 * and fills sit on top of a hand-painted shaded-relief background that
 * gives the map physical depth without reading as "satellite photo."
 *
 * Public-domain source: Natural Earth's manual shaded relief raster
 * (Tom Patterson), warped offline into each AtlasPlate projection so
 * the runtime can drop it in as a plain SVG `<image>`. See
 * `tools/shaded-relief-setup.md` for the asset acquisition + warping
 * pipeline.
 *
 * ## Render order
 *
 *   ocean rect              (background)
 *   ↓
 *   ReliefUnderlay          ← this component
 *   ↓
 *   graticule
 *   ↓
 *   country fills           (land color, semi-opaque to let relief peek)
 *   ↓
 *   country borders
 *   ↓
 *   disputed boundaries
 *
 * The component is placed INSIDE AtlasPlate's `<g transform>` group so
 * it pans / zooms with the camera in lockstep with the country paths.
 *
 * ## Projection support
 *
 * v1 supports `equalEarth`, `naturalEarth`, `equirectangular`. The warp
 * script produces one pre-baked PNG per projection (~2 MB each, served
 * from `public/geo/relief/{projection}.png`). Orthographic / albersUsa
 * are not supported — emit a one-shot console warn and render nothing.
 *
 * ## Tinting
 *
 * The raw raster is Tom Patterson's natural earth-tone colors (greens,
 * browns, tans). To blend into the bone/paper editorial palette we
 * apply an SVG `<filter>` that:
 *   1. Desaturates ~70% (`feColorMatrix saturate`)
 *   2. Shifts midtones toward bone (`feComponentTransfer`)
 *   3. Reduces contrast so coastlines don't fight the strokes layer
 * The result reads as "warm grayscale relief" — analogous to NatGeo's
 * 50m raster reuse in their print atlases.
 */

import React, { useId } from "react";
import { warnIf } from "../../utils/dataWarnings";
import type { ProjectionName } from "../../utils/atlasProjection";

// Module-level guard so the missing-asset warning only fires once per
// projection per session, not 30 × per frame for the full duration.
const warnedProjections = new Set<string>();

// Module-level set tracking which relief assets have failed to load
// (e.g., 404 because the user hasn't run the prepare script). Once we've
// seen the failure for a given projection, the SVG `<image>` falls back
// to omitting the href, which suppresses the broken-image rect in Chrome.
const failedAssets = new Set<string>();

export interface ReliefUnderlayProps {
  /**
   * The AtlasPlate projection name. We expect a pre-warped raster at
   * `/geo/relief/{projection}.png`. Unsupported projections (orthographic,
   * albersUsa) cause the component to warn-and-render-nothing.
   */
  projection: ProjectionName;
  /** Viewport width — should match AtlasPlate's `layout.width`. */
  width: number;
  /** Viewport height — should match AtlasPlate's `layout.height`. */
  height: number;
  /**
   * Opacity of the relief layer. Default 0.55 — relief is BACKGROUND
   * texture, not a focal element. Country fills sit on top at full
   * opacity; the relief peeks through ocean rectangles and along
   * country edges where the stroke meets the ocean.
   */
  opacity?: number;
  /**
   * Dark mode. When true, the filter inverts the relief so highlights
   * become darks (still warm, but reads as "topographic plate on ink").
   * Default false.
   */
  dark?: boolean;
}

const SUPPORTED_PROJECTIONS: ReadonlyArray<ProjectionName> = [
  "equalEarth",
  "naturalEarth",
  "equirectangular",
];

/**
 * Public URL for the pre-warped relief PNG for a given projection.
 * Exported so the asset-acquisition script can use the same path
 * convention.
 */
export const reliefAssetUrl = (projection: ProjectionName): string =>
  `/geo/relief/${projection}.png`;

export const ReliefUnderlay: React.FC<ReliefUnderlayProps> = ({
  projection,
  width,
  height,
  opacity = 0.55,
  dark = false,
}) => {
  const reactId = useId().replace(/[^a-zA-Z0-9-]/g, "");
  const filterId = `relief-tint-${reactId}`;

  // Unsupported projection → warn once + render nothing. Orthographic
  // would need a separate per-frame rasterizer (3D sphere rotation);
  // albersUsa is a regional projection that doesn't map to the world
  // raster we ship.
  if (!SUPPORTED_PROJECTIONS.includes(projection)) {
    warnIf(
      !warnedProjections.has(projection),
      "ReliefUnderlay",
      `Projection "${projection}" is not supported for "atlas-relief" ` +
        `aesthetic in v1. Falls back to plain atlas (no relief). ` +
        `Supported: ${SUPPORTED_PROJECTIONS.join(", ")}. To add support ` +
        `for this projection, run \`node tools/prepare-shaded-relief.mjs ` +
        `--projection=${projection}\` after the initial Natural Earth ` +
        `asset download.`,
    );
    warnedProjections.add(projection);
    return null;
  }

  // If the asset previously failed to load (per-session), don't keep
  // emitting broken image references. Render the filter defs only —
  // they're free and let other components dependent on this filter
  // (none today, but a future stroke-on-relief variant could) still work.
  const url = reliefAssetUrl(projection);
  if (failedAssets.has(url)) {
    return null;
  }

  // Filter matrix — different polarity for light vs. dark.
  //
  // Light mode: desaturate Patterson's earth tones into warm grayscale,
  // shift midtones toward bone so the relief blends into the paper
  // palette rather than punching through it as photo-realistic terrain.
  //
  // Dark mode: invert luminance so highlights become darks (ink-toned
  // topography on a dark ground — the National Geographic dark-paper
  // variant). Saturation drop is the same.
  return (
    <>
      <defs>
        <filter
          id={filterId}
          x="0"
          y="0"
          width="100%"
          height="100%"
          // colorInterpolationFilters="sRGB" matches the way Adobe Photoshop
          // and most browsers handle filter chains — without it, Firefox
          // applies the filter in linearRGB and the result reads bluer
          // than intended.
          colorInterpolationFilters="sRGB"
        >
          {/* Step 1 — desaturate ~70% so Patterson's greens / browns
              collapse toward grayscale (with a residual warm tint). */}
          <feColorMatrix type="saturate" values="0.3" />
          {dark ? (
            // Dark mode: invert luminance. R'=1-R, G'=1-G, B'=1-B.
            <feColorMatrix
              type="matrix"
              values="
                -1  0  0  0  1
                 0 -1  0  0  1
                 0  0 -1  0  1
                 0  0  0  1  0
              "
            />
          ) : (
            // Light mode: shift midtones toward bone (F0E6D0).
            // Component transfer applies a gentle gamma on each channel.
            <feComponentTransfer>
              <feFuncR type="gamma" amplitude="1.0" exponent="0.85" offset="0.05" />
              <feFuncG type="gamma" amplitude="0.98" exponent="0.9" offset="0.04" />
              <feFuncB type="gamma" amplitude="0.92" exponent="0.95" offset="0.02" />
            </feComponentTransfer>
          )}
          {/* Step 3 — reduce contrast so coastline detail in the raster
              doesn't compete with the SVG stroke layer above. */}
          <feComponentTransfer>
            <feFuncR type="linear" slope="0.85" intercept="0.075" />
            <feFuncG type="linear" slope="0.85" intercept="0.075" />
            <feFuncB type="linear" slope="0.85" intercept="0.075" />
          </feComponentTransfer>
        </filter>
      </defs>
      <image
        href={url}
        x={0}
        y={0}
        width={width}
        height={height}
        preserveAspectRatio="none"
        opacity={opacity}
        filter={`url(#${filterId})`}
        // SVG image has no native onerror in React 18 type defs, but the
        // browser fires it. Track failures so subsequent frames skip.
        onError={() => {
          if (!failedAssets.has(url)) {
            failedAssets.add(url);
            if (typeof console !== "undefined") {
              // eslint-disable-next-line no-console
              console.warn(
                `[ReliefUnderlay] Failed to load relief raster at ${url}. ` +
                  `Run \`node tools/prepare-shaded-relief.mjs\` to generate ` +
                  `the pre-warped PNG. See tools/shaded-relief-setup.md ` +
                  `for the source raster download step.`,
              );
            }
          }
        }}
      />
    </>
  );
};

/**
 * Reset the module-level caches. Exported for tests; production code has
 * no reason to call this.
 */
export const __resetReliefCachesForTest = (): void => {
  warnedProjections.clear();
  failedAssets.clear();
};
