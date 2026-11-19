import assert from 'node:assert/strict';
import {mkdir,readFile} from 'node:fs/promises';
import {chromium} from 'playwright';

const root='artifacts/landscape-editor/tree-lineup';
await mkdir(root,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:2000,height:1050},deviceScaleFactor:1});
 page.setDefaultTimeout(25000);
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:3000/forma-tree-lineup.html',{waitUntil:'domcontentloaded',timeout:60000});
 await page.waitForFunction(()=>window.__treeLineupReady===true,null,{timeout:180000,polling:1500});
 const status=await page.evaluate(()=>window.__treeLineupStatus);
 const names=['pine','spruce','birch','oak','maple','linden','sakura','apple','rowan','aspen'];
 for(const name of names){
  assert.ok(status[name],name+' missing entirely');
  assert.ok(status[name].loaded,name+' failed to load '+JSON.stringify(status[name]));
  assert.ok(status[name].meshCount>=1,name+' has no 3D geometry');
  assert.ok(status[name].materialCount>=1,name+' lacks materials');
 }
 assert.equal(await page.locator('#legend button').count(),10);
 assert.equal(await page.locator('#progress').innerText(),'Готово · 10 исходных GLB в один ряд');
 for(const species of ['pine','spruce','birch','oak','maple','linden','sakura','apple','rowan','aspen'])
  assert.equal(status[species].source,'GLB','Native self-hosted CC0 GLB for '+species);
 await page.screenshot({path:root+'/ten-actual-3d-trees-row.png',timeout:45000});
 await page.getByRole('button',{name:'Первые 5 крупно'}).click();
 await page.waitForTimeout(500);
 await page.screenshot({path:root+'/trees-1-to-5-close.png',timeout:45000});
 await page.getByRole('button',{name:'Следующие 5'}).click();
 await page.waitForTimeout(500);
 await page.screenshot({path:root+'/trees-6-to-10-close.png',timeout:45000});
 await page.setViewportSize({width:430,height:850});
 await page.getByRole('button',{name:'Первые 5 крупно'}).click();
 await page.screenshot({path:root+'/mobile-tree-row.png',timeout:45000});
 // Side-by-side comparison: the original source GLBs must still load.
 await page.setViewportSize({width:1280,height:900});
 await page.goto('http://127.0.0.1:3000/forma-tree-lineup.html?source=glb',{waitUntil:'domcontentloaded',timeout:60000});
 await page.waitForFunction(()=>window.__treeLineupReady===true,null,{timeout:180000,polling:1500});
 const original=await page.evaluate(()=>window.__treeLineupStatus);
 assert.equal(original.pine.source,'GLB');assert.equal(original.birch.source,'GLB');
 await page.screenshot({path:root+'/original-glb-comparison.png',timeout:45000});
  // Export each authored tree to an actual GLB asset. Header and file length
 // are checked, proving the CODE model is portable native 3D geometry.
 await page.goto('http://127.0.0.1:3000/forma-tree-lineup.html?source=code',{waitUntil:'domcontentloaded',timeout:60000});
 await page.waitForFunction(()=>window.__treeLineupReady===true,null,{timeout:180000,polling:1500});
 for(const [species,id] of [['pine','saveCodePine'],['birch','saveCodeBirch']]){
  assert.equal(await page.locator('#'+id).isEnabled(),true,'Export control available: '+species);
  const pending=page.waitForEvent('download',{timeout:90000});
  await page.locator('#'+id).click();
  const download=await pending;
  assert.equal(download.suggestedFilename(),'FORMA_CODE3D_'+species+'.glb');
  const file=root+'/FORMA_CODE3D_'+species+'.glb';
  await download.saveAs(file);
  const bytes=await readFile(file);
  assert.ok(bytes.length>5000,'GLB must contain nonempty geometry and materials');
  assert.equal(bytes.toString('ascii',0,4),'glTF','Native glTF 2.0 GLB header');
  assert.equal(bytes.readUInt32LE(4),2);
  assert.equal(bytes.readUInt32LE(8),bytes.length,'GLB must be length-consistent');
 }
  assert.deepEqual(errors,[],'No uncaught JavaScript errors in tree lineup');
 console.log('FORMA GLB TREE LINEUP PASS '+JSON.stringify(status));
}finally{await browser.close()}
