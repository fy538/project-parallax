import { Composition } from "remotion";
import { layout, sec } from "../../design/theme";
import { AudioPreview, type AudioPreviewData } from "./AudioPreview";
import type { SoundCue, TextureCue } from "../Episodes/FullEpisode";
import siliconTrapManifest from "../../../data/episodes/silicon-trap/assembly-manifest.json";

export { AudioPreview, type AudioPreviewData } from "./AudioPreview";

/**
 * Build AudioPreviewData from a manifest by extracting the audio fields.
 * Mirrors the same projection FullEpisode does on its segments.
 */
function dataFromManifest(manifest: unknown): AudioPreviewData {
  const m = manifest as {
    episode: string;
    totalDurationSec: number;
    musicBed?: { tracks: AudioPreviewData["musicBedTracks"] };
    beats?: AudioPreviewData["beats"];
    segments: Array<{
      id: string;
      startSec: number;
      endSec: number;
      soundCue?: SoundCue;
      soundCueSecondary?: SoundCue;
      textureCues?: TextureCue[];
    }>;
  };

  const segmentAudio = m.segments
    .filter((s) => s.soundCue || s.soundCueSecondary || s.textureCues)
    .map((s) => ({
      segmentId: s.id,
      startSec: s.startSec,
      soundCue: s.soundCue,
      soundCueSecondary: s.soundCueSecondary,
      textureCues: s.textureCues,
    }));

  return {
    episode: m.episode,
    totalDurationSec: m.totalDurationSec,
    musicBedTracks: m.musicBed?.tracks ?? [],
    segmentAudio,
    beats: m.beats ?? [],
  };
}

const SILICON_TRAP_AUDIO: AudioPreviewData = dataFromManifest(siliconTrapManifest);

export const AudioPreviewComposition = () => (
  <Composition
    id="AudioPreview"
    component={AudioPreview}
    calculateMetadata={({ props }) => ({
      durationInFrames: sec((props.data as AudioPreviewData).totalDurationSec),
      fps: layout.fps,
      width: layout.width,
      height: layout.height,
    })}
    defaultProps={{ data: SILICON_TRAP_AUDIO }}
  />
);
