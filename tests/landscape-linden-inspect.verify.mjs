import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const dir='artifacts/landscape-editor/linden-pbr';
await mkdir(dir,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:1140,height:840},deviceScaleFactor:1});
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto('http://127.0.0.1:3000/forma-mature-trees-preview.html?species=linden',{waitUntil:'domcontentloaded',timeout:60000});
 await page.waitForFunction(()=>window.__treeReady===true||Boolean(window.__treeError),null,{timeout:90000});
 const info=await page.evaluate(()=>({data:window.__treeDetails,error:window.__treeError||null}));
 assert.equal(info.error,null);
 assert.equal(info.data.name,'linden');
 assert.ok(info.data.meshes>100,'existing detailed CC0 linden should show mesh geometry');
 await page.evaluate(()=>window.__treeView(.65,.17));
 await page.screenshot({path:dir+'/linden-before-diagonal.png'});
 await page.evaluate(()=>window.__oakBarkView(.6));
 await page.screenshot({path:dir+'/linden-before-bark-close.png'});
 await writeFile(dir+'/before-stats.json',JSON.stringify({...info.data,errors},null,2));
 assert.deepEqual(errors,[]);
 console.log('LINDEN INSPECTION',JSON.stringify(info));
}finally{await browser.close()}
