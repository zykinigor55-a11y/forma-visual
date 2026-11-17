import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {readFile,mkdir,copyFile} from 'node:fs/promises';
import {brushPolygon} from '../forma-landscape-brush.js';
assert.ok(brushPolygon([{x:8,y:8},{x:10,y:11}],2,{width:30,height:40}).length>=4);
assert.equal(brushPolygon([{x:6,y:7}],1,{width:30,height:40}).length,20);
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
await mkdir('artifacts/landscape-editor',{recursive:true});
try{
 for(const mobile of [false,true]){
  const page=await browser.newPage({viewport:mobile?{width:412,height:915}:{width:1500,height:930},hasTouch:mobile,isMobile:mobile,acceptDownloads:true});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:3000');
  await page.waitForFunction(()=>window.FORMA_LANDSCAPE_PROJECT);
  await page.evaluate(()=>window.FORMA_LANDSCAPE_PROJECT.open());
  await page.locator('#lpSvg').waitFor();
  const pos=(x,y)=>page.evaluate(({x,y})=>{const s=document.querySelector('#lpSvg'),p=s.createSVGPoint();p.x=x;p.y=y;const q=p.matrixTransform(s.getScreenCTM());return{x:q.x,y:q.y}},{x,y});
  const tap=async(x,y)=>{const p=await pos(x,y);if(mobile)await page.touchscreen.tap(p.x,p.y);else await page.mouse.click(p.x,p.y)};
  const doc=()=>page.evaluate(()=>window.FORMA_LANDSCAPE_PROJECT.getProject());
  // Path material must be available before the first point.
  await page.locator('[data-tool="path"]').click();
  await page.locator('[data-path-material="granite-setts"]').click();
  await page.locator('[data-path-shape="free"]').click();
  await tap(4,10);await tap(13,11);
  await page.locator('#lpFinish').click();
  let model=await doc();
  assert.equal(model.objects.length,1);
  assert.equal(model.objects[0].catalogId,'granite-setts');
  const savedRoad=model.objects[0].id;
  // Planting must not delete or visually hide the road.
  await page.locator('[data-quick-category="trees"]').click();
  await page.locator('[data-asset="birch"]').click();
  await tap(21,17);
  model=await doc();assert.equal(model.objects.length,2);
  assert.ok(model.objects.some(o=>o.id===savedRoad));
  const road=page.locator('#lpSvg [data-object="'+savedRoad+'"]');
  assert.ok(await road.count()>0,'Saved road vanished from the SVG');
  // Brush creates one real area polygon, without overwriting existing objects.
  await page.locator('[data-quick-category="lawns"]').click();
  await page.locator('[data-area-material="formal"]').click();
  await page.locator('[data-area-tool="brush"]').click();
  assert.equal(await page.locator('[data-area-tool="brush"]').getAttribute('aria-pressed'),'true');
  const start=await pos(9,25),end=await pos(13,30);
  await page.mouse.move(start.x,start.y);await page.mouse.down();await page.mouse.move(end.x,end.y,{steps:10});await page.mouse.up();
  model=await doc();assert.equal(model.objects.length,3);
  assert.ok(model.objects.some(o=>o.catalogId==='formal'&&o.points.length>=3));
  // Polygonal lasso works for pond and survives other tool changes.
  await page.locator('[data-area-tool="polygon"]').click();
  await page.locator('[data-area-material="bio-pond"]').click();
  await tap(18,24);await tap(23,24);await tap(23,29);await tap(18,29);
  await page.locator('#lpFinish').click();
  model=await doc();assert.equal(model.objects.length,4);
  assert.ok(model.objects.some(o=>o.catalogId==='bio-pond'));
  await page.locator('[data-quick-category="lights"]').click();
  await page.locator('[data-asset="bollard"]').click();await tap(17,15);
  model=await doc();assert.equal(model.objects.length,5);
  assert.ok(model.objects.some(o=>o.id===savedRoad));
  const output=page.waitForEvent('download',{timeout:60000});
  await page.locator('[data-pdf]').click();const download=await output;
  const bytes=await readFile(await download.path());
  assert.equal(bytes.subarray(0,8).toString('ascii'),'%PDF-1.4');
  assert.ok(bytes.length>10000,'PDF contains no visible album pages');
  await copyFile(await download.path(),'artifacts/landscape-editor/'+(mobile?'mobile':'desktop')+'-album.pdf');
  await page.screenshot({path:'artifacts/landscape-editor/'+(mobile?'mobile':'desktop')+'-workflow.png',fullPage:true});
  assert.deepEqual(errors,[],'Browser JavaScript errors');
  console.log(mobile?'Mobile workflow PASS':'Desktop workflow PASS',bytes.length);
  await page.close();
 }
}finally{await browser.close()}
