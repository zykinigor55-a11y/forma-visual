import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {chromium} from 'playwright';
const dir='artifacts/landscape-editor/oak-pbr-compare';
await mkdir(dir,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:430,height:900},deviceScaleFactor:1,isMobile:true,hasTouch:true});
 const errors=[];page.on('pageerror',err=>errors.push(String(err)));
 const doc={title:'FORMA textured Quercus QA',site:{width:45,height:40},
  house:{x:22,y:22,width:8,height:9},
  objects:[{id:'qa-oak-real',type:'trees',catalogId:'oak',x:15,y:18,height:12,diameter:11,rotation:0}],
  atmosphere:{season:'summer',time:'day',weather:'sunny'}};
 await page.addInitScript(model=>{
  localStorage.setItem('forma-landscape-masterplan-v1-landscape',JSON.stringify(model));
  localStorage.setItem('forma-botanical-code3d-source-v1','glb');
 },doc);
 await page.goto('http://127.0.0.1:3000/forma-landscape-3d.html',{waitUntil:'domcontentloaded',timeout:60000});
 await page.waitForFunction(()=>window.FORMA_3D_READY===true,null,{timeout:85000});
 await page.waitForFunction(()=>document.querySelector('#modelHealth')?.textContent?.includes('1/1 загружено'),
  null,{timeout:90000});
 await page.waitForFunction(()=>window.FORMA_TREE_MODEL_DIAGNOSTICS?.().find(x=>x.species==='oak')?.status==='glb',
  null,{timeout:30000});
 const data=await page.evaluate(()=>window.FORMA_TREE_MODEL_DIAGNOSTICS());
 const oak=data.find(x=>x.species==='oak');
 assert.equal(oak.status,'glb','bundled PBR model stays active on mobile instead of reverting to 625-mesh legacy');
 assert.equal(oak.height,12);assert.equal(oak.diameter,11);
 await page.locator('[data-mobile-panel="scene"]').tap();
 await page.screenshot({path:dir+'/oak-real-editor-mobile.png'});
 assert.deepEqual(errors,[],'Android scene should load textured oak without script errors');
 console.log('OAK GLB EDITOR MOBILE PASS',JSON.stringify({oak,errors}));
}finally{await browser.close()}
