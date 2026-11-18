import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {chromium} from 'playwright';

// Minimal self-contained GLB fixture: one measurable 3D mesh, no remote assets.
function tinyHouseGlb(){
 const positions=Buffer.alloc(36),coords=[-1,0,0,1,0,0,0,2,0];
 coords.forEach((x,i)=>positions.writeFloatLE(x,i*4));
 const asset={asset:{version:'2.0'},scene:0,scenes:[{nodes:[0]}],nodes:[{mesh:0}],meshes:[{primitives:[{attributes:{POSITION:0}}]}],
  buffers:[{byteLength:positions.length}],bufferViews:[{buffer:0,byteOffset:0,byteLength:positions.length,target:34962}],
  accessors:[{bufferView:0,componentType:5126,count:3,type:'VEC3',min:[-1,0,0],max:[1,2,0]}]};
 const text=Buffer.from(JSON.stringify(asset));const jsonLen=Math.ceil(text.length/4)*4,binLen=Math.ceil(positions.length/4)*4;
 const out=Buffer.alloc(12+8+jsonLen+8+binLen);out.writeUInt32LE(0x46546C67,0);out.writeUInt32LE(2,4);out.writeUInt32LE(out.length,8);
 out.writeUInt32LE(jsonLen,12);out.writeUInt32LE(0x4E4F534A,16);out.fill(0x20,20,20+jsonLen);text.copy(out,20);
 const offset=20+jsonLen;out.writeUInt32LE(binLen,offset);out.writeUInt32LE(0x004E4942,offset+4);positions.copy(out,offset+8);
 return out;
}

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
 // Every landscape category is reachable without scrolling past the tool grid.
 await page.locator('[data-quick-tool="plant"]').click();
 assert.equal(await page.locator('[data-item]').count(),18,'All ten trees and eight shrubs in the searchable plant library');
 assert.equal(await page.locator('[data-item="pine"]').isVisible(),true);
 await page.locator('#catalogSearch').fill('берёза');
 assert.equal(await page.locator('[data-item="birch"]').isVisible(),true);
 assert.equal(await page.locator('[data-item="pine"]').isVisible(),false);
 await page.locator('#catalogSearch').fill('');
 await page.locator('[data-catalog-filter="shrubs"]').click();
 assert.equal(await page.locator('[data-item="juniper"]').isVisible(),true);
 assert.equal(await page.locator('[data-item="birch"]').isVisible(),false);
 await page.locator('[data-quick-tool="terrain"]').click();
 assert.equal(await page.locator('#brushSoftness').isVisible(),true);
 assert.equal(await page.locator('#brushShape').isVisible(),true);
 await page.locator('[data-quick-tool="select"]').click();
 // These are genuine WebGL-rendered house thumbnails, not flat pictograms.
 assert.equal(await page.locator('[data-house-preset]').count(),12);
 await page.waitForFunction(()=>document.querySelectorAll('#houseStyles img').length===12,null,{timeout:30000});
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
 await page.locator('#focusHouse').click();
 await page.screenshot({path:'artifacts/landscape-editor/3d-house-close-up.png'});
 await page.locator('#fit3dScene').click();

 await page.locator('#weather').selectOption('fog');
 assert.equal(await page.locator('#weather').inputValue(),'fog');
 await page.locator('[data-tool="surface"]').click();
 assert.equal(await page.locator('#draftActions').isVisible(),false,'Brush mode hides polygon completion');
 assert.equal(await page.locator('[data-paint-mode="brush"]').getAttribute('aria-pressed'),'true');
 await page.locator('[data-paint-mode="polygon"]').click();
 assert.equal(await page.locator('#draftActions').isVisible(),true,'Polygon mode exposes finish controls');
 await page.locator('[data-paint-mode="brush"]').click();
 assert.equal(await page.locator('#draftActions').isVisible(),false);
 // Brush / camera separation: left drag paints a continuous metric lawn,
 // right drag rotates the WebGL camera without modifying the editable plan.
 await page.locator('[data-tool="surface"]').click();
 await page.locator('[data-item="universal"]').click();
 assert.equal(await page.locator('#useLandscapeBrush').isChecked(),true);
 const brushBox=await page.locator('#viewport').boundingBox();
 const bx=brushBox.x+brushBox.width*.57,by=brushBox.y+brushBox.height*.72;
 await page.mouse.move(bx,by);await page.mouse.down({button:'left'});
 for(let i=1;i<=9;i++)await page.mouse.move(bx+i*9,by-i*2,{steps:2});
 await page.mouse.up({button:'left'});
 const brushData=await page.evaluate(()=>{
  const d=JSON.parse(localStorage.getItem('forma-landscape-masterplan-v1-landscape')||'{}');
  return d.objects?.find(x=>x.catalogId==='universal'&&x.geometry==='strip');
 });
 assert.ok(brushData?.points?.length>=3,'Lawn brush saved continuous metric ribbon '+JSON.stringify(brushData));
 const previous=await page.evaluate(()=>localStorage.getItem('forma-landscape-masterplan-v1-landscape'));
 const orbitBefore=await page.locator('#viewport').evaluate(c=>c.toDataURL('image/png'));
 await page.mouse.move(bx,by);await page.mouse.down({button:'right'});
 await page.mouse.move(bx+80,by-35,{steps:8});await page.mouse.up({button:'right'});
 await page.waitForTimeout(160);
 const orbitAfter=await page.locator('#viewport').evaluate(c=>c.toDataURL('image/png'));
 assert.notEqual(orbitAfter,orbitBefore,'Right mouse drag must actually rotate the 3D scene');
 assert.equal(await page.evaluate(()=>localStorage.getItem('forma-landscape-masterplan-v1-landscape')),previous,'Right-drag camera orbit never edits lawn');
 await page.screenshot({path:'artifacts/landscape-editor/3d-lawn-brush.png'});
 // Relief brush: reset to measured nadir after camera rotation, so test clicks
 // are guaranteed to hit the parcel rather than the background beyond it.
 await page.locator('[data-view="2d"]').click();
 await page.waitForTimeout(180);
 await page.locator('[data-tool="terrain"]').click();
 await page.locator('[data-item="raise"]').click();
 const terrainBox=await page.locator('#viewport').boundingBox();
 const tx=terrainBox.x+terrainBox.width*.51,ty=terrainBox.y+terrainBox.height*.51;
 await page.mouse.move(tx,ty);await page.mouse.down({button:'left'});
 for(let i=1;i<=5;i++)await page.mouse.move(tx+i*6,ty-i*2,{steps:2});
 await page.mouse.up({button:'left'});
 const relief=await page.evaluate(()=>JSON.parse(localStorage.getItem('forma-landscape-3d-terrain-v1-landscape')||'[]'));
 assert.ok(relief.some(v=>v>.01),'continuous relief brush persists measurable positive elevations');
 // In terrain mode, RMB must orbit without adding/subtracting any relief samples.
 await page.locator('[data-view="3d"]').click();
 await page.waitForTimeout(180);
 const terrainBeforeRight=await page.evaluate(()=>localStorage.getItem('forma-landscape-3d-terrain-v1-landscape'));
 const beforeTurn=await page.locator('#viewport').evaluate(c=>c.toDataURL('image/png'));
 const b=await page.locator('#viewport').boundingBox();
 await page.mouse.move(b.x+b.width*.58,b.y+b.height*.58);
 await page.mouse.down({button:'right'});
 await page.mouse.move(b.x+b.width*.68,b.y+b.height*.52,{steps:10});
 await page.mouse.up({button:'right'});await page.waitForTimeout(220);
 const afterTurn=await page.locator('#viewport').evaluate(c=>c.toDataURL('image/png'));
 assert.notEqual(afterTurn,beforeTurn,'Camera must rotate with RMB while relief tool remains selected');
 assert.equal(await page.evaluate(()=>localStorage.getItem('forma-landscape-3d-terrain-v1-landscape')),terrainBeforeRight,
  'Right-drag must not sculpt or destroy the painted terrain');


 await page.locator('[data-view="2d"]').click(); // deterministic metric nadir after orbit test
 await page.waitForTimeout(150);
 await page.locator('[data-tool="surface"]').click();
 await page.locator('[data-item="concrete-pavers"]').click();
 const canvas=page.locator('#viewport'),box=await canvas.boundingBox();
 for(const [x,y] of [[.48,.47],[.52,.51],[.50,.57]]){
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
 assert.equal(await mobile.locator('#mobileWorkspaceTabs').isVisible(),true);
 assert.equal(await mobile.locator('#left').isVisible(),true);
 assert.equal(await mobile.locator('#right').isVisible(),false);
 await mobile.locator('[data-mobile-panel="details"]').click();
 assert.equal(await mobile.locator('#right').isVisible(),true);
 assert.equal(await mobile.locator('#left').isVisible(),false);
 await mobile.screenshot({path:'artifacts/landscape-editor/3d-mobile.png'});
 // Verify GLB import / restoration only after the visual screenshots.
 await page.locator('#selectMainHouse').click();
 await page.locator('#customHouseGlb').setInputFiles({name:'test-house.glb',mimeType:'model/gltf-binary',buffer:tinyHouseGlb()});
 await page.waitForFunction(()=>JSON.parse(localStorage.getItem('forma-landscape-masterplan-v1-landscape')||'{}')?.house?.modelKey==='main',null,{timeout:30000});
 const imported=await page.evaluate(()=>JSON.parse(localStorage.getItem('forma-landscape-masterplan-v1-landscape')).house);
 assert.equal(imported.width,12);assert.equal(imported.height,8);
 await page.reload({waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>document.querySelector('#houseEditing')?.textContent.includes('GLB'),null,{timeout:30000});
 await page.locator('#clearCustomHouse').click();
 const cleared=await page.evaluate(()=>JSON.parse(localStorage.getItem('forma-landscape-masterplan-v1-landscape')).house);
 assert.equal(cleared.modelKey,null);
 // Photoreal 3D flora override uses the same real GLB loader, but
 // must not mutate plant coordinates or the measured project footprint.
 await page.locator('[data-tool="plant"]').click();
 await page.locator('[data-item="pine"]').click();
 assert.match(await page.locator('#floraModelStatus').textContent(),/CC0 PBR GLB|встроенная/);
 await page.locator('#vegetationGlb').setInputFiles({name:'test-pine.glb',mimeType:'model/gltf-binary',buffer:tinyHouseGlb()});
 await page.waitForFunction(()=>document.querySelector('#floraModelStatus')?.textContent.includes('GLB активна'),null,{timeout:30000});
 const projectBeforeFloraReload=await page.evaluate(()=>localStorage.getItem('forma-landscape-masterplan-v1-landscape'));
 const floraIndex=await page.evaluate(()=>JSON.parse(localStorage.getItem('forma-landscape-3d-flora-v1-landscape')||'[]'));
 assert.ok(floraIndex.includes('pine'),'Species override persisted in local metadata');
 await page.reload({waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>document.querySelector('#status')?.textContent.includes('3D-конструктор готов'),null,{timeout:45000});
 await page.locator('[data-tool="plant"]').click();
 await page.locator('[data-item="pine"]').click();
 await page.waitForFunction(()=>document.querySelector('#floraModelStatus')?.textContent.includes('GLB активна'),null,{timeout:30000});
 assert.equal(await page.evaluate(()=>localStorage.getItem('forma-landscape-masterplan-v1-landscape')),projectBeforeFloraReload,
  'Importing photographic flora may not edit the existing measured project');
 await page.locator('#removePlantGlb').click();
 assert.match(await page.locator('#floraModelStatus').textContent(),/CC0 PBR GLB|встроенная/);

 assert.deepEqual(errors,[],'3D editor has no JavaScript crashes');
 console.log('3D desktop/mobile smoke passed: WebGL, atmosphere, contour, 2D/3D/Walk, shared model.');
}finally{await browser.close()}
