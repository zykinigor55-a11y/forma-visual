import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';
const dir='artifacts/landscape-editor/ash-online-cc0';
await mkdir(dir,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:1100,height:850},deviceScaleFactor:1});
 const errors=[];page.on('pageerror',err=>errors.push(String(err)));
 await page.goto('http://127.0.0.1:3000/forma-ash-online-preview.html',
  {waitUntil:'domcontentloaded',timeout:60000});
 await page.waitForFunction(()=>window.__ashReady===true||Boolean(window.__ashError),
  null,{timeout:85000});
 const d=await page.evaluate(()=>({data:window.__ashDetails||null,error:window.__ashError||null}));
 if(d.error)throw Error('Candidate GLB failed to load: '+d.error);
 assert.ok(d.data.meshCount>0);
 assert.ok(Math.abs(d.data.height-16)<.08,'authored planted tree height 16m');
 assert.ok(Math.abs(d.data.diameter-8)<.08,'authored planted crown diameter 8m');
 for(const [name,angle,close] of [['ash-candidate-front',0,false],['ash-candidate-diagonal',.65,false],['ash-candidate-bark-close',.22,true]]){
  await page.evaluate(({angle,close})=>window.__ashView(angle,close),{angle,close});
  await page.screenshot({path:dir+'/'+name+'.png'});
 }
 await page.setViewportSize({width:430,height:900});
 await page.evaluate(()=>window.__ashView(.6,false));
 await page.screenshot({path:dir+'/ash-candidate-mobile.png'});
 await writeFile(dir+'/candidate-stats.json',JSON.stringify({...d.data,browserErrors:errors},null,2));
 assert.deepEqual(errors,[]);
 console.log('CC0 ASH CANDIDATE WEBGL',JSON.stringify(d.data));
}finally{await browser.close()}
