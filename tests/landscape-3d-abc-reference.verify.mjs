import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {chromium} from 'playwright';
import {buildABCReferenceScene} from './fixtures/forma-abc-reference-scene.mjs';
const expected=buildABCReferenceScene('day');
const canvasId='#viewport';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const file='artifacts/landscape-editor/abc-reference';
await mkdir('artifacts/landscape-editor',{recursive:true});
try{
 const page=await browser.newPage({viewport:{width:1480,height:920},deviceScaleFactor:1});
 const pageErrors=[];page.on('pageerror',e=>pageErrors.push(String(e)));
 await page.addInitScript(({doc})=>{
  localStorage.setItem('forma-landscape-masterplan-v1-landscape',JSON.stringify(doc));
  localStorage.removeItem('forma-landscape-3d-atmosphere-v1-landscape');
 },{doc:expected});
 await page.goto('http://127.0.0.1:3000/forma-landscape-3d.html',{waitUntil:'domcontentloaded',timeout:30000});
 await page.waitForFunction(()=>document.querySelector('#status')?.textContent.includes('3D-конструктор готов'),null,{timeout:90000});
 assert.equal(await page.locator('#loadError').isVisible(),false,'3D engine starts in the QA fixture');
 assert.equal(await page.locator('[data-house-preset]').count(),18,'No new house styles were added');
 for(const id of ['globalFill','cloudCover','aerialHaze','nightGlow','waterRipples'])
  assert.equal(await page.locator('#'+id).isVisible(),true,id+' atmosphere control');
 await page.locator('#quality3d').selectOption('high');
 const snapshot=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('forma-landscape-masterplan-v1-landscape')||'null'));
 const before=await snapshot();
 assert.equal(before.house.width,12);assert.equal(before.house.height,9);
 assert.equal(before.objects.length,11,'QA uses only 11 existing plant, surface, pond and fixture instances');
 const captures=[];
 for(const mode of ['day','evening','night']){
  await page.locator('#time').selectOption(mode);
  await page.waitForTimeout(280);
  const out=file+'-'+mode+'.png';
  const png=await page.locator(canvasId).screenshot({path:out,timeout:45000});
  assert.ok(png.byteLength>5000,'non-empty '+mode+' screenshot');
  captures.push(png);
  const project=await snapshot();
  assert.deepEqual(project.objects,before.objects,'switching atmosphere cannot rewrite measured site objects');
  assert.equal(project.house.width,12);assert.equal(project.house.height,9);
 }
 assert.notDeepEqual(captures[0],captures[1],'day and evening must differ on GPU');
 assert.notDeepEqual(captures[1],captures[2],'evening and night must differ on GPU');
 for(const [id,value] of [['globalFill',165],['cloudCover',70],
    ['aerialHaze',65],['nightGlow',95],['waterRipples',45]]){
  await page.locator('#'+id).evaluate((node,v)=>{
   node.value=String(v);node.dispatchEvent(new Event('input',{bubbles:true}));
  },value);
 }
 const settings=await page.evaluate(()=>JSON.parse(localStorage.getItem('forma-landscape-3d-atmosphere-v1-landscape')));
 assert.deepEqual(settings,{globalFill:165,clouds:70,haze:65,nightGlow:95,ripples:45});
 await page.locator(canvasId).screenshot({path:file+'-custom-night.png',timeout:45000});
 await page.locator('[data-view="2d"]').click();
 assert.equal(await page.locator('[data-view="2d"]').evaluate(n=>n.classList.contains('active')),true);
 await page.locator('[data-view="3d"]').click();
 assert.equal(await page.locator('[data-view="3d"]').evaluate(n=>n.classList.contains('active')),true);
 assert.deepEqual(pageErrors,[],'No unhandled scene errors');
 console.log('PASS FORMA A/B/C: reference scene day/evening/night; measured geometry stable; adjustable cloud/sky/haze/night/ripples; screenshots saved');
} finally {await browser.close()}
