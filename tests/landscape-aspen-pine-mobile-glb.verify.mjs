import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader']});
await mkdir('artifacts/landscape-editor/glb-aspen-pine',{recursive:true});
const errors=[];
try{
 const context=await browser.newContext({viewport:{width:430,height:880},deviceScaleFactor:1,isMobile:true,hasTouch:true});
 const page=await context.newPage();
 page.on('pageerror',e=>errors.push(String(e)));
 const fixture={
  title:'FORMA GLB Scots pine & European aspen QA',
  site:{width:50,height:40},
  house:{x:25,y:20,width:10,height:8},
  objects:[
   {id:'qa-pine',catalogId:'pine',type:'trees',x:13,y:13,height:14,diameter:7,rotation:0,pine:{age:55,pineType:'solitary'}},
   {id:'qa-aspen',catalogId:'aspen',type:'trees',x:37,y:12,height:15.61,diameter:7.61,rotation:0}
  ],
  atmosphere:{season:'summer',time:'day',weather:'sunny'}
 };
 await page.addInitScript(fixture=>{
  localStorage.setItem('forma-landscape-masterplan-v1-landscape',JSON.stringify(fixture));
  // An old CODE setting must migrate to the user's now-requested GLB default.
  localStorage.setItem('forma-botanical-code3d-source-v1','code');
  localStorage.removeItem('forma-prefer-real-glb-trees-v2');
 },fixture);
 await page.goto('http://127.0.0.1:3000/forma-landscape-3d.html',{waitUntil:'domcontentloaded',timeout:45000});
 await page.waitForFunction(()=>window.FORMA_3D_READY===true,null,{timeout:80000});
 await page.waitForFunction(()=>{
  const txt=document.querySelector('#modelHealth')?.textContent||'';
  return txt.includes('2/2 загружено');
 },null,{timeout:90000});
 assert.equal(await page.locator('#treeSource3d').inputValue(),'glb');
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('forma-landscape-masterplan-v1-landscape')));
 assert.equal(saved.objects.length,2,'GLB must replace each procedural tree in place without adding an object');
 assert.deepEqual(saved.objects.map(x=>x.catalogId),['pine','aspen']);
 assert.equal(saved.objects[0].height,14);
 assert.equal(saved.objects[1].height,15.61);
 assert.equal(saved.objects[1].x,37);
 assert.ok((await page.locator('#modelHealth').innerText()).includes('2/2 загружено'));
 await page.locator('[data-mobile-panel="scene"]').tap({timeout:15000});
 await page.screenshot({path:'artifacts/landscape-editor/glb-aspen-pine/android-two-glb-trees.png',timeout:7000}).catch(()=>{});
 await page.locator('[data-mobile-panel="details"]').tap({timeout:15000});
 await page.locator('#mobilePineSelect').tap({timeout:15000});
 assert.equal(await page.locator('#pineAge').inputValue(),'55');
 assert.equal(await page.locator('#pineHeight').inputValue(),'14');
 assert.equal(await page.locator('#pineType').inputValue(),'solitary');
 assert.deepEqual(errors,[], 'no thrown browser/WebGL errors');
 console.log('MOBILE REAL CC0 GLB PINE+ASPEN LOADED IN SCENE',await page.locator('#modelHealth').innerText());
}finally{await browser.close()}
