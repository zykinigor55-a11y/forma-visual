import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {readFile,mkdir,copyFile} from 'node:fs/promises';
import {brushPolygon} from '../forma-landscape-brush.js';
import {masterplanPrompt} from '../forma-landscape-project-prompts.js';
assert.ok(brushPolygon([{x:8,y:8},{x:10,y:11}],2,{width:30,height:40}).length>=4);
assert.equal(brushPolygon([{x:6,y:7}],1,{width:30,height:40}).length,20);
const emptyPrompt=masterplanPrompt({site:{width:30,height:40},house:{x:15,y:15,width:12,height:8,roof:'gable',type:'house'},objects:[],buildings:[]});
assert.match(emptyPrompt,/EMPTY-PARCEL LOCK/);
assert.match(emptyPrompt,/Do not add grass, trees, shrubs, garden beds/);
const populatedPrompt=masterplanPrompt({site:{width:30,height:40},house:{x:15,y:15,width:12,height:8,roof:'gable',type:'house'},objects:[{catalogId:'birch',x:5,y:6,diameter:6}],buildings:[]});
assert.match(populatedPrompt,/categories ABSENT from the project/);
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
  await page.screenshot({path:'artifacts/landscape-editor/'+(mobile?'mobile':'desktop')+'-paver-picker.png',fullPage:false});
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
  // Lawn fills the entire measured parcel immediately on category choice:
  // no point-by-point drawing or rough brush scratches.
  await page.locator('[data-quick-category="lawns"]').click();
  model=await doc();assert.equal(model.objects.length,3);
  let lawn=model.objects.find(o=>o.type==='lawns');
  assert.equal(lawn?.autoFill,true);
  assert.equal(lawn.points.length,4);
  const lawnId=lawn.id;
  await page.locator('[data-asset="formal"]').click();
  model=await doc();assert.equal(model.objects.length,3);
  lawn=model.objects.find(o=>o.type==='lawns');
  assert.equal(lawn.catalogId,'formal');
  assert.equal(lawn.id,lawnId);
  assert.ok(model.objects.some(o=>o.id===savedRoad));
  await page.screenshot({path:'artifacts/landscape-editor/'+(mobile?'mobile':'desktop')+'-automatic-grass.png',fullPage:false});
  // Finger eraser cuts a geometric hole from the covering, preserving other objects.
  await page.locator('[data-eraser]').click();
  const erStart=await pos(3,23),erEnd=await pos(6,26);
  await page.mouse.move(erStart.x,erStart.y);await page.mouse.down();
  await page.mouse.move(erEnd.x,erEnd.y,{steps:8});await page.mouse.up();
  model=await doc();assert.equal(model.objects.length,3);
  assert.ok(model.objects.find(o=>o.type==='lawns').holes?.length>=1,'eraser stroke must persist');
  // Pond can be drawn with a continuous stroke, no vertices required.
  await page.locator('[data-quick-category="ponds"]').click();
  await page.locator('[data-area-material="bio-pond"]').click();
  assert.equal(await page.locator('[data-area-tool="brush"]').getAttribute('aria-pressed'),'true');
  const pondStart=await pos(19,23),pondEnd=await pos(24,28);
  await page.mouse.move(pondStart.x,pondStart.y);await page.mouse.down();
  await page.mouse.move(pondEnd.x,pondEnd.y,{steps:12});await page.mouse.up();
  model=await doc();assert.equal(model.objects.length,4);
  assert.ok(model.objects.some(o=>o.catalogId==='bio-pond'));
  assert.ok((await page.locator('#lpSvg').evaluate(node=>node.outerHTML)).includes('lpPondClip-'),'pond photo must be clipped to polygon');
  await page.screenshot({path:'artifacts/landscape-editor/'+(mobile?'mobile':'desktop')+'-dark-photo-pond-on-plan.png',fullPage:false});
  // Polygon lasso remains available as an optional precision tool.
  await page.locator('[data-area-tool="polygon"]').click();
  await page.screenshot({path:'artifacts/landscape-editor/'+(mobile?'mobile':'desktop')+'-pond-picker.png',fullPage:false});
  await tap(3,32);await tap(7,32);await tap(7,36);await tap(3,36);
  await page.locator('#lpFinish').click();
  model=await doc();assert.equal(model.objects.length,5);
  assert.ok(model.objects.filter(o=>o.catalogId==='bio-pond').length===2);
  await page.locator('[data-quick-category="lights"]').click();
  await page.locator('[data-asset="bollard"]').click();await tap(17,15);
  model=await doc();assert.equal(model.objects.length,6);
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
