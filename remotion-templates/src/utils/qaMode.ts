/**
 * QA render mode — set by `scripts/qa-episode.mjs` via inputProps `{ qa: true }`.
 *
 * In QA mode the episode renders visuals only: audio components return null
 * (so missing ambient / SFX / music files can't fail a still render), and
 * <QaProbe> logs a measurement of every visible text node for the QA script.
 * Normal renders and Studio are unaffected.
 */
import { getInputProps } from "remotion";

export function isQaMode(): boolean {
  try {
    const props = getInputProps() as Record<string, unknown>;
    return props.qa === true;
  } catch {
    return false;
  }
}

/**
 * Picture-only render: `--props='{"noAudio":true}'` (also implied by QA mode).
 * Audio components return null, so a render does not need the music, SFX or
 * ambient files to exist. The edit adds narration, music and SFX from the
 * episode's audio cue sheet.
 */
export function isAudioDisabled(): boolean {
  if (isQaMode()) return true;
  try {
    const props = getInputProps() as Record<string, unknown>;
    return props.noAudio === true;
  } catch {
    return false;
  }
}
