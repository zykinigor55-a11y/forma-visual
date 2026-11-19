import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try{
 const page=await browser.newPage({viewport:{width:1100,height:760},deviceScaleFactor:1});
 const pageErrors=[];
 page.on('pageerror',error=>pageErrors.push(String(error)));
 await page.goto('http://127.0.0.1:3000/forma-landscape-3d.html',{waitUntil:'domcontentloaded',timeout:30000});
 await page.waitForFunction(()=>window.FORMA_3D_READY===true,null,{timeout:90000});
 await page.evaluate(async()=>{
  const T=await import('three');
  const {createPhotoFoliageTexture}=await import('./forma-landscape-3d-photo-foliage.js');
  const ids=['pine','spruce','birch','oak','spirea','hydrangea'];
  window.__photoFoliageAssets=ids.map(id=>({id,texture:createPhotoFoliageTexture(T,id)}));
 });
 await page.waitForFunction(()=>window.__photoFoliageAssets?.every(x=>x.texture.userData.photoState!=='loading'),null,{timeout:60000});
 const records=await page.evaluate(()=>window.__photoFoliageAssets.map(({id,texture})=>({
  id,state:texture.userData.photoState,
  width:texture.image.width,height:texture.image.height,
  photoCard:texture.userData.photographicFoliage
 })));
 assert.deepEqual(pageErrors,[],'no browser errors during photo-cutout creation');
 assert.ok(records.every(x=>x.width===512&&x.height===512&&x.photoCard),'GPU-sized photo atlases');
 assert.ok(records.filter(x=>x.state==='ready').length>=4,
  'At least four local botanical photos must be actual transparent cutouts: '+JSON.stringify(records));
 console.log('PASS local photo foliage masks:',JSON.stringify(records));
}finally{await browser.close()}
