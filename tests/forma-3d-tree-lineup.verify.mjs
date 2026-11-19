import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
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
 assert.equal(await page.locator('#progress').innerText(),'Готово · 10 настоящих 3D-деревьев в один ряд');
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
 assert.deepEqual(errors,[],'No uncaught JavaScript errors in tree lineup');
 console.log('FORMA GLB TREE LINEUP PASS '+JSON.stringify(status));
}finally{await browser.close()}
