import {bundle} from '@remotion/bundler';
import {getCompositions, openBrowser, renderMedia, renderStill} from '@remotion/renderer';
import {mkdir, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {tagBT709} from './color.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const output = path.resolve(here, '../../../project/visual-identity/2026-10-11/world-objects-overlays');
const browserExecutable = process.env.PARALLAX_BROWSER ?? '/Users/feihuyan/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell';
const names = ['01-quiet-scenery','02-architectural-scenery','03-painted-object','04-architectural-object','05-analytical-overlay','06-spatial-overlay','07-light-background','08-dark-background'];
const only = process.argv.find(arg => arg.startsWith('--only='))?.slice(7).split(',').map(Number);
const stillsOnly = process.argv.includes('--stills-only');
const report = [];
await mkdir(path.join(output, 'renders'), {recursive: true});
const serveUrl = await bundle({entryPoint: path.join(here, 'entry.tsx'), publicDir: path.join(output, 'assets'),
  outDir: path.join(output, '.bundle'), enableCaching: true});
const browser = await openBrowser('chrome', {browserExecutable, chromiumOptions: {gl: 'angle'}});
try {
  const compositions = await getCompositions(serveUrl, {puppeteerInstance: browser, timeoutInMilliseconds: 90000});
  for (const composition of compositions) {
    const study = Number(composition.id.replace('WorldStudy',''));
    if (only && !only.includes(study)) continue;
    const stem = path.join(output, 'renders', names[study-1]);
    const started = Date.now();
    await renderStill({serveUrl, composition, puppeteerInstance: browser, output: `${stem}.png`, frame: 105,
      imageFormat: 'png', timeoutInMilliseconds: 90000});
    console.log(`Still ${study}/8 saved`);
    if (!stillsOnly) {
      await renderMedia({serveUrl, composition, puppeteerInstance: browser, outputLocation: `${stem}.mp4`,
        codec: 'h264', crf: 16, imageFormat: 'png', pixelFormat: 'yuv420p', colorSpace: 'bt709',
        muted: true, concurrency: 3, timeoutInMilliseconds: 90000});
      await tagBT709(`${stem}.mp4`);
      console.log(`Motion ${study}/8 saved (${Math.round((Date.now()-started)/1000)}s)`);
    }
    report.push({id: composition.id, stem: names[study-1], width: composition.width, height: composition.height,
      fps: composition.fps, durationInFrames: composition.durationInFrames, elapsedMs: Date.now()-started});
  }
  const reportName = `${stillsOnly ? 'stills' : 'render-run'}${only ? `-subset-${only.join('-')}` : ''}.json`;
  await writeFile(path.join(output, 'qa', reportName), JSON.stringify(report, null, 2)+'\n');
} finally {await browser.close({silent: true});}
