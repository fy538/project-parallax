import {bundle} from '@remotion/bundler';
import {getCompositions, openBrowser, renderMedia, renderStill} from '@remotion/renderer';
import {mkdir, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {tagBT709} from '../world-objects-overlays/color.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const output = path.resolve(here, '../../../project/visual-identity/2026-10-11/combined-sequence');
const assets = path.resolve(output, '../world-objects-overlays/assets');
const browserExecutable = process.env.PARALLAX_BROWSER ?? '/Users/feihuyan/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell';
const stillsOnly = process.argv.includes('--stills-only');
const videoOnly = process.argv.includes('--video-only');
const frames = [0, 105, 179, 180, 255, 330, 450, 510, 540, 600, 690, 750, 779];
await mkdir(path.join(output, 'renders'), {recursive: true});
await mkdir(path.join(output, 'qa'), {recursive: true});
const started = Date.now();
const serveUrl = await bundle({entryPoint: path.join(here, 'entry.tsx'), publicDir: assets,
  outDir: path.join(output, '.bundle'), enableCaching: true});
const browser = await openBrowser('chrome', {browserExecutable, chromiumOptions: {gl: 'angle'}});
try {
  const [composition] = await getCompositions(serveUrl, {puppeteerInstance: browser, timeoutInMilliseconds: 90000});
  if (!composition || composition.id !== 'PaintedArgument') throw new Error('Expected isolated composition');
  if (!videoOnly) for (const frame of frames) {
    await renderStill({serveUrl, composition, puppeteerInstance: browser,
      output: path.join(output, 'renders', `frame-${String(frame).padStart(3,'0')}.png`), frame,
      imageFormat: 'png', timeoutInMilliseconds: 90000});
    console.log(`Frame ${frame} saved`);
  }
  if (!stillsOnly) {
    let lastPercent = -1;
    const video = path.join(output, 'renders', 'painted-argument.mp4');
    await renderMedia({serveUrl, composition, puppeteerInstance: browser, outputLocation: video,
      codec: 'h264', crf: 16, imageFormat: 'png', pixelFormat: 'yuv420p', colorSpace: 'bt709',
      muted: true, concurrency: 2, timeoutInMilliseconds: 90000,
      onProgress: ({progress}) => {
        const percent = Math.floor(progress*10)*10;
        if (percent > lastPercent) {console.log(`Render ${percent}%`); lastPercent=percent;}
      }});
    await tagBT709(video);
  }
  await writeFile(path.join(output, 'qa', stillsOnly ? 'stills-run.json' : 'render-run.json'),
    JSON.stringify({composition: composition.id, width: composition.width, height: composition.height,
      fps: composition.fps, durationInFrames: composition.durationInFrames, frames, elapsedMs: Date.now()-started}, null, 2)+'\n');
  console.log(`Complete in ${Math.round((Date.now()-started)/1000)}s`);
} finally {await browser.close({silent: true});}
