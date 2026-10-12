import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {PNG} from 'pngjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../../../project/visual-identity/2026-10-11/world-objects-overlays');
const palette = JSON.parse(fs.readFileSync(path.resolve(here, '../../../tools/brand-treatment/palette.json'), 'utf8')).palette;
const originals = '/Users/feihuyan/.codex/generated_images/01a126bb-ab38-7011-956c-716c88861642/';
const generated = [
  ['01-quiet-scenery','exec-bde49b9b-f86c-4666-a7c2-cbb2e85c7d6a.png',[],false],
  ['02-architectural-scenery','exec-c38f54c2-f0c0-4bff-8a42-169467561b91.png',['01-quiet-scenery'],false],
  ['02b-architectural-scenery','exec-7192654a-f737-4f2c-84fd-e2217fa7f537.png',['02-architectural-scenery'],false],
  ['03-painted-object','exec-df1bc40d-f883-4f70-aaa2-ac52d5056658.png',[],true],
  ['04-architectural-object','exec-8a6197b6-b6db-4c61-82be-0cd09bf1dfa0.png',['03-painted-object'],true],
  ['07-light-background','exec-c1f59420-462b-4329-be6b-a8d2a4c3c21f.png',[],false],
  ['08-dark-background','exec-b8ea45e6-3ba8-4dd6-a948-416e0a287d63.png',['07-light-background'],false],
];
const groups = [
  {id:'scenery', title:'01 / Scenery', question:'How much should the world describe?', controls:'Same river-crossing motif and camera motion; generated geometry and treatment vary.',
    studies:[
      {stem:'01-quiet-scenery', title:'Quiet painted landscape', asset:'01-quiet-scenery', motion:'A restrained push and pan across one painting.', verdict:'Warm and readable, but pastoral and familiar. The foliage and stonework are busier than intended.', use:'Places, pauses and everyday context.'},
      {stem:'02-architectural-scenery', title:'Architectural theatre', asset:'02b-architectural-scenery', motion:'The same push and pan across simplified planes.', verdict:'A stronger graphic alternative. The revised version removes foliage and descriptive buildings; the spare stage carries the identity.', use:'Abstract systems, distance and institutional scale.'}
    ]},
  {id:'objects', title:'02 / Objects', question:'Can a familiar thing carry an unfamiliar idea?', controls:'One ochre cup, comparable visible size, shared background, entrance and shadow. The two generations have small silhouette differences.',
    studies:[
      {stem:'03-painted-object', title:'Observed object', asset:'03-painted-object', motion:'A transparent cup settles above an authored contact shadow.', verdict:'A useful grounding asset with a coherent rim and handle. The tactile surface is more realistic than our flatter character language.', use:'Care, routines, gifts and material value.'},
      {stem:'04-architectural-object', title:'An impossible interior', asset:'04-architectural-object', motion:'The same entrance and subtle whole-object drift.', verdict:'The most distinctive metaphor here. A cup becomes a small architectural interior; use selectively so the surprise retains meaning.', use:'Inner worlds, hidden structure and conceptual reveals.'}
    ]},
  {id:'overlays', title:'03 / Overlays', question:'What can we add without repainting the scene?', controls:'Exactly the same source PNG and fixed camera in both. Only the authored SVG overlay changes.',
    studies:[
      {stem:'05-analytical-overlay', title:'Drawn analysis', asset:'01-quiet-scenery', motion:'A bridge contour, leader and near-bank label draw in.', verdict:'A strong bridge between painterly scenes and explanation. Keep marks anchored to what the narration is discussing.', use:'Attention, relationships and visual evidence.'},
      {stem:'06-spatial-overlay', title:'Theatrical foreground', asset:'01-quiet-scenery', motion:'Foreground wings open slightly; a pale diagonal wash changes gently.', verdict:'Adds framing and depth, but can feel imposed. This is an occasional theatrical device; the analytical version is more useful day to day.', use:'Thresholds, a framed point of view and chapter atmosphere.'}
    ]},
  {id:'backgrounds', title:'04 / Backgrounds', question:'Can the painting support the evidence?', controls:'Identical chart geometry, typography, values and timing. Background and foreground colors change for contrast. Values are synthetic.',
    studies:[
      {stem:'07-light-background', title:'Light painted field', asset:'07-light-background', motion:'Chart structure, bars and terminal values appear in sequence.', verdict:'The most reusable treatment. The painted edges add warmth while the quiet middle keeps labels readable.', use:'Charts, definitions and diagrams.'},
      {stem:'08-dark-background', title:'Dark painted field', asset:'08-dark-background', motion:'The exact same chart sequence, with pale text and neutral bars.', verdict:'A coherent dark companion. The surface is still fairly textured; a quieter version may be better for dense graphics.', use:'Serious turns, contrast and sparse analytical sequences.'}
    ]}
];
const assets = generated.map(([stem, original, refs, transparent]) => {
  const file = path.join(root, 'assets', `${stem}.png`);
  const bytes = fs.readFileSync(file);
  const source = fs.readFileSync(path.join(originals, original));
  const png = PNG.sync.read(bytes);
  const histogram = Array.from({length:256}, () => 0);
  for (let i=3;i<png.data.length;i+=4) histogram[png.data[i]]++;
  return {id:stem, file:`assets/${stem}.png`, original:path.join(originals,original),
    method:'built-in image_gen', model:'not exposed by tool', seed:'not exposed by tool',
    referencedImages:refs.map(ref => `assets/${ref}.png`), transparentBackground:transparent,
    promptFile:`prompts/${stem}.txt`, prompt:fs.readFileSync(path.join(root,'prompts',`${stem}.txt`),'utf8').trim(),
    width:png.width,height:png.height,sha256:crypto.createHash('sha256').update(bytes).digest('hex'),
    originalCopyVerified:bytes.equals(source),alpha:{fullyTransparent:histogram[0],max:histogram.findLastIndex(n=>n>0),nearOpaque:histogram.slice(245).reduce((a,b)=>a+b,0)}};
});
const studies = groups.flatMap(group => group.studies.map((study,index) => ({...study,group:group.id,
  composition:`WorldStudy${groups.slice(0,groups.indexOf(group)).length*2+index+1}`,
  still:`renders/${study.stem}.png`,video:`renders/${study.stem}.mp4`,durationSec:6,fps:30,width:1920,height:1080,
  motionBriefFile: group.id === 'overlays' ? `prompts/${study.stem}.txt` : null,
  status:'exploratory; not selected for production'})));
