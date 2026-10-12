// Render and verify the local study gallery; no network resources are loaded.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'../../../..');
const {chromium}=require(path.join(root,'remotion-templates/node_modules/playwright'));
(async()=>{
 const cache=path.join(os.homedir(),'Library/Caches/ms-playwright');
 const versions=fs.readdirSync(cache).filter(name=>/^chromium_headless_shell-\d+$/.test(name)).sort((a,b)=>Number(b.split('-').pop())-Number(a.split('-').pop()));
 const arch=process.arch==='arm64'?'arm64':'x64';
 const executablePath=versions.map(version=>path.join(cache,version,'chrome-headless-shell-mac-'+arch,'chrome-headless-shell')).find(file=>fs.existsSync(file));
 if(!executablePath)throw new Error('No installed Chromium headless shell.');
 const browser=await chromium.launch({headless:true,executablePath,args:['--disable-gpu']});
 try{
  const page=await browser.newPage({viewport:{width:1600,height:1200}});
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.route(/^https?:/,route=>route.abort());
  await page.goto(pathToFileURL(path.join(__dirname,'index.html')).href);
  await page.evaluate(()=>Promise.all([...document.images].filter(image=>image.src).map(image=>image.decode())));
  const checks=await page.evaluate(()=>({selected_key_pose_images:document.querySelectorAll('.trial img').length,rebuilt_pose_images:document.querySelectorAll('#pull-rebuild img').length,broken_images:[...document.images].filter(image=>image.id!=='full-image'&&(!image.complete||!image.naturalWidth)).length,desktop_overflow:document.documentElement.scrollWidth>innerWidth}));
  checks.videos=await page.evaluate(()=>Promise.all([...document.querySelectorAll('video')].map(video=>new Promise(resolve=>{
   const result=()=>resolve({file:video.querySelector('source').getAttribute('src'),width:video.videoWidth,height:video.videoHeight,duration_seconds:video.duration||null,ready_state:video.readyState,error:video.error?.message||null,muted:video.muted});
   if(video.readyState>=1||video.error)return result();
   video.addEventListener('loadedmetadata',result,{once:true});video.addEventListener('error',result,{once:true});setTimeout(result,10000);
  }))));
  await page.locator('#results').scrollIntoViewIfNeeded();
  checks.video_playback=await page.evaluate(async()=>{
   const videos=[...document.querySelectorAll('video')];
   await Promise.all(videos.map(video=>video.play()));
   const deadline=performance.now()+10000;
   while(videos.some(video=>video.currentTime<0.3)&&performance.now()<deadline)await new Promise(resolve=>setTimeout(resolve,100));
   const results=videos.map(video=>{video.pause();return {file:video.querySelector('source').getAttribute('src'),advanced_to_seconds:video.currentTime,error:video.error?.message||null}});
   await Promise.all(videos.map(video=>new Promise(resolve=>{video.addEventListener('seeked',resolve,{once:true});video.currentTime=0;setTimeout(resolve,3000)})));
   await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
   return results;
  });
  await page.locator('#key-pose-overview').screenshot({path:path.join(__dirname,'key-pose-overview.png')});
  await page.locator('#results').screenshot({path:path.join(__dirname,'video-results.png')});
  await page.locator('#pull-rebuild').screenshot({path:path.join(__dirname,'rebuilt-pose-overview.png')});
  await page.locator('[data-full="01-head-end.png"]').click();
  checks.image_zoom=await page.locator('dialog').evaluate(dialog=>dialog.open);
  await page.locator('#close').click();
  await page.setViewportSize({width:390,height:844});
  checks.mobile_overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
  await page.setViewportSize({width:1600,height:1200});
  checks.qa_contact_sheets=[];
  for(const study of ['head-turn','coin-exchange','assisted-pull']){
   const directory=path.join(__dirname,'qa',study);
   for(const file of fs.readdirSync(directory).filter(file=>file.endsWith('.html')).sort()){
    await page.goto(pathToFileURL(path.join(directory,file)).href);
    await page.evaluate(()=>Promise.all([...document.images].filter(image=>image.src).map(image=>image.decode())));
    await page.screenshot({path:path.join(directory,file.replace('.html','.png')),fullPage:true});
    checks.qa_contact_sheets.push('qa/'+study+'/'+file);
    if(file==='rebuild.html'){
     await page.locator('[data-full="../../03-pull-start-v2.png"]').click();
     checks.rebuilt_image_zoom=await page.locator('dialog').evaluate(dialog=>dialog.open);
     await page.locator('#close').click();
     await page.setViewportSize({width:390,height:844});
     checks.rebuild_mobile_overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
     await page.setViewportSize({width:1600,height:1200});
    }
   }
  }
  checks.javascript_errors=errors;
  fs.writeFileSync(path.join(__dirname,'gallery-checks.json'),JSON.stringify(checks,null,2)+'\n');
  if(checks.selected_key_pose_images!==6||checks.rebuilt_pose_images!==2||checks.broken_images||checks.desktop_overflow||checks.mobile_overflow||checks.rebuild_mobile_overflow||!checks.image_zoom||!checks.rebuilt_image_zoom||checks.videos.length!==3||checks.videos.some(video=>video.width!==1916||video.height!==1080||video.error||!video.muted)||checks.video_playback.some(video=>video.advanced_to_seconds<0.2||video.error)||errors.length)throw new Error('Gallery check failed: '+JSON.stringify(checks));
  console.log(JSON.stringify(checks));
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
