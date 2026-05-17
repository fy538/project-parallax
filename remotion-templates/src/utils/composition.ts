/**
 * Composition helpers — shared `calculateMetadata` boilerplate for template
 * registrations in `src/templates/<TemplateName>/index.tsx`.
 *
 * Before this helper, every index.tsx hand-rolled this block:
 *
 *   calculateMetadata={({ props }) => ({
 *     durationInFrames: sec((props.data as XData).durationSec ?? N),
 *     fps: layout.fps,
 *     width: layout.width,
 *     height: layout.height,
 *   })}
 *
 * Repeated verbatim across ~49 of 50 registrations, with a slow drift between
 * the `??` (15 files) and `||` (24 files) forms of the duration fallback. The
 * helper collapses the boilerplate AND locks the fallback semantics to `??`
 * (the form the no-bare-durationSec lint rule prefers).
 *
 * Usage:
 *
 *   import { standardMetadata } from "../../utils/composition";
 *   import type { BumpChartData } from "./types";
 *
 *   <Composition
 *     id="BumpChart"
 *     component={BumpChart}
 *     schema={BumpChartSchema}
 *     calculateMetadata={standardMetadata<BumpChartData>(14)}
 *     defaultProps={{ data: sampleData as BumpChartData }}
 *   />
 *
 * The generic parameter `T extends { durationSec?: number }` is structurally
 * compatible with every template's data type since `durationSec` is optional
 * on all of them. Default `defaultSec` should match the template's editorial
 * baseline (most templates: 8s, title cards: 4s, stat reveals: 5s, etc.).
 */

import { layout, sec } from "../design/theme";

interface HasDurationSec {
  durationSec?: number;
}

interface CompositionMetadataArgs<T> {
  props: { data: T };
}

interface CompositionMetadata {
  durationInFrames: number;
  fps: number;
  width: number;
  height: number;
}

/**
 * Returns a `calculateMetadata` callback for a Remotion `<Composition>`.
 *
 * @param defaultSec  Duration in seconds when `data.durationSec` is absent.
 *                    Match the template's editorial baseline (see template
 *                    schemas + per-template dossiers for guidance).
 */
export function standardMetadata<T extends HasDurationSec>(
  defaultSec: number,
): (args: CompositionMetadataArgs<T>) => CompositionMetadata {
  return ({ props }) => ({
    durationInFrames: sec(props.data.durationSec ?? defaultSec),
    fps: layout.fps,
    width: layout.width,
    height: layout.height,
  });
}
