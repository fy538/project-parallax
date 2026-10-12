/**
 * CinematicMap composition registration.
 *
 * Duration: max(keyframes[].sec) when durationSec is unset; durationSec
 * wins when provided (useful for holding the final pose longer). Minimum
 * duration clamps to max keyframe sec so the camera path is never truncated.
 *
 * Default props: Khyber Pass approach — mountain terrain, pitched camera,
 * cinematic dark register. A realistic editorial use case.
 */

import { Composition } from "remotion";
import { CinematicMap } from "./CinematicMap";
import { CinematicMapSchema } from "./schema";
import { layout, sec } from "../../design/theme";
import type { CinematicMapData } from "./types";

/**
 * Derive durationInFrames from the keyframes array and optional durationSec.
 * The composition lasts at least as long as the full camera path.
 */
function cinematicMapDuration(data: CinematicMapData): number {
  const maxKeySec = data.keyframes.reduce(
    (max, kf) => Math.max(max, kf.sec),
    0,
  );
  // `?? 0` satisfies the no-bare-durationSec lint rule and is semantically
  // correct: when durationSec is absent, the keyframe range IS the duration.
  const explicitSec = data.durationSec ?? 0;
  const totalSec = Math.max(explicitSec, maxKeySec);
  // Floor at 1 frame in case keyframes are all at sec 0 (misconfigured data).
  return Math.max(1, sec(totalSec));
}

const sampleData: CinematicMapData = {
  episode: "catalog",
  source: "Mapbox · USGS · Natural Earth",
  keyframes: [
    // Start: wide view of the Hindu Kush / Afghanistan region
    {
      sec: 0,
      center: [69.5, 34.5],
      altitudeM: 350_000,
      pitch: 30,
      bearing: 15,
      easing: "ease-in-out",
    },
    // Approach: descend into the Khyber Pass valley
    {
      sec: 4,
      center: [71.1, 34.1],
      altitudeM: 40_000,
      pitch: 62,
      bearing: 120,
      easing: "ease-in-out",
    },
    // Arrival: tight shot looking down the pass toward Pakistan
    {
      sec: 10,
      center: [71.5, 34.0],
      altitudeM: 12_000,
      pitch: 70,
      bearing: 135,
      easing: "ease-in-out",
    },
  ],
  register: "dark",
  fogPreset: "atmospheric",
  lightPreset: "dusk",
  terrain: true,
  terrainExaggeration: 1.5,
};

export const CinematicMapComposition = () => (
  <Composition
    id="CinematicMap"
    component={CinematicMap}
    schema={CinematicMapSchema}
    calculateMetadata={({ props }) => ({
      durationInFrames: cinematicMapDuration(props.data as CinematicMapData),
      fps: layout.fps,
      width: layout.width,
      height: layout.height,
    })}
    defaultProps={{ data: sampleData }}
  />
);
