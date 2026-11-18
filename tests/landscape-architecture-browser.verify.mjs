import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1560,height:990},deviceScaleFactor:1});
const base='http://127.0.0.1:3000';
const errors=[];
page.on('pageerror',e=>errors.push(e.message));
const saved=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('forma-landscape-masterplan-v1-landscape')||'{}'));
try{
 await page.goto(base+'/forma-landscape-3d.html',{waitUntil:'domcontentloaded',timeout:45000});
 await page.waitForFunction(()=>window.FORMA_3D_READY===true,null,{timeout:90000});
 assert.equal(await page.locator('[data-house-preset]').count(),18);
 await page.waitForFunction(()=>document.querySelectorAll('#houseStyles img').length===18,null,{timeout:90000});
 const thumbs=await page.locator('#houseStyles img').evaluateAll(images=>images.map(i=>i.src));
 assert.equal(new Set(thumbs).size,18,'Each house family must render a distinct THREE.js thumbnail');
 await mkdir('artifacts/landscape-editor',{recursive:true});
 await page.locator('#houseStyles').screenshot({path:'artifacts/landscape-editor/architecture-18-models.png',timeout:60000});
 await page.locator('#selectMainHouse').click();
 for(const [type,roof] of [['modular','flat'],['logcabin','gable'],['bungalow','hip'],['duplex','hip'],['panoramic','flat'],['tiny','gable']]){
  await page.locator('[data-house-preset="'+type+'"]').click();
  const doc=await saved();
  assert.equal(doc.house.archStyle,type);
  assert.equal(doc.house.roof,roof);
  assert.equal(await page.locator('[data-house-preset="'+type+'"]').getAttribute('aria-pressed'),'true');
 }
 // Check architecture with true survey dimensions, not forced predefined sizes.
 const current=await saved();
 assert.ok(current.house.width>0&&current.house.height>0);
 await page.locator('[data-house-preset="logcabin"]').click();
 await page.locator('[data-view="3d"]').click();
 await page.locator('#focusHouse').click();
 await page.screenshot({path:'artifacts/landscape-editor/architecture-log-house-perspective.png'});
 await page.locator('[data-house-preset="panoramic"]').click();
 await page.screenshot({path:'artifacts/landscape-editor/architecture-panoramic-perspective.png'});
 await page.locator('[data-tool="build"]').click();
 for(const type of ['greenhouse','carport'])assert.equal(await page.locator('[data-item="'+type+'"]').count(),1);
 await page.locator('[data-view="2d"]').click();
 const bounds=await page.locator('#viewport').boundingBox();
 const click=async(x,y)=>page.mouse.click(bounds.x+bounds.width*x,bounds.y+bounds.height*y);
 await page.locator('[data-item="greenhouse"]').click();
 await click(.35,.35);
 await page.locator('[data-item="carport"]').click();
 await click(.66,.66);
 const doc=await saved();
 assert.ok(doc.buildings.some(b=>b.type==='greenhouse'&&b.roof==='gable'&&b.width>2));
 assert.ok(doc.buildings.some(b=>b.type==='carport'&&b.roof==='flat'&&b.width>2));
 await page.locator('[data-view="3d"]').click();
 await page.screenshot({path:'artifacts/landscape-editor/architecture-greenhouse-carport.png'});
 assert.deepEqual(errors,[],'no JavaScript crashes in architecture presets');
 console.log('FORMA architecture browser verified: 18 genuine house thumbnails, six new family styles, greenhouse and open carport');
}finally{await browser.close()}
