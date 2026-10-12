import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {chromium} from 'playwright';
import {PNG} from 'pngjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../../../project/visual-identity/2026-10-11/world-objects-overlays');
const manifest = JSON.parse(fs.readFileSync(path.join(root,'studies.json'),'utf8'));
const palette = JSON.parse(fs.readFileSync(path.resolve(here,'../../../tools/brand-treatment/palette.json'),'utf8')).palette;
const browserExecutable = process.env.PARALLAX_BROWSER ?? '/Users/feihuyan/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell';
const checks = {assets:[],clips:[],gallery:{},errors:[]};
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const command = (bin,args) => {
  const result=spawnSync(bin,args,{encoding:'utf8',maxBuffer:5*1024*1024});
  if(result.status!==0) throw new Error(`${bin}: ${result.stderr}`);
  return result.stdout;
};
for(const asset of manifest.assets){
  const bytes=fs.readFileSync(path.join(root,asset.file));
  const pass=hash(bytes)===asset.sha256 && bytes.equals(fs.readFileSync(asset.original));
  checks.assets.push({id:asset.id,hashAndOriginalCopy:pass});
  if(!pass)checks.errors.push(`Source copy failed: ${asset.id}`);
}
for(const study of manifest.studies){
  const video=path.join(root,study.video);
  const metadata=JSON.parse(command('/opt/homebrew/bin/ffprobe',['-v','error','-show_streams','-show_format','-of','json',video]));
  const stream=metadata.streams.find(item=>item.codec_type==='video');
  const duration=Number(metadata.format.duration);
  const still=PNG.sync.read(fs.readFileSync(path.join(root,study.still)));
  const pass=stream?.width===1920 && stream?.height===1080 && stream?.r_frame_rate==='30/1' &&
    stream?.nb_frames==='180' && Math.abs(duration-6)<0.01 && stream?.codec_name==='h264' &&
    stream?.pix_fmt==='yuv420p' && stream?.color_space==='bt709' && stream?.color_transfer==='bt709' &&
    stream?.color_primaries==='bt709' && metadata.streams.length===1 && still.width===1920 && still.height===1080;
  const frameHashes=[];
  for(const [name,time] of [['early','0.5'],['settled','3.5'],['late','5.5']]){
    const file=path.join(root,'qa',`${study.stem}-${name}.jpg`);
    command('/opt/homebrew/bin/ffmpeg',['-hide_banner','-loglevel','error','-y','-ss',time,'-i',video,'-frames:v','1','-q:v','3',file]);
    frameHashes.push(hash(fs.readFileSync(file)));
  }
  const motionPresent=new Set(frameHashes).size>1;
  checks.clips.push({id:study.composition,pass,motionPresent,duration,width:stream.width,height:stream.height,
    fps:stream.r_frame_rate,frames:stream.nb_frames,codec:stream.codec_name,pixelFormat:stream.pix_fmt,
    colorSpace:stream.color_space,colorTransfer:stream.color_transfer,colorPrimaries:stream.color_primaries,bytes:fs.statSync(video).size,decodedFrameHashes:frameHashes});
  if(!pass||!motionPresent)checks.errors.push(`Clip failed: ${study.composition}`);
}
fs.writeFileSync(path.join(root,'qa','checks.json'),JSON.stringify(checks,null,2)+'\n');
const browser=await chromium.launch({headless:true,executablePath:browserExecutable,args:['--disable-gpu']});
try {
  const page=await browser.newPage({viewport:{width:1440,height:1100}});
  const pageErrors=[];page.on('pageerror',error=>pageErrors.push(error.message));
  await page.goto(pathToFileURL(path.join(root,'index.html')).href);
  await page.evaluate(async()=>{
    await Promise.all([...document.images].map(img=>{img.loading='eager';return img.decode().catch(()=>null)}));
    await Promise.all([...document.querySelectorAll('video')].map(video=>new Promise(resolve=>{
      if(video.readyState>=1||video.error)return resolve();
      video.addEventListener('loadedmetadata',resolve,{once:true});video.addEventListener('error',resolve,{once:true});
      setTimeout(resolve,10000);
    })));
  });
  const media=await page.evaluate(()=>({images:[...document.images].filter(i=>i.id!=='large').map(i=>({file:i.getAttribute('src'),loaded:i.complete&&i.naturalWidth>0})),
    videos:[...document.querySelectorAll('video')].map(v=>({file:v.querySelector('source').getAttribute('src'),width:v.videoWidth,height:v.videoHeight,duration:v.duration,error:v.error?.message??null})),
    overflow:document.documentElement.scrollWidth>innerWidth,studies:document.querySelectorAll('.study').length}));
  await page.screenshot({path:path.join(root,'qa','gallery-desktop.png'),fullPage:false,timeout:45000});
  await page.locator('[data-play="backgrounds"]').click();
  await page.waitForTimeout(900);
  const playback=await page.locator('#backgrounds video').evaluateAll(videos=>videos.map(v=>({time:v.currentTime,paused:v.paused})));
  await page.locator('#pause').click();
  const paused=await page.locator('video').evaluateAll(videos=>videos.every(v=>v.paused));
  await page.locator('#stills').click();
  const stillMode=await page.locator('body').getAttribute('data-mode');
  await page.locator('[data-zoom="renders/04-architectural-object.png"]').first().click();
  const modal=await page.locator('dialog').evaluate(element=>element.open);
  await page.keyboard.press('Escape');
  const modalClosed=await page.locator('dialog').evaluate(element=>!element.open);
  await page.setViewportSize({width:390,height:844});
  await page.locator('#motion').click();
  const motionMode=await page.locator('body').getAttribute('data-mode');
  await page.locator('#stills').click();
  const mobileOverflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
  await page.screenshot({path:path.join(root,'qa','gallery-mobile.png'),fullPage:false,timeout:45000});
  const links=await page.locator('a[href]').evaluateAll(items=>items.map(item=>item.href));
  const missingLinks=links.filter(url=>url.startsWith('file:')).filter(url=>!fs.existsSync(fileURLToPath(url)));
  checks.gallery={...media,playback,paused,stillMode,motionMode,modal,modalClosed,mobileOverflow,pageErrors,missingLinks};
  if(media.studies!==8||media.images.some(i=>!i.loaded)||media.videos.some(v=>v.error||v.width!==1920||v.height!==1080||Math.abs(v.duration-6)>0.01)||
    media.overflow||mobileOverflow||pageErrors.length||missingLinks.length||!paused||stillMode!=='stills'||motionMode!=='motion'||!modal||!modalClosed||playback.some(v=>v.paused||v.time<0.1))
    checks.errors.push('Gallery check failed; inspect checks.json');
  const contact=`<!doctype html><meta charset="utf-8"><title>Decoded motion frames</title><style>body{background:${palette.paper};font:16px Arial;margin:24px;color:${palette.ink}}.row{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}img{width:100%}figure{margin:0}h2{margin-top:36px}</style><h1>Decoded clip frames: 0.5 / 3.5 / 5.5 seconds</h1>${manifest.studies.map(study=>`<h2>${study.stem}</h2><div class="row">${['early','settled','late'].map(name=>`<figure><img src="${study.stem}-${name}.jpg"><figcaption>${name}</figcaption></figure>`).join('')}</div>`).join('')}`;
  fs.writeFileSync(path.join(root,'qa','motion-frames.html'),contact);
} finally {await browser.close();}
fs.writeFileSync(path.join(root,'qa','checks.json'),JSON.stringify(checks,null,2)+'\n');
console.log(JSON.stringify({sources:checks.assets.length,clips:checks.clips.length,galleryStudies:checks.gallery.studies,errors:checks.errors},null,2));
if(checks.errors.length)process.exitCode=1;
