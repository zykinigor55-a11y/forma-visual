import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {chromium} from 'playwright';

const browser=await chromium.launch({headless:true});
const errors=[];
const base='http://127.0.0.1:3000';
try{
 const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
 page.on('pageerror',error=>errors.push(String(error)));
 await page.goto(base+'/forma-landscape-3d.html',{waitUntil:'domcontentloaded',timeout:30000});
 await page.waitForFunction(()=>document.querySelector('#status')?.textContent.includes('3D-конструктор готов'),null,{timeout:45000});
 assert.equal(await page.locator('#loadError').isVisible(),false);
 assert.ok(await page.locator('#viewport').evaluate(el=>el.width>300&&el.height>200),'WebGL canvas initialized');
 assert.equal(await page.locator('#weather').inputValue(),'sunny');
 await page.locator('#weather').selectOption('fog');
 assert.equal(await page.locator('#weather').inputValue(),'fog');
 await page.locator('[data-tool="surface"]').click();
 assert.equal(await page.locator('#draftActions').isVisible(),true);
 await page.locator('[data-item="concrete-pavers"]').click();
 const canvas=page.locator('#viewport'),box=await canvas.boundingBox();
 for(const [x,y] of [[.41,.62],[.47,.65],[.52,.7]]){
  await page.mouse.click(box.x+box.width*x,box.y+box.height*y);
 }
 assert.ok(await page.locator('#status').textContent().then(t=>t.includes('Точек контура:')),'Contour remains open after 3 vertices');
 await page.locator('#finishContour').click();
 const values=await page.evaluate(()=>{
  const key=Object.keys(localStorage).find(k=>k.startsWith('forma-landscape-masterplan-v1-'));if(!key)return null;
  return JSON.parse(localStorage.getItem(key));
 });
 assert.ok(values?.objects?.some(x=>x.catalogId==='concrete-pavers'&&x.points?.length>=3),'Measured polygon persisted to shared 2D/3D project');
 assert.equal(values.atmosphere.weather,'fog');
 await page.locator('[data-view="2d"]').click();
 await page.locator('[data-view="3d"]').click();
 await page.locator('[data-view="walk"]').click();
 assert.ok((await page.locator('#status').textContent()).includes('Walk'));
 await page.locator('[data-view="3d"]').click();
 await mkdir('artifacts/landscape-editor',{recursive:true});
 await page.screenshot({path:'artifacts/landscape-editor/3d-desktop.png'});
 const mobile=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1,hasTouch:true,isMobile:true});
 mobile.on('pageerror',error=>errors.push('mobile '+String(error)));
 await mobile.goto(base+'/forma-landscape-3d.html',{waitUntil:'domcontentloaded',timeout:30000});
 await mobile.waitForFunction(()=>document.querySelector('#status')?.textContent.includes('3D-конструктор готов'),null,{timeout:45000});
 assert.ok(await mobile.locator('#viewport').evaluate(el=>el.width>250),'mobile 3D canvas mounted');
 await mobile.screenshot({path:'artifacts/landscape-editor/3d-mobile.png'});
 assert.deepEqual(errors,[],'3D editor has no JavaScript crashes');
 console.log('3D desktop/mobile smoke passed: WebGL, atmosphere, contour, 2D/3D/Walk, shared model.');
}finally{await browser.close()}
