import {spawnSync} from 'node:child_process';
import {rename} from 'node:fs/promises';

/** Complete H.264 VUI + container tags without re-encoding the picture. */
export async function tagBT709(file) {
  const temporary = file.replace(/\.mp4$/, '-bt709.tmp.mp4');
  const result = spawnSync(process.env.PARALLAX_FFMPEG ?? '/opt/homebrew/bin/ffmpeg', [
    '-hide_banner', '-loglevel', 'error', '-y', '-i', file, '-map', '0:v:0', '-c', 'copy',
    '-bsf:v', 'h264_metadata=colour_primaries=1:transfer_characteristics=1:matrix_coefficients=1:video_full_range_flag=0',
    '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-movflags', '+faststart', temporary,
  ], {encoding: 'utf8'});
  if (result.status !== 0) throw new Error(`BT.709 metadata: ${result.stderr || result.error?.message}`);
  await rename(temporary, file);
}
