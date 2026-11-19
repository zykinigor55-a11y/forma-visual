import {strict as assert} from 'node:assert';
import {mkdir} from 'node:fs/promises';
import {chromium} from 'playwright';

const output='artifacts/landscape-editor';
await mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:1024,height:840},deviceScaleFactor:1});
 const errors=[];page.on('pageerror',error=>errors.push(String(error)));
 await page.goto('http://127.0.0.1:3000/forma-pine-glb-preview.html',{waitUntil:'domcontentloaded',timeout:45000});
 await page.waitForFunction(()=>window.__pineReady===true||window.__pineError,{timeout:90000});
 const state=await page.evaluate(()=>({error:window.__pineError||null,details:window.__pineDetails}));
 assert.equal(state.error,null,'GLB must load and render');
 assert.ok(state.details.meshes>=2,'mature conifer branches and needles are real meshes');
 assert.ok(state.details.leafMaterials>=1,'transparent alpha foliage must render');
 assert.ok(state.details.barkMaterials>=1,'bark material separate from foliage');
 assert.ok(Math.abs(state.details.height-14)<.03,'preserved user tree height');
 assert.ok(Math.abs(state.details.diameter-7)<.03,'preserved user crown diameter');
 for(const [name,yaw,elevation] of [
  ['front',0,.17],['three-quarter',.85,.12],['rear',Math.PI,.13]
 ]){
  await page.evaluate(([yaw,elev])=>window.__pineView(yaw,elev),[yaw,elevation]);
  await page.screenshot({path:`${output}/mature-pine-${name}.png`});
 }
 // Capture the fuller crown built only from the same original PBR needle
 // meshes; keep the baseline model QA and measured 14x7m checks intact.
 await page.goto('http://127.0.0.1:3000/forma-pine-glb-preview.html?dense=1',{waitUntil:'domcontentloaded',timeout:45000});
 await page.waitForFunction(()=>window.__pineReady===true||window.__pineError,{timeout:90000});
 const dense=await page.evaluate(()=>({error:window.__pineError||null,details:window.__pineDetails||null}));
 assert.equal(dense.error,null,'denser GLB foliage must render without errors');
 assert.ok(dense.details.leafMaterials>=2,'dense crown must contain extra PBR needle meshes');
 await page.evaluate(()=>window.__pineView(.65,.12,27));
 await page.screenshot({path:`${output}/mature-pine-dense.png`});
 // A/B the second publisher-verified CC0 asset before changing production.
 await page.goto('http://127.0.0.1:3000/forma-pine-glb-preview.html?alt=1',{waitUntil:'domcontentloaded',timeout:45000});
 await page.waitForFunction(()=>window.__pineReady===true||window.__pineError,{timeout:90000});
 const alt=await page.evaluate(()=>({error:window.__pineError||null,details:window.__pineDetails||null}));
 assert.equal(alt.error,null,'alternative CC0 GLB should load successfully');
 assert.equal(alt.details.source,'innerscene');
 assert.ok(alt.details.meshes>=3,'alternative must contain several textured meshes');
 await page.evaluate(()=>window.__pineView(.65,.12,27));
 await page.screenshot({path:`${output}/mature-pine-innerscene.png`});
 // Real procedural branch and photo-needle supplements must load and render.
 await page.goto('http://127.0.0.1:3000/forma-pine-glb-preview.html?growth=1',{waitUntil:'domcontentloaded',timeout:45000});
 await page.waitForFunction(()=>window.__pineReady===true||window.__pineError,{timeout:90000});
 const growth=await page.evaluate(()=>({error:window.__pineError||null,details:window.__pineDetails||null}));
 assert.equal(growth.error,null,'editable Scots pine additional 3D growth must render');
 assert.ok(growth.details.meshes>=4,'PBR model gains instanced bark and needle meshes');
 await page.evaluate(()=>window.__pineView(.65,.12,27));
 await page.screenshot({path:`${output}/mature-pine-editable-growth.png`});
 await page.setViewportSize({width:430,height:760});
 await page.evaluate(()=>window.__pineView(.45,.12,27));
 await page.screenshot({path:`${output}/mature-pine-mobile.png`});
 assert.deepEqual(errors,[],'No WebGL errors');
 console.log('FORMA MATURE PINE GLB QA PASS',JSON.stringify(state.details));
}finally{await browser.close()}
