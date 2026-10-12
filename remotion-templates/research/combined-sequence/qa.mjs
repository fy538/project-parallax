import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {chromium} from 'playwright';
import {PNG} from 'pngjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here,'../../../project/visual-identity/2026-10-11/combined-sequence');
const qa = path.join(root,'qa');
const story = JSON.parse(fs.readFileSync(path.join(root,'story.json'),'utf8'));
const provenance = JSON.parse(fs.readFileSync(path.join(root,'provenance.json'),'utf8'));
const sourceBatch = JSON.parse(fs.readFileSync(path.resolve(root,'../world-objects-overlays/studies.json'),'utf8'));
const checks = {assets:[],video:{},decodedFrames:[],gallery:{},errors:[]};
const browserExecutable = process.env.PARALLAX_BROWSER ?? '/Users/feihuyan/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell';
const ffmpeg = process.env.PARALLAX_FFMPEG ?? '/opt/homebrew/bin/ffmpeg';
const ffprobe = process.env.PARALLAX_FFPROBE ?? '/opt/homebrew/bin/ffprobe';
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const save = () => fs.writeFileSync(path.join(qa,'checks.json'),JSON.stringify(checks,null,2)+'\n');
const run = (bin,args) => {
  const result = spawnSync(bin,args,{encoding:'utf8',maxBuffer:10*1024*1024});
  if(result.status!==0) throw new Error(`${path.basename(bin)} failed: ${result.stderr || result.error?.message}`);
  return result.stdout;
};
fs.mkdirSync(qa,{recursive:true});
fs.writeFileSync(path.join(qa,'report.md'),'# Combined sequence QA\n\nChecks running.\n');
try {
  for(const asset of provenance.assets) {
    const file = path.resolve(root,asset.file);
    const original = sourceBatch.assets.find(a=>path.basename(a.file)===path.basename(file));
    const actual = hash(fs.readFileSync(file));
    const pass = actual===asset.sha256 && actual===original?.sha256;
    checks.assets.push({file:asset.file,pass,sha256:actual});
    if(!pass)checks.errors.push(`Source changed: ${asset.file}`);
  }
  const video = path.join(root,'renders/painted-argument.mp4');
  const metadata = JSON.parse(run(ffprobe,['-v','error','-show_streams','-show_format','-of','json',video]));
  const stream = metadata.streams.find(s=>s.codec_type==='video');
  const duration = Number(metadata.format.duration);
  const pass = stream?.width===1920 && stream?.height===1080 && stream?.r_frame_rate==='30/1' &&
    stream?.nb_frames==='780' && Math.abs(duration-26)<0.01 && stream?.codec_name==='h264' &&
    stream?.pix_fmt==='yuv420p' && stream?.color_space==='bt709' && stream?.color_transfer==='bt709' &&
    stream?.color_primaries==='bt709' && stream?.color_range==='tv' && metadata.streams.length===1;
  run(ffmpeg,['-hide_banner','-loglevel','error','-xerror','-i',video,'-f','null','-']);
  checks.video={pass,fullDecodePass:true,duration,width:stream?.width,height:stream?.height,
    fps:stream?.r_frame_rate,frames:stream?.nb_frames,codec:stream?.codec_name,pixelFormat:stream?.pix_fmt,
    colorSpace:stream?.color_space,colorTransfer:stream?.color_transfer,colorPrimaries:stream?.color_primaries,
    colorRange:stream?.color_range,bytes:fs.statSync(video).size,audioStreams:metadata.streams.filter(s=>s.codec_type==='audio').length};
  if(!pass)checks.errors.push('Video specification failed');
  const frames = story.beats.map(b=>b.frame);
  run(ffmpeg,['-hide_banner','-loglevel','error','-y','-i',video,'-vf',`select=${frames.map(n=>`eq(n\\,${n})`).join('+')}`,
    '-fps_mode','vfr',path.join(qa,'decoded-%02d.png')]);
  for(const [index,frame] of frames.entries()) {
    const decoded = PNG.sync.read(fs.readFileSync(path.join(qa,`decoded-${String(index+1).padStart(2,'0')}.png`)));
    const still = PNG.sync.read(fs.readFileSync(path.join(root,`renders/frame-${String(frame).padStart(3,'0')}.png`)));
    let difference=0;
    for(let i=0;i<still.data.length;i+=4)for(let c=0;c<3;c++)difference+=Math.abs(still.data[i+c]-decoded.data[i+c]);
    const meanAbsoluteError=difference/(still.width*still.height*3);
    const pass=decoded.width===1920 && decoded.height===1080 && meanAbsoluteError<5;
    checks.decodedFrames.push({frame,pass,meanAbsoluteError,sha256:hash(decoded.data)});
    if(!pass)checks.errors.push(`Decoded frame differs from render: ${frame}`);
  }
  if(new Set(checks.decodedFrames.map(f=>f.sha256)).size!==4)checks.errors.push('Four beats did not produce distinct pictures');
  save();
  const browser = await chromium.launch({headless:true,executablePath:browserExecutable,args:['--disable-gpu']});
  try {
    const page=await browser.newPage({viewport:{width:1440,height:1100}});
    const pageErrors=[];page.on('pageerror',error=>pageErrors.push(error.message));
    await page.goto(pathToFileURL(path.join(root,'index.html')).href);
    await page.evaluate(async()=>{
      await Promise.all([...document.images].filter(i=>i.id!=='large').map(i=>i.decode()));
      const video=document.querySelector('video');
      if(video.readyState<1)await new Promise((resolve,reject)=>{
        video.addEventListener('loadedmetadata',resolve,{once:true});
        video.addEventListener('error',()=>reject(new Error('Video failed to load')),{once:true});
        setTimeout(()=>reject(new Error('Video metadata timeout')),10000);
      });
    });
    await page.waitForFunction(()=>document.querySelector('video').readyState>=3,undefined,{timeout:15000});
    const media=await page.evaluate(()=>({images:[...document.images].filter(i=>i.id!=='large').every(i=>i.complete&&i.naturalWidth>0),
      duration:document.querySelector('video').duration,videoWidth:document.querySelector('video').videoWidth,
      overflow:document.documentElement.scrollWidth>innerWidth,beats:document.querySelectorAll('.beat').length}));
    await page.screenshot({path:path.join(qa,'gallery-desktop.png'),fullPage:false,timeout:45000});
    const navigation=[];
    for(const [index,beat] of story.beats.entries()) {
      await page.locator('.beat').nth(index).click();
      await page.waitForFunction(start=>{
        const video=document.querySelector('video');
        return !video.paused&&!video.seeking&&video.currentTime>=start+0.15;
      },beat.startSec,{timeout:15000});
      navigation.push(await page.evaluate(()=>({time:document.querySelector('video').currentTime,
        playing:!document.querySelector('video').paused,selected:[...document.querySelectorAll('.beat')].findIndex(b=>b.getAttribute('aria-current')==='true')})));
    }
    await page.locator('[data-zoom]').nth(3).click();
    await page.locator('#large').evaluate(img=>img.decode());
    const modal=await page.locator('dialog').evaluate(d=>d.open);
    const pausedByModal=await page.locator('video').evaluate(v=>v.paused);
    await page.keyboard.press('Escape');
    const modalClosed=await page.locator('dialog').evaluate(d=>!d.open);
    const urls=await page.locator('a[href]').evaluateAll(links=>links.map(a=>a.href));
    const missingLinks=urls.filter(u=>u.startsWith('file:')&&!fs.existsSync(fileURLToPath(u)));
    await page.setViewportSize({width:390,height:844});
    await page.reload();
    await page.waitForFunction(()=>document.querySelector('video').readyState>=3,undefined,{timeout:15000});
    const mobileOverflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
    await page.screenshot({path:path.join(qa,'gallery-mobile.png'),fullPage:false,timeout:45000});
    checks.gallery={...media,navigation,modal,pausedByModal,modalClosed,mobileOverflow,missingLinks,pageErrors};
    const navigationPass=navigation.every((n,i)=>n.playing&&n.time>=story.beats[i].startSec+0.15&&n.time<story.beats[i].endSec&&n.selected===i);
    if(!media.images||media.beats!==4||media.videoWidth!==1920||Math.abs(media.duration-26)>0.01||media.overflow||mobileOverflow||
      !navigationPass||!modal||!pausedByModal||!modalClosed||missingLinks.length||pageErrors.length)checks.errors.push('Gallery interaction or layout failed');
  } finally {await browser.close();}
} catch(error) {checks.errors.push(error.message);}
save();
fs.writeFileSync(path.join(qa,'report.md'),`# Combined sequence QA\n\n${checks.errors.length?'FAIL — see checks.json.':'PASS — automated media and gallery checks.'}\n\n`+
  `- Source PNG hashes match the original batch: ${checks.assets.filter(a=>a.pass).length}/3.\n`+
  `- Video: 1920×1080, 30 fps, 780 frames, 26 seconds; H.264/yuv420p; limited-range BT.709 matrix, transfer and primaries.\n`+
  `- Audio: no audio stream; intentionally picture only.\n`+
  `- Full video decode: ${checks.video.fullDecodePass?'passed':'not confirmed'}.\n`+
  `- Four decoded beat frames compared against the direct Remotion PNGs: ${checks.decodedFrames.filter(f=>f.pass).length}/4; mean RGB error threshold < 5/255.\n`+
  `- Gallery: four beat controls, local video playback, enlarged still, Escape close, local links, desktop/mobile overflow and script errors.\n\n`+
  `Evidence: [checks](checks.json), [desktop](gallery-desktop.png), [mobile](gallery-mobile.png), [visual review](visual-review.md), [render log](render.log).\n`+
  (checks.errors.length?`\nErrors: ${checks.errors.join('; ')}\n`:''));
console.log(JSON.stringify({assets:checks.assets.length,decodedFrames:checks.decodedFrames.length,videoPass:checks.video.pass,errors:checks.errors},null,2));
if(checks.errors.length)process.exitCode=1;
