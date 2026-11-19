import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {chromium} from 'playwright';
const folder='artifacts/landscape-editor/birch-ab';
await mkdir(folder,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader']});
const errors=[];
try{
 const page=await browser.newPage({viewport:{width:1024,height:820},deviceScaleFactor:1});
 page.on('pageerror',error=>errors.push(String(error)));
 const results={};
 for(const [variant,query] of [['current','&candidate=old'],['tevy','']]){
  await page.goto('http://127.0.0.1:3000/forma-mature-trees-preview.html?species=birch'+query,
    {waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForFunction(()=>window.__treeReady===true||Boolean(window.__treeError),null,{timeout:90000});
  const status=await page.evaluate(()=>({error:window.__treeError||null,details:window.__treeDetails||null}));
  assert.equal(status.error,null,variant+' silver birch model should load');
  assert.equal(status.details.candidate,variant==='current'?'old':'tevy');
  assert.ok(Math.abs(status.details.height-14)<.08,'retain exact planted tree height 14m');
  assert.ok(Math.abs(status.details.diameter-8)<.08,'retain exact crown diameter 8m');
  assert.ok(status.details.textures>0,'must retain local original PBR leaves');
  results[variant]=status.details;
  for(const [view,yaw] of [['front',0],['diagonal',.70],['back',3.14]]){
   await page.evaluate(a=>window.__treeView(a,.14),yaw);
   await page.screenshot({path:folder+'/'+variant+'-'+view+'.png',timeout:45000});
  }
  await page.setViewportSize({width:430,height:820});
  await page.evaluate(()=>window.__treeView(.75,.16));
  await page.screenshot({path:folder+'/'+variant+'-mobile.png',timeout:45000});
  await page.setViewportSize({width:1024,height:820});
 }
 assert.ok(results.tevy.alphas>=1,'Tevy silver birch has cutout alpha leaves');
 assert.ok(results.tevy.meshes<=10,'low draw-call overhead on phones');
 assert.deepEqual(errors,[]);
 console.log('SILVER BIRCH NEW GLB A/B PASS',JSON.stringify(results));
}finally{await browser.close()}
