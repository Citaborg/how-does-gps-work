// Optional integration check: requires Playwright and its Chromium browser.
// Does not install packages. Start the local server before running this file.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
const require=createRequire(import.meta.url);
const {chromium}=require('playwright');
const base=process.env.GPS_TEST_URL||'http://127.0.0.1:4176';
const out=process.env.GPS_SCREENSHOTS;
if(out)await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true});
const errors=[],external=[];
try {
  const page=await browser.newPage({viewport:{width:1920,height:1080}});
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  page.on('request',request=>{if(new URL(request.url()).origin!==new URL(base).origin)external.push(request.url());});
  await page.goto(base);await page.locator('#play[aria-label="Pause"]').click();
  assert.equal(await page.locator('.chapter-item').count(),18);
  assert.equal(await page.locator('#duration').innerText(),'6:07');
  const go=async value=>{await page.locator('#scrubber').evaluate((el,t)=>{el.value=String(t);el.dispatchEvent(new Event('input',{bubbles:true}));},value);};
  const starts=[0,18,35,53,71,89,101,117,137,159,184,210,232,252,279,301,327,349];
  for(let i=0;i<starts.length;i++){
    const end=starts[i+1]??367;
    await go(starts[i]+(end-starts[i])*.68);
    assert.equal(await page.locator('#scene-number').innerText(),`${String(i+1).padStart(2,'0')} / 18`);
    assert.ok((await page.locator('#scene-copy').innerText()).length>70);
    const layout=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,titleRight:document.getElementById('scene-title').getBoundingClientRect().right}));
    assert.equal(layout.overflow,false,`Horizontal overflow in scene ${i+1}`);
    if(out)await page.screenshot({path:join(out,`scene-${String(i+1).padStart(2,'0')}.png`)});
  }
  const webgl=await page.evaluate(async()=>{const {SphereRenderer}=await import('/spheres.js');const r=new SphereRenderer(document.createElement('canvas'));return {available:r.available,failure:r.failure};});
  assert.equal(webgl.available,true,webgl.failure||'WebGL unavailable');
  // Real player interactions, not only direct timeline jumps.
  await page.locator('#chapters').click();assert.equal(await page.locator('#chapter-dialog').evaluate(e=>e.open),true);
  await page.locator('.chapter-item').nth(7).click();
  assert.equal(await page.locator('#scene-number').innerText(),'08 / 18');
  assert.equal(await page.locator('#chapter-dialog').evaluate(e=>e.open),false);
  await page.locator('#next').click();assert.equal(await page.locator('#scene-number').innerText(),'09 / 18');
  await page.locator('#previous').click();assert.equal(await page.locator('#scene-number').innerText(),'08 / 18');
  await page.locator('#about').click();assert.equal(await page.locator('#about-dialog').evaluate(e=>e.open),true);
  assert.ok(await page.locator('.sources a').count()>=6);await page.keyboard.press('Escape');
  await go(40);await page.locator('#play').click();await page.waitForTimeout(900);await page.locator('#play').click();
  const at=Number(await page.locator('#scrubber').inputValue());assert.ok(at>40.25&&at<42);
  await page.waitForTimeout(300);assert.equal(Number(await page.locator('#scrubber').inputValue()),at,'Pause must freeze time');
  await page.locator('#speed').selectOption('2');await page.locator('#play').click();await page.waitForTimeout(900);await page.locator('#play').click();
  const fast=Number(await page.locator('#scrubber').inputValue());assert.ok(fast-at>1&&fast-at<3,'2× must advance faster');
  // Blur controls so the document-level shortcuts apply.
  await page.locator('#scene-title').click();await page.keyboard.press('ArrowLeft');
  assert.ok(Math.abs(Number(await page.locator('#scrubber').inputValue())-(fast-10))<.11);
  await go(367);assert.equal(await page.locator('#play').getAttribute('aria-label'),'Spill på nytt');
  await page.locator('#play').click();assert.ok(Number(await page.locator('#scrubber').inputValue())<1);await page.locator('#play').click();
  // Seek backwards and verify the same deterministic drawing.
  await go(128);const first=await page.locator('#drawing').evaluate(e=>e.toDataURL());await go(310);await go(128);
  assert.equal(await page.locator('#drawing').evaluate(e=>e.toDataURL()),first);
  // Follow every automatic boundary, retaining playback state.
  await page.locator('#speed').selectOption('2');
  for(let i=1;i<starts.length;i++){
    await go(starts[i]-.1);await page.locator('#play').click();await page.waitForTimeout(180);await page.locator('#play').click();
    assert.equal(await page.locator('#scene-number').innerText(),`${String(i+1).padStart(2,'0')} / 18`);
  }
  const mobile=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});
  await mobile.goto(base);assert.equal(await mobile.locator('#play').getAttribute('aria-label'),'Spill');
  assert.equal(await mobile.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await mobile.locator('#chapters').click();await mobile.locator('.chapter-item').nth(9).click();
  await mobile.locator('#scrubber').evaluate(el=>{el.value='177';el.dispatchEvent(new Event('input',{bubbles:true}));});
  if(out)await mobile.screenshot({path:join(out,'mobile.png'),fullPage:true});
  // Exercise the no-WebGL path, retaining the whole story and its geometry.
  const fallback=await browser.newPage({viewport:{width:1366,height:768},reducedMotion:'reduce'});
  fallback.on('pageerror',e=>errors.push(e.message));
  await fallback.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return type==='webgl'?null:original.call(this,type,...args);};});
  await fallback.goto(base);await fallback.locator('#scrubber').evaluate(el=>{el.value='150';el.dispatchEvent(new Event('input',{bubbles:true}));});
  assert.equal(await fallback.locator('#scene-number').innerText(),'09 / 18');
  assert.equal(await fallback.locator('#spheres').evaluate(e=>getComputedStyle(e).opacity),'0');
  if(out)await fallback.screenshot({path:join(out,'fallback.png')});
  assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
  console.log('PASS: 18 scenes; every automatic boundary; pause/play; 2×; seek/replay; previous/next; chapters; sources; keyboard; deterministic drawing; full-HD; mobile; reduced motion; WebGL + fallback; no console errors or external requests.');
}finally{await browser.close();}
