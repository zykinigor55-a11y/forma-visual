import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';
const dir='artifacts/landscape-editor/linden-free-alternate';
await mkdir(dir,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:1110,height:810},deviceScaleFactor:1});
 const errors=[];page.on('pageerror',error=>errors.push(String(error)));
 const captured={};
 for(const candidate of ['detailed','light-cc0']){
  await page.goto('http://127.0.0.1:3000/forma-mature-trees-preview.html?species=linden&candidate='+candidate,
   {waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>window.__treeReady===true||Boolean(window.__treeError),
   null,{timeout:90000});
  const r=await page.evaluate(()=>({data:window.__treeDetails,error:window.__treeError||null}));
  assert.equal(r.error,null,'linden '+candidate+' should load as real native GLB');
  assert.equal(r.data.name,'linden');
  assert.ok(Math.abs(r.data.height-8.8)<.08);
  assert.ok(Math.abs(r.data.diameter-7.1)<.08);
  captured[candidate]=r.data;
  await page.evaluate(()=>window.__treeView(.67,.18));
  await page.screenshot({path:dir+'/linden-'+candidate+'-crown.png'});
  await page.evaluate(()=>window.__oakBarkView(.7));
  await page.screenshot({path:dir+'/linden-'+candidate+'-bark.png'});
 }
 await page.setViewportSize({width:430,height:900});
 await page.evaluate(()=>window.__treeView(.67,.18));
 await page.screenshot({path:dir+'/linden-light-mobile.png'});
 assert.deepEqual(errors,[]);
 await writeFile(dir+'/model-comparison.json',JSON.stringify(captured,null,2));
 console.log('LINDEN TWO LICENSED GLB A/B PASS',JSON.stringify(captured));
}finally{await browser.close()}
