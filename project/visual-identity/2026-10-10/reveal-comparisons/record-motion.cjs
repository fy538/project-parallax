// Export every authored canvas frame, then encode a silent MP4 locally.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {spawn,spawnSync}=require('node:child_process');
const {pathToFileURL}=require('node:url');
const repoRoot=path.resolve(__dirname,'../../../..');
const {chromium}=require(path.join(repoRoot,'remotion-templates/node_modules/playwright'));
const {PNG}=require(path.join(repoRoot,'remotion-templates/node_modules/pngjs'));
const spec={width:1920,height:1080,duration:14,fps:24};
function command(name,args){const result=spawnSync(name,args,{encoding:'utf8',timeout:180000});if(result.status!==0)throw new Error(name+': '+(result.stderr||String(result.error)));return result.stdout;}
(async()=>{
 const cache=path.join(os.homedir(),'Library/Caches/ms-playwright');
 const versions=fs.readdirSync(cache).filter(name=>/^chromium_headless_shell-\d+$/.test(name)).sort((a,b)=>Number(b.split('-').pop())-Number(a.split('-').pop()));
 const arch=process.arch==='arm64'?'arm64':'x64';
 const executablePath=versions.map(version=>path.join(cache,version,'chrome-headless-shell-mac-'+arch,'chrome-headless-shell')).find(file=>fs.existsSync(file));
 if(!executablePath)throw new Error('No installed Chromium headless shell.');
 const browser=await chromium.launch({headless:true,executablePath,args:['--disable-gpu','--allow-file-access-from-files']});
 try{
  const page=await browser.newPage({viewport:{width:spec.width,height:spec.height}});
  await page.route(/^https?:/,route=>route.abort());
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto(pathToFileURL(path.join(__dirname,'motion.html')).href+'?render=1');
  await page.evaluate(()=>window.motionReady);
  async function frameAt(t){return Buffer.from(await page.evaluate(time=>window.renderAtSeconds(time).toDataURL('image/png').split(',')[1],t),'base64')}
  for(const time of [0,4,7,10,13])fs.writeFileSync(path.join(__dirname,'motion-key-'+String(time).padStart(2,'0')+'.png'),await frameAt(time));
  fs.copyFileSync(path.join(__dirname,'motion-key-07.png'),path.join(__dirname,'motion-poster.png'));
  if(process.argv.includes('--preview')){console.log('Five deterministic canvas keyframes exported');return}
  const out=path.join(__dirname,'opening-panel-motion.mp4');
  const encoder=spawn('ffmpeg',['-hide_banner','-loglevel','warning','-y','-f','image2pipe','-framerate',String(spec.fps),'-vcodec','png','-i','pipe:0','-an','-vf','scale=1920:1080:out_color_matrix=bt709:out_range=tv','-c:v','libx264','-preset','medium','-crf','18','-pix_fmt','yuv420p','-color_range','tv','-color_primaries','bt709','-color_trc','bt709','-colorspace','bt709','-bsf:v','h264_metadata=colour_primaries=1:transfer_characteristics=1:matrix_coefficients=1','-movflags','+faststart',out],{stdio:['pipe','ignore','pipe']});
  let encoderLog='';encoder.stderr.on('data',data=>encoderLog+=data);
  const completed=new Promise((resolve,reject)=>{encoder.on('error',reject);encoder.on('close',code=>code===0?resolve():reject(new Error(encoderLog)))});
  encoder.stdin.on('error',()=>{});
  try{
   for(let frame=0;frame<spec.duration*spec.fps;frame++){
    const png=await frameAt(frame/spec.fps);
    await new Promise((resolve,reject)=>encoder.stdin.write(png,error=>error?reject(error):resolve()));
    if(frame%48===0)console.log('Encoded frame '+frame+' / '+spec.duration*spec.fps);
   }
   encoder.stdin.end();await completed;
  }catch(error){encoder.kill();await completed.catch(()=>{});throw error}
  const media=JSON.parse(command('ffprobe',['-v','error','-show_streams','-show_format','-of','json',out]));
  const video=media.streams.find(stream=>stream.codec_type==='video');
  if(!video||video.width!==spec.width||video.height!==spec.height||Math.abs(Number(media.format.duration)-spec.duration)>.06)throw new Error('Incorrect output video specification');
  const checks={width:video.width,height:video.height,duration:Number(media.format.duration),fps:video.avg_frame_rate,frames:Number(video.nb_frames),color_space:video.color_space,color_transfer:video.color_transfer,color_primaries:video.color_primaries,bytes:Number(media.format.size),has_audio:media.streams.some(stream=>stream.codec_type==='audio'),method:'Deterministic native Canvas/SVG frames rendered locally with Playwright and encoded with ffmpeg',javascript_errors:errors};
  const keyTimes=[0,4,7,10,13];
  for(const time of keyTimes)command('ffmpeg',['-hide_banner','-loglevel','error','-y','-ss',String(time),'-i',out,'-frames:v','1',path.join(__dirname,'recorded-key-'+String(time).padStart(2,'0')+'.png')]);
  const images=keyTimes.map(time=>PNG.sync.read(fs.readFileSync(path.join(__dirname,'recorded-key-'+String(time).padStart(2,'0')+'.png'))));
  checks.decoded_keyframe_changes=images.slice(1).map((image,index)=>{
   const before=images[index];let delta=0;
   for(let pixel=0;pixel<image.data.length;pixel+=4)for(let channel=0;channel<3;channel++)delta+=Math.abs(before.data[pixel+channel]-image.data[pixel+channel]);
   return {from_seconds:keyTimes[index],to_seconds:keyTimes[index+1],mean_rgb_difference:delta/(image.width*image.height*3*255)};
  });
  // Scene changes affect most pixels; the final node/footer affects a smaller area.
  const minimumChanges=[.02,.02,.1,.005];
  checks.motion_phases_differ=checks.decoded_keyframe_changes.every((change,index)=>change.mean_rgb_difference>minimumChanges[index]);
  fs.writeFileSync(path.join(__dirname,'video-checks.json'),JSON.stringify(checks,null,2)+'\n');
  if(!checks.motion_phases_differ)throw new Error('Decoded motion phases did not change enough');
  if(errors.length)throw new Error('Browser errors: '+errors.join('; '));
  console.log(JSON.stringify(checks));
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
