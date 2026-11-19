import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {chromium} from 'playwright';
const dir='artifacts/landscape-editor/ash-online-cc0';
await mkdir(dir,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:430,height:900},deviceScaleFactor:1,isMobile:true,hasTouch:true});
 const errors=[];page.on('pageerror',err=>errors.push(String(err)));
 const doc={title:'Ash GLB source QA',site:{width:45,height:40},
  house:{x:22,y:22,width:8,height:9},
  objects:[{id:'qa-ash-real',type:'trees',catalogId:'ash',x:15,y:18,height:16,diameter:8,rotation:0}],
  atmosphere:{season:'summer',time:'day',weather:'sunny'}};
 await page.addInitScript(model=>{
  localStorage.setItem('forma-landscape-masterplan-v1-landscape',JSON.stringify(model));
  localStorage.setItem('forma-botanical-code3d-source-v1','glb');
 },doc);
 await page.goto('http://127.0.0.1:3000/forma-landscape-3d.html',{waitUntil:'domcontentloaded',timeout:60000});
 await page.waitForFunction(()=>window.FORMA_3D_READY===true,null,{timeout:85000});
 await page.waitForFunction(()=>document.querySelector('#modelHealth')?.textContent?.includes('1/1 загружено'),
  null,{timeout:90000});
 await page.waitForFunction(()=>window.FORMA_TREE_MODEL_DIAGNOSTICS?.().find(x=>x.species==='ash')?.status==='glb',
  null,{timeout:30000});
 const data=await page.evaluate(()=>window.FORMA_TREE_MODEL_DIAGNOSTICS());
 const ash=data.find(x=>x.species==='ash');
 assert.equal(ash.status,'glb','bundled textured GLB replaces procedural cylinder ash on mobile');
 assert.equal(ash.height,16);assert.equal(ash.diameter,8);
 await page.locator('[data-mobile-panel="scene"]').tap();
 await page.screenshot({path:dir+'/ash-real-editor-mobile.png'});
 assert.deepEqual(errors,[],'mobile editor should load mature ash without JS failures');
 console.log('ASH GLB EDITOR MOBILE PASS',JSON.stringify({ash,errors}));
}finally{await browser.close()}
