// @composition-animation: delegated
// ReliefUnderlay is a pure SVG sub-component of AtlasPlate — it renders
// inside AtlasPlate's camera-transformed <g> and inherits the parent's
// useCompositionAnimation (Ken Burns drift applied to the outer SVG).
// No independent animation hook needed here.

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
 *   Background paper (outside the SVG)
 *   ↓
 *   <svg> root
 *     ocean rect                 (fills viewport, OUTSIDE <g transform>)
 *     ↓
 *     <g transform={camera}>     (camera scale+translate applied to everything below)
 *       ReliefUnderlay           ← this component (inside the transform group)
 *       ↓
 *       graticule
 *       ↓
 *       country fills            (solid, on top of relief)
 *       ↓
 *       country borders
 *       ↓
 *       disputed boundaries
 *     </g>
 *
 * Critical: ReliefUnderlay lives INSIDE the camera transform so it pans
 * / zooms in lockstep with the country paths. The ocean rect stays
 * OUTSIDE so the viewport stays filled when the camera pulls away from
 * the projected world bbox. Mixing those two layers up would either:
 *   • ocean inside transform → corners go transparent on zoom-out
 *   • relief outside transform → relief stays fixed while countries pan
 *
 * ## Projection support
 *
 * v1 supports the projections listed in `reliefProjections.ts`
 * (equalEarth, naturalEarth, equirectangular). The warp script reads
 * the SAME constant, so adding support for a new projection is a single
 * edit (plus rerunning the warp). Orthographic / albersUsa are not
 * supported — emit a one-shot console warn and render nothing.
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
import { staticFile } from "remotion";
import { warnIf } from "../../utils/dataWarnings";
import type { ProjectionName } from "../../utils/atlasProjection";
import { RELIEF_SUPPORTED_PROJECTIONS } from "./reliefProjections";

// Module-level guard so the missing-asset warning only fires once per
// projection per session, not 30 × per frame for the full duration.
// Keyed by projection NAME (the stable input), not by URL (the output —
// `staticFile()` returns different absolute URLs under Studio vs.
// Lambda, so URL-keying could leak the dedupe across environments).
const warnedProjections = new Set<ProjectionName>();

// Module-level set tracking which projections' assets have failed to
// load (e.g., 404 because the user hasn't run the prepare script). Once
// we've seen the failure, subsequent renders for the same projection
// skip the `<image>` element entirely to suppress the broken-image rect.
const failedProjections = new Set<ProjectionName>();

export interface ReliefUnderlayProps {
  /**
   * The AtlasPlate projection name. We expect a pre-warped raster at
   * `geo/relief/{projection}.png` resolved via Remotion's `staticFile()`.
   * Unsupported projections (orthographic, albersUsa) cause the
   * component to warn-and-render-nothing.
   */
  projection: ProjectionName;
  /** Viewport width — should match AtlasPlate's `layout.width`. */
  width: number;
  /** Viewport height — should match AtlasPlate's `layout.height`. */
  height: number;
  /**
   * Dark mode. When true, the filter inverts the relief so highlights
   * become darks (still warm, but reads as "topographic plate on ink").
   * Default false.
   */
  dark?: boolean;
}

/**
 * Public URL for the pre-warped relief PNG for a given projection.
 * Routes through Remotion's `staticFile()` so the path resolves
 * correctly under both the local dev server (which mounts `public/` at
 * a per-render base) AND Lambda renders (which serve the bundle from a
 * different root). Exported so the asset-acquisition script can use the
 * same path convention.
 */
export const reliefAssetUrl = (projection: ProjectionName): string =>
  staticFile(`geo/relief/${projection}.png`);

const isSupportedProjection = (p: ProjectionName): boolean =>
  (RELIEF_SUPPORTED_PROJECTIONS as ReadonlyArray<string>).includes(p);

export const ReliefUnderlay: React.FC<ReliefUnderlayProps> = ({
  projection,
  width,
  height,
  dark = false,
}) => {
  const reactId = useId().replace(/[^a-zA-Z0-9-]/g, "");
  const filterId = `relief-tint-${reactId}`;

  // Unsupported projection → warn once + render nothing. Orthographic
  // would need a separate per-frame rasterizer (3D sphere rotation);
  // albersUsa is a regional projection that doesn't map to the world
  // raster we ship.
  if (!isSupportedProjection(projection)) {
    warnIf(
      !warnedProjections.has(projection),
      "ReliefUnderlay",
      `Projection "${projection}" is not supported for "atlas-relief" ` +
        `aesthetic in v1. Falls back to plain atlas (no relief). ` +
        `Supported: ${RELIEF_SUPPORTED_PROJECTIONS.join(", ")}. To add ` +
        `support for this projection, append the name to ` +
        `src/templates/AtlasPlate/reliefProjections.ts and rerun ` +
        `scripts/prepare-shaded-relief.mjs.`,
    );
    warnedProjections.add(projection);
    return null;
  }

  // If the asset previously failed to load (per-session), don't keep
  // emitting broken image references. Render nothing — the filter defs
  // are also skipped because they're an unused render cost when no
  // <image> consumes them.
  if (failedProjections.has(projection)) {
    return null;
  }

  const url = reliefAssetUrl(projection);

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
        opacity={0.55}
        filter={`url(#${filterId})`}
        // SVG image has no native onerror in React 18 type defs, but the
        // browser fires it. Track failures so subsequent frames skip.
        onError={() => {
          if (!failedProjections.has(projection)) {
            failedProjections.add(projection);
            if (typeof console !== "undefined") {
              // eslint-disable-next-line no-console
              console.warn(
                `[ReliefUnderlay] Failed to load relief raster at ${url}. ` +
                  `Run \`node scripts/prepare-shaded-relief.mjs\` to generate ` +
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
 * Reset the module-level caches. Exported for tests so the dedupe state
 * can be asserted before / after by toggling the same projection name
 * across multiple calls in one test run. Production code has no reason
 * to call this.
 */
export const __resetReliefCachesForTest = (): void => {
  warnedProjections.clear();
  failedProjections.clear();
};

/**
 * Inspect the warn-dedupe cache. Test-only helper — production code has
 * no reason to read this.
 */
export const __hasWarnedForTest = (projection: ProjectionName): boolean =>
  warnedProjections.has(projection);

/**
 * Inspect the failed-asset cache. Test-only helper.
 */
export const __hasFailedForTest = (projection: ProjectionName): boolean =>
  failedProjections.has(projection);

/**
 * Force a projection into the failed-asset cache. Test-only — used to
 * verify the reset helper actually clears the entry.
 */
export const __markFailedForTest = (projection: ProjectionName): void => {
  failedProjections.add(projection);
};
