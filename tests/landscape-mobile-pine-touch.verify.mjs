import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader']});
const context=await browser.newContext({viewport:{width:430,height:900},deviceScaleFactor:1,isMobile:true,hasTouch:true});
const page=await context.newPage(),key='forma-landscape-masterplan-v1-landscape';
const errors=[];
page.on('pageerror',e=>errors.push(String(e)));
try{
 await page.addInitScript(key=>{
  if(localStorage.getItem(key))return;
  localStorage.setItem(key,JSON.stringify({
   title:'Pine touch age QA',site:{width:30,height:40},house:{x:15,y:15,width:10,height:7},
   objects:[
    {id:'mobile-pine-a',catalogId:'pine',type:'trees',x:15,y:27,height:14,diameter:7,variant:1,rotation:0},
    {id:'mobile-pine-b',catalogId:'pine',type:'trees',x:4,y:31,height:9,diameter:4.5,variant:1,rotation:0}
   ],atmosphere:{time:'day',season:'summer',weather:'sunny'}
  }));
 },key);
 await page.goto('http://127.0.0.1:3000/forma-landscape-3d.html',{waitUntil:'domcontentloaded',timeout:60000});
 await page.waitForFunction(()=>window.FORMA_3D_READY===true,null,{timeout:90000});
 await page.locator('#mobilePineSelect').tap();
 assert.equal(await page.locator('body').getAttribute('data-mobile-panel'),'details');
 for(const name of ['pineAge','pineHeight','pineType'])assert.equal(await page.locator('#'+name).count(),1);
 assert.equal(await page.locator('#pineHeight').inputValue(),'14');
 assert.equal(await page.locator('#pineAge').inputValue(),'40');
 assert.equal(await page.locator('#pineType').inputValue(),'solitary');
 assert.equal(await page.locator('#pineGrow-needleDensity').count(),0);
 // Change actual tree, not a second overlaid pine.
 await page.locator('#pineAge').evaluate(el=>{el.value='75';el.dispatchEvent(new Event('change',{bubbles:true}))});
 await page.locator('#pineHeight').evaluate(el=>{el.value='19';el.dispatchEvent(new Event('change',{bubbles:true}))});
 await page.locator('#pineType').evaluate(el=>{el.value='garden';el.dispatchEvent(new Event('change',{bubbles:true}))});
 await page.waitForFunction(key=>{
  const p=JSON.parse(localStorage.getItem(key)||'{}').objects?.find(o=>o.id==='mobile-pine-a');
  return p?.pine?.age===75&&p?.pine?.pineType==='garden'&&p?.height===19;
 },key,{timeout:20000});
 const raw=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);
 assert.equal(raw.objects.length,2,'editing cannot plant an extra tree');
 assert.equal(raw.objects[0].x,15);
 assert.equal(raw.objects[0].y,27);
 assert.equal(raw.objects[1].height,9,'other tree is unaffected');
 await page.locator('#mobilePineSelect').tap();
 assert.equal(await page.locator('#pineHeight').inputValue(),'9');
 await page.locator('#mobilePineSelect').tap();
 assert.equal(await page.locator('#pineHeight').inputValue(),'19');
 assert.equal(await page.locator('#pineAge').inputValue(),'75');
 assert.equal(await page.locator('#pineType').inputValue(),'garden');
 assert.deepEqual(errors,[]);
 console.log('ANDROID PINE AGE HEIGHT TYPE UI PASSED');
}finally{await browser.close()}
