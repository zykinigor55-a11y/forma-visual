import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {chromium} from 'playwright';

const dir='artifacts/landscape-editor/birch-airy-approved';
await mkdir(dir,{recursive:true});
const browser=await chromium.launch({
 headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader']
});
try{
 const page=await browser.newPage({viewport:{width:1100,height:850},deviceScaleFactor:1});
 const errors=[];
 page.on('pageerror',error=>errors.push(String(error)));
 await page.goto('http://127.0.0.1:3000/forma-mature-trees-preview.html?species=birch',
  {waitUntil:'domcontentloaded',timeout:60000});
 await page.waitForFunction(()=>window.__treeReady===true||Boolean(window.__treeError),
  null,{timeout:90000});
 const info=await page.evaluate(()=>({
  details:window.__treeDetails||null,error:window.__treeError||null
 }));
 assert.equal(info.error,null,'original silver birch GLB must load');
 assert.equal(info.details.name,'birch');
 assert.equal(info.details.candidate,'tevy','approved newer birch GLB must remain in use');
 assert.ok(Math.abs(info.details.height-14)<.08,'surveyed height must remain exactly 14 m');
 assert.ok(Math.abs(info.details.diameter-8)<.08,'surveyed crown diameter must remain exactly 8 m');
 assert.ok(info.details.textures>0&&info.details.alphas>0,'retain source PBR KTX2 foliage and cutout texture');
 assert.ok(info.details.meshes<=10,'avoid procedural proxy or extra artificial trees');
 for(const [name,yaw] of [['front',0],['diagonal',.75],['back',3.1416]]){
  await page.evaluate(angle=>window.__treeView(angle,.17),yaw);
  await page.screenshot({path:dir+'/birch-'+name+'.png'});
 }
 await page.setViewportSize({width:430,height:900});
 await page.evaluate(()=>window.__treeView(.75,.12));
 await page.screenshot({path:dir+'/birch-mobile.png'});

 // Keep the untouched GLB as a visual A/B reference for the designer.
 await page.setViewportSize({width:1100,height:850});
 await page.goto('http://127.0.0.1:3000/forma-mature-trees-preview.html?species=birch&candidate=soft',
  {waitUntil:'domcontentloaded',timeout:60000});
 await page.waitForFunction(()=>window.__treeReady===true||Boolean(window.__treeError),
  null,{timeout:90000});
 const baseline=await page.evaluate(()=>window.__treeDetails||null);
 assert.equal(baseline?.candidate,'soft','A/B variant must allow gentle optional native deformation');
 assert.ok(Math.abs(baseline.height-14)<.08);
 await page.evaluate(()=>window.__treeView(.75,.17));
 await page.screenshot({path:dir+'/birch-soft-diagonal.png'});
 assert.deepEqual(errors,[],'WebGL preview should not throw runtime errors');
 console.log('PASS: 14m native Tevy GLB birch · 8m crown · PBR/alpha · mobile · front/back/diagonal');
}finally{await browser.close()}
