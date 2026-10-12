// Render these local art-direction layouts and verify the gallery. No network requests.
const { chromium } = require(require('node:path').resolve(__dirname, '../../../../remotion-templates/node_modules/playwright'));
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { pathToFileURL } = require('node:url');
(async () => {
  const cache = path.join(os.homedir(), 'Library/Caches/ms-playwright');
  const versions = fs.readdirSync(cache).filter(name => /^chromium_headless_shell-\d+$/.test(name)).sort((a,b) => Number(b.split('-').pop()) - Number(a.split('-').pop()));
  const arch = process.arch === 'arm64' ? 'arm64' : 'x64';
  const executablePath = versions.map(version => path.join(cache, version, 'chrome-headless-shell-mac-'+arch, 'chrome-headless-shell')).find(file => fs.existsSync(file));
  if (!executablePath) throw new Error('No installed Chromium headless shell found.');
  const browser = await chromium.launch({ headless:true, executablePath });
  try {
    const page = await browser.newPage({ viewport:{width:1600,height:900}, deviceScaleFactor:1 });
    await page.route(/^https?:/, route => route.abort());
    await page.goto(pathToFileURL(path.join(__dirname,'two-accounts.html')).href);
    await page.evaluate(() => Promise.all([...document.images].map(image => image.decode())));
    await page.locator('#two-accounts').screenshot({ path:path.join(__dirname,'board-02-two-accounts.png') });
    await page.goto(pathToFileURL(path.join(__dirname,'street-diagram.svg')).href);
    await page.screenshot({ path:path.join(__dirname,'board-04-street-diagram.png') });
    await page.setViewportSize({width:1600,height:1200});
    await page.goto(pathToFileURL(path.join(__dirname,'index.html')).href);
    await page.evaluate(() => Promise.all([...document.images].filter(image => image.src).map(image => image.decode())));
    const checks = await page.evaluate(() => ({
      images:[...document.images].filter(image => image.id !== 'dialog-image').length,
      broken:[...document.images].filter(image => image.id !== 'dialog-image' && (!image.complete || !image.naturalWidth)).length,
      desktopOverflow:document.documentElement.scrollWidth > innerWidth,
      frames:document.querySelectorAll('.board .frame').length
    }));
    await page.locator('#storyboard-overview').screenshot({path:path.join(__dirname,'storyboard-overview.png')});
    await page.locator('[data-full="board-02-two-accounts.png"]').click();
    checks.zoomOpened = await page.locator('dialog').evaluate(dialog => dialog.open);
    await page.locator('#close-dialog').click();
    await page.setViewportSize({width:390,height:844});
    checks.mobileOverflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    fs.writeFileSync(path.join(__dirname,'preview-checks.json'), JSON.stringify(checks,null,2)+'\n');
    console.log(JSON.stringify(checks));
    if (checks.broken || checks.desktopOverflow || checks.mobileOverflow || checks.frames !== 6 || !checks.zoomOpened) process.exitCode=1;
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode=1; });