fs.writeFileSync(path.join(root,'studies.json'),JSON.stringify({date:'2026-10-11',method:'7 built-in image calls; 8 authored Remotion studies',
  notes:['02b is the selected architecture revision; 02 retained as an earlier attempt.','05 and 06 are code-native SVG overlays over source 01.','Synthetic chart values; no factual claims.','No AI image-to-video generation was used. No scene layer segmentation.','Original PNGs copied without pixel editing.'],assets,studies},null,2)+'\n');

const esc = value => String(value).replace(/[&<>\"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[char]));
const cards = group => group.studies.map(study => `<article class="study" data-study="${study.stem}">
  <div class="media"><video controls muted playsinline preload="metadata" poster="renders/${study.stem}.png" aria-label="${esc(study.title)} motion study"><source src="renders/${study.stem}.mp4" type="video/mp4"></video>
    <button class="still" data-zoom="renders/${study.stem}.png" data-title="${esc(study.title)}" aria-label="Enlarge ${esc(study.title)}"><img src="renders/${study.stem}.png" alt="${esc(study.title)} — settled Remotion frame" loading="lazy"></button></div>
  <h3>${esc(study.title)}</h3><p class="motion">${esc(study.motion)}</p><p>${esc(study.verdict)}</p><p class="use">Good for: ${esc(study.use)}</p>
  <div class="links"><a href="assets/${study.asset}.png" target="_blank">Source painting ↗</a><a href="renders/${study.stem}.mp4" download>Save clip</a><button data-zoom="renders/${study.stem}.png" data-title="${esc(study.title)}">Enlarge still</button></div>
</article>`).join('');
const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Parallax — Worlds, objects & overlays</title>
<style>
:root{--paper:${palette.paper};--ink:${palette.ink};--bone:${palette.bone};--walnut:${palette.walnut};--sand:${palette.sand};--umber:${palette.umber};--gold:${palette.goldText}}
*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--paper);color:var(--ink);font:17px/1.55 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}a{color:var(--walnut);text-underline-offset:4px}button{font:inherit;color:inherit;cursor:pointer}button:focus-visible,a:focus-visible{outline:3px solid var(--gold);outline-offset:4px}
header,main,footer{max-width:1450px;margin:auto;padding:48px 52px}header{padding-bottom:18px}.kicker{font:12px/1.4 Menlo,monospace;letter-spacing:.13em;text-transform:uppercase;color:var(--walnut)}h1{font:clamp(42px,6vw,80px)/1.03 Georgia,serif;font-weight:400;letter-spacing:-.045em;max-width:950px;margin:24px 0}header .intro{max-width:790px;font-size:20px}.summary{max-width:900px;border-left:3px solid var(--gold);padding-left:22px;margin-top:32px}
nav{display:flex;flex-wrap:wrap;gap:16px 25px;margin:28px 0 16px}nav a{text-decoration:none;border-bottom:1px solid var(--sand)}.toolbar{display:flex;align-items:center;flex-wrap:wrap;gap:14px;border-top:1px solid var(--sand);padding-top:22px}.toolbar button,.pair button{padding:8px 14px;background:transparent;border:1px solid var(--walnut);border-radius:0}.toolbar button[aria-pressed=true]{background:var(--ink);color:var(--paper)}.small{font-size:14px;color:var(--walnut)}
section{padding:38px 0 52px;border-top:1px solid var(--sand);scroll-margin-top:20px}.section-title{font:13px Menlo,monospace;text-transform:uppercase;letter-spacing:.08em;color:var(--walnut)}h2{font:34px/1.2 Georgia,serif;font-weight:400;max-width:750px;margin:15px 0}.controls{max-width:850px;color:var(--walnut);font-size:15px}.pair{display:flex;gap:12px;margin:20px 0}.grid{display:grid;grid-template-columns:1fr 1fr;gap:32px}.study{min-width:0}.media{aspect-ratio:16/9;background:var(--bone)}video,.still{width:100%;height:100%;display:block}.still{display:none;border:0;padding:0;background:none}.still img{display:block;width:100%;height:100%;object-fit:contain}body[data-mode=stills] video{display:none}body[data-mode=stills] .still{display:block}h3{font-size:24px;line-height:1.2;font-weight:500;margin:21px 0 10px}.study p{margin:9px 0}.motion{font-size:14px;color:var(--walnut)}.use{font-size:15px}.links{display:flex;flex-wrap:wrap;gap:10px 20px;font-size:14px;margin-top:18px}.links button{border:0;border-bottom:1px solid var(--walnut);padding:0;background:transparent}.links a{text-decoration:none;border-bottom:1px solid var(--walnut)}
.notes{max-width:950px}.notes p{margin:16px 0}details{margin:25px 0}summary{cursor:pointer}details img{display:block;width:min(100%,760px);margin-top:20px}footer{padding-top:0;font-size:14px;color:var(--walnut)}dialog{padding:18px;border:1px solid var(--sand);background:var(--paper);color:var(--ink);max-width:96vw;max-height:96vh}dialog::backdrop{background:rgba(28,24,20,.86)}dialog img{display:block;max-width:90vw;max-height:80vh;object-fit:contain}dialog .top{display:flex;justify-content:space-between;gap:20px;padding-bottom:12px}dialog button{background:transparent;border:1px solid var(--walnut);padding:4px 12px}
@media(max-width:760px){header,main,footer{padding:28px 20px}.grid{grid-template-columns:1fr;gap:38px}h1{font-size:48px}h2{font-size:29px}.intro{font-size:18px!important}section{padding:28px 0 38px}.toolbar{gap:8px}.toolbar button{padding:7px 10px}dialog img{max-width:86vw}}
@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}}
</style></head><body data-mode="stills"><header>
<div class="kicker">Parallax / Visual research / 11 October 2026</div><h1>Worlds, objects<br>& overlays.</h1>
<p class="intro">Eight studies for a broader visual vocabulary: scenery to inhabit, objects to think with, drawn analysis and painted fields for evidence.</p>
<p class="summary"><strong>My current preference:</strong> architectural theatre + occasional impossible objects + restrained analytical drawing. The light painted field is the most immediately useful addition. These are exploration candidates, not a final identity selection.</p>
<nav aria-label="Study families">${groups.map(g=>`<a href="#${g.id}">${esc(g.title)}</a>`).join('')}<a href="../../2026-10-10/all-directions.md">Earlier directions ↗</a></nav>
<div class="toolbar"><button id="motion" aria-pressed="false">Motion studies</button><button id="stills" aria-pressed="true">Compare stills</button><button id="pause">Pause all</button><span class="small">8 studies · 6 seconds each · 1080p · no audio</span></div>
</header><main>
${groups.map(g=>`<section id="${g.id}"><div class="section-title">${esc(g.title)}</div><h2>${esc(g.question)}</h2><p class="controls">${esc(g.controls)}</p><div class="pair"><button data-play="${g.id}">Play both from start</button></div><div class="grid">${cards(g)}</div></section>`).join('')}
<section class="notes"><div class="section-title">What this proves</div><h2>A small, usable visual system.</h2>
<p>The paintings were generated with the built-in image tool. Camera movement, object placement, contact shadows, SVG overlays and chart animation were authored and rendered in Remotion. This batch demonstrates compositing and controlled motion; it does not test AI image-to-video animation or prove that water, cup interiors or scenery can move independently.</p>
<p>The scenery files are flattened paintings. The cups have generated transparency and were checked on both light and dark fields. The cutaway is an intentional fantasy, not a factual diagram. The chart contains synthetic values solely to compare layout and contrast.</p>
<p><a href="../combined-sequence/index.html">Watch the combined 26-second Remotion sequence</a>: ordinary cup → impossible interior → analytical annotations → diagram on matching paper. It is picture only, with optional draft narration cues. Scenery and recorded narration remain further integration tests.</p>
<div class="links"><a href="README.md">Notes & reproducible render command</a><a href="studies.json">Exact prompts & provenance</a><a href="qa/alpha.html">Cutouts on light and dark</a><a href="qa/report.md">QA record</a></div>
<details><summary>Retained first architectural attempt</summary><p>The first edit remained too close to the natural landscape. Study 02 uses the more economical revision above.</p><img src="assets/02-architectural-scenery.png" alt="Earlier architectural river crossing with descriptive trees and rippling water" loading="lazy"><a href="prompts/02-architectural-scenery.txt">First prompt</a> · <a href="prompts/02b-architectural-scenery.txt">Revision prompt</a></details>
</section></main><footer>Saved locally in the Parallax research workspace. All eight studies are included; each has a settled still and a rendered MP4.</footer>
<dialog id="lightbox"><div class="top"><span id="caption"></span><button id="close">Close ×</button></div><img id="large" alt=""></dialog>
<script>
const videos=[...document.querySelectorAll('video')];
const pause=()=>videos.forEach(v=>v.pause());
function mode(value){pause();document.body.dataset.mode=value;document.getElementById('motion').setAttribute('aria-pressed',value==='motion');document.getElementById('stills').setAttribute('aria-pressed',value==='stills')}
document.getElementById('motion').onclick=()=>mode('motion');document.getElementById('stills').onclick=()=>mode('stills');document.getElementById('pause').onclick=pause;
document.querySelectorAll('[data-play]').forEach(b=>b.onclick=async()=>{mode('motion');const pair=[...document.getElementById(b.dataset.play).querySelectorAll('video')];pair.forEach(v=>v.currentTime=0);await Promise.allSettled(pair.map(v=>v.play()))});
const box=document.getElementById('lightbox');document.querySelectorAll('[data-zoom]').forEach(b=>b.onclick=()=>{pause();document.getElementById('large').src=b.dataset.zoom;document.getElementById('large').alt=b.dataset.title;document.getElementById('caption').textContent=b.dataset.title;box.showModal()});
document.getElementById('close').onclick=()=>box.close();box.addEventListener('click',e=>{if(e.target===box)box.close()});
</script></body></html>`;
fs.writeFileSync(path.join(root,'index.html'),html);
console.log(`Saved ${studies.length} gallery studies and ${assets.length} source records; original copies: ${assets.every(a=>a.originalCopyVerified)}`);
