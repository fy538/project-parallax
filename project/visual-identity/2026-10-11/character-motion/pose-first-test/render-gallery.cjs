const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const {pathToFileURL} = require('node:url');
const {chromium} = require('../../../../../remotion-templates/node_modules/playwright');

const root = __dirname;
const record = JSON.parse(fs.readFileSync(path.join(root, 'studies.json'), 'utf8'));
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');

async function run() {
  for (const study of record.studies) {
    assert.equal(hash(path.join(root, study.file)), study.sha256, study.file);
    assert.equal(hash(study.original_generated_path), study.sha256, study.file);
    assert.equal(fs.readFileSync(path.join(root, study.prompt_file), 'utf8').trimEnd(), study.exact_prompt);
    for (const ref of study.references) assert.equal(hash(ref.path), ref.sha256, ref.path);
    assert.equal(study.accepted_for_production, false);
    assert.equal(study.accepted_for_animation, false);
  }
  assert.equal(record.generation_count, 9);
  assert.equal(record.new_video_generations, 0);
  const checkedLinks = [];
  for (const name of ['index.html', 'contact-review.html', 'paint-detail.html', 'README.md']) {
    const source = fs.readFileSync(path.join(root, name), 'utf8');
    const links = name.endsWith('.html')
      ? [...source.matchAll(/(?:src|href)="([^"]+)"/g)].map(match => match[1])
      : [...source.matchAll(/\]\(([^)]+)\)/g)].map(match => match[1]);
    for (const link of links) {
      if (/^(?:https?:|#)/.test(link)) continue;
      const file = path.resolve(root, decodeURIComponent(link.split('#')[0]));
      if (path.basename(file) === 'gallery-checks.json') continue;
      assert.ok(fs.existsSync(file), `${name}: ${link}`);
      checkedLinks.push({page: name, link});
    }
  }
  const options = {headless: true, args: ['--disable-gpu']};
  if (process.env.PARALLAX_CHROMIUM_PATH) options.executablePath = process.env.PARALLAX_CHROMIUM_PATH;
  const browser = await chromium.launch(options);
  const results = [];
  const errors = [];
  try {
    const page = await browser.newPage({viewport: {width: 1360, height: 1000}});
    await page.route(/^https?:/, route => route.abort());
    page.on('pageerror', error => errors.push(error.message));
    for (const name of ['index.html', 'contact-review.html', 'paint-detail.html']) {
      await page.goto(pathToFileURL(path.join(root, name)).href);
      await page.evaluate(() => Promise.all([...document.images].filter(image => image.getAttribute('src')).map(image => image.decode())));
      let state = await page.evaluate(() => ({images: document.images.length, failed: [...document.images].filter(image => image.getAttribute('src') && (!image.complete || !image.naturalWidth)).map(image => image.src), overflow: document.documentElement.scrollWidth > innerWidth}));
      assert.equal(state.failed.length, 0, name);
      assert.equal(state.overflow, false, name);
      results.push({page: name, viewport: 'desktop', ...state});
      if (name === 'index.html') {
        await page.screenshot({path: path.join(root, 'gallery-desktop.png'), fullPage: true});
        await page.locator('#scene').screenshot({path: path.join(root, 'river-review.png')});
        await page.locator('#comparison').screenshot({path: path.join(root, 'pose-comparison.png')});
        await page.locator('[data-full]').first().click();
        assert.equal(await page.locator('dialog').evaluate(dialog => dialog.open), true);
        await page.locator('#enlarged').evaluate(image => image.decode());
        await page.screenshot({path: path.join(root, 'enlargement-preview.png')});
        await page.keyboard.press('Escape');
        assert.equal(await page.locator('dialog').evaluate(dialog => dialog.open), false);
        await page.locator('summary').click();
        const files = await page.locator('img').evaluateAll(images => [...new Set(images.map(image => image.getAttribute('src')))]);
        for (const study of record.studies) assert.ok(files.includes(study.file), study.file);
        await page.locator('details').screenshot({path: path.join(root, 'retained-attempts.png')});
      } else {
        await page.screenshot({path: path.join(root, name.replace('.html', '.png')), fullPage: true});
      }
      await page.setViewportSize({width: 390, height: 844});
      await page.goto(pathToFileURL(path.join(root, name)).href);
      await page.evaluate(() => Promise.all([...document.images].filter(image => image.getAttribute('src')).map(image => image.decode())));
      state = await page.evaluate(() => ({images: document.images.length, failed: [...document.images].filter(image => image.getAttribute('src') && (!image.complete || !image.naturalWidth)).map(image => image.src), overflow: document.documentElement.scrollWidth > innerWidth}));
      assert.equal(state.failed.length, 0, `${name} mobile`);
      assert.equal(state.overflow, false, `${name} mobile`);
      results.push({page: name, viewport: 'mobile', ...state});
      if (name === 'index.html') await page.screenshot({path: path.join(root, 'gallery-mobile.png'), fullPage: true});
      await page.setViewportSize({width: 1360, height: 1000});
    }
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
  }
  const checks = {checkedAt: new Date().toISOString(), generationFilesVerified: record.studies.length, exactPromptsVerified: 9, inputReferenceHashesVerified: true, uniquePromptFiles: new Set(record.studies.map(study => study.prompt_file)).size, localLinksChecked: checkedLinks.length, enlargementOpenedAndClosed: true, allNineOutputsPresent: true, pageErrors: errors, results};
  fs.writeFileSync(path.join(root, 'gallery-checks.json'), JSON.stringify(checks, null, 2) + '\n');
  console.log(JSON.stringify(checks, null, 2));
}

run().catch(error => {console.error(error); process.exitCode = 1;});
