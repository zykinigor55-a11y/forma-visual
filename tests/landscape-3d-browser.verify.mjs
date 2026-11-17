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
 // These are genuine WebGL-rendered house thumbnails, not flat pictograms.
 assert.equal(await page.locator('[data-house-preset]').count(),8);
 await page.waitForFunction(()=>document.querySelectorAll('#houseStyles img').length===8,null,{timeout:30000});
 await mkdir('artifacts/landscape-editor',{recursive:true});
 await page.locator('#selectMainHouse').click();
 await page.locator('[data-house-preset="brick"]').click();
 const houseAfterBrick=await page.evaluate(()=>JSON.parse(localStorage.getItem('forma-landscape-masterplan-v1-landscape')).house);
 assert.equal(houseAfterBrick.archStyle,'brick');
 assert.equal(houseAfterBrick.roof,'hip');
 assert.equal(houseAfterBrick.width,12);
 assert.equal(houseAfterBrick.height,8);
 await page.screenshot({path:'artifacts/landscape-editor/3d-brick-house.png'});
 await page.locator('[data-house-preset="modern"]').click();
 const modernHouse=await page.evaluate(()=>JSON.parse(localStorage.getItem('forma-landscape-masterplan-v1-landscape')).house);
 assert.equal(modernHouse.roof,'flat');
 assert.equal(modernHouse.archStyle,'modern');
 await page.screenshot({path:'artifacts/landscape-editor/3d-modern-house.png'});
 await page.locator('[data-house-preset="barn"]').click();

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
 await page.locator('#weather').selectOption('sunny');
 // Never accept an empty solid-colour viewport as a working 3D scene.
 const sample=await page.locator('#viewport').evaluate(canvas=>{
  const c=document.createElement('canvas');c.width=48;c.height=32;
  const ctx=c.getContext('2d');ctx.drawImage(canvas,0,0,c.width,c.height);
  const pixels=ctx.getImageData(0,0,c.width,c.height).data,colors=new Set();
  for(let i=0;i<pixels.length;i+=4)colors.add((pixels[i]>>3)+'/'+(pixels[i+1]>>3)+'/'+(pixels[i+2]>>3));
  return colors.size;
 });
 assert.ok(sample>16,'3D viewport must contain visible textured ground and house (colors='+sample+')');
 await page.screenshot({path:'artifacts/landscape-editor/3d-desktop.png'});
 await page.locator('#weather').selectOption('fog');
 const fogSample=await page.locator('#viewport').evaluate(canvas=>{
  const c=document.createElement('canvas');c.width=48;c.height=32;const ctx=c.getContext('2d');
  ctx.drawImage(canvas,0,0,c.width,c.height);const p=ctx.getImageData(0,0,c.width,c.height).data,colors=new Set();
  for(let i=0;i<p.length;i+=4)colors.add((p[i]>>3)+'/'+(p[i+1]>>3)+'/'+(p[i+2]>>3));
  return colors.size;
 });
 assert.ok(fogSample>12,'Fog must not hide the entire plot (colors='+fogSample+')');
 await page.screenshot({path:'artifacts/landscape-editor/3d-fog-visible.png'});
 const mobile=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1,hasTouch:true,isMobile:true});
 mobile.on('pageerror',error=>errors.push('mobile '+String(error)));
 await mobile.goto(base+'/forma-landscape-3d.html',{waitUntil:'domcontentloaded',timeout:30000});
 await mobile.waitForFunction(()=>document.querySelector('#status')?.textContent.includes('3D-конструктор готов'),null,{timeout:45000});
 assert.ok(await mobile.locator('#viewport').evaluate(el=>el.width>250),'mobile 3D canvas mounted');
 await mobile.screenshot({path:'artifacts/landscape-editor/3d-mobile.png'});
 assert.deepEqual(errors,[],'3D editor has no JavaScript crashes');
 console.log('3D desktop/mobile smoke passed: WebGL, atmosphere, contour, 2D/3D/Walk, shared model.');
}finally{await browser.close()}
