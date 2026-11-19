import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {chromium} from 'playwright';
const folder='artifacts/landscape-editor/spruce-ab';
await mkdir(folder,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:1024,height:820},deviceScaleFactor:1});
 page.setDefaultTimeout(20000);
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 const captures={};
 for(const [variant,query] of [['original',''],['tevy','&candidate=tevy']]){
  const url='http://127.0.0.1:3000/forma-mature-trees-preview.html?species=spruce'+query;
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForFunction(()=>window.__treeReady===true||Boolean(window.__treeError),null,{timeout:90000});
  const result=await page.evaluate(()=>({error:window.__treeError||null,details:window.__treeDetails||null}));
  assert.equal(result.error,null,variant+' spruce GLB must load');
  assert.equal(result.details.candidate,variant==='tevy'?'tevy':'current');
  assert.ok(Math.abs(result.details.height-16)<.06,'preserves 16m planting height');
  assert.ok(Math.abs(result.details.diameter-9)<.06,'preserves 9m planting diameter');
  assert.ok(result.details.textures>=1,'PBR textures present');
  captures[variant]=result.details;
  for(const [angle,yaw] of [['front',0],['diagonal',.65],['back',Math.PI]]){
   await page.evaluate(yaw=>window.__treeView(yaw,.15),yaw);
   await page.screenshot({path:folder+'/'+variant+'-'+angle+'.png',timeout:45000});
  }
  await page.setViewportSize({width:430,height:760});
  await page.evaluate(()=>window.__treeView(.65,.12));
  await page.screenshot({path:folder+'/'+variant+'-mobile.png',timeout:45000});
  await page.setViewportSize({width:1024,height:820});
 }
 assert.ok(captures.tevy.alphas>=1,'new spruce must have alpha masked PBR needle sprays');
 assert.ok(captures.tevy.meshes<=10,'new spruce batches separate twigs for phone efficiency');
 assert.ok(captures.original.meshes>=80,'baseline old spruce has excessive disconnected branch tiers');
 assert.deepEqual(errors,[]);
 console.log('NORWAY SPRUCE REAL GLB A/B PASS',JSON.stringify(captures));
}finally{await browser.close()}
