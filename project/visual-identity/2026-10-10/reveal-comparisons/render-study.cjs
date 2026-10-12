// Local artifact renderer. Blocks HTTP(S); browser reads these study files only.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {pathToFileURL}=require('node:url');
const repoRoot=path.resolve(__dirname,'../../../..');
const {chromium}=require(path.join(repoRoot,'remotion-templates/node_modules/playwright'));
const spec=Object.freeze({width:1920,height:1080,fps:24,duration:14,keyTimes:[0,4,7,10,13]});
(async()=>{
  const {palette}=JSON.parse(fs.readFileSync(path.join(repoRoot,'tools/brand-treatment/palette.json'),'utf8'));
  fs.writeFileSync(path.join(__dirname,'palette.css'),'/* Generated from tools/brand-treatment/palette.json by render-study.cjs. */\n:root{'+Object.entries(palette).map(([key,value])=>'--'+key+':'+value+';').join('')+'}\n');
  const cache=path.join(os.homedir(),'Library/Caches/ms-playwright');
  const versions=fs.readdirSync(cache).filter(name=>/^chromium_headless_shell-\d+$/.test(name)).sort((a,b)=>Number(b.split('-').pop())-Number(a.split('-').pop()));
  const arch=process.arch==='arm64'?'arm64':'x64';
  const executablePath=versions.map(version=>path.join(cache,version,'chrome-headless-shell-mac-'+arch,'chrome-headless-shell')).find(file=>fs.existsSync(file));
  if(!executablePath)throw new Error('No installed Chromium headless shell.');
  const browser=await chromium.launch({headless:true,executablePath,args:['--disable-gpu','--allow-file-access-from-files']});
  try{
    const page=await browser.newPage({viewport:{width:spec.width,height:spec.height},deviceScaleFactor:1});
    await page.route(/^https?:/,route=>route.abort());
    const errors=[];page.on('pageerror',error=>errors.push(error.message));
    console.log('Loading local motion source');
    await page.goto(pathToFileURL(path.join(__dirname,'motion.html')).href+'?render=1');
    await page.evaluate(()=>window.motionReady);
    console.log('Painted layers loaded');
    for(const time of spec.keyTimes){
      const png=await page.evaluate(value=>window.renderAtSeconds(value).toDataURL('image/png').split(',')[1],time);
      fs.writeFileSync(path.join(__dirname,'motion-key-'+String(time).padStart(2,'0')+'.png'),Buffer.from(png,'base64'));
      console.log('Checked keyframe at '+time+' seconds');
    }
    fs.copyFileSync(path.join(__dirname,'motion-key-07.png'),path.join(__dirname,'motion-poster.png'));
    const contact='<html><head><link rel="stylesheet" href="palette.css"><style>*{box-sizing:border-box}body{margin:0;padding:32px;background:var(--paper);color:var(--ink);font-family:Arial,sans-serif}h1{font-size:30px;font-weight:500;margin:0 0 24px}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:24px}figure{margin:0}img{display:block;width:100%;height:auto}figcaption{font-size:16px;margin-top:10px}</style></head><body><h1>Opening panel · motion keyframes</h1><div class="grid">'+spec.keyTimes.map((time,index)=>'<figure><img src="recorded-key-'+String(time).padStart(2,'0')+'.png"><figcaption>'+time+'s · '+['Close encounter','Page opening','Wider context','Diagram building','Closing hold'][index]+'</figcaption></figure>').join('')+'</div></body></html>';
    fs.writeFileSync(path.join(__dirname,'motion-keyframes.html'),contact);
    await page.setViewportSize({width:1600,height:1000});
    await page.goto(pathToFileURL(path.join(__dirname,'motion-keyframes.html')).href);
    await page.evaluate(()=>Promise.all([...document.images].map(image=>image.decode())));
    await page.screenshot({path:path.join(__dirname,'motion-contact-sheet.png'),fullPage:true});
    await page.goto(pathToFileURL(path.join(__dirname,'index.html')).href);
    await page.evaluate(()=>Promise.all([...document.images].filter(image=>image.src).map(image=>image.decode())));
    const checks=await page.evaluate(()=>({comparison_panels:document.querySelectorAll('.study img').length,broken_images:[...document.images].filter(image=>image.id!=='full-image'&&(!image.complete||!image.naturalWidth)).length,desktop_overflow:document.documentElement.scrollWidth>innerWidth}));
    await page.locator('#comparison-overview').screenshot({path:path.join(__dirname,'comparison-overview.png')});
    await page.locator('[data-full="a-opening-panel-two-coins.png"]').click();
    checks.image_zoom=await page.locator('dialog').evaluate(dialog=>dialog.open);
    await page.locator('#close').click();
    await page.setViewportSize({width:390,height:844});
    checks.mobile_overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
    checks.javascript_errors=errors;
    fs.writeFileSync(path.join(__dirname,'preview-checks.json'),JSON.stringify(checks,null,2)+'\n');
    if(checks.broken_images||checks.desktop_overflow||checks.mobile_overflow||!checks.image_zoom||checks.comparison_panels!==6||errors.length)throw new Error('Gallery verification failed: '+JSON.stringify(checks));
    console.log(JSON.stringify(checks));
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1});
